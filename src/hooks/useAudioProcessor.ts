import { invoke } from "@tauri-apps/api/core";
import {
  useConfigContext,
  useHistoryContext,
  useNotificationsContext,
  useUIContext,
} from "../context/AppContext";
import type { HistoryEntry } from "../types";
import { trackEvent } from "../utils/analytics";

import { resolveMetadata } from "../utils/metadataResolver";

export function useAudioProcessor() {
  const { addActiveTask, removeActiveTask, t } = useUIContext();
  const { partialAnalysis } = useConfigContext();
  const { addNotification, removeNotification } = useNotificationsContext();
  const { updateHistory, setLatest } = useHistoryContext();

  const processFile = async (
    filepath: string,
    titleHint?: string,
    artistHint?: string,
    isTemp: boolean = false,
    url?: string,
    id?: string,
    isPlaylist?: boolean,
    description?: string,
  ) => {
    const taskId = id || crypto.randomUUID();
    addActiveTask(taskId, "analysis");
    let notifId: string | undefined;
    if (!isPlaylist) {
      notifId = addNotification(t.notifications.analyzing, "info", true);
    }

    trackEvent("analysis_started");

    try {
      const {
        bpm,
        keyStr,
        bpmConfidence,
        keyStrength,
        fromYoutubeDesc,
        bpmFromYoutube,
        keyFromYoutube,
        title,
        artist,
      } = await resolveMetadata(
        filepath,
        partialAnalysis,
        isTemp,
        titleHint,
        artistHint,
        description,
      );

      if (!isPlaylist && notifId) {
        removeNotification(notifId);
      }

      if (url) {
        try {
          await invoke("report_analysis_result", { url, bpm, key: keyStr });
        } catch (e) {
          console.error("Failed to report analysis result", e);
        }
      }

      // Use updateHistory (functional update) to avoid stale closure issues
      // when multiple analyses run concurrently — each sees the latest history state
      updateHistory((prev) => {
        // Search by filepath first, then by URL
        let existingEntryIndex = prev.findIndex(
          (item) => item.filepath === filepath,
        );
        if (existingEntryIndex === -1 && url) {
          existingEntryIndex = prev.findIndex((item) => item.url === url);
        }

        if (existingEntryIndex !== -1) {
          const updatedHistory = [...prev];
          const oldEntry = updatedHistory[existingEntryIndex];
          const updatedEntry: HistoryEntry = {
            ...oldEntry,
            bpm,
            key: keyStr,
            bpmConfidence,
            keyStrength,
            title: title || oldEntry.title,
            artist: artist || oldEntry.artist,
            filepath: isTemp ? oldEntry.filepath : filepath,
            isTemp: isTemp ? oldEntry.isTemp : false,
            url: url || oldEntry.url,
            fromYoutubeDesc,
            bpmFromYoutube,
            keyFromYoutube,
            date: new Date().toISOString(),
          };
          updatedHistory.splice(existingEntryIndex, 1);
          updatedHistory.unshift(updatedEntry);
          if (!isPlaylist) {
            setLatest(updatedEntry);
          }
          return updatedHistory;
        } else {
          const entry: HistoryEntry = {
            id: id || crypto.randomUUID(),
            title: title || "Unknown Audio",
            artist: artist || "Unknown Artist",
            filepath,
            bpm,
            key: keyStr,
            bpmConfidence,
            keyStrength,
            date: new Date().toISOString(),
            isTemp,
            url,
            fromYoutubeDesc,
            bpmFromYoutube,
            keyFromYoutube,
          };
          if (!isPlaylist) {
            setLatest(entry);
          }
          return [entry, ...prev];
        }
      });

      if (!isPlaylist) {
        addNotification(t.notifications.analysisComplete, "success");
      }
    } catch (error) {
      console.error(error);
      if (notifId) removeNotification(notifId);
      const isNotFound =
        error?.toString()?.includes("No such file") ||
        error?.toString()?.includes("not found");
      addNotification(
        isNotFound
          ? t.notifications.errorNotFound
          : `${t.notifications.errorAnalysis}: ${error}`,
        "error",
      );
    } finally {
      removeActiveTask(taskId);
    }
  };

  return { processFile };
}
