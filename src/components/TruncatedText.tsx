import { useEffect, useRef, useState } from "react";

interface TruncatedTextProps {
  text: string;
  className?: string;
}

export default function TruncatedText({ text, className }: TruncatedTextProps) {
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) setOverflow(el.scrollWidth > el.offsetWidth);
    const onResize = () => {
      if (el) setOverflow(el.scrollWidth > el.offsetWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="group relative w-full min-w-0">
      <div ref={ref} className={`truncate ${className}`}>
        {text}
      </div>
      {overflow && (
        <div className="absolute bottom-full left-0 mb-1.5 px-2.5 py-1.5 bg-[#1e2330]/95 backdrop-blur-xl border border-white/[0.08] text-white text-[11px] font-medium rounded-lg shadow-2xl whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
          {text}
        </div>
      )}
    </div>
  );
}
