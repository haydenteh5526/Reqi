import type { Config } from "tailwindcss";

/**
 * Xiangqi.app — Tailwind CSS Configuration
 *
 * Design Tokens:
 *   Backgrounds : #312e2b (main), #262421 (panels/sidebar), #21201d (deep surface)
 *   Accent Red  : #A3262A (default), #B83135 (hover), #8B2024 (muted/pressed)
 *   Text        : #E8E6E3 (primary), #A09B96 (secondary), #6B6762 (muted)
 *
 * Referenced from globals.css via @config for Tailwind v4 compatibility.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        board: {
          bg: "#312e2b",
          panel: "#262421",
          surface: "#21201d",
        },
        accent: {
          DEFAULT: "#A3262A",
          hover: "#B83135",
          muted: "#8B2024",
        },
        text: {
          primary: "#E8E6E3",
          secondary: "#A09B96",
          muted: "#6B6762",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Arial", "Helvetica", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
