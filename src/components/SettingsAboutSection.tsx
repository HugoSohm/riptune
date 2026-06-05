import { ExternalLink, Globe, Info, Puzzle } from "lucide-react";
import { useApp } from "../context/useApp";
import Section from "./Section";

export default function SettingsAboutSection() {
  const { t } = useApp();

  const links = [
    {
      href: "https://riptune.app",
      icon: <Globe className="w-3.5 h-3.5" />,
      label: t.settings.website,
      color:
        "text-violet-400 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20",
    },
    {
      href: "https://chromewebstore.google.com/detail/riptune/fcgoflmnnmlmhdgockhcfddcepafohnj",
      icon: <Puzzle className="w-3.5 h-3.5" />,
      label: t.settings.chromeExtension,
      color:
        "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20",
    },
    {
      href: "https://github.com/HugoSohm/riptune",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 fill-current"
          role="img"
          aria-label="GitHub"
        >
          <title>GitHub</title>
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      label: t.settings.github,
      color:
        "text-slate-400 bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.09] hover:text-white",
    },
    {
      href: "https://ko-fi.com/riptune",
      icon: (
        <img
          src="https://storage.ko-fi.com/cdn/cup-border.png"
          alt="Ko-fi"
          className="w-3.5 h-3.5"
        />
      ),
      label: t.settings.koFi,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20",
    },
  ];

  return (
    <Section
      icon={<Info className="w-4 h-4" />}
      iconColor="text-blue-400"
      title={t.settings.about}
      last
    >
      <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
        {t.settings.aboutDesc.split("@HugoSohm")[0]}
        <a
          href="https://github.com/HugoSohm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-400 hover:text-violet-300 font-semibold underline decoration-dotted underline-offset-4 transition-colors"
        >
          @HugoSohm
        </a>
        {t.settings.aboutDesc.split("@HugoSohm")[1]?.split("https")[0] || ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map(({ href, icon, label, color }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-3.5 py-2 border rounded-xl text-[12px] font-medium transition-all duration-150 group ${color}`}
          >
            {icon}
            {label}
            <ExternalLink className="w-2.5 h-2.5 opacity-40 group-hover:opacity-70 ml-0.5" />
          </a>
        ))}
      </div>
    </Section>
  );
}
