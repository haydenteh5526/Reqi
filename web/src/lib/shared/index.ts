// =============================================================================
// Xiangqi.app — Shared Type Definitions
// These types are consumed by both the web frontend and game server.
// =============================================================================

// ── Piece Types ──────────────────────────────────────────────────────────────

/** The two sides in Xiangqi */
export type Side = "red" | "black";

/** All Xiangqi piece types using traditional abbreviations */
export type PieceType =
  | "general"   // 將/帥 — King equivalent, confined to palace
  | "advisor"   // 士/仕 — Moves diagonally within palace
  | "elephant"  // 象/相 — Moves 2 diagonally, cannot cross river
  | "horse"     // 馬/傌 — L-shape, can be blocked
  | "chariot"   // 車/俥 — Rook equivalent, orthogonal
  | "cannon"    // 砲/炮 — Orthogonal, captures by jumping
  | "soldier";  // 卒/兵 — Pawn equivalent

/** A piece on the board */
export interface Piece {
  type: PieceType;
  side: Side;
  id: string; // Unique ID, e.g., "red-chariot-1"
}

// ── Board Geometry ───────────────────────────────────────────────────────────

/** Column index 0-8 (a-i in notation) */
export type Column = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Row index 0-9 (1-10 in notation, 0 = Red's back rank) */
export type Row = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** A position on the 9×10 board */
export interface Position {
  col: Column;
  row: Row;
}

/**
 * Board state: a 10×9 grid where each cell is either a Piece or null.
 * Indexed as board[row][col].
 */
export type BoardState = (Piece | null)[][];

// ── Move Representation ──────────────────────────────────────────────────────

export interface Move {
  piece: Piece;
  from: Position;
  to: Position;
  captured?: Piece;       // Piece that was captured, if any
  notation: string;       // Human-readable Xiangqi notation
  timestamp: number;      // Unix ms
}

// ── Game State ───────────────────────────────────────────────────────────────

export type GameStatus =
  | "waiting"       // Waiting for opponent
  | "active"        // Game in progress
  | "check"         // Active player is in check
  | "checkmate"     // Game over — checkmate
  | "stalemate"     // Game over — stalemate
  | "draw"          // Game over — agreed draw or repetition
  | "resigned"      // Game over — resignation
  | "timeout";      // Game over — clock expired

export interface GameClock {
  redTimeMs: number;
  blackTimeMs: number;
  incrementMs: number;
  lastMoveTimestamp: number;
}

export interface GameState {
  id: string;
  board: BoardState;
  turn: Side;
  status: GameStatus;
  moves: Move[];
  clock: GameClock;
  redPlayerId: string;
  blackPlayerId: string;
  createdAt: number;
}

// ── Socket.io Event Payloads ─────────────────────────────────────────────────

/** Client → Server events */
export interface ClientToServerEvents {
  "game:join": (payload: { gameId: string }) => void;
  "game:move": (payload: { gameId: string; from: Position; to: Position }) => void;
  "game:resign": (payload: { gameId: string }) => void;
  "game:draw-offer": (payload: { gameId: string }) => void;
  "game:draw-accept": (payload: { gameId: string }) => void;
  "game:draw-decline": (payload: { gameId: string }) => void;
  "matchmaking:join": (payload: { timeControl: TimeControl }) => void;
  "matchmaking:cancel": () => void;
}

/** Server → Client events */
export interface ServerToClientEvents {
  "game:state": (payload: GameState) => void;
  "game:move": (payload: Move) => void;
  "game:over": (payload: { status: GameStatus; winnerId?: string }) => void;
  "game:clock-sync": (payload: GameClock) => void;
  "game:draw-offered": (payload: { by: string }) => void;
  "matchmaking:found": (payload: { gameId: string }) => void;
  "error": (payload: { message: string; code: string }) => void;
}

// ── Matchmaking ──────────────────────────────────────────────────────────────

export interface TimeControl {
  initialMs: number;    // e.g., 600_000 for 10 minutes
  incrementMs: number;  // e.g., 5_000 for 5 second increment
  label: string;        // e.g., "10+5"
}

// ── User / Player ────────────────────────────────────────────────────────────

export interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

// ── re-export engine ─────────────────────────────────────────────────────────

export {
  createEmptyBoard,
  cloneBoard,
  pieceAt,
  inBounds,
  inPalace,
  onOwnSide,
  opponent,
  createInitialBoard,
  pieceChar,
  getRawMoves,
  getLegalMoves,
  hasLegalMoves,
  findGeneral,
  isInCheck,
  applyMove,
  evaluatePosition,
  toNotation,
  createMove,
} from "./engine/rules";

export type { GameResult } from "./engine/rules";
