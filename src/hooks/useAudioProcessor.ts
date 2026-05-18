import { invoke } from "@tauri-apps/api/core";
import {
  useConfigContext,
  useHistoryContext,
  useNotificationsContext,
  useUIContext,
} from "../context/AppContext";
import type { HistoryEntry } from "../types";
import { trackEvent } from "../utils/analytics";
import { analyzeAudioFile } from "../utils/essentia";

export function extractMetadataFromDescription(description?: string): {
  bpm?: number;
  key?: string;
} {
  let bpm: number | undefined;
  let key: string | undefined;

  if (description) {
    // Transliterate Cyrillic homoglyphs for musical keys and flats (A, B, C, E, b)
    // often used by Eastern European / Russian producers on Cyrillic keyboard layouts
    const cleanDesc = description
      .replace(/\u0410/g, "A") // Cyrillic А
      .replace(/\u0430/g, "a") // Cyrillic а
      .replace(/\u0412/g, "B") // Cyrillic В
      .replace(/\u0421/g, "C") // Cyrillic С
      .replace(/\u0441/g, "c") // Cyrillic с
      .replace(/\u0415/g, "E") // Cyrillic Е
      .replace(/\u0435/g, "e") // Cyrillic е
      .replace(/\u042C/g, "b") // Cyrillic Ь
      .replace(/\u044C/g, "b"); // Cyrillic ь

    const bpmMatch = cleanDesc.match(/\b(1?\d{2}|2\d{2})\s*bpm\b/i);
    if (bpmMatch) {
      bpm = parseInt(bpmMatch[1], 10);
    }

    const keyMatch = cleanDesc.match(
      /\b([a-g][#b]?)\s*(major|minor|maj|min|m)\b/i,
    );
    if (keyMatch) {
      const rootPart = keyMatch[1];
      const suffixPart = keyMatch[2];

      let root = rootPart.toUpperCase();
      if (root.length > 1) {
        root = root[0] + root[1].toLowerCase();
      }

      let isMinor = false;
      if (/minor|min/i.test(suffixPart)) {
        isMinor = true;
      } else if (/major|maj/i.test(suffixPart)) {
        isMinor = false;
      } else if (suffixPart === "m") {
        isMinor = true;
      } else if (suffixPart === "M") {
        isMinor = false;
      }

      key = `${root} ${isMinor ? "min" : "maj"}`;
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
  description?: string,
) {
  let bpmVal = 0;
  let keyStr = "";
  let bpmConfidence = 0;
  let keyStrength = 0;

  const { bpm: descBpm, key: descKey } =
    extractMetadataFromDescription(description);

  const bpmFromYoutube = !!descBpm;
  const keyFromYoutube = !!descKey;
  const fromYoutubeDesc = bpmFromYoutube || keyFromYoutube;

  if (descBpm && descKey) {
    bpmVal = descBpm;
    keyStr = descKey;
  } else {
    const [eBpm, eKeyStr, eBpmConf, eKeyConf] = await analyzeAudioFile(
      filepath,
      !partialAnalysis,
    );
    bpmVal = descBpm || eBpm;
    keyStr = descKey || eKeyStr;
    bpmConfidence = eBpmConf;
    keyStrength = eKeyConf;
  }

  const bpm = Math.round(bpmVal);

  let title = titleHint;
  let artist = artistHint;

  if (!title || !artist || artist === "Unknown Artist") {
    const filename =
      filepath
        .split("\\")
        .pop()
        ?.split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "") || "";
    if (filename.includes(" - ")) {
      const parts = filename.split(" - ");
      const parsedArtist = parts[0].trim();
      const parsedTitle = parts.slice(1).join(" - ").trim();
      if (!artist || artist === "Unknown Artist") {
        artist = parsedArtist;
      }
      if (!title) {
        title = parsedTitle;
      }
    } else {
      if (!title) {
        title = filename;
      }
    }
  }

  const djKey = keyStr;

  if (!isTemp) {
    try {
      const djKey = keyStr.replace(" maj", "").replace(" min", "m");
      await invoke("update_metadata", {
        filepath,
        title,
        artist,
        bpm,
        key: djKey,
      });
    } catch (e) {
      console.error("Failed to update file metadata", e);
    }
  }

  return {
    bpm,
    keyStr: djKey,
    bpmConfidence,
    keyStrength,
    fromYoutubeDesc,
    bpmFromYoutube,
    keyFromYoutube,
    title,
    artist,
  };
}

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
