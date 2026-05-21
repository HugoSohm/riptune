import { AlertTriangle } from "lucide-react";

interface ToggleRowProps {
  label: string;
  description?: string;
  warning?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export default function ToggleRow({
  label,
  description,
  warning,
  checked,
  onChange,
}: ToggleRowProps) {

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-white">{label}</p>
        {description && (
          <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
        {warning && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-500/80 shrink-0" />
            <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">
              {warning}
            </p>
          </div>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`w-9 h-5 bg-white/[0.06] rounded-full relative border border-white/[0.07] transition-colors duration-200 peer-checked:bg-white peer-checked:border-white/10
          after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
          peer-checked:after:translate-x-4 peer-checked:after:bg-slate-950`}
        />
      </label>
    </div>
  );
}
