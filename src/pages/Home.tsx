import HomeDragDropCard from "../components/HomeDragDropCard";
import HomeLatestTrackCard from "../components/HomeLatestTrackCard";
import HomeUrlInputCard from "../components/HomeUrlInputCard";
import StatCard from "../components/StatCard";
import { useApp } from "../context/useApp";

export default function Home() {
  const { latest, latestPlaylist, t } = useApp();

  return (
    <div className="flex flex-col gap-6 pb-6 anim-fade-up">
      {/* ── URL input card (first) ───────────────────────────── */}
      <HomeUrlInputCard />

      {/* ── Delimiter ────────────────────────────────────────── */}
      <div className="flex items-center gap-4 py-1 select-none anim-delay-1 anim-fade-up">
        <div className="flex-1 h-px bg-white/[0.04]" />
        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-600">
          {t.home.or}
        </span>
        <div className="flex-1 h-px bg-white/[0.04]" />
      </div>

      {/* ── Drag & Drop Area (second) ────────────────────────── */}
      <HomeDragDropCard />

      {/* ── Delimiter (simple) ────────────────────────────────── */}
      <div className="h-px bg-white/[0.04] w-full anim-delay-2 anim-fade-up" />

      {/* ── Stat row: BPM + Key (second) ─────────────────────── */}
      <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full">
        <div className="flex gap-4 anim-delay-2 anim-fade-up">
          <StatCard
            label={t.home.bpm}
            value={!latestPlaylist ? latest?.bpm : undefined}
            sub={
              !latestPlaylist && latest?.bpm
                ? (latest.bpmFromYoutube ?? latest.fromYoutubeDesc)
                  ? t.home.fromYoutube
                  : `~${Math.round((latest.bpmConfidence ?? 0.8) * 100)}% ${t.home.confidence}`
                : undefined
            }
            accent="violet"
            empty={!!latestPlaylist || !latest?.bpm}
            copiableValue={!latestPlaylist ? latest?.bpm : undefined}
            copiedLabel={t.home.copied}
          />
          <StatCard
            label={t.home.key}
            value={!latestPlaylist ? latest?.key : undefined}
            sub={
              !latestPlaylist && latest?.key
                ? (latest.keyFromYoutube ?? latest.fromYoutubeDesc)
                  ? t.home.fromYoutube
                  : `~${Math.round((latest.keyStrength ?? 0.5) * 100)}% ${t.home.confidence}`
                : undefined
            }
            accent="indigo"
            empty={!!latestPlaylist || !latest?.key}
            copiableValue={!latestPlaylist ? latest?.key : undefined}
            copiedLabel={t.home.copied}
          />
        </div>

        {/* ── Last Processed Track card (third) ───────────────── */}
        <HomeLatestTrackCard />
      </div>
    </div>
  );
}
