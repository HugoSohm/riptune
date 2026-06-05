import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Cloud,
  Download,
  ExternalLink,
  FolderOpen,
  HardDrive,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useApp } from "../context/useApp";
import { useAudioProcessor } from "../hooks/useAudioProcessor";
import { useDownloader } from "../hooks/useDownloader";
import type { HistoryEntry } from "../types";
import ActionBtn from "./ActionBtn";
import TruncatedText from "./TruncatedText";

interface HistoryRowProps {
  item: HistoryEntry;
  isLast: boolean;
  onPlayItem: (item: HistoryEntry) => Promise<void>;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}

export default function HistoryRow({
  item,
  isLast,
  onPlayItem,
  openMenuId,
  setOpenMenuId,
}: HistoryRowProps) {
  const {
    currentTrack,
    isVisible,
    isPlaying,
    isTaskActive,
    handleDeleteHistoryItem,
    setUrl,
    setShouldDownload,
    setAutoAnalyze,
    t,
  } = useApp();

  const { processFile } = useAudioProcessor();
  const { handleDownload } = useDownloader();

  const getSource = (url: string) => {
    const l = url.toLowerCase();
    if (l.includes("youtube.com") || l.includes("youtu.be")) return "youtube";
    if (l.includes("soundcloud.com")) return "soundcloud";
    return "local";
  };

  const src = getSource(item.url || "");

  const ActionButtons = (
    <>
      {/* Analyze */}
      {isTaskActive(item.id, "analysis") ? (
        <div className="action-btn !w-10 !h-10 !rounded-xl !border-white/[0.06] !bg-white/[0.03]">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
        </div>
      ) : (
        <ActionBtn
          onClick={() =>
            item.bpm === undefined &&
            !item.isTemp &&
            processFile(
              item.filepath,
              item.title,
              item.artist,
              item.isTemp,
              item.url,
              item.id,
            )
          }
          disabled={item.bpm !== undefined || item.isTemp}
          tooltip={
            item.bpm === undefined && !item.isTemp
              ? t.history.tooltips.analyze
              : t.history.tooltips.analyzed
          }
          className={
            item.bpm === undefined && !item.isTemp
              ? "!w-10 !h-10 !rounded-xl hover:bg-violet-500/20 hover:text-violet-300 hover:border-violet-500/25"
              : "!w-10 !h-10 !rounded-xl opacity-25 cursor-not-allowed"
          }
        >
          <Sparkles className="w-4 h-4" />
        </ActionBtn>
      )}

      {/* Download / Open folder */}
      {isTaskActive(item.id, "download") && item.isTemp && item.url ? (
        <div className="action-btn !w-10 !h-10 !rounded-xl !border-white/[0.06] !bg-white/[0.03]">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        </div>
      ) : item.isTemp && item.url ? (
        <ActionBtn
          onClick={() => {
            setUrl(item.url || "");
            setShouldDownload(true);
            setAutoAnalyze(false);
            handleDownload(item.url, true, false, item.id);
          }}
          tooltip={t.history.tooltips.download}
          className="!w-10 !h-10 !rounded-xl hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/25"
        >
          <Download className="w-4 h-4" />
        </ActionBtn>
      ) : (
        <ActionBtn
          onClick={() =>
            !item.isTemp &&
            invoke("open_file", {
              filepath: item.filepath,
            })
          }
          disabled={item.isTemp}
          tooltip={
            !item.isTemp
              ? t.history.tooltips.open
              : t.history.tooltips.notDownloaded
          }
          className={
            item.isTemp
              ? "!w-10 !h-10 !rounded-xl opacity-25 cursor-not-allowed"
              : "!w-10 !h-10 !rounded-xl"
          }
        >
          <FolderOpen className="w-4 h-4" />
        </ActionBtn>
      )}

      {/* External link */}
      <ActionBtn
        onClick={() => item.url && openUrl(item.url)}
        disabled={!item.url}
        tooltip={
          item.url
            ? t.history.tooltips.openSourceUrl
            : t.history.tooltips.noSourceUrl
        }
        className={
          !item.url
            ? "!w-10 !h-10 !rounded-xl opacity-25 cursor-not-allowed"
            : "!w-10 !h-10 !rounded-xl"
        }
      >
        <ExternalLink className="w-4 h-4" />
      </ActionBtn>

      {/* Delete */}
      <ActionBtn
        onClick={() => handleDeleteHistoryItem(item.id)}
        tooltip={t.history.tooltips.delete}
        className="!w-10 !h-10 !rounded-xl hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20"
        tooltipAlign="right"
      >
        <Trash2 className="w-4 h-4" />
      </ActionBtn>
    </>
  );

  return (
    <tr
      className={`group/row border-b border-white/[0.04] last:border-none transition-colors duration-100 ${
        currentTrack?.id === item.id && isVisible
          ? "bg-violet-500/[0.04] border-violet-500/[0.06]"
          : ""
      }`}
    >
      {/* ── Play button ──────────────────────────────── */}
      <td className={`px-3 py-[21px] ${isLast ? "rounded-bl-2xl" : ""}`}>
        {!item.isTemp && item.filepath ? (
          <button
            type="button"
            onClick={() => onPlayItem(item)}
            className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden cursor-pointer group/play"
          >
            {/* Idle state: always shown when player is closed OR track is not active/playing */}
            <div
              className={`absolute inset-0 rounded-xl flex items-center justify-center text-slate-600 transition-all duration-150 ${
                currentTrack?.id === item.id && isVisible && isPlaying
                  ? "opacity-0"
                  : "group-hover/play:opacity-0"
              }`}
            >
              <Play className="w-4 h-4" />
            </div>

            {/* Playing equalizer state - shown when track is active, open, and playing (but hides on hover!) */}
            {currentTrack?.id === item.id && isVisible && isPlaying && (
              <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-600/30 to-indigo-600/20 border border-violet-500/20 group-hover/play:opacity-0 transition-all duration-150">
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
            )}

            {/* Hover / Active state: only shown when hovered */}
            <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-violet-600 transition-all duration-150 opacity-0 group-hover/play:opacity-100">
              {currentTrack?.id === item.id && isVisible && isPlaying ? (
                <Pause className="w-4 h-4 fill-white text-white" />
              ) : (
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              )}
            </div>
          </button>
        ) : (
          /* Non-playable (temp): grayed out play icon */
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700">
            <Play className="w-4 h-4" />
          </div>
        )}
      </td>

      {/* ── Track (title + artist) ───────────────────── */}
      <td className="px-5 py-[21px] min-w-0 max-w-0">
        <TruncatedText
          text={item.title}
          className="text-[15px] font-semibold text-white"
        />
        <div className="text-[12px] text-slate-500 mt-1 truncate">
          {item.artist || t.home.unknownArtist}
        </div>
      </td>

      {/* ── Source icon ───────────────────────────────── */}
      <td className="px-4 py-[21px] text-center">
        <div className="group/src relative inline-block">
          {src === "youtube" && (
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400">
              <Play className="w-4 h-4 fill-red-400/20" />
            </div>
          )}
          {src === "soundcloud" && (
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400">
              <Cloud className="w-4 h-4 fill-orange-400/10" />
            </div>
          )}
          {src === "local" && (
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-300">
              <HardDrive className="w-4 h-4" />
            </div>
          )}
          {/* Source tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 bg-[#1e2330]/95 backdrop-blur-xl border border-white/[0.08] text-white text-[10px] font-medium rounded-lg shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 scale-95 group-hover/src:opacity-100 group-hover/src:scale-100 transition-all duration-150 group-hover/src:delay-[400ms] origin-bottom">
            {src === "youtube"
              ? t.history.sources.youtube
              : src === "soundcloud"
                ? t.history.sources.soundcloud
                : t.history.sources.local}
          </div>
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-[21px] whitespace-nowrap">
        <div className="text-[14px] text-slate-300">
          {new Date(item.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div className="text-[12px] text-slate-600 mt-1">
          {new Date(item.date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </td>

      {/* BPM */}
      <td className="px-3 py-[21px] text-center">
        <span className="inline-flex items-center justify-center w-20 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 text-[15px] font-extrabold text-violet-300 select-text">
          {item.bpm ?? ""}
        </span>
      </td>

      {/* Key */}
      <td className="px-3 py-[21px] text-center">
        <span className="inline-flex items-center justify-center w-20 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-[15px] font-extrabold text-indigo-300 whitespace-nowrap select-text">
          {item.key ?? ""}
        </span>
      </td>

      {/* Actions */}
      <td className={`px-4 py-[21px] ${isLast ? "rounded-br-2xl" : ""}`}>
        <div className="hidden xl:flex items-center justify-center gap-1.5">
          {ActionButtons}
        </div>
        <div className="flex xl:hidden items-center justify-center action-menu-container relative w-fit mx-auto">
          <button
            type="button"
            onClick={() =>
              setOpenMenuId(openMenuId === item.id ? null : item.id)
            }
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
              openMenuId === item.id
                ? "bg-white/[0.08] border-white/[0.1] text-white"
                : "hover:bg-white/[0.05] border-transparent hover:border-white/[0.05] text-slate-400 hover:text-slate-200"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {openMenuId === item.id && (
            <div className="absolute right-0 top-[calc(100%+6px)] bg-[#161a22] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/50 flex flex-col z-50 py-1.5 min-w-[200px] w-max overflow-hidden origin-top-right">
              {/* Analyze */}
              {isTaskActive(item.id, "analysis") ? (
                <div className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] text-violet-400 bg-white/[0.02]">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="whitespace-nowrap">
                    {t.history.tooltips.analyze}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (item.bpm === undefined && !item.isTemp) {
                      processFile(
                        item.filepath,
                        item.title,
                        item.artist,
                        item.isTemp,
                        item.url,
                        item.id,
                      );
                      setOpenMenuId(null);
                    }
                  }}
                  disabled={item.bpm !== undefined || item.isTemp}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium transition-colors w-full text-left
                      ${
                        item.bpm === undefined && !item.isTemp
                          ? "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          : "text-slate-500 opacity-50 cursor-not-allowed"
                      }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {item.bpm === undefined && !item.isTemp
                      ? t.history.tooltips.analyze
                      : t.history.tooltips.analyzed}
                  </span>
                </button>
              )}

              {/* Download / Open folder */}
              {isTaskActive(item.id, "download") && item.isTemp && item.url ? (
                <div className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] text-blue-400 bg-white/[0.02]">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="whitespace-nowrap">
                    {t.history.tooltips.download}
                  </span>
                </div>
              ) : item.isTemp && item.url ? (
                <button
                  type="button"
                  onClick={() => {
                    setUrl(item.url || "");
                    setShouldDownload(true);
                    setAutoAnalyze(false);
                    handleDownload(item.url, true, false, item.id);
                    setOpenMenuId(null);
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors w-full text-left"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {t.history.tooltips.download}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!item.isTemp) {
                      invoke("open_file", {
                        filepath: item.filepath,
                      });
                      setOpenMenuId(null);
                    }
                  }}
                  disabled={item.isTemp}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium transition-colors w-full text-left
                      ${
                        !item.isTemp
                          ? "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          : "text-slate-500 opacity-50 cursor-not-allowed"
                      }`}
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {!item.isTemp
                      ? t.history.tooltips.open
                      : t.history.tooltips.notDownloaded}
                  </span>
                </button>
              )}

              {/* External link */}
              <button
                type="button"
                onClick={() => {
                  if (item.url) {
                    openUrl(item.url);
                    setOpenMenuId(null);
                  }
                }}
                disabled={!item.url}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium transition-colors w-full text-left
                    ${
                      item.url
                        ? "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        : "text-slate-500 opacity-50 cursor-not-allowed"
                    }`}
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">
                  {item.url
                    ? t.history.tooltips.openSourceUrl
                    : t.history.tooltips.noSourceUrl}
                </span>
              </button>

              <div className="h-px w-full bg-white/[0.06] my-1" />

              {/* Delete */}
              <button
                type="button"
                onClick={() => {
                  handleDeleteHistoryItem(item.id);
                  setOpenMenuId(null);
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">
                  {t.history.tooltips.delete}
                </span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
