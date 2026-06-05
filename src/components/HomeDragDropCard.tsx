import { open } from "@tauri-apps/plugin-dialog";
import { UploadCloud } from "lucide-react";
import { useApp } from "../context/useApp";
import { useAudioProcessor } from "../hooks/useAudioProcessor";

export default function HomeDragDropCard() {
  const { dragActive, t } = useApp();
  const { processFile } = useAudioProcessor();

  const handleBrowseFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Audio Files",
            extensions: ["mp3", "wav", "flac", "m4a", "ogg", "aac", "wma"],
          },
        ],
      });
      if (selected && typeof selected === "string") {
        processFile(selected);
      }
    } catch (error) {
      console.error("Failed to browse audio file", error);
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: parent has complex nested elements and layout unsuitable for button
    <div
      onClick={handleBrowseFile}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleBrowseFile();
        }
      }}
      role="button"
      tabIndex={0}
      className={`group/drop card p-5 border-2 border-dashed flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 min-h-[90px] relative overflow-hidden anim-delay-1 anim-fade-up ${
        dragActive
          ? "border-violet-500 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,0.25)] scale-[1.01]"
          : "border-white/[0.06] hover:border-violet-500/25 bg-white/[0.01] hover:bg-violet-500/[0.02]"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 to-indigo-600/0 group-hover/drop:to-indigo-600/[0.015] transition-all duration-300 pointer-events-none" />

      <div className="flex items-center gap-4 z-10">
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 shrink-0 ${
            dragActive
              ? "border-violet-500 bg-violet-500/20 text-violet-400"
              : "bg-white/[0.03] border-white/[0.06] group-hover/drop:border-violet-500/20 group-hover/drop:bg-violet-500/10 text-slate-400 group-hover/drop:text-violet-400"
          }`}
        >
          <UploadCloud className="w-5 h-5 transition-transform duration-300 group-hover/drop:scale-110" />
        </div>
        <div className="text-left">
          <p className="text-[13px] font-semibold text-white">
            {t.home.dropTitle}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{t.home.dropDesc}</p>
        </div>
      </div>

      <span
        className={`text-[11px] font-medium transition-colors z-10 px-3 py-1.5 rounded-lg shrink-0 ${
          dragActive
            ? "text-white bg-violet-500/20 border border-violet-500/30"
            : "text-violet-400 bg-white/[0.03] border border-white/[0.06] group-hover/drop:border-violet-500/20 group-hover/drop:text-violet-300"
        }`}
      >
        {t.home.browse}
      </span>
    </div>
  );
}
