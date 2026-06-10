// =============================================================================
// Xiangqi Bot Engine — Minimax with Alpha-Beta Pruning
// Provides a reasonably strong computer opponent for local play.
// =============================================================================

import type { BoardState, Position, Side, Move, Piece } from "@xiangqi/shared";
import {
  pieceAt,
  getLegalMoves,
  applyMove,
  createMove,
  isInCheck,
  hasLegalMoves,
  opponent,
} from "@xiangqi/shared";

// ── Piece Values ─────────────────────────────────────────────────────────────

const PIECE_VALUE: Record<string, number> = {
  general: 10000,
  chariot: 900,
  cannon: 450,
  horse: 400,
  elephant: 200,
  advisor: 200,
  soldier: 100,
};

// ── Positional Bonuses (row, col) → bonus for Red (flip for Black) ──────────

// Soldiers gain value after crossing the river
function soldierPositionBonus(row: number, _col: number, side: Side): number {
  const crossed = side === "red" ? row <= 4 : row >= 5;
  if (!crossed) return 0;
  // More advanced = more bonus
  const advancedRows = side === "red" ? 4 - row : row - 5;
  return 30 + advancedRows * 15;
}

// Horses are better in the center
function horsePositionBonus(_row: number, col: number): number {
  const centerDist = Math.abs(col - 4);
  return (4 - centerDist) * 8;
}

// Cannons are better further back with open files
function cannonPositionBonus(row: number, _col: number, side: Side): number {
  const depth = side === "red" ? 9 - row : row;
  return depth > 4 ? 20 : 0;
}

// Chariots get bonus for central/open positions
function chariotPositionBonus(_row: number, col: number): number {
  const centerDist = Math.abs(col - 4);
  return (4 - centerDist) * 5;
}

// ── Board Evaluation ─────────────────────────────────────────────────────────

function evaluateBoard(board: BoardState, side: Side): number {
  let score = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r]?.[c];
      if (!piece) continue;

      let value = PIECE_VALUE[piece.type] ?? 0;

      // Add positional bonuses
      switch (piece.type) {
        case "soldier":
          value += soldierPositionBonus(r, c, piece.side);
          break;
        case "horse":
          value += horsePositionBonus(r, c);
          break;
        case "cannon":
          value += cannonPositionBonus(r, c, piece.side);
          break;
        case "chariot":
          value += chariotPositionBonus(r, c);
          break;
      }

      if (piece.side === side) {
        score += value;
      } else {
        score -= value;
      }
    }
  }

  // Bonus for checking the opponent
  if (isInCheck(board, opponent(side))) {
    score += 50;
  }

  return score;
}

// ── Move Ordering (for better alpha-beta pruning) ────────────────────────────

function scoreMoveForOrdering(board: BoardState, from: Position, to: Position): number {
  const captured = pieceAt(board, to);
  const moving = pieceAt(board, from);
  let score = 0;

  // Captures scored by MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
  if (captured) {
    score += (PIECE_VALUE[captured.type] ?? 0) * 10 - (PIECE_VALUE[moving?.type ?? "soldier"] ?? 0);
  }

  // Moves toward center get a small bonus
  const centerDist = Math.abs(to.col - 4) + Math.abs(to.row - 4.5);
  score += (9 - centerDist) * 2;

  return score;
}

// ── All Legal Moves for a Side ───────────────────────────────────────────────

interface ScoredMove {
  from: Position;
  to: Position;
  orderScore: number;
}

function getAllMovesOrdered(board: BoardState, side: Side): ScoredMove[] {
  const moves: ScoredMove[] = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r]?.[c];
      if (!piece || piece.side !== side) continue;

      const from = { col: c, row: r } as Position;
      const targets = getLegalMoves(board, from);

      for (const to of targets) {
        const orderScore = scoreMoveForOrdering(board, from, to);
        moves.push({ from, to, orderScore });
      }
    }
  }

  // Sort descending by order score for better pruning
  moves.sort((a, b) => b.orderScore - a.orderScore);
  return moves;
}

// ── Minimax with Alpha-Beta ──────────────────────────────────────────────────

function minimax(
  board: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  botSide: Side,
): number {
  const currentSide = maximizing ? botSide : opponent(botSide);

  // Terminal check
  if (depth === 0) {
    return evaluateBoard(board, botSide);
  }

  const moves = getAllMovesOrdered(board, currentSide);

  // No legal moves — checkmate or stalemate
  if (moves.length === 0) {
    if (isInCheck(board, currentSide)) {
      // Checkmated — very bad for the side that's mated
      return maximizing ? -99999 + (4 - depth) : 99999 - (4 - depth);
    }
    // Stalemate
    return 0;
  }

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move.from, move.to);
      const eval_ = minimax(newBoard, depth - 1, alpha, beta, false, botSide);
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break; // Beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move.from, move.to);
      const eval_ = minimax(newBoard, depth - 1, alpha, beta, true, botSide);
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return minEval;
  }
}

// ── Difficulty Levels ────────────────────────────────────────────────────────

export type BotDifficulty = "easy" | "medium" | "hard";

const DEPTH_MAP: Record<BotDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

// ── Public API ───────────────────────────────────────────────────────────────

export interface BotMove {
  from: Position;
  to: Position;
}

/**
 * Compute the best move for the bot.
 * Returns null if no legal moves exist.
 */
export function computeBotMove(
  board: BoardState,
  botSide: Side,
  difficulty: BotDifficulty = "medium",
): BotMove | null {
  const depth = DEPTH_MAP[difficulty];
  const moves = getAllMovesOrdered(board, botSide);

  if (moves.length === 0) return null;

  // For easy mode, add some randomness
  if (difficulty === "easy") {
    // 30% chance of random move
    if (Math.random() < 0.3) {
      const idx = Math.floor(Math.random() * moves.length);
      return { from: moves[idx].from, to: moves[idx].to };
    }
  }

  let bestMove: BotMove | null = null;
  let bestEval = -Infinity;

  for (const move of moves) {
    const newBoard = applyMove(board, move.from, move.to);
    const eval_ = minimax(newBoard, depth - 1, -Infinity, Infinity, false, botSide);

    // Add small random noise for variety (especially at same-eval moves)
    const noise = Math.random() * 5;

    if (eval_ + noise > bestEval) {
      bestEval = eval_ + noise;
      bestMove = { from: move.from, to: move.to };
    }
  }

  return bestMove;
}
