import { useState, useEffect } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function useUpdater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkForUpdate = async () => {
    setStatus('checking');
    try {
      const updateResult = await check();
      if (updateResult) {

        setUpdate(updateResult);
        setStatus('available');
        return updateResult;
      } else {

        setStatus('idle');
        return null;
      }
    } catch (error: any) {
      console.error("Failed to check for updates", error);
      setErrorMessage(error?.toString() || "Unknown error");
      setStatus('error');
      return null;
    }
  };

  const installUpdate = async () => {
    if (!update) return;

    setStatus('downloading');
    setProgress(0);
    setErrorMessage(null);

    try {
      let downloaded = 0;
      let total = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength || 0;
            setStatus('downloading');
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (total > 0) {
              const p = Math.round((downloaded / total) * 100);
              setProgress(p);
            }
            break;
          case 'Finished':
            setStatus('installing');
            break;
        }
      });

      // Stay in 'installing' or similar state until relaunch
      await relaunch();
    } catch (error: any) {
      console.error("Failed to install update:", error);
      setErrorMessage(error?.toString() || "Installation failed. Please try again.");
      setStatus('error');
    }
  };

  useEffect(() => {
    checkForUpdate();
  }, []);

  return {
    update,
    status,
    progress,
    errorMessage,
    checkForUpdate,
    installUpdate
  };
}
