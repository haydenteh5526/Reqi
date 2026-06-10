// =============================================================================
// FEN ↔ BoardState Conversion for Xiangqi
// Xiangqi FEN: piece placement / side-to-move / - / - / 0 / 1
// Board is 10 ranks (rank 0 = black back rank = top), 9 files.
// =============================================================================

import type { BoardState, Side, PieceType, Piece } from "../index";
import { createEmptyBoard } from "./rules";

// ── FEN piece character mapping ──────────────────────────────────────────────

const CHAR_TO_PIECE: Record<string, { type: PieceType; side: Side }> = {
  K: { type: "general", side: "red" },
  A: { type: "advisor", side: "red" },
  B: { type: "elephant", side: "red" },
  N: { type: "horse", side: "red" },
  R: { type: "chariot", side: "red" },
  C: { type: "cannon", side: "red" },
  P: { type: "soldier", side: "red" },
  k: { type: "general", side: "black" },
  a: { type: "advisor", side: "black" },
  b: { type: "elephant", side: "black" },
  n: { type: "horse", side: "black" },
  r: { type: "chariot", side: "black" },
  c: { type: "cannon", side: "black" },
  p: { type: "soldier", side: "black" },
};

const PIECE_TO_CHAR: Record<string, string> = {
  "red-general": "K",
  "red-advisor": "A",
  "red-elephant": "B",
  "red-horse": "N",
  "red-chariot": "R",
  "red-cannon": "C",
  "red-soldier": "P",
  "black-general": "k",
  "black-advisor": "a",
  "black-elephant": "b",
  "black-horse": "n",
  "black-chariot": "r",
  "black-cannon": "c",
  "black-soldier": "p",
};

// ── Starting position FEN ────────────────────────────────────────────────────

export const INITIAL_FEN =
  "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";

// ── Parse FEN → BoardState + side to move ────────────────────────────────────

export interface FenData {
  board: BoardState;
  turn: Side;
}

export function parseFen(fen: string): FenData {
  const parts = fen.trim().split(/\s+/);
  const placement = parts[0];
  const turn: Side = parts[1] === "b" ? "black" : "red";

  const board = createEmptyBoard();
  const ranks = placement.split("/");

  for (let rank = 0; rank < ranks.length; rank++) {
    let col = 0;
    for (const ch of ranks[rank]) {
      if (ch >= "1" && ch <= "9") {
        col += parseInt(ch, 10);
      } else {
        const mapped = CHAR_TO_PIECE[ch];
        if (mapped) {
          board[rank][col] = {
            type: mapped.type,
            side: mapped.side,
            id: `${mapped.side}-${mapped.type}-${col}-${rank}`,
          };
        }
        col++;
      }
    }
  }

  return { board, turn };
}

// ── Serialize BoardState → FEN string ────────────────────────────────────────

export function toFen(board: BoardState, turn: Side): string {
  const ranks: string[] = [];

  for (let rank = 0; rank < 10; rank++) {
    let empty = 0;
    let rankStr = "";

    for (let col = 0; col < 9; col++) {
      const piece = board[rank][col];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          rankStr += empty.toString();
          empty = 0;
        }
        rankStr += PIECE_TO_CHAR[`${piece.side}-${piece.type}`] ?? "?";
      }
    }
    if (empty > 0) rankStr += empty.toString();
    ranks.push(rankStr);
  }

  return `${ranks.join("/")} ${turn === "red" ? "w" : "b"} - - 0 1`;
}
