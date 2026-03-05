"use client";

// =============================================================================
// Interactive Xiangqi Board
// Full 9×10 board with click-to-select, click-to-move, legal move highlights,
// last-move highlight, check indicator, coordinates, and board themes.
// =============================================================================

import { useCallback, useMemo } from "react";
import type { BoardState, Position, Side, PieceType } from "@xiangqi/shared";
import { pieceChar, getLegalMoves } from "@xiangqi/shared";
import type { BoardTheme } from "@/lib/board-themes";
import { DEFAULT_BOARD_THEME } from "@/lib/board-themes";

// ── Dimensions ───────────────────────────────────────────────────────────────

const COLS = 9;
const ROWS = 10;
const CELL = 68; // px between intersections (bigger board)
const PAD = 44; // board padding (extra room for coordinates)
const PIECE_R = 27; // piece radius
const BOARD_W = (COLS - 1) * CELL;
const BOARD_H = (ROWS - 1) * CELL;
const SVG_W = BOARD_W + PAD * 2;
const SVG_H = BOARD_H + PAD * 2;

// Column labels (a–i from left)
const COL_LABELS = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

// ── Props ────────────────────────────────────────────────────────────────────

export interface InteractiveBoardProps {
  board: BoardState;
  turn: Side;
  /** Which side the local player controls (null = spectator) */
  playerSide: Side | null;
  selectedPos: Position | null;
  legalMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  checkSide: Side | null;
  theme?: BoardTheme;
  /** If true, board is non-interactive (e.g. viewing history) */
  disabled?: boolean;
  /** If true, flip coordinates for black perspective */
  flipped?: boolean;
  onSelectSquare: (pos: Position) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function InteractiveBoard({
  board,
  turn,
  playerSide,
  selectedPos,
  legalMoves,
  lastMove,
  checkSide,
  theme = DEFAULT_BOARD_THEME,
  disabled = false,
  flipped = false,
  onSelectSquare,
}: InteractiveBoardProps) {
  // Pre-compute sets for fast lookup
  const legalSet = useMemo(
    () => new Set(legalMoves.map((m) => `${m.col},${m.row}`)),
    [legalMoves],
  );

  const lastMoveSet = useMemo(() => {
    if (!lastMove) return new Set<string>();
    return new Set([
      `${lastMove.from.col},${lastMove.from.row}`,
      `${lastMove.to.col},${lastMove.to.row}`,
    ]);
  }, [lastMove]);

  // Find check general position
  const checkPos = useMemo(() => {
    if (!checkSide) return null;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = board[r]?.[c];
        if (p && p.type === "general" && p.side === checkSide) {
          return `${c},${r}`;
        }
      }
    }
    return null;
  }, [board, checkSide]);

  const handleClick = useCallback(
    (col: number, row: number) => {
      if (disabled) return;
      onSelectSquare({ col, row } as Position);
    },
    [onSelectSquare, disabled],
  );

  return (
    <div className="inline-block rounded-xl shadow-2xl shadow-black/40">
      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="select-none rounded-xl"
        style={{ maxHeight: "calc(100vh - 40px)" }}
      >
        <defs>
          <radialGradient id="ib-bg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor={theme.boardBgCenter} />
            <stop offset="100%" stopColor={theme.boardBgEdge} />
          </radialGradient>
          <filter id="ib-piece-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="1.5"
              stdDeviation="2"
              floodColor="#000"
              floodOpacity={theme.pieceShadowOpacity}
            />
          </filter>
          <filter id="ib-glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="0.7" />
          </filter>
          <filter id="ib-glow-select" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#86efac" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Board background */}
        <rect width={SVG_W} height={SVG_H} fill="url(#ib-bg)" rx={12} />

        {/* Board border */}
        <rect
          x={PAD - 4}
          y={PAD - 4}
          width={BOARD_W + 8}
          height={BOARD_H + 8}
          fill="none"
          stroke={theme.boardBorder}
          strokeWidth={1.5}
          rx={3}
        />

        {/* ── Grid ──────────────────────────────────── */}
        <BoardGrid theme={theme} />

        {/* ── Coordinates ───────────────────────────── */}
        <BoardCoordinates theme={theme} flipped={flipped} />

        {/* ── Highlights ────────────────────────────── */}
        {/* Last move highlights */}
        {lastMove && (
          <>
            <SquareHighlight col={lastMove.from.col} row={lastMove.from.row} color="rgba(251, 191, 36, 0.18)" />
            <SquareHighlight col={lastMove.to.col} row={lastMove.to.row} color="rgba(251, 191, 36, 0.30)" />
          </>
        )}

        {/* Selected piece highlight — green glow ring */}
        {selectedPos && (
          <>
            <circle
              cx={PAD + selectedPos.col * CELL}
              cy={PAD + selectedPos.row * CELL}
              r={PIECE_R + 4}
              fill="none"
              stroke="#4ade80"
              strokeWidth={3}
              opacity={0.8}
              filter="url(#ib-glow-select)"
            />
          </>
        )}

        {/* Legal move indicators — Chess.com style */}
        {legalMoves.map((m) => {
          const cx = PAD + m.col * CELL;
          const cy = PAD + m.row * CELL;
          const isCapture = board[m.row]?.[m.col] != null;

          if (isCapture) {
            // Capture: corner triangles (4 corners of the square)
            const s = CELL * 0.45; // triangle size
            return (
              <g key={`lm-${m.col}-${m.row}`} opacity={0.7}>
                {/* Top-left triangle */}
                <polygon
                  points={`${cx - s},${cy - s} ${cx - s + 14},${cy - s} ${cx - s},${cy - s + 14}`}
                  fill="rgba(239, 68, 68, 0.55)"
                />
                {/* Top-right triangle */}
                <polygon
                  points={`${cx + s},${cy - s} ${cx + s - 14},${cy - s} ${cx + s},${cy - s + 14}`}
                  fill="rgba(239, 68, 68, 0.55)"
                />
                {/* Bottom-left triangle */}
                <polygon
                  points={`${cx - s},${cy + s} ${cx - s + 14},${cy + s} ${cx - s},${cy + s - 14}`}
                  fill="rgba(239, 68, 68, 0.55)"
                />
                {/* Bottom-right triangle */}
                <polygon
                  points={`${cx + s},${cy + s} ${cx + s - 14},${cy + s} ${cx + s},${cy + s - 14}`}
                  fill="rgba(239, 68, 68, 0.55)"
                />
              </g>
            );
          }
          // Non-capture: large translucent dot
          return (
            <circle
              key={`lm-${m.col}-${m.row}`}
              cx={cx}
              cy={cy}
              r={14}
              fill="rgba(134, 239, 172, 0.45)"
            />
          );
        })}

        {/* Check indicator (red glow around general) */}
        {checkPos && (() => {
          const [cc, cr] = checkPos.split(",").map(Number);
          return (
            <circle
              cx={PAD + cc * CELL}
              cy={PAD + cr * CELL}
              r={PIECE_R + 5}
              fill="none"
              stroke="#ef4444"
              strokeWidth={3}
              opacity={0.85}
              filter="url(#ib-glow-red)"
            />
          );
        })()}

        {/* ── Pieces ────────────────────────────────── */}
        {Array.from({ length: 10 }).map((_, row) =>
          Array.from({ length: 9 }).map((_, col) => {
            const piece = board[row]?.[col];
            if (!piece) return null;

            const cx = PAD + col * CELL;
            const cy = PAD + row * CELL;
            const isRed = piece.side === "red";
            const colors = isRed ? theme.redPiece : theme.blackPiece;
            const isSelected =
              selectedPos?.col === col && selectedPos?.row === row;
            const char = pieceChar(piece.type, piece.side);

            return (
              <g
                key={`p-${col}-${row}`}
                filter={isSelected ? "url(#ib-glow-select)" : "url(#ib-piece-shadow)"}
                style={{ cursor: disabled ? "default" : "pointer" }}
              >
                {/* Piece disc */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={PIECE_R}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={2}
                />
                {/* Inner ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={PIECE_R - 4}
                  fill="none"
                  stroke={colors.innerRing}
                  strokeWidth={1}
                />
                {/* Character */}
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={colors.text}
                  fontSize="22"
                  fontWeight="bold"
                  fontFamily="'KaiTi', 'STKaiti', 'SimSun', 'Noto Serif CJK SC', serif"
                >
                  {char}
                </text>
              </g>
            );
          }),
        )}

        {/* ── Click Targets (invisible overlay for all intersections) ── */}
        {Array.from({ length: 10 }).map((_, row) =>
          Array.from({ length: 9 }).map((_, col) => (
            <rect
              key={`click-${col}-${row}`}
              x={PAD + col * CELL - CELL / 2}
              y={PAD + row * CELL - CELL / 2}
              width={CELL}
              height={CELL}
              fill="transparent"
              style={{ cursor: disabled ? "default" : "pointer" }}
              onClick={() => handleClick(col, row)}
            />
          )),
        )}

        {/* History viewing overlay */}
        {disabled && (
          <rect
            width={SVG_W}
            height={SVG_H}
            fill="rgba(0,0,0,0.05)"
            rx={12}
            pointerEvents="none"
          />
        )}
      </svg>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function BoardCoordinates({ theme, flipped }: { theme: BoardTheme; flipped: boolean }) {
  const colLabels = flipped ? [...COL_LABELS].reverse() : COL_LABELS;
  // Row labels: 0 (top) to 9 (bottom) from red perspective
  // Chess.com-style: show 1-10 for red side (bottom=1), reversed for black
  const rowLabels = flipped
    ? Array.from({ length: 10 }, (_, i) => `${i + 1}`)
    : Array.from({ length: 10 }, (_, i) => `${10 - i}`);

  return (
    <>
      {/* Column labels — bottom */}
      {colLabels.map((label, i) => (
        <text
          key={`col-b-${i}`}
          x={PAD + i * CELL}
          y={PAD + BOARD_H + 28}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={theme.gridColor}
          fontSize="12"
          fontFamily="'Inter', sans-serif"
          fontWeight="600"
          opacity={0.5}
        >
          {label}
        </text>
      ))}
      {/* Column labels — top */}
      {colLabels.map((label, i) => (
        <text
          key={`col-t-${i}`}
          x={PAD + i * CELL}
          y={PAD - 20}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={theme.gridColor}
          fontSize="12"
          fontFamily="'Inter', sans-serif"
          fontWeight="600"
          opacity={0.5}
        >
          {label}
        </text>
      ))}
      {/* Row labels — left */}
      {rowLabels.map((label, i) => (
        <text
          key={`row-l-${i}`}
          x={PAD - 22}
          y={PAD + i * CELL}
          textAnchor="middle"
          dominantBaseline="central"
          fill={theme.gridColor}
          fontSize="12"
          fontFamily="'Inter', sans-serif"
          fontWeight="600"
          opacity={0.5}
        >
          {label}
        </text>
      ))}
      {/* Row labels — right */}
      {rowLabels.map((label, i) => (
        <text
          key={`row-r-${i}`}
          x={PAD + BOARD_W + 22}
          y={PAD + i * CELL}
          textAnchor="middle"
          dominantBaseline="central"
          fill={theme.gridColor}
          fontSize="12"
          fontFamily="'Inter', sans-serif"
          fontWeight="600"
          opacity={0.5}
        >
          {label}
        </text>
      ))}
    </>
  );
}

function BoardGrid({ theme }: { theme: BoardTheme }) {
  const gw = theme.gridWidth * 1.5; // Slightly thicker for the full board

  return (
    <>
      {/* Horizontal lines */}
      {Array.from({ length: ROWS }).map((_, row) => (
        <line
          key={`h-${row}`}
          x1={PAD}
          y1={PAD + row * CELL}
          x2={PAD + BOARD_W}
          y2={PAD + row * CELL}
          stroke={theme.gridColor}
          strokeWidth={gw}
        />
      ))}

      {/* Vertical — top half */}
      {Array.from({ length: COLS }).map((_, col) => (
        <line
          key={`vt-${col}`}
          x1={PAD + col * CELL}
          y1={PAD}
          x2={PAD + col * CELL}
          y2={PAD + 4 * CELL}
          stroke={theme.gridColor}
          strokeWidth={gw}
        />
      ))}

      {/* Vertical — bottom half */}
      {Array.from({ length: COLS }).map((_, col) => (
        <line
          key={`vb-${col}`}
          x1={PAD + col * CELL}
          y1={PAD + 5 * CELL}
          x2={PAD + col * CELL}
          y2={PAD + BOARD_H}
          stroke={theme.gridColor}
          strokeWidth={gw}
        />
      ))}

      {/* Left & right borders span river */}
      <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + BOARD_H} stroke={theme.gridColor} strokeWidth={gw} />
      <line x1={PAD + BOARD_W} y1={PAD} x2={PAD + BOARD_W} y2={PAD + BOARD_H} stroke={theme.gridColor} strokeWidth={gw} />

      {/* Palace diagonals — top */}
      <line x1={PAD + 3 * CELL} y1={PAD} x2={PAD + 5 * CELL} y2={PAD + 2 * CELL} stroke={theme.gridColor} strokeWidth={gw} />
      <line x1={PAD + 5 * CELL} y1={PAD} x2={PAD + 3 * CELL} y2={PAD + 2 * CELL} stroke={theme.gridColor} strokeWidth={gw} />

      {/* Palace diagonals — bottom */}
      <line x1={PAD + 3 * CELL} y1={PAD + 7 * CELL} x2={PAD + 5 * CELL} y2={PAD + 9 * CELL} stroke={theme.gridColor} strokeWidth={gw} />
      <line x1={PAD + 5 * CELL} y1={PAD + 7 * CELL} x2={PAD + 3 * CELL} y2={PAD + 9 * CELL} stroke={theme.gridColor} strokeWidth={gw} />

      {/* River text */}
      <text
        x={PAD + BOARD_W * 0.28}
        y={PAD + 4.5 * CELL + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.riverTextColor}
        fontSize="20"
        fontFamily="'KaiTi', 'STKaiti', serif"
        opacity={theme.riverTextOpacity}
      >
        楚河
      </text>
      <text
        x={PAD + BOARD_W * 0.72}
        y={PAD + 4.5 * CELL + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.riverTextColor}
        fontSize="20"
        fontFamily="'KaiTi', 'STKaiti', serif"
        opacity={theme.riverTextOpacity}
      >
        漢界
      </text>

      {/* Intersection markers (cannon & soldier positions) */}
      <IntersectionMarkers theme={theme} />
    </>
  );
}

function IntersectionMarkers({ theme }: { theme: BoardTheme }) {
  // Positions that get the L-shaped corner markers
  const positions = [
    // Cannons
    { col: 1, row: 2 }, { col: 7, row: 2 },
    { col: 1, row: 7 }, { col: 7, row: 7 },
    // Soldiers (except edge ones which get partial markers)
    { col: 2, row: 3 }, { col: 4, row: 3 }, { col: 6, row: 3 },
    { col: 2, row: 6 }, { col: 4, row: 6 }, { col: 6, row: 6 },
  ];

  // Edge soldiers only get inner-side markers
  const edgePositions = [
    { col: 0, row: 3, sides: ["right"] },
    { col: 8, row: 3, sides: ["left"] },
    { col: 0, row: 6, sides: ["right"] },
    { col: 8, row: 6, sides: ["left"] },
  ];

  const d = 5; // marker offset from intersection
  const len = 8; // marker arm length
  const sw = theme.gridWidth * 1.2;

  return (
    <>
      {positions.map(({ col, row }) => {
        const cx = PAD + col * CELL;
        const cy = PAD + row * CELL;
        return (
          <g key={`mark-${col}-${row}`} stroke={theme.gridColor} strokeWidth={sw}>
            {/* Top-left */}
            <polyline points={`${cx - d - len},${cy - d} ${cx - d},${cy - d} ${cx - d},${cy - d - len}`} fill="none" />
            {/* Top-right */}
            <polyline points={`${cx + d + len},${cy - d} ${cx + d},${cy - d} ${cx + d},${cy - d - len}`} fill="none" />
            {/* Bottom-left */}
            <polyline points={`${cx - d - len},${cy + d} ${cx - d},${cy + d} ${cx - d},${cy + d + len}`} fill="none" />
            {/* Bottom-right */}
            <polyline points={`${cx + d + len},${cy + d} ${cx + d},${cy + d} ${cx + d},${cy + d + len}`} fill="none" />
          </g>
        );
      })}

      {edgePositions.map(({ col, row, sides }) => {
        const cx = PAD + col * CELL;
        const cy = PAD + row * CELL;
        return (
          <g key={`edge-${col}-${row}`} stroke={theme.gridColor} strokeWidth={sw}>
            {sides.includes("right") && (
              <>
                <polyline points={`${cx + d + len},${cy - d} ${cx + d},${cy - d} ${cx + d},${cy - d - len}`} fill="none" />
                <polyline points={`${cx + d + len},${cy + d} ${cx + d},${cy + d} ${cx + d},${cy + d + len}`} fill="none" />
              </>
            )}
            {sides.includes("left") && (
              <>
                <polyline points={`${cx - d - len},${cy - d} ${cx - d},${cy - d} ${cx - d},${cy - d - len}`} fill="none" />
                <polyline points={`${cx - d - len},${cy + d} ${cx - d},${cy + d} ${cx - d},${cy + d + len}`} fill="none" />
              </>
            )}
          </g>
        );
      })}
    </>
  );
}

function SquareHighlight({
  col,
  row,
  color,
}: {
  col: number;
  row: number;
  color: string;
}) {
  return (
    <rect
      x={PAD + col * CELL - CELL / 2}
      y={PAD + row * CELL - CELL / 2}
      width={CELL}
      height={CELL}
      fill={color}
      rx={4}
    />
  );
}
