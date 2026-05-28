import { listen } from "@tauri-apps/api/event";
import { getCurrent } from "@tauri-apps/plugin-deep-link";
import { type RefObject, useEffect } from "react";
import { useApp } from "../context/useApp";
import { trackEvent } from "../utils/analytics";

export function useDeepLink(
  handleDownloadRef: RefObject<
    (
      url: string,
      dl?: boolean,
      an?: boolean,
      overrideId?: string,
      overrideDownloadPlaylist?: boolean,
    ) => Promise<void>
  >,
) {
  const {
    setUrl,
    setShouldDownload,
    setAutoAnalyze,
    setActiveTab,
    setFormat,
    setDownloadPlaylist,
  } = useApp();

  useEffect(() => {
    const processDeepLink = (raw: string) => {
      try {
        // Parse riptune://action?url=encodedUrl
        const withoutScheme = raw.replace(/^riptune:\/\//, "");
        const slashIdx = withoutScheme.indexOf("?");
        let action =
          slashIdx !== -1 ? withoutScheme.slice(0, slashIdx) : withoutScheme;
        action = action.replace(/\/$/, ""); // Remove trailing slash if present

        const params = new URLSearchParams(
          slashIdx !== -1 ? withoutScheme.slice(slashIdx + 1) : "",
        );
        const videoUrl = params.get("url") || "";
        const formatParam = params.get("format");

        if (!videoUrl) return;

        if (
          formatParam === "mp3" ||
          formatParam === "wav" ||
          formatParam === "flac"
        ) {
          setFormat(formatParam);
        }

        // Set URL in the input and navigate to home tab
        setUrl(decodeURIComponent(videoUrl));
        setActiveTab("home");

        // Configure action flags based on the riptune:// action
        let dl = false;
        let an = false;
        let pl = false;

        if (action === "download") {
          setShouldDownload(true);
          setAutoAnalyze(false);
          setDownloadPlaylist(false);
          dl = true;
          an = false;
          pl = false;
        } else if (action === "analyze") {
          setShouldDownload(false);
          setAutoAnalyze(true);
          setDownloadPlaylist(false);
          dl = false;
          an = true;
          pl = false;
        } else if (action === "both") {
          setShouldDownload(true);
          setAutoAnalyze(true);
          setDownloadPlaylist(false);
          dl = true;
          an = true;
          pl = false;
        } else if (action === "playlist") {
          setShouldDownload(true);
          setAutoAnalyze(false);
          setDownloadPlaylist(true);
          dl = true;
          an = false;
          pl = true;
        }

        trackEvent("deep_link_received", { action });
        console.log("[Riptune DeepLink] Parsed payload:", {
          raw,
          action,
          videoUrl,
          dl,
          an,
          pl,
        });

        // Trigger the process automatically!
        setTimeout(() => {
          handleDownloadRef.current(
            decodeURIComponent(videoUrl),
            dl,
            an,
            undefined,
            pl,
          );
        }, 100);
      } catch (err) {
        console.error("[RipTune] Failed to parse deep link:", err);
      }
    };

    // 1. Check for cold-start deep links
    getCurrent()
      .then((urls) => {
        if (urls && urls.length > 0) {
          processDeepLink(urls[0]);
        }
      })
      .catch(console.error);

    // 2. Listen for deep links from the Chrome extension while already running
    const unlistenDeepLink = listen<string>("deep-link-received", (event) => {
      processDeepLink(event.payload);
    });

    return () => {
      unlistenDeepLink.then((f) => f());
    };
  }, [
    setUrl,
    setShouldDownload,
    setAutoAnalyze,
    setActiveTab,
    setFormat,
    handleDownloadRef,
    setDownloadPlaylist,
  ]);
}
