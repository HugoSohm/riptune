import { Trash2 } from "lucide-react";
import { useApp } from "../context/useApp";

interface LyricsDeleteModalProps {
  filename: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function LyricsDeleteModal({
  filename,
  onClose,
  onConfirm,
}: LyricsDeleteModalProps) {
  const { t } = useApp();

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative bg-[#161a22] border border-white/[0.1] rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-[14px]">
              {t.lyrics.delete}
            </p>
            <p className="text-slate-500 text-[12px] mt-1 break-all">
              {filename.replace(/\.txt$/i, "")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-[13px] font-medium hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            {t.deleteModal.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 text-[13px] font-semibold transition-all cursor-pointer"
          >
            {t.deleteModal.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
