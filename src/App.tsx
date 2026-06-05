import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import AudioPlayer from "./components/AudioPlayer";
import BugReportModal from "./components/BugReportModal";
import ChangelogModal from "./components/ChangelogModal";
import DeleteModal from "./components/DeleteModal";
import Notifications from "./components/Notifications";
import Sidebar from "./components/Sidebar";
import TitleBar from "./components/TitleBar";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/useApp";
import { useDeepLink } from "./hooks/useDeepLink";
import { useDownloader } from "./hooks/useDownloader";
import { useDragDrop } from "./hooks/useDragDrop";
import { useFullscreenShortcut } from "./hooks/useFullscreenShortcut";
import History from "./pages/History";
import Home from "./pages/Home";
import Lyrics from "./pages/Lyrics";
import Settings from "./pages/Settings";
import { trackEvent } from "./utils/analytics";

function AppContent() {
  const { activeTab, setPlaylistProgress, ...audioPlayerProps } = useApp();
  useDragDrop();
  const { handleDownload } = useDownloader();
  useFullscreenShortcut();

  const handleDownloadRef = useRef(handleDownload);
  handleDownloadRef.current = handleDownload;
  useDeepLink(handleDownloadRef);

  useEffect(() => {
    trackEvent("app_started");
    const unlistenProgress: Promise<UnlistenFn> = listen<{
      current: number;
      total: number;
      title: string;
    }>("download-progress", (event) => {
      setPlaylistProgress((prev) => ({
        current: event.payload.current,
        total: event.payload.total > 0 ? event.payload.total : prev?.total || 0,
      }));
    });
    return () => {
      unlistenProgress.then((f) => f());
    };
  }, [setPlaylistProgress]);

  return (
    <div className="h-screen w-screen bg-[#0d0f14] text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* Title bar */}
      <TitleBar />

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Page content + player scoped to the right of sidebar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-[#0d0f14]">
            <div className="p-6 h-full">
              {activeTab === "home" && <Home />}
              {activeTab === "history" && <History />}
              {activeTab === "lyrics" && <Lyrics />}
              {activeTab === "settings" && <Settings />}
            </div>
          </div>

          {/* Audio player bar — constrained to content area only */}
          <AudioPlayer {...audioPlayerProps} />
        </div>
      </div>

      <Notifications />
      <DeleteModal />
      <BugReportModal />
      <ChangelogModal />
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
