"use client";

import { Clock, X } from "lucide-react";
import { MOCK_GAMES, MOCK_DAILY_MATCH } from "@/lib/mock-data";
import type { GameRecord } from "@/lib/mock-data";

// ── Daily Games ──────────────────────────────────────────────────────────────

export function DailyGames() {
  return (
    <div className="rounded-lg bg-board-panel ring-1 ring-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-white">
          Daily Games (0)
        </span>
        <div className="flex gap-1.5">
          <ViewToggle active>
            <path d="M2 4h12v1.5H2zm0 3.25h12v1.5H2zm0 3.25h12v1.5H2z" />
          </ViewToggle>
          <ViewToggle>
            <path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z" />
          </ViewToggle>
        </div>
      </div>

      {/* Recommended Match Row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Opponent avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-[13px] font-bold text-accent ring-1 ring-accent/25">
          棋
        </div>

        <div className="flex flex-1 flex-col">
          <span className="text-[13px] font-semibold text-white">
            Recommended Match
          </span>
          <span className="text-[11px] text-text-muted">
            {MOCK_DAILY_MATCH.opponentName} ({MOCK_DAILY_MATCH.opponentRating}) · {MOCK_DAILY_MATCH.label}
          </span>
        </div>

        {/* Dismiss */}
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors duration-150 hover:bg-white/[0.06] hover:text-text-primary">
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>

        {/* Challenge CTA */}
        <button className="flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(34,197,94,0.3)] transition-all duration-150 hover:bg-green-500 hover:shadow-[0_4px_12px_rgba(34,197,94,0.4)] active:scale-[0.97]">
          <SwordsIcon className="h-3.5 w-3.5" />
          Challenge
        </button>
      </div>
    </div>
  );
}

function ViewToggle({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 ${
        active
          ? "text-white"
          : "text-text-muted hover:text-text-secondary"
      }`}
    >
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
        {children}
      </svg>
    </button>
  );
}

function SwordsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" y1="14" x2="9" y2="18" />
      <line x1="7" y1="17" x2="4" y2="20" />
      <line x1="3" y1="19" x2="5" y2="21" />
    </svg>
  );
}

// ── Game History Table ───────────────────────────────────────────────────────
// Uses GameRecord type and MOCK_GAMES from @/lib/mock-data

export function GameHistory() {
  return (
    <div className="rounded-lg bg-board-panel ring-1 ring-white/[0.06]">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-white">
          Game History
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[60px_1fr_60px_72px_56px_96px] items-center gap-2 border-b border-white/[0.06] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        <span />
        <span>Players</span>
        <span className="text-center">Result</span>
        <span className="text-center">Accuracy</span>
        <span className="text-center">Moves</span>
        <span className="text-right">Date</span>
      </div>

      {/* Rows */}
      {MOCK_GAMES.map((game) => {
        const scores = game.result.split("-");
        return (
          <div
            key={game.id}
            className="grid grid-cols-[60px_1fr_60px_72px_56px_96px] items-center gap-2 border-b border-white/[0.04] px-4 py-2.5 transition-colors duration-100 hover:bg-white/[0.02]"
          >
            {/* Time control */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.8} />
              <span className="text-[12px] text-text-secondary">{game.timeControl}</span>
            </div>

            {/* Players */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px]">
                <span className="mr-1">{game.player1.flag}</span>
                <span className="font-bold text-white">{game.player1.name}</span>{" "}
                <span className="text-text-muted">({game.player1.rating})</span>
              </span>
              <span className="text-[12px]">
                <span className="mr-1">{game.player2.flag}</span>
                <span className="font-semibold text-text-secondary">{game.player2.name}</span>{" "}
                <span className="text-text-muted">({game.player2.rating})</span>
              </span>
            </div>

            {/* Result */}
            <div className="flex flex-col items-center gap-0.5 text-[12px] font-bold">
              <span className={scores[0] === "1" ? "text-green-400" : "text-red-400"}>
                {scores[0]}
              </span>
              <span className={scores[1] === "1" ? "text-green-400" : "text-red-400"}>
                {scores[1]}
              </span>
            </div>

            {/* Accuracy */}
            <div className="flex justify-center">
              <button className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-green-400 ring-1 ring-green-400/20 transition-colors duration-150 hover:bg-green-500/10 hover:text-green-300">
                Review
              </button>
            </div>

            {/* Moves */}
            <span className="text-center text-[12px] text-text-secondary">{game.moves}</span>

            {/* Date */}
            <span className="text-right text-[12px] text-text-muted">{game.date}</span>
          </div>
        );
      })}
    </div>
  );
}
