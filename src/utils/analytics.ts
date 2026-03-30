import { invoke } from "@tauri-apps/api/core";

export const trackEvent = async (eventName: string, props?: Record<string, string | number>) => {
  try {
    await invoke("track_event", { eventName, props: props || null });
  } catch (error) {
    console.error(`Failed to track event ${eventName}:`, error);
  }
};
