import { useState, useEffect } from "react";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { useApp } from "../context/AppContext";
import { useAudioProcessor } from "./useAudioProcessor";

export function useDragDrop() {
  const { setDragActive, setActiveTab } = useApp();
  const { processFile } = useAudioProcessor();
  const [isValidDrag, setIsValidDrag] = useState(true);

  useEffect(() => {
    const audioExtensions = ['mp3', 'wav', 'flac', 'flacc'];
    
    const checkFile = (payload: any) => {
      let list: string[] = [];
      if (Array.isArray(payload)) {
        list = payload;
      } else if (payload && typeof payload === 'object' && Array.isArray(payload.paths)) {
        list = payload.paths;
      }

      if (!list || list.length === 0) return true;

      const path = String(list[0]).toLowerCase().trim();
      const parts = path.split('.');
      if (parts.length < 2) return false;
      const extension = parts.pop() || "";
      
      return audioExtensions.includes(extension);
    };

    let unlistenEnter: Promise<UnlistenFn>;
    let unlistenLeave: Promise<UnlistenFn>;
    let unlistenDrop: Promise<UnlistenFn>;

    unlistenEnter = listen("tauri://drag-enter", (event: any) => {
      setDragActive(true);
      setIsValidDrag(checkFile(event.payload));
    });

    unlistenLeave = listen("tauri://drag-leave", () => {
      setDragActive(false);
    });

    unlistenDrop = listen("tauri://drag-drop", (event: any) => {
      setDragActive(false);
      const paths = event.payload.paths || [];
      if (paths.length > 0) {
        const path = paths[0];
        const ext = path.toLowerCase().split('.').pop() || "";
        if (audioExtensions.includes(ext)) {
          setActiveTab("home");
          processFile(path);
        }
      }
    });

    return () => {
      unlistenEnter.then(f => f());
      unlistenLeave.then(f => f());
      unlistenDrop.then(f => f());
    };
  }, [setDragActive, setActiveTab, processFile]);

  return { isValidDrag };
}
