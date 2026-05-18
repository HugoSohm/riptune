import { invoke } from "@tauri-apps/api/core";
import { HistoryEntry } from "../types";
import { useApp } from "../context/useApp";
import { trackEvent } from "../utils/analytics";
import { analyzeAudioFile } from "../utils/essentia";

export function extractMetadataFromDescription(description?: string): { bpm?: number; key?: string } {
  let bpm: number | undefined;
  let key: string | undefined;

  if (description) {
    const bpmMatch = description.match(/(?:^|\s)(1?\d{2}|2\d{2})\s*bpm\b/i);
    if (bpmMatch) {
      bpm = parseInt(bpmMatch[1], 10);
    }

    const keyMatch = description.match(/(?:^|\s)([a-g][#b]?\s*(?:major|minor|maj|min|m))\b/i);
    if (keyMatch) {
      let k = keyMatch[1].toLowerCase().trim();
      let root = k.match(/^[a-g][#b]?/i)?.[0].toUpperCase();
      if (root) {
        if (root.length > 1) {
          root = root[0] + root[1].toLowerCase();
        }
        const isMinor = /minor|min|m/.test(k);
        key = `${root} ${isMinor ? 'min' : 'maj'}`;
      }
    }
  }

  return { bpm, key };
}

export async function resolveMetadata(
  filepath: string,
  partialAnalysis: boolean,
  isTemp: boolean,
  titleHint?: string,
  artistHint?: string,
  description?: string
) {
  let bpmVal = 0;
  let keyStr = "";
  let bpmConfidence = 0;
  let keyStrength = 0;
  let fromYoutubeDesc = false;

  const { bpm: descBpm, key: descKey } = extractMetadataFromDescription(description);

  if (descBpm && descKey) {
    bpmVal = descBpm;
    keyStr = descKey;
    fromYoutubeDesc = true;
  } else {
    const [eBpm, eKeyStr, eBpmConf, eKeyConf] = await analyzeAudioFile(filepath, !partialAnalysis);
    bpmVal = descBpm || eBpm;
    keyStr = descKey || eKeyStr;
    bpmConfidence = eBpmConf;
    keyStrength = eKeyConf;
    if (descBpm || descKey) fromYoutubeDesc = true;
  }
  
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

  return {
    bpm,
    keyStr,
    bpmConfidence,
    keyStrength,
    fromYoutubeDesc,
    title,
    artist
  };
}

export function useAudioProcessor() {
  const {
    updateHistory, setLatest, addNotification, removeNotification,
    addActiveTask, removeActiveTask, t, partialAnalysis
  } = useApp();

  const processFile = async (filepath: string, titleHint?: string, artistHint?: string, isTemp: boolean = false, url?: string, id?: string, isPlaylist?: boolean, description?: string) => {
    const taskId = id || crypto.randomUUID();
    addActiveTask(taskId, 'analysis');
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
        title,
        artist
      } = await resolveMetadata(filepath, partialAnalysis, isTemp, titleHint, artistHint, description);

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
            bpmConfidence,
            keyStrength,
            title: title || oldEntry.title,
            artist: artist || oldEntry.artist,
            filepath: isTemp ? oldEntry.filepath : filepath,
            isTemp: isTemp ? oldEntry.isTemp : false,
            url: url || oldEntry.url,
            fromYoutubeDesc,
            date: new Date().toISOString()
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
            fromYoutubeDesc
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
    } catch (error: any) {
      console.error(error);
      if (notifId) removeNotification(notifId);
      const isNotFound = error?.toString()?.includes("No such file") || error?.toString()?.includes("not found");
      addNotification(isNotFound ? t.notifications.errorNotFound : `${t.notifications.errorAnalysis}: ${error}`, "error");
    } finally {
      removeActiveTask(taskId);
    }
  };

  return { processFile };
}
