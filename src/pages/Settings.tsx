import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Activity, Languages, Trash2, UploadCloud } from "lucide-react";
import CustomSelect from "../components/CustomSelect";
import Section from "../components/Section";
import SettingsAboutSection from "../components/SettingsAboutSection";
import SettingsDirSection from "../components/SettingsDirSection";
import ToggleRow from "../components/ToggleRow";
import { useApp } from "../context/useApp";
import type { Lang } from "../i18n";

export default function Settings() {
  const {
    customDir,
    setCustomDir,
    defaultDir,
    customLyricsDir,
    setCustomLyricsDir,
    defaultLyricsDir,
    cookies,
    setCookies,
    deleteFilesOnHistoryDelete,
    setDeleteFilesOnHistoryDelete,
    partialAnalysis,
    setPartialAnalysis,
    lang,
    setLang,
    t,
  } = useApp();

  const handleSelectDir = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string") setCustomDir(selected);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectLyricsDir = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string")
        setCustomLyricsDir(selected);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await invoke("open_folder", { path: customDir || defaultDir });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenLyricsFolder = async () => {
    try {
      await invoke("open_folder", {
        path: customLyricsDir || defaultLyricsDir,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full pb-10 anim-fade-up">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {t.settings.title}
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          {t.settings.description}
        </p>
      </div>

      <div className="card px-6 py-1">
        {/* Language */}
        <Section
          icon={<Languages className="w-4 h-4" />}
          iconColor="text-indigo-400"
          title={t.settings.language}
        >
          <CustomSelect
            options={[
              { value: "en", label: "English (US)" },
              { value: "fr", label: "Français (FR)" },
              { value: "es", label: "Español (ES)" },
            ]}
            value={lang}
            onChange={(val) => setLang(val as Lang)}
            variant="large"
          />
        </Section>

        {/* Download location */}
        <SettingsDirSection
          title={t.settings.dlLocation}
          description={t.settings.dlLocationDesc}
          iconColor="text-violet-400"
          customPath={customDir}
          defaultPath={defaultDir}
          onSelect={handleSelectDir}
          onClear={() => setCustomDir(null)}
          onOpen={handleOpenFolder}
        />

        {/* Lyrics folder */}
        <SettingsDirSection
          title={t.settings.lyricsDir}
          description={t.settings.lyricsDirDesc}
          iconColor="text-fuchsia-400"
          customPath={customLyricsDir}
          defaultPath={defaultLyricsDir}
          onSelect={handleSelectLyricsDir}
          onClear={() => setCustomLyricsDir(null)}
          onOpen={handleOpenLyricsFolder}
        />

        {/* Cleanup */}
        <Section
          icon={<Trash2 className="w-4 h-4" />}
          iconColor="text-red-400"
          title={t.settings.cleanup}
        >
          <ToggleRow
            label={t.settings.deleteFiles}
            description={t.settings.deleteFilesDesc}
            checked={deleteFilesOnHistoryDelete}
            onChange={setDeleteFilesOnHistoryDelete}
          />
        </Section>

        {/* Audio engine */}
        <Section
          icon={<Activity className="w-4 h-4" />}
          iconColor="text-indigo-400"
          title={t.settings.audioEngine}
        >
          <ToggleRow
            label={t.settings.partialAnalysis}
            description={t.settings.partialAnalysisDesc}
            checked={partialAnalysis}
            onChange={setPartialAnalysis}
          />
        </Section>

        {/* Cookies */}
        <Section
          icon={<UploadCloud className="w-4 h-4" />}
          iconColor="text-amber-400"
          title={t.settings.cookies}
          description={t.settings.cookiesDesc.replace(/<[^>]+>/g, "")}
        >
          <input
            type="text"
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            placeholder='[ { "domain": ".youtube.com", ... } ] or # Netscape HTTP Cookie File'
            className="w-full bg-[#0d0f14] border border-white/[0.08] rounded-xl px-4 py-2.5 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-violet-500/40 transition-colors placeholder-slate-600"
          />
        </Section>

        {/* About */}
        <SettingsAboutSection />
      </div>
    </div>
  );
}
