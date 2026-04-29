import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HistoryEntry } from "../types";

export function useHistory(deleteFilesOnHistoryDelete: boolean) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [latest, setLatest] = useState<HistoryEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("riptune_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        const latestAnalyzed = parsed.find((item: HistoryEntry) => item.bpm !== undefined);
        if (latestAnalyzed) setLatest(latestAnalyzed);
      } catch (e) { console.error("Failed to parse history"); }
    }
  }, []);

  const saveHistory = (newHistory: HistoryEntry[]) => {
    setHistory(newHistory);
    localStorage.setItem("riptune_history", JSON.stringify(newHistory));
  };

  // Safe for concurrent calls: uses functional update so each call sees the latest state
  const updateHistory = (updater: (prev: HistoryEntry[]) => HistoryEntry[]) => {
    setHistory(prev => {
      const next = updater(prev);
      localStorage.setItem("riptune_history", JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleOpenFile = async (filepath: string) => {
    try { await invoke("open_file", { filepath }); }
    catch (error) { console.error("Failed to open file", error); }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === "all") {
      if (deleteFilesOnHistoryDelete) {
        for (const item of history) {
          if (!item.isTemp && item.filepath) {
            try {
              await invoke("delete_file", { filepath: item.filepath });
            } catch (e) { console.error("Failed to delete file", e); }
          }
        }
      }
      saveHistory([]);
      setLatest(null);
    } else if (deleteConfirmId) {
      const itemToDelete = history.find(i => i.id === deleteConfirmId);
      if (itemToDelete && deleteFilesOnHistoryDelete && !itemToDelete.isTemp && itemToDelete.filepath) {
        try {
          await invoke("delete_file", { filepath: itemToDelete.filepath });
        } catch (e) { console.error("Failed to delete file", e); }
      }
      
      const newHistory = history.filter(item => item.id !== deleteConfirmId);
      saveHistory(newHistory);
      
      if (latest && latest.id === deleteConfirmId) {
        const nextAnalyzed = newHistory.find(item => item.bpm !== undefined);
        setLatest(nextAnalyzed || null);
      }
    }
    setDeleteConfirmId(null);
  };

  return {
    history, setHistory, saveHistory, updateHistory, latest, setLatest,
    deleteConfirmId, setDeleteConfirmId, handleDeleteHistoryItem,
    confirmDelete, handleOpenFile
  };
}
