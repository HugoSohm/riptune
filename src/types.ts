export interface HistoryEntry {
  id: string;
  title: string;
  artist?: string;
  filepath: string;
  bpm?: number;
  key?: string;
  bpmConfidence?: number;
  keyStrength?: number;
  date: string;
  isTemp?: boolean;
  url?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
  isTask?: boolean;
}

export interface PlaylistProgress {
  current: number;
  total: number;
}
