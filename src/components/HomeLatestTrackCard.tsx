import { invoke } from "@tauri-apps/api/core";
import {
  Check,
  Copy,
  Folder,
  FolderOpen,
  Music,
  Pause,
  Play,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/useApp";

export default function HomeLatestTrackCard() {
  const {
    latest,
    latestPlaylist,
    t,
    currentTrack,
    isPlaying,
    isVisible,
    togglePlay,
    playTrack,
    addNotification,
  } = useApp();

  const [trackCopied, setTrackCopied] = useState(false);

  const handleCopyTrack = async (text: string, filepath?: string) => {
    try {
      if (filepath) {
        await invoke("copy_file_to_clipboard", { filepath });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setTrackCopied(true);
      setTimeout(() => setTrackCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy file", err);
      await navigator.clipboard.writeText(text);
      setTrackCopied(true);
      setTimeout(() => setTrackCopied(false), 1500);
    }
  };

  const AUDIO_SERVER = "http://127.0.0.1:4774";

  const handlePlayLatest = async () => {
    if (!latest?.filepath) return;

    if (currentTrack && currentTrack.id === latest.id && isVisible) {
      togglePlay();
      return;
    }

    const audioUrl = `${AUDIO_SERVER}/audio?path=${encodeURIComponent(latest.filepath)}`;
    try {
      const res = await fetch(audioUrl, { method: "HEAD" });
      if (!res.ok) {
        addNotification(t.notifications.errorNotFound, "error");
        return;
      }
    } catch (_) {
      addNotification(t.notifications.errorNotFound, "error");
      return;
    }
    playTrack(latest);
  };

  if (latestPlaylist) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4 anim-delay-3 anim-fade-up">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
            <Folder className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">
              {latestPlaylist.title}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {t.home.playlist}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="group/tool relative">
            <button
              type="button"
              onClick={() =>
                handleCopyTrack(latestPlaylist.title, latestPlaylist.filepath)
              }
              className="group p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.1] text-violet-400 transition-all cursor-pointer active:scale-95"
            >
              {trackCopied ? (
                <Check className="w-4 h-4 text-emerald-400 animate-scale-up" />
              ) : (
                <Copy className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              )}
            </button>
            <div className="absolute bottom-full right-0 mb-1.5 px-2.5 py-1 bg-[#1e2330]/95 backdrop-blur-xl border border-white/[0.08] text-white text-[10px] font-medium rounded-lg shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 scale-95 group-hover/tool:opacity-100 group-hover/tool:scale-100 transition-all duration-150 group-hover/tool:delay-[600ms]">
              {trackCopied ? t.home.copied : t.home.copy}
            </div>
          </div>

          {latestPlaylist.filepath && (
            <div className="group/tool relative">
              <button
                type="button"
                onClick={() =>
                  invoke("open_folder", { path: latestPlaylist.filepath })
                }
                className="group p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.1] text-violet-400 transition-all cursor-pointer active:scale-95"
              >
                <FolderOpen className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              </button>
              <div className="absolute bottom-full right-0 mb-1.5 px-2.5 py-1 bg-[#1e2330]/95 backdrop-blur-xl border border-white/[0.08] text-white text-[10px] font-medium rounded-lg shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 scale-95 group-hover/tool:opacity-100 group-hover/tool:scale-100 transition-all duration-150 group-hover/tool:delay-[600ms]">
                {t.history.tooltips.open}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (latest) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4 anim-delay-3 anim-fade-up">
        <div className="flex items-center gap-3.5 min-w-0">
          {currentTrack?.id === latest.id && isVisible && isPlaying ? (
            /* Playing equalizer state - shown as a static div when track is active, open, and playing */
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
              <div className="flex items-end gap-[3px] h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-violet-400"
                    style={{
                      height: "100%",
                      animation: `playerBar${i} 0.7s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : !latest.isTemp && latest.filepath ? (
            /* Playable idle state: show the standard decorative music icon */
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <Music className="w-5 h-5" />
            </div>
          ) : (
            /* Temp/Non-playable idle state: grayed out music icon */
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center text-slate-600 shrink-0">
              <Music className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">
              {latest.title}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {latest.artist || t.home.unknownArtist}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!latest.isTemp && latest.filepath && (
            <div className="group/tool relative">
              <button
                type="button"
                onClick={handlePlayLatest}
                className="group p-2.5 rounded-lg bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 text-violet-400 hover:text-violet-300 transition-all cursor-pointer active:scale-95"
              >
                {currentTrack?.id === latest.id && isVisible && isPlaying ? (
                  <Pause className="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-110" />
                ) : (
                  <Play className="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-110" />
                )}
              </button>
              <div className="absolute bottom-full right-0 mb-1.5 px-2.5 py-1 bg-[#1e2330]/95 backdrop-blur-xl border border-white/[0.08] text-white text-[10px] font-medium rounded-lg shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 scale-95 group-hover/tool:opacity-100 group-hover/tool:scale-100 transition-all duration-150 group-hover/tool:delay-[600ms]">
                {currentTrack?.id === latest.id && isVisible && isPlaying
                  ? "Pause"
                  : t.history.tooltips.play || "Play"}
              </div>
            </div>
          )}

          {!latest.isTemp && (
            <div className="group/tool relative">
              <button
                type="button"
                onClick={() =>
                  handleCopyTrack(
                    latest.artist
                      ? `${latest.artist} - ${latest.title}`
                      : latest.title,
                    latest.filepath,
                  )
                }
                className="group p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.1] text-violet-400 transition-all cursor-pointer active:scale-95"
              >
                {trackCopied ? (
                  <Check className="w-4 h-4 text-emerald-400 animate-scale-up" />
                ) : (
                  <Copy className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                )}
              </button>
              <div className="absolute bottom-full right-0 mb-1.5 px-2.5 py-1 bg-[#1e2330]/95 backdrop-blur-xl border border-white/[0.08] text-white text-[10px] font-medium rounded-lg shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 scale-95 group-hover/tool:opacity-100 group-hover/tool:scale-100 transition-all duration-150 group-hover/tool:delay-[600ms]">
                {trackCopied ? t.home.copied : t.home.copy}
              </div>
            </div>
          )}

          {!latest.isTemp && latest.filepath && (
            <div className="group/tool relative">
              <button
                type="button"
                onClick={() =>
                  invoke("open_file", { filepath: latest.filepath })
                }
                className="group p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.1] text-violet-400 transition-all cursor-pointer active:scale-95"
              >
                <FolderOpen className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              </button>
              <div className="absolute bottom-full right-0 mb-1.5 px-2.5 py-1 bg-[#1e2330]/95 backdrop-blur-xl border border-white/[0.08] text-white text-[10px] font-medium rounded-lg shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 scale-95 group-hover/tool:opacity-100 group-hover/tool:scale-100 transition-all duration-150 group-hover/tool:delay-[600ms]">
                {t.history.tooltips.open}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 flex items-center justify-between gap-4 anim-delay-3 anim-fade-up opacity-40 select-none pointer-events-none">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center text-slate-600 shrink-0">
          <Music className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="h-3.5 w-32 bg-white/[0.05] rounded-md" />
          <div className="h-2.5 w-20 bg-white/[0.03] rounded-md mt-0.5" />
        </div>
      </div>
    </div>
  );
}
