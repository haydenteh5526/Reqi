"use client";

import type { MoveAnalysis } from "@/lib/engine";

interface EvalGraphProps {
  moves: MoveAnalysis[];
  currentIndex: number;
  onClickMove: (index: number) => void;
}

const WIDTH = 280;
const HEIGHT = 80;
const PADDING = 2;

export function EvalGraph({ moves, currentIndex, onClickMove }: EvalGraphProps) {
  if (moves.length === 0) return null;

  // Convert scores to normalized values (-1 to 1)
  const values = moves.map((m) => {
    const s = m.evaluation.score;
    if (s.type === "mate") return s.value > 0 ? 1 : -1;
    return Math.max(-1, Math.min(1, s.value / 500));
  });

  const stepX = (WIDTH - PADDING * 2) / Math.max(values.length - 1, 1);

  // Build SVG path
  const points = values.map((v, i) => {
    const x = PADDING + i * stepX;
    const y = PADDING + ((1 - v) / 2) * (HEIGHT - PADDING * 2);
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // Fill area: path down to midline
  const midY = HEIGHT / 2;
  const fillAbove = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${midY} L ${points[0].x.toFixed(1)} ${midY} Z`;

  // Current move indicator
  const cursorX = currentIndex > 0 && currentIndex <= moves.length
    ? PADDING + (currentIndex - 1) * stepX
    : null;

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="cursor-crosshair"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
          const idx = Math.round((x - PADDING) / stepX);
          const clamped = Math.max(0, Math.min(moves.length - 1, idx));
          onClickMove(clamped + 1);
        }}
      >
        {/* Background */}
        <rect width={WIDTH} height={HEIGHT} fill="#1a1816" rx={4} />

        {/* Midline (0 eval) */}
        <line x1={0} y1={midY} x2={WIDTH} y2={midY} stroke="#3a3632" strokeWidth={0.5} />

        {/* Fill area */}
        <path d={fillAbove} fill="rgba(129, 182, 76, 0.15)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#81b64c" strokeWidth={1.5} strokeLinejoin="round" />

        {/* Current position cursor */}
        {cursorX !== null && (
          <line x1={cursorX} y1={0} x2={cursorX} y2={HEIGHT} stroke="#e8e6e3" strokeWidth={1} opacity={0.5} />
        )}
      </svg>
    </div>
  );
}
