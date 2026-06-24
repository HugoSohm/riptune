import { Download, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/useApp";
import { useDownloader } from "../hooks/useDownloader";
import CheckPill from "./CheckPill";
import CustomSelect from "./CustomSelect";

export default function HomeUrlInputCard() {
  const {
    isTaskActive,
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
  } = useApp();

  const { handleDownload, handleCancelDownload } = useDownloader();

  const isPurePlaylistUrl =
    /\/playlist\?list=/i.test(url) || /\/sets\//i.test(url);
  const homeTaskIdRef = useRef<string | null>(null);
  const [homeTaskId, setHomeTaskId] = useState<string | null>(null);

  const isHomeTaskActive = homeTaskId !== null && isTaskActive(homeTaskId);

  useEffect(() => {
    if (url.includes("list=") || url.includes("/sets/")) {
      setIsPlaylist(true);
    } else {
      setIsPlaylist(false);
      setDownloadPlaylist(false);
    }
    if (isPurePlaylistUrl) setDownloadPlaylist(true);
  }, [url, isPurePlaylistUrl, setIsPlaylist, setDownloadPlaylist]);

  const isValidUrl = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return false;
    const isYoutube = /youtube\.com|youtu\.be|youtube-nocookie\.com/i.test(
      trimmed,
    );
    const isSoundcloud = /soundcloud\.com/i.test(trimmed);
    if (!isYoutube && !isSoundcloud) return false;
    try {
      const urlString =
        trimmed.startsWith("http://") || trimmed.startsWith("https://")
          ? trimmed
          : `https://${trimmed}`;
      const parsed = new URL(urlString);
      return parsed.pathname.length > 1;
    } catch {
      return false;
    }
  };

  const startDownload = () => {
    const id = crypto.randomUUID();
    homeTaskIdRef.current = id;
    setHomeTaskId(id);
    handleDownload(undefined, undefined, undefined, id).finally(() => {
      homeTaskIdRef.current = null;
      setHomeTaskId(null);
    });
  };

  const urlInvalid = url && !isValidUrl(url);

  return (
    <div className="card p-5 relative z-20 anim-fade-up">
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const canDownload =
                !isHomeTaskActive &&
                url &&
                isValidUrl(url) &&
                (shouldDownload || autoAnalyze);
              if (canDownload) {
                e.preventDefault();
                startDownload();
              }
            }
          }}
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
            <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
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
              { value: "mp3_hd", label: "MP3 HD" },
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
  );
}
