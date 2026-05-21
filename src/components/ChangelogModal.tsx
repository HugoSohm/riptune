import { Sparkles, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import changelogText from "../../Changelog.md?raw";
import { useApp } from "../context/useApp";

interface Release {
  version: string;
  date: string;
  sections: {
    title: string;
    items: string[];
  }[];
}

function parseChangelog(text: string): Release[] {
  const releases: Release[] = [];
  const lines = text.split("\n");
  let currentRelease: Release | null = null;
  let currentSection: { title: string; items: string[] } | null = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check for release header: ## 0.3.4 (2026-05-18)
    const releaseMatch = line.match(/^##\s+([0-9.]+)\s+\(([^)]+)\)/);
    if (releaseMatch) {
      currentRelease = {
        version: releaseMatch[1],
        date: releaseMatch[2],
        sections: [],
      };
      releases.push(currentRelease);
      currentSection = null;
      continue;
    }

    // If we are inside a release
    if (currentRelease) {
      // Check for section header: ### ✨ YouTube Metadata & DX Polish
      if (line.startsWith("###")) {
        const title = line.replace(/^###\s+/, "");
        currentSection = {
          title,
          items: [],
        };
        currentRelease.sections.push(currentSection);
        continue;
      }

      // Check for list item: - **Playlist Batch Analysis**: It is now...
      if (line.startsWith("-")) {
        const itemText = line.replace(/^-\s+/, "");
        if (currentSection) {
          currentSection.items.push(itemText);
        } else {
          // If no section exists yet, create a default one
          if (currentRelease.sections.length === 0) {
            currentSection = { title: "General", items: [] };
            currentRelease.sections.push(currentSection);
          }
          currentRelease.sections[0].items.push(itemText);
        }
      }
    }
  }
  return releases;
}

export default function ChangelogModal() {
  const { isChangelogModalOpen, setIsChangelogModalOpen, t } = useApp();

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isChangelogModalOpen) {
        setIsChangelogModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChangelogModalOpen, setIsChangelogModalOpen]);

  const parsedReleases = useMemo(() => {
    try {
      return parseChangelog(changelogText);
    } catch (e) {
      console.error("Failed to parse changelog.md", e);
      return [];
    }
  }, []);

  if (!isChangelogModalOpen) return null;

  const handleClose = () => {
    setIsChangelogModalOpen(false);
  };

  const renderItemText = (text: string) => {
    const parts = text.split("**");
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static parts mapping
          <strong key={index} className="font-bold text-slate-100 font-medium">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#161a22] border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 transition-all flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {t.changelogModal?.title || "Nouveautés & Mises à jour"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.changelogModal?.subtitle ||
                  "Historique complet des versions et des améliorations de RipTune"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
          {parsedReleases.map((release, releaseIdx) => (
            <div
              key={release.version}
              className={`space-y-4 ${
                releaseIdx > 0 ? "pt-6 border-t border-white/5" : ""
              }`}
            >
              {/* Release Version & Date Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 text-violet-300 tracking-wider">
                    v{release.version}
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-semibold">
                    {release.date}
                  </span>
                </div>
              </div>

              {/* Sections inside release */}
              <div className="space-y-5 pl-1">
                {release.sections.map((section) => (
                  <div key={section.title} className="space-y-2.5">
                    <h4 className="text-[13px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                      {section.title}
                    </h4>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="text-[13.5px] leading-relaxed text-slate-400 flex items-start gap-2.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500/40 shrink-0 mt-2" />
                          <span>{renderItemText(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white/[0.02] border-t border-white/5 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 font-bold text-sm hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            {t.changelogModal?.close || "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}
