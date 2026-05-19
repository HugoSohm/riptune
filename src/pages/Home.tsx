import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Check,
  Copy,
  Download,
  Folder,
  FolderOpen,
  Loader2,
  Music,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CheckPill from "../components/CheckPill";
import CustomSelect from "../components/CustomSelect";
import StatCard from "../components/StatCard";
import { useApp } from "../context/useApp";
import { useAudioProcessor } from "../hooks/useAudioProcessor";
import { useDownloader } from "../hooks/useDownloader";

/* ─── Home page ─────────────────────────────────────────────── */
export default function Home() {
  const {
    isTaskActive,
    latest,
    latestPlaylist,
    t,
    isPlaylist,
    setIsPlaylist,
    shouldDownload,
    setShouldDownload,
    autoAnalyze,
    setAutoAnalyze,
    downloadPlaylist,
    setDownloadPlaylist,
    url,
    setUrl,
    format,
    setFormat,
    dragActive,
  } = useApp();

  const isPurePlaylistUrl =
    /\/playlist\?list=/i.test(url) || /\/sets\//i.test(url);
  const homeTaskIdRef = useRef<string | null>(null);
  const [homeTaskId, setHomeTaskId] = useState<string | null>(null);
  const { handleDownload, handleCancelDownload } = useDownloader();
  const { processFile } = useAudioProcessor();
  const isHomeTaskActive = homeTaskId !== null && isTaskActive(homeTaskId);
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

  const handleBrowseFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Audio Files",
            extensions: ["mp3", "wav", "flac", "m4a", "ogg", "aac", "wma"],
          },
        ],
      });
      if (selected && typeof selected === "string") {
        processFile(selected);
      }
    } catch (error) {
      console.error("Failed to browse audio file", error);
    }
  };

  useEffect(() => {
    if (url.includes("list=") || url.includes("/sets/")) {
      setIsPlaylist(true);
    } else {
      setIsPlaylist(false);
      setDownloadPlaylist(false);
    }
    if (isPurePlaylistUrl) setDownloadPlaylist(true);
  }, [url, isPurePlaylistUrl, setIsPlaylist, setDownloadPlaylist]);

  const startDownload = () => {
    const id = crypto.randomUUID();
    homeTaskIdRef.current = id;
    setHomeTaskId(id);
    handleDownload(undefined, undefined, undefined, id).finally(() => {
      homeTaskIdRef.current = null;
      setHomeTaskId(null);
    });
  };

  const isValidUrl = (v: string) => {
    const t = v.trim();
    if (!t) return false;
    const isYoutube = /youtube\.com|youtu\.be|youtube-nocookie\.com/i.test(t);
    const isSoundcloud = /soundcloud\.com/i.test(t);
    if (!isYoutube && !isSoundcloud) return false;
    try {
      const urlString =
        t.startsWith("http://") || t.startsWith("https://")
          ? t
          : `https://${t}`;
      const parsed = new URL(urlString);
      return parsed.pathname.length > 1;
    } catch {
      return false;
    }
  };

  const urlInvalid = url && !isValidUrl(url);

  return (
    <div className="flex flex-col gap-6 pb-6 anim-fade-up">
      {/* ── Drag & Drop Area (first) ─────────────────────────── */}
      <div
        onClick={handleBrowseFile}
        className={`group/drop card p-5 border-2 border-dashed flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 min-h-[90px] relative overflow-hidden anim-fade-up ${dragActive ? "border-violet-500 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,0.25)] scale-[1.01]" : "border-white/[0.06] hover:border-violet-500/25 bg-white/[0.01] hover:bg-violet-500/[0.02]"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 to-indigo-600/0 group-hover/drop:to-indigo-600/[0.015] transition-all duration-300 pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 shrink-0 ${dragActive ? "border-violet-500 bg-violet-500/20 text-violet-400" : "bg-white/[0.03] border-white/[0.06] group-hover/drop:border-violet-500/20 group-hover/drop:bg-violet-500/10 text-slate-400 group-hover/drop:text-violet-400"}`}
          >
            <UploadCloud className="w-5 h-5 transition-transform duration-300 group-hover/drop:scale-110" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold text-white">
              {t.home.dropTitle}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t.home.dropDesc}
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-medium transition-colors z-10 px-3 py-1.5 rounded-lg shrink-0 ${dragActive ? "text-white bg-violet-500/20 border border-violet-500/30" : "text-violet-400 bg-white/[0.03] border border-white/[0.06] group-hover/drop:border-violet-500/20 group-hover/drop:text-violet-300"}`}
        >
          {t.home.browse}
        </span>
      </div>

      {/* ── Delimiter ────────────────────────────────────────── */}
      <div className="flex items-center gap-4 py-1 select-none anim-delay-1 anim-fade-up">
        <div className="flex-1 h-px bg-white/[0.04]" />
        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-600">
          {t.home.or}
        </span>
        <div className="flex-1 h-px bg-white/[0.04]" />
      </div>

      {/* ── URL input card (second) ──────────────────────────── */}
      <div className="card p-5 relative z-20 anim-delay-1 anim-fade-up">
        <div className="flex items-center gap-2 mb-4 select-none">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          <span className="section-label">
            {t.home.analyze} / {t.home.download}
          </span>
        </div>

        <div
          className={`flex items-center bg-[#0d0f14] border rounded-xl overflow-hidden transition-colors duration-200
          ${urlInvalid ? "border-red-500/40" : "border-white/[0.08] focus-within:border-violet-500/40"}`}
        >
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t.home.urlPlaceholder}
            disabled={isHomeTaskActive}
            className="flex-1 bg-transparent border-none text-sm text-white px-4 py-3 caret-violet-400 focus:outline-none focus:ring-0 placeholder-slate-600 focus:placeholder-transparent disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => {
              if (isHomeTaskActive) {
                if (homeTaskIdRef.current) {
                  handleCancelDownload(homeTaskIdRef.current);
                }
                setHomeTaskId(null);
                homeTaskIdRef.current = null;
              } else {
                startDownload();
              }
            }}
            disabled={
              !isHomeTaskActive &&
              (!url || !isValidUrl(url) || (!shouldDownload && !autoAnalyze))
            }
            className="group shrink-0 m-1.5 h-9 w-9 rounded-lg bg-white text-[#0d0f14] flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {!isHomeTaskActive ? (
              <Download className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                <XCircle className="w-4 h-4 text-red-500 hidden" />
              </>
            )}
          </button>
        </div>

        {urlInvalid && (
          <div className="flex items-center gap-1.5 mt-2 text-red-400 text-xs">
            <XCircle className="w-3 h-3" />
            <span>{t.home.invalidUrl}</span>
          </div>
        )}

        {/* Options row */}
        <div className="flex items-center flex-wrap gap-2 mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center h-9 gap-2 px-4 rounded-xl border border-white/[0.06] bg-transparent">
            <span className="section-label">{t.home.format}</span>
            <CustomSelect
              options={[
                { value: "mp3", label: "MP3" },
                { value: "wav", label: "WAV" },
                { value: "flac", label: "FLAC" },
                { value: "m4a", label: "M4A" },
              ]}
              value={format}
              onChange={setFormat}
              variant="small"
              className="min-w-[60px]"
            />
          </div>
          <CheckPill
            label={t.home.download}
            checked={shouldDownload}
            onChange={setShouldDownload}
            disabled={isHomeTaskActive}
          />
          <CheckPill
            label={t.home.analyze}
            checked={autoAnalyze}
            onChange={setAutoAnalyze}
            disabled={isHomeTaskActive}
          />
          <CheckPill
            label={t.home.playlist}
            checked={downloadPlaylist}
            onChange={setDownloadPlaylist}
            disabled={isHomeTaskActive || !isPlaylist || isPurePlaylistUrl}
            accent="blue"
          />
        </div>
      </div>

      {/* ── Delimiter (simple) ────────────────────────────────── */}
      <div className="h-px bg-white/[0.04] w-full anim-delay-2 anim-fade-up" />

      {/* ── Stat row: BPM + Key (second) ─────────────────────── */}
      <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full">
        <div className="flex gap-4 anim-delay-2 anim-fade-up">
          <StatCard
            label={t.home.bpm}
            value={!latestPlaylist ? latest?.bpm : undefined}
            sub={
              !latestPlaylist && latest?.bpm
                ? (latest.bpmFromYoutube ?? latest.fromYoutubeDesc)
                  ? t.home.fromYoutube
                  : `~${Math.round((latest.bpmConfidence ?? 0.8) * 100)}% ${t.home.confidence}`
                : undefined
            }
            accent="violet"
            empty={!!latestPlaylist || !latest?.bpm}
            copiableValue={!latestPlaylist ? latest?.bpm : undefined}
            copiedLabel={t.home.copied}
          />
          <StatCard
            label={t.home.key}
            value={!latestPlaylist ? latest?.key : undefined}
            sub={
              !latestPlaylist && latest?.key
                ? (latest.keyFromYoutube ?? latest.fromYoutubeDesc)
                  ? t.home.fromYoutube
                  : `~${Math.round((latest.keyStrength ?? 0.5) * 100)}% ${t.home.confidence}`
                : undefined
            }
            accent="indigo"
            empty={!!latestPlaylist || !latest?.key}
            copiableValue={!latestPlaylist ? latest?.key : undefined}
            copiedLabel={t.home.copied}
          />
        </div>

        {/* ── Last Processed Track card (third) ───────────────── */}
        {latestPlaylist && (
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
                    handleCopyTrack(
                      latestPlaylist.title,
                      latestPlaylist.filepath,
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
        )}

        {!latestPlaylist && latest && (
          <div className="card p-4 flex items-center justify-between gap-4 anim-delay-3 anim-fade-up">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <Music className="w-5 h-5" />
              </div>
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
        )}

        {!latestPlaylist && !latest && (
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
        )}
      </div>
    </div>
  );
}
