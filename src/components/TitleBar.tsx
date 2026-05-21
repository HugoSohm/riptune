import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Bug, Copy, Loader2, Minus, Sparkles, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../context/useApp";
import { useUpdater } from "../hooks/useUpdater";

export default function TitleBar() {
  const { t } = useApp();
  const { status, progress, errorMessage, installUpdate } = useUpdater();
  const appWindow = getCurrentWindow();
  const [version, setVersion] = useState<string>("");
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac =
    typeof window !== "undefined" &&
    /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);

  useEffect(() => {
    getVersion().then(setVersion).catch(console.error);
    appWindow.isMaximized().then(setIsMaximized);
    const unsub = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });
    return () => {
      unsub.then((f) => f());
    };
  }, [appWindow]);

  return (
    <div
      className={`relative h-[52px] w-full shrink-0 select-none z-[99999]
        bg-[#0b0d12] border-b border-white/[0.07] flex items-center
        ${isMac ? "pl-[88px]" : "pl-0"}`}
    >
      {/* ── Logo + branding — draggable ──────────────────────── */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-3 h-full px-5 cursor-default flex-1 min-w-0"
      >
        <div className="w-7 h-7 shrink-0 pointer-events-none flex items-center justify-center">
          <img
            src="/logo.svg"
            alt="RipTune"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col pointer-events-none min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white tracking-tight leading-none">
              RipTune
            </span>
            {version && (
              <span className="badge-purple text-[9px]">v{version}</span>
            )}
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 mt-0.5 leading-none">
            {t.titleBar.audioAnalyzer}
          </span>
        </div>

        {/* Update pill */}
        {status !== "idle" && status !== "checking" && (
          <button
            type="button"
            onMouseDown={
              status === "error"
                ? () => window.location.reload()
                : installUpdate
            }
            disabled={status === "downloading" || status === "installing"}
            title={errorMessage || undefined}
            className={`ml-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all duration-200
              ${
                status === "available"
                  ? "bg-violet-500/15 border-violet-500/25 text-violet-300 hover:bg-violet-500 hover:text-white animate-pulse"
                  : status === "error"
                    ? "bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500 hover:text-white"
                    : "bg-white/[0.05] border-white/[0.07] text-slate-400 cursor-wait"
              }`}
          >
            {status === "available" ? (
              <>
                <Sparkles className="w-3 h-3" />
                <span>
                  {t.titleBar.updateAvailable || "Mise à jour disponible"}
                </span>
              </>
            ) : status === "error" ? (
              <>
                <Bug className="w-3 h-3" />
                <span>Retry</span>
              </>
            ) : (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>
                  {status === "downloading"
                    ? progress > 0
                      ? `${progress}%`
                      : "…"
                    : "Installing"}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Window controls (Win/Linux only) ─────────────────── */}
      {!isMac && (
        <div className="flex items-center h-full shrink-0">
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              appWindow.minimize();
            }}
            className="h-[52px] w-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors duration-150"
          >
            <Minus className="w-3.5 h-3.5 pointer-events-none" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              appWindow.toggleMaximize();
            }}
            className="h-[52px] w-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors duration-150"
          >
            {isMaximized ? (
              <Copy className="w-3 h-3 rotate-180 pointer-events-none" />
            ) : (
              <Square className="w-3.5 h-3.5 pointer-events-none" />
            )}
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              appWindow.close();
            }}
            className="h-[52px] w-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-red-500/80 transition-colors duration-150"
          >
            <X className="w-4 h-4 pointer-events-none" />
          </button>
        </div>
      )}
    </div>
  );
}
