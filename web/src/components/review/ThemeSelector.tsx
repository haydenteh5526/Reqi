"use client";

import { BOARD_THEMES, type BoardTheme } from "@/lib/board-themes";

interface ThemeSelectorProps {
  current: BoardTheme;
  onChange: (theme: BoardTheme) => void;
}

export function ThemeSelector({ current, onChange }: ThemeSelectorProps) {
  return (
    <div className="flex gap-1.5">
      {BOARD_THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onChange(theme)}
          title={theme.name}
          className={`w-7 h-7 rounded-md border-2 transition-all ${
            current.id === theme.id ? "border-[#81b64c] scale-110" : "border-transparent hover:border-white/20"
          }`}
          style={{ background: `linear-gradient(135deg, ${theme.boardBgCenter}, ${theme.boardBgEdge})` }}
        />
      ))}
    </div>
  );
}
