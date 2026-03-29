export interface HistoryEntry {
  id: string;
  title: string;
  artist?: string;
  filepath: string;
  bpm?: number;
  key?: string;
  date: string;
}
