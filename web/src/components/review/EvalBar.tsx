"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { EngineEval } from "@/lib/engine";

interface EvalBarProps {
  score: EngineEval["score"] | null;
  className?: string;
}

export function EvalBar({ score, className = "" }: EvalBarProps) {
  const { percentage, label } = useMemo(() => {
    if (!score) return { percentage: 50, label: "0.0" };

    if (score.type === "mate") {
      const pct = score.value > 0 ? 97 : 3;
      return { percentage: pct, label: `M${Math.abs(score.value)}` };
    }

    const cp = score.value;
    const pct = 50 + 50 * (2 / (1 + Math.exp(-0.005 * cp)) - 1);
    const clamped = Math.max(3, Math.min(97, pct));
    const lbl = cp >= 0 ? `+${(cp / 100).toFixed(1)}` : (cp / 100).toFixed(1);
    return { percentage: clamped, label: lbl };
  }, [score]);

  const isWhiteAdvantage = percentage >= 50;

  return (
    <div
      className={`relative w-[28px] rounded-[3px] overflow-hidden select-none shadow-inner ${className}`}
      role="meter"
      aria-label={`Evaluation: ${label}`}
      aria-valuenow={percentage}
    >
      {/* Background (black side) */}
      <div className="absolute inset-0 bg-[#403d39]" />

      {/* White/Red portion (animated from bottom) */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-[#f0eeec]"
        initial={false}
        animate={{ height: `${percentage}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
      />

      {/* Score label */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center"
        initial={false}
        animate={isWhiteAdvantage
          ? { bottom: 0, top: "auto", height: 22 }
          : { top: 0, bottom: "auto", height: 22 }
        }
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
        <span className={`text-[9px] font-bold leading-none ${
          isWhiteAdvantage ? "text-[#403d39]" : "text-[#f0eeec]"
        }`}>
          {label}
        </span>
      </motion.div>
    </div>
  );
}
