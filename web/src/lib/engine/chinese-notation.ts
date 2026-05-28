// =============================================================================
// Chinese Notation — Convert UCI moves to traditional Xiangqi notation
// Format: 炮二平五 (Cannon from file 2 moves to file 5)
// =============================================================================

import type { BoardState, Position, Side, PieceType } from "@xiangqi/shared";
import { pieceAt, createInitialBoard, applyMove } from "@xiangqi/shared";

const RED_NAMES: Record<PieceType, string> = {
  general: "帥", advisor: "仕", elephant: "相",
  horse: "馬", chariot: "車", cannon: "炮", soldier: "兵",
};

const BLACK_NAMES: Record<PieceType, string> = {
  general: "將", advisor: "士", elephant: "象",
  horse: "馬", chariot: "車", cannon: "砲", soldier: "卒",
};

// Chinese numerals for Red (file numbers from Red's right = 1-9)
const RED_NUMS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
// Arabic for Black (file numbers from Black's right = 1-9)
const BLACK_NUMS = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Convert a UCI move to Chinese notation given the board state before the move.
 * UCI uses col a-i (0-8), row 0-9 where 0 = Red's back rank in Fairy Stockfish.
 * Our board: row 0 = Black's back rank (top), row 9 = Red's back rank (bottom).
 */
export function uciToChineseNotation(uci: string, board: BoardState): string {
  const from = uciToPos(uci, 0);
  const to = uciToPos(uci, 2);
  if (!from || !to) return uci;

  const piece = pieceAt(board, from);
  if (!piece) return uci;

  const isRed = piece.side === "red";
  const name = isRed ? RED_NAMES[piece.type] : BLACK_NAMES[piece.type];
  const nums = isRed ? RED_NUMS : BLACK_NUMS;

  // File number: from the player's right side
  // Red: file = 9 - col (so col 0 = file 9, col 8 = file 1)
  // Black: file = col + 1 (so col 0 = file 1, col 8 = file 9)
  const fromFile = isRed ? 9 - from.col : from.col + 1;
  const toFile = isRed ? 9 - to.col : to.col + 1;

  // Direction
  const rowDiff = to.row - from.row;
  const isForward = isRed ? rowDiff < 0 : rowDiff > 0;
  const isSideways = rowDiff === 0;

  let direction: string;
  let destination: string;

  if (isSideways) {
    direction = "平";
    destination = nums[toFile];
  } else if (isForward) {
    direction = "進";
    // For pieces that move straight (chariot, cannon, soldier, general): distance
    // For diagonal pieces (horse, elephant, advisor): destination file
    if (piece.type === "horse" || piece.type === "elephant" || piece.type === "advisor") {
      destination = nums[toFile];
    } else {
      destination = nums[Math.abs(rowDiff)];
    }
  } else {
    direction = "退";
    if (piece.type === "horse" || piece.type === "elephant" || piece.type === "advisor") {
      destination = nums[toFile];
    } else {
      destination = nums[Math.abs(rowDiff)];
    }
  }

  return `${name}${nums[fromFile]}${direction}${destination}`;
}

/**
 * Convert a full game's UCI moves to Chinese notation.
 */
export function convertGameToChineseNotation(uciMoves: string[]): string[] {
  const result: string[] = [];
  let board = createInitialBoard();

  for (const uci of uciMoves) {
    result.push(uciToChineseNotation(uci, board));
    const from = uciToPos(uci, 0);
    const to = uciToPos(uci, 2);
    if (from && to) board = applyMove(board, from, to);
  }

  return result;
}

function uciToPos(uci: string, offset: number): Position | null {
  if (uci.length < offset + 2) return null;
  const col = uci.charCodeAt(offset) - 97;
  const row = 9 - parseInt(uci[offset + 1], 10);
  if (col < 0 || col > 8 || row < 0 || row > 9) return null;
  return { col: col as Position["col"], row: row as Position["row"] };
}
