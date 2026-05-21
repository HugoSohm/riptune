import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Bug, ExternalLink, Image, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../context/useApp";
import { trackEvent } from "../utils/analytics";

export default function BugReportModal() {
  const { isBugModalOpen, setIsBugModalOpen, addNotification, t } = useApp();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let unlistenEnter: Promise<UnlistenFn>;
    let unlistenLeave: Promise<UnlistenFn>;
    let unlistenDrop: Promise<UnlistenFn>;

    if (isBugModalOpen) {
      unlistenEnter = listen("tauri://drag-enter", (event: any) => {
        const paths = event.payload.paths || [];
        if (paths.length > 0) {
          const path = paths[0].toLowerCase();
          if (
            path.endsWith(".png") ||
            path.endsWith(".jpg") ||
            path.endsWith(".jpeg") ||
            path.endsWith(".webp") ||
            path.endsWith(".gif")
          ) {
            setIsDragging(true);
          }
        }
      });

      unlistenLeave = listen("tauri://drag-leave", () => {
        setIsDragging(false);
      });

      unlistenDrop = listen("tauri://drag-drop", async (event: any) => {
        setIsDragging(false);
        const paths = event.payload.paths || [];
        if (paths.length > 0) {
          const path = paths[0];
          const lowerPath = path.toLowerCase();
          const isImage =
            lowerPath.endsWith(".png") ||
            lowerPath.endsWith(".jpg") ||
            lowerPath.endsWith(".jpeg") ||
            lowerPath.endsWith(".webp") ||
            lowerPath.endsWith(".gif");

          if (isImage) {
            try {
              const dataUrl = await invoke<string>("read_image_base64", {
                path,
              });
              setScreenshot(dataUrl);
              addNotification(t.notifications.imageAttached, "success");
            } catch (error) {
              console.error("Failed to read image", error);
              addNotification(t.notifications.imageError, "error");
            }
          }
        }
      });
    }

    return () => {
      if (unlistenEnter) unlistenEnter.then((f) => f());
      if (unlistenLeave) unlistenLeave.then((f) => f());
      if (unlistenDrop) unlistenDrop.then((f) => f());
    };
  }, [
    isBugModalOpen,
    addNotification,
    t.notifications.imageError,
    t.notifications.imageAttached,
  ]);

  if (!isBugModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setScreenshot(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSending(true);

    try {
      // Direct call to Resend API via Rust Backend
      await invoke("send_bug_report", { message, email, screenshot });

      trackEvent("bug_report_sent", { hasScreenshot: screenshot ? 1 : 0 });

      addNotification(t.notifications.bugReportSuccess, "success");
      setIsBugModalOpen(false);
      setMessage("");
      setEmail("");
      setScreenshot(null);
    } catch (error) {
      console.error(error);
      addNotification(`${t.notifications.bugReportError}: ${error}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setIsBugModalOpen(false);
    setMessage("");
    setEmail("");
    setScreenshot(null);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        onPaste={handlePaste}
        className="relative w-full max-w-2xl bg-[#161a22] border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 transition-all"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Bug className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {t.bugModal.title}
              </h2>
              <p
                className="text-xs text-slate-500 mt-0.5"
                dangerouslySetInnerHTML={{ __html: t.bugModal.description }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
                {t.bugModal.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.bugModal.emailPlaceholder}
                className="w-full bg-[#0d0f14] border border-white/[0.08] rounded-2xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors duration-200 text-[15px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50 animate-pulse" />
                {t.bugModal.label}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.bugModal.placeholder}
                className="w-full h-32 bg-[#0d0f14] border border-white/[0.08] rounded-2xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors duration-200 resize-none text-[15px]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label
                  className="text-xs font-bold uppercase tracking-widest text-slate-500"
                  dangerouslySetInnerHTML={{ __html: t.bugModal.screenshot }}
                />
                {screenshot && (
                  <button
                    type="button"
                    onClick={() => setScreenshot(null)}
                    className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t.bugModal.remove}
                  </button>
                )}
              </div>

              {!screenshot ? (
                <label
                  className={`group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${isDragging ? "border-violet-500 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,0.2)] scale-[1.02]" : "border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5"} rounded-2xl transition-all cursor-pointer overflow-hidden`}
                >
                  {isDragging && (
                    <div className="absolute inset-0 z-10 bg-violet-500/10 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
                      <div className="flex flex-col items-center">
                        <Image className="w-8 h-8 text-violet-400" />
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mt-2">
                          {t.bugModal.dropTitle}
                        </span>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Image className="w-6 h-6 text-slate-600 group-hover:text-violet-400 group-hover:scale-110 transition-all" />
                  <span className="mt-2 text-xs text-slate-500 group-hover:text-violet-400 transition-colors uppercase tracking-widest font-bold">
                    {t.bugModal.upload}
                  </span>
                </label>
              ) : (
                <div
                  onClick={() => setShowFullImage(true)}
                  className="relative group w-full h-32 rounded-2xl overflow-hidden border border-white/10 cursor-zoom-in"
                >
                  <img
                    src={screenshot}
                    alt="Preview"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Image Overlay */}
        {showFullImage && screenshot && (
          <div
            className="fixed inset-0 z-[100001] bg-black/90 flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
            onClick={() => setShowFullImage(false)}
          >
            <button
              type="button"
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 cursor-pointer"
              onClick={() => setShowFullImage(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={screenshot}
              alt="Full Preview"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              openUrl("https://github.com/HugoSohm/riptune/issues")
            }
            className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-violet-400 transition-colors uppercase tracking-widest cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
            {t.bugModal.githubIssues}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSending}
              className="px-6 py-2.5 rounded-xl text-slate-400 font-bold text-sm hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {t.bugModal.cancel}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={
                !message.trim() ||
                !email.trim() ||
                !email.includes("@") ||
                isSending
              }
              className={`px-8 py-2.5 font-bold rounded-xl transition-all active:scale-95 text-sm flex items-center gap-2 ${
                !message.trim() ||
                !email.trim() ||
                !email.includes("@") ||
                isSending
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50 shadow-none border border-white/5"
                  : "bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20 cursor-pointer"
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.bugModal.sending}
                </>
              ) : (
                t.bugModal.send
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
