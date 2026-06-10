"use client";

import Link from "next/link";
import { BarChart3, FlaskConical } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-[calc(100vh-44px)] px-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-[#b83a30]/10 flex items-center justify-center">
          <span className="text-2xl font-serif font-bold text-[#b83a30]">將</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[#e8e6e3]">Reqi</h1>
      </div>
      <p className="text-[#8b8784] text-base mb-10 text-center max-w-sm leading-relaxed">
        Free Xiangqi game analysis powered by Fairy Stockfish. Get move-by-move classifications and accuracy scores.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        <Link
          href="/review"
          className="group flex flex-col items-center gap-3 p-6 bg-[#b83a30] rounded-xl hover:bg-[#d04538] hover:shadow-[0px_0px_34px_0px_rgba(255,255,255,0.2)] transition-all border-b-4 border-[#8b2420]"
        >
          <BarChart3 size={28} className="text-white group-hover:scale-110 transition-transform" />
          <span className="font-bold text-white">Game Review</span>
          <span className="text-xs text-white/80 text-center">Import PGN → full analysis</span>
        </Link>
        <Link
          href="/analysis"
          className="group flex flex-col items-center gap-3 p-6 bg-[#454341] rounded-xl hover:bg-[#4d4c49] hover:shadow-[0px_0px_34px_0px_rgba(255,255,255,0.2)] transition-all border-b-4 border-[#302e2b]"
        >
          <FlaskConical size={28} className="text-[#bfbbb7] group-hover:scale-110 transition-transform" />
          <span className="font-bold text-[#bfbbb7]">Analysis Board</span>
          <span className="text-xs text-[#bfbbb7]/80 text-center">Live engine evaluation</span>
        </Link>
      </div>
      <p className="mt-10 text-[11px] text-[#5a5654]">
        Fairy Stockfish WASM · Runs entirely in your browser · No account required
      </p>
    </main>
  );
}
