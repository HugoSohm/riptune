import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus, Square, Music, Home, List, Settings2, RotateCcw } from "lucide-react";

interface TitleBarProps {
  activeTab: 'home' | 'history' | 'settings';
  setActiveTab: (tab: 'home' | 'history' | 'settings') => void;
  onReset?: () => void;
}

export default function TitleBar({ activeTab, setActiveTab, onReset }: TitleBarProps) {
  const appWindow = getCurrentWindow();

  const handleDrag = () => {
    appWindow.startDragging();
  };

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

  return (
    <div 
      onMouseDown={handleDrag}
      className="h-[60px] w-full bg-[#0a0f1c] border-b border-white/5 flex items-center justify-between px-6 select-none fixed top-0 left-0 z-[99999] cursor-default"
    >
      <div className="flex items-center gap-3 pointer-events-none">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Music className="text-white w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white">RipTune</span>
          <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Audio Analyzer</span>
        </div>
      </div>

      <div className="flex items-center h-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mr-4" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => setActiveTab('home')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'home' ? 'bg-purple-500/20 text-purple-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Home"
          >
            <Home className="w-5 h-5 pointer-events-none" />
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'history' ? 'bg-purple-500/20 text-purple-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="History"
          >
            <List className="w-5 h-5 pointer-events-none" />
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'settings' ? 'bg-purple-500/20 text-purple-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Settings"
          >
            <Settings2 className="w-5 h-5 pointer-events-none" />
          </button>
          
          {onReset && (
            <button
              onClick={onReset}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
              title="Reset Current Analysis"
            >
              <RotateCcw className="w-5 h-5 pointer-events-none" />
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-8 bg-white/10 mx-2" />

        {/* Window Controls */}
        <div className="flex items-center h-full" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onMouseDown={handleMinimize}
            className="h-[60px] w-14 flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Minus className="w-5 h-5 pointer-events-none" />
          </button>
          <button
            onMouseDown={handleMaximize}
            className="h-[60px] w-14 flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Square className="w-4 h-4 pointer-events-none" />
          </button>
          <button
            onMouseDown={handleClose}
            className="h-[60px] w-14 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
}
