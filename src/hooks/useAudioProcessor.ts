import { invoke } from "@tauri-apps/api/core";
import { HistoryEntry } from "../types";
import { useApp } from "../context/AppContext";
import { trackEvent } from "../utils/analytics";
import { analyzeAudioFile } from "../utils/essentia";

export function useAudioProcessor() {
  const {
    history, saveHistory, setLatest, addNotification, clearNotificationsFor, setLoading, t, deepAnalysis
  } = useApp();

  const processFile = async (filepath: string, titleHint?: string, artistHint?: string, isTemp: boolean = false, url?: string) => {
    setLoading(true);
    addNotification(t.notifications.analyzing, "info", true);

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

      clearNotificationsFor(t.notifications.analyzing);

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        title,
        artist,
        filepath,
        bpm,
        key: keyStr,
        date: new Date().toISOString(),
        isTemp,
        url
      };

      // Check if we should update an existing entry
      // Search by filepath first across the whole array
      let existingEntryIndex = history.findIndex(item => item.filepath === filepath);

      // If we didn't find by filepath, then try finding by URL
      if (existingEntryIndex === -1 && url) {
        existingEntryIndex = history.findIndex(item => item.url === url);
      }

      if (existingEntryIndex !== -1) {
        const updatedHistory = [...history];
        const oldEntry = updatedHistory[existingEntryIndex];

        // If we are upgrading from temp to permanent, or just updating analysis
        const updatedEntry: HistoryEntry = {
          ...oldEntry,
          bpm,
          key: keyStr,
          title: title || oldEntry.title,
          artist: artist || oldEntry.artist,
          filepath: isTemp ? oldEntry.filepath : filepath,
          isTemp: isTemp ? oldEntry.isTemp : false, // once it's permanent, it stays permanent
          url: url || oldEntry.url,
          date: new Date().toISOString() // refresh date to bring to top? Or keep old? Let's refresh.
        };

        updatedHistory[existingEntryIndex] = updatedEntry;
        saveHistory(updatedHistory);
        setLatest(updatedEntry);
      } else {
        saveHistory([entry, ...history]);
        setLatest(entry);
      }

      addNotification(t.notifications.analysisComplete, "success");
    } catch (error: any) {
      console.error(error);
      clearNotificationsFor(t.notifications.analyzing);
      const isNotFound = error?.toString()?.includes("No such file") || error?.toString()?.includes("not found");
      addNotification(isNotFound ? t.notifications.errorNotFound : `${t.notifications.errorAnalysis}: ${error}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return { processFile };
}
