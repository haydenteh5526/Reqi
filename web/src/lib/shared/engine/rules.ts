// =============================================================================
// Xiangqi Move Validation Engine
// Complete legal move generation, check detection, checkmate & stalemate.
// =============================================================================

import type { Side, PieceType, Piece, Position, BoardState, Move } from "../index";

// ── Board Helpers ────────────────────────────────────────────────────────────

/** Create a fresh 10×9 empty board */
export function createEmptyBoard(): BoardState {
  return Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => null));
}

/** Deep-clone a board */
export function cloneBoard(board: BoardState): BoardState {
  return board.map((row) => [...row]);
}

/** Get piece at position (or null) */
export function pieceAt(board: BoardState, pos: Position): Piece | null {
  return board[pos.row]?.[pos.col] ?? null;
}

/** Check if position is within the 9×10 board */
export function inBounds(col: number, row: number): boolean {
  return col >= 0 && col <= 8 && row >= 0 && row <= 9;
}

/** Check if position is inside the palace for a given side */
export function inPalace(col: number, row: number, side: Side): boolean {
  if (col < 3 || col > 5) return false;
  if (side === "red") return row >= 7 && row <= 9;
  return row >= 0 && row <= 2;
}

/** Check if a position is on the given side's half of the board */
export function onOwnSide(row: number, side: Side): boolean {
  return side === "red" ? row >= 5 : row <= 4;
}

/** Opposite side */
export function opponent(side: Side): Side {
  return side === "red" ? "black" : "red";
}

// ── Initial Position Setup ───────────────────────────────────────────────────

/** Standard starting board position */
export function createInitialBoard(): BoardState {
  const board = createEmptyBoard();

  const place = (col: number, row: number, type: PieceType, side: Side) => {
    board[row][col] = { type, side, id: `${side}-${type}-${col}-${row}` };
  };

  // Black (rows 0-4, top)
  place(0, 0, "chariot", "black");
  place(1, 0, "horse", "black");
  place(2, 0, "elephant", "black");
  place(3, 0, "advisor", "black");
  place(4, 0, "general", "black");
  place(5, 0, "advisor", "black");
  place(6, 0, "elephant", "black");
  place(7, 0, "horse", "black");
  place(8, 0, "chariot", "black");
  place(1, 2, "cannon", "black");
  place(7, 2, "cannon", "black");
  for (let c = 0; c <= 8; c += 2) place(c, 3, "soldier", "black");

  // Red (rows 5-9, bottom)
  place(0, 9, "chariot", "red");
  place(1, 9, "horse", "red");
  place(2, 9, "elephant", "red");
  place(3, 9, "advisor", "red");
  place(4, 9, "general", "red");
  place(5, 9, "advisor", "red");
  place(6, 9, "elephant", "red");
  place(7, 9, "horse", "red");
  place(8, 9, "chariot", "red");
  place(1, 7, "cannon", "red");
  place(7, 7, "cannon", "red");
  for (let c = 0; c <= 8; c += 2) place(c, 6, "soldier", "red");

  return board;
}

// ── Piece Characters (for notation / display) ────────────────────────────────

const RED_CHARS: Record<PieceType, string> = {
  general: "帥",
  advisor: "仕",
  elephant: "相",
  horse: "馬",
  chariot: "車",
  cannon: "炮",
  soldier: "兵",
};

const BLACK_CHARS: Record<PieceType, string> = {
  general: "將",
  advisor: "士",
  elephant: "象",
  horse: "馬",
  chariot: "車",
  cannon: "砲",
  soldier: "卒",
};

export function pieceChar(type: PieceType, side: Side): string {
  return side === "red" ? RED_CHARS[type] : BLACK_CHARS[type];
}

// ── Raw Move Generation (ignoring self-check) ────────────────────────────────

/** Get all pseudo-legal destination squares for a piece (before check filter) */
export function getRawMoves(board: BoardState, pos: Position): Position[] {
  const piece = pieceAt(board, pos);
  if (!piece) return [];

  switch (piece.type) {
    case "general":
      return getGeneralMoves(board, pos, piece.side);
    case "advisor":
      return getAdvisorMoves(board, pos, piece.side);
    case "elephant":
      return getElephantMoves(board, pos, piece.side);
    case "horse":
      return getHorseMoves(board, pos, piece.side);
    case "chariot":
      return getChariotMoves(board, pos, piece.side);
    case "cannon":
      return getCannonMoves(board, pos, piece.side);
    case "soldier":
      return getSoldierMoves(board, pos, piece.side);
    default:
      return [];
  }
}

// ── General (帥/將) ──────────────────────────────────────────────────────────

function getGeneralMoves(board: BoardState, pos: Position, side: Side): Position[] {
  const moves: Position[] = [];
  const dirs = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
  ];

  for (const [dc, dr] of dirs) {
    const nc = pos.col + dc;
    const nr = pos.row + dr;
    if (!inPalace(nc, nr, side)) continue;
    const target = board[nr][nc];
    if (!target || target.side !== side) {
      moves.push({ col: nc as Position["col"], row: nr as Position["row"] });
    }
  }

  // Flying general rule: can "capture" opposing general if same column, no pieces between
  const oppSide = opponent(side);
  const [startRow, endRow, step] = side === "red" ? [pos.row - 1, -1, -1] : [pos.row + 1, 10, 1];
  let blocked = false;
  for (let r = startRow; r !== endRow; r += step) {
    const p = board[r][pos.col];
    if (p) {
      if (p.type === "general" && p.side === oppSide) {
        if (!blocked) {
          moves.push({ col: pos.col, row: r as Position["row"] });
        }
      }
      blocked = true;
    }
  }

  return moves;
}

// ── Advisor (仕/士) ──────────────────────────────────────────────────────────

function getAdvisorMoves(board: BoardState, pos: Position, side: Side): Position[] {
  const moves: Position[] = [];
  const dirs = [
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  for (const [dc, dr] of dirs) {
    const nc = pos.col + dc;
    const nr = pos.row + dr;
    if (!inPalace(nc, nr, side)) continue;
    const target = board[nr][nc];
    if (!target || target.side !== side) {
      moves.push({ col: nc as Position["col"], row: nr as Position["row"] });
    }
  }

  return moves;
}

// ── Elephant (相/象) ─────────────────────────────────────────────────────────

function getElephantMoves(board: BoardState, pos: Position, side: Side): Position[] {
  const moves: Position[] = [];
  const dirs = [
    [-2, -2, -1, -1],
    [-2, 2, -1, 1],
    [2, -2, 1, -1],
    [2, 2, 1, 1],
  ];

  for (const [dc, dr, bc, br] of dirs) {
    const nc = pos.col + dc;
    const nr = pos.row + dr;
    const blockCol = pos.col + bc;
    const blockRow = pos.row + br;

    if (!inBounds(nc, nr)) continue;
    if (!onOwnSide(nr, side)) continue; // Cannot cross river
    if (board[blockRow][blockCol]) continue; // Blocked at "eye"
    const target = board[nr][nc];
    if (!target || target.side !== side) {
      moves.push({ col: nc as Position["col"], row: nr as Position["row"] });
    }
  }

  return moves;
}

// ── Horse (馬) ───────────────────────────────────────────────────────────────

function getHorseMoves(board: BoardState, pos: Position, side: Side): Position[] {
  const moves: Position[] = [];
  // [dc, dr, blockCol_offset, blockRow_offset]
  const jumps: [number, number, number, number][] = [
    [-1, -2, 0, -1],
    [1, -2, 0, -1],
    [-2, -1, -1, 0],
    [2, -1, 1, 0],
    [-2, 1, -1, 0],
    [2, 1, 1, 0],
    [-1, 2, 0, 1],
    [1, 2, 0, 1],
  ];

  for (const [dc, dr, bdc, bdr] of jumps) {
    const nc = pos.col + dc;
    const nr = pos.row + dr;
    const blockCol = pos.col + bdc;
    const blockRow = pos.row + bdr;

    if (!inBounds(nc, nr)) continue;
    if (!inBounds(blockCol, blockRow)) continue;
    if (board[blockRow][blockCol]) continue; // Hobbled / blocked
    const target = board[nr][nc];
    if (!target || target.side !== side) {
      moves.push({ col: nc as Position["col"], row: nr as Position["row"] });
    }
  }

  return moves;
}

// ── Chariot (車) ─────────────────────────────────────────────────────────────

function getChariotMoves(board: BoardState, pos: Position, side: Side): Position[] {
  return getSlidingMoves(board, pos, side, false);
}

// ── Cannon (炮/砲) ──────────────────────────────────────────────────────────

function getCannonMoves(board: BoardState, pos: Position, side: Side): Position[] {
  return getSlidingMoves(board, pos, side, true);
}

/** Shared logic for chariot & cannon (orthogonal sliding) */
function getSlidingMoves(
  board: BoardState,
  pos: Position,
  side: Side,
  isCannon: boolean,
): Position[] {
  const moves: Position[] = [];
  const dirs = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
  ];

  for (const [dc, dr] of dirs) {
    let jumped = false;
    let nc = pos.col + dc;
    let nr = pos.row + dr;

    while (inBounds(nc, nr)) {
      const target = board[nr][nc];

      if (isCannon) {
        if (!jumped) {
          if (target) {
            jumped = true; // This piece serves as the platform
          } else {
            moves.push({ col: nc as Position["col"], row: nr as Position["row"] });
          }
        } else {
          // After jumping, can only capture the next piece found
          if (target) {
            if (target.side !== side) {
              moves.push({ col: nc as Position["col"], row: nr as Position["row"] });
            }
            break;
          }
        }
      } else {
        // Chariot: move or capture, stop at any piece
        if (target) {
          if (target.side !== side) {
            moves.push({ col: nc as Position["col"], row: nr as Position["row"] });
          }
          break;
        }
        moves.push({ col: nc as Position["col"], row: nr as Position["row"] });
      }

      nc += dc;
      nr += dr;
    }
  }

  return moves;
}

// ── Soldier (兵/卒) ──────────────────────────────────────────────────────────

function getSoldierMoves(board: BoardState, pos: Position, side: Side): Position[] {
  const moves: Position[] = [];
  const forward = side === "red" ? -1 : 1;
  const crossed = !onOwnSide(pos.row, side);

  // Always can move forward
  const nr = pos.row + forward;
  if (inBounds(pos.col, nr)) {
    const target = board[nr][pos.col];
    if (!target || target.side !== side) {
      moves.push({ col: pos.col, row: nr as Position["row"] });
    }
  }

  // After crossing the river, can also move sideways
  if (crossed) {
    for (const dc of [-1, 1]) {
      const nc = pos.col + dc;
      if (inBounds(nc, pos.row)) {
        const target = board[pos.row][nc];
        if (!target || target.side !== side) {
          moves.push({ col: nc as Position["col"], row: pos.row });
        }
      }
    }
  }

  return moves;
}

// ── Check Detection ──────────────────────────────────────────────────────────

/** Find the general's position for a given side */
export function findGeneral(board: BoardState, side: Side): Position | null {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.type === "general" && p.side === side) {
        return { col: c as Position["col"], row: r as Position["row"] };
      }
    }
  }
  return null;
}

/** Is the given side's general currently under attack? */
export function isInCheck(board: BoardState, side: Side): boolean {
  const generalPos = findGeneral(board, side);
  if (!generalPos) return false; // Should never happen in a valid game

  const opp = opponent(side);

  // Check if any opposing piece can reach the general
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === opp) {
        const rawMoves = getRawMoves(board, {
          col: c as Position["col"],
          row: r as Position["row"],
        });
        if (rawMoves.some((m) => m.col === generalPos.col && m.row === generalPos.row)) {
          return true;
        }
      }
    }
  }

  return false;
}

// ── Legal Move Generation ────────────────────────────────────────────────────

/** Apply a move to a board (returns new board, does not mutate) */
export function applyMove(board: BoardState, from: Position, to: Position): BoardState {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = null;
  newBoard[to.row][to.col] = piece;
  return newBoard;
}

/** Get all legal moves for a piece at the given position */
export function getLegalMoves(board: BoardState, pos: Position): Position[] {
  const piece = pieceAt(board, pos);
  if (!piece) return [];

  const rawMoves = getRawMoves(board, pos);

  // Filter: move must not leave own general in check
  return rawMoves.filter((to) => {
    const newBoard = applyMove(board, pos, to);
    return !isInCheck(newBoard, piece.side);
  });
}

/** Check if a side has any legal moves at all */
export function hasLegalMoves(board: BoardState, side: Side): boolean {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === side) {
        const legal = getLegalMoves(board, {
          col: c as Position["col"],
          row: r as Position["row"],
        });
        if (legal.length > 0) return true;
      }
    }
  }
  return false;
}

// ── Game State Evaluation ────────────────────────────────────────────────────

export type GameResult =
  | { type: "active" }
  | { type: "check"; side: Side } // `side` is the side that is IN check
  | { type: "checkmate"; winner: Side }
  | { type: "stalemate" };

/** Evaluate the current board state after a move has been made */
export function evaluatePosition(board: BoardState, sideToMove: Side): GameResult {
  const inCheck = isInCheck(board, sideToMove);
  const hasMoves = hasLegalMoves(board, sideToMove);

  if (!hasMoves) {
    if (inCheck) {
      return { type: "checkmate", winner: opponent(sideToMove) };
    }
    return { type: "stalemate" };
  }

  if (inCheck) {
    return { type: "check", side: sideToMove };
  }

  return { type: "active" };
}

// ── Notation ─────────────────────────────────────────────────────────────────

/** Generate simple notation string for a move */
export function toNotation(
  board: BoardState,
  from: Position,
  to: Position,
): string {
  const piece = pieceAt(board, from);
  if (!piece) return "??";

  const char = pieceChar(piece.type, piece.side);
  const captured = pieceAt(board, to);
  const separator = captured ? "×" : "-";

  // Simple coordinate notation: 車(4,0)->(4,9) → 車45→49
  const fromStr = `${from.col}${from.row}`;
  const toStr = `${to.col}${to.row}`;

  return `${char}${fromStr}${separator}${toStr}`;
}

/** Create a full Move object */
export function createMove(
  board: BoardState,
  from: Position,
  to: Position,
): Move | null {
  const piece = pieceAt(board, from);
  if (!piece) return null;

  const captured = pieceAt(board, to) ?? undefined;
  const notation = toNotation(board, from, to);

  return {
    piece,
    from,
    to,
    captured,
    notation,
    timestamp: Date.now(),
  };
}
