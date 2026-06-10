"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Search,
  Users,
  Mail,
  Bell,
  Settings,
} from "lucide-react";

// ── Custom colorful SVG icons (matching Chess.com style) ─────────────────────

function PlayIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 3l14 9-14 9V3z"
        fill={active ? "#81b64c" : "currentColor"}
        opacity={active ? 1 : 0.6}
      />
    </svg>
  );
}

function PuzzleIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M13.5 2a2.5 2.5 0 00-2.5 2.5V5h-1a3 3 0 00-3 3v1H6.5a2.5 2.5 0 000 5H7v1a3 3 0 003 3h1v.5a2.5 2.5 0 005 0V18h1a3 3 0 003-3v-1h.5a2.5 2.5 0 000-5H20V8a3 3 0 00-3-3h-1v-.5A2.5 2.5 0 0013.5 2z"
        fill={active ? "#e5943a" : "currentColor"}
        opacity={active ? 1 : 0.6}
      />
    </svg>
  );
}

function LearnIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 4a2 2 0 012-2h5a3 3 0 013 3v15a2 2 0 00-2-2H4a2 2 0 01-2-2V4z"
        fill={active ? "#5ba4cf" : "currentColor"}
        opacity={active ? 1 : 0.7}
      />
      <path
        d="M22 4a2 2 0 00-2-2h-5a3 3 0 00-3 3v15a2 2 0 012-2h6a2 2 0 002-2V4z"
        fill={active ? "#5ba4cf" : "currentColor"}
        opacity={active ? 0.7 : 0.45}
      />
    </svg>
  );
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12l9-8 9 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8z"
        fill={active ? "#a78bfa" : "currentColor"}
        opacity={active ? 1 : 0.6}
      />
      <path
        d="M9 22V12h6v10"
        fill={active ? "#7c3aed" : "currentColor"}
        opacity={active ? 0.7 : 0.35}
      />
    </svg>
  );
}

// ── Navigation Items ─────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ active?: boolean }>;
  href: string;
}

const NAV_MAIN: NavItem[] = [
  { id: "home", label: "Home", icon: HomeIcon, href: "/" },
  { id: "play", label: "Play", icon: PlayIcon, href: "/play" },
  { id: "puzzles", label: "Puzzles", icon: PuzzleIcon, href: "/puzzles" },
  { id: "learn", label: "Learn", icon: LearnIcon, href: "/learn" },
];

// ── Sidebar Component ───────────────────────────────────────────────────────

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (id: string) => void;
}

export function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  // Derive active item from pathname if not explicitly provided
  const currentActive = activeItem ?? (
    pathname === "/" ? "home" :
    pathname.startsWith("/play") ? "play" :
    pathname.startsWith("/puzzles") ? "puzzles" :
    pathname.startsWith("/learn") ? "learn" :
    "home"
  );

  return (
    <aside className="flex h-screen w-[88px] shrink-0 flex-col border-r border-white/[0.06] bg-board-panel">
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex h-14 items-center justify-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent shadow-[0_2px_10px_rgba(163,38,42,0.4)] text-[15px] font-bold text-white select-none">
          棋
        </div>
      </div>

      {/* ── Main Nav ─────────────────────────────────────────── */}
      <nav className="flex flex-col items-center gap-0.5 px-2 pt-1">
        {NAV_MAIN.map((item) => {
          const IconComp = item.icon;
          const isActive = currentActive === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onNavigate?.(item.id)}
              className={clsx(
                "group relative flex w-full flex-col items-center gap-1 rounded-lg py-2.5 text-[11px] font-semibold transition-all duration-150",
                isActive
                  ? "text-white"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <IconComp active={isActive} />
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* More */}
        <button className="group flex w-full flex-col items-center gap-1 rounded-lg py-2.5 text-[11px] font-semibold text-text-secondary transition-all duration-150 hover:text-text-primary">
          <ChevronDown className="h-[20px] w-[20px]" strokeWidth={2} />
          <span className="leading-tight">More</span>
        </button>
      </nav>

      {/* ── Spacer ───────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Bottom Section ───────────────────────────────────── */}
      <div className="flex flex-col items-center gap-0.5 px-2 pb-2">
        {/* Search */}
        <button className="group flex w-full flex-col items-center gap-1 rounded-lg py-2.5 text-[11px] font-semibold text-text-secondary transition-all duration-150 hover:text-text-primary">
          <Search className="h-[20px] w-[20px]" strokeWidth={2} />
          <span className="leading-tight">Search</span>
        </button>

        {/* User avatar */}
        <button className="group flex w-full flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-text-secondary transition-all duration-150 hover:text-text-primary">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-board-surface text-[11px] font-bold text-white ring-1 ring-white/[0.08]">
            G
          </div>
          <span className="max-w-[72px] truncate leading-tight">Guest</span>
        </button>

        {/* Bottom icon row */}
        <div className="mt-1 flex w-full items-center justify-center gap-1 border-t border-white/[0.06] pt-2.5">
          <BottomIcon icon={Users} badge={1} />
          <BottomIcon icon={Mail} badgeColor="bg-red-500" />
          <BottomIcon icon={Bell} />
          <BottomIcon icon={Settings} />
        </div>
      </div>
    </aside>
  );
}

// ── Bottom Icon Button ──────────────────────────────────────────────────────

function BottomIcon({
  icon: Icon,
  badge,
  badgeColor,
}: {
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}) {
  return (
    <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-all duration-150 hover:text-text-primary">
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      {badge !== undefined && badge > 0 && (
        <span className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] ${badgeColor ?? "bg-red-500"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
