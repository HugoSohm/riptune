import {
  AlertCircle,
  FolderOpen,
  Pause,
  Pencil,
  Play,
  Save,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/useApp";
import type { LyricsFile } from "../hooks/useLyrics";
import ActionBtn from "./ActionBtn";

interface LyricsEditorHeaderProps {
  activeFilename: string;
  activeLyricsFile: LyricsFile;
  associatedEntry:
    | { id: string; title: string; artist?: string }
    | null
    | undefined;
  isCurrentTrackPlaying: boolean;
  saveStatus: "saved" | "saving" | "unsaved";
  isDirty: boolean;
  onRename: (oldName: string, newName: string) => Promise<string | null>;
  onPlayClick: () => void;
  onOpenFile: () => void;
  onSave: () => void;
}

export default function LyricsEditorHeader({
  activeFilename,
  activeLyricsFile,
  associatedEntry,
  isCurrentTrackPlaying,
  saveStatus,
  isDirty,
  onRename,
  onPlayClick,
  onOpenFile,
  onSave,
}: LyricsEditorHeaderProps) {
  const { t } = useApp();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Focus rename input when rename starts
  useEffect(() => {
    if (isRenaming) {
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 50);
    }
  }, [isRenaming]);

  // Reset rename state when file changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset state when activeFilename changes
  useEffect(() => {
    setIsRenaming(false);
    setRenameError(null);
  }, [activeFilename]);

  const handleStartRename = () => {
    const stem = activeFilename.endsWith(".txt")
      ? activeFilename.slice(0, -4)
      : activeFilename;
    setRenameValue(stem);
    setRenameError(null);
    setIsRenaming(true);
  };

  const handleConfirmRename = async () => {
    if (!renameValue.trim()) {
      setIsRenaming(false);
      return;
    }
    const trimmedNewName = renameValue.trim();
    const currentStem = activeFilename.endsWith(".txt")
      ? activeFilename.slice(0, -4)
      : activeFilename;

    if (trimmedNewName === currentStem) {
      setIsRenaming(false);
      setRenameError(null);
      return;
    }

    const result = await onRename(activeFilename, trimmedNewName);
    if (
      result &&
      result !== trimmedNewName &&
      result !== `${trimmedNewName}.txt`
    ) {
      // result is error string on failure
      setRenameError(t.lyrics.renameError);
    } else {
      setIsRenaming(false);
      setRenameError(null);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirmRename();
    if (e.key === "Escape") {
      setIsRenaming(false);
      setRenameError(null);
    }
  };

  return (
    <div className="flex items-center gap-3 mb-4 shrink-0 h-12">
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <div className="flex flex-col gap-1 relative">
            <div className="flex items-center gap-2">
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value);
                  setRenameError(null);
                }}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleConfirmRename}
                placeholder={t.lyrics.filenamePlaceholder}
                className="w-full max-w-[840px] bg-transparent border-none border-b border-violet-500/40 focus:border-violet-500/80 text-white text-[15px] font-semibold focus:outline-none p-0 pb-0.5 caret-violet-400 rounded-none"
              />
            </div>
            {renameError && (
              <p className="absolute top-full left-0 mt-1 text-red-400 text-[11px] flex items-center gap-1 bg-[#161a22] border border-red-500/20 px-2 py-0.5 rounded shadow-lg z-10">
                <AlertCircle className="w-3 h-3" />
                {renameError}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 group/rename">
            <h3 className="text-[15px] font-semibold text-white truncate">
              {activeFilename.replace(/\.txt$/i, "")}
            </h3>
            <button
              type="button"
              onClick={handleStartRename}
              className="opacity-0 group-hover/rename:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/[0.07] text-slate-500 hover:text-white cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {activeLyricsFile && (
          <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
            {activeLyricsFile.isOrphan && (
              <span className="inline-flex items-center gap-1 text-amber-500">
                <AlertCircle className="w-3 h-3" />
                {t.lyrics.orphanTooltip}
              </span>
            )}
            {activeLyricsFile.title && (
              <span className="truncate">
                {activeLyricsFile.artist
                  ? `${activeLyricsFile.artist} — ${activeLyricsFile.title}`
                  : activeLyricsFile.title}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Actions area (Save + Play) */}
      <div className="shrink-0 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-medium transition-colors select-none ${
              saveStatus === "saved"
                ? "text-emerald-500"
                : saveStatus === "saving"
                  ? "text-violet-400"
                  : "text-amber-400"
            }`}
          >
            {saveStatus === "saved"
              ? t.lyrics.saved
              : saveStatus === "saving"
                ? t.lyrics.saving
                : t.lyrics.unsaved}
          </span>
          <ActionBtn
            onClick={onSave}
            disabled={!isDirty}
            tooltip={t.lyrics.save}
            tooltipAlign="center"
            tooltipPosition="bottom"
          >
            <Save className="w-4 h-4" />
          </ActionBtn>
          <ActionBtn
            onClick={onOpenFile}
            tooltip={t.history.tooltips.open}
            tooltipAlign="right"
            tooltipPosition="bottom"
          >
            <FolderOpen className="w-4 h-4" />
          </ActionBtn>
        </div>

        {associatedEntry && (
          <ActionBtn
            onClick={onPlayClick}
            tooltip={isCurrentTrackPlaying ? "Pause" : t.history.tooltips.play}
            className="!bg-violet-600/10 !border-violet-500/20 !text-violet-400 hover:!bg-violet-600/20 hover:!text-violet-300"
            tooltipAlign="right"
            tooltipPosition="bottom"
          >
            {isCurrentTrackPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 text-violet-400 fill-violet-400/20" />
            )}
          </ActionBtn>
        )}
      </div>
    </div>
  );
}
