import { useEffect } from "react";
import { Download, Loader2, XCircle, AlertTriangle, Music, FolderOpen } from "lucide-react";
import CustomSelect from "../components/CustomSelect";
import { useApp } from "../context/AppContext";
import { useDownloader } from "../hooks/useDownloader";

export default function Home() {
  const {
    loading, latest, t, isPlaylist, setIsPlaylist,
    shouldDownload, setShouldDownload, autoAnalyze, setAutoAnalyze,
    downloadPlaylist, setDownloadPlaylist, handleOpenFile,
    url, setUrl, format, setFormat
  } = useApp();

  const { handleDownload, handleCancelDownload } = useDownloader();

  useEffect(() => {
    if (url.includes("list=")) {
      setIsPlaylist(true);
    } else {
      setIsPlaylist(false);
      setDownloadPlaylist(false);
    }
  }, [url, setIsPlaylist]);

  useEffect(() => {
    if (downloadPlaylist) {
      setAutoAnalyze(false);
    }
  }, [downloadPlaylist]);

  const isYoutubeUrl = (val: string) => /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/.test(val);

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 gap-6">
      <div className="text-center w-full">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 pb-2 drop-shadow-sm">
          {t.home.title}
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto mb-8">
          {t.home.description}
        </p>

        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 mb-8">
          <div className="group relative">
            <div className="flex items-center gap-2 bg-[#111728] border border-white/5 rounded-full px-4 py-2 hover:border-white/20 transition-colors select-none">
              <span className="text-xs font-medium tracking-widest text-slate-400 uppercase">{t.home.format}</span>
              <CustomSelect
                options={[
                  { value: 'wav', label: 'WAV' },
                  { value: 'mp3', label: 'MP3' },
                  { value: 'flac', label: 'FLAC' }
                ]}
                value={format}
                onChange={setFormat}
                variant="small"
                className="min-w-[60px]"
              />
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-95 group-hover:scale-100 font-medium">
              {t.home.formatTooltip}
            </div>
          </div>

          <div className="group relative">
            <label className="flex items-center gap-2 cursor-pointer bg-[#111728] border border-white/5 rounded-full px-5 py-2 transition-all hover:bg-white/10 hover:border-white/20 select-none">
              <input
                type="checkbox"
                checked={shouldDownload}
                onChange={(e) => {
                  setShouldDownload(e.target.checked);
                }}
                disabled={loading}
                className="w-4 h-4 rounded appearance-none border-2 border-slate-600 checked:border-purple-500 checked:bg-purple-500 transition-colors cursor-pointer relative flex items-center justify-center after:content-[''] after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:hidden checked:after:block after:-mt-0.5 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-medium text-slate-300">{t.home.download}</span>
            </label>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-95 group-hover:scale-100 font-medium text-center">
              {t.home.downloadTooltip}
            </div>
          </div>

          <div className="group relative">
            <label className={`flex items-center gap-2 cursor-pointer bg-[#111728] border border-white/5 rounded-full px-5 py-2 transition-all select-none ${downloadPlaylist ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/20'}`}>
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                disabled={loading || downloadPlaylist}
                className="w-4 h-4 rounded appearance-none border-2 border-slate-600 checked:border-purple-500 checked:bg-purple-500 transition-colors cursor-pointer relative flex items-center justify-center after:content-[''] after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:hidden checked:after:block after:-mt-0.5 disabled:cursor-not-allowed"
              />
              <span className={`text-sm font-medium ${downloadPlaylist ? 'text-slate-600' : 'text-slate-300'}`}>{t.home.analyze}</span>
            </label>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-95 group-hover:scale-100 font-medium text-center">
              {t.home.analyzeTooltip}
            </div>
          </div>

          <div className="group relative">
            <label className={`flex items-center gap-2 cursor-pointer bg-[#111728] border border-white/5 rounded-full px-5 py-2 transition-all select-none ${!isPlaylist ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/20'}`}>
              <input
                type="checkbox"
                checked={downloadPlaylist}
                onChange={(e) => setDownloadPlaylist(e.target.checked)}
                disabled={loading || !isPlaylist}
                className="w-4 h-4 rounded appearance-none border-2 border-slate-600 checked:border-blue-500 checked:bg-blue-500 transition-colors cursor-pointer relative flex items-center justify-center after:content-[''] after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:hidden checked:after:block after:-mt-0.5 disabled:cursor-not-allowed"
              />
              <span className={`text-sm font-medium ${!isPlaylist ? 'text-slate-600' : 'text-slate-300'}`}>{t.home.playlist}</span>
            </label>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 delay-0 group-hover:delay-500 pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-95 group-hover:scale-100 font-medium text-center">
              {!isPlaylist ? t.home.playlistTooltipEmpty : t.home.playlistTooltipFull}
            </div>
          </div>
        </div>

        <div className="w-full mb-4">
          <div className="relative group w-full">
            <div className={`absolute inset-0 bg-gradient-to-r ${url && !isYoutubeUrl(url) ? 'from-red-500 to-orange-500' : 'from-purple-500 to-blue-500'} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
            <div className={`relative bg-[#111728]/80 backdrop-blur-2xl border ${url && !isYoutubeUrl(url) ? 'border-red-500/50' : 'border-white/10'} rounded-[1.25rem] p-1.5 flex items-center shadow-2xl transition-all duration-300`}>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.home.urlPlaceholder}
                disabled={loading}
                className="flex-1 bg-transparent border-none text-base md:text-lg text-white px-5 py-3 focus:outline-none focus:ring-0 placeholder-slate-600 disabled:opacity-50"
              />
              <button
                onClick={loading ? handleCancelDownload : handleDownload}
                disabled={!loading && (!url || !isYoutubeUrl(url) || (!shouldDownload && !autoAnalyze))}
                className="shrink-0 group/cancel relative overflow-hidden h-12 w-12 rounded-xl bg-white text-[#0a0f1c] font-bold text-lg flex items-center justify-center hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
              >
                {!loading ? (
                  <Download className="w-5 h-5" />
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin group-hover/cancel:opacity-0 transition-opacity text-purple-600" />
                    <XCircle className="w-6 h-6 absolute inset-0 m-auto opacity-0 group-hover/cancel:opacity-100 transition-opacity animate-in zoom-in-50 duration-200 text-red-500" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="h-6 mt-2 flex items-center justify-center">
            {url && !isYoutubeUrl(url) && (
              <div className="animate-in slide-in-from-top-1 fade-in duration-300 flex items-center justify-center gap-2 text-red-400 text-xs font-semibold">
                <XCircle className="w-3 h-3" />
                <span>{t.home.invalidUrl}</span>
              </div>
            )}
          </div>
        </div>

        {isPlaylist && downloadPlaylist && (
          <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 text-left">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider">{t.home.playlistDetected}</h4>
                <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                  {t.home.playlistDetectedDesc}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full grid grid-cols-2 gap-3 mt-2 animate-in slide-in-from-bottom-8 fade-in duration-700">
          <div className="group relative rounded-[1.25rem] bg-gradient-to-b from-purple-500/10 to-transparent p-[1.5px]">
            <div className="relative h-full w-full bg-[#111728]/90 backdrop-blur-sm rounded-[1.2rem] border border-white/5 flex flex-col items-center justify-center py-6 px-4 shadow-2xl overflow-visible">
              <span className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-400 drop-shadow-md leading-normal select-none ${!latest?.bpm ? 'opacity-20' : ''}`}>
                {latest?.bpm || "--"}
              </span>
              <span className="mt-2 text-[9px] font-bold text-slate-500 underline decoration-purple-500/20 underline-offset-4 tracking-[0.2em] uppercase select-none">{t.home.bpm}</span>
            </div>
          </div>

          <div className="group relative rounded-[1.25rem] bg-gradient-to-b from-blue-500/10 to-transparent p-[1.5px]">
            <div className="relative h-full w-full bg-[#111728]/90 backdrop-blur-sm rounded-[1.2rem] border border-white/5 flex flex-col items-center justify-center py-6 px-4 shadow-2xl overflow-visible">
              <span className={`text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-bl from-white to-blue-400 drop-shadow-md leading-relaxed z-10 select-none ${!latest?.key ? 'opacity-20' : ''}`}>
                {latest?.key || "--"}
              </span>
              <span className="mt-2 text-[9px] font-bold text-slate-500 underline decoration-blue-500/20 underline-offset-4 tracking-[0.2em] uppercase select-none">{t.home.key}</span>
            </div>
          </div>
        </div>

        {latest && (
          <div className="mt-8 text-center animate-in fade-in slide-in-from-top-4 duration-1000 w-full flex justify-center">
            <button
              onClick={() => handleOpenFile(latest.filepath)}
              className="w-full max-w-lg relative flex items-center gap-3 bg-[#111728]/40 backdrop-blur-md border border-white/5 rounded-2xl p-2.5 pr-4 transition-all group/file hover:bg-white/[0.02] border-white/5"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-white/5 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-purple-400/70" />
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-base font-bold text-white truncate tracking-tight mb-0.5">
                  {latest.title}
                </h3>
                <p className="text-[10px] text-purple-400/60 font-bold uppercase tracking-[0.1em] truncate flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-purple-500/30" />
                  {latest.artist || "Unknown Artist"}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover/file:text-white group-hover/file:bg-purple-500/40 transition-all shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
