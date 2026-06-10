"use client";

import { useState } from "react";
import { Share2, Check, Link } from "lucide-react";
import { saveReview } from "@/lib/supabase/reviews";
import type { GameReviewResult } from "@/lib/engine";
import type { PgnGame } from "@/lib/engine/pgn";

interface ShareButtonProps {
  game: PgnGame | null;
  review: GameReviewResult | null;
}

export function ShareButton({ game, review }: ShareButtonProps) {
  const [state, setState] = useState<"idle" | "saving" | "copied">("idle");

  if (!game || !review) return null;

  const handleShare = async () => {
    setState("saving");
    const id = await saveReview(game, review);

    if (id) {
      const url = `${window.location.origin}/review/${id}`;
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } else {
      // Fallback: copy current URL
      await navigator.clipboard.writeText(window.location.href);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={state === "saving"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-[#8b8784] hover:text-[#e8e6e3] hover:bg-white/[0.04] transition-colors"
    >
      {state === "copied" ? <Check size={14} className="text-[#81b64c]" /> : <Share2 size={14} />}
      {state === "copied" ? "Link copied!" : state === "saving" ? "Saving..." : "Share"}
    </button>
  );
}
