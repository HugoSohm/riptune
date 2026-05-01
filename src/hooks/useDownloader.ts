import { invoke } from "@tauri-apps/api/core";
import { HistoryEntry } from "../types";
import { useApp } from "../context/useApp";
import { useAudioProcessor } from "./useAudioProcessor";
import { trackEvent } from "../utils/analytics";

export function useDownloader() {
  const {
    addActiveTask, removeActiveTask, isTaskActive,
    customDir, cookies, t, addNotification, clearNotificationsFor,
    updateHistory, setLatest,
    url, setUrl, format, downloadPlaylist, shouldDownload, autoAnalyze, isPlaylist,
    setPlaylistProgress
  } = useApp();

  const { processFile } = useAudioProcessor();

  const handleDownload = async (overrideUrl?: string, overrideShouldDownload?: boolean, overrideAutoAnalyze?: boolean, overrideId?: string) => {
    // Ensure we only use overrideUrl if it's actually a string (not an Event)
    const validOverrideUrl = typeof overrideUrl === "string" ? overrideUrl : undefined;
    const targetUrl = (validOverrideUrl || url).trim();
    const targetShouldDownload = overrideShouldDownload !== undefined ? overrideShouldDownload : shouldDownload;
    const targetAutoAnalyze = overrideAutoAnalyze !== undefined ? overrideAutoAnalyze : autoAnalyze;

    if (!targetUrl) return;
    const youtubeRegex = /^(https?:\/\/)?([a-z0-9-]+\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/.+$/i;
    const soundcloudRegex = /^(https?:\/\/)?(www\.)?(on\.)?soundcloud\.com\/.+$/i;
    const isValid = youtubeRegex.test(targetUrl) || soundcloudRegex.test(targetUrl);

    if (!isValid) {
      addNotification(`${t.notifications.errorDownload}: ${t.home.invalidUrl}`, "error");
      return;
    }

    if (!targetShouldDownload && !targetAutoAnalyze) {
      addNotification("Required: Please enable Download or Analyze to proceed.", "info");
      return;
    }

    const taskId = overrideId || crypto.randomUUID();
    setPlaylistProgress(null);
    addActiveTask(taskId, 'download');

    try {
      if (isPlaylist && downloadPlaylist) {
        addNotification(t.notifications.fetchingPlaylist, "info", true);
        try {
          const info = await invoke<{ count: number }>("check_url_info", { url: targetUrl, cookies });
          if (!isTaskActive(taskId)) {
            clearNotificationsFor(t.notifications.fetchingPlaylist);
            return;
          }
          setPlaylistProgress({ current: 0, total: info.count });
          clearNotificationsFor(t.notifications.fetchingPlaylist);
        } catch (e: any) {
          clearNotificationsFor(t.notifications.fetchingPlaylist);
          const errStr = e?.toString() || "";
          // Detect private or non-existent playlist
          const isPlaylistNotFound =
            errStr.includes("PLAYLIST_NOT_FOUND") ||
            errStr.includes("does not exist") ||
            errStr.includes("YouTube said") ||
            errStr.includes("Private") ||
            errStr.includes("private") ||
            errStr.includes("not available") ||
            (errStr.includes("The playlist") && errStr.includes("ERROR"));
          addNotification(
            isPlaylistNotFound
              ? t.notifications.errorPlaylistNotFound
              : `${t.notifications.errorDownload}: ${errStr}`,
            "error"
          );
          return; // Stop — don't attempt to download a broken playlist
        }
      }

      if (!isTaskActive(taskId)) {
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
        downloadPlaylist,
        taskId
      });

      clearNotificationsFor(t.notifications.downloading);

      if (targetAutoAnalyze) {
        for (const res of results) {
          await processFile(res.filepath, res.title, res.artist, !targetShouldDownload, res.url);
          if (!targetShouldDownload) {
            try {
              await invoke("delete_file", { filepath: res.filepath });
            } catch (e) {
              console.error("Failed to delete temp analysis file", e);
            }
          }
        }
      } else if (targetShouldDownload) {
        let latestEntry: HistoryEntry | null = null;

        updateHistory(prev => {
          let updatedHistory = [...prev];
          for (const res of results) {
          let displayTitle = res.title;
          let displayArtist = res.artist;

            const existingEntryIndex = updatedHistory.findIndex(item =>
              (overrideId ? item.id === overrideId : item.url === res.url) && item.isTemp
            );

            let bpm = 0.0;
            let key = "";

            if (existingEntryIndex !== -1) {
              const oldEntry = updatedHistory[existingEntryIndex];
              bpm = oldEntry.bpm || 0.0;
              key = oldEntry.key || "";
              
              const updatedEntry: HistoryEntry = {
                ...oldEntry,
                filepath: res.filepath,
                title: displayTitle,
                artist: displayArtist,
                date: new Date().toISOString(),
                isTemp: false
              };
              updatedHistory[existingEntryIndex] = updatedEntry;
              latestEntry = updatedEntry;
            } else {
              const newEntry: HistoryEntry = {
                id: crypto.randomUUID(),
                title: displayTitle,
                artist: displayArtist,
                filepath: res.filepath,
                date: new Date().toISOString(),
                url: res.url
              };
              updatedHistory = [newEntry, ...updatedHistory];
              latestEntry = newEntry;
            }

            // Write metadata to the file (Title, Artist, and analysis if available)
            if (targetShouldDownload) {
              try {
                invoke("update_metadata", {
                  filepath: res.filepath,
                  title: displayTitle,
                  artist: displayArtist,
                  bpm: bpm,
                  key: key
                }).catch(e => console.error("Failed to write metadata during download", e));
              } catch (e) {
                console.error("Failed to write metadata during download", e);
              }
            }
          }
          return updatedHistory;
        });

        if (latestEntry) setLatest(latestEntry);
        setPlaylistProgress(null);
        addNotification(t.notifications.downloadComplete, "success");
      }
      setUrl("");
    } catch (error: any) {
      console.error(error);
      const errStr = error?.toString() || "";
      const isCancel = errStr.includes("Cancelled");
      const isPlaylistNotFound =
        errStr.includes("PLAYLIST_NOT_FOUND") ||
        errStr.includes("does not exist") ||
        errStr.includes("Private") ||
        errStr.includes("private") ||
        errStr.includes("not available");
      clearNotificationsFor(t.notifications.downloading);
      clearNotificationsFor(t.notifications.fetchingPlaylist);
      clearNotificationsFor(t.notifications.cancelling);
      addNotification(
        isCancel
          ? t.notifications.downloadCancelled
          : isPlaylistNotFound
            ? t.notifications.errorPlaylistNotFound
            : `${t.notifications.errorDownload}: ${error}`,
        isCancel ? 'info' : 'error'
      );
      setPlaylistProgress(null);
    } finally {
      removeActiveTask(taskId);
    }
  };

  const handleCancelDownload = async (taskId?: string) => {
    if (taskId) {
      removeActiveTask(taskId);
    }
    setPlaylistProgress(null);
    clearNotificationsFor(t.notifications.downloading);
    clearNotificationsFor(t.notifications.fetchingPlaylist);
    addNotification(t.notifications.cancelling, "info");
    try {
      await invoke("cancel_download", { taskId: taskId ?? null });
    } catch (e) {
      console.error("Cancel failed", e);
    }
  };

  return { handleDownload, handleCancelDownload, setPlaylistProgress };
}
