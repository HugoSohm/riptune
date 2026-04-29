import { FolderOpen, UploadCloud, Trash2, Info, X, Languages, ExternalLink, Activity, AlertTriangle, Globe, Puzzle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import CustomSelect from "../components/CustomSelect";
import { useApp } from "../context/AppContext";
import { Lang } from "../i18n";

export default function Settings() {
  const {
    customDir, setCustomDir, defaultDir, cookies, setCookies,
    deleteFilesOnHistoryDelete, setDeleteFilesOnHistoryDelete,
    deepAnalysis, setDeepAnalysis,
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
            <Languages className="w-5 h-5 text-indigo-400" />
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
              <div className="flex items-center gap-1 pr-1">
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

        <div id="keep-files-setting" className="mb-6 border-b border-white/10 pb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            {t.settings.cleanup}
          </h3>
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex-1">
              <p className="text-white font-medium mb-1">{t.settings.deleteFiles}</p>
              <p className="text-slate-400 text-xs text-pretty">{t.settings.deleteFilesDesc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={deleteFilesOnHistoryDelete} onChange={(e) => setDeleteFilesOnHistoryDelete(e.target.checked)} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-400 shadow-inner"></div>
            </label>
          </div>
        </div>

        <div className="mb-6 border-b border-white/10 pb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            {t.settings.audioEngine}
          </h3>
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex-1">
              <p className="text-white font-medium mb-1">{t.settings.deepAnalysis}</p>
              <p className="text-slate-400 text-xs text-pretty">{t.settings.deepAnalysisDesc}</p>
              <div className="flex items-end gap-1.5 mt-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-500/80 shrink-0" />
                <p className="text-amber-500/80 text-[10px] leading-none font-semibold uppercase tracking-wider">{t.settings.deepAnalysisWarning}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={deepAnalysis} onChange={(e) => setDeepAnalysis(e.target.checked)} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 shadow-inner"></div>
            </label>
          </div>
        </div>
        <div className="mb-6 border-b border-white/10 pb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-400" />
            {t.settings.cookies}
          </h3>
          <p
            className="text-slate-400 text-sm mb-4"
            dangerouslySetInnerHTML={{ __html: t.settings.cookiesDesc }}
          />
          <textarea
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            placeholder='[ { "domain": ".youtube.com", ... } ] or [ { "domain": ".soundcloud.com", ... } ] or # Netscape HTTP Cookie File'
            className="w-full h-32 bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-slate-300 font-mono text-xs shadow-inner focus:outline-none focus:border-purple-500/50 transition-colors resize-none custom-scrollbar"
          />
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
          <div className="flex flex-wrap items-center gap-3">
            <a href="https://riptune.app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-purple-400 text-xs font-bold transition-all group">
              <Globe className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
              {t.settings.website}
              <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-px" />
            </a>
            <a href="https://chromewebstore.google.com/detail/riptune/fcgoflmnnmlmhdgockhcfddcepafohnj" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold transition-all group">
              <Puzzle className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
              {t.settings.chromeExtension}
              <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-px" />
            </a>
            <a href="https://github.com/HugoSohm/riptune" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-indigo-400 text-xs font-bold transition-all group">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current transition-transform group-hover:scale-110">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {t.settings.github}
              <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-px" />
            </a>
            <a href="https://ko-fi.com/riptune" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[#29abe0]/10 hover:bg-[#29abe0]/20 border border-[#29abe0]/20 rounded-xl text-[#29abe0] text-xs font-bold transition-all group">
              <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="Ko-fi" className="w-4 h-4 animation-bounce-subtle" />
              {t.settings.koFi}
              <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-px" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
