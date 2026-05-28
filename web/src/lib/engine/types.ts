// =============================================================================
// Engine Types — Shared between Worker and main thread
// =============================================================================

export interface EngineEval {
  depth: number;
  score: { type: "cp" | "mate"; value: number };
  pv: string[];
}

export interface PositionAnalysis {
  fen: string;
  depth: number;
  score: EngineEval["score"];
  bestLine: string[];
  bestMove: string;
}

export type MoveClassification =
  | "brilliant"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export interface MoveAnalysis {
  moveIndex: number;
  playedMove: string;
  evaluation: PositionAnalysis;
  classification: MoveClassification;
  cpLoss: number;
}

export interface GameReviewResult {
  moves: MoveAnalysis[];
  redAccuracy: number;
  blackAccuracy: number;
}

// ── Worker message protocol ──────────────────────────────────────────────────

export type WorkerInMessage =
  | { type: "init" }
  | { type: "analyze"; id: number; fen: string; depth: number }
  | { type: "analyzeWithMoves"; id: number; fen: string; moves: string[]; depth: number }
  | { type: "stop" };

export type WorkerOutMessage =
  | { type: "ready" }
  | { type: "result"; id: number; evals: EngineEval[]; bestMove: string }
  | { type: "info"; id: number; eval: EngineEval }
  | { type: "error"; id: number; message: string };
