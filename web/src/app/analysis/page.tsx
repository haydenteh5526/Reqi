"use client";

import { useEffect, useState } from "react";
import { useAnalysisBoard } from "@/hooks/useAnalysisBoard";
import { InteractiveBoard } from "@/components/board/InteractiveBoard";
import { EvalBar } from "@/components/review/EvalBar";
import { BoardOverlays } from "@/components/review/BoardOverlays";
import { ThemeSelector } from "@/components/review/ThemeSelector";
import { playMoveSound, playCaptureSound, playUndoSound } from "@/lib/sounds";
import { getOpeningName } from "@/lib/engine/opening-book";
import { pvToAlgebraic } from "@/lib/engine/algebraic";
import { DEFAULT_BOARD_THEME, type BoardTheme } from "@/lib/board-themes";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, RotateCcw, Undo2, BookOpen } from "lucide-react";

export default function AnalysisPage() {
  const [theme, setTheme] = useState<BoardTheme>(DEFAULT_BOARD_THEME);
  const [analysisDepth, setAnalysisDepth] = useState(16);
  const analysis = useAnalysisBoard(analysisDepth);

  // Sound on move
  useEffect(() => {
    if (analysis.moves.length > 0) {
      if (analysis.lastMoveWasCapture) playCaptureSound();
      else playMoveSound();
    }
  }, [analysis.moves.length]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); analysis.goBack(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); analysis.goForward(); }
      else if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); analysis.undo(); playUndoSound(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [analysis.goBack, analysis.goForward, analysis.undo]);

  const isLive = analysis.currentIndex === analysis.moves.length;
  const cpDisplay = analysis.evaluation
    ? analysis.evaluation.score.type === "mate"
      ? `M${Math.abs(analysis.evaluation.score.value)}`
      : `${analysis.evaluation.score.value >= 0 ? "+" : ""}${(analysis.evaluation.score.value / 100).toFixed(1)}`
    : "0.0";

  // Opening detection
  const uciMoves = analysis.moves.map((m) => {
    const fc = String.fromCharCode(97 + m.from.col);
    const fr = 10 - m.from.row;
    const tc = String.fromCharCode(97 + m.to.col);
    const tr = 10 - m.to.row;
    return `${fc}${fr}${tc}${tr}`;
  });
  const openingName = getOpeningName(uciMoves);

  // Move pairs for display
  const pairs: Array<{ num: number; red?: string; black?: string; redIdx: number; blackIdx: number }> = [];
  for (let i = 0; i < analysis.moves.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      red: analysis.moves[i]?.notation,
      black: analysis.moves[i + 1]?.notation,
      redIdx: i + 1,
      blackIdx: i + 2,
    });
  }

  return (
    <main className="flex flex-col lg:flex-row h-[calc(100vh-44px)] overflow-hidden">
      {/* Board + Eval bar */}
      <div className="flex items-center justify-center flex-1 p-3">
        <div className="flex gap-1 h-full max-h-[calc(100vh-80px)] items-center">
          <EvalBar score={analysis.evaluation?.score ?? null} className="h-full" />
          <div className="relative h-full" style={{ aspectRatio: "9/10" }}>
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
            {analysis.bestMoveArrow && (
              <BoardOverlays
                bestMove={analysis.bestMoveArrow}
                classification={null}
                playedMove={null}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l border-white/5 bg-[rgba(0,0,0,0.1)] lg:h-full">
        {/* Engine header */}
        <div className="px-4 py-3 border-b border-white/5 bg-[#1e1c1a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-green-500 ${analysis.isAnalyzing ? "animate-pulse" : ""}`} />
              <span className="text-xs text-[#C3C3C0] uppercase tracking-wide font-medium">Fairy Stockfish</span>
            </div>
            <span className="text-lg font-bold font-mono text-white">{cpDisplay}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-[#C3C3C0]/50">Depth {analysis.evaluation?.depth ?? 0}/{analysisDepth}</span>
            <div className="flex gap-0.5">
              {[12, 16, 18, 22].map((d) => (
                <button
                  key={d}
                  onClick={() => setAnalysisDepth(d)}
                  className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${
                    analysisDepth === d
                      ? "bg-[#b83a30] text-white"
                      : "bg-[#32302E] text-[#C3C3C0] hover:bg-[#3a3835]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {analysis.evaluation?.bestLine && analysis.evaluation.bestLine.length > 0 && (() => {
            const pvAlg = pvToAlgebraic(analysis.evaluation.bestLine.slice(0, 10), analysis.board);
            return (
              <div className="flex flex-wrap gap-x-1 gap-y-0.5 mt-2">
                {pvAlg.map((m, i) => (
                  <span key={i} className="text-[11px] text-[#b83a30] hover:text-white cursor-pointer hover:bg-[#32302E] px-1 py-0.5 rounded font-mono transition-colors">
                    {i % 2 === 0 && <span className="text-[#C3C3C0]/40">{Math.floor(i / 2) + 1}.</span>}{m}
                  </span>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Opening */}
        {openingName && (
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 bg-[#2B2927]">
            <BookOpen size={13} className="text-[#a88b65] shrink-0" />
            <span className="text-sm text-[#C3C3C0] font-medium">{openingName}</span>
          </div>
        )}

        {/* Move list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {pairs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#C3C3C0]/30 text-sm">
              Play moves to see them here
            </div>
          ) : (
            <div className="text-[13px]">
              {pairs.map((pair, idx) => (
                <div
                  key={idx}
                  className={`w-full flex items-stretch ${idx % 2 !== 0 ? "bg-[#2B2927]" : "bg-[#262421]"}`}
                >
                  <span className="text-[#C3C3C0]/50 w-9 shrink-0 flex items-center justify-end pr-2 py-1.5 text-xs">
                    {pair.num}.
                  </span>
                  <div
                    onClick={() => analysis.goTo(pair.redIdx)}
                    className={`flex-1 flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#3a3835] ${
                      analysis.currentIndex === pair.redIdx ? "bg-[#484644] rounded-sm border-b-[2px] border-b-[#5A5858]" : ""
                    }`}
                  >
                    <span className="text-[#C3C3C0] font-bold">{pair.red}</span>
                  </div>
                  <div
                    onClick={() => pair.black ? analysis.goTo(pair.blackIdx) : undefined}
                    className={`flex-1 flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#3a3835] ${
                      analysis.currentIndex === pair.blackIdx ? "bg-[#484644] rounded-sm border-b-[2px] border-b-[#5A5858]" : ""
                    }`}
                  >
                    {pair.black && <span className="text-[#C3C3C0] font-bold">{pair.black}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation controls */}
        <div className="w-full px-3 py-2 bg-[#20211D] flex items-center justify-between border-t border-white/5">
          <div className="flex gap-0.5 text-[#C3C3C0]">
            <button onClick={() => analysis.goTo(0)} disabled={analysis.currentIndex === 0} className="hover:text-white disabled:opacity-30 p-1.5 hover:bg-[#32302E] rounded" title="Go to start">
              <ChevronFirst size={18} />
            </button>
            <button onClick={analysis.goBack} disabled={analysis.currentIndex === 0} className="hover:text-white disabled:opacity-30 p-1.5 hover:bg-[#32302E] rounded" title="Back">
              <ChevronLeft size={18} />
            </button>
            <button onClick={analysis.goForward} disabled={isLive} className="hover:text-white disabled:opacity-30 p-1.5 hover:bg-[#32302E] rounded" title="Forward">
              <ChevronRight size={18} />
            </button>
            <button onClick={() => analysis.goTo(analysis.moves.length)} disabled={isLive} className="hover:text-white disabled:opacity-30 p-1.5 hover:bg-[#32302E] rounded" title="Go to end">
              <ChevronLast size={18} />
            </button>
            <div className="w-px bg-white/10 mx-1.5" />
            <button onClick={() => { analysis.undo(); playUndoSound(); }} disabled={analysis.moves.length === 0} className="hover:text-white disabled:opacity-30 p-1.5 hover:bg-[#32302E] rounded" title="Undo">
              <Undo2 size={16} />
            </button>
            <button onClick={analysis.reset} className="hover:text-white p-1.5 hover:bg-[#32302E] rounded" title="Reset">
              <RotateCcw size={16} />
            </button>
          </div>
          <ThemeSelector current={theme} onChange={setTheme} />
        </div>
      </div>
    </main>
  );
}
