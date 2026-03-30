import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: 'large' | 'small';
}

export default function CustomSelect({ options, value, onChange, className = "", variant = 'large' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
          variant === 'large' 
            ? 'bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white font-bold shadow-inner hover:border-white/20' 
            : 'bg-transparent text-white text-xs font-bold hover:text-purple-400 gap-1'
        }`}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-purple-400' : 'text-slate-500'}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[1000] mt-2 left-1/2 -translate-x-1/2 min-w-max bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1.5 flex flex-col gap-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  value === option.value 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
