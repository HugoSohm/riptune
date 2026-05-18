interface StatCardProps {
  label: string;
  value?: string | number;
  sub?: string;
  accent: "violet" | "indigo";
  empty?: boolean;
}

export default function StatCard({
  label,
  value,
  sub,
  accent,
  empty,
}: StatCardProps) {
  const dotColor = accent === "violet" ? "bg-violet-500" : "bg-indigo-400";
  const valColor = accent === "violet" ? "text-violet-300" : "text-indigo-300";

  return (
    <div className={`card flex-1 p-5 ${empty ? "opacity-40" : "card-hover"}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 select-none">
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <span className="section-label">{label}</span>
        </div>
        {value && sub && (
          <span
            className={`text-[10px] font-bold tracking-wider uppercase bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md select-none ${valColor}`}
          >
            {sub}
          </span>
        )}
      </div>
      {value ? (
        <div className="text-4xl font-black tracking-tight text-white leading-none select-text">
          {value}
        </div>
      ) : (
        <div className="h-10 select-none" />
      )}
    </div>
  );
}
