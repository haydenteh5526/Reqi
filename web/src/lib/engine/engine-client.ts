// =============================================================================
// Engine Client — Talks directly to Fairy Stockfish worker via UCI strings
// No custom message protocol — just postMessage("go depth 18") etc.
// =============================================================================

import type {
  EngineEval,
  PositionAnalysis,
  MoveAnalysis,
  MoveClassification,
  GameReviewResult,
} from "./types";

const INITIAL_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";

export class EngineClient {
  private worker: Worker | null = null;
  private ready = false;
  private listeners: Array<(line: string) => void> = [];

  async init(): Promise<void> {
    if (this.worker) return;

    this.worker = new Worker("/engine/stockfish.js");

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Engine timed out")), 3000);

      this.worker!.onmessage = (e: MessageEvent) => {
        const line = typeof e.data === "string" ? e.data : "";

        if (line === "uciok") {
          this.cmd("setoption name UCI_Variant value xiangqi");
          this.cmd("isready");
        }
        if (line === "readyok" && !this.ready) {
          this.ready = true;
          clearTimeout(timeout);
          this.worker!.onmessage = (ev: MessageEvent) => {
            const l = typeof ev.data === "string" ? ev.data : "";
            for (const cb of this.listeners) cb(l);
          };
          resolve();
        }
      };
      this.worker!.onerror = (e) => { clearTimeout(timeout); reject(new Error(e.message)); };
      this.cmd("uci");
    });
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.listeners = [];
  }

  isReady(): boolean { return this.ready; }

  // ── Single position analysis ─────────────────────────────────────────────

  async analyzePosition(
    fen: string,
    depth = 18,
    onInfo?: (ev: EngineEval) => void,
  ): Promise<PositionAnalysis> {
    this.cmd("stop");
    this.cmd(`position fen ${fen}`);

    const evals: EngineEval[] = [];

    return new Promise((resolve) => {
      const handler = (line: string) => {
        if (line.startsWith("info") && line.includes(" pv ")) {
          const ev = parseInfo(line);
          if (ev) { evals.push(ev); onInfo?.(ev); }
        }
        if (line.startsWith("bestmove")) {
          this.removeListener(handler);
          const bestMove = line.split(/\s+/)[1] ?? "";
          const best = evals[evals.length - 1];
          resolve({
            fen,
            depth: best?.depth ?? depth,
            score: best?.score ?? { type: "cp", value: 0 },
            bestLine: best?.pv ?? [],
            bestMove,
          });
        }
      };
      this.addListener(handler);
      this.cmd(`go depth ${depth}`);
    });
  }

  // ── Analyze with moves from startFen ─────────────────────────────────────

  async analyzeWithMoves(fen: string, moves: string[], depth = 18): Promise<PositionAnalysis> {
    this.cmd("stop");
    this.cmd(moves.length ? `position fen ${fen} moves ${moves.join(" ")}` : `position fen ${fen}`);

    const evals: EngineEval[] = [];

    return new Promise((resolve) => {
      const handler = (line: string) => {
        if (line.startsWith("info") && line.includes(" pv ")) {
          const ev = parseInfo(line);
          if (ev) evals.push(ev);
        }
        if (line.startsWith("bestmove")) {
          this.removeListener(handler);
          const bestMove = line.split(/\s+/)[1] ?? "";
          const best = evals[evals.length - 1];
          resolve({
            fen: "",
            depth: best?.depth ?? depth,
            score: best?.score ?? { type: "cp", value: 0 },
            bestLine: best?.pv ?? [],
            bestMove,
          });
        }
      };
      this.addListener(handler);
      this.cmd(`go depth ${depth}`);
    });
  }

  // ── Full game review ─────────────────────────────────────────────────────

  async reviewGame(
    moves: string[],
    opts: { startFen?: string; depth?: number; onProgress?: (done: number, total: number) => void } = {},
  ): Promise<GameReviewResult> {
    const { startFen = INITIAL_FEN, depth = 18, onProgress } = opts;
    const posEvals: PositionAnalysis[] = [];

    posEvals.push(await this.analyzePosition(startFen, depth));
    onProgress?.(0, moves.length);

    for (let i = 0; i < moves.length; i++) {
      posEvals.push(await this.analyzeWithMoves(startFen, moves.slice(0, i + 1), depth));
      onProgress?.(i + 1, moves.length);
    }

    const results: MoveAnalysis[] = [];
    let redLoss = 0, redCount = 0, blackLoss = 0, blackCount = 0;

    for (let i = 0; i < moves.length; i++) {
      const isRed = i % 2 === 0;
      const before = normalize(posEvals[i].score);
      const after = -normalize(posEvals[i + 1].score);
      const cpLoss = Math.max(0, before - after);
      const classification = classify(cpLoss);

      if (isRed) { redLoss += cpLoss; redCount++; }
      else { blackLoss += cpLoss; blackCount++; }

      results.push({ moveIndex: i, playedMove: moves[i], evaluation: posEvals[i + 1], classification, cpLoss });
    }

    return { moves: results, redAccuracy: accuracy(redLoss, redCount), blackAccuracy: accuracy(blackLoss, blackCount) };
  }

  stop(): void { this.cmd("stop"); }

  // ── Internal ─────────────────────────────────────────────────────────────

  private cmd(s: string): void { this.worker?.postMessage(s); }
  private addListener(cb: (line: string) => void) { this.listeners.push(cb); }
  private removeListener(cb: (line: string) => void) { this.listeners = this.listeners.filter((l) => l !== cb); }
}

// ── UCI Parser ───────────────────────────────────────────────────────────────

function parseInfo(line: string): EngineEval | null {
  const depth = extractInt(line, "depth");
  if (depth === null) return null;
  const score = parseScore(line);
  if (!score) return null;
  const pvIdx = line.indexOf(" pv ");
  if (pvIdx === -1) return null;
  const pv = line.slice(pvIdx + 4).trim().split(/\s+/);
  return { depth, score, pv };
}

function parseScore(line: string): EngineEval["score"] | null {
  const cp = line.match(/score cp (-?\d+)/);
  if (cp) return { type: "cp", value: parseInt(cp[1], 10) };
  const mate = line.match(/score mate (-?\d+)/);
  if (mate) return { type: "mate", value: parseInt(mate[1], 10) };
  return null;
}

function extractInt(line: string, key: string): number | null {
  const m = line.match(new RegExp(`\\b${key}\\s+(\\d+)`));
  return m ? parseInt(m[1], 10) : null;
}

// ── Classification helpers ───────────────────────────────────────────────────

function normalize(score: { type: "cp" | "mate"; value: number }): number {
  if (score.type === "mate") return score.value > 0 ? 10000 - score.value * 10 : -10000 - score.value * 10;
  return score.value;
}

function classify(cpLoss: number): MoveClassification {
  if (cpLoss <= 0) return "best";
  if (cpLoss <= 10) return "best";
  if (cpLoss <= 25) return "excellent";
  if (cpLoss <= 50) return "good";
  if (cpLoss <= 100) return "inaccuracy";
  if (cpLoss <= 200) return "mistake";
  return "blunder";
}

function accuracy(totalLoss: number, count: number): number {
  if (count === 0) return 100;
  const avg = totalLoss / count;
  const acc = 103.1668 * Math.exp(-0.04354 * avg) - 3.1668;
  return Math.max(0, Math.min(100, Math.round(acc * 10) / 10));
}
