import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { useApp } from "../context/AppContext";

import { useNotifications } from "./useNotifications";
import { useHistory } from "./useHistory";
import { useAudioProcessor } from "./useAudioProcessor";
import { useDownloader } from "./useDownloader";

export function useRipTune() {
  const {
    url, setUrl, format, setFormat, loading, dragActive, setDragActive,
    customDir, setCustomDir, autoAnalyze, setAutoAnalyze, activeTab, setActiveTab,
    isPlaylist, setIsPlaylist, downloadPlaylist, setDownloadPlaylist,
    shouldDownload, setShouldDownload, cookies, setCookies, defaultDir, setDefaultDir,
    keepFilesOnHistoryDelete, setKeepFilesOnHistoryDelete, lang, setLang, t,
    history, latest, setLatest, deleteConfirmId, setDeleteConfirmId, setPlaylistProgress
  } = useApp();

  // Modules (now using context internally)
  const { notifications, removeNotification, addNotification } = useNotifications();
  const { handleDeleteHistoryItem: handleHistoryDelete, confirmDelete: historyConfirmDelete } = useHistory();
  const { processFile } = useAudioProcessor();
  const { handleDownload, handleCancelDownload, playlistProgress } = useDownloader();

  // Initial Load & Event Listeners
  useEffect(() => {
    const fetchDefaultDir = async () => {
      try { setDefaultDir(await invoke<string>("get_default_download_dir")); }
      catch (e) { console.error("Failed to fetch default download dir", e); }
    };
    fetchDefaultDir();

    const unlistenDrop = listen<{ paths: string[] }>("tauri://drag-drop", (event) => {
      setDragActive(false);
      const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma'];
      if (event.payload.paths?.length > 0) {
        const path = event.payload.paths[0];
        if (audioExtensions.some(ext => path.toLowerCase().endsWith(ext))) {
          setActiveTab("home");
          processFile(path);
        } else addNotification(t.notifications.errorNotFound, "error");
      }
    });

    const unlistenDragEnter = listen("tauri://drag-enter", () => setDragActive(true));
    const unlistenDragLeave = listen("tauri://drag-leave", () => setDragActive(false));
    const unlistenProgress = listen<{ current: number, total: number, title: string }>("download-progress", (event) => {
      setPlaylistProgress({ current: event.payload.current, total: event.payload.total });
    });

    return () => {
      unlistenDrop.then((f) => f()); unlistenDragEnter.then((f) => f());
      unlistenDragLeave.then((f) => f()); unlistenProgress.then((f) => f());
    };
  }, [t, addNotification, processFile, setActiveTab, setDragActive, setPlaylistProgress]);

  // Responsive UI States
  useEffect(() => {
    if (url.includes("list=")) { setIsPlaylist(true); }
    else { setIsPlaylist(false); setDownloadPlaylist(false); }
  }, [url, setIsPlaylist, setDownloadPlaylist]);

  useEffect(() => { if (downloadPlaylist) setAutoAnalyze(false); }, [downloadPlaylist, setAutoAnalyze]);

  const handleSelectDir = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') setCustomDir(selected);
    } catch (error) { console.error("Failed to open directory dialog", error); }
  };

  const handleOpenFolder = async () => {
    try { await invoke("open_folder", { path: customDir || defaultDir }); }
    catch (error) { console.error("Failed to open folder", error); }
  };

  const handleOpenFile = async (filepath: string) => {
    try { await invoke("open_file", { filepath }); }
    catch (error) { console.error("Failed to open file", error); }
  };

  const handleResetCurrent = () => {
    setLatest(null);
    addNotification(t.notifications.currentCleared, "info");
  };

  return {
    url, setUrl, format, setFormat, loading, notifications, dragActive,
    customDir, setCustomDir, autoAnalyze, setAutoAnalyze, activeTab, setActiveTab,
    latest, isPlaylist, playlistProgress, deleteConfirmId, setDeleteConfirmId,
    downloadPlaylist, setDownloadPlaylist, shouldDownload, setShouldDownload,
    history, cookies, setCookies, defaultDir, keepFilesOnHistoryDelete,
    setKeepFilesOnHistoryDelete, lang, setLang, t,
    removeNotification, processFile, handleDownload, handleCancelDownload,
    handleSelectDir, handleOpenFolder, handleOpenFile, handleResetCurrent,
    handleDeleteHistoryItem: handleHistoryDelete, confirmDelete: historyConfirmDelete
  };
}
