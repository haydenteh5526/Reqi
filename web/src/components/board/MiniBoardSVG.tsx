"use client";

// ── Reusable Mini Board SVG Component ────────────────────────────────────────
// Renders a miniature 9×10 Xiangqi board with Chinese character pieces.
// Accepts a theme and piece array — used by BoardPreviews, RightSidebar, etc.

import type { PieceDef } from "@/lib/pieces";
import type { BoardTheme } from "@/lib/board-themes";
import { DEFAULT_BOARD_THEME } from "@/lib/board-themes";

interface MiniBoardProps {
  pieces: PieceDef[];
  theme?: BoardTheme;
  /** SVG border-radius class */
  className?: string;
  /** Unique ID prefix to avoid SVG <defs> collisions when rendering multiple boards */
  id?: string;
}

export function MiniBoardSVG({
  pieces,
  theme = DEFAULT_BOARD_THEME,
  className = "rounded-lg",
  id = "board",
}: MiniBoardProps) {
  const cols = 9;
  const rows = 10;
  const cell = 22;
  const pad = 14;
  const w = (cols - 1) * cell;
  const h = (rows - 1) * cell;
  const pieceRadius = 9;

  const gradId = `${id}-grad`;
  const shadowId = `${id}-shadow`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w + pad * 2} ${h + pad * 2}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor={theme.boardBgCenter} />
          <stop offset="100%" stopColor={theme.boardBgEdge} />
        </radialGradient>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1"
            floodColor="#000"
            floodOpacity={theme.pieceShadowOpacity}
          />
        </filter>
      </defs>

      {/* Board background */}
      <rect
        width={w + pad * 2}
        height={h + pad * 2}
        fill={`url(#${gradId})`}
        rx={6}
      />
      {/* Inner border */}
      <rect
        x={pad - 3}
        y={pad - 3}
        width={w + 6}
        height={h + 6}
        fill="none"
        stroke={theme.boardBorder}
        strokeWidth={1}
        rx={2}
      />

      {/* ── Grid lines ─────────────────────────── */}
      {/* Horizontal */}
      {Array.from({ length: rows }).map((_, row) => (
        <line
          key={`h-${row}`}
          x1={pad}
          y1={pad + row * cell}
          x2={pad + w}
          y2={pad + row * cell}
          stroke={theme.gridColor}
          strokeWidth={theme.gridWidth}
        />
      ))}

      {/* Vertical — top half */}
      {Array.from({ length: cols }).map((_, col) => (
        <line
          key={`vt-${col}`}
          x1={pad + col * cell}
          y1={pad}
          x2={pad + col * cell}
          y2={pad + 4 * cell}
          stroke={theme.gridColor}
          strokeWidth={theme.gridWidth}
        />
      ))}

      {/* Vertical — bottom half */}
      {Array.from({ length: cols }).map((_, col) => (
        <line
          key={`vb-${col}`}
          x1={pad + col * cell}
          y1={pad + 5 * cell}
          x2={pad + col * cell}
          y2={pad + h}
          stroke={theme.gridColor}
          strokeWidth={theme.gridWidth}
        />
      ))}

      {/* Left & right border spanning river */}
      <line x1={pad} y1={pad} x2={pad} y2={pad + h} stroke={theme.gridColor} strokeWidth={theme.gridWidth} />
      <line x1={pad + w} y1={pad} x2={pad + w} y2={pad + h} stroke={theme.gridColor} strokeWidth={theme.gridWidth} />

      {/* River text */}
      <text
        x={pad + w * 0.28}
        y={pad + 4.5 * cell + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.riverTextColor}
        fontSize="8"
        fontFamily="'KaiTi', 'STKaiti', serif"
        opacity={theme.riverTextOpacity}
      >
        楚河
      </text>
      <text
        x={pad + w * 0.72}
        y={pad + 4.5 * cell + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.riverTextColor}
        fontSize="8"
        fontFamily="'KaiTi', 'STKaiti', serif"
        opacity={theme.riverTextOpacity}
      >
        漢界
      </text>

      {/* Palace diagonals — top */}
      <line x1={pad + 3 * cell} y1={pad} x2={pad + 5 * cell} y2={pad + 2 * cell} stroke={theme.gridColor} strokeWidth={theme.gridWidth} />
      <line x1={pad + 5 * cell} y1={pad} x2={pad + 3 * cell} y2={pad + 2 * cell} stroke={theme.gridColor} strokeWidth={theme.gridWidth} />
      {/* Palace diagonals — bottom */}
      <line x1={pad + 3 * cell} y1={pad + 7 * cell} x2={pad + 5 * cell} y2={pad + 9 * cell} stroke={theme.gridColor} strokeWidth={theme.gridWidth} />
      <line x1={pad + 5 * cell} y1={pad + 7 * cell} x2={pad + 3 * cell} y2={pad + 9 * cell} stroke={theme.gridColor} strokeWidth={theme.gridWidth} />

      {/* ── Pieces ────────────────────────────── */}
      {pieces.map((piece, i) => {
        const cx = pad + piece.col * cell;
        const cy = pad + piece.row * cell;
        const isRed = piece.side === "red";
        const colors = isRed ? theme.redPiece : theme.blackPiece;

        return (
          <g key={i} filter={`url(#${shadowId})`}>
            {/* Piece disc */}
            <circle
              cx={cx}
              cy={cy}
              r={pieceRadius}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={1.2}
            />
            {/* Inner ring */}
            <circle
              cx={cx}
              cy={cy}
              r={pieceRadius - 2}
              fill="none"
              stroke={colors.innerRing}
              strokeWidth={0.6}
            />
            {/* Character */}
            <text
              x={cx}
              y={cy + 0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fill={colors.text}
              fontSize="9"
              fontWeight="bold"
              fontFamily="'KaiTi', 'STKaiti', 'SimSun', 'Noto Serif CJK SC', serif"
            >
              {piece.char}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Smaller version for profile cards and tight spaces */
export function MiniProfileBoardSVG({
  pieces,
  theme = DEFAULT_BOARD_THEME,
  size = 160,
  id = "profile-board",
}: {
  pieces: PieceDef[];
  theme?: BoardTheme;
  size?: number;
  id?: string;
}) {
  const pad = 12;
  const inner = size - pad * 2;
  const cellX = inner / 8;
  const cellY = inner / 9;
  const pr = 6;

  const gradId = `${id}-grad`;
  const shadowId = `${id}-shadow`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor={theme.boardBgCenter} />
          <stop offset="100%" stopColor={theme.boardBgEdge} />
        </radialGradient>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="0.5"
            stdDeviation="0.8"
            floodColor="#000"
            floodOpacity={theme.pieceShadowOpacity}
          />
        </filter>
      </defs>
      <rect width={size} height={size} fill={`url(#${gradId})`} rx={8} />

      {/* Grid */}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`h${i}`} x1={pad} y1={pad + i * cellY} x2={pad + inner} y2={pad + i * cellY} stroke={theme.gridColor} strokeWidth={0.4} />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`v${i}`} x1={pad + i * cellX} y1={pad} x2={pad + i * cellX} y2={pad + 4 * cellY} stroke={theme.gridColor} strokeWidth={0.4} />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`vb${i}`} x1={pad + i * cellX} y1={pad + 5 * cellY} x2={pad + i * cellX} y2={pad + inner} stroke={theme.gridColor} strokeWidth={0.4} />
      ))}
      <line x1={pad} y1={pad} x2={pad} y2={pad + inner} stroke={theme.gridColor} strokeWidth={0.4} />
      <line x1={pad + inner} y1={pad} x2={pad + inner} y2={pad + inner} stroke={theme.gridColor} strokeWidth={0.4} />

      {/* Palace diagonals */}
      <line x1={pad + 3 * cellX} y1={pad} x2={pad + 5 * cellX} y2={pad + 2 * cellY} stroke={theme.gridColor} strokeWidth={0.4} />
      <line x1={pad + 5 * cellX} y1={pad} x2={pad + 3 * cellX} y2={pad + 2 * cellY} stroke={theme.gridColor} strokeWidth={0.4} />
      <line x1={pad + 3 * cellX} y1={pad + 7 * cellY} x2={pad + 5 * cellX} y2={pad + 9 * cellY} stroke={theme.gridColor} strokeWidth={0.4} />
      <line x1={pad + 5 * cellX} y1={pad + 7 * cellY} x2={pad + 3 * cellX} y2={pad + 9 * cellY} stroke={theme.gridColor} strokeWidth={0.4} />

      {/* Pieces */}
      {pieces.map((piece, i) => {
        const cx = pad + piece.col * cellX;
        const cy = pad + piece.row * cellY;
        const isRed = piece.side === "red";
        const colors = isRed ? theme.redPiece : theme.blackPiece;
        return (
          <g key={i} filter={`url(#${shadowId})`}>
            <circle cx={cx} cy={cy} r={pr} fill={colors.fill} stroke={colors.stroke} strokeWidth={0.8} />
            <circle cx={cx} cy={cy} r={pr - 1.5} fill="none" stroke={colors.innerRing} strokeWidth={0.3} />
            <text
              x={cx}
              y={cy + 0.3}
              textAnchor="middle"
              dominantBaseline="central"
              fill={colors.text}
              fontSize="6"
              fontWeight="bold"
              fontFamily="'KaiTi', 'STKaiti', 'SimSun', serif"
            >
              {piece.char}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
