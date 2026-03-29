import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { Download, UploadCloud, FolderOpen, Loader2, Info, List, Trash2, AlertTriangle, XCircle, X, Sparkles } from "lucide-react";
import type { HistoryEntry } from "./types";
import TitleBar from "./components/TitleBar";

export default function App() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("wav");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'info' | 'error' | 'success', isTask?: boolean }[]>([]);
  const loadingRef = useRef(false);

  const addNotification = (message: string, type: 'info' | 'error' | 'success' = 'info', isTask: boolean = false) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [{ id, message, type, isTask }, ...prev]);

    // Auto-remove if it's not a task and not an error
    if (!isTask && type !== 'error') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotificationsFor = (match: string) => {
    setNotifications(prev => prev.filter(n => !n.message.includes(match)));
  };

  const [dragActive, setDragActive] = useState(false);
  const [customDir, setCustomDir] = useState<string | null>(localStorage.getItem("riptune_download_dir"));
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'settings'>('home');
  const [latest, setLatest] = useState<HistoryEntry | null>(null);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [playlistProgress, setPlaylistProgress] = useState<{ current: number, total: number } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [downloadPlaylist, setDownloadPlaylist] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [cookies, setCookies] = useState<string>(localStorage.getItem("riptune_cookies") || "");
  const [defaultDir, setDefaultDir] = useState<string>("");
  const [keepFilesOnHistoryDelete, setKeepFilesOnHistoryDelete] = useState<boolean>(() => {
    const saved = localStorage.getItem("riptune_keep_files_on_history_delete");
    return saved === null ? false : saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("riptune_keep_files_on_history_delete", keepFilesOnHistoryDelete.toString());
  }, [keepFilesOnHistoryDelete]);

  useEffect(() => {
    localStorage.setItem("riptune_cookies", cookies);
  }, [cookies]);

  useEffect(() => {
    if (customDir) {
      localStorage.setItem("riptune_download_dir", customDir);
    } else {
      localStorage.removeItem("riptune_download_dir");
    }
  }, [customDir]);

  useEffect(() => {
    const saved = localStorage.getItem("riptune_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        const latestAnalyzed = parsed.find((item: HistoryEntry) => item.bpm !== undefined);
        if (latestAnalyzed) {
          setLatest(latestAnalyzed);
        }
      } catch (e) {
        console.error("Failed to parse history");
      }
    }

    const fetchDefaultDir = async () => {
      try {
        const path = await invoke<string>("get_default_download_dir");
        setDefaultDir(path);
      } catch (e) {
        console.error("Failed to fetch default download dir", e);
      }
    };
    fetchDefaultDir();

    const unlistenDrop = listen<{ paths: string[] }>("tauri://drag-drop", (event) => {
      setDragActive(false);
      const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma'];
      if (event.payload.paths && event.payload.paths.length > 0) {
        const path = event.payload.paths[0];
        const isAudio = audioExtensions.some(ext => path.toLowerCase().endsWith(ext));
        if (isAudio) {
          setActiveTab("home");
          processFile(path);
        } else {
          addNotification("Error: Only audio files are supported", "error");
        }
      }
    });

    const unlistenDragEnter = listen("tauri://drag-enter", () => setDragActive(true));
    const unlistenDragLeave = listen("tauri://drag-leave", () => setDragActive(false));

    const unlistenProgress = listen<{ current: number, total: number, title: string }>("download-progress", (event) => {
      setPlaylistProgress({ current: event.payload.current, total: event.payload.total });
    });

    return () => {
      unlistenDrop.then((f) => f());
      unlistenDragEnter.then((f) => f());
      unlistenDragLeave.then((f) => f());
      unlistenProgress.then((f) => f());
    };
  }, []);

  useEffect(() => {
    if (url.includes("list=")) {
      setIsPlaylist(true);
      // We don't force autoAnalyze to false here yet, only if they check 'Playlist'
    } else {
      setIsPlaylist(false);
      setDownloadPlaylist(false);
    }
  }, [url]);

  useEffect(() => {
    if (downloadPlaylist) {
      setAutoAnalyze(false);
    }
  }, [downloadPlaylist]);

  const saveHistory = (newHistory: HistoryEntry[]) => {
    setHistory(newHistory);
    localStorage.setItem("riptune_history", JSON.stringify(newHistory));
  };

  const processFile = async (filepath: string, titleHint?: string, artistHint?: string) => {
    setLoading(true);
    addNotification("Analyzing BPM & Key", "info", true);

    try {
      const result = await invoke<[number, string]>("extract_bpm_key", { filepath });
      const bpm = Math.round(result[0]);
      const keyStr = result[1];

      let title = titleHint;
      let artist = artistHint;

      // Try to parse filename if hints are missing
      if (!title || !artist || artist === "Unknown Artist") {
        const filename = filepath.split('\\').pop()?.split('/').pop()?.replace(/\.[^/.]+$/, "") || "";
        if (filename.includes(" - ")) {
          const parts = filename.split(" - ");
          const parsedArtist = parts[0].trim();
          const parsedTitle = parts.slice(1).join(" - ").trim();

          artist = artist === "Unknown Artist" || !artist ? parsedArtist : artist;
          title = !title ? parsedTitle : title;
        } else {
          title = title || filename || "Unknown Audio";
          artist = artist || "Unknown Artist";
        }
      }

      // Update file metadata with Title, Artist and BPM
      try {
        await invoke("update_metadata", { filepath, title, artist, bpm });
      } catch (e) {
        console.error("Failed to update file metadata:", e);
      }

      // Clear analysis loading notification
      clearNotificationsFor("Analyzing");

      // Check if entry already exists in history to update it
      const existingEntryIndex = history.findIndex(item => item.filepath === filepath);

      if (existingEntryIndex !== -1) {
        const updatedHistory = [...history];
        updatedHistory[existingEntryIndex] = {
          ...updatedHistory[existingEntryIndex],
          bpm,
          key: keyStr
        };
        saveHistory(updatedHistory);
        setLatest(updatedHistory[existingEntryIndex]);
      } else {
        const newEntry: HistoryEntry = {
          id: crypto.randomUUID(),
          title,
          artist,
          filepath,
          bpm,
          key: keyStr,
          date: new Date().toISOString()
        };
        saveHistory([newEntry, ...history]);
        setLatest(newEntry);
      }

      addNotification("Analysis complete", "success");
    } catch (error: any) {
      console.error(error);
      clearNotificationsFor("Analyzing");
      const isNotFound = error?.toString()?.includes("No such file") || error?.toString()?.includes("not found");
      addNotification(isNotFound ? "File not found! (Maybe moved or deleted)" : `Analysis Error: ${error}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url) return;
    setPlaylistProgress(null);
    setLoading(true);
    loadingRef.current = true;

    try {
      if (isPlaylist && downloadPlaylist) {
        addNotification("Fetching playlist information...", "info", true);
        try {
          const info = await invoke<{ count: number }>("check_url_info", { url, cookies });

          // CRITICAL: Check if user cancelled during fetch
          if (!loadingRef.current) {
            clearNotificationsFor("Fetching");
            return;
          }

          setPlaylistProgress({ current: 0, total: info.count });
          clearNotificationsFor("Fetching");
        } catch (e) {
          console.error("Failed to fetch playlist info", e);
        }
      }

      // Secondary check before starting DL
      if (!loadingRef.current) {
        clearNotificationsFor("Fetching");
        return;
      }

      addNotification(`Downloading audio from YouTube...`, "info", true);
      const result = await invoke<{ filepath: string, title: string, artist: string }>("download_audio", {
        url,
        format,
        customPath: customDir,
        cookies,
        downloadPlaylist
      });

      clearNotificationsFor("Downloading");

      if (autoAnalyze) {
        await processFile(result.filepath, result.title, result.artist);
      } else {
        const newEntry: HistoryEntry = {
          id: crypto.randomUUID(),
          title: result.title,
          artist: result.artist,
          filepath: result.filepath,
          date: new Date().toISOString()
        };
        saveHistory([newEntry, ...history]);
        setPlaylistProgress(null);
        addNotification("Download complete", "success");
        loadingRef.current = false;
        setLoading(false);
      }
      setUrl("");
    } catch (error: any) {
      console.error(error);
      const isCancel = error?.toString()?.includes("Cancelled");

      clearNotificationsFor("Downloading");
      clearNotificationsFor("Fetching");
      clearNotificationsFor("Cancelling");

      addNotification(isCancel ? "Download cancelled" : `Download Error: ${error}`, isCancel ? 'info' : 'error');
      loadingRef.current = false;
      setLoading(false);
      setPlaylistProgress(null);
    }
  };

  const handleCancelDownload = async () => {
    // Clear current tasks and show immediate feedback
    loadingRef.current = false;
    setLoading(false);
    setPlaylistProgress(null);
    clearNotificationsFor("Downloading");
    clearNotificationsFor("Fetching");
    addNotification("Cancelling download...", "info");

    try {
      await invoke("cancel_download");
    } catch (e) {
      console.error("Cancel failed", e);
    }
  };

  const handleSelectDir = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === 'string') {
        setCustomDir(selected);
      }
    } catch (error) {
      console.error("Failed to open directory dialog", error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await invoke("open_folder", { path: customDir || defaultDir });
    } catch (error) {
      console.error("Failed to open folder", error);
    }
  };

  const handleOpenFile = async (filepath: string) => {
    try {
      await invoke("open_file", { filepath });
    } catch (error) {
      console.error("Failed to open file", error);
    }
  };

  const handleResetCurrent = () => {
    setLatest(null);
    addNotification("Current analysis cleared.", "info");
  };

  const handleDeleteHistoryItem = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      const item = history.find(h => h.id === deleteConfirmId);
      if (item && !keepFilesOnHistoryDelete) {
        try {
          await invoke("delete_file", { filepath: item.filepath });
        } catch (e) {
          console.error("Failed to delete physical file", e);
        }
      }

      const newHistory = history.filter(item => item.id !== deleteConfirmId);
      saveHistory(newHistory);
      setDeleteConfirmId(null);
      addNotification("Track removed from history", "success");
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0f1c] text-slate-100 font-sans selection:bg-purple-500/30 flex flex-col items-center overflow-hidden relative">
      <TitleBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleResetCurrent}
      />
      {/* Background Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Global Drag & Drop Overlay */}
      {dragActive && (
        <div className="fixed inset-0 z-[100] bg-[#0a0f1c]/80 backdrop-blur-md border-4 border-dashed border-purple-500 flex items-center justify-center transition-all">
          <div className="text-center animate-bounce">
            <div className="w-24 h-24 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.4)]">
              <UploadCloud className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">Drop any audio file here</h2>
            <p className="text-purple-300 mt-2 text-lg">We'll instantly extract the BPM and Key.</p>
          </div>
        </div>
      )}

      {/* Main Content Scroll Wrapper */}
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar scroll-smooth z-10 mt-[60px] flex flex-col">
        <main className={`w-full max-w-7xl mx-auto px-6 pb-12 flex-1 flex flex-col items-center ${activeTab !== 'home' ? 'pt-8' : ''}`}>
          {activeTab === 'home' && (
            <div className="w-full flex-1 flex flex-col justify-center items-center max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 gap-6">

              <div className="text-center w-full">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 pb-2 drop-shadow-sm">
                  Rip the perfect tune.
                </h1>
                <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto mb-8">
                  Paste a YouTube link or drag and drop any audio file anywhere on the screen to instantly extract its BPM and musical key.
                </p>

                {/* Big Search Bar */}
                <div className="relative group w-full mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                  <div className="relative bg-[#111728]/80 backdrop-blur-2xl border border-white/10 rounded-[1.25rem] p-1.5 flex items-center shadow-2xl">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      disabled={loading}
                      className="flex-1 bg-transparent border-none text-base md:text-lg text-white px-5 py-3 focus:outline-none focus:ring-0 placeholder-slate-600 disabled:opacity-50"
                    />
                    <button
                      onClick={loading ? handleCancelDownload : handleDownload}
                      disabled={!url && !loading}
                      className="shrink-0 group/cancel relative overflow-hidden h-12 w-12 rounded-xl bg-white text-[#0a0f1c] font-bold text-lg flex items-center justify-center hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                      title={loading ? "Cancel Download" : "Download"}
                    >
                      {!loading ? (
                        <Download className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      ) : (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin group-hover/cancel:opacity-0 transition-opacity text-purple-600" />
                          <XCircle className="w-6 h-6 absolute inset-0 m-auto opacity-0 group-hover/cancel:opacity-100 transition-opacity animate-in zoom-in-50 duration-200 text-red-500" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Playlist Detected Warning (Only if Playlist Download is Checked) */}
                {isPlaylist && downloadPlaylist && (
                  <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 text-left">
                      <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Playlist Detected</h4>
                        <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                          Downloading a playlist takes more time. For performance reasons, **Auto-Analysis is disabled** for batch downloads. You can analyze tracks individually later from your history.
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                {/* Search Settings */}
                <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 mb-6">
                  {/* Playlist Toggle */}
                  <label className={`flex items-center gap-2 cursor-pointer bg-[#111728] border border-white/5 rounded-full px-5 py-2 transition-all ${!isPlaylist ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/20'}`}>
                    <input
                      type="checkbox"
                      checked={downloadPlaylist}
                      onChange={(e) => setDownloadPlaylist(e.target.checked)}
                      disabled={loading || !isPlaylist}
                      className="w-4 h-4 rounded appearance-none border-2 border-slate-600 checked:border-blue-500 checked:bg-blue-500 transition-colors cursor-pointer relative flex items-center justify-center after:content-[''] after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:hidden checked:after:block after:-mt-0.5 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm font-medium ${!isPlaylist ? 'text-slate-600' : 'text-slate-300'}`}>Playlist</span>
                  </label>

                  {/* Format Select */}
                  <div className="flex items-center gap-2 bg-[#111728] border border-white/5 rounded-full px-4 py-2 hover:border-white/20 transition-colors">
                    <span className="text-xs font-medium tracking-widest text-slate-400 uppercase">Format</span>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      disabled={loading}
                      className="bg-transparent text-white focus:outline-none font-bold cursor-pointer [&>option]:bg-[#111728] [&>option]:text-white"
                    >
                      <option value="wav">WAV</option>
                      <option value="mp3">MP3</option>
                      <option value="flac">FLAC</option>
                    </select>
                  </div>

                  {/* Analyze Toggle */}
                  <label className={`flex items-center gap-2 cursor-pointer bg-[#111728] border border-white/5 rounded-full px-5 py-2 transition-all ${downloadPlaylist ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/20'}`}>
                    <input
                      type="checkbox"
                      checked={autoAnalyze}
                      onChange={(e) => setAutoAnalyze(e.target.checked)}
                      disabled={loading || downloadPlaylist}
                      className="w-4 h-4 rounded appearance-none border-2 border-slate-600 checked:border-purple-500 checked:bg-purple-500 transition-colors cursor-pointer relative flex items-center justify-center after:content-[''] after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:hidden checked:after:block after:-mt-0.5 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm font-medium ${downloadPlaylist ? 'text-slate-600' : 'text-slate-300'}`}>Analyze</span>
                  </label>
                </div>

                {/* Compact Two-Box Analysis Display (Always Visible) */}
                <div className="w-full grid grid-cols-2 gap-3 mt-2 animate-in slide-in-from-bottom-8 fade-in duration-700">
                  <div className="group relative rounded-[1.25rem] bg-gradient-to-b from-purple-500/10 to-transparent p-[1.5px]">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-[1.25rem] blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative h-full w-full bg-[#111728]/90 backdrop-blur-sm rounded-[1.2rem] border border-white/5 flex flex-col items-center justify-center py-6 px-4 shadow-2xl overflow-visible">
                      <span className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-400 drop-shadow-md leading-normal select-none ${!latest?.bpm ? 'opacity-20' : ''}`}>
                        {latest?.bpm || "--"}
                      </span>
                      <span className="mt-2 text-[9px] font-bold text-slate-500 underline decoration-purple-500/20 underline-offset-4 tracking-[0.2em] uppercase select-none">BPM</span>
                    </div>
                  </div>

                  <div className="group relative rounded-[1.25rem] bg-gradient-to-b from-blue-500/10 to-transparent p-[1.5px]">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-[1.25rem] blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative h-full w-full bg-[#111728]/90 backdrop-blur-sm rounded-[1.2rem] border border-white/5 flex flex-col items-center justify-center py-6 px-4 shadow-2xl overflow-visible">
                      <span className={`text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-bl from-white to-blue-400 drop-shadow-md leading-relaxed z-10 select-none ${!latest?.key ? 'opacity-20' : ''}`}>
                        {latest?.key || "--"}
                      </span>
                      <span className="mt-2 text-[9px] font-bold text-slate-500 underline decoration-blue-500/20 underline-offset-4 tracking-[0.2em] uppercase z-10 select-none">Key</span>
                    </div>
                  </div>

                  {latest && (
                    <div className="col-span-2 text-center mt-2 flex justify-center animate-in fade-in duration-500">
                      <button
                        onClick={() => handleOpenFile(latest.filepath)}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-[#111728] px-4 py-1.5 rounded-full border border-white/5 hover:border-white/20"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] md:text-xs truncate max-w-[250px] md:max-w-[400px]">{latest.title}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: History Page (Table) */}
          {activeTab === 'history' && (
            <div className="w-full h-full flex flex-col max-w-6xl animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 shrink-0">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">Your History</h2>
                  <p className="text-slate-400 mt-2 text-lg">All downloaded and analyzed tracks</p>
                </div>
                <div className="text-slate-500 text-sm font-medium bg-[#111728] px-4 py-2 rounded-lg border border-white/5">
                  {history.length} {history.length === 1 ? 'Entry' : 'Entries'}
                </div>
              </div>

              <div className="w-full flex-1 rounded-3xl bg-[#111728]/80 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col overflow-hidden">
                <div className="overflow-x-auto relative scroll-smooth p-1">
                  <table className="w-full text-left border-collapse min-w-[800px] relative">
                    <thead className="sticky top-0 z-10 bg-[#141b2e] shadow-md border-b border-white/10">
                      <tr className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
                        <th className="px-8 py-5 font-semibold rounded-tl-3xl">Track Details</th>
                        <th className="px-8 py-5 font-semibold">Date & Time</th>
                        <th className="px-8 py-5 font-semibold text-center">BPM</th>
                        <th className="px-8 py-5 font-semibold text-center">Key</th>
                        <th className="px-8 py-5 font-semibold text-center rounded-tr-3xl">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-24 text-center text-slate-500">
                            <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                              <List className="w-10 h-10 opacity-40" />
                            </div>
                            <p className="text-xl font-medium text-slate-400">History is empty.</p>
                            <p className="mt-1">Download or rip a track to see it here.</p>
                          </td>
                        </tr>
                      ) : (
                        history.map((item) => (
                          <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                            <td className="px-8 py-5">
                              <div className="font-bold text-slate-200 truncate max-w-xs xl:max-w-md text-base" title={item.title}>
                                {item.title}
                              </div>
                              {item.artist && (
                                <div className="text-xs text-purple-400 font-medium mt-0.5 truncate max-w-xs xl:max-w-md">
                                  {item.artist}
                                </div>
                              )}
                              <div className="text-xs text-slate-500 truncate max-w-xs xl:max-w-md mt-1.5" title={item.filepath}>
                                {item.filepath}
                              </div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-300">
                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                              <div className="text-xs font-semibold text-slate-500 mt-1">
                                {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center whitespace-nowrap">
                              {item.bpm !== undefined ? (
                                <span className="inline-flex items-center justify-center min-w-[60px] px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 text-purple-400 font-bold text-lg shadow-sm">
                                  {item.bpm}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-bold">-</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-center whitespace-nowrap">
                              {item.key !== undefined ? (
                                <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 text-blue-400 font-bold text-lg shadow-sm">
                                  {item.key}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-bold">-</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {item.bpm === undefined && (
                                  <button
                                    onClick={() => processFile(item.filepath, item.title, item.artist)}
                                    className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white flex items-center justify-center transition-all group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] duration-300"
                                    title="Analyze BPM & Key"
                                    disabled={loading}
                                  >
                                    {loading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenFile(item.filepath)}
                                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300"
                                  title="Open file in Explorer"
                                >
                                  <FolderOpen className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteHistoryItem(item.id)}
                                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-all duration-300"
                                  title="Delete from History"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="w-full max-w-4xl pb-10 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 shrink-0">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">Settings</h2>
                  <p className="text-slate-400 mt-2 text-lg">Configure your application preferences</p>
                </div>
              </div>

              <div className="w-full rounded-3xl bg-[#111728]/80 backdrop-blur-xl border border-white/5 shadow-2xl p-8">
                <div className="mb-6 border-b border-white/10 pb-6">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-purple-400" />
                    Download Location
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Select a specific folder where all your downloaded YouTube audio files will be saved. If no folder is selected, RipTune defaults to the system path shown below.
                  </p>
                  <div className="relative group">
                    <div className="flex items-center w-full bg-[#0a0f1c] border border-white/10 rounded-xl overflow-hidden focus-within:border-purple-500/50 transition-colors shadow-inner">
                      <button
                        onClick={handleOpenFolder}
                        className="flex-1 text-left px-4 py-3 text-slate-300 font-mono text-xs md:text-sm truncate hover:text-white transition-colors"
                        title="Open destination folder"
                      >
                        {customDir || defaultDir || "Fetching path..."}
                      </button>
                      <div className="flex items-center gap-1 pr-2">
                        {customDir && (
                          <button
                            onClick={() => setCustomDir(null)}
                            className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                            title="Reset to default"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={handleSelectDir}
                          className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs md:text-sm font-bold hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                        >
                          Parcourir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 border-b border-white/10 pb-6">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-amber-400" />
                    YouTube Cookies
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Paste your YouTube cookies here (JSON format from <strong>EditThisCookie</strong> or Netscape format) to bypass rate limits or access private playlists. This information is only used locally for your downloads.
                  </p>
                  <textarea
                    value={cookies}
                    onChange={(e) => setCookies(e.target.value)}
                    placeholder='[ { "domain": ".youtube.com", ... } ] or # Netscape HTTP Cookie File'
                    className="w-full h-32 bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-slate-300 font-mono text-xs shadow-inner focus:outline-none focus:border-purple-500/50 transition-colors resize-none custom-scrollbar"
                  />
                </div>

                <div className="mb-6 border-b border-white/10 pb-6">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    History & Cleanup
                  </h3>
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">Keep physical files</p>
                      <p className="text-slate-400 text-xs text-pretty">When active, the original audio files will NOT be deleted when you remove tracks from your history.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={keepFilesOnHistoryDelete}
                        onChange={(e) => setKeepFilesOnHistoryDelete(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    About RipTune
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Powered by Tauri, React, and Essentia Analysis Engine.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Floating Notifications / Toasts Stack */}
      <div className="fixed top-[72px] right-6 z-[100001] flex flex-col gap-3 max-w-sm pointer-events-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="group/toast bg-[#111728]/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto"
          >
            <div className={`shrink-0 p-2.5 rounded-xl ${notification.type === 'error' ? 'bg-red-500/20 text-red-400' : notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {notification.type === 'error' ? (
                <XCircle className="w-5 h-5" />
              ) : notification.type === 'success' ? (
                <Info className="w-5 h-5" />
              ) : notification.isTask ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Info className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase truncate">
                  {notification.type === 'error' ? "Error" : notification.type === 'success' ? "Success" : (notification.isTask ? "Task" : "Notification")}
                </p>
                {loading && isPlaylist && downloadPlaylist && playlistProgress && notification.message.includes("Downloading") && (
                  <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md border border-purple-500/20 shrink-0">
                    {playlistProgress.current} / {playlistProgress.total > 0 ? playlistProgress.total : "--"}
                  </span>
                )}
              </div>
              <p className={`text-xs font-semibold leading-relaxed break-words ${notification.type === 'error' ? 'text-red-300' : notification.type === 'success' ? 'text-emerald-300' : 'text-slate-100'}`}>
                {notification.message}
              </p>

              {loading && isPlaylist && downloadPlaylist && playlistProgress && notification.message.includes("Downloading") && (
                <div className="mt-2.5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${(playlistProgress.current / playlistProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {!notification.isTask && (
              <button
                onClick={() => removeNotification(notification.id)}
                className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Custom Deletion Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-[#111728] border border-white/10 rounded-3xl p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Delete Track?</h3>
            <p className="text-slate-400 text-center text-sm mb-6 leading-relaxed px-2">
              Are you sure you want to remove this track from history?
            </p>

            <div className={`p-4 rounded-2xl mb-8 flex items-start gap-3 transition-colors ${!keepFilesOnHistoryDelete ? 'bg-red-500/5' : 'bg-slate-800/20'}`}>
              <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!keepFilesOnHistoryDelete ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${!keepFilesOnHistoryDelete ? 'text-red-400' : 'text-emerald-400'}`}>
                  File Deletion: {!keepFilesOnHistoryDelete ? 'Active' : 'Disabled'}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {!keepFilesOnHistoryDelete
                    ? "The physical audio file will be permanently deleted from your computer if found."
                    : "The physical audio file will NOT be deleted. Only the entry is removed from RipTune."}
                </p>
                <button
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setActiveTab('settings');
                  }}
                  className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold transition-colors flex items-center gap-1"
                >
                  <Info className="w-2.5 h-2.5" /> Manage this in Settings
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmDelete}
                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                Yes, delete track
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
