import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect } from "react";
import { useApp } from "../context/useApp";

import { useAudioProcessor } from "./useAudioProcessor";
import { useDownloader } from "./useDownloader";

export function useRipTune() {
  const app = useApp();

  const {
    url,
    customDir,
    defaultDir,
    t,
    setDefaultDir,
    setPlaylistProgress,
    setIsPlaylist,
    setDownloadPlaylist,
    setCustomDir,
    setLatest,
    addNotification,
  } = app;

  // Modules
  const { processFile } = useAudioProcessor();
  const { handleDownload, handleCancelDownload } = useDownloader();

  // Initial Load & Event Listeners
  useEffect(() => {
    const fetchDefaultDir = async () => {
      try {
        setDefaultDir(await invoke<string>("get_default_download_dir"));
      } catch (e) {
        console.error("Failed to fetch default download dir", e);
      }
    };
    fetchDefaultDir();

    const unlistenProgress = listen<{
      current: number;
      total: number;
      title: string;
    }>("download-progress", (event) => {
      setPlaylistProgress((prev) => ({
        current: event.payload.current,
        total: event.payload.total > 0 ? event.payload.total : prev?.total || 0,
      }));
    });

    return () => {
      unlistenProgress.then((f) => f());
    };
  }, [setPlaylistProgress, setDefaultDir]);

  // Responsive UI States
  useEffect(() => {
    if (url.includes("list=") || url.includes("/sets/")) {
      setIsPlaylist(true);
    } else {
      setIsPlaylist(false);
      setDownloadPlaylist(false);
    }
  }, [url, setIsPlaylist, setDownloadPlaylist]);

  const handleSelectDir = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string") setCustomDir(selected);
    } catch (error) {
      console.error("Failed to open directory dialog", error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await invoke("open_folder", { path: customDir || defaultDir });
    } catch (error) {
      console.error("Failed to open folder", error);
    }
  };

  const handleOpenFile = async (filepath: string) => {
    try {
      await invoke("open_file", { filepath });
    } catch (error) {
      console.error("Failed to open file", error);
    }
  };

  const handleResetCurrent = () => {
    setLatest(null);
    addNotification(t.notifications.currentCleared, "info");
  };

  return {
    ...app,
    processFile,
    handleDownload,
    handleCancelDownload,
    handleSelectDir,
    handleOpenFolder,
    handleOpenFile,
    handleResetCurrent,
  };
}
