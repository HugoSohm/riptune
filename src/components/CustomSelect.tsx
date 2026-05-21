import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: "large" | "small";
  onOpenChange?: (isOpen: boolean) => void;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  className = "",
  variant = "large",
  onOpenChange,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between transition-all duration-300 ${
          variant === "large"
            ? "bg-[#0d0f14] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white hover:border-white/[0.15]"
            : "bg-transparent text-white text-xs font-bold hover:text-violet-400 gap-1"
        }`}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-violet-400" : "text-slate-500"}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[1000] mt-2 left-0 ${variant === "large" ? "w-full" : "min-w-max"} bg-[#161a22]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        >
          <div className="p-1.5 flex flex-col gap-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                  value === option.value
                    ? "bg-violet-500/10 text-violet-400 font-semibold"
                    : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
