// =============================================================================
// Analysis Service — Queue-based engine analysis + game review orchestrator
// =============================================================================

import { UciBridge, EngineEval, BestMove, UciBridgeOptions } from "./uci-bridge";
import { INITIAL_FEN } from "@xiangqi/shared";
import { detectBookMoves } from "./opening-book";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PositionAnalysis {
  fen: string;
  depth: number;
  score: { type: "cp" | "mate"; value: number };
  bestLine: string[];
  bestMove: string;
}

export interface MoveAnalysis {
  moveIndex: number;
  fen: string;
  playedMove: string;
  evaluation: PositionAnalysis;
  classification: MoveClassification;
  cpLoss: number;
}

export type MoveClassification = "brilliant" | "best" | "excellent" | "good" | "book" | "inaccuracy" | "mistake" | "blunder";

export interface GameReviewResult {
  moves: MoveAnalysis[];
  redAccuracy: number;
  blackAccuracy: number;
}

export interface AnalysisServiceOptions extends UciBridgeOptions {
  defaultDepth?: number;
}

// ── Classification thresholds (centipawn loss) ───────────────────────────────

function classify(cpLoss: number): MoveClassification {
  if (cpLoss <= 10) return "best";
  if (cpLoss <= 25) return "excellent";
  if (cpLoss <= 50) return "good";
  if (cpLoss <= 100) return "inaccuracy";
  if (cpLoss <= 200) return "mistake";
  return "blunder";
}

// ── Service ──────────────────────────────────────────────────────────────────

export class AnalysisService {
  public readonly bridge: UciBridge;
  private queue: Array<{ resolve: (v: any) => void; reject: (e: any) => void; task: () => Promise<any> }> = [];
  private processing = false;
  private defaultDepth: number;

  constructor(opts: AnalysisServiceOptions) {
    this.bridge = new UciBridge(opts);
    this.defaultDepth = opts.defaultDepth ?? 18;
  }

  async start(): Promise<void> {
    await this.bridge.start();
  }

  async stop(): Promise<void> {
    await this.bridge.stop();
  }

  isReady(): boolean {
    return this.bridge.isReady();
  }

  // ── Single position analysis ─────────────────────────────────────────────

  async analyzePosition(fen: string, depth?: number): Promise<PositionAnalysis> {
    return this.enqueue(async () => {
      const d = depth ?? this.defaultDepth;
      const result = await this.bridge.analyze(fen, { depth: d });
      const best = result.evals[result.evals.length - 1];
      return {
        fen,
        depth: best?.depth ?? d,
        score: best?.score ?? { type: "cp", value: 0 },
        bestLine: best?.pv ?? [],
        bestMove: result.bestMove.move,
      };
    });
  }

  // ── Full game review ─────────────────────────────────────────────────────

  async reviewGame(
    moves: string[],
    startFen: string = INITIAL_FEN,
    depth?: number,
    onProgress?: (done: number, total: number) => void,
  ): Promise<GameReviewResult> {
    const d = depth ?? this.defaultDepth;
    const results: MoveAnalysis[] = [];

    // For each position we need:
    // 1. The eval (to compute cpLoss)
    // 2. MultiPV 2 for the position BEFORE the move (to detect brilliant)

    // Evaluate all positions with MultiPV 2
    interface PosEval {
      score: { type: "cp" | "mate"; value: number };
      bestMove: string;
      bestLine: string[];
      secondBestScore?: { type: "cp" | "mate"; value: number };
      depth: number;
    }

    const posEvals: PosEval[] = [];

    // Evaluate each position (before move 0, before move 1, ..., after last move)
    for (let i = 0; i <= moves.length; i++) {
      const movesUpTo = moves.slice(0, i);
      const result = await this.enqueue(async () => {
        const r = await this.bridge.analyzeMultiPV(startFen, movesUpTo, { depth: d, multiPV: 2 });
        const line1 = r.lines[0];
        const line2 = r.lines[1];
        const best = line1[line1.length - 1];
        const secondBest = line2?.[line2.length - 1];
        return {
          score: best?.score ?? { type: "cp" as const, value: 0 },
          bestMove: r.bestMove.move,
          bestLine: best?.pv ?? [],
          secondBestScore: secondBest?.score,
          depth: best?.depth ?? d,
        };
      });
      posEvals.push(result);
      onProgress?.(i, moves.length);
    }

    // Classify each move
    const bookDepth = detectBookMoves(moves);
    let redCpLossTotal = 0, redMoveCount = 0;
    let blackCpLossTotal = 0, blackMoveCount = 0;

    for (let i = 0; i < moves.length; i++) {
      const isRed = i % 2 === 0;
      const evalBefore = posEvals[i];
      const evalAfter = posEvals[i + 1];

      const scoreBefore = normalizeScore(evalBefore.score);
      const scoreAfter = -normalizeScore(evalAfter.score);

      const cpLoss = Math.max(0, scoreBefore - scoreAfter);
      let classification = classify(cpLoss);

      // Book move override
      if (i < bookDepth) {
        classification = "book";
      }

      // Brilliant detection: played move is best (cpLoss ≤ 10) AND
      // second-best move is ≥150cp worse AND move involves a sacrifice
      if (cpLoss <= 10 && evalBefore.secondBestScore) {
        const bestScore = normalizeScore(evalBefore.score);
        const secondScore = normalizeScore(evalBefore.secondBestScore);
        const gap = bestScore - secondScore;

        if (gap >= 150 && isSacrifice(moves[i], moves.slice(0, i), startFen)) {
          classification = "brilliant";
        }
      }

      if (isRed) { redCpLossTotal += cpLoss; redMoveCount++; }
      else { blackCpLossTotal += cpLoss; blackMoveCount++; }

      results.push({
        moveIndex: i,
        fen: "",
        playedMove: moves[i],
        evaluation: {
          fen: "",
          depth: evalAfter.depth,
          score: evalAfter.score,
          bestLine: evalAfter.bestLine,
          bestMove: evalAfter.bestMove,
        },
        classification,
        cpLoss,
      });
    }

    return {
      moves: results,
      redAccuracy: computeAccuracy(redCpLossTotal, redMoveCount),
      blackAccuracy: computeAccuracy(blackCpLossTotal, blackMoveCount),
    };
  }

  // ── Queue ────────────────────────────────────────────────────────────────

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, task });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      try {
        const result = await item.task();
        item.resolve(result);
      } catch (e) {
        item.reject(e);
      }
    }

    this.processing = false;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Piece values for sacrifice detection */
const PIECE_VALUES: Record<string, number> = {
  K: 0, k: 0, // generals can't be sacrificed
  A: 200, a: 200,
  B: 200, b: 200,
  N: 400, n: 400,
  R: 900, r: 900,
  C: 450, c: 450,
  P: 100, p: 100,
};

/**
 * Detect if a move is a sacrifice.
 * A sacrifice = moving a piece to a square where it can be captured by a
 * lower-value piece, OR capturing a piece of lower value while leaving
 * the capturing piece en prise.
 * Simplified heuristic: the move captures nothing or captures a piece worth
 * less than the moving piece (giving up material for positional gain).
 */
function isSacrifice(uciMove: string, previousMoves: string[], startFen: string): boolean {
  // Parse the FEN to figure out what's on the board
  // Simple approach: replay moves on a piece map
  const board = replayToBoard(startFen, previousMoves);
  const fromCol = uciMove.charCodeAt(0) - 97;
  const fromRow = parseInt(uciMove[1], 10);
  const toCol = uciMove.charCodeAt(2) - 97;
  const toRow = parseInt(uciMove.length > 4 ? uciMove.substring(3) : uciMove[3], 10);

  const movingPiece = board.get(`${fromCol},${fromRow}`);
  const capturedPiece = board.get(`${toCol},${toRow}`);

  if (!movingPiece) return false;

  const movingValue = PIECE_VALUES[movingPiece] ?? 0;
  const capturedValue = capturedPiece ? (PIECE_VALUES[capturedPiece] ?? 0) : 0;

  // Sacrifice: moving a high-value piece to capture nothing or a lower-value piece
  // (e.g., rook takes pawn, or rook moves to an open square where it can be taken)
  return movingValue > capturedValue + 100;
}

/** Replay FEN + moves into a simple piece map (col,row -> piece char) */
function replayToBoard(fen: string, moves: string[]): Map<string, string> {
  const board = new Map<string, string>();
  const placement = fen.split(/\s+/)[0];
  const ranks = placement.split("/");

  for (let rank = 0; rank < ranks.length; rank++) {
    let col = 0;
    for (const ch of ranks[rank]) {
      if (ch >= "1" && ch <= "9") {
        col += parseInt(ch, 10);
      } else {
        board.set(`${col},${rank}`, ch);
        col++;
      }
    }
  }

  // Replay moves
  for (const m of moves) {
    const fc = m.charCodeAt(0) - 97;
    const fr = parseInt(m[1], 10);
    const tc = m.charCodeAt(2) - 97;
    const tr = parseInt(m.length > 4 ? m.substring(3) : m[3], 10);
    const piece = board.get(`${fc},${fr}`);
    if (piece) {
      board.delete(`${fc},${fr}`);
      board.set(`${tc},${tr}`, piece);
    }
  }

  return board;
}

/** Normalize score to centipawns from side-to-move's perspective */
function normalizeScore(score: { type: "cp" | "mate"; value: number }): number {
  if (score.type === "mate") {
    return score.value > 0 ? 10000 - score.value * 10 : -10000 - score.value * 10;
  }
  return score.value;
}

/** Convert average centipawn loss to accuracy percentage (chess.com-style) */
function computeAccuracy(totalCpLoss: number, moveCount: number): number {
  if (moveCount === 0) return 100;
  const avgLoss = totalCpLoss / moveCount;
  // Formula: accuracy ≈ 103.1668 * exp(-0.04354 * avgLoss) - 3.1668
  // Clamped to [0, 100]
  const accuracy = 103.1668 * Math.exp(-0.04354 * avgLoss) - 3.1668;
  return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10));
}
