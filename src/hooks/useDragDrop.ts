import { type Event, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { useApp } from "../context/useApp";
import { useAudioProcessor } from "./useAudioProcessor";

export function useDragDrop() {
  const { setDragActive, setActiveTab, isBugModalOpen } = useApp();
  const { processFile } = useAudioProcessor();

  useEffect(() => {
    const audioExtensions = ["mp3", "wav", "flac", "flacc"];

    let unlistenEnter: Promise<UnlistenFn>;
    let unlistenLeave: Promise<UnlistenFn>;
    let unlistenDrop: Promise<UnlistenFn>;

    unlistenEnter = listen("tauri://drag-enter", () => {
      if (isBugModalOpen) return;
      setDragActive(true);
    });

    unlistenLeave = listen("tauri://drag-leave", () => {
      if (isBugModalOpen) return;
      setDragActive(false);
    });

    unlistenDrop = listen(
      "tauri://drag-drop",
      (event: Event<{ paths?: string[] }>) => {
        if (isBugModalOpen) return;
        setDragActive(false);
        const paths: string[] = event.payload.paths || [];

        let processedAny = false;
        for (const path of paths) {
          const ext = path.toLowerCase().split(".").pop() || "";
          if (audioExtensions.includes(ext)) {
            if (!processedAny) {
              setActiveTab("home");
              processedAny = true;
            }
            // Each file gets its own concurrent task
            processFile(path);
          }
        }
      },
    );

    return () => {
      unlistenEnter.then((f) => f());
      unlistenLeave.then((f) => f());
      unlistenDrop.then((f) => f());
    };
  }, [setDragActive, setActiveTab, processFile, isBugModalOpen]);
}
