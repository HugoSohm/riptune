import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Cloud,
  Download,
  ExternalLink,
  FolderOpen,
  HardDrive,
  List,
  Loader2,
  Play,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ActionBtn from "../components/ActionBtn";
import TruncatedText from "../components/TruncatedText";
import { useApp } from "../context/useApp";
import { useAudioProcessor } from "../hooks/useAudioProcessor";
import { useDownloader } from "../hooks/useDownloader";

export default function History() {
  const {
    history,
    t,
    handleDeleteHistoryItem,
    setUrl,
    setShouldDownload,
    setAutoAnalyze,
    isTaskActive,
  } = useApp();
  const { processFile } = useAudioProcessor();
  const { handleDownload } = useDownloader();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);
  const observerTarget = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    setVisibleCount(50);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((p) => p + 20);
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, []);

  const filtered = history.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.artist?.toLowerCase().includes(q)
    );
  });
  const displayed = filtered.slice(0, visibleCount);

  const getSource = (url: string) => {
    const l = url.toLowerCase();
    if (l.includes("youtube.com") || l.includes("youtu.be")) return "youtube";
    if (l.includes("soundcloud.com")) return "soundcloud";
    return "local";
  };

  return (
    <div className="flex flex-col gap-5 h-full anim-fade-up">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {t.history.title}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {t.history.description}
          </p>
        </div>

        <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
          {/* Search */}
          {history.length > 0 && (
            <div className="flex items-center h-10 flex-1 max-w-[440px] min-w-[140px] bg-[#161a22] border border-white/[0.07] rounded-xl px-3 gap-2 focus-within:border-violet-500/40 transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.history.searchPlaceholder || "Search…"}
                className="flex-1 h-full bg-transparent border-none p-0 text-white text-[13px] caret-violet-400 focus:outline-none focus:ring-0 placeholder-slate-600 focus:placeholder-transparent min-w-0"
              />
            </div>
          )}

          {/* Toolbar */}
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => handleDeleteHistoryItem("all")}
              className="flex items-center gap-1.5 h-10 shrink-0 bg-[#161a22] border border-white/[0.07] rounded-xl px-4 text-slate-600 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.history.deleteAll}
            </button>
          )}
        </div>
      </div>

      {/* ── Table card ─────────────────────────────────────── */}
      <div className="card flex-1 overflow-hidden flex flex-col anim-delay-1 anim-fade-up">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[880px]">
            <thead>
              <tr>
                <th className="w-24 px-4 py-5 bg-[#161a22] border-b border-white/[0.07] rounded-tl-2xl pl-6">
                  <span className="section-label">{t.history.tableSource}</span>
                </th>
                <th className="px-5 py-5 bg-[#161a22] border-b border-white/[0.07] w-[32%]">
                  <span className="section-label">{t.history.tableTrack}</span>
                </th>
                <th className="px-4 py-5 bg-[#161a22] border-b border-white/[0.07] w-[17%]">
                  <span className="section-label">{t.history.tableDate}</span>
                </th>
                <th className="px-3 py-5 bg-[#161a22] border-b border-white/[0.07] w-[11%] text-center">
                  <span className="section-label">{t.history.tableBpm}</span>
                </th>
                <th className="px-3 py-5 bg-[#161a22] border-b border-white/[0.07] w-[11%] text-center">
                  <span className="section-label">{t.history.tableKey}</span>
                </th>
                <th className="px-4 py-5 bg-[#161a22] border-b border-white/[0.07] text-center rounded-tr-2xl">
                  <span className="section-label">{t.history.tableAction}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-14 h-14 mx-auto bg-white/[0.04] rounded-2xl flex items-center justify-center mb-3 border border-white/[0.06]">
                      <List className="w-7 h-7 text-slate-600" />
                    </div>
                    <p className="text-slate-500 font-medium">
                      {history.length === 0
                        ? t.history.empty
                        : t.history.emptySearch}
                    </p>
                    {history.length === 0 && (
                      <p className="text-slate-600 text-sm mt-1">
                        {t.history.emptyDesc}
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                displayed.map((item, idx) => {
                  const isLast =
                    idx === displayed.length - 1 &&
                    displayed.length === filtered.length;
                  const src = getSource(item.url || "");
                  return (
                    <tr
                      key={item.id}
                      className="group/row border-b border-white/[0.04] last:border-none"
                    >
                      {/* Source icon */}
                      <td
                        className={`pl-6 pr-2 py-[21px] ${isLast ? "rounded-bl-2xl" : ""}`}
                      >
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
                      </td>

                      {/* Track */}
                      <td className="px-5 py-[21px] min-w-0">
                        <TruncatedText
                          text={item.title}
                          className="text-[15px] font-semibold text-white"
                        />
                        <div className="text-[12px] text-slate-500 mt-1 truncate">
                          {item.artist || t.home.unknownArtist}
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
                          {item.bpm ?? "—"}
                        </span>
                      </td>

                      {/* Key */}
                      <td className="px-3 py-[21px] text-center">
                        <span className="inline-flex items-center justify-center w-20 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-[15px] font-extrabold text-indigo-300 whitespace-nowrap select-text">
                          {item.key ?? "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className={`px-4 py-[21px] ${isLast ? "rounded-br-2xl" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
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
                          {isTaskActive(item.id, "download") &&
                          item.isTemp &&
                          item.url ? (
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
                                invoke("open_file", { filepath: item.filepath })
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              <tr ref={observerTarget} className="h-px">
                <td colSpan={6} className="p-0 border-none" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
