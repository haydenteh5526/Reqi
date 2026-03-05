/**
 * Xiangqi Piece Definitions & Board Positions
 *
 * Shared piece data used across board previews, game displays, etc.
 * These will eventually come from the game engine / server state.
 */

export interface PieceDef {
  col: number;
  row: number;
  char: string;
  side: "red" | "black";
}

// ── Standard Starting Position ──────────────────────────────────────────────

export const STARTING_POSITION: PieceDef[] = [
  // Black back row (row 0): 車馬象士將士象馬車
  { col: 0, row: 0, char: "車", side: "black" },
  { col: 1, row: 0, char: "馬", side: "black" },
  { col: 2, row: 0, char: "象", side: "black" },
  { col: 3, row: 0, char: "士", side: "black" },
  { col: 4, row: 0, char: "將", side: "black" },
  { col: 5, row: 0, char: "士", side: "black" },
  { col: 6, row: 0, char: "象", side: "black" },
  { col: 7, row: 0, char: "馬", side: "black" },
  { col: 8, row: 0, char: "車", side: "black" },
  // Black cannons (row 2)
  { col: 1, row: 2, char: "砲", side: "black" },
  { col: 7, row: 2, char: "砲", side: "black" },
  // Black soldiers (row 3)
  { col: 0, row: 3, char: "卒", side: "black" },
  { col: 2, row: 3, char: "卒", side: "black" },
  { col: 4, row: 3, char: "卒", side: "black" },
  { col: 6, row: 3, char: "卒", side: "black" },
  { col: 8, row: 3, char: "卒", side: "black" },
  // Red soldiers (row 6)
  { col: 0, row: 6, char: "兵", side: "red" },
  { col: 2, row: 6, char: "兵", side: "red" },
  { col: 4, row: 6, char: "兵", side: "red" },
  { col: 6, row: 6, char: "兵", side: "red" },
  { col: 8, row: 6, char: "兵", side: "red" },
  // Red cannons (row 7)
  { col: 1, row: 7, char: "炮", side: "red" },
  { col: 7, row: 7, char: "炮", side: "red" },
  // Red back row (row 9): 車馬相仕帥仕相馬車
  { col: 0, row: 9, char: "車", side: "red" },
  { col: 1, row: 9, char: "馬", side: "red" },
  { col: 2, row: 9, char: "相", side: "red" },
  { col: 3, row: 9, char: "仕", side: "red" },
  { col: 4, row: 9, char: "帥", side: "red" },
  { col: 5, row: 9, char: "仕", side: "red" },
  { col: 6, row: 9, char: "相", side: "red" },
  { col: 7, row: 9, char: "馬", side: "red" },
  { col: 8, row: 9, char: "車", side: "red" },
];

// ── Sample Puzzle Position (mid-game tactical) ──────────────────────────────

export const SAMPLE_PUZZLE_POSITION: PieceDef[] = [
  { col: 4, row: 0, char: "將", side: "black" },
  { col: 3, row: 0, char: "士", side: "black" },
  { col: 5, row: 0, char: "士", side: "black" },
  { col: 0, row: 0, char: "車", side: "black" },
  { col: 2, row: 2, char: "砲", side: "black" },
  { col: 0, row: 3, char: "卒", side: "black" },
  { col: 4, row: 3, char: "卒", side: "black" },
  { col: 6, row: 1, char: "馬", side: "black" },
  { col: 4, row: 9, char: "帥", side: "red" },
  { col: 3, row: 9, char: "仕", side: "red" },
  { col: 5, row: 8, char: "仕", side: "red" },
  { col: 4, row: 7, char: "炮", side: "red" },
  { col: 7, row: 7, char: "車", side: "red" },
  { col: 2, row: 6, char: "兵", side: "red" },
  { col: 6, row: 6, char: "兵", side: "red" },
  { col: 5, row: 5, char: "馬", side: "red" },
];

// ── Sample Review Position (end-game) ───────────────────────────────────────

export const SAMPLE_REVIEW_POSITION: PieceDef[] = [
  { col: 4, row: 1, char: "將", side: "black" },
  { col: 3, row: 0, char: "士", side: "black" },
  { col: 8, row: 0, char: "車", side: "black" },
  { col: 1, row: 2, char: "砲", side: "black" },
  { col: 6, row: 3, char: "卒", side: "black" },
  { col: 2, row: 3, char: "卒", side: "black" },
  { col: 2, row: 0, char: "象", side: "black" },
  { col: 4, row: 9, char: "帥", side: "red" },
  { col: 5, row: 9, char: "仕", side: "red" },
  { col: 0, row: 9, char: "車", side: "red" },
  { col: 6, row: 9, char: "相", side: "red" },
  { col: 5, row: 7, char: "炮", side: "red" },
  { col: 4, row: 6, char: "兵", side: "red" },
  { col: 3, row: 5, char: "馬", side: "red" },
];

// ── Profile Mini Board Position ─────────────────────────────────────────────

export const SAMPLE_PROFILE_POSITION: PieceDef[] = [
  { col: 4, row: 0, char: "將", side: "black" },
  { col: 3, row: 0, char: "士", side: "black" },
  { col: 5, row: 0, char: "士", side: "black" },
  { col: 2, row: 2, char: "砲", side: "black" },
  { col: 6, row: 3, char: "卒", side: "black" },
  { col: 4, row: 3, char: "卒", side: "black" },
  { col: 1, row: 1, char: "馬", side: "black" },
  { col: 4, row: 9, char: "帥", side: "red" },
  { col: 3, row: 9, char: "仕", side: "red" },
  { col: 5, row: 9, char: "仕", side: "red" },
  { col: 4, row: 7, char: "炮", side: "red" },
  { col: 7, row: 7, char: "車", side: "red" },
  { col: 2, row: 6, char: "兵", side: "red" },
  { col: 5, row: 5, char: "馬", side: "red" },
];
