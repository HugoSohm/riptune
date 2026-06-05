import { FolderOpen, X } from "lucide-react";
import { useApp } from "../context/useApp";
import Section from "./Section";

interface SettingsDirSectionProps {
  title: string;
  description: string;
  iconColor: string;
  customPath: string | null;
  defaultPath: string | null;
  onSelect: () => Promise<void>;
  onClear: () => void;
  onOpen: () => Promise<void>;
}

export default function SettingsDirSection({
  title,
  description,
  iconColor,
  customPath,
  defaultPath,
  onSelect,
  onClear,
  onOpen,
}: SettingsDirSectionProps) {
  const { t } = useApp();

  return (
    <Section
      icon={<FolderOpen className="w-4 h-4" />}
      iconColor={iconColor}
      title={title}
      description={description}
    >
      <div className="flex items-center bg-[#0d0f14] border border-white/[0.08] rounded-xl overflow-hidden focus-within:border-violet-500/40 transition-colors">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 text-left px-4 py-2.5 text-slate-400 font-mono text-[11px] truncate hover:text-white transition-colors"
        >
          {customPath || defaultPath || "Fetching path…"}
        </button>
        <div className="flex items-center gap-2">
          {customPath && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onSelect}
            className="px-4 py-2.5 bg-white/[0.03] border-l border-white/[0.08] text-white text-[12px] font-medium hover:bg-white/[0.06] transition-all active:bg-white/[0.1] cursor-pointer"
          >
            {t.settings.browse}
          </button>
        </div>
      </div>
    </Section>
  );
}
