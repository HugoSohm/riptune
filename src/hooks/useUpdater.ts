import { useState, useEffect } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function useUpdater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

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
    } catch (error) {
      console.error("Failed to check for updates", error);
      setStatus('error');
      return null;
    }
  };

  const installUpdate = async () => {
    if (!update) return;

    setStatus('downloading');
    setProgress(0);

    let totalSize = 0;
    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            totalSize = event.data.contentLength || 0;
            setStatus('downloading');
            break;
          case 'Progress':
            // You can track total downloaded here if needed
            break;
          case 'Finished':
            setStatus('installing');
            break;
        }
      });

      setStatus('idle');
      await relaunch();
    } catch (error) {
      console.error("Failed to install update", error);
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
    checkForUpdate,
    installUpdate
  };
}
