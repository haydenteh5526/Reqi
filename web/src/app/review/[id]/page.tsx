"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { InteractiveBoard } from "@/components/board/InteractiveBoard";
import { EvalBar } from "@/components/review/EvalBar";
import { ReviewMoveList } from "@/components/review/ReviewMoveList";
import { BoardOverlays } from "@/components/review/BoardOverlays";
import { ReviewSummary } from "@/components/review/ReviewSummary";
import { EvalGraph } from "@/components/review/EvalGraph";
import { convertGameToChineseNotation } from "@/lib/engine/chinese-notation";
import { loadReview, type SavedReview } from "@/lib/supabase/reviews";
import { playMoveSound } from "@/lib/sounds";
import { DEFAULT_BOARD_THEME } from "@/lib/board-themes";
import { createInitialBoard, applyMove } from "@xiangqi/shared";
import type { BoardState, Position } from "@xiangqi/shared";
import type { GameReviewResult, MoveAnalysis } from "@/lib/engine";
import { Loader2 } from "lucide-react";

export default function SharedReviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<SavedReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tab, setTab] = useState<"moves" | "summary">("moves");

  useEffect(() => {
    loadReview(id).then((r) => {
      if (r) setData(r);
      else setError("Review not found");
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { if (currentIndex > 0) playMoveSound(); }, [currentIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1816]">
        <Loader2 size={32} className="animate-spin text-[#81b64c]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1816]">
        <div className="text-center space-y-2">
          <div className="text-lg font-bold text-[#ca3431]">Not Found</div>
          <p className="text-sm text-[#8b8784]">{error ?? "This review doesn't exist."}</p>
        </div>
      </div>
    );
  }

  const { moves, review } = data;
  const boards = buildBoards(moves);
  const board = boards[currentIndex] ?? createInitialBoard();
  const moveAnalysis: MoveAnalysis | null = currentIndex > 0 ? review.moves[currentIndex - 1] ?? null : null;
  const lastMove = currentIndex > 0 ? uciToPos(moves[currentIndex - 1]) : null;
  const bestMovePos = moveAnalysis?.evaluation.bestLine[0] ? uciToPos(moveAnalysis.evaluation.bestLine[0]) : null;
  const notations = convertGameToChineseNotation(moves);

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1816]">
      <div className="flex-1 flex items-center justify-center p-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center lg:items-stretch">
          <div className="hidden lg:flex items-center mr-2">
            <EvalBar score={moveAnalysis?.evaluation.score ?? null} className="h-[632px]" />
          </div>

          <div className="relative rounded-sm overflow-hidden shadow-2xl">
            <InteractiveBoard
              board={board}
              turn={currentIndex % 2 === 0 ? "red" : "black"}
              playerSide={null}
              selectedPos={null}
              legalMoves={[]}
              lastMove={lastMove}
              checkSide={null}
              theme={DEFAULT_BOARD_THEME}
              disabled
              onSelectSquare={() => {}}
            />
            {moveAnalysis && (
              <BoardOverlays
                playedMove={lastMove}
                classification={moveAnalysis.classification}
                bestMove={bestMovePos}
              />
            )}
          </div>

          <div className="flex flex-col w-full lg:w-[300px] max-h-[400px] lg:max-h-none lg:ml-3 bg-[#262421] rounded-lg overflow-hidden shadow-xl border border-white/[0.04]">
            <div className="flex border-b border-white/[0.06]">
              <button onClick={() => setTab("moves")} className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${tab === "moves" ? "text-[#e8e6e3] border-b-2 border-[#81b64c]" : "text-[#6b6762]"}`}>Moves</button>
              <button onClick={() => setTab("summary")} className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${tab === "summary" ? "text-[#e8e6e3] border-b-2 border-[#81b64c]" : "text-[#6b6762]"}`}>Summary</button>
            </div>

            {review && (
              <div className="px-2 pt-2">
                <EvalGraph moves={review.moves} currentIndex={currentIndex} onClickMove={setCurrentIndex} />
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-hidden">
              {tab === "moves" && (
                <ReviewMoveList
                  moves={moves}
                  notations={notations}
                  analysis={review.moves}
                  currentIndex={currentIndex}
                  onGoTo={setCurrentIndex}
                  onGoBack={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  onGoForward={() => setCurrentIndex((i) => Math.min(moves.length, i + 1))}
                  onGoToStart={() => setCurrentIndex(0)}
                  onGoToEnd={() => setCurrentIndex(moves.length)}
                />
              )}
              {tab === "summary" && (
                <div className="p-4 overflow-y-auto h-full">
                  <ReviewSummary
                    review={review}
                    redPlayer={data.headers.Red ?? "Red"}
                    blackPlayer={data.headers.Black ?? "Black"}
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

function buildBoards(moves: string[]): BoardState[] {
  const boards: BoardState[] = [createInitialBoard()];
  let current = boards[0];
  for (const uci of moves) {
    const pos = uciToPos(uci);
    if (!pos) break;
    current = applyMove(current, pos.from, pos.to);
    boards.push(current);
  }
  return boards;
}

function uciToPos(uci: string): { from: Position; to: Position } | null {
  if (!uci || uci.length < 4) return null;
  return {
    from: { col: (uci.charCodeAt(0) - 97) as Position["col"], row: (9 - parseInt(uci[1])) as Position["row"] },
    to: { col: (uci.charCodeAt(2) - 97) as Position["col"], row: (9 - parseInt(uci[3])) as Position["row"] },
  };
}
