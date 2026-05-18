import { invoke } from "@tauri-apps/api/core";
import {
  useConfigContext,
  useHistoryContext,
  useNotificationsContext,
  useUIContext,
} from "../context/AppContext";
import type { HistoryEntry } from "../types";
import { trackEvent } from "../utils/analytics";
import { useAudioProcessor } from "./useAudioProcessor";

export function useDownloader() {
  const {
    url,
    setUrl,
    format,
    isPlaylist,
    setPlaylistProgress,
    addActiveTask,
    removeActiveTask,
    isTaskActive,
    t,
  } = useUIContext();

  const { customDir, cookies, downloadPlaylist, shouldDownload, autoAnalyze } =
    useConfigContext();

  const { addNotification, clearNotificationsFor } = useNotificationsContext();

  const { updateHistory, setLatest, setLatestPlaylist } = useHistoryContext();

  const { processFile } = useAudioProcessor();

  const handleDownload = async (
    overrideUrl?: string,
    overrideShouldDownload?: boolean,
    overrideAutoAnalyze?: boolean,
    overrideId?: string,
  ) => {
    // Ensure we only use overrideUrl if it's actually a string (not an Event)
    const validOverrideUrl =
      typeof overrideUrl === "string" ? overrideUrl : undefined;
    const targetUrl = (validOverrideUrl || url).trim();
    const targetShouldDownload =
      overrideShouldDownload !== undefined
        ? overrideShouldDownload
        : shouldDownload;
    const targetAutoAnalyze =
      overrideAutoAnalyze !== undefined ? overrideAutoAnalyze : autoAnalyze;

    if (!targetUrl) return;
    const youtubeRegex =
      /^(https?:\/\/)?([a-z0-9-]+\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/.+$/i;
    const soundcloudRegex =
      /^(https?:\/\/)?(www\.)?(on\.)?soundcloud\.com\/.+$/i;
    const isValid =
      youtubeRegex.test(targetUrl) || soundcloudRegex.test(targetUrl);

    if (!isValid) {
      addNotification(
        `${t.notifications.errorDownload}: ${t.home.invalidUrl}`,
        "error",
      );
      return;
    }

    if (!targetShouldDownload && !targetAutoAnalyze) {
      addNotification(
        "Required: Please enable Download or Analyze to proceed.",
        "info",
      );
      return;
    }

    const taskId = overrideId || crypto.randomUUID();
    setPlaylistProgress(null);
    addActiveTask(taskId, "download");

    try {
      let playlistTitle: string | undefined;
      if (isPlaylist && downloadPlaylist) {
        addNotification(t.notifications.fetchingPlaylist, "info", true);
        try {
          const info = await invoke<{ count: number; title: string }>(
            "check_url_info",
            { url: targetUrl, cookies },
          );
          playlistTitle = info.title;
          if (!isTaskActive(taskId)) {
            clearNotificationsFor(t.notifications.fetchingPlaylist);
            return;
          }
          setPlaylistProgress({ current: 0, total: info.count });
          clearNotificationsFor(t.notifications.fetchingPlaylist);
        } catch (e) {
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
            "error",
          );
          return; // Stop — don't attempt to download a broken playlist
        }
      }

      if (!isTaskActive(taskId)) {
        clearNotificationsFor(t.notifications.fetchingPlaylist);
        return;
      }

      trackEvent("download_started", {
        format,
        downloadPlaylist: downloadPlaylist ? 1 : 0,
      });

      addNotification(t.notifications.downloading, "info", true);
      const response = await invoke<{ results: any[]; playlist_dir?: string }>(
        "download_audio",
        {
          args: {
            url: targetUrl,
            format,
            customPath: !targetShouldDownload ? "TMP_ANALYSIS" : customDir,
            cookies,
            downloadPlaylist,
            playlistTitle,
            taskId,
          },
        },
      );

      const results = response.results;

      clearNotificationsFor(t.notifications.downloading);

      if (targetAutoAnalyze) {
        if (downloadPlaylist) {
          addNotification(t.notifications.analyzing, "info", true);
        }
        let analyzedCount = 0;
        for (const res of results) {
          if (downloadPlaylist) {
            setPlaylistProgress({
              current: analyzedCount + 1,
              total: results.length,
            });
          }
          await processFile(
            res.filepath,
            res.title,
            res.artist,
            !targetShouldDownload,
            res.url,
            undefined,
            downloadPlaylist,
            res.description,
          );
          analyzedCount++;
          if (!targetShouldDownload) {
            try {
              await invoke("delete_file", { filepath: res.filepath });
            } catch (e) {
              console.error("Failed to delete temp analysis file", e);
            }
          }
        }
        if (downloadPlaylist) {
          clearNotificationsFor(t.notifications.analyzing);
        }
      } else if (targetShouldDownload) {
        let latestEntry: HistoryEntry | null = null;

        updateHistory((prev) => {
          let updatedHistory = [...prev];
          for (const res of results) {
            const displayTitle = res.title;
            const displayArtist = res.artist;

            const existingEntryIndex = updatedHistory.findIndex((item) =>
              overrideId ? item.id === overrideId : item.url === res.url,
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
                isTemp: false,
              };
              updatedHistory.splice(existingEntryIndex, 1);
              updatedHistory.unshift(updatedEntry);
              latestEntry = updatedEntry;
            } else {
              const newEntry: HistoryEntry = {
                id: crypto.randomUUID(),
                title: displayTitle,
                artist: displayArtist,
                filepath: res.filepath,
                date: new Date().toISOString(),
                url: res.url,
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
                  key: key,
                }).catch((e) =>
                  console.error("Failed to write metadata during download", e),
                );
              } catch (e) {
                console.error("Failed to write metadata during download", e);
              }
            }
          }
          return updatedHistory;
        });

        if (latestEntry && !downloadPlaylist) setLatest(latestEntry);
      }

      setPlaylistProgress(null);
      if (downloadPlaylist && results.length > 0) {
        addNotification(t.notifications.downloadComplete, "success");
      }

      if (response.playlist_dir && playlistTitle) {
        setLatestPlaylist({
          title: playlistTitle,
          filepath: response.playlist_dir,
        });
      } else {
        setLatestPlaylist(null);
      }

      setUrl("");
    } catch (error) {
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
        isCancel ? "info" : "error",
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
