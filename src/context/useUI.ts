import { useState, useRef, useEffect } from "react";
import { Lang, translations } from "../i18n";
import { PlaylistProgress } from "../types";

export function useUI() {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'settings'>('home');

// Multi-task tracking: each concurrent task has a unique ID and a type
  const [activeTasks, setActiveTasks] = useState<{ id: string; type: 'analysis' | 'download' }[]>([]);
  const activeTasksRef = useRef<{ id: string; type: 'analysis' | 'download' }[]>([]);

  const addActiveTask = (id: string, type: 'analysis' | 'download' = 'download') => {
    const next = [...activeTasksRef.current, { id, type }];
    activeTasksRef.current = next;
    setActiveTasks(next);
  };

  const removeActiveTask = (id: string) => {
    const next = activeTasksRef.current.filter(t => t.id !== id);
    activeTasksRef.current = next;
    setActiveTasks(next);
  };

  const isTaskActive = (id: string, type?: 'analysis' | 'download') => {
    if (type) {
      return activeTasksRef.current.some(t => t.id === id && t.type === type);
    }
    return activeTasksRef.current.some(t => t.id === id);
  };

  // Derived: any task in progress
  const loading = activeTasks.length > 0;

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
    activeTab, setActiveTab, loading,
    activeTasks, addActiveTask, removeActiveTask, isTaskActive,
    dragActive, setDragActive, isPlaylist, setIsPlaylist,
    isBugModalOpen, setIsBugModalOpen, url, setUrl, format, setFormat,
    playlistProgress, setPlaylistProgress, lang, setLang, t
  };
}
