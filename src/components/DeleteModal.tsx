import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
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
  const hasPhysicalFiles = isDeleteAll ? history.some(h => !h.isTemp) : (itemToDelete ? !itemToDelete.isTemp : false);

  const requiredWord = t.deleteModal.confirmWord || "DELETE";
  const isConfirmDisabled = isDeleteAll && confirmInput.toUpperCase() !== requiredWord.toUpperCase();

  return (
    <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0f1c]/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => setDeleteConfirmId(null)}
      />
      <div className="relative w-full max-w-md bg-[#111728] border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setDeleteConfirmId(null)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <div className="w-full text-center">
            <h3 className="text-2xl font-black text-white tracking-tight mb-3">
              {isDeleteAll ? t.deleteModal.titleAll : t.deleteModal.title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 px-2">
              {isDeleteAll ? (
                t.deleteModal.descriptionAll
              ) : (
                <>
                  {t.deleteModal.description.split('[TRACK]')[0]}
                  <span className="text-slate-200 font-bold">
                    "{itemToDelete?.title || "ce titre"}"
                  </span>
                  {t.deleteModal.description.split('[TRACK]')[1]}
                </>
              )}
            </p>

            {hasPhysicalFiles && deleteFilesOnHistoryDelete && (
              <div className="w-full group/warn border rounded-2xl p-4 flex flex-row items-center justify-between gap-4 text-left transition-all bg-red-500/5 border-red-500/20 mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 transition-colors text-red-500" />
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest transition-colors text-red-500">
                      {t.deleteModal.warning}
                    </p>
                    <span className="text-xs font-bold mt-0.5 transition-all text-red-200/70">
                      {t.deleteModal.fileWillBeDeleted}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={deleteFilesOnHistoryDelete} 
                    onChange={(e) => setDeleteFilesOnHistoryDelete(e.target.checked)} 
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500 shadow-inner"></div>
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white font-black tracking-[0.3em] placeholder:text-slate-800 focus:outline-none focus:border-red-500/30 transition-all uppercase"
                  autoFocus
                />
              </div>
            )}

            <div className="flex flex-row gap-4 w-full mt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-all text-sm"
              >
                {t.deleteModal.cancel}
              </button>
              <button
                onClick={() => confirmDelete()}
                disabled={isConfirmDisabled}
                className={`flex-1 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ${isConfirmDisabled
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50 shadow-none border border-white/5"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                }`}
              >
                <span>{isDeleteAll ? t.deleteModal.confirmAll : t.deleteModal.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
