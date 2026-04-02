import { useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const useFullscreenShortcut = () => {
  const toggleFullscreen = useCallback(async () => {
    const appWindow = getCurrentWindow();
    const isFullscreen = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!isFullscreen);
  }, []);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // F11 or Alt + Enter
      if (e.key === "F11" || (e.altKey && e.key === "Enter")) {
        e.preventDefault();
        await toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleFullscreen]);

  return { toggleFullscreen };
};
