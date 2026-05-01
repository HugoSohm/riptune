import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { X, Minus, Square, Copy, Home, List, Settings2, Bug, Coffee, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { useApp } from "../context/useApp";
import { useUpdater } from "../hooks/useUpdater";
import { useState, useEffect } from "react";

export default function TitleBar() {
  const { activeTab, setActiveTab, setIsBugModalOpen, t } = useApp();
  const { update, status, progress, errorMessage, installUpdate } = useUpdater();
  const appWindow = getCurrentWindow();
  const [version, setVersion] = useState<string>("");
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);

  useEffect(() => {
    getVersion().then(setVersion).catch(console.error);

    // Initial check
    appWindow.isMaximized().then(setIsMaximized);

    // Listen for changes
    const unlistenMax = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlistenMax.then(fn => fn());
    };
  }, [appWindow]);


  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    appWindow.minimize();
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    appWindow.toggleMaximize();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    appWindow.close();
  };

  const handleReportBug = () => {
    setIsBugModalOpen(true);
  };


  return (
    <div
      className={`relative h-[60px] w-full bg-[#0a0f1c] border-b border-white/10 select-none shrink-0 cursor-default transition-all duration-300 z-[99999] ${isMac ? 'pl-[100px] pr-6' : 'pl-6'}`}
    >
      {/* Title Bar Content */}
      <div className="flex items-center justify-between h-full w-full">
        {/* Left Side: Logo & Name - Draggable */}
        <div data-tauri-drag-region className="flex items-center gap-3 h-full cursor-default">
          <div className="w-8 h-8 flex items-center justify-center pointer-events-none">
            <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
          </div>
          <div className="flex flex-col border-none pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">RipTune</span>
              {version && (
                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] font-bold rounded-md border border-purple-500/30 leading-none">
                  v{version}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">{t.titleBar.audioAnalyzer}</span>
          </div>

          {/* Update Button - Not Draggable */}
          {status !== 'idle' && status !== 'checking' && (
            <div className="ml-4">
              <button
                onMouseDown={status === 'error' ? () => window.location.reload() : installUpdate}
                disabled={status === 'downloading' || status === 'installing'}
                title={errorMessage || undefined}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase transition-all duration-500 border group ${status === 'available'
                    ? 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-500 hover:text-white hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse'
                    : status === 'error'
                      ? 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white'
                      : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 cursor-wait'
                  }`}
              >
                {status === 'available' ? (
                  <>
                    <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                    <span>Update to v{update?.version}</span>
                  </>
                ) : status === 'error' ? (
                  <>
                    <Bug className="w-3 h-3" />
                    <span>Update Failed - Click to retry</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>
                      {status === 'downloading'
                        ? progress > 0 ? `Downloading ${progress}%` : 'Downloading...'
                        : 'Installing...'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Center Spacer: Draggable Area */}
        <div data-tauri-drag-region className="flex-1 h-full cursor-default" />

        {/* Right Side: Navigation & Window Controls */}
        <div className="flex items-center h-full">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mr-4">
            <div className="group relative">
              <button
                onMouseDown={() => setActiveTab('home')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'home' ? 'bg-purple-500/20 text-purple-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Home className="w-5 h-5 pointer-events-none" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-medium capitalize">
                {t.titleBar.home}
              </div>
            </div>

            <div className="group relative">
              <button
                onMouseDown={() => setActiveTab('history')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'history' ? 'bg-purple-500/20 text-purple-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <List className="w-5 h-5 pointer-events-none" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-medium capitalize">
                {t.titleBar.history}
              </div>
            </div>

            <div className="group relative">
              <button
                onMouseDown={() => setActiveTab('settings')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'settings' ? 'bg-purple-500/20 text-purple-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Settings2 className="w-5 h-5 pointer-events-none" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-medium capitalize">
                {t.titleBar.settings}
              </div>
            </div>

            {/* Small internal Separator */}
            <div className="w-[1px] h-5 bg-white/10 mx-1 rounded-full" />

            <div className="group relative">
              <button
                onMouseDown={handleReportBug}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all duration-300"
              >
                <Bug className="w-5 h-5 pointer-events-none" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-medium capitalize">
                {t.titleBar.bugReport || "Report a Bug"}
              </div>
            </div>

            <div className="group relative">
              <button
                onMouseDown={() => openUrl("https://ko-fi.com/riptune")}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-300"
              >
                <div className="relative">
                  <Coffee className="w-5 h-5 pointer-events-none" />
                  <ExternalLink className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                </div>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-medium flex items-center gap-2">
                {t.titleBar.koFi || "Support on Ko-fi"}
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>

            <div className="group relative">
              <button
                onMouseDown={() => openUrl("https://github.com/HugoSohm/riptune")}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                <div className="relative">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none" className="pointer-events-none">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <ExternalLink className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                </div>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-[100] shadow-2xl scale-95 group-hover:scale-100 font-medium flex items-center gap-2">
                {t.titleBar.github || "GitHub Source"}
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>
          </div>

          {/* Separator - Hidden on macOS */}
          {!isMac && <div className="w-[1px] h-8 bg-white/10 mx-2" />}

          {/* Window Controls - Hidden on macOS as we use native ones */}
          {!isMac && (
            <div className="flex items-center h-full pointer-events-auto">
              <button
                onMouseDown={handleMinimize}
                className="h-[60px] w-14 flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Minus className="w-3.5 h-3.5 pointer-events-none" />
              </button>
              <button
                onMouseDown={handleMaximize}
                className="h-[60px] w-14 flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                {isMaximized ? (
                  <Copy className="w-3 h-3 rotate-180 pointer-events-none" />
                ) : (
                  <Square className="w-3.5 h-3.5 pointer-events-none" />
                )}
              </button>
              <button
                onMouseDown={handleClose}
                className="h-[60px] w-14 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4 pointer-events-none" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
