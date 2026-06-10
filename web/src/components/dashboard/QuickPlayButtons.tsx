"use client";

import { useRouter } from "next/navigation";

// ── Quick Play Buttons ───────────────────────────────────────────────────────
// Vertical stack of play actions with colorful Chess.com-style piece icons.

// ── Custom Colorful Icon Components ─────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#2d5a1e" />
      <rect x="1" y="1" width="38" height="38" rx="9" stroke="#4ade80" strokeWidth="0.5" fill="none" />
      {/* Knight-like piece silhouette */}
      <text x="20" y="21" textAnchor="middle" dominantBaseline="central" fill="#4ade80" fontSize="20" fontWeight="bold" fontFamily="'KaiTi', 'STKaiti', serif">馬</text>
    </svg>
  );
}

function NewGameIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#3a3530" />
      <rect x="1" y="1" width="38" height="38" rx="9" stroke="#a8a29e" strokeWidth="0.5" fill="none" />
      {/* Chariot piece */}
      <text x="20" y="21" textAnchor="middle" dominantBaseline="central" fill="#e7e5e4" fontSize="20" fontWeight="bold" fontFamily="'KaiTi', 'STKaiti', serif">車</text>
    </svg>
  );
}

function BotIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#1a3347" />
      <rect x="1" y="1" width="38" height="38" rx="9" stroke="#38bdf8" strokeWidth="0.5" fill="none" />
      {/* Robot face */}
      <rect x="12" y="12" width="16" height="14" rx="3" fill="#38bdf8" opacity="0.9" />
      <circle cx="16" cy="18" r="2" fill="#0c4a6e" />
      <circle cx="24" cy="18" r="2" fill="#0c4a6e" />
      <rect x="16" y="22" width="8" height="1.5" rx="0.5" fill="#0c4a6e" />
      {/* Antenna */}
      <line x1="20" y1="12" x2="20" y2="9" stroke="#38bdf8" strokeWidth="1.5" />
      <circle cx="20" cy="8" r="1.5" fill="#67e8f9" />
    </svg>
  );
}

function FriendIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#3d2508" />
      <rect x="1" y="1" width="38" height="38" rx="9" stroke="#f59e0b" strokeWidth="0.5" fill="none" />
      {/* Two people */}
      <circle cx="15" cy="15" r="4" fill="#fbbf24" opacity="0.9" />
      <path d="M8 28c0-4 3-7 7-7s7 3 7 7" fill="#fbbf24" opacity="0.7" />
      <circle cx="25" cy="15" r="4" fill="#f59e0b" opacity="0.9" />
      <path d="M18 28c0-4 3-7 7-7s7 3 7 7" fill="#f59e0b" opacity="0.7" />
    </svg>
  );
}

// ── Button Component ────────────────────────────────────────────────────────

interface PlayButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function PlayButton({ icon, label, onClick }: PlayButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 rounded-lg bg-board-panel px-3.5 py-3 text-left ring-1 ring-white/[0.06] transition-all duration-150 hover:bg-white/[0.03] hover:ring-white/[0.12] active:scale-[0.995]"
    >
      <div className="shrink-0">{icon}</div>
      <span className="text-[14px] font-semibold text-white">{label}</span>
    </button>
  );
}

export function QuickPlayButtons() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <PlayButton icon={<PlayIcon />} label="Play 10 min" onClick={() => router.push("/play")} />
      <PlayButton icon={<NewGameIcon />} label="New Game" onClick={() => router.push("/play")} />
      <PlayButton icon={<BotIcon />} label="Play Bots" onClick={() => router.push("/play/bot")} />
      <PlayButton icon={<FriendIcon />} label="Play a Friend" onClick={() => router.push("/play")} />
    </div>
  );
}
