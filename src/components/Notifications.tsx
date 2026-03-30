import { XCircle, Info, Loader2, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Notifications() {
  const { notifications, removeNotification, loading, isPlaylist, downloadPlaylist, playlistProgress, t } = useApp();
  
  // Show progress ONLY if it's a playlist AND the user enabled playlist download
  const shouldShowProgress = loading && isPlaylist && downloadPlaylist && playlistProgress;

  return (
    <div className="fixed top-[72px] right-6 z-[100001] flex flex-col gap-3 max-w-sm pointer-events-auto">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="group/toast bg-[#111728]/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto relative"
        >
          <div className={`shrink-0 p-2.5 rounded-xl ${notification.type === 'error' ? 'bg-red-500/20 text-red-400' : notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>
            {notification.type === 'error' ? (
              <XCircle className="w-5 h-5" />
            ) : notification.type === 'success' ? (
              <Info className="w-5 h-5" />
            ) : notification.isTask ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase truncate">
                {notification.type === 'error' ? t.notifications.error : notification.type === 'success' ? t.notifications.success : (notification.isTask ? t.notifications.task : t.notifications.notif)}
              </p>
              {shouldShowProgress && notification.message.includes(t.notifications.downloading.split(':')[0]) && (
                <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md border border-purple-500/20 shrink-0">
                  {playlistProgress.current} / {playlistProgress.total > 0 ? playlistProgress.total : "--"}
                </span>
              )}
            </div>
            <p className={`text-xs font-semibold leading-relaxed break-words ${notification.type === 'error' ? 'text-red-300' : notification.type === 'success' ? 'text-emerald-300' : 'text-slate-100'}`}>
              {notification.message}
            </p>

            {shouldShowProgress && notification.message.includes(t.notifications.downloading.split(':')[0]) && (
              <div className="mt-2.5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${(playlistProgress.current / playlistProgress.total) * 100}%` }}
                />
              </div>
            )}
          </div>

          {!notification.isTask && (
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
