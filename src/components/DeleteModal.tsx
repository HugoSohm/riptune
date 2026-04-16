import { useState, useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function DeleteModal() {
  const { 
    deleteConfirmId, setDeleteConfirmId, confirmDelete, 
    deleteFilesOnHistoryDelete, setDeleteFilesOnHistoryDelete,
    t, history 
  } = useApp();
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    if (deleteConfirmId) setConfirmInput("");
  }, [deleteConfirmId]);

  if (!deleteConfirmId) return null;

  const isDeleteAll = deleteConfirmId === "all";
  const itemToDelete = isDeleteAll ? null : history.find(h => h.id === deleteConfirmId);
  const hasPhysicalFiles = (isDeleteAll ? history.some(h => !h.isTemp) : !itemToDelete?.isTemp);

  const requiredWord = t.deleteModal.confirmWord || "DELETE";
  const isConfirmDisabled = isDeleteAll && confirmInput.toUpperCase() !== requiredWord.toUpperCase();

  return (
    <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0f1c]/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => setDeleteConfirmId(null)}
      />
      <div className="relative w-full max-w-4xl bg-[#111728] border border-white/10 rounded-[2rem] p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setDeleteConfirmId(null)}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
          <div className="w-20 h-20 shrink-0 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <Trash2 className="w-9 h-9 text-red-500" />
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <h3 className="text-3xl font-black text-white tracking-tight mb-2">
              {isDeleteAll ? t.deleteModal.titleAll : t.deleteModal.title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {isDeleteAll ? t.deleteModal.descriptionAll : t.deleteModal.description}
            </p>

            {hasPhysicalFiles && (
              <div className={`w-full group/warn border rounded-2xl p-5 mb-8 flex items-center justify-between gap-6 text-left transition-all ${deleteFilesOnHistoryDelete ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'}`}>
                <div className="flex items-center gap-4">
                  <AlertTriangle className={`w-6 h-6 shrink-0 transition-colors ${deleteFilesOnHistoryDelete ? 'text-red-500' : 'text-slate-500'}`} />
                  <div className="flex flex-col">
                    <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${deleteFilesOnHistoryDelete ? 'text-red-500' : 'text-slate-400'}`}>
                      {t.deleteModal.warning}
                    </p>
                    <span className={`text-sm font-bold mt-0.5 transition-all ${deleteFilesOnHistoryDelete ? 'text-red-200/70' : 'text-slate-300'}`}>
                      {t.deleteModal.fileWillBeDeleted}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={deleteFilesOnHistoryDelete} 
                    onChange={(e) => setDeleteFilesOnHistoryDelete(e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 shadow-inner"></div>
                </label>
              </div>
            )}

            {isDeleteAll && (
              <div className="w-full mb-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-3 text-left">
                  {t.deleteModal.typeWordToConfirm.replace('[WORD]', requiredWord)}
                </p>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={requiredWord}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left text-white font-black tracking-[0.3em] placeholder:text-slate-800 focus:outline-none focus:border-red-500/30 transition-all uppercase"
                  autoFocus
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-10 py-4 rounded-2xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition-all text-sm"
              >
                {t.deleteModal.cancel}
              </button>
              <button
                onClick={() => confirmDelete()}
                disabled={isConfirmDisabled}
                className={`px-10 py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 text-sm ${isConfirmDisabled
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50 shadow-none border border-white/5"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                }`}
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>{isDeleteAll ? t.deleteModal.confirmAll : t.deleteModal.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
