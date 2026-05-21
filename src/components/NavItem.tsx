export default function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={onClick}
      className={active ? "nav-item-active" : "nav-item"}
    >
      <span className={`shrink-0 ${active ? "text-white" : "text-slate-500"}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}
