import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { useAudioPlayer } from "../hooks/useAudioPlayer";
import TruncatedText from "./TruncatedText";

type PlayerProps = ReturnType<typeof useAudioPlayer>;

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || Number.isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer(props: PlayerProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isVisible,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleMute,
    closePlayer,
  } = props;

  const [dragProgress, setDragProgress] = useState<number | null>(null);

  const seekBarRef = useRef<HTMLDivElement>(null);
  const volBarRef = useRef<HTMLDivElement>(null);
  const isDraggingSeek = useRef(false);
  const isDraggingVol = useRef(false);

  // ── Seek bar interaction ─────────────────────────────────
  const getSeekRatio = useCallback(
    (e: React.MouseEvent | MouseEvent): number => {
      if (!seekBarRef.current) return 0;
      const rect = seekBarRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(1, ratio));
    },
    [],
  );

  const handleSeekMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingSeek.current = true;
      const ratio = getSeekRatio(e);
      setDragProgress(ratio);

      const onMove = (ev: MouseEvent) => {
        if (isDraggingSeek.current) {
          const r = getSeekRatio(ev);
          setDragProgress(r);
        }
      };
      const onUp = (ev: MouseEvent) => {
        isDraggingSeek.current = false;
        const r = getSeekRatio(ev);
        seek(r * duration);
        setDragProgress(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [seek, getSeekRatio, duration],
  );

  // ── Volume bar interaction ───────────────────────────────
  const getVolRatio = useCallback(
    (e: React.MouseEvent | MouseEvent): number => {
      if (!volBarRef.current) return 0;
      const rect = volBarRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(1, ratio));
    },
    [],
  );

  const handleVolMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingVol.current = true;
      setVolume(getVolRatio(e));

      const onMove = (ev: MouseEvent) => {
        if (isDraggingVol.current) setVolume(getVolRatio(ev));
      };
      const onUp = (ev: MouseEvent) => {
        isDraggingVol.current = false;
        setVolume(getVolRatio(ev));
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [setVolume, getVolRatio],
  );

  if (!isVisible || !currentTrack) return null;

  const progress =
    dragProgress !== null
      ? dragProgress
      : duration > 0
        ? currentTime / duration
        : 0;
  const displayTime =
    dragProgress !== null ? dragProgress * duration : currentTime;
  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div
      className="
        relative z-[9000] flex-shrink-0
        bg-[#0d0f14]/95 backdrop-blur-2xl
        border-t border-white/[0.07]
        px-6 py-0
        grid grid-cols-3 items-center
        h-[72px]
        select-none
      "
      style={{
        background:
          "linear-gradient(180deg, rgba(13,15,20,0.97) 0%, rgba(10,12,18,0.99) 100%)",
        boxShadow: "0 -1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* ── Seek bar overlay (full width, absolute top) ────────── */}
      <div
        ref={seekBarRef}
        className="absolute top-0 left-0 right-0 h-[3px] cursor-pointer group/seek"
        onMouseDown={handleSeekMouseDown}
      >
        {/* track */}
        <div className="absolute inset-0 bg-white/[0.06] rounded-full" />
        {/* fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-none"
          style={{
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
          }}
        />
        {/* thumb */}
        <div
          className="
            absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full
            bg-white shadow-lg shadow-violet-500/40
            opacity-0 group-hover/seek:opacity-100
            transition-opacity duration-150 -translate-x-1/2
          "
          style={{ left: `${progress * 100}%` }}
        />
        {/* hover area enlargement */}
        <div className="absolute -top-2 -bottom-2 left-0 right-0" />
      </div>

      {/* ── Track info ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0 justify-start">
        <div
          className="
            w-10 h-10 shrink-0 rounded-xl
            bg-gradient-to-br from-violet-600/30 to-indigo-600/20
            border border-violet-500/20
            flex items-center justify-center
          "
        >
          {isPlaying ? (
            <div className="flex items-end gap-[3px] h-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-violet-400"
                  style={{
                    height: "100%",
                    animation: `playerBar${i} 0.7s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <Play className="w-4 h-4 text-violet-400 fill-violet-400/30" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <TruncatedText
            text={currentTrack.title}
            className="text-white text-[13px] font-semibold leading-tight"
          />
          <TruncatedText
            text={currentTrack.artist || "Unknown Artist"}
            className="text-slate-500 text-[11px] mt-0.5 leading-tight"
          />
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2">
        {/* Prev */}
        <button
          type="button"
          onClick={playPrev}
          className="
            w-9 h-9 rounded-xl flex items-center justify-center
            text-slate-500 hover:text-white
            hover:bg-white/[0.06]
            transition-all duration-150 cursor-pointer
          "
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="
            w-11 h-11 rounded-xl flex items-center justify-center
            bg-violet-600 hover:bg-violet-500
            text-white shadow-lg shadow-violet-500/25
            transition-all duration-150 hover:scale-105 active:scale-95
            cursor-pointer
          "
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          type="button"
          onClick={playNext}
          className="
            w-9 h-9 rounded-xl flex items-center justify-center
            text-slate-500 hover:text-white
            hover:bg-white/[0.06]
            transition-all duration-150 cursor-pointer
          "
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* ── Time + Volume ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0 justify-end">
        {/* Time */}
        <span className="text-slate-500 text-[11px] font-mono shrink-0 tabular-nums">
          {formatTime(displayTime)}
          <span className="text-slate-700 mx-1">/</span>
          {formatTime(duration)}
        </span>

        {/* Volume */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            className="
              w-7 h-7 flex items-center justify-center
              text-slate-500 hover:text-white
              transition-colors duration-150 cursor-pointer
              rounded-lg hover:bg-white/[0.06]
            "
          >
            {isMuted || effectiveVolume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Volume slider */}
          <div
            ref={volBarRef}
            className="relative w-20 h-[3px] cursor-pointer group/vol"
            onMouseDown={handleVolMouseDown}
          >
            <div className="absolute inset-0 bg-white/[0.08] rounded-full" />
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-slate-400 transition-none"
              style={{ width: `${effectiveVolume * 100}%` }}
            />
            {/* thumb */}
            <div
              className="
                absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full
                bg-white shadow-md
                opacity-0 group-hover/vol:opacity-100
                transition-opacity duration-150 -translate-x-1/2
              "
              style={{ left: `${effectiveVolume * 100}%` }}
            />
            {/* hover zone */}
            <div className="absolute -top-2 -bottom-2 left-0 right-0" />
          </div>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={closePlayer}
          className="
            w-7 h-7 flex items-center justify-center
            text-slate-600 hover:text-slate-300
            rounded-lg hover:bg-white/[0.06]
            transition-all duration-150 cursor-pointer
          "
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Equalizer bar keyframes (inline) ────────────────────── */}
      <style>{`
        @keyframes playerBar0 {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1);   }
        }
        @keyframes playerBar1 {
          from { transform: scaleY(0.6); }
          to   { transform: scaleY(0.25); }
        }
        @keyframes playerBar2 {
          from { transform: scaleY(0.2); }
          to   { transform: scaleY(0.8); }
        }
      `}</style>
    </div>
  );
}
