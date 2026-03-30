import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HistoryEntry, PlaylistProgress } from "../types";
import { useApp } from "../context/AppContext";
import { useAudioProcessor } from "./useAudioProcessor";

export function useDownloader() {
  const { 
    loadingRef, customDir, cookies, t, addNotification, clearNotificationsFor, 
    saveHistory, history, setLoading, setLatest,
    url, setUrl, format, downloadPlaylist, shouldDownload, autoAnalyze, isPlaylist
  } = useApp();

  const { processFile } = useAudioProcessor();

  const [playlistProgress, setPlaylistProgress] = useState<PlaylistProgress | null>(null);

  const handleDownload = async () => {
    if (!url) return;
    const isYoutube = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);
    if (!isYoutube) {
      addNotification(`${t.notifications.errorDownload}: Only YouTube links are supported.`, "error");
      return;
    }

    if (!shouldDownload && !autoAnalyze) {
      addNotification("Required: Please enable Download or Analyze to proceed.", "info");
      return;
    }

    setPlaylistProgress(null);
    setLoading(true);
    loadingRef.current = true;

    try {
      if (isPlaylist && downloadPlaylist) {
        addNotification(t.notifications.fetchingPlaylist, "info", true);
        try {
          const info = await invoke<{ count: number }>("check_url_info", { url, cookies });
          if (!loadingRef.current) {
            clearNotificationsFor(t.notifications.fetchingPlaylist);
            return;
          }
          setPlaylistProgress({ current: 0, total: info.count });
          clearNotificationsFor(t.notifications.fetchingPlaylist);
        } catch (e) {
          console.error("Failed to fetch playlist info", e);
        }
      }

      if (!loadingRef.current) {
        clearNotificationsFor(t.notifications.fetchingPlaylist);
        return;
      }

      addNotification(t.notifications.downloading, "info", true);
      const result = await invoke<{ filepath: string, title: string, artist: string }>("download_audio", {
        url,
        format,
        customPath: !shouldDownload ? "TMP_ANALYSIS" : customDir,
        cookies,
        downloadPlaylist
      });

      clearNotificationsFor(t.notifications.downloading);

      if (autoAnalyze) {
        await processFile(result.filepath, result.title, result.artist);
        if (!shouldDownload) {
          try {
            await invoke("delete_file", { filepath: result.filepath });
          } catch(e) {
            console.error("Failed to delete temp analysis file", e);
          }
        }
      } else if (shouldDownload) {
        const newEntry: HistoryEntry = {
          id: crypto.randomUUID(),
          title: result.title,
          artist: result.artist,
          filepath: result.filepath,
          date: new Date().toISOString()
        };
        saveHistory([newEntry, ...history]);
        setLatest(newEntry);
        setPlaylistProgress(null);
        addNotification(t.notifications.downloadComplete, "success");
        loadingRef.current = false;
        setLoading(false);
      }
      setUrl("");
    } catch (error: any) {
      console.error(error);
      const isCancel = error?.toString()?.includes("Cancelled");
      clearNotificationsFor(t.notifications.downloading);
      clearNotificationsFor(t.notifications.fetchingPlaylist);
      clearNotificationsFor(t.notifications.cancelling);
      addNotification(isCancel ? t.notifications.downloadCancelled : `${t.notifications.errorDownload}: ${error}`, isCancel ? 'info' : 'error');
      loadingRef.current = false;
      setLoading(false);
      setPlaylistProgress(null);
    }
  };

  const handleCancelDownload = async () => {
    loadingRef.current = false;
    setLoading(false);
    setPlaylistProgress(null);
    clearNotificationsFor(t.notifications.downloading);
    clearNotificationsFor(t.notifications.fetchingPlaylist);
    addNotification(t.notifications.cancelling, "info");
    try {
      await invoke("cancel_download");
    } catch (e) {
      console.error("Cancel failed", e);
    }
  };

  return { handleDownload, handleCancelDownload, playlistProgress, setPlaylistProgress };
}
