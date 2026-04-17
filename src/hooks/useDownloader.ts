import { invoke } from "@tauri-apps/api/core";
import { HistoryEntry } from "../types";
import { useApp } from "../context/AppContext";
import { useAudioProcessor } from "./useAudioProcessor";
import { trackEvent } from "../utils/analytics";

export function useDownloader() {
  const { 
    loadingRef, customDir, cookies, t, addNotification, clearNotificationsFor, 
    saveHistory, history, setLoading, setLatest,
    url, setUrl, format, downloadPlaylist, shouldDownload, autoAnalyze, isPlaylist,
    playlistProgress, setPlaylistProgress
  } = useApp();

  const { processFile } = useAudioProcessor();

  const handleDownload = async (overrideUrl?: string, overrideShouldDownload?: boolean, overrideAutoAnalyze?: boolean, overrideId?: string) => {
    // Ensure we only use overrideUrl if it's actually a string (not an Event)
    const validOverrideUrl = typeof overrideUrl === "string" ? overrideUrl : undefined;
    const targetUrl = (validOverrideUrl || url).trim();
    const targetShouldDownload = overrideShouldDownload !== undefined ? overrideShouldDownload : shouldDownload;
    const targetAutoAnalyze = overrideAutoAnalyze !== undefined ? overrideAutoAnalyze : autoAnalyze;
    
    if (!targetUrl) return;
    const isYoutube = /^(https?:\/\/)?([a-z0-9-]+\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/.+$/i.test(targetUrl);
    if (!isYoutube) {
      addNotification(`${t.notifications.errorDownload}: Only YouTube links are supported.`, "error");
      return;
    }

    if (!targetShouldDownload && !targetAutoAnalyze) {
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

      trackEvent("download_started", { format, downloadPlaylist: downloadPlaylist ? 1 : 0 });

      addNotification(t.notifications.downloading, "info", true);
      const results = await invoke<{ filepath: string, title: string, artist: string, url: string }[]>("download_audio", {
        url: targetUrl,
        format,
        customPath: !targetShouldDownload ? "TMP_ANALYSIS" : customDir,
        cookies,
        downloadPlaylist
      });

      clearNotificationsFor(t.notifications.downloading);

      if (targetAutoAnalyze) {
        for (const res of results) {
          await processFile(res.filepath, res.title, res.artist, !targetShouldDownload, res.url);
          if (!targetShouldDownload) {
            try {
              await invoke("delete_file", { filepath: res.filepath });
            } catch(e) {
              console.error("Failed to delete temp analysis file", e);
            }
          }
        }
      } else if (targetShouldDownload) {
        let updatedHistory = [...history];
        let latestEntry = null;

        for (const res of results) {
          const existingEntryIndex = updatedHistory.findIndex(item => 
            (overrideId ? item.id === overrideId : item.url === res.url) && item.isTemp
          );
          
          if (existingEntryIndex !== -1) {
            const oldEntry = updatedHistory[existingEntryIndex];
            const updatedEntry: HistoryEntry = {
              ...oldEntry,
              filepath: res.filepath,
              title: res.title,
              artist: res.artist,
              date: new Date().toISOString(),
              isTemp: false
            };
            updatedHistory[existingEntryIndex] = updatedEntry;
            latestEntry = updatedEntry;
          } else {
            const newEntry: HistoryEntry = {
              id: crypto.randomUUID(),
              title: res.title,
              artist: res.artist,
              filepath: res.filepath,
              date: new Date().toISOString(),
              url: res.url
            };
            updatedHistory = [newEntry, ...updatedHistory];
            latestEntry = newEntry;
          }
        }
        
        saveHistory(updatedHistory);
        if (latestEntry) setLatest(latestEntry);
        
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
