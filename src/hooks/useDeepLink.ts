import { useEffect, MutableRefObject } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrent } from "@tauri-apps/plugin-deep-link";
import { trackEvent } from "../utils/analytics";
import { useApp } from "../context/AppContext";

export function useDeepLink(handleDownloadRef: MutableRefObject<(url: string, dl: boolean, an: boolean) => Promise<void>>) {
  const { setUrl, setShouldDownload, setAutoAnalyze, setActiveTab, setFormat } = useApp();

  useEffect(() => {
    const processDeepLink = (raw: string) => {
      try {
        // Parse riptune://action?url=encodedUrl
        const withoutScheme = raw.replace(/^riptune:\/\//, "");
        const slashIdx = withoutScheme.indexOf("?");
        let action = slashIdx !== -1 ? withoutScheme.slice(0, slashIdx) : withoutScheme;
        action = action.replace(/\/$/, ""); // Remove trailing slash if present
        
        const params = new URLSearchParams(slashIdx !== -1 ? withoutScheme.slice(slashIdx + 1) : "");
        const videoUrl = params.get("url") || "";
        const formatParam = params.get("format");

        if (!videoUrl) return;

        if (formatParam === "mp3" || formatParam === "wav" || formatParam === "flac") {
          setFormat(formatParam);
        }

        // Set URL in the input and navigate to home tab
        setUrl(decodeURIComponent(videoUrl));
        setActiveTab("home");

        // Configure action flags based on the riptune:// action
        let dl = false;
        let an = false;
        
        if (action === "download") {
          setShouldDownload(true);
          setAutoAnalyze(false);
          dl = true;
          an = false;
        } else if (action === "analyze") {
          setShouldDownload(false);
          setAutoAnalyze(true);
          dl = false;
          an = true;
        } else if (action === "both") {
          setShouldDownload(true);
          setAutoAnalyze(true);
          dl = true;
          an = true;
        }

        trackEvent("deep_link_received", { action });

        // Trigger the process automatically!
        setTimeout(() => {
          handleDownloadRef.current(decodeURIComponent(videoUrl), dl, an);
        }, 100);
      } catch (err) {
        console.error("[RipTune] Failed to parse deep link:", err);
      }
    };

    // 1. Check for cold-start deep links
    getCurrent().then((urls) => {
      if (urls && urls.length > 0) {
        processDeepLink(urls[0]);
      }
    }).catch(console.error);

    // 2. Listen for deep links from the Chrome extension while already running
    const unlistenDeepLink = listen<string>("deep-link-received", (event) => {
      processDeepLink(event.payload);
    });

    return () => {
      unlistenDeepLink.then((f) => f());
    };
  }, [setUrl, setShouldDownload, setAutoAnalyze, setActiveTab, setFormat, handleDownloadRef]);
}
