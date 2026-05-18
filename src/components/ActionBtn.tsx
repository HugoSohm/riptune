import type React from "react";

interface ActionBtnProps {
  onClick?: () => void;
  disabled?: boolean;
  tooltip: string;
  className?: string;
  children: React.ReactNode;
  tooltipAlign?: "center" | "right";
}

export default function ActionBtn({
  onClick,
  disabled,
  tooltip,
  className = "",
  children,
  tooltipAlign = "center",
}: ActionBtnProps) {
  const alignClass =
    tooltipAlign === "right"
      ? "right-0 origin-right"
      : "left-1/2 -translate-x-1/2 origin-bottom";

  return (
    <div className="group/ab relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`action-btn ${className}`}
      >
        {children}
      </button>
      <div
        className={`absolute bottom-full mb-1.5 px-2.5 py-1 bg-[#1e2330]/95 backdrop-blur-xl border border-white/[0.08] text-white text-[10px] font-medium rounded-lg shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 scale-95 group-hover/ab:opacity-100 group-hover/ab:scale-100 transition-all duration-150 group-hover/ab:delay-[600ms] ${alignClass}`}
      >
        {tooltip}
      </div>
    </div>
  );
}
