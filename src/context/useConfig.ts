import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

export function useConfig() {
  const [shouldDownload, setShouldDownload] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [downloadPlaylist, setDownloadPlaylist] = useState(false);

  const [customDir, setCustomDir] = useState<string | null>(
    localStorage.getItem("riptune_download_dir"),
  );
  const [defaultDir, setDefaultDir] = useState<string>("");
  const [customLyricsDir, setCustomLyricsDir] = useState<string | null>(
    localStorage.getItem("riptune_lyrics_dir"),
  );
  const [defaultLyricsDir, setDefaultLyricsDir] = useState<string>("");
  const [cookies, setCookies] = useState<string>(
    localStorage.getItem("riptune_cookies") || "",
  );
  const [deleteFilesOnHistoryDelete, setDeleteFilesOnHistoryDelete] =
    useState<boolean>(() => {
      const saved = localStorage.getItem(
        "riptune_delete_files_on_history_delete",
      );
      return saved === null ? true : saved === "true";
    });
  const [partialAnalysis, setPartialAnalysis] = useState<boolean>(() => {
    const saved = localStorage.getItem("riptune_partial_analysis");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem(
      "riptune_delete_files_on_history_delete",
      deleteFilesOnHistoryDelete.toString(),
    );
  }, [deleteFilesOnHistoryDelete]);
  useEffect(() => {
    localStorage.setItem(
      "riptune_partial_analysis",
      partialAnalysis.toString(),
    );
  }, [partialAnalysis]);
  useEffect(() => {
    if (customDir) localStorage.setItem("riptune_download_dir", customDir);
    else localStorage.removeItem("riptune_download_dir");
  }, [customDir]);
  useEffect(() => {
    if (customLyricsDir)
      localStorage.setItem("riptune_lyrics_dir", customLyricsDir);
    else localStorage.removeItem("riptune_lyrics_dir");
  }, [customLyricsDir]);
  useEffect(() => {
    localStorage.setItem("riptune_cookies", cookies);
  }, [cookies]);

  useEffect(() => {
    const fetchDefaultDir = async () => {
      try {
        setDefaultDir(await invoke<string>("get_default_download_dir"));
      } catch (e) {
        console.error("Failed to fetch default download dir", e);
      }
    };
    fetchDefaultDir();
  }, []);

  useEffect(() => {
    const fetchDefaultLyricsDir = async () => {
      try {
        setDefaultLyricsDir(await invoke<string>("get_default_lyrics_dir"));
      } catch (e) {
        console.error("Failed to fetch default lyrics dir", e);
      }
    };
    fetchDefaultLyricsDir();
  }, []);

  return {
    shouldDownload,
    setShouldDownload,
    autoAnalyze,
    setAutoAnalyze,
    downloadPlaylist,
    setDownloadPlaylist,
    customDir,
    setCustomDir,
    defaultDir,
    setDefaultDir,
    customLyricsDir,
    setCustomLyricsDir,
    defaultLyricsDir,
    cookies,
    setCookies,
    deleteFilesOnHistoryDelete,
    setDeleteFilesOnHistoryDelete,
    partialAnalysis,
    setPartialAnalysis,
  };
}
