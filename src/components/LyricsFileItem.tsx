import { FileText, Trash2 } from "lucide-react";
import type { LyricsFile } from "../hooks/useLyrics";

interface LyricsFileItemProps {
  file: LyricsFile;
  isActive: boolean;
  isDirty: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

export default function LyricsFileItem({
  file,
  isActive,
  isDirty,
  onOpen,
  onDelete,
}: LyricsFileItemProps) {
  const displayName = file.title || file.filename.replace(/\.txt$/i, "");

  return (
    // biome-ignore lint/a11y/useSemanticElements: parent contains a delete button so we must use a div instead of button
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`group/item w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer ${
        isActive
          ? "bg-violet-500/10 border border-violet-500/20"
          : "hover:bg-white/[0.04] border border-transparent"
      }`}
    >
      <FileText
        className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-violet-400" : "text-slate-600"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[13px] font-medium truncate ${isActive ? "text-violet-200" : "text-slate-300"}`}
          >
            {displayName}
          </span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          )}
        </div>
        {file.artist && (
          <p className="text-[11px] text-slate-600 truncate mt-0.5">
            {file.artist}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/15 text-slate-600 hover:text-red-400 cursor-pointer shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
