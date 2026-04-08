import { invoke } from "@tauri-apps/api/core";
import { HistoryEntry } from "../types";
import { useApp } from "../context/AppContext";
import { trackEvent } from "../utils/analytics";
import { analyzeAudioFile } from "../utils/essentia";

export function useAudioProcessor() {
  const { 
    history, saveHistory, setLatest, addNotification, clearNotificationsFor, setLoading, t 
  } = useApp();

  const processFile = async (filepath: string, titleHint?: string, artistHint?: string, isTemp: boolean = false) => {
    setLoading(true);
    addNotification(t.notifications.analyzing, "info", true);
    
    trackEvent("analysis_started");

    try {
      // Analyze file directly on the frontend using essentia-wasm
      const [bpmVal, keyStr] = await analyzeAudioFile(filepath);
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

      try {
        await invoke("update_metadata", { filepath, title, artist, bpm });
      } catch (e) {
        console.error("Failed to update file metadata:", e);
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
        isTemp
      };

      if (!isTemp) {
        const existingEntryIndex = history.findIndex(item => item.filepath === filepath);
        if (existingEntryIndex !== -1) {
          const updatedHistory = [...history];
          updatedHistory[existingEntryIndex] = {
            ...updatedHistory[existingEntryIndex],
            bpm,
            key: keyStr
          };
          saveHistory(updatedHistory);
          setLatest(updatedHistory[existingEntryIndex]);
        } else {
          saveHistory([entry, ...history]);
          setLatest(entry);
        }
      } else {
        // Still add to history for display, but it's temporary
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
