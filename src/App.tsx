import { UploadCloud } from "lucide-react";
import TitleBar from "./components/TitleBar";
import Home from "./pages/Home";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Notifications from "./components/Notifications";
import DeleteModal from "./components/DeleteModal";
import BackgroundOrbs from "./components/BackgroundOrbs";
import BugReportModal from "./components/BugReportModal";
import { AppProvider, useApp } from "./context/AppContext";
import { trackEvent } from "./utils/analytics";
import { useEffect } from "react";

import { useDragDrop } from "./hooks/useDragDrop";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

function AppContent() {
  const { activeTab, dragActive, t, lang, setPlaylistProgress } = useApp();
  const { isValidDrag } = useDragDrop();

  useEffect(() => {
    trackEvent("app_started");

    let unlistenProgress: Promise<UnlistenFn>;

    unlistenProgress = listen<{ current: number, total: number, title: string }>("download-progress", (event) => {
      setPlaylistProgress({ current: event.payload.current, total: event.payload.total });
    });

    return () => {
      unlistenProgress.then((f) => f());
    };
  }, [setPlaylistProgress]);

  return (
    <div className="h-screen w-screen bg-[#0a0f1c] text-slate-100 font-sans selection:bg-purple-500/30 flex flex-col items-center overflow-hidden relative">
      <TitleBar />
      <BackgroundOrbs />

      {/* Global Drag & Drop Overlay */}
      {dragActive && (
        <div className={`fixed inset-0 z-[100] bg-[#0a0f1c]/80 backdrop-blur-md border-4 border-dashed ${isValidDrag ? 'border-purple-500 cursor-copy' : 'border-red-500 cursor-not-allowed'} flex items-center justify-center transition-all`}>
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto rounded-full ${isValidDrag ? 'bg-purple-500/20 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.4)]' : 'bg-red-500/20 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.4)]'} flex items-center justify-center mb-6 border`}>
              <UploadCloud className={`w-12 h-12 ${isValidDrag ? 'text-purple-400' : 'text-red-400'}`} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {isValidDrag ? t.home.dropTitle : (lang === 'fr' ? 'Fichier non supporté' : 'File not supported')}
            </h2>
            <p className={`${isValidDrag ? 'text-purple-300' : 'text-red-300'} mt-2 text-lg px-8`}>
              {isValidDrag ? t.home.dropDesc : (lang === 'fr' ? 'Seuls les fichiers MP3, WAV et FLAC sont acceptés.' : 'Only MP3, WAV and FLAC files are accepted.')}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Scroll Wrapper */}
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar scroll-smooth z-10 mt-[60px] flex flex-col">
        <main className={`w-full max-w-7xl mx-auto px-6 pb-12 flex-1 flex flex-col items-center ${activeTab !== 'home' ? 'pt-8' : ''}`}>
          {activeTab === 'home' && <Home />}
          {activeTab === 'history' && <History />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      <Notifications />
      <DeleteModal />
      <BugReportModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
