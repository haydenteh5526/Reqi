"use client";

// =============================================================================
// Player Info Bar — Name, rating, optional clock, captured pieces, material advantage
// =============================================================================

import { useEffect, useState } from "react";
import type { Side, Piece, PieceType } from "@xiangqi/shared";

// Material values for point advantage calculation
const MATERIAL_POINTS: Record<PieceType, number> = {
  general: 0,
  chariot: 9,
  cannon: 4.5,
  horse: 4,
  elephant: 2,
  advisor: 2,
  soldier: 1,
};

interface PlayerInfoProps {
  side: Side;
  name: string;
  rating?: number;
  /** Pass null/undefined to hide the clock entirely */
  timeMs?: number | null;
  isActive: boolean;
  capturedPieces: Piece[];
  /** Material advantage in points (positive = this player leads). Shown next to captures. */
  materialAdvantage?: number;
  className?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PlayerInfo({
  side,
  name,
  rating,
  timeMs,
  isActive,
  capturedPieces,
  materialAdvantage = 0,
  className = "",
}: PlayerInfoProps) {
  // Force re-render every second when active for smooth clock
  const [, setTick] = useState(0);
  const showClock = timeMs != null;
  useEffect(() => {
    if (!isActive || !showClock) return;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [isActive, showClock]);

  const isLowTime = showClock && (timeMs ?? 0) < 30_000;
  const isRed = side === "red";

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-4 py-2 ${
        isActive ? "bg-white/[0.06]" : "bg-transparent"
      } ${className}`}
    >
      {/* Left: avatar + name + rating + captured pieces + advantage */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            isRed
              ? "bg-[#c4473b]/20 text-[#c4473b]"
              : "bg-white/10 text-white"
          }`}
        >
          {isRed ? "紅" : "黑"}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">{name}</span>
          {rating !== undefined && (
            <span className="text-[11px] text-text-muted">({rating})</span>
          )}
        </div>
        {/* Captured pieces */}
        {capturedPieces.length > 0 && (
          <div className="ml-2 flex items-center gap-0.5">
            {capturedPieces.map((p, i) => (
              <span
                key={i}
                className={`text-xs ${
                  p.side === "red" ? "text-[#c4473b]" : "text-zinc-400"
                }`}
              >
                {PIECE_CHARS[p.side][p.type]}
              </span>
            ))}
            {/* Material advantage badge */}
            {materialAdvantage > 0 && (
              <span className="ml-1 text-[11px] font-bold text-emerald-400">
                +{materialAdvantage % 1 === 0 ? materialAdvantage : materialAdvantage.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: clock (optional) */}
      {showClock && (
        <div
          className={`rounded-md px-3 py-1.5 font-mono text-lg font-bold tabular-nums ${
            isActive
              ? isLowTime
                ? "animate-pulse bg-red-600/20 text-red-400"
                : "bg-white/10 text-white"
              : "bg-white/[0.04] text-text-muted"
          }`}
        >
          {formatTime(timeMs ?? 0)}
        </div>
      )}
    </div>
  );
}

/** Calculate material advantage from captured pieces perspective */
export function computeMaterialAdvantage(
  capturedByPlayer: Piece[],
  capturedByOpponent: Piece[],
): number {
  const playerPts = capturedByPlayer.reduce(
    (sum, p) => sum + (MATERIAL_POINTS[p.type] ?? 0),
    0,
  );
  const opponentPts = capturedByOpponent.reduce(
    (sum, p) => sum + (MATERIAL_POINTS[p.type] ?? 0),
    0,
  );
  return playerPts - opponentPts;
}

const PIECE_CHARS: Record<Side, Record<string, string>> = {
  red: {
    general: "帥",
    advisor: "仕",
    elephant: "相",
    horse: "傌",
    chariot: "俥",
    cannon: "炮",
    soldier: "兵",
  },
  black: {
    general: "將",
    advisor: "士",
    elephant: "象",
    horse: "馬",
    chariot: "車",
    cannon: "砲",
    soldier: "卒",
  },
};
