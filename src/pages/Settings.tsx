import { FolderOpen, UploadCloud, Trash2, Sparkles, Info, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import CustomSelect from "../components/CustomSelect";
import { useApp } from "../context/AppContext";
import { Lang } from "../i18n";

export default function Settings() {
  const {
    customDir, setCustomDir, defaultDir, cookies, setCookies,
    keepFilesOnHistoryDelete, setKeepFilesOnHistoryDelete,
    lang, setLang, t
  } = useApp();

  const handleSelectDir = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') setCustomDir(selected);
    } catch (error) { console.error("Failed to open directory dialog", error); }
  };

  const handleOpenFolder = async () => {
    try { await invoke("open_folder", { path: customDir || defaultDir }); }
    catch (error) { console.error("Failed to open folder", error); }
  };

  return (
    <div className="w-full max-w-4xl pb-10 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 shrink-0">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">{t.settings.title}</h2>
          <p className="text-slate-400 mt-2 text-lg">{t.settings.description}</p>
        </div>
      </div>

      <div className="w-full rounded-3xl bg-[#111728]/80 backdrop-blur-xl border border-white/5 shadow-2xl p-8">
        <div className="mb-6 border-b border-white/10 pb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-400" />
            {t.settings.dlLocation}
          </h3>
          <p className="text-slate-400 text-sm mb-4">{t.settings.dlLocationDesc}</p>
          <div className="relative group">
            <div className="flex items-center w-full bg-[#0a0f1c] border border-white/10 rounded-xl overflow-hidden focus-within:border-purple-500/50 transition-colors shadow-inner">
              <button
                onClick={handleOpenFolder}
                className="flex-1 text-left px-4 py-3 text-slate-300 font-mono text-xs md:text-sm truncate hover:text-white transition-colors"
              >
                {customDir || defaultDir || "Fetching path..."}
              </button>
              <div className="flex items-center gap-1 pr-2">
                {customDir && (
                  <button onClick={() => setCustomDir(null)} className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button onClick={handleSelectDir} className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs md:text-sm font-bold hover:bg-white/10 hover:border-white/20 transition-all active:scale-95">
                  {t.settings.browse}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 border-b border-white/10 pb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-400" />
            {t.settings.cookies}
          </h3>
          <p className="text-slate-400 text-sm mb-4">{t.settings.cookiesDesc}</p>
          <textarea
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            placeholder='[ { "domain": ".youtube.com", ... } ] or # Netscape HTTP Cookie File'
            className="w-full h-32 bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-slate-300 font-mono text-xs shadow-inner focus:outline-none focus:border-purple-500/50 transition-colors resize-none custom-scrollbar"
          />
        </div>

        <div className="mb-6 border-b border-white/10 pb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            {t.settings.cleanup}
          </h3>
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex-1">
              <p className="text-white font-medium mb-1">{t.settings.keepFiles}</p>
              <p className="text-slate-400 text-xs text-pretty">{t.settings.keepFilesDesc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={keepFilesOnHistoryDelete} onChange={(e) => setKeepFilesOnHistoryDelete(e.target.checked)} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
            </label>
          </div>
        </div>

        <div className="mb-6 border-b border-white/10 pb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            {t.settings.language}
          </h3>
          <div className="mt-4">
            <CustomSelect
              options={[
                { value: 'en', label: 'English (US)' },
                { value: 'fr', label: 'Français (FR)' },
                { value: 'es', label: 'Español (ES)' }
              ]}
              value={lang}
              onChange={(val) => setLang(val as Lang)}
              variant="large"
            />
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            {t.settings.about}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            {t.settings.aboutDesc.split('@HugoSohm')[0]}
            <a href="https://github.com/HugoSohm" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-bold decoration-dotted underline underline-offset-4 transition-colors">
              @HugoSohm
            </a>
            {t.settings.aboutDesc.split('@HugoSohm')[1]?.split('https')[0] || ""}
          </p>
          <a href="https://github.com/HugoSohm/rip-tune" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-purple-400 text-xs font-bold transition-all group">
            <Sparkles className="w-3 h-3 transition-transform group-hover:rotate-12" />
            github.com/HugoSohm/rip-tune
          </a>
        </div>
      </div>
    </div>
  );
}
