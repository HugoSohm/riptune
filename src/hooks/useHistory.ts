import { useApp } from "../context/AppContext";

export function useHistory() {
  const {
    history, setHistory, saveHistory,
    setLatest, setDeleteConfirmId, deleteConfirmId, handleDeleteHistoryItem, confirmDelete
  } = useApp();

  return {
    history, setHistory, latest: null, setLatest, deleteConfirmId, setDeleteConfirmId,
    saveHistory, handleDeleteHistoryItem, confirmDelete
  };
}
