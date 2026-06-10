"use client";

// =============================================================================
// Bot Game Layout — Pre-game lobby + Play against the computer
// Chess.com–style experience: difficulty selector → full game with move nav,
// material advantage, coordinates, no clock.
// =============================================================================

import { useState, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { InteractiveBoard } from "@/components/board/InteractiveBoard";
import { MoveHistory } from "@/components/game/MoveHistory";
import { PlayerInfo, computeMaterialAdvantage } from "@/components/game/PlayerInfo";
import { GameOverModal } from "@/components/game/GameOverModal";
import { useXiangqiBotGame } from "@/hooks/useXiangqiBotGame";
import type { BotDifficulty } from "@/lib/bot/engine";
import type { Piece, Side } from "@xiangqi/shared";
import { Bot, Swords, RotateCcw, Flag } from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<
  BotDifficulty,
  { label: string; rating: number; description: string; emoji: string }
> = {
  easy: {
    label: "Easy",
    rating: 800,
    description: "Beginner-friendly. Makes some random moves.",
    emoji: "🟢",
  },
  medium: {
    label: "Medium",
    rating: 1200,
    description: "Decent tactical play. Good for learning.",
    emoji: "🟡",
  },
  hard: {
    label: "Hard",
    rating: 1600,
    description: "Strong positional play. Punishes mistakes.",
    emoji: "🔴",
  },
};

const DIFFICULTIES: BotDifficulty[] = ["easy", "medium", "hard"];

// =============================================================================
// Pre-game Lobby Screen
// =============================================================================

function BotLobby({
  onStart,
}: {
  onStart: (difficulty: BotDifficulty, side: Side) => void;
}) {
  const [difficulty, setDifficulty] = useState<BotDifficulty>("medium");
  const [side, setSide] = useState<Side>("red");

  return (
    <div className="flex h-screen overflow-hidden bg-board-bg">
      <Sidebar />

      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#262421] p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <Bot size={32} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-white">Play vs Computer</h1>
            <p className="mt-1 text-sm text-text-muted">
              Choose your difficulty and side, then click Play
            </p>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-6">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Difficulty
            </label>
            <div className="flex flex-col gap-2">
              {DIFFICULTIES.map((d) => {
                const cfg = DIFFICULTY_CONFIG[d];
                const isSelected = difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                      isSelected
                        ? "bg-accent/15 ring-2 ring-accent"
                        : "bg-white/[0.04] hover:bg-white/[0.08]"
                    }`}
                  >
                    <span className="text-lg">{cfg.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-white">
                          {cfg.label}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          ~{cfg.rating} ELO
                        </span>
                      </div>
                      <p className="text-[12px] text-text-secondary">
                        {cfg.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="h-3 w-3 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side Selection */}
          <div className="mb-8">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Play as
            </label>
            <div className="flex gap-2">
              {(["red", "black"] as Side[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-bold capitalize transition-all ${
                    side === s
                      ? s === "red"
                        ? "bg-[#c4473b]/20 text-[#c4473b] ring-2 ring-[#c4473b]"
                        : "bg-white/10 text-white ring-2 ring-white/40"
                      : "bg-white/[0.04] text-text-secondary hover:bg-white/[0.08]"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                      s === "red"
                        ? "bg-[#c4473b]/30 text-[#c4473b]"
                        : "bg-white/15 text-white"
                    }`}
                  >
                    {s === "red" ? "紅" : "黑"}
                  </span>
                  {s === "red" ? "Red (First)" : "Black"}
                </button>
              ))}
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={() => onStart(difficulty, side)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-lg font-bold text-white shadow-[0_4px_16px_rgba(163,38,42,0.35)] transition-all hover:bg-accent/90 hover:shadow-[0_4px_20px_rgba(163,38,42,0.45)] active:scale-[0.98]"
          >
            <Swords size={20} />
            Play
          </button>
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// Active Game Screen
// =============================================================================

function ActiveBotGame({
  difficulty,
  playerSide,
  gameKey,
  onNewGame,
  onBackToLobby,
}: {
  difficulty: BotDifficulty;
  playerSide: Side;
  gameKey: number;
  onNewGame: () => void;
  onBackToLobby: () => void;
}) {
  const game = useXiangqiBotGame({
    playerSide,
    difficulty,
  });

  // Compute captured pieces from move history
  const captured = useMemo(() => {
    const red: Piece[] = [];
    const black: Piece[] = [];
    for (const move of game.moves) {
      if (move.captured) {
        if (move.captured.side === "red") red.push(move.captured);
        else black.push(move.captured);
      }
    }
    return { red, black };
  }, [game.moves]);

  // Material advantage: captured.red = red pieces captured BY black, captured.black = black pieces captured BY red
  const redAdvantage = computeMaterialAdvantage(captured.black, captured.red); // red captured black pieces minus black captured red pieces
  const blackAdvantage = -redAdvantage;

  // Which side is on top vs bottom
  const topSide: Side = playerSide === "red" ? "black" : "red";
  const bottomSide: Side = playerSide;
  const isFlipped = playerSide === "black";

  const cfg = DIFFICULTY_CONFIG[difficulty];

  const handleNewGame = useCallback(() => {
    game.newGame();
    onNewGame();
  }, [game, onNewGame]);

  const handleResign = useCallback(() => {
    game.resign(playerSide);
  }, [game, playerSide]);

  return (
    <div className="flex h-screen overflow-hidden bg-board-bg">
      {/* ── Left: Sidebar ───────────────────────────────────── */}
      <Sidebar />

      {/* ── Center: Board + Player Bars ─────────────────────── */}
      <main className="flex flex-1 items-center justify-center overflow-auto p-2">
        <div className="relative flex flex-col gap-1">
          {/* Top player (opponent / bot) */}
          <PlayerInfo
            side={topSide}
            name={`${cfg.label} Bot`}
            rating={cfg.rating}
            isActive={game.turn === topSide && game.phase === "playing"}
            capturedPieces={topSide === "red" ? captured.black : captured.red}
            materialAdvantage={topSide === "red" ? Math.max(0, redAdvantage) : Math.max(0, blackAdvantage)}
          />

          {/* Board + overlay */}
          <div className="relative">
            <InteractiveBoard
              key={gameKey}
              board={game.isViewingHistory ? game.viewBoard : game.board}
              turn={game.turn}
              playerSide={playerSide}
              selectedPos={game.isViewingHistory ? null : game.selectedPos}
              legalMoves={game.isViewingHistory ? [] : game.legalMoves}
              lastMove={game.isViewingHistory ? game.viewLastMove : game.lastMove}
              checkSide={game.isViewingHistory ? null : game.checkSide}
              disabled={game.isViewingHistory}
              flipped={isFlipped}
              onSelectSquare={game.handleSelectSquare}
            />
            <GameOverModal
              phase={game.phase}
              winner={game.winner}
              onNewGame={handleNewGame}
            />
          </div>

          {/* Bottom player (you) */}
          <PlayerInfo
            side={bottomSide}
            name="You"
            rating={1500}
            isActive={game.turn === bottomSide && game.phase === "playing"}
            capturedPieces={bottomSide === "red" ? captured.black : captured.red}
            materialAdvantage={bottomSide === "red" ? Math.max(0, redAdvantage) : Math.max(0, blackAdvantage)}
          />
        </div>
      </main>

      {/* ── Right: Move History + Controls ──────────────────── */}
      <aside className="flex h-screen w-80 flex-col border-l border-white/5 bg-board-panel">
        {/* Game info header */}
        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cfg.emoji}</span>
            <div>
              <div className="text-[13px] font-bold text-white">
                vs {cfg.label} Bot
              </div>
              <div className="text-[11px] text-text-muted">
                ~{cfg.rating} ELO • No time control
              </div>
            </div>
          </div>
        </div>

        {/* Move history with navigation */}
        <MoveHistory
          moves={game.moves}
          currentMoveIndex={game.viewingMoveIndex}
          onGoToMove={game.goToMove}
          onGoBack={game.goBack}
          onGoForward={game.goForward}
          onGoToStart={game.goToStart}
          onGoToEnd={game.goToEnd}
          className="flex-1"
        />

        {/* Actions */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleNewGame}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-white/[0.1]"
              >
                <RotateCcw size={14} />
                Rematch
              </button>
              <button
                onClick={onBackToLobby}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-white/[0.1]"
              >
                New Bot
              </button>
            </div>
            <button
              onClick={handleResign}
              disabled={game.phase !== "playing"}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#A3262A]/20 px-4 py-2 text-sm font-semibold text-[#A3262A] transition-colors hover:bg-[#A3262A]/30 disabled:opacity-40"
            >
              <Flag size={14} />
              Resign
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

// =============================================================================
// Main Export — Switches between lobby and active game
// =============================================================================

export function BotGameLayout() {
  const [gameState, setGameState] = useState<{
    started: boolean;
    difficulty: BotDifficulty;
    playerSide: Side;
    gameKey: number;
  }>({
    started: false,
    difficulty: "medium",
    playerSide: "red",
    gameKey: 0,
  });

  const handleStart = useCallback(
    (difficulty: BotDifficulty, side: Side) => {
      setGameState({
        started: true,
        difficulty,
        playerSide: side,
        gameKey: Date.now(),
      });
    },
    [],
  );

  const handleNewGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, gameKey: Date.now() }));
  }, []);

  const handleBackToLobby = useCallback(() => {
    setGameState((prev) => ({ ...prev, started: false }));
  }, []);

  if (!gameState.started) {
    return <BotLobby onStart={handleStart} />;
  }

  return (
    <ActiveBotGame
      key={gameState.gameKey}
      difficulty={gameState.difficulty}
      playerSide={gameState.playerSide}
      gameKey={gameState.gameKey}
      onNewGame={handleNewGame}
      onBackToLobby={handleBackToLobby}
    />
  );
}
