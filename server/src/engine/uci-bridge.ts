// =============================================================================
// UCI Bridge — Pikafish child_process wrapper
// Spawns the engine binary, sends UCI commands, parses evaluation output.
// =============================================================================

import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";

// ── Types ────────────────────────────────────────────────────────────────────

export interface EngineEval {
  depth: number;
  score: { type: "cp" | "mate"; value: number };
  pv: string[]; // principal variation (UCI move strings e.g. "e2e4")
  multipv?: number; // which line (1 = best, 2 = second best)
  nodes?: number;
  time?: number;
}

export interface BestMove {
  move: string; // UCI format e.g. "h2e2"
  ponder?: string;
}

export interface UciBridgeOptions {
  enginePath: string;
  threads?: number;
  hash?: number; // MB
}

// ── UCI Bridge ───────────────────────────────────────────────────────────────

export class UciBridge extends EventEmitter {
  private proc: ChildProcess | null = null;
  private ready = false;
  private buffer = "";
  private readonly enginePath: string;
  private readonly threads: number;
  private readonly hash: number;

  constructor(opts: UciBridgeOptions) {
    super();
    this.enginePath = opts.enginePath;
    this.threads = opts.threads ?? 1;
    this.hash = opts.hash ?? 128;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    this.proc = spawn(this.enginePath, [], { stdio: ["pipe", "pipe", "pipe"] });

    this.proc.stdout!.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString();
      this.processBuffer();
    });

    this.proc.stderr!.on("data", (chunk: Buffer) => {
      this.emit("error", new Error(chunk.toString()));
    });

    this.proc.on("exit", (code) => {
      this.ready = false;
      this.emit("exit", code);
    });

    await this.sendAndWait("uci", "uciok");
    this.send(`setoption name Threads value ${this.threads}`);
    this.send(`setoption name Hash value ${this.hash}`);
    this.send("setoption name UCI_Variant value xiangqi");
    await this.sendAndWait("isready", "readyok");
    this.ready = true;
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    this.send("quit");
    return new Promise((resolve) => {
      this.proc!.on("exit", () => {
        this.proc = null;
        this.ready = false;
        resolve();
      });
      setTimeout(() => {
        this.proc?.kill();
        this.proc = null;
        this.ready = false;
        resolve();
      }, 2000);
    });
  }

  isReady(): boolean {
    return this.ready;
  }

  // ── Analysis Commands ────────────────────────────────────────────────────

  async analyze(fen: string, opts: { depth?: number; movetime?: number } = {}): Promise<{ evals: EngineEval[]; bestMove: BestMove }> {
    if (!this.ready) throw new Error("Engine not ready");

    this.send(`position fen ${fen}`);

    const goCmd = opts.depth
      ? `go depth ${opts.depth}`
      : `go movetime ${opts.movetime ?? 1000}`;

    const evals: EngineEval[] = [];

    return new Promise((resolve, reject) => {
      const onLine = (line: string) => {
        if (line.startsWith("info") && line.includes(" pv ")) {
          const ev = parseInfoLine(line);
          if (ev) evals.push(ev);
        }
        if (line.startsWith("bestmove")) {
          this.off("line", onLine);
          const bm = parseBestMove(line);
          if (bm) resolve({ evals, bestMove: bm });
          else reject(new Error(`Failed to parse bestmove: ${line}`));
        }
      };
      this.on("line", onLine);
      this.send(goCmd);
    });
  }

  async analyzeWithMoves(fen: string, moves: string[], opts: { depth?: number; movetime?: number } = {}): Promise<{ evals: EngineEval[]; bestMove: BestMove }> {
    if (!this.ready) throw new Error("Engine not ready");

    const posCmd = moves.length
      ? `position fen ${fen} moves ${moves.join(" ")}`
      : `position fen ${fen}`;
    this.send(posCmd);

    const goCmd = opts.depth
      ? `go depth ${opts.depth}`
      : `go movetime ${opts.movetime ?? 1000}`;

    const evals: EngineEval[] = [];

    return new Promise((resolve, reject) => {
      const onLine = (line: string) => {
        if (line.startsWith("info") && line.includes(" pv ")) {
          const ev = parseInfoLine(line);
          if (ev) evals.push(ev);
        }
        if (line.startsWith("bestmove")) {
          this.off("line", onLine);
          const bm = parseBestMove(line);
          if (bm) resolve({ evals, bestMove: bm });
          else reject(new Error(`Failed to parse bestmove: ${line}`));
        }
      };
      this.on("line", onLine);
      this.send(goCmd);
    });
  }

  stopSearch(): void {
    this.send("stop");
  }

  async analyzeMultiPV(fen: string, moves: string[], opts: { depth?: number; multiPV?: number } = {}): Promise<{ lines: EngineEval[][]; bestMove: BestMove }> {
    if (!this.ready) throw new Error("Engine not ready");

    const mpv = opts.multiPV ?? 2;
    this.send(`setoption name MultiPV value ${mpv}`);

    const posCmd = moves.length
      ? `position fen ${fen} moves ${moves.join(" ")}`
      : `position fen ${fen}`;
    this.send(posCmd);

    const goCmd = `go depth ${opts.depth ?? 18}`;
    // Collect evals grouped by multipv index
    const lines: Map<number, EngineEval[]> = new Map();

    return new Promise((resolve, reject) => {
      const onLine = (line: string) => {
        if (line.startsWith("info") && line.includes(" pv ")) {
          const ev = parseInfoLine(line);
          if (ev) {
            const pvIdx = ev.multipv ?? 1;
            if (!lines.has(pvIdx)) lines.set(pvIdx, []);
            lines.get(pvIdx)!.push(ev);
          }
        }
        if (line.startsWith("bestmove")) {
          this.off("line", onLine);
          // Reset MultiPV to 1
          this.send("setoption name MultiPV value 1");
          const bm = parseBestMove(line);
          if (bm) {
            const result: EngineEval[][] = [];
            for (let i = 1; i <= mpv; i++) {
              result.push(lines.get(i) ?? []);
            }
            resolve({ lines: result, bestMove: bm });
          } else {
            reject(new Error(`Failed to parse bestmove: ${line}`));
          }
        }
      };
      this.on("line", onLine);
      this.send(goCmd);
    });
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private send(cmd: string): void {
    this.proc?.stdin?.write(cmd + "\n");
  }

  private sendAndWait(cmd: string, expected: string): Promise<void> {
    return new Promise((resolve) => {
      const onLine = (line: string) => {
        if (line.startsWith(expected)) {
          this.off("line", onLine);
          resolve();
        }
      };
      this.on("line", onLine);
      this.send(cmd);
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) this.emit("line", trimmed);
    }
  }
}

// ── UCI Output Parsers ───────────────────────────────────────────────────────

function parseInfoLine(line: string): EngineEval | null {
  const depth = extractInt(line, "depth");
  if (depth === null) return null;

  const score = parseScore(line);
  if (!score) return null;

  const pvIndex = line.indexOf(" pv ");
  if (pvIndex === -1) return null;
  const pv = line.slice(pvIndex + 4).trim().split(/\s+/);

  return {
    depth,
    score,
    pv,
    multipv: extractInt(line, "multipv") ?? 1,
    nodes: extractInt(line, "nodes") ?? undefined,
    time: extractInt(line, "time") ?? undefined,
  };
}

function parseScore(line: string): EngineEval["score"] | null {
  const cpMatch = line.match(/score cp (-?\d+)/);
  if (cpMatch) return { type: "cp", value: parseInt(cpMatch[1], 10) };

  const mateMatch = line.match(/score mate (-?\d+)/);
  if (mateMatch) return { type: "mate", value: parseInt(mateMatch[1], 10) };

  return null;
}

function parseBestMove(line: string): BestMove | null {
  const match = line.match(/^bestmove\s+(\S+)(?:\s+ponder\s+(\S+))?/);
  if (!match) return null;
  return { move: match[1], ponder: match[2] };
}

function extractInt(line: string, key: string): number | null {
  const regex = new RegExp(`\\b${key}\\s+(\\d+)`);
  const m = line.match(regex);
  return m ? parseInt(m[1], 10) : null;
}
