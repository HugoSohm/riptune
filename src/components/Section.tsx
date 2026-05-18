import type React from "react";

interface SectionProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}

export default function Section({
  icon,
  iconColor,
  title,
  description,
  children,
  last = false,
}: SectionProps) {
  return (
    <div className={`py-6 ${!last ? "border-b border-white/[0.06]" : ""}`}>
      <div className="flex items-center gap-2.5 mb-1">
        <span className={iconColor}>{icon}</span>
        <h3 className="text-[14px] font-bold text-white">{title}</h3>
      </div>
      {description && (
        <p className="text-[12px] text-slate-500 mb-4 mt-1 leading-relaxed ml-7">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}
