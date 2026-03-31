import { AlertTriangle, Trash2, X, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function DeleteModal() {
  const { deleteConfirmId, setDeleteConfirmId, confirmDelete, keepFilesOnHistoryDelete, setActiveTab, t } = useApp();

  if (!deleteConfirmId) return null;

  return (
    <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0a0f1c]/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={() => setDeleteConfirmId(null)}
      />
      <div className="relative w-full max-w-md bg-[#111728] border border-white/10 rounded-[2rem] p-8 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <button 
          onClick={() => setDeleteConfirmId(null)}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Trash2 className="w-10 h-10 text-red-500" />
          </div>
          
          <h3 className="text-2xl font-black text-white tracking-tight mb-2">
            {t.deleteModal.title}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {t.deleteModal.description}
          </p>

          {!keepFilesOnHistoryDelete && (
            <div className="w-full bg-red-500/5 border border-red-500/10 rounded-2xl p-4 mb-8 flex items-start gap-4 text-left">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-200/50 leading-relaxed font-medium">
                {t.deleteModal.warning}
                <span className="block mt-1 font-bold text-red-400">
                  {t.deleteModal.fileWillBeDeleted}
                </span>
                <button
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setActiveTab('settings');
                    setTimeout(() => {
                      document.getElementById('keep-files-setting')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors font-bold flex items-center gap-1 group"
                >
                  <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                  {t.deleteModal.manageSettings}
                </button>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-6 py-4 rounded-2xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition-all"
            >
              {t.deleteModal.cancel}
            </button>
            <button
              onClick={() => confirmDelete()}
              className="px-4 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>{t.deleteModal.confirm}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
