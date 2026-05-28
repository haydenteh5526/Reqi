"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisBoard } from "@/hooks/useAnalysisBoard";
import { InteractiveBoard } from "@/components/board/InteractiveBoard";
import { EvalBar } from "@/components/review/EvalBar";
import { BoardOverlays } from "@/components/review/BoardOverlays";
import { ThemeSelector } from "@/components/review/ThemeSelector";
import { playMoveSound } from "@/lib/sounds";
import { DEFAULT_BOARD_THEME, type BoardTheme } from "@/lib/board-themes";
import { RotateCcw, Undo2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AnalysisPage() {
  const analysis = useAnalysisBoard();
  const [theme, setTheme] = useState<BoardTheme>(DEFAULT_BOARD_THEME);

  // Play sound on move
  useEffect(() => { if (analysis.moves.length > 0) playMoveSound(); }, [analysis.moves.length]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); analysis.goBack(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); analysis.goForward(); }
      else if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); analysis.undo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [analysis.goBack, analysis.goForward, analysis.undo]);

  const isLive = analysis.currentIndex === analysis.moves.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1816]">
      {/* Header */}
      <header className="px-6 py-3 border-b border-white/[0.04] flex items-center gap-4">
        <h1 className="text-lg font-bold text-[#e8e6e3]">Analysis Board</h1>
        {analysis.isAnalyzing && (
          <span className="text-xs text-[#81b64c] animate-pulse">Thinking...</span>
        )}
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex gap-0 items-stretch">
          {/* Eval Bar */}
          <div className="flex items-center mr-2">
            <EvalBar
              score={analysis.evaluation?.score ?? null}
              className="h-[632px]"
            />
          </div>

          {/* Board */}
          <div className="relative rounded-sm overflow-hidden shadow-2xl">
            <InteractiveBoard
              board={analysis.board}
              turn={analysis.turn}
              playerSide={null}
              selectedPos={analysis.selectedPos}
              legalMoves={analysis.legalMoves}
              lastMove={analysis.lastMove}
              checkSide={analysis.checkSide}
              theme={theme}
              disabled={!isLive}
              onSelectSquare={analysis.handleSelectSquare}
            />
            {/* Best move arrow */}
            {analysis.bestMoveArrow && isLive && (
              <BoardOverlays
                bestMove={analysis.bestMoveArrow}
                classification="best"
                playedMove={null}
              />
            )}
          </div>

          {/* Right panel */}
          <div className="flex flex-col w-[280px] ml-3 bg-[#262421] rounded-lg overflow-hidden shadow-xl border border-white/[0.04]">
            {/* Eval info */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="text-xs text-[#8b8784] mb-1">Engine Evaluation</div>
              {analysis.evaluation ? (
                <div className="text-xl font-bold text-[#e8e6e3]">
                  {analysis.evaluation.score.type === "mate"
                    ? `M${Math.abs(analysis.evaluation.score.value)}`
                    : `${analysis.evaluation.score.value >= 0 ? "+" : ""}${(analysis.evaluation.score.value / 100).toFixed(2)}`
                  }
                </div>
              ) : (
                <div className="text-xl font-bold text-[#5a5654]">—</div>
              )}
              {analysis.evaluation?.bestLine && analysis.evaluation.bestLine.length > 0 && (
                <div className="mt-2 text-[11px] font-mono text-[#8b8784] truncate">
                  Best: {analysis.evaluation.bestLine.slice(0, 6).join(" ")}
                </div>
              )}
            </div>

            {/* Move list */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-0.5">
                {Array.from({ length: Math.ceil(analysis.moves.length / 2) }).map((_, i) => {
                  const redMove = analysis.moves[i * 2];
                  const blackMove = analysis.moves[i * 2 + 1];
                  return (
                    <div key={i} className="flex items-center text-xs">
                      <span className="w-7 text-[#5a5654] font-mono text-right mr-2">{i + 1}.</span>
                      <button
                        onClick={() => analysis.goTo(i * 2 + 1)}
                        className={`flex-1 px-2 py-0.5 rounded font-mono text-left ${
                          analysis.currentIndex === i * 2 + 1 ? "bg-white/10 text-white" : "text-[#b0aba6] hover:bg-white/[0.04]"
                        }`}
                      >
                        {redMove?.notation ?? ""}
                      </button>
                      {blackMove && (
                        <button
                          onClick={() => analysis.goTo(i * 2 + 2)}
                          className={`flex-1 px-2 py-0.5 rounded font-mono text-left ${
                            analysis.currentIndex === i * 2 + 2 ? "bg-white/10 text-white" : "text-[#b0aba6] hover:bg-white/[0.04]"
                          }`}
                        >
                          {blackMove.notation}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between py-3 px-3 border-t border-white/[0.06]">
              <ThemeSelector current={theme} onChange={setTheme} />
              <div className="flex gap-1">
                <CtrlBtn onClick={analysis.undo} label="Undo (Ctrl+Z)"><Undo2 size={16} /></CtrlBtn>
                <CtrlBtn onClick={analysis.goBack} label="Back"><ChevronLeft size={16} /></CtrlBtn>
                <CtrlBtn onClick={analysis.goForward} label="Forward"><ChevronRight size={16} /></CtrlBtn>
                <CtrlBtn onClick={analysis.reset} label="Reset"><RotateCcw size={16} /></CtrlBtn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="p-2.5 rounded-md hover:bg-white/[0.08] active:bg-white/[0.12] text-[#8b8784] hover:text-[#e0dcd8] transition-all"
    >
      {children}
    </button>
  );
}
