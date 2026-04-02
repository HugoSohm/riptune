import { useState, useEffect } from "react";
import { Bug, X, Image, Trash2, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { trackEvent } from "../utils/analytics";

export default function BugReportModal() {
  const { isBugModalOpen, setIsBugModalOpen, addNotification, lang, t } = useApp();
  const [message, setMessage] = useState("");
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
                if (path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".webp") || path.endsWith(".gif")) {
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
                const isImage = lowerPath.endsWith(".png") || 
                               lowerPath.endsWith(".jpg") || 
                               lowerPath.endsWith(".jpeg") || 
                               lowerPath.endsWith(".webp") || 
                               lowerPath.endsWith(".gif");

                if (isImage) {
                    try {
                        const dataUrl = await invoke<string>("read_image_base64", { path });
                        setScreenshot(dataUrl);
                        addNotification("Image attached", "success");
                    } catch (error) {
                        console.error("Failed to read image", error);
                        addNotification("Could not read image file", "error");
                    }
                }
            }
        });
    }

    return () => {
        if (unlistenEnter) unlistenEnter.then(f => f());
        if (unlistenLeave) unlistenLeave.then(f => f());
        if (unlistenDrop) unlistenDrop.then(f => f());
    };
  }, [isBugModalOpen, addNotification]);

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
      await invoke("send_bug_report", { message, screenshot });
      
      trackEvent("bug_report_sent", { hasScreenshot: screenshot ? 1 : 0 });

      addNotification("Bug report sent successfully", "success");
      setIsBugModalOpen(false);
      setMessage("");
      setScreenshot(null);
    } catch (error: any) {
      console.error(error);
      addNotification(`Failed to send report: ${error}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setIsBugModalOpen(false);
    setMessage("");
    setScreenshot(null);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        onPaste={handlePaste}
        className="relative w-full max-w-2xl bg-[#0f1424] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 transition-all"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Bug className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{t.bugModal.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.bugModal.description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 animate-pulse" />
              {t.bugModal.label}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.bugModal.placeholder}
              className="w-full h-40 bg-[#0a0f1c] border border-slate-800/60 rounded-2xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-500/50 transition-colors duration-200 resize-none text-[15px]"
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
                  onClick={() => setScreenshot(null)}
                  className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>

            {!screenshot ? (
              <label className={`group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${isDragging ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.2)] scale-[1.02]' : 'border-white/5 hover:border-yellow-500/30 hover:bg-yellow-500/5'} rounded-2xl transition-all cursor-pointer overflow-hidden`}>
                {isDragging && (
                  <div className="absolute inset-0 z-10 bg-yellow-500/10 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
                    <div className="flex flex-col items-center">
                        <Image className="w-8 h-8 text-yellow-400" />
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] mt-2">{t.bugModal.dropTitle}</span>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Image className="w-6 h-6 text-slate-600 group-hover:text-yellow-400 group-hover:scale-110 transition-all" />
                <span className="mt-2 text-xs text-slate-500 group-hover:text-yellow-400 transition-colors uppercase tracking-widest font-bold">
                  Upload Image
                </span>
              </label>
            ) : (
              <div 
                onClick={() => setShowFullImage(true)}
                className="relative group w-full h-32 rounded-2xl overflow-hidden border border-white/10 cursor-zoom-in"
              >
                <img src={screenshot} alt="Preview" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              </div>
            )}
          </div>
        </div>

        {/* Full Image Overlay */}
        {showFullImage && screenshot && (
          <div 
            className="fixed inset-0 z-[100001] bg-black/90 flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
            onClick={() => setShowFullImage(false)}
          >
            <button 
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
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
        <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSending}
            className="px-6 py-2.5 rounded-xl text-slate-400 font-bold text-sm hover:text-white transition-colors disabled:opacity-50"
          >
            {t.bugModal.cancel}
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="px-8 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-800 disabled:text-slate-600 text-[#0f1424] font-bold rounded-xl transition-all active:scale-95 text-sm flex items-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {lang === 'fr' ? 'Envoi...' : 'Sending...'}
              </>
            ) : (
              t.bugModal.send
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
