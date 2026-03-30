import { List, Trash2, FolderOpen, Loader2, Sparkles } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useApp } from "../context/AppContext";
import { useAudioProcessor } from "../hooks/useAudioProcessor";

export default function History() {
  const { 
    history, loading, keepFilesOnHistoryDelete, setActiveTab, t,
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
            onClick={() => setActiveTab('settings')}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${!keepFilesOnHistoryDelete ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`} />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 group-hover:text-purple-400 transition-colors">
              {t.deleteModal.fileDeletion}: {!keepFilesOnHistoryDelete ? t.deleteModal.active : t.deleteModal.disabled}
            </span>
          </div>
          <div className="text-slate-400 text-xs font-bold tracking-tight">
            {history.length} {history.length === 1 ? t.history.entry : t.history.entries}
          </div>
        </div>
      </div>

      <div className="w-full flex-1 rounded-3xl bg-[#111728]/80 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col overflow-hidden">
        <div className="overflow-x-auto relative scroll-smooth p-1">
          <table className="w-full text-left border-collapse min-w-[800px] relative">
            <thead className="sticky top-0 z-10 bg-[#141b2e] shadow-md border-b border-white/10">
              <tr className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5 font-semibold rounded-tl-3xl">{t.history.tableTrack}</th>
                <th className="px-8 py-5 font-semibold">{t.history.tableDate}</th>
                <th className="px-8 py-5 font-semibold text-center">{t.history.tableBpm}</th>
                <th className="px-8 py-5 font-semibold text-center">{t.history.tableKey}</th>
                <th className="px-8 py-5 font-semibold text-center rounded-tr-3xl">{t.history.tableAction}</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center text-slate-500">
                    <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <List className="w-10 h-10 opacity-40" />
                    </div>
                    <p className="text-xl font-medium text-slate-400">{t.history.empty}</p>
                    <p className="mt-1">{t.history.emptyDesc}</p>
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-200 truncate max-w-xs xl:max-w-md text-base" title={item.title}>
                        {item.title}
                      </div>
                      {item.artist && (
                        <div className="text-xs text-purple-400 font-medium mt-0.5 truncate max-w-xs xl:max-w-md">
                          {item.artist}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 truncate max-w-xs xl:max-w-md mt-1.5" title={item.filepath}>
                        {item.filepath}
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
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
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
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-95 group-hover:scale-100 font-medium capitalize">
                              {t.history.tooltips.analyze}
                            </div>
                          </div>
                        )}
                        <div className="group relative">
                          <button
                            onClick={() => handleOpenFile(item.filepath)}
                            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-95 group-hover:scale-100 font-medium capitalize">
                            {t.history.tooltips.open}
                          </div>
                        </div>
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
