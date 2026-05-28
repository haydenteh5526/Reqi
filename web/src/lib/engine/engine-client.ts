// =============================================================================
// Engine Client — Main-thread API that communicates with the WASM Web Worker
// =============================================================================

import type {
  WorkerInMessage,
  WorkerOutMessage,
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
  private nextId = 1;
  private pending = new Map<number, {
    resolve: (v: { evals: EngineEval[]; bestMove: string }) => void;
    reject: (e: Error) => void;
    onInfo?: (ev: EngineEval) => void;
  }>();

  async init(): Promise<void> {
    if (this.worker) return;

    this.worker = new Worker(
      new URL("./engine-worker.ts", import.meta.url),
      { type: "module" }
    );

    return new Promise((resolve, reject) => {
      this.worker!.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
        this.handleMessage(e.data);
      };

      const onReady = () => {
        this.ready = true;
        resolve();
      };

      // Temporarily override to catch the "ready" message
      const origHandler = this.handleMessage.bind(this);
      this.handleMessage = (msg: WorkerOutMessage) => {
        if (msg.type === "ready") {
          this.handleMessage = origHandler;
          this.worker!.onmessage = (e) => this.handleMessage(e.data);
          onReady();
        } else if (msg.type === "error") {
          reject(new Error(msg.message));
        }
      };

      this.send({ type: "init" });
    });
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.pending.clear();
  }

  isReady(): boolean {
    return this.ready;
  }

  // ── Single position analysis ─────────────────────────────────────────────

  async analyzePosition(
    fen: string,
    depth = 18,
    onInfo?: (ev: EngineEval) => void,
  ): Promise<PositionAnalysis> {
    const { evals, bestMove } = await this.request(
      { type: "analyze", id: 0, fen, depth },
      onInfo,
    );
    const best = evals[evals.length - 1];
    return {
      fen,
      depth: best?.depth ?? depth,
      score: best?.score ?? { type: "cp", value: 0 },
      bestLine: best?.pv ?? [],
      bestMove,
    };
  }

  // ── Full game review ─────────────────────────────────────────────────────

  async reviewGame(
    moves: string[],
    opts: { startFen?: string; depth?: number; onProgress?: (done: number, total: number) => void } = {},
  ): Promise<GameReviewResult> {
    const { startFen = INITIAL_FEN, depth = 18, onProgress } = opts;
    const posEvals: PositionAnalysis[] = [];

    // Evaluate starting position
    posEvals.push(await this.analyzePosition(startFen, depth));
    onProgress?.(0, moves.length);

    // Evaluate after each move
    for (let i = 0; i < moves.length; i++) {
      const movesUpTo = moves.slice(0, i + 1);
      const { evals, bestMove } = await this.request({
        type: "analyzeWithMoves",
        id: 0,
        fen: startFen,
        moves: movesUpTo,
        depth,
      });
      const best = evals[evals.length - 1];
      posEvals.push({
        fen: "",
        depth: best?.depth ?? depth,
        score: best?.score ?? { type: "cp", value: 0 },
        bestLine: best?.pv ?? [],
        bestMove,
      });
      onProgress?.(i + 1, moves.length);
    }

    // Classify moves
    const results: MoveAnalysis[] = [];
    let redLoss = 0, redCount = 0, blackLoss = 0, blackCount = 0;

    for (let i = 0; i < moves.length; i++) {
      const isRed = i % 2 === 0;
      const before = scoreForSide(posEvals[i].score, isRed);
      const after = -scoreForSide(posEvals[i + 1].score, isRed); // negate: opponent's perspective
      const cpLoss = Math.max(0, before - after);
      const classification = classify(cpLoss);

      if (isRed) { redLoss += cpLoss; redCount++; }
      else { blackLoss += cpLoss; blackCount++; }

      results.push({
        moveIndex: i,
        playedMove: moves[i],
        evaluation: posEvals[i + 1],
        classification,
        cpLoss,
      });
    }

    return {
      moves: results,
      redAccuracy: accuracy(redLoss, redCount),
      blackAccuracy: accuracy(blackLoss, blackCount),
    };
  }

  stop(): void {
    this.send({ type: "stop" });
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private request(
    msg: WorkerInMessage & { id: number },
    onInfo?: (ev: EngineEval) => void,
  ): Promise<{ evals: EngineEval[]; bestMove: string }> {
    const id = this.nextId++;
    const tagged = { ...msg, id };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onInfo });
      this.send(tagged);
    });
  }

  private send(msg: WorkerInMessage): void {
    this.worker?.postMessage(msg);
  }

  private handleMessage(msg: WorkerOutMessage): void {
    if (msg.type === "info") {
      this.pending.get(msg.id)?.onInfo?.(msg.eval);
    } else if (msg.type === "result") {
      const p = this.pending.get(msg.id);
      if (p) {
        this.pending.delete(msg.id);
        p.resolve({ evals: msg.evals, bestMove: msg.bestMove });
      }
    } else if (msg.type === "error") {
      const p = this.pending.get(msg.id);
      if (p) {
        this.pending.delete(msg.id);
        p.reject(new Error(msg.message));
      }
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreForSide(score: { type: "cp" | "mate"; value: number }, isRed: boolean): number {
  // UCI scores are from side-to-move's perspective.
  // evalAfter: side-to-move is the opponent, so we negate to get mover's perspective.
  const raw = score.type === "mate"
    ? (score.value > 0 ? 10000 - score.value * 10 : -10000 - score.value * 10)
    : score.value;
  return raw;
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
