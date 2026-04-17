import { useState, useRef, useEffect } from "react";
import { Lang, translations } from "../i18n";
import { PlaylistProgress } from "../types";

export function useUI() {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'settings'>('home');
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [dragActive, setDragActive] = useState(false);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const [playlistProgress, setPlaylistProgress] = useState<PlaylistProgress | null>(null);

  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("riptune_lang");
    return (saved === "fr" || saved === "en" || saved === "es") ? (saved as Lang) : "en";
  });
  const t = translations[lang];

  useEffect(() => { localStorage.setItem("riptune_lang", lang); }, [lang]);

  return {
    activeTab, setActiveTab, loading, setLoading, loadingRef,
    dragActive, setDragActive, isPlaylist, setIsPlaylist,
    isBugModalOpen, setIsBugModalOpen, url, setUrl, format, setFormat,
    playlistProgress, setPlaylistProgress, lang, setLang, t
  };
}
