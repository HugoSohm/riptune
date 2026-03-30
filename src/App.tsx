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

function AppContent() {
  const { activeTab, dragActive, t } = useApp();

  useEffect(() => {
    trackEvent("app_started");
  }, []);

  return (
    <div className="h-screen w-screen bg-[#0a0f1c] text-slate-100 font-sans selection:bg-purple-500/30 flex flex-col items-center overflow-hidden relative">
      <TitleBar />
      <BackgroundOrbs />

      {/* Global Drag & Drop Overlay */}
      {dragActive && (
        <div className="fixed inset-0 z-[100] bg-[#0a0f1c]/80 backdrop-blur-md border-4 border-dashed border-purple-500 flex items-center justify-center transition-all">
          <div className="text-center animate-bounce">
            <div className="w-24 h-24 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.4)]">
              <UploadCloud className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">{t.home.dropTitle}</h2>
            <p className="text-purple-300 mt-2 text-lg">{t.home.dropDesc}</p>
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
