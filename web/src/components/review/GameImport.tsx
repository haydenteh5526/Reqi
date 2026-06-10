"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Link, FileText } from "lucide-react";

interface GameImportProps {
  onImport: (pgn: string) => void;
}

export function GameImport({ onImport }: GameImportProps) {
  const [pgnInput, setPgnInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [tab, setTab] = useState<"paste" | "file" | "url">("paste");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePaste = useCallback(() => {
    if (!pgnInput.trim()) return;
    setError(null);
    onImport(pgnInput.trim());
  }, [pgnInput, onImport]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      if (text.trim()) onImport(text.trim());
      else setError("File is empty");
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  }, [onImport]);

  const handleUrl = useCallback(async () => {
    if (!urlInput.trim()) return;
    setError(null);
    try {
      const res = await fetch(urlInput.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.trim()) onImport(text.trim());
      else setError("URL returned empty content");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch URL");
    }
  }, [urlInput, onImport]);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1816] rounded-lg p-1">
        <TabBtn active={tab === "paste"} onClick={() => setTab("paste")}><FileText size={13} /> Paste</TabBtn>
        <TabBtn active={tab === "file"} onClick={() => setTab("file")}><Upload size={13} /> File</TabBtn>
        <TabBtn active={tab === "url"} onClick={() => setTab("url")}><Link size={13} /> URL</TabBtn>
      </div>

      {/* Paste */}
      {tab === "paste" && (
        <>
          <textarea
            value={pgnInput}
            onChange={(e) => setPgnInput(e.target.value)}
            placeholder={`Paste PGN here...\n\n[Red "Player1"]\n[Black "Player2"]\n\n1. h2e2 h9g7 2. e2e6 ...`}
            data-gramm="false"
            spellCheck={false}
            className="w-full h-40 bg-[#1a1816] rounded-lg p-4 text-sm font-mono text-[#e8e6e3] placeholder:text-[#5a5654] resize-none border border-white/[0.06] focus:border-[#81b64c]/50 transition-colors outline-none [&:focus-visible]:outline-none"
          />
          <button onClick={handlePaste} disabled={!pgnInput.trim()} className="w-full py-3 rounded-lg bg-[#81b64c] hover:bg-[#8fc455] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all">
            Analyze Game
          </button>
        </>
      )}

      {/* File upload */}
      {tab === "file" && (
        <div
          onClick={() => fileRef.current?.click()}
          className="h-40 border-2 border-dashed border-white/[0.08] rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#81b64c]/40 transition-colors"
        >
          <Upload size={24} className="text-[#5a5654]" />
          <span className="text-sm text-[#8b8784]">Click to upload .pgn file</span>
          <input ref={fileRef} type="file" accept=".pgn,.txt" onChange={handleFile} className="hidden" />
        </div>
      )}

      {/* URL */}
      {tab === "url" && (
        <>
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/game.pgn"
            className="w-full bg-[#1a1816] rounded-lg px-4 py-3 text-sm font-mono text-[#e8e6e3] placeholder:text-[#5a5654] border border-white/[0.06] focus:border-[#81b64c]/50 transition-colors outline-none [&:focus-visible]:outline-none"
          />
          <button onClick={handleUrl} disabled={!urlInput.trim()} className="w-full py-3 rounded-lg bg-[#81b64c] hover:bg-[#8fc455] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all">
            Import from URL
          </button>
        </>
      )}

      {error && <p className="text-xs text-[#ca3431]">{error}</p>}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
        active ? "bg-[#262421] text-[#e8e6e3]" : "text-[#8b8784] hover:text-[#b0aba6]"
      }`}
    >
      {children}
    </button>
  );
}
