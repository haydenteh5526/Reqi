"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { QuickPlayButtons } from "@/components/dashboard/QuickPlayButtons";
import { BoardPreviews } from "@/components/dashboard/BoardPreviews";
import { DailyGames, GameHistory } from "@/components/dashboard/GameHistory";
import { DashboardRightSidebar } from "@/components/dashboard/RightSidebar";
import { MOCK_USER } from "@/lib/mock-data";

// ── Dashboard Page ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const user = MOCK_USER;

  return (
    <div className="flex h-screen overflow-hidden bg-board-bg">
      {/* ── Left: Sidebar ───────────────────────────────────── */}
      <Sidebar activeItem="home" />

      {/* ── Center: Main Content ────────────────────────────── */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="mx-auto max-w-[940px] space-y-3 px-6 py-5">
          {/* User Greeting */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-board-surface text-[12px] font-bold text-white ring-1 ring-white/[0.08]">
              {user.initial}
            </div>
            <span className="text-[15px] font-bold text-white">
              {user.displayName}
            </span>
          </div>

          {/* Stats Row */}
          <StatsRow />

          {/* Quick Play + Board Previews */}
          <div className="flex gap-3">
            <div className="w-[220px] shrink-0">
              <QuickPlayButtons />
            </div>
            <div className="flex-1 min-w-0">
              <BoardPreviews />
            </div>
          </div>

          {/* Daily Games */}
          <DailyGames />

          {/* Game History */}
          <GameHistory />
        </div>
      </main>

      {/* ── Right: Sidebar ──────────────────────────────────── */}
      <div className="hidden border-l border-white/[0.06] xl:block">
        <div className="h-full overflow-y-auto p-4">
          <DashboardRightSidebar />
        </div>
      </div>
    </div>
  );
}
