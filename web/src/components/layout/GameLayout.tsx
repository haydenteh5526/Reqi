"use client";

import { useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { InteractiveBoard } from "@/components/board/InteractiveBoard";
import { MoveHistory } from "@/components/game/MoveHistory";
import { PlayerInfo } from "@/components/game/PlayerInfo";
import { GameOverModal } from "@/components/game/GameOverModal";
import { useXiangqiGame } from "@/hooks/useXiangqiGame";
import type { Piece } from "@xiangqi/shared";

/**
 * Primary 3-column game layout:
 *  [Sidebar] [Board + Player Bars] [Move History Panel]
 *
 * Hotseat mode: both sides are controlled locally.
 */
export function GameLayout() {
  const [activeNav, setActiveNav] = useState("play");

  const game = useXiangqiGame({
    playerSide: null, // hotseat
    initialTimeMs: 600_000,
    incrementMs: 5_000,
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

  return (
    <div className="flex h-screen overflow-hidden bg-board-bg">
      {/* ── Left: Collapsible Sidebar ───────────────────────── */}
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />

      {/* ── Center: Board + Player Bars ─────────────────────── */}
      <main className="flex flex-1 items-center justify-center overflow-auto p-4">
        <div className="relative flex flex-col gap-2">
          {/* Opponent (Black) */}
          <PlayerInfo
            side="black"
            name="Black"
            rating={1500}
            timeMs={game.clock.blackMs}
            isActive={game.turn === "black" && game.phase === "playing"}
            capturedPieces={captured.red}
          />

          {/* Board + game-over overlay */}
          <div className="relative">
            <InteractiveBoard
              board={game.isViewingHistory ? game.viewBoard : game.board}
              turn={game.turn}
              playerSide={null}
              selectedPos={game.isViewingHistory ? null : game.selectedPos}
              legalMoves={game.isViewingHistory ? [] : game.legalMoves}
              lastMove={game.isViewingHistory ? game.viewLastMove : game.lastMove}
              checkSide={game.isViewingHistory ? null : game.checkSide}
              disabled={game.isViewingHistory}
              onSelectSquare={game.handleSelectSquare}
            />
            <GameOverModal
              phase={game.phase}
              winner={game.winner}
              onNewGame={game.newGame}
            />
          </div>

          {/* Player (Red) */}
          <PlayerInfo
            side="red"
            name="Red"
            rating={1500}
            timeMs={game.clock.redMs}
            isActive={game.turn === "red" && game.phase === "playing"}
            capturedPieces={captured.black}
          />
        </div>
      </main>

      {/* ── Right: Move History + Controls ──────────────────── */}
      <aside className="flex h-screen w-80 flex-col border-l border-white/5 bg-board-panel">
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

        {/* Game controls */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex gap-2">
            <button
              onClick={game.newGame}
              className="flex-1 rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-white/[0.1]"
            >
              New Game
            </button>
            <button
              onClick={() => game.resign(game.turn)}
              disabled={game.phase !== "playing"}
              className="flex-1 rounded-lg bg-[#A3262A]/20 px-4 py-2 text-sm font-semibold text-[#A3262A] transition-colors hover:bg-[#A3262A]/30 disabled:opacity-40"
            >
              Resign
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
