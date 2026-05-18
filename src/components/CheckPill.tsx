import { Check } from "lucide-react";

interface CheckPillProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  accent?: "violet" | "blue";
}

export default function CheckPill({
  label,
  checked,
  onChange,
  disabled,
  accent = "violet",
}: CheckPillProps) {
  return (
    <label
      className={`flex items-center gap-2.5 px-4 h-9 rounded-xl border text-[13px] font-medium select-none transition-all duration-150 cursor-pointer
        ${
          disabled
            ? "opacity-30 cursor-not-allowed border-white/[0.05] text-slate-600"
            : checked
              ? "bg-white/[0.05] border-white/[0.1] text-white"
              : "bg-transparent border-white/[0.06] text-slate-400 hover:border-white/[0.1] hover:text-slate-200"
        }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all duration-150 border shrink-0
        ${
          disabled
            ? "border-slate-800 bg-transparent text-transparent"
            : checked
              ? (
                  accent === "blue"
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-violet-500 border-violet-500 text-white"
                )
              : "border-slate-600 bg-transparent text-transparent hover:border-slate-500"
        }`}
      >
        <Check className="w-2.5 h-2.5 stroke-[3.5] shrink-0" />
      </div>
      {label}
    </label>
  );
}
