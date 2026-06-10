"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameReview } from "@/hooks/useGameReview";
import { InteractiveBoard } from "@/components/board/InteractiveBoard";
import { EvalBar } from "@/components/review/EvalBar";
import { ReviewMoveList } from "@/components/review/ReviewMoveList";
import { BoardOverlays } from "@/components/review/BoardOverlays";
import { ReviewSummary } from "@/components/review/ReviewSummary";
import { EvalGraph } from "@/components/review/EvalGraph";
import { GameImport } from "@/components/review/GameImport";
import { ShareButton } from "@/components/review/ShareButton";
import { ThemeSelector } from "@/components/review/ThemeSelector";
import { convertGameToChineseNotation } from "@/lib/engine/chinese-notation";
import { getOpeningName } from "@/lib/engine/opening-book";
import { playMoveSound, playCaptureSound, playAnalysisCompleteSound } from "@/lib/sounds";
import { DEFAULT_BOARD_THEME, type BoardTheme } from "@/lib/board-themes";
import type { Position } from "@xiangqi/shared";
import { Loader2 } from "lucide-react";

export default function ReviewPage() {
  const review = useGameReview();
  const [tab, setTab] = useState<"moves" | "summary">("moves");
  const [theme, setTheme] = useState<BoardTheme>(DEFAULT_BOARD_THEME);

  useEffect(() => () => review.destroy(), []);

  // Play sound on move navigation
  useEffect(() => {
    if (review.currentIndex > 0 && review.game) {
      const moveAnalysis = review.review?.moves[review.currentIndex - 1];
      // If this move was a capture (eval changed significantly or we detect it from boards)
      // Simple heuristic: play capture if the board has fewer pieces
      const prevBoard = review.boards?.[review.currentIndex - 1];
      const curBoard = review.boards?.[review.currentIndex];
      if (prevBoard && curBoard) {
        const prevCount = prevBoard.flat().filter(Boolean).length;
        const curCount = curBoard.flat().filter(Boolean).length;
        if (curCount < prevCount) { playCaptureSound(); return; }
      }
      playMoveSound();
    }
  }, [review.currentIndex]);
  // Play chime when analysis completes
  useEffect(() => { if (review.status === "done") playAnalysisCompleteSound(); }, [review.status]);

  const bestMovePositions = review.currentMoveAnalysis?.evaluation.bestLine[0]
    ? uciToPos(review.currentMoveAnalysis.evaluation.bestLine[0])
    : null;

  const isAnalyzing = review.status === "analyzing";
  const isDone = review.status === "done";
  const progressPct = review.progress.total > 0
    ? (review.progress.done / review.progress.total) * 100
    : 0;

  const classification = review.currentMoveAnalysis?.classification ?? null;

  const notations = review.game ? convertGameToChineseNotation(review.game.moves) : undefined;
  const openingName = review.game ? getOpeningName(review.game.moves) : null;

  // ── Idle: PGN input screen ─────────────────────────────────────────────────
  if (review.status === "idle") {
    return (
      <div className="h-[calc(100vh-44px)] flex items-center justify-center p-4 bg-[#1a1816]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#262421] rounded-xl p-6 space-y-5 shadow-2xl border border-white/[0.04]"
        >
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-bold text-[#e8e6e3]">Game Review</h1>
            <p className="text-sm text-[#8b8784]">Analyze your Xiangqi games with engine evaluation</p>
          </div>
          <GameImport onImport={(pgn) => { const game = review.loadPgn(pgn); if (game) review.analyze(game); }} />
          <p className="text-[11px] text-[#5a5654] text-center">
            Leave empty to try a sample game
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (review.status === "error") {
    return (
      <div className="h-[calc(100vh-44px)] flex items-center justify-center p-4 bg-[#1a1816]">
        <div className="w-full max-w-md bg-[#262421] rounded-xl p-6 space-y-4 shadow-2xl border border-white/[0.04] text-center">
          <div className="text-[#ca3431] text-lg font-bold">Analysis Failed</div>
          <p className="text-sm text-[#8b8784]">{review.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-lg bg-[#81b64c] hover:bg-[#8fc455] text-white font-semibold text-sm transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main review layout ─────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-44px)] flex flex-col bg-[#1a1816] overflow-hidden">
      {/* Top progress bar */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[3px] bg-[#262421]"
          >
            <motion.div
              className="h-full bg-[#81b64c]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center p-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center lg:items-stretch">

          {/* Eval Bar - vertical on desktop, horizontal on mobile */}
          <div className="hidden lg:flex items-center mr-2">
            <EvalBar
              score={review.currentMoveAnalysis?.evaluation.score ?? null}
              className="h-[632px]"
            />
          </div>
          <div className="lg:hidden w-full max-w-[632px]">
            <EvalBar
              score={review.currentMoveAnalysis?.evaluation.score ?? null}
              className="!w-full !h-[24px] !flex-row rounded-sm"
            />
          </div>

          {/* Board + Classification Banner */}
          <div className="flex flex-col">
            <div className="relative rounded-sm overflow-hidden shadow-2xl">
              <InteractiveBoard
                board={review.currentBoard}
                turn={review.currentIndex % 2 === 0 ? "red" : "black"}
                playerSide={null}
                selectedPos={null}
                legalMoves={[]}
                lastMove={review.lastMove}
                checkSide={null}
                theme={theme}
                disabled
                onSelectSquare={() => {}}
              />
              {isDone && (
                <BoardOverlays
                  playedMove={review.lastMove}
                  classification={classification}
                  bestMove={bestMovePositions}
                />
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col w-full lg:w-[300px] max-h-[400px] lg:max-h-none lg:ml-3 bg-[#262421] rounded-lg overflow-hidden shadow-xl border border-white/[0.04]">
            {/* Opening name */}
            {openingName && (
              <div className="px-3 py-2 border-b border-white/[0.06] text-xs text-[#a88b65] font-medium">
                📖 {openingName}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              <ThemeSelector current={theme} onChange={setTheme} />
              <ShareButton game={review.game} review={review.review} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06]">
              <TabBtn active={tab === "moves"} onClick={() => setTab("moves")}>Moves</TabBtn>
              <TabBtn active={tab === "summary"} onClick={() => setTab("summary")} disabled={!isDone}>Summary</TabBtn>
            </div>

            {/* Analyzing indicator */}
            {isAnalyzing && (
              <div className="px-4 py-6 text-center space-y-3">
                <Loader2 size={24} className="animate-spin mx-auto text-[#81b64c]" />
                <div className="text-sm text-[#b0aba6]">Analyzing moves...</div>
                <div className="text-xl font-bold text-[#e8e6e3]">
                  {review.progress.done}<span className="text-[#5a5654]">/{review.progress.total}</span>
                </div>
              </div>
            )}

            {/* Eval Graph */}
            {isDone && review.review && (
              <div className="px-2 pt-2">
                <EvalGraph moves={review.review.moves} currentIndex={review.currentIndex} onClickMove={review.goTo} />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {tab === "moves" && review.game && (
                <ReviewMoveList
                  moves={review.game.moves}
                  notations={notations}
                  analysis={review.review?.moves ?? null}
                  currentIndex={review.currentIndex}
                  onGoTo={review.goTo}
                  onGoBack={review.goBack}
                  onGoForward={review.goForward}
                  onGoToStart={review.goToStart}
                  onGoToEnd={review.goToEnd}
                />
              )}
              {tab === "summary" && (
                <div className="p-4 overflow-y-auto h-full">
                  <ReviewSummary
                    review={review.review}
                    redPlayer={review.game?.headers.Red ?? "Red"}
                    blackPlayer={review.game?.headers.Black ?? "Black"}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({ active, onClick, disabled, children }: {
  active: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-150 ${
        active
          ? "text-[#e8e6e3] border-b-2 border-[#81b64c]"
          : "text-[#6b6762] hover:text-[#b0aba6]"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

// ── Helper ───────────────────────────────────────────────────────────────────

function uciToPos(uci: string): { from: Position; to: Position } | null {
  if (!uci || uci.length < 4) return null;
  return {
    from: { col: (uci.charCodeAt(0) - 97) as Position["col"], row: (9 - parseInt(uci[1])) as Position["row"] },
    to: { col: (uci.charCodeAt(2) - 97) as Position["col"], row: (9 - parseInt(uci[3])) as Position["row"] },
  };
}
