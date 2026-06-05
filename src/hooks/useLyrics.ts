import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HistoryEntry } from "../types";

const MAP_KEY = "riptune_lyrics_map";

/** Loads the filename→entryId map from localStorage */
function loadMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Saves the filename→entryId map to localStorage */
function saveMap(map: Record<string, string>) {
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export interface LyricsFile {
  filename: string;
  entryId: string | null; // null = orphan
  title?: string;
  artist?: string;
  isOrphan: boolean;
}

export function useLyrics(lyricsDir: string, history: HistoryEntry[]) {
  const [files, setFiles] = useState<LyricsFile[]>([]);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved",
  );

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFilenameRef = useRef<string | null>(null);
  activeFilenameRef.current = activeFilename;

  // ── Build the enriched file list ──────────────────────────────────────────
  const refreshFileList = useCallback(async () => {
    if (!lyricsDir) return;
    try {
      const filenames = await invoke<string[]>("list_lyrics_files", {
        dir: lyricsDir,
      });
      const map = loadMap();
      const enriched: LyricsFile[] = filenames.map((filename) => {
        const entryId = map[filename] ?? null;
        const entry = entryId
          ? history.find((h) => h.id === entryId)
          : undefined;
        return {
          filename,
          entryId,
          title: entry?.title,
          artist: entry?.artist,
          isOrphan: entryId !== null && !entry,
        };
      });
      setFiles(enriched);
    } catch (e) {
      console.error("Failed to list lyrics files", e);
    }
  }, [lyricsDir, history]);

  useEffect(() => {
    refreshFileList();
  }, [refreshFileList]);

  // ── Open a file ───────────────────────────────────────────────────────────
  const openLyricsFile = useCallback(
    async (filename: string) => {
      if (!lyricsDir) return;
      try {
        const text = await invoke<string>("read_lyrics", {
          dir: lyricsDir,
          filename,
        });
        setActiveFilename(filename);
        setContent(text);
        setIsDirty(false);
        setSaveStatus("saved");
      } catch (e) {
        console.error("Failed to read lyrics file", e);
      }
    },
    [lyricsDir],
  );

  // ── Save content ──────────────────────────────────────────────────────────
  const saveLyricsFile = useCallback(
    async (filename: string, text: string) => {
      if (!lyricsDir || !filename) return;
      setSaveStatus("saving");
      try {
        await invoke("save_lyrics", {
          dir: lyricsDir,
          filename,
          content: text,
        });
        setIsDirty(false);
        setSaveStatus("saved");
      } catch (e) {
        console.error("Failed to save lyrics", e);
        setSaveStatus("unsaved");
      }
    },
    [lyricsDir],
  );

  // ── Create a new file linked to a history entry or blank ──────────────────
  const createLyricsFile = useCallback(
    async (entry: HistoryEntry | null): Promise<string | null> => {
      if (!lyricsDir) return null;
      // Sanitize title for filesystem (remove chars invalid on Windows/macOS/Linux)
      const baseName = entry ? entry.title : "Untitled";
      const sanitized = baseName
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);

      try {
        const filename = await invoke<string>("resolve_lyrics_filename", {
          dir: lyricsDir,
          baseName: sanitized || "Untitled",
        });
        // Create empty file
        await invoke("save_lyrics", {
          dir: lyricsDir,
          filename,
          content: "",
        });
        // Register in localStorage map only if linked to an entry
        if (entry) {
          const map = loadMap();
          map[filename] = entry.id;
          saveMap(map);
        }
        await refreshFileList();
        return filename;
      } catch (e) {
        console.error("Failed to create lyrics file", e);
        return null;
      }
    },
    [lyricsDir, refreshFileList],
  );

  // ── Rename active file ────────────────────────────────────────────────────
  const renameLyricsFile = useCallback(
    async (oldName: string, newName: string): Promise<string | null> => {
      if (!lyricsDir) return null;
      // Ensure .txt extension
      const finalName = newName.endsWith(".txt") ? newName : `${newName}.txt`;
      try {
        await invoke("rename_lyrics", {
          dir: lyricsDir,
          oldName,
          newName: finalName,
        });
        // Update localStorage map
        const map = loadMap();
        if (map[oldName] !== undefined) {
          map[finalName] = map[oldName];
          delete map[oldName];
          saveMap(map);
        }
        if (activeFilenameRef.current === oldName) {
          setActiveFilename(finalName);
        }
        await refreshFileList();
        return finalName;
      } catch (e) {
        // Return error message for UI display
        return String(e);
      }
    },
    [lyricsDir, refreshFileList],
  );

  // ── Delete a file ─────────────────────────────────────────────────────────
  const deleteLyricsFile = useCallback(
    async (filename: string) => {
      if (!lyricsDir) return;
      try {
        await invoke("delete_lyrics", { dir: lyricsDir, filename });
        const map = loadMap();
        delete map[filename];
        saveMap(map);
        if (activeFilenameRef.current === filename) {
          setActiveFilename(null);
          setContent("");
          setIsDirty(false);
          setSaveStatus("saved");
        }
        await refreshFileList();
      } catch (e) {
        console.error("Failed to delete lyrics file", e);
      }
    },
    [lyricsDir, refreshFileList],
  );

  // ── Handle content changes ────────────────────────────────────────────────
  const handleContentChange = useCallback(
    (text: string) => {
      setContent(text);
      setIsDirty(true);
      setSaveStatus("unsaved");
      // Reset auto-save debounce (30s)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const fname = activeFilenameRef.current;
        if (fname) saveLyricsFile(fname, text);
      }, 30000);
    },
    [saveLyricsFile],
  );

  // ── Manual save (Ctrl+S) ──────────────────────────────────────────────────
  const saveNow = useCallback(() => {
    const fname = activeFilenameRef.current;
    if (fname && isDirty) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      saveLyricsFile(fname, content);
    }
  }, [isDirty, content, saveLyricsFile]);

  // ── Global Ctrl+S listener ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveNow]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  return {
    files,
    activeFilename,
    content,
    isDirty,
    saveStatus,
    refreshFileList,
    openLyricsFile,
    createLyricsFile,
    saveLyricsFile,
    renameLyricsFile,
    deleteLyricsFile,
    handleContentChange,
    saveNow,
  };
}
