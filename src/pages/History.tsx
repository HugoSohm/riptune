import { List, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import HistoryRow from "../components/HistoryRow";
import { useApp } from "../context/useApp";

export default function History() {
  const {
    history,
    t,
    handleDeleteHistoryItem,
    loadPlaylist,
    currentTrack,
    isVisible,
    reopenPlayer,
    togglePlay,
    addNotification,
  } = useApp();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".action-menu-container")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setVisibleCount(50);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((p) => p + 20);
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, []);

  const filtered = history.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.artist?.toLowerCase().includes(q)
    );
  });
  const displayed = filtered.slice(0, visibleCount);

  // Playable items for building the full playlist on click
  const playableItems = history.filter((i) => !i.isTemp && i.filepath);

  const AUDIO_SERVER = "http://127.0.0.1:4774";

  /** Click handler: check file exists before opening the player */
  const handlePlayItem = async (item: (typeof history)[number]) => {
    // HEAD request to verify the file is accessible
    const audioUrl = `${AUDIO_SERVER}/audio?path=${encodeURIComponent(item.filepath)}`;
    try {
      const res = await fetch(audioUrl, { method: "HEAD" });
      if (!res.ok) {
        addNotification(t.notifications.errorNotFound, "error");
        return;
      }
    } catch (_) {
      addNotification(t.notifications.errorNotFound, "error");
      return;
    }

    // If same track is already loaded, just reopen/resume
    if (currentTrack?.id === item.id) {
      if (isVisible) {
        togglePlay();
      } else {
        reopenPlayer();
      }
      return;
    }
    loadPlaylist(playableItems, item.id);
  };

  return (
    <div className="flex flex-col gap-5 h-full anim-fade-up">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {t.history.title}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {t.history.description}
          </p>
        </div>

        <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
          {/* Search */}
          {history.length > 0 && (
            <div className="flex items-center h-10 flex-1 max-w-[440px] min-w-[140px] bg-[#161a22] border border-white/[0.07] rounded-xl px-3 gap-2 focus-within:border-violet-500/40 transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.history.searchPlaceholder || "Search…"}
                className="flex-1 h-full bg-transparent border-none p-0 text-white text-[13px] caret-violet-400 focus:outline-none focus:ring-0 placeholder-slate-600 focus:placeholder-transparent min-w-0"
              />
            </div>
          )}

          {/* Toolbar */}
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => handleDeleteHistoryItem("all")}
              className="flex items-center gap-1.5 h-10 shrink-0 bg-[#161a22] border border-white/[0.07] rounded-xl px-4 text-slate-600 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.history.deleteAll}
            </button>
          )}
        </div>
      </div>

      {/* ── Table card ─────────────────────────────────────── */}
      <div className="card flex-1 overflow-hidden flex flex-col anim-delay-1 anim-fade-up">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr>
                {/* Play col — no label */}
                <th className="w-14 px-3 py-5 bg-[#161a22] border-b border-white/[0.07] rounded-tl-2xl" />
                <th className="px-5 py-5 bg-[#161a22] border-b border-white/[0.07] w-[30%]">
                  <span className="section-label">{t.history.tableTrack}</span>
                </th>
                <th className="w-20 px-4 py-5 bg-[#161a22] border-b border-white/[0.07] text-center">
                  <span className="section-label">{t.history.tableSource}</span>
                </th>
                <th className="px-4 py-5 bg-[#161a22] border-b border-white/[0.07] w-[17%]">
                  <span className="section-label">{t.history.tableDate}</span>
                </th>
                <th className="px-3 py-5 bg-[#161a22] border-b border-white/[0.07] w-[11%] text-center">
                  <span className="section-label">{t.history.tableBpm}</span>
                </th>
                <th className="px-3 py-5 bg-[#161a22] border-b border-white/[0.07] w-[11%] text-center">
                  <span className="section-label">{t.history.tableKey}</span>
                </th>
                <th className="px-4 py-5 bg-[#161a22] border-b border-white/[0.07] text-center rounded-tr-2xl">
                  <span className="section-label">{t.history.tableAction}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="w-14 h-14 mx-auto bg-white/[0.04] rounded-2xl flex items-center justify-center mb-3 border border-white/[0.06]">
                      <List className="w-7 h-7 text-slate-600" />
                    </div>
                    <p className="text-slate-500 font-medium">
                      {history.length === 0
                        ? t.history.empty
                        : t.history.emptySearch}
                    </p>
                    {history.length === 0 && (
                      <p className="text-slate-600 text-sm mt-1">
                        {t.history.emptyDesc}
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                displayed.map((item, idx) => {
                  const isLast =
                    idx === displayed.length - 1 &&
                    displayed.length === filtered.length;
                  return (
                    <HistoryRow
                      key={item.id}
                      item={item}
                      isLast={isLast}
                      onPlayItem={handlePlayItem}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                    />
                  );
                })
              )}
              <tr ref={observerTarget} className="h-px">
                <td colSpan={7} className="p-0 border-none" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Equalizer bar keyframes (inline) ────────────────────── */}
      <style>{`
        @keyframes playerBar0 {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1);   }
        }
        @keyframes playerBar1 {
          from { transform: scaleY(0.6); }
          to   { transform: scaleY(0.25); }
        }
        @keyframes playerBar2 {
          from { transform: scaleY(0.2); }
          to   { transform: scaleY(0.8); }
        }
      `}</style>
    </div>
  );
}
