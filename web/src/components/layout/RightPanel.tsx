"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  User,
  Clock,
  MessageSquare,
  List,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";

// ── Tab System ───────────────────────────────────────────────────────────────

type PanelTab = "moves" | "chat";

// ── Right Panel Component ────────────────────────────────────────────────────

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>("moves");

  return (
    <div className="flex h-screen w-80 flex-col border-l border-white/5 bg-board-panel">
      {/* ── Player Card (opponent) ──────────────────────────── */}
      <PlayerCard
        name="Opponent"
        rating={1500}
        time="10:00"
        side="black"
        position="top"
      />

      {/* ── Tab Header ──────────────────────────────────────── */}
      <div className="flex border-b border-white/5">
        <TabButton
          label="Moves"
          icon={List}
          active={activeTab === "moves"}
          onClick={() => setActiveTab("moves")}
        />
        <TabButton
          label="Chat"
          icon={MessageSquare}
          active={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
        />
      </div>

      {/* ── Tab Content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "moves" ? (
            <motion.div
              key="moves"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <MoveHistory />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex h-full flex-col"
            >
              <ChatPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Player Card (you) ───────────────────────────────── */}
      <PlayerCard
        name="You"
        rating={1500}
        time="10:00"
        side="red"
        position="bottom"
      />
    </div>
  );
}

// ── Player Card ──────────────────────────────────────────────────────────────

interface PlayerCardProps {
  name: string;
  rating: number;
  time: string;
  side: "red" | "black";
  position: "top" | "bottom";
}

function PlayerCard({ name, rating, time, side, position }: PlayerCardProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-4 py-3",
        position === "top" ? "border-b border-white/5" : "border-t border-white/5",
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
          side === "red" ? "bg-accent" : "bg-board-surface",
        )}
      >
        <User className="h-4 w-4" />
      </div>

      {/* Name & Rating */}
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-semibold text-text-primary">{name}</span>
        <span className="text-xs text-text-muted">Rating: {rating}</span>
      </div>

      {/* Clock */}
      <div
        className={clsx(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-sm font-semibold",
          side === "red"
            ? "bg-accent/10 text-accent"
            : "bg-white/5 text-text-primary",
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        {time}
      </div>
    </div>
  );
}

// ── Tab Button ───────────────────────────────────────────────────────────────

interface TabButtonProps {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, icon: Icon, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
        active
          ? "text-text-primary"
          : "text-text-muted hover:text-text-secondary",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {active && (
        <motion.div
          layoutId="panel-tab-indicator"
          className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-accent"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
}

// ── Move History ─────────────────────────────────────────────────────────────

/** Placeholder move data — will be replaced by real game state */
const PLACEHOLDER_MOVES = [
  { number: 1, red: "炮二平五", black: "馬8進7" },
  { number: 2, red: "馬二進三", black: "車9平8" },
  { number: 3, red: "車一平二", black: "炮8平6" },
  { number: 4, red: "兵七進一", black: null },
];

function MoveHistory() {
  const [expandedMove, setExpandedMove] = useState<number | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3">
        {PLACEHOLDER_MOVES.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            No moves yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {PLACEHOLDER_MOVES.map((move) => (
              <button
                key={move.number}
                onClick={() =>
                  setExpandedMove(
                    expandedMove === move.number ? null : move.number,
                  )
                }
                className={clsx(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  expandedMove === move.number
                    ? "bg-white/5"
                    : "hover:bg-white/[0.03]",
                )}
              >
                <span className="w-6 shrink-0 text-right font-mono text-xs text-text-muted">
                  {move.number}.
                </span>
                <span className="flex-1 text-left text-text-primary">
                  {move.red}
                </span>
                <span className="flex-1 text-left text-text-secondary">
                  {move.black ?? "…"}
                </span>
                {expandedMove === move.number ? (
                  <ChevronUp className="h-3 w-3 text-text-muted" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-text-muted" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel() {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex h-full items-center justify-center text-sm text-text-muted">
          Chat will be available during games
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message…"
            disabled
            className="flex-1 rounded-lg border border-white/5 bg-board-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/50"
          />
          <button
            disabled
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent transition-colors hover:bg-accent/30 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
