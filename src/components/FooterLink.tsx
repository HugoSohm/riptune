import { ExternalLink } from "lucide-react";

export default function FooterLink({
  icon,
  label,
  onClick,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  external?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={onClick}
      className="group flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-300 transition-colors duration-150 cursor-pointer select-none"
    >
      <span className="shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors">
        {icon}
      </span>
      <span>{label}</span>
      {external && (
        <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
      )}
    </button>
  );
}
