"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Position } from "@xiangqi/shared";
import type { MoveClassification } from "@/lib/engine";

// Must match InteractiveBoard dimensions
const CELL = 68;
const PAD = 44;

function posToXY(pos: Position): { x: number; y: number } {
  return { x: PAD + pos.col * CELL, y: PAD + pos.row * CELL };
}

interface BoardOverlaysProps {
  classification?: MoveClassification | null;
  playedMove?: { from: Position; to: Position } | null;
  bestMove?: { from: Position; to: Position } | null;
}

const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: "#1abc9c",
  best: "#96bc4b",
  excellent: "#5c8bb0",
  good: "#96bc4b",
  book: "#a88b65",
  inaccuracy: "#f7c735",
  mistake: "#e79827",
  blunder: "#ca3431",
};

const CLASSIFICATION_ICON: Record<MoveClassification, string> = {
  brilliant: "!!",
  best: "★",
  excellent: "!",
  good: "✓",
  book: "⊞",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

const SVG_W = (9 - 1) * CELL + PAD * 2;
const SVG_H = (10 - 1) * CELL + PAD * 2;

export function BoardOverlays({ classification, playedMove, bestMove }: BoardOverlaysProps) {
  const showBestArrow = bestMove && classification && classification !== "best" && classification !== "excellent" && classification !== "good";
  const playedColor = classification ? CLASSIFICATION_COLORS[classification] : "#81b64c";
  const icon = classification ? CLASSIFICATION_ICON[classification] : "";
  const iconColor = classification ? CLASSIFICATION_COLORS[classification] : "";

  // Position the classification badge at the destination square (top-right of piece)
  const badgePos = playedMove ? posToXY(playedMove.to) : null;

  return (
    <>
      <svg
        className="absolute inset-0 pointer-events-none"
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      >
        <defs>
          <marker id="arrow-best" markerWidth="3.5" markerHeight="3.5" refX="2" refY="1.75" orient="auto">
            <polygon points="0 0, 3.5 1.75, 0 3.5" fill="#26a65b" />
          </marker>
          <marker id="arrow-played" markerWidth="3.5" markerHeight="3.5" refX="2" refY="1.75" orient="auto">
            <polygon points="0 0, 3.5 1.75, 0 3.5" fill={playedColor} />
          </marker>
        </defs>

        <AnimatePresence mode="wait">
          {showBestArrow && (
            <Arrow
              key={`best-${bestMove.from.col}${bestMove.from.row}${bestMove.to.col}${bestMove.to.row}`}
              from={bestMove.from}
              to={bestMove.to}
              color="#26a65b"
              opacity={0.75}
              strokeWidth={8}
              markerId="arrow-best"
            />
          )}

          {playedMove && (
            <Arrow
              key={`played-${playedMove.from.col}${playedMove.from.row}${playedMove.to.col}${playedMove.to.row}`}
              from={playedMove.from}
              to={playedMove.to}
              color={playedColor}
              opacity={0.9}
              strokeWidth={8}
              markerId="arrow-played"
            />
          )}
        </AnimatePresence>
      </svg>

      {/* Classification badge on the piece */}
      <AnimatePresence mode="wait">
        {badgePos && icon && classification && (
          <motion.div
            key={`badge-${playedMove!.to.col}-${playedMove!.to.row}-${classification}`}
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              left: badgePos.x + 10,
              top: badgePos.y - 18,
              width: 22,
              height: 22,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div
              className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
              style={{ backgroundColor: iconColor }}
            >
              {icon}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Animated Arrow ───────────────────────────────────────────────────────────

function Arrow({ from, to, color, opacity, strokeWidth, markerId }: {
  from: Position; to: Position; color: string; opacity: number; strokeWidth: number; markerId: string;
}) {
  const start = posToXY(from);
  const end = posToXY(to);

  // Shorten end so arrowhead doesn't overshoot
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const shorten = 14;
  const endX = end.x - (dx / len) * shorten;
  const endY = end.y - (dy / len) * shorten;

  return (
    <motion.line
      x1={start.x}
      y1={start.y}
      x2={endX}
      y2={endY}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={opacity}
      markerEnd={`url(#${markerId})`}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    />
  );
}
