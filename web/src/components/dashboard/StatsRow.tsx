"use client";

// ── Stats Row ────────────────────────────────────────────────────────────────
// Horizontal row of 4 stat cards with large colorful icons (Chess.com style).

import { MOCK_STATS } from "@/lib/mock-data";

// ── Custom Colorful Icon Components ─────────────────────────────────────────

function StreakIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="#3d2c08" stroke="#f59e0b" strokeWidth="0.5" />
      <path
        d="M16 6c0 0-6 6-6 12a6 6 0 0012 0c0-2-1-4-3-6 0 0 0 3-2 4-1-3-1-7-1-10z"
        fill="url(#flameGrad)"
      />
      <defs>
        <linearGradient id="flameGrad" x1="16" y1="6" x2="16" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PuzzleStatIcon({ count = 3 }: { count?: number }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="1" y="1" width="30" height="30" rx="6" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="0.5" />
      <text
        x="16"
        y="17"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#60a5fa"
        fontSize="16"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        {count}
      </text>
    </svg>
  );
}

function LessonIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="1" y="1" width="30" height="30" rx="6" fill="#1a3347" stroke="#38bdf8" strokeWidth="0.5" />
      <path d="M8 10h16v12l-8-3-8 3V10z" fill="#38bdf8" opacity="0.9" />
      <path d="M12 15h8M12 18h5" stroke="#0c4a6e" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="#14332a" stroke="#22c55e" strokeWidth="0.5" />
      <path
        d="M16 8a8 8 0 11-5.66 2.34L16 16"
        stroke="#4ade80"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <polygon points="9,9 12,12 8,12" fill="#4ade80" />
    </svg>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  sublabel?: string;
  valueColor?: string;
}

function StatCard({ icon, label, value, sublabel, valueColor }: StatCardProps) {
  return (
    <div className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg bg-board-panel px-4 py-3 ring-1 ring-white/[0.06] transition-all duration-150 hover:ring-white/[0.12] hover:bg-white/[0.02]">
      <div className="shrink-0">{icon}</div>
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </span>
        {value && (
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-bold leading-tight ${valueColor ?? "text-white"}`}>
              {value}
            </span>
            {sublabel && (
              <span className="text-xs text-text-muted">{sublabel}</span>
            )}
          </div>
        )}
        {!value && sublabel && (
          <span className="truncate text-xs leading-snug text-text-secondary">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatsRow() {
  const stats = MOCK_STATS;

  return (
    <div className="grid grid-cols-4 gap-2.5">
      <StatCard
        icon={<StreakIcon />}
        label="Streak"
        value={`${stats.streakDays} Days`}
      />
      <StatCard
        icon={<PuzzleStatIcon count={stats.puzzleStreak} />}
        label="Puzzles"
        value={String(stats.puzzlesSolved)}
        sublabel={`🔥 ${stats.puzzleStreak}`}
        valueColor="text-amber-400"
      />
      <StatCard
        icon={<LessonIcon />}
        label="Next Lesson"
        sublabel={stats.nextLessonTitle}
      />
      <StatCard
        icon={<ReviewIcon />}
        label="Game Review"
        sublabel="Learn from your mistakes"
      />
    </div>
  );
}
