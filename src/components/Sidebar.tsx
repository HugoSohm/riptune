import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Bug,
  Coffee,
  FileText,
  History,
  Home,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useApp } from "../context/useApp";
import FooterLink from "./FooterLink";
import NavItem from "./NavItem";

export default function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    setIsBugModalOpen,
    setIsChangelogModalOpen,
    t,
  } = useApp();

  return (
    <aside className="w-[200px] min-w-[200px] flex flex-col h-full bg-[#0b0d12] border-r border-white/[0.07] shrink-0 z-10">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-4 pb-2 flex flex-col gap-0.5">
        <NavItem
          icon={<Home className="w-4 h-4" />}
          label={t.titleBar.home}
          active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
        />
        <NavItem
          icon={<History className="w-4 h-4" />}
          label={t.titleBar.history}
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
        <NavItem
          icon={<FileText className="w-4 h-4" />}
          label={t.titleBar.lyrics}
          active={activeTab === "lyrics"}
          onClick={() => setActiveTab("lyrics")}
        />
        <NavItem
          icon={<Settings2 className="w-4 h-4" />}
          label={t.titleBar.settings}
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />

        {/* ── Quoi de neuf (Pill Premium et Ultra-Discrète) ──────────── */}
        <div className="mt-auto pt-4 pb-1">
          <button
            type="button"
            onMouseDown={() => setIsChangelogModalOpen(true)}
            className="group flex items-center justify-start gap-2.5 w-full px-3 py-2 rounded-full border border-transparent hover:bg-violet-500/5 hover:border-violet-500/10 text-[12.5px] font-semibold text-slate-500 hover:text-violet-300 transition-all duration-150 cursor-pointer select-none active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 group-hover:rotate-12 transition-all duration-300" />
            <span>{t.titleBar.whatsNew || "Quoi de neuf ?"}</span>
          </button>
        </div>
      </nav>

      {/* ── Footer links ─────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-3 border-t border-white/[0.06] flex flex-col gap-0.5">
        <FooterLink
          icon={<Bug className="w-3.5 h-3.5" />}
          label={t.titleBar.bugReport || "Report a Bug"}
          onClick={() => setIsBugModalOpen(true)}
        />
        <FooterLink
          icon={<Coffee className="w-3.5 h-3.5" />}
          label={t.titleBar.support || "Support"}
          onClick={() => openUrl("https://ko-fi.com/riptune")}
          external
        />
        <FooterLink
          icon={
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
              role="img"
              aria-label="GitHub"
            >
              <title>GitHub</title>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          }
          label={t.titleBar.sourceCode || "Source Code"}
          onClick={() => openUrl("https://github.com/HugoSohm/riptune")}
          external
        />
      </div>
    </aside>
  );
}
