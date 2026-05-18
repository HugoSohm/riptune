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
    cookies,
    setCookies,
    deleteFilesOnHistoryDelete,
    setDeleteFilesOnHistoryDelete,
    partialAnalysis,
    setPartialAnalysis,
  };
}
