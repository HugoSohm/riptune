import { useState, useRef, useEffect } from "react";
import { List, Trash2, FolderOpen, Loader2, Sparkles, Download, Music } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useApp } from "../context/AppContext";
import { useAudioProcessor } from "../hooks/useAudioProcessor";

interface TruncatedTextProps {
  text: string;
  className?: string;
  tooltipClassName?: string;
}

const TruncatedText = ({ text, className, tooltipClassName }: TruncatedTextProps) => {
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
    <div className="group relative w-full">
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
    history, loading, keepFilesOnHistoryDelete, setKeepFilesOnHistoryDelete, t,
    handleDeleteHistoryItem
  } = useApp();

  const { processFile } = useAudioProcessor();

  const handleOpenFile = async (filepath: string) => {
    try { await invoke("open_file", { filepath }); }
    catch (error) { console.error("Failed to open file", error); }
  };

  return (
    <div className="w-full h-full flex flex-col max-w-6xl animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 shrink-0">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">{t.history.title}</h2>
          <p className="text-slate-400 mt-2 text-lg">{t.history.description}</p>
        </div>
        <div className="flex items-center gap-4 bg-[#111728] px-4 py-2 rounded-xl border border-white/5 shadow-inner">
          <div
            className="flex items-center gap-2 pr-4 border-r border-white/10 cursor-pointer group transition-all"
            onClick={() => setKeepFilesOnHistoryDelete(!keepFilesOnHistoryDelete)}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${!keepFilesOnHistoryDelete ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`} />
            <span 
              className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 group-hover:text-purple-400 transition-colors"
              dangerouslySetInnerHTML={{ 
                __html: `${t.deleteModal.fileDeletion}: ${!keepFilesOnHistoryDelete ? t.deleteModal.active : t.deleteModal.disabled}` 
              }}
            />
          </div>
          <div className="text-slate-400 text-xs font-bold tracking-tight">
            {history.length} {history.length === 1 ? t.history.entry : t.history.entries}
          </div>
        </div>
      </div>

      <div className="w-full flex-1 rounded-3xl bg-[#111728]/80 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col">
        <div className="relative scroll-smooth overflow-visible custom-scrollbar pb-2">
          <table className="w-full text-left border-separate border-spacing-0 relative table-fixed min-w-[1150px]">
            <thead className="shadow-md border-b border-white/10">
              <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                <th className="pl-10 pr-6 py-5 font-semibold w-[8%] min-w-[90px] rounded-tl-3xl bg-[#141b2e]/95 backdrop-blur-md text-center"></th>
                <th className="px-8 py-5 font-semibold w-[42%] min-w-[400px] bg-[#141b2e]/95 backdrop-blur-md text-left">{t.history.tableTrack}</th>
                <th className="px-8 py-5 font-semibold w-[15%] min-w-[160px] bg-[#141b2e]/95 backdrop-blur-md text-center">{t.history.tableDate}</th>
                <th className="px-8 py-5 font-semibold text-center w-[8%] min-w-[90px] bg-[#141b2e]/95 backdrop-blur-md">{t.history.tableBpm}</th>
                <th className="px-8 py-5 font-semibold text-center w-[8%] min-w-[90px] bg-[#141b2e]/95 backdrop-blur-md">{t.history.tableKey}</th>
                <th className="px-8 py-5 font-semibold text-center w-[19%] min-w-[210px] rounded-tr-3xl bg-[#141b2e]/95 backdrop-blur-md">{t.history.tableAction}</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center text-slate-500">
                    <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <List className="w-10 h-10 opacity-40" />
                    </div>
                    <p className="text-xl font-medium text-slate-400">{t.history.empty}</p>
                    <p className="mt-1">{t.history.emptyDesc}</p>
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors last:rounded-b-3xl group/row">
                    <td className="pl-10 pr-6 py-5 text-center align-middle last:rounded-bl-3xl">
                      <div className="flex items-center justify-center group/status relative">
                        {item.isTemp ? (
                          <div className="w-10 h-10 shrink-0 aspect-square rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-sm transition-all duration-300">
                            <Sparkles className="w-[18px] h-[18px]" />
                          </div>
                        ) : item.bpm !== undefined ? (
                          <div className="w-10 h-10 shrink-0 aspect-square rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg transition-all duration-300">
                            <Music className="w-[18px] h-[18px] text-indigo-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 shrink-0 aspect-square rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-sm transition-all duration-300">
                            <Download className="w-[18px] h-[18px]" />
                          </div>
                        )}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md border border-white/10 text-white text-[10px] rounded-xl opacity-0 group-hover/status:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover/status:scale-100 font-bold uppercase tracking-wider">
                          {item.isTemp
                            ? (t.history.status?.analysis || "analyse seule")
                            : item.bpm !== undefined
                              ? (t.history.status?.full || "téléchargement + analyse")
                              : (t.history.status?.download || "téléchargement seul")}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 min-w-0">
                      <div className="flex-1 min-w-0">
                        <TruncatedText
                          text={item.title}
                          className="font-bold text-slate-200 text-base"
                          tooltipClassName="whitespace-nowrap"
                        />

                        {item.artist && (
                          <div className="text-xs text-purple-400 font-medium mt-0.5 truncate max-w-full">
                            {item.artist}
                          </div>
                        )}

                        {!item.isTemp && (
                          <div className="mt-1.5">
                            <TruncatedText
                              text={item.filepath}
                              className="text-xs text-slate-500"
                              tooltipClassName="whitespace-normal break-all max-w-xs leading-relaxed"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-300">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 mt-1">
                        {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      {item.bpm !== undefined ? (
                        <span className="inline-flex items-center justify-center min-w-[60px] px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 text-purple-400 font-bold text-lg shadow-sm">
                          {item.bpm}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-bold">-</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      {item.key !== undefined ? (
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 text-blue-400 font-bold text-lg shadow-sm">
                          {item.key}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-bold">-</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right last:rounded-br-3xl">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-10 flex justify-center">
                          {item.bpm === undefined && (
                            <div className="group relative">
                              <button
                                onClick={() => processFile(item.filepath, item.title, item.artist)}
                                className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white flex items-center justify-center transition-all group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] duration-300"
                                disabled={loading}
                              >
                                {loading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-medium capitalize">
                                {t.history.tooltips.analyze}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="w-10 flex justify-center">
                          {!item.isTemp && (
                            <div className="group relative">
                              <button
                                onClick={() => handleOpenFile(item.filepath)}
                                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300"
                              >
                                <FolderOpen className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-medium capitalize">
                                {t.history.tooltips.open}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="w-10 flex justify-center">
                          <div className="group relative">
                            <button
                              onClick={() => handleDeleteHistoryItem(item.id)}
                              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-all duration-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-95 group-hover:scale-100 font-medium capitalize">
                              {t.history.tooltips.delete}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
