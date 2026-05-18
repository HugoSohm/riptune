import { Info, Loader2, X, XCircle } from "lucide-react";
import { useApp } from "../context/useApp";

export default function Notifications() {
  const {
    notifications,
    removeNotification,
    loading,
    isPlaylist,
    downloadPlaylist,
    playlistProgress,
    t,
  } = useApp();

  // Show progress ONLY if it's a playlist AND the user enabled playlist download
  const shouldShowProgress =
    loading && isPlaylist && downloadPlaylist && playlistProgress;

  return (
    <div className="fixed top-[72px] right-6 z-[100001] flex flex-col gap-3 max-w-sm pointer-events-auto">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="group/toast bg-[#161a22]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-start gap-3.5 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto relative w-80 hover:border-white/[0.12] transition-colors"
        >
          <div
            className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center
              ${
                notification.type === "error"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : notification.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.06]"
              }`}
          >
            {notification.type === "error" ? (
              <XCircle className="w-4 h-4" />
            ) : notification.type === "success" ? (
              <Info className="w-4 h-4" />
            ) : notification.isTask ? (
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            ) : (
              <Info className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase truncate">
                {notification.type === "error"
                  ? t.notifications.error
                  : notification.type === "success"
                    ? t.notifications.success
                    : notification.isTask
                      ? t.notifications.task
                      : t.notifications.notif}
              </p>
              {shouldShowProgress &&
                (notification.message.includes(
                  t.notifications.downloading.split(":")[0],
                ) ||
                  notification.message.includes(
                    t.notifications.analyzing.split(":")[0],
                  )) && (
                  <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-md border border-violet-500/20 shrink-0">
                    {playlistProgress.current} /{" "}
                    {playlistProgress.total > 0 ? playlistProgress.total : "--"}
                  </span>
                )}
            </div>
            <p
              className={`text-xs font-medium leading-relaxed break-words ${notification.type === "error" ? "text-red-200/90" : notification.type === "success" ? "text-emerald-200/90" : "text-slate-200"}`}
            >
              {notification.message}
            </p>

            {shouldShowProgress &&
              (notification.message.includes(
                t.notifications.downloading.split(":")[0],
              ) ||
                notification.message.includes(
                  t.notifications.analyzing.split(":")[0],
                )) && (
                <div className="mt-2.5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                    style={{
                      width: `${playlistProgress.total > 0 ? (playlistProgress.current / playlistProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              )}
          </div>

          {!notification.isTask && (
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors cursor-pointer active:scale-90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
