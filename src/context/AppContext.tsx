import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HistoryEntry, Notification, PlaylistProgress } from "../types";
import { Lang, translations } from "../i18n";

interface AppContextType {
  // UI States
  activeTab: 'home' | 'history' | 'settings';
  setActiveTab: (tab: 'home' | 'history' | 'settings') => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  isPlaylist: boolean;
  setIsPlaylist: (is: boolean) => void;
  isBugModalOpen: boolean;
  setIsBugModalOpen: (open: boolean) => void;

  // Download Config
  shouldDownload: boolean;
  setShouldDownload: (should: boolean) => void;
  autoAnalyze: boolean;
  setAutoAnalyze: (auto: boolean) => void;
  downloadPlaylist: boolean;
  setDownloadPlaylist: (dl: boolean) => void;

  // Internationalization
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: any;

  // Notifications
  notifications: Notification[];
  addNotification: (message: string, type?: 'info' | 'error' | 'success', isTask?: boolean) => string;
  removeNotification: (id: string) => void;
  clearNotificationsFor: (match: string) => void;

  // History & Shared Data
  history: HistoryEntry[];
  setHistory: (history: HistoryEntry[]) => void;
  saveHistory: (newHistory: HistoryEntry[]) => void;
  latest: HistoryEntry | null;
  setLatest: (entry: HistoryEntry | null) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  handleDeleteHistoryItem: (id: string) => void;
  confirmDelete: () => Promise<void>;
  handleOpenFile: (filepath: string) => Promise<void>;

  // Config & FileSystem
  customDir: string | null;
  setCustomDir: (dir: string | null) => void;
  defaultDir: string;
  setDefaultDir: (dir: string) => void;
  cookies: string;
  setCookies: (cookies: string) => void;
  deleteFilesOnHistoryDelete: boolean;
  setDeleteFilesOnHistoryDelete: (del: boolean) => void;

  // Playlist Progress (Global for Notifications)
  playlistProgress: PlaylistProgress | null;
  setPlaylistProgress: (progress: PlaylistProgress | null) => void;

  // Shared Refs
  loadingRef: React.MutableRefObject<boolean>;

  // New Global UI States for Hooks
  url: string;
  setUrl: (url: string) => void;
  format: string;
  setFormat: (format: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // UI States
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'settings'>('home');
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [dragActive, setDragActive] = useState(false);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

  // Download Config
  const [shouldDownload, setShouldDownload] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [downloadPlaylist, setDownloadPlaylist] = useState(false);

  // New Global UI States for Hooks
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");

  // Internationalization
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("riptune_lang");
    return (saved === "fr" || saved === "en" || saved === "es") ? (saved as Lang) : "en";
  });
  const t = translations[lang];

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (message: string, type: 'info' | 'error' | 'success' = 'info', isTask: boolean = false) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [{ id, message, type, isTask }, ...prev]);
    if (!isTask) {
      const delay = type === 'error' ? 8000 : 5000;
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), delay);
    }
    return id;
  };
  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const clearNotificationsFor = (match: string) => setNotifications(prev => prev.filter(n => !n.message.includes(match)));

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [latest, setLatest] = useState<HistoryEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Config
  const [customDir, setCustomDir] = useState<string | null>(localStorage.getItem("riptune_download_dir"));
  const [defaultDir, setDefaultDir] = useState<string>("");
  const [cookies, setCookies] = useState<string>(localStorage.getItem("riptune_cookies") || "");
  const [deleteFilesOnHistoryDelete, setDeleteFilesOnHistoryDelete] = useState<boolean>(() => {
    const saved = localStorage.getItem("riptune_delete_files_on_history_delete");
    return saved === null ? true : saved === "true";
  });

  const [playlistProgress, setPlaylistProgress] = useState<PlaylistProgress | null>(null);

  // Persistance & Load
  useEffect(() => { localStorage.setItem("riptune_lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("riptune_delete_files_on_history_delete", deleteFilesOnHistoryDelete.toString()); }, [deleteFilesOnHistoryDelete]);
  useEffect(() => {
    if (customDir) localStorage.setItem("riptune_download_dir", customDir);
    else localStorage.removeItem("riptune_download_dir");
  }, [customDir]);
  useEffect(() => { localStorage.setItem("riptune_cookies", cookies); }, [cookies]);

  const saveHistory = (newHistory: HistoryEntry[]) => {
    setHistory(newHistory);
    localStorage.setItem("riptune_history", JSON.stringify(newHistory));
  };

  const handleDeleteHistoryItem = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleOpenFile = async (filepath: string) => {
    try { await invoke("open_file", { filepath }); }
    catch (error) { console.error("Failed to open file", error); }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === "all") {
      if (deleteFilesOnHistoryDelete) {
        for (const item of history) {
          if (!item.isTemp && item.filepath) {
            try {
              await invoke("delete_file", { filepath: item.filepath });
            } catch (e) {
              console.error("Failed to delete physical file", e);
            }
          }
        }
      }
      saveHistory([]);
      setLatest(null);
      setDeleteConfirmId(null);
      addNotification(t.notifications.historyCleared || "History cleared", "success");
      return;
    }

    if (deleteConfirmId) {
      const item = history.find(h => h.id === deleteConfirmId);
      if (item && deleteFilesOnHistoryDelete && item.filepath) {
        try {
          await invoke("delete_file", { filepath: item.filepath });
        } catch (e) {
          console.error("Failed to delete physical file", e);
        }
      }
      const newHistory = history.filter(item => item.id !== deleteConfirmId);
      if (deleteConfirmId === latest?.id) {
        setLatest(null);
      }
      saveHistory(newHistory);
      setDeleteConfirmId(null);
      addNotification(t.notifications.trackRemoved, "success");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("riptune_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        const latestAnalyzed = parsed.find((item: HistoryEntry) => item.bpm !== undefined);
        if (latestAnalyzed) setLatest(latestAnalyzed);
      } catch (e) { console.error("Failed to parse history"); }
    }

    const fetchDefaultDir = async () => {
      try { setDefaultDir(await invoke<string>("get_default_download_dir")); }
      catch (e) { console.error("Failed to fetch default download dir", e); }
    };
    fetchDefaultDir();
  }, []);

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab, loading, setLoading, dragActive, setDragActive,
      isPlaylist, setIsPlaylist,
      shouldDownload, setShouldDownload, autoAnalyze, setAutoAnalyze, downloadPlaylist, setDownloadPlaylist,
      lang, setLang, t, notifications, addNotification, removeNotification, clearNotificationsFor,
      history, setHistory, saveHistory, latest, setLatest, deleteConfirmId, setDeleteConfirmId,
      handleDeleteHistoryItem, confirmDelete, handleOpenFile,
      customDir, setCustomDir, defaultDir, setDefaultDir, cookies, setCookies, deleteFilesOnHistoryDelete, setDeleteFilesOnHistoryDelete,
      playlistProgress, setPlaylistProgress,
      loadingRef,
      url, setUrl, format, setFormat,
      isBugModalOpen, setIsBugModalOpen
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
