"use client";

import { ChevronRight, X } from "lucide-react";
import { MiniProfileBoardSVG } from "@/components/board/MiniBoardSVG";
import { SAMPLE_PROFILE_POSITION } from "@/lib/pieces";
import { MOCK_USER, MOCK_STATS, MOCK_LEAGUE } from "@/lib/mock-data";

// ── Right Sidebar ────────────────────────────────────────────────────────────
// Chess.com-style: League → Profile/Board → Stats

export function DashboardRightSidebar() {
  const user = MOCK_USER;
  const stats = MOCK_STATS;
  const league = MOCK_LEAGUE;

  return (
    <div className="flex w-[260px] shrink-0 flex-col gap-3">
      {/* ── League Card ──────────────────────────────────────── */}
      <button className="group flex items-center gap-3 rounded-lg bg-board-panel px-4 py-3 ring-1 ring-white/[0.06] transition-all duration-150 hover:ring-amber-400/20 hover:bg-white/[0.02]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 ring-2 ring-amber-400/30">
          <TrophyIcon />
        </div>
        <div className="flex flex-1 flex-col text-left">
          <span className="text-[13px] font-bold text-white">
            {league.name}
          </span>
          <span className="text-[11px] text-amber-400/80">
            {league.rank}th · 🏆 {league.trophies}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-amber-400" strokeWidth={1.8} />
      </button>

      {/* ── Profile Card ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg bg-board-panel ring-1 ring-white/[0.06]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <span className="text-[13px] font-bold text-white">
            {user.displayName}
          </span>
          <button className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors duration-150 hover:bg-white/[0.06] hover:text-text-primary">
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Mini board preview with real pieces */}
        <div className="flex items-center justify-center p-3">
          <MiniProfileBoardSVG
            pieces={SAMPLE_PROFILE_POSITION}
            id="right-profile"
          />
        </div>
      </div>

      {/* ── Stats Card ───────────────────────────────────────── */}
      <div className="rounded-lg bg-board-panel ring-1 ring-white/[0.06]">
        <div className="border-b border-white/[0.06] px-4 py-2.5">
          <span className="text-[13px] font-bold text-white">Stats</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <StatLine label="Games" value={String(stats.games)} />
          <StatLine label="Wins" value={String(stats.wins)} valueColor="text-green-400" />
          <StatLine label="Losses" value={String(stats.losses)} valueColor="text-red-400" />
          <StatLine label="Draws" value={String(stats.draws)} valueColor="text-amber-400" />
          <StatLine label="Rating" value={String(stats.rating)} />
          <StatLine label="Best Rating" value={String(stats.bestRating)} valueColor="text-sky-400" />
        </div>
      </div>
    </div>
  );
}

// ── Trophy SVG Icon ─────────────────────────────────────────────────────────

function TrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 21h8m-4-4v4m-5-8a7 7 0 01-3-5.5V4h16v3.5A7 7 0 0113 13m-6-6H4a3 3 0 003 3m10-3h3a3 3 0 01-3 3"
        stroke="#fbbf24"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M8 4h8v4a4 4 0 01-8 0V4z" fill="#fbbf24" opacity="0.3" />
    </svg>
  );
}

// ── Stat Line ────────────────────────────────────────────────────────────────

function StatLine({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className={`text-[13px] font-bold ${valueColor ?? "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

// ── Mini Profile Board with Real Pieces ─────────────────────────────────────
// Now uses shared MiniProfileBoardSVG from @/components/board/MiniBoardSVG
