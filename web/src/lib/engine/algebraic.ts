// =============================================================================
// Algebraic Notation for Xiangqi PV lines
// Converts UCI moves to chess-style: Hg3, Ce2, Rxd10, e5, etc.
// =============================================================================

import type { BoardState, PieceType, Position } from "@xiangqi/shared";
import { createInitialBoard, applyMove, pieceAt } from "@xiangqi/shared";

const PIECE_LETTER: Record<PieceType, string> = {
  general: "K",
  advisor: "A",
  elephant: "E",
  horse: "H",
  chariot: "R",
  cannon: "C",
  soldier: "",
};

/**
 * Convert a list of UCI PV moves to algebraic notation given the current board.
 * The board should be the position BEFORE the PV moves are played.
 */
export function pvToAlgebraic(pvMoves: string[], board: BoardState): string[] {
  const result: string[] = [];
  let b = board;

  for (const uci of pvMoves) {
    const parsed = parseUci(uci);
    if (!parsed) break;

    const piece = pieceAt(b, parsed.from);
    if (!piece) break;

    const captured = pieceAt(b, parsed.to);
    const letter = PIECE_LETTER[piece.type];
    const sep = captured ? "x" : "";
    const destCol = String.fromCharCode(97 + parsed.to.col);
    const destRow = 10 - parsed.to.row;

    // For soldiers (no letter), just show destination. For others, show Letter + dest.
    // Add source column if ambiguous (simplified: always include for non-soldiers)
    const notation = letter
      ? `${letter}${sep}${destCol}${destRow}`
      : `${sep}${destCol}${destRow}`;

    result.push(notation);
    b = applyMove(b, parsed.from, parsed.to);
  }

  return result;
}

function parseUci(uci: string): { from: Position; to: Position } | null {
  const match = uci.match(/^([a-i])(\d+)([a-i])(\d+)$/);
  if (!match) return null;
  return {
    from: { col: match[1].charCodeAt(0) - 97, row: 10 - parseInt(match[2], 10) } as Position,
    to: { col: match[3].charCodeAt(0) - 97, row: 10 - parseInt(match[4], 10) } as Position,
  };
}
