import { useCallback, useEffect, useRef, useState } from "react";
import type { HistoryEntry } from "../types";

const AUDIO_SERVER = "http://127.0.0.1:4774";

export interface PlayerTrack {
  id: string;
  title: string;
  artist?: string;
  src: string; // asset URL via convertFileSrc
}

function toPlayerTrack(item: HistoryEntry): PlayerTrack {
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    src: `${AUDIO_SERVER}/audio?path=${encodeURIComponent(item.filepath)}`,
  };
}

/**
 * Encapsulates all playlist and queue management logic to keep the main
 * audio engine hook clean and focused.
 */
export function usePlaylistState(onActiveTrackChange?: () => void) {
  const [playlist, setPlaylist] = useState<PlayerTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Maintain refs to avoid stale closures in event listener callbacks
  const playlistRef = useRef<PlayerTrack[]>([]);
  const currentIndexRef = useRef<number>(-1);
  playlistRef.current = playlist;
  currentIndexRef.current = currentIndex;

  const loadPlaylist = useCallback(
    (items: HistoryEntry[], startId: string) => {
      const playable = items.filter((i) => !i.isTemp && i.filepath);
      const tracks = playable.map(toPlayerTrack);
      const startIdx = tracks.findIndex((t) => t.id === startId);
      setPlaylist(tracks);
      setCurrentIndex(startIdx >= 0 ? startIdx : 0);
      onActiveTrackChange?.();
    },
    [onActiveTrackChange],
  );

  const playTrack = useCallback(
    (item: HistoryEntry) => {
      if (!item.filepath || item.isTemp) return;
      const track = toPlayerTrack(item);
      const pl = playlistRef.current;
      const existingIdx = pl.findIndex((t) => t.id === item.id);
      if (existingIdx >= 0) {
        setCurrentIndex(existingIdx);
      } else {
        setPlaylist((prev) => [...prev, track]);
        setCurrentIndex(pl.length);
      }
      onActiveTrackChange?.();
    },
    [onActiveTrackChange],
  );

  const playNext = useCallback(() => {
    const pl = playlistRef.current;
    const idx = currentIndexRef.current;
    if (pl.length === 0 || idx < 0) return;
    setCurrentIndex((idx + 1) % pl.length);
  }, []);

  const playPrevIndex = useCallback(() => {
    const pl = playlistRef.current;
    const idx = currentIndexRef.current;
    if (pl.length === 0 || idx < 0) return;
    setCurrentIndex((idx - 1 + pl.length) % pl.length);
  }, []);

  const syncPlaylist = useCallback((items: HistoryEntry[]) => {
    const playable = items.filter((i) => !i.isTemp && i.filepath);
    const tracks = playable.map(toPlayerTrack);
    const currentId = playlistRef.current[currentIndexRef.current]?.id;

    setPlaylist(tracks);
    if (currentId) {
      const newIdx = tracks.findIndex((t) => t.id === currentId);
      setCurrentIndex(newIdx >= 0 ? newIdx : -1);
    }
  }, []);

  return {
    playlist,
    currentIndex,
    playlistRef,
    currentIndexRef,
    loadPlaylist,
    playTrack,
    playNext,
    playPrevIndex,
    syncPlaylist,
  };
}

/**
 * Core audio player hook that handles the HTML5 Audio element integration,
 * synchronization of playback state, and playback controls.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Sync visibility with playlist activity
  const handleActiveTrackChange = useCallback(() => {
    setIsVisible(true);
  }, []);

  // Separate queue/playlist state logic
  const {
    playlist,
    currentIndex,
    currentIndexRef,
    loadPlaylist,
    playTrack,
    playNext,
    playPrevIndex,
    syncPlaylist,
  } = usePlaylistState(handleActiveTrackChange);

  // Initialize and synchronize HTMLAudioElement event handlers
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      playNext();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
    };
  }, [playNext]);

  // Sync volume & mute states with the audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Smoothly update currentTime during active playback at ~60fps
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    let animFrameId: number;
    const updateProgress = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
      }
      animFrameId = requestAnimationFrame(updateProgress);
    };

    animFrameId = requestAnimationFrame(updateProgress);
    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isPlaying]);

  // Load and play track when current index or playlist updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentIndex < 0 || currentIndex >= playlist.length) return;

    const track = playlist[currentIndex];
    audio.src = track.src;
    audio.load();
    setIsVisible(true);
    audio.play().catch(() => {});
    setCurrentTime(0);
    setDuration(0);
  }, [currentIndex, playlist]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  // ── Keyboard shortcut for Space (Play/Pause) ──────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || currentIndexRef.current < 0) return;

      if (e.code === "Space" || e.key === " ") {
        const target = e.target as HTMLElement;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible, togglePlay, currentIndexRef]);

  const playPrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    playPrevIndex();
  }, [playPrevIndex]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (v > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  const closePlayer = useCallback(() => {
    audioRef.current?.pause();
    setIsVisible(false);
    setIsPlaying(false);
  }, []);

  const reopenPlayer = useCallback(() => {
    if (currentIndexRef.current < 0) return;
    setIsVisible(true);
    audioRef.current?.play().catch(() => {});
  }, [currentIndexRef.current]);

  const currentTrack =
    currentIndex >= 0 && currentIndex < playlist.length
      ? playlist[currentIndex]
      : null;

  return {
    // State
    currentTrack,
    playlist,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isVisible,
    // Actions
    playTrack,
    loadPlaylist,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleMute,
    closePlayer,
    reopenPlayer,
    syncPlaylist,
  };
}
