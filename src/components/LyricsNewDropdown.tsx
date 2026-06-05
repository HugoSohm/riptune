import { Check, Music, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/useApp";
import type { LyricsFile } from "../hooks/useLyrics";

interface LyricsNewDropdownProps {
  files: LyricsFile[];
  onCreateLyrics: (entryId: string) => Promise<void>;
  onCreateBlankLyrics: () => Promise<void>;
}

export default function LyricsNewDropdown({
  files,
  onCreateLyrics,
  onCreateBlankLyrics,
}: LyricsNewDropdownProps) {
  const { history, t } = useApp();
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [newSearch, setNewSearch] = useState("");
  const newDropdownRef = useRef<HTMLDivElement>(null);
  const newSearchInputRef = useRef<HTMLInputElement>(null);

  // Close new dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        newDropdownRef.current &&
        !newDropdownRef.current.contains(e.target as Node)
      ) {
        setShowNewDropdown(false);
        setNewSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showNewDropdown) {
      setTimeout(() => newSearchInputRef.current?.focus(), 50);
    }
  }, [showNewDropdown]);

  const existingEntryIds = new Set(files.map((f) => f.entryId).filter(Boolean));
  const playableHistory = history
    .filter((h) => h.title && !h.isTemp)
    .filter((h) => {
      if (!newSearch.trim()) return true;
      const q = newSearch.toLowerCase();
      return (
        h.title?.toLowerCase().includes(q) ||
        h.artist?.toLowerCase().includes(q)
      );
    });

  const handleSelectTrack = async (entryId: string) => {
    setShowNewDropdown(false);
    setNewSearch("");
    await onCreateLyrics(entryId);
  };

  const handleSelectBlank = async () => {
    setShowNewDropdown(false);
    setNewSearch("");
    await onCreateBlankLyrics();
  };

  return (
    <div className="relative mb-3 shrink-0" ref={newDropdownRef}>
      <button
        type="button"
        onClick={() => setShowNewDropdown((v) => !v)}
        className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-semibold transition-all cursor-pointer active:scale-95 shadow-lg shadow-violet-500/20"
      >
        <Plus className="w-4 h-4" />
        {t.lyrics.newButton}
      </button>

      {showNewDropdown && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#161a22] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {/* Blank Lyrics Option */}
          <div className="border-b border-white/[0.06] py-1 shrink-0">
            <button
              type="button"
              onClick={handleSelectBlank}
              className="flex items-center gap-2 px-3.5 py-2 text-left w-full hover:bg-white/[0.05] cursor-pointer text-[13px]"
            >
              <Plus className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span className="text-white font-medium">
                {t.lyrics.createBlank}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
            <Search className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <input
              ref={newSearchInputRef}
              type="text"
              value={newSearch}
              onChange={(e) => setNewSearch(e.target.value)}
              placeholder={t.lyrics.searchPlaceholder}
              className="flex-1 bg-transparent border-none p-0 text-white text-[13px] caret-violet-400 focus:outline-none placeholder-slate-600"
            />
          </div>
          {/* Track list */}
          <div className="max-h-[220px] overflow-y-auto py-1.5 custom-scrollbar">
            {playableHistory.length === 0 ? (
              <p className="text-slate-600 text-[12px] px-3.5 py-3 text-center">
                {t.history.empty}
              </p>
            ) : (
              playableHistory.map((entry) => {
                const alreadyHas = existingEntryIds.has(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() =>
                      alreadyHas ? undefined : handleSelectTrack(entry.id)
                    }
                    disabled={alreadyHas}
                    className={`flex items-start gap-2.5 px-3.5 py-2 text-left w-full transition-colors text-[13px] ${
                      alreadyHas
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-white/[0.05] cursor-pointer"
                    }`}
                  >
                    <Music className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {entry.title}
                      </p>
                      {entry.artist && (
                        <p className="text-slate-500 text-[11px] truncate">
                          {entry.artist}
                        </p>
                      )}
                    </div>
                    {alreadyHas && (
                      <Check className="w-3.5 h-3.5 text-violet-400 ml-auto mt-0.5 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
