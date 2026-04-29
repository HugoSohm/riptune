import { invoke } from "@tauri-apps/api/core";
import { HistoryEntry } from "../types";
import { useApp } from "../context/AppContext";
import { trackEvent } from "../utils/analytics";
import { analyzeAudioFile } from "../utils/essentia";

export function useAudioProcessor() {
  const {
    updateHistory, setLatest, addNotification, removeNotification,
    addActiveTask, removeActiveTask, t, deepAnalysis
  } = useApp();

  const processFile = async (filepath: string, titleHint?: string, artistHint?: string, isTemp: boolean = false, url?: string, id?: string) => {
    const taskId = id || crypto.randomUUID();
    addActiveTask(taskId, 'analysis');
    const notifId = addNotification(t.notifications.analyzing, "info", true);

    trackEvent("analysis_started");

    try {
      // Analyze file directly on the frontend using essentia-wasm
      const [bpmVal, keyStr] = await analyzeAudioFile(filepath, deepAnalysis);
      const bpm = Math.round(bpmVal);

      let title = titleHint;
      let artist = artistHint;

      if (!title || !artist || artist === "Unknown Artist") {
        const filename = filepath.split('\\').pop()?.split('/').pop()?.replace(/\.[^/.]+$/, "") || "";
        if (filename.includes(" - ")) {
          const parts = filename.split(" - ");
          const parsedArtist = parts[0].trim();
          const parsedTitle = parts.slice(1).join(" - ").trim();

          artist = artist === "Unknown Artist" || !artist ? parsedArtist : artist;
          title = !title ? parsedTitle : title;
        } else {
          title = title || filename || "Unknown Audio";
          artist = artist || "Unknown Artist";
        }
      }

      // Update metadata with results
      if (!isTemp) {
        try {
          // Convert UI format (A maj / A min) to DJ standard (A / Am) for ID3 tags
          const djKey = keyStr.replace(" maj", "").replace(" min", "m");

          await invoke("update_metadata", {
            filepath,
            title,
            artist,
            bpm,
            key: djKey
          });
        } catch (e) {
          console.error("Failed to update file metadata", e);
        }
      }

      removeNotification(notifId);

      if (url) {
        try {
          await invoke("report_analysis_result", { url, bpm, key: keyStr });
        } catch (e) {
          console.error("Failed to report analysis result", e);
        }
      }

      // Use updateHistory (functional update) to avoid stale closure issues
      // when multiple analyses run concurrently — each sees the latest history state
      updateHistory(prev => {
        // Search by filepath first, then by URL
        let existingEntryIndex = prev.findIndex(item => item.filepath === filepath);
        if (existingEntryIndex === -1 && url) {
          existingEntryIndex = prev.findIndex(item => item.url === url);
        }

        if (existingEntryIndex !== -1) {
          const updatedHistory = [...prev];
          const oldEntry = updatedHistory[existingEntryIndex];
          const updatedEntry: HistoryEntry = {
            ...oldEntry,
            bpm,
            key: keyStr,
            title: title || oldEntry.title,
            artist: artist || oldEntry.artist,
            filepath: isTemp ? oldEntry.filepath : filepath,
            isTemp: isTemp ? oldEntry.isTemp : false,
            url: url || oldEntry.url,
            date: new Date().toISOString()
          };
          updatedHistory[existingEntryIndex] = updatedEntry;
          setLatest(updatedEntry);
          return updatedHistory;
        } else {
          const entry: HistoryEntry = {
            id: id || crypto.randomUUID(),
            title: title || "Unknown Audio",
            artist: artist || "Unknown Artist",
            filepath,
            bpm,
            key: keyStr,
            date: new Date().toISOString(),
            isTemp,
            url
          };
          setLatest(entry);
          return [entry, ...prev];
        }
      });

      addNotification(t.notifications.analysisComplete, "success");
    } catch (error: any) {
      console.error(error);
      removeNotification(notifId);
      const isNotFound = error?.toString()?.includes("No such file") || error?.toString()?.includes("not found");
      addNotification(isNotFound ? t.notifications.errorNotFound : `${t.notifications.errorAnalysis}: ${error}`, "error");
    } finally {
      removeActiveTask(taskId);
    }
  };

  return { processFile };
}
