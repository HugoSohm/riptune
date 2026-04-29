import { useState, useRef, useEffect } from "react";
import { List, Trash2, FolderOpen, Loader2, Sparkles, Download, ExternalLink, Search, Play, Cloud, HardDrive } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useApp } from "../context/AppContext";
import { useAudioProcessor } from "../hooks/useAudioProcessor";
import { useDownloader } from "../hooks/useDownloader";

interface TruncatedTextProps {
  text: string;
  className?: string;
  tooltipClassName?: string;
  wrapperClassName?: string;
}

const TruncatedText = ({ text, className, tooltipClassName, wrapperClassName }: TruncatedTextProps) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const checkOverflow = () => {
    const element = textRef.current;
    if (element) {
      setIsOverflowing(element.scrollWidth > element.offsetWidth);
    }
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <div className={`group relative ${wrapperClassName || 'w-full'}`}>
      <div
        ref={textRef}
        className={`${className} truncate max-w-full`}
      >
        {text}
      </div>
      {isOverflowing && (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-2xl scale-95 group-hover:scale-100 font-medium ${tooltipClassName}`}>
          {text}
        </div>
      )}
    </div>
  );
};

export default function History() {
  const {
    history, deleteFilesOnHistoryDelete, setDeleteFilesOnHistoryDelete, t,
    handleDeleteHistoryItem, setUrl, setShouldDownload, setAutoAnalyze,
    isTaskActive
  } = useApp();

  const { processFile } = useAudioProcessor();
  const { handleDownload } = useDownloader();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);
  const observerTarget = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 20);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, []);

  const filteredHistory = history.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const matchTitle = item.title?.toLowerCase().includes(query);
    const matchArtist = item.artist?.toLowerCase().includes(query);
    return matchTitle || matchArtist;
  });

  const displayedHistory = filteredHistory.slice(0, visibleCount);

  const handleDownloadFromHistory = async (item: any) => {
    if (!item.url) return;

    // Configure global state for context
    setUrl(item.url);
    setShouldDownload(true);
    setAutoAnalyze(false);

    // Pass item.id as overrideId so the task is tracked with this ID
    handleDownload(item.url, true, false, item.id);
  };

  const handleAnalyzeFromHistory = async (item: any) => {
    // Pass item.id as the task ID so the spinner is shown for this specific row
    processFile(item.filepath, item.title, item.artist, item.isTemp, item.url, item.id);
  };

  const handleOpenFile = async (filepath: string) => {
    try { await invoke("open_file", { filepath }); }
    catch (error) { console.error("Failed to open file", error); }
  };

  return (
    <div className="w-full h-full flex flex-col max-w-6xl animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex items-end justify-between mb-6 gap-x-8 gap-y-4 shrink-0 flex-wrap">
        <div className="shrink-0">
          <h2 className="text-4xl font-black text-white tracking-tight">{t.history.title}</h2>
          <p className="text-slate-400 mt-2 text-lg">{t.history.description}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-auto justify-end flex-1">
          {history.length > 0 && (
            <div className="flex items-center bg-[#111728] px-4 py-2 rounded-2xl border border-white/5 shadow-2xl shrink h-[46px] relative z-[100] w-full max-w-[280px] min-w-[140px] group transition-colors focus-within:border-purple-500/50">
              <Search className="w-4 h-4 text-slate-500 group-focus-within:text-purple-400 shrink-0 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.history.searchPlaceholder || "Search by title..."}
                className="w-full bg-transparent border-none text-white text-[13px] font-medium ml-3 focus:outline-none focus:ring-0 placeholder-slate-500 min-w-0"
              />
            </div>
          )}

          <div className="flex items-center gap-6 bg-[#111728] px-5 py-2.5 rounded-2xl border border-white/5 shadow-2xl shrink-0 min-w-fit">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={deleteFilesOnHistoryDelete}
                  onChange={() => setDeleteFilesOnHistoryDelete(!deleteFilesOnHistoryDelete)}
                />
                <div className="w-9 h-5 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-400 peer-checked:after:bg-white shadow-inner border border-white/5"></div>
              </div>
              <span
                className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover:text-slate-300 transition-colors"
                dangerouslySetInnerHTML={{
                  __html: `${t.deleteModal.fileDeletion}`
                }}
              />
            </label>
            {history.length > 0 && (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <button
                  onClick={() => handleDeleteHistoryItem("all")}
                  className="p-1.5 px-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 group border border-transparent hover:border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t.history.deleteAll}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex-1 rounded-3xl bg-[#111728]/80 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col">
        <div className="relative scroll-smooth overflow-visible custom-scrollbar pb-2">
          <table className="w-full text-left border-separate border-spacing-0 relative table-fixed min-w-[1000px]">
            <thead className="shadow-md border-b border-white/10">
              <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-4 py-5 font-semibold text-center w-[7%] min-w-[70px] rounded-tl-3xl bg-[#141b2e]/95 backdrop-blur-md"></th>
                <th className="px-8 py-5 font-semibold w-[30%] min-w-[280px] bg-[#141b2e]/95 backdrop-blur-md text-left">{t.history.tableTrack}</th>
                <th className="px-8 py-5 font-semibold w-[15%] min-w-[150px] bg-[#141b2e]/95 backdrop-blur-md text-left">{t.history.tableDate}</th>
                <th className="px-4 py-5 font-semibold text-center w-[11%] min-w-[110px] bg-[#141b2e]/95 backdrop-blur-md">{t.history.tableBpm}</th>
                <th className="px-4 py-5 font-semibold text-center w-[11%] min-w-[110px] bg-[#141b2e]/95 backdrop-blur-md">{t.history.tableKey}</th>
                <th className="px-4 py-5 font-semibold text-center w-[28%] min-w-[300px] rounded-tr-3xl bg-[#141b2e]/95 backdrop-blur-md">{t.history.tableAction}</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center text-slate-500">
                    <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <List className="w-10 h-10 opacity-40" />
                    </div>
                    <p className="text-xl font-medium text-slate-400">
                      {history.length === 0 ? t.history.empty : t.history.emptySearch}
                    </p>
                    <p className="mt-1">{history.length === 0 ? t.history.emptyDesc : ""}</p>
                  </td>
                </tr>
              ) : (
                displayedHistory.map((item, index) => {
                  const isLastRow = index === displayedHistory.length - 1 && displayedHistory.length === filteredHistory.length;
                  return (
                    <tr
                      key={item.id}
                      className="group/row transition-all duration-300 border-b border-white/[0.02] last:border-none"
                    >
                      <td className={`pl-10 pr-6 py-5 text-center transition-colors duration-300 group-hover/row:bg-[#141b2e]/30 ${isLastRow ? 'rounded-bl-3xl' : ''}`}>
                        <div className="flex items-center justify-center group/status relative">
                          {(() => {
                            const url = item.url?.toLowerCase() || "";
                            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                              return (
                                <div className="w-10 h-10 shrink-0 aspect-square rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-sm transition-all duration-300">
                                  <Play className="w-[18px] h-[18px]" />
                                </div>
                              );
                            } else if (url.includes("soundcloud.com")) {
                              return (
                                <div className="w-10 h-10 shrink-0 aspect-square rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-sm transition-all duration-300">
                                  <Cloud className="w-[18px] h-[18px]" />
                                </div>
                              );
                            } else {
                              return (
                                <div className="w-10 h-10 shrink-0 aspect-square rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400 border border-white/5 shadow-sm transition-all duration-300">
                                  <HardDrive className="w-[18px] h-[18px]" />
                                </div>
                              );
                            }
                          })()}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md border border-white/10 text-white text-[10px] rounded-xl opacity-0 group-hover/status:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover/status:scale-100 font-bold uppercase tracking-wider">
                            {(() => {
                              const url = item.url?.toLowerCase() || "";
                              if (url.includes("youtube.com") || url.includes("youtu.be")) return t.history.sources.youtube;
                              if (url.includes("soundcloud.com")) return t.history.sources.soundcloud;
                              return t.history.sources.local;
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 min-w-0 transition-colors duration-300 group-hover/row:bg-[#141b2e]/30">
                        <div className="flex-2 min-w-0">
                          <div className="flex items-center gap-2 max-w-full">
                            <TruncatedText
                              text={item.title}
                              className="font-bold text-white text-base"
                              wrapperClassName="flex-1 min-w-0"
                              tooltipClassName="whitespace-nowrap"
                            />
                          </div>
                          <div className="text-xs text-purple-400 font-medium mt-0.5 truncate max-w-full">
                            {item.artist || t.home.unknownArtist}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap transition-colors duration-300 group-hover/row:bg-[#141b2e]/30">
                        <div className="text-sm font-medium text-slate-300">
                          {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 mt-1">
                          {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className={`px-2 py-5 text-center transition-colors duration-300 group-hover/row:bg-[#141b2e]/30`}>
                        <div className="w-24 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center border border-purple-500/20 mx-auto shadow-sm">
                          <span className="text-base font-black text-purple-400 select-text">
                            {item.bpm !== undefined ? item.bpm : "-"}
                          </span>
                        </div>
                      </td>
                      <td className={`px-2 py-5 text-center transition-colors duration-300 group-hover/row:bg-[#141b2e]/30`}>
                        <div className="w-24 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/20 mx-auto shadow-sm">
                          <span className="text-base font-black text-blue-400 whitespace-nowrap select-text">
                            {item.key !== undefined ? item.key : "-"}
                          </span>
                        </div>
                      </td>
                      <td className={`px-4 py-5 text-center transition-colors duration-300 group-hover/row:bg-[#141b2e]/30 ${isLastRow ? 'rounded-br-3xl' : ''}`}>
                        <div className="flex items-center justify-center gap-2">
                          {/* Slot 1: Analyze */}
                          <div className="w-10 flex justify-center">
                            {/* Spinner shown exclusively based on task activity — not bpm state,
                                to avoid disappearing when another concurrent analysis updates history */}
                            {isTaskActive(item.id, 'analysis') ? (
                              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                              </div>
                            ) : (
                              <div className="group relative">
                                <button
                                  onClick={() => item.bpm === undefined && !item.isTemp && handleAnalyzeFromHistory(item)}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${item.bpm === undefined && !item.isTemp
                                    ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                                    : "bg-white/5 text-slate-700 cursor-default opacity-20"
                                    }`}
                                  disabled={item.bpm !== undefined || item.isTemp}
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-bold uppercase tracking-wider">
                                  {item.bpm === undefined && !item.isTemp ? t.history.tooltips.analyze : t.history.tooltips.analyzed}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Slot 2: Download / Open Folder */}
                          <div className="w-10 flex justify-center">
                            {isTaskActive(item.id, 'download') && item.isTemp && item.url ? (
                              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              </div>
                            ) : item.isTemp && item.url ? (
                              <div className="group relative">
                                <button
                                  onClick={() => handleDownloadFromHistory(item)}
                                  className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white flex items-center justify-center transition-all group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] duration-300"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-bold uppercase tracking-wider">
                                  {t.history.tooltips.download}
                                </div>
                              </div>
                            ) : (
                              <div className="group relative">
                                <button
                                  onClick={() => !item.isTemp && handleOpenFile(item.filepath)}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${!item.isTemp
                                    ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                    : "bg-white/5 text-slate-700 cursor-default opacity-20"
                                    }`}
                                  disabled={item.isTemp}
                                >
                                  <FolderOpen className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-bold uppercase tracking-wider">
                                  {!item.isTemp ? t.history.tooltips.open : t.history.tooltips.notDownloaded}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Slot 3: External Link */}
                          <div className="w-10 flex justify-center">
                            <div className="group relative">
                              <button
                                onClick={() => item.url && openUrl(item.url)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${item.url
                                  ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                  : "bg-white/5 text-slate-700 cursor-default opacity-20"
                                  }`}
                                disabled={!item.url}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-bold uppercase tracking-wider">
                                {item.url ? t.history.tooltips.openSourceUrl : t.history.tooltips.noSourceUrl}
                              </div>
                            </div>
                          </div>

                          {/* Slot 4: Delete */}
                          <div className="w-10 flex justify-center">
                            <div className="group relative">
                              <button
                                onClick={() => handleDeleteHistoryItem(item.id)}
                                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-all duration-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-95 group-hover:scale-100 font-bold uppercase tracking-wider">
                                {t.history.tooltips.delete}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              <tr ref={observerTarget} className="h-px">
                <td colSpan={6} className="p-0 border-none"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
