import { invoke } from "@tauri-apps/api/core";
import { FileText } from "lucide-react";
import { useState } from "react";
import LyricsDeleteModal from "../components/LyricsDeleteModal";
import LyricsEditorHeader from "../components/LyricsEditorHeader";
import LyricsFileItem from "../components/LyricsFileItem";
import LyricsNewDropdown from "../components/LyricsNewDropdown";
import { useApp } from "../context/useApp";
import { useLyrics } from "../hooks/useLyrics";

export default function Lyrics() {
  const {
    history,
    t,
    customLyricsDir,
    defaultLyricsDir,
    playTrack,
    togglePlay,
    isPlaying,
    currentTrack,
  } = useApp();
  const lyricsDir = customLyricsDir || defaultLyricsDir;

  const {
    files,
    activeFilename,
    content,
    isDirty,
    saveStatus,
    openLyricsFile,
    createLyricsFile,
    renameLyricsFile,
    deleteLyricsFile,
    handleContentChange,
    saveNow,
  } = useLyrics(lyricsDir, history);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<string | null>(
    null,
  );

  const handleCreateLyrics = async (entryId: string) => {
    const entry = history.find((h) => h.id === entryId);
    if (!entry) return;
    const filename = await createLyricsFile(entry);
    if (filename) {
      await openLyricsFile(filename);
    }
  };

  const handleCreateBlankLyrics = async () => {
    const filename = await createLyricsFile(null);
    if (filename) {
      await openLyricsFile(filename);
    }
  };

  const activeLyricsFile = files.find((f) => f.filename === activeFilename);

  const associatedEntry = activeLyricsFile?.entryId
    ? history.find((h) => h.id === activeLyricsFile.entryId)
    : null;

  const isCurrentTrackPlaying =
    !!isPlaying &&
    !!currentTrack &&
    !!associatedEntry &&
    currentTrack.id === associatedEntry.id;

  const isCurrentTrackLoaded =
    !!currentTrack &&
    !!associatedEntry &&
    currentTrack.id === associatedEntry.id;

  const handlePlayClick = () => {
    if (!associatedEntry) return;
    if (isCurrentTrackLoaded) {
      togglePlay();
    } else {
      playTrack(associatedEntry);
    }
  };

  const handleOpenFile = async () => {
    if (!lyricsDir || !activeFilename) return;
    const filepath = `${lyricsDir}/${activeFilename}`.replace(/\//g, "\\");
    try {
      await invoke("open_file", { filepath });
    } catch (e) {
      console.error("Failed to open lyrics file", e);
    }
  };

  return (
    <div className="flex h-full gap-0 anim-fade-up overflow-hidden">
      {/* ── LEFT PANEL: file list ──────────────────────────────────────────── */}
      <div className="w-[280px] min-w-[280px] flex flex-col h-full border-r border-white/[0.07] pr-4 mr-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {t.lyrics.title}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {t.lyrics.description}
            </p>
          </div>
        </div>

        {/* New button + dropdown */}
        <LyricsNewDropdown
          files={files}
          onCreateLyrics={handleCreateLyrics}
          onCreateBlankLyrics={handleCreateBlankLyrics}
        />

        {/* File list */}
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-slate-500 text-[13px] font-medium">
                {t.lyrics.emptyState}
              </p>
              <p className="text-slate-600 text-[12px]">
                {t.lyrics.emptyStateDesc}
              </p>
            </div>
          ) : (
            files.map((file) => (
              <LyricsFileItem
                key={file.filename}
                file={file}
                isActive={activeFilename === file.filename}
                isDirty={isDirty && activeFilename === file.filename}
                onOpen={() => openLyricsFile(file.filename)}
                onDelete={() => setDeleteConfirmFile(file.filename)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: editor ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {activeFilename && activeLyricsFile ? (
          <>
            {/* Editor header */}
            <LyricsEditorHeader
              activeFilename={activeFilename}
              activeLyricsFile={activeLyricsFile}
              associatedEntry={associatedEntry}
              isCurrentTrackPlaying={isCurrentTrackPlaying}
              saveStatus={saveStatus}
              isDirty={isDirty}
              onRename={renameLyricsFile}
              onPlayClick={handlePlayClick}
              onOpenFile={handleOpenFile}
              onSave={saveNow}
            />

            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              spellCheck={false}
              className="
                flex-1 w-full resize-none
                bg-[#0d1018] border border-white/[0.07] rounded-2xl
                px-6 py-5
                text-slate-200 text-[14px] leading-relaxed
                font-mono
                caret-violet-400
                focus:outline-none focus:border-violet-500/30
                transition-colors placeholder-slate-700
                custom-scrollbar
              "
              placeholder={t.lyrics.placeholder}
            />
          </>
        ) : (
          /* Empty state — no file selected */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-slate-500 text-[14px]">{t.lyrics.emptyEditor}</p>
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ─────────────────────────────────────────────── */}
      {deleteConfirmFile && (
        <LyricsDeleteModal
          filename={deleteConfirmFile}
          onClose={() => setDeleteConfirmFile(null)}
          onConfirm={async () => {
            await deleteLyricsFile(deleteConfirmFile);
            setDeleteConfirmFile(null);
          }}
        />
      )}
    </div>
  );
}
