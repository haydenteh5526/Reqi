"use client";

import { motion } from "framer-motion";

/**
 * Placeholder for the 9×10 Xiangqi board.
 * This will be replaced with the full interactive board in Phase 2.
 * For now it renders the correct grid lines and intersection points
 * to validate proportions.
 */

const COLS = 9;
const ROWS = 10;
const CELL = 56; // px per cell
const PAD = 28; // board padding
const BOARD_W = (COLS - 1) * CELL;
const BOARD_H = (ROWS - 1) * CELL;
const RIVER_Y_TOP = 4; // River sits between row 4 and row 5

export function BoardPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-center justify-center"
    >
      <div
        className="relative rounded-xl border border-white/5 bg-board-surface shadow-2xl"
        style={{
          width: BOARD_W + PAD * 2,
          height: BOARD_H + PAD * 2,
        }}
      >
        <svg
          width={BOARD_W + PAD * 2}
          height={BOARD_H + PAD * 2}
          viewBox={`0 0 ${BOARD_W + PAD * 2} ${BOARD_H + PAD * 2}`}
          className="absolute inset-0"
        >
          {/* ── Grid Lines ──────────────────────────────────────── */}
          {/* Horizontal lines */}
          {Array.from({ length: ROWS }).map((_, row) => (
            <line
              key={`h-${row}`}
              x1={PAD}
              y1={PAD + row * CELL}
              x2={PAD + BOARD_W}
              y2={PAD + row * CELL}
              stroke="#5a5550"
              strokeWidth={1}
            />
          ))}

          {/* Vertical lines — top half (rows 0–4) */}
          {Array.from({ length: COLS }).map((_, col) => (
            <line
              key={`vt-${col}`}
              x1={PAD + col * CELL}
              y1={PAD}
              x2={PAD + col * CELL}
              y2={PAD + RIVER_Y_TOP * CELL}
              stroke="#5a5550"
              strokeWidth={1}
            />
          ))}

          {/* Vertical lines — bottom half (rows 5–9) */}
          {Array.from({ length: COLS }).map((_, col) => (
            <line
              key={`vb-${col}`}
              x1={PAD + col * CELL}
              y1={PAD + (RIVER_Y_TOP + 1) * CELL}
              x2={PAD + col * CELL}
              y2={PAD + BOARD_H}
              stroke="#5a5550"
              strokeWidth={1}
            />
          ))}

          {/* Left and right border span the full height */}
          <line
            x1={PAD}
            y1={PAD}
            x2={PAD}
            y2={PAD + BOARD_H}
            stroke="#5a5550"
            strokeWidth={1}
          />
          <line
            x1={PAD + BOARD_W}
            y1={PAD}
            x2={PAD + BOARD_W}
            y2={PAD + BOARD_H}
            stroke="#5a5550"
            strokeWidth={1}
          />

          {/* ── Palace Diagonals ────────────────────────────────── */}
          {/* Top Palace (cols 3–5, rows 0–2) */}
          <line
            x1={PAD + 3 * CELL} y1={PAD}
            x2={PAD + 5 * CELL} y2={PAD + 2 * CELL}
            stroke="#5a5550" strokeWidth={1}
          />
          <line
            x1={PAD + 5 * CELL} y1={PAD}
            x2={PAD + 3 * CELL} y2={PAD + 2 * CELL}
            stroke="#5a5550" strokeWidth={1}
          />
          {/* Bottom Palace (cols 3–5, rows 7–9) */}
          <line
            x1={PAD + 3 * CELL} y1={PAD + 7 * CELL}
            x2={PAD + 5 * CELL} y2={PAD + 9 * CELL}
            stroke="#5a5550" strokeWidth={1}
          />
          <line
            x1={PAD + 5 * CELL} y1={PAD + 7 * CELL}
            x2={PAD + 3 * CELL} y2={PAD + 9 * CELL}
            stroke="#5a5550" strokeWidth={1}
          />

          {/* ── River ───────────────────────────────────────────── */}
          <rect
            x={PAD + 1}
            y={PAD + RIVER_Y_TOP * CELL + 1}
            width={BOARD_W - 2}
            height={CELL - 2}
            fill="rgba(163, 38, 42, 0.04)"
            rx={2}
          />
          <text
            x={PAD + BOARD_W / 2}
            y={PAD + RIVER_Y_TOP * CELL + CELL / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="select-none fill-text-muted text-xs font-medium tracking-[0.5em]"
          >
            楚 河 {"     "} 漢 界
          </text>

          {/* ── Intersection Dots ───────────────────────────────── */}
          {getIntersectionPoints().map((pt, i) => (
            <circle
              key={`dot-${i}`}
              cx={PAD + pt.col * CELL}
              cy={PAD + pt.row * CELL}
              r={3}
              fill="#5a5550"
            />
          ))}
        </svg>

        {/* ── Placeholder Pieces ────────────────────────────────── */}
        {getInitialPieces().map((piece, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: piece.side === "red" ? 12 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            className="absolute flex items-center justify-center"
            style={{
              left: PAD + piece.col * CELL - 18,
              top: PAD + piece.row * CELL - 18,
              width: 36,
              height: 36,
            }}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold shadow-md ${
                piece.side === "red"
                  ? "border-accent/60 bg-board-panel text-accent"
                  : "border-text-muted/40 bg-board-panel text-text-primary"
              }`}
            >
              {piece.char}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Helper: intersection dots at soldier/cannon positions ────────────────────

function getIntersectionPoints() {
  const points: { col: number; row: number }[] = [];
  // Cannon positions
  [1, 7].forEach((col) => {
    [2, 7].forEach((row) => points.push({ col, row }));
  });
  // Soldier positions
  [0, 2, 4, 6, 8].forEach((col) => {
    [3, 6].forEach((row) => points.push({ col, row }));
  });
  return points;
}

// ── Helper: starting piece positions ─────────────────────────────────────────

interface PlaceholderPiece {
  char: string;
  col: number;
  row: number;
  side: "red" | "black";
}

function getInitialPieces(): PlaceholderPiece[] {
  const pieces: PlaceholderPiece[] = [];

  // Black pieces (top, rows 0–4)
  const blackBackRow = ["車", "馬", "象", "士", "將", "士", "象", "馬", "車"];
  blackBackRow.forEach((char, col) =>
    pieces.push({ char, col, row: 0, side: "black" }),
  );
  pieces.push({ char: "砲", col: 1, row: 2, side: "black" });
  pieces.push({ char: "砲", col: 7, row: 2, side: "black" });
  [0, 2, 4, 6, 8].forEach((col) =>
    pieces.push({ char: "卒", col, row: 3, side: "black" }),
  );

  // Red pieces (bottom, rows 5–9)
  const redBackRow = ["俥", "傌", "相", "仕", "帥", "仕", "相", "傌", "俥"];
  redBackRow.forEach((char, col) =>
    pieces.push({ char, col, row: 9, side: "red" }),
  );
  pieces.push({ char: "炮", col: 1, row: 7, side: "red" });
  pieces.push({ char: "炮", col: 7, row: 7, side: "red" });
  [0, 2, 4, 6, 8].forEach((col) =>
    pieces.push({ char: "兵", col, row: 6, side: "red" }),
  );

  return pieces;
}
