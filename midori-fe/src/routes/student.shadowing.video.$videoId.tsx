import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  X,
  Eye,
  EyeOff,
  Mic,
  Languages,
  Video,
  ArrowLeft,
  Layout,
  FileText,
  Heart,
  Info,
  Maximize,
  Minimize,
  Sliders,
  Sparkles,
  Headphones,
  ChevronRight,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi } from "@/lib/api/shadowing";
import { Loader2 } from "lucide-react";
import { getTopicVn } from "./student.shadowing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech?: string;
  example?: string;
  exampleMeaning?: string;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  romaji?: string;
  vocabulary: VocabularyItem[];
  grammar?: {
    grammar: string;
    meaning: string;
  };
}

type TranscriptMode = "japanese" | "vietnamese" | "both";

export const Route = createFileRoute("/student/shadowing/video/$videoId")({
  component: VideoLearningPage,
});

// Simple romaji mapper helper for demo purposes
function getDemoRomaji(text: string): string {
  const dict: Record<string, string> = {
    "こんにちは、みなさん。": "Konnichiwa, minasan.",
    "今日 は 日本での生活 について 話します。": "Kyou wa Nihon de no seikatsu ni tsuite hanashimasu.",
    "日本の生活はとても便利です。": "Nihon no seikatsu wa totemo benri desu.",
    "電車はいつも時間通りに来ます。": "Densha wa itsumo jikandoori ni kimasu.",
    "食べ物もおいしくて、種類がたくさんあります。": "Tabemono mo oishikute, shurui ga takusan arimasu.",
    "四季がはっきりしていて、景色ががきれいです。": "Shiki ga hakkiri shiteite, keshiki ga kirei desu.",
    "みなさん、こんにちは。": "Minasan, konnichiwa.",
    "日本語の勉強はどうですか。": "Nihongo no benkyo wa dou desu ka.",
    "毎日練習することが大切ですね。": "Mainichi renshuu suru koto ga taisetsu desu ne.",
  };
  
  // Clean text a bit
  const clean = text.trim();
  if (dict[clean]) return dict[clean];
  
  // Try partial match
  for (const key of Object.keys(dict)) {
    if (clean.includes(key) || key.includes(clean)) return dict[key];
  }

  return "";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function VideoLearningPage() {
  const params = Route.useParams();
  const videoId = params.videoId;
  const navigate = useNavigate();

  const [rawVideo, setRawVideo] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout and display states
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [transcriptEnabled, setTranscriptEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [transcriptMode, setTranscriptMode] = useState<TranscriptMode>("both");

  // Popup states
  const [showWordPopup, setShowWordPopup] = useState(false);
  const [showSentencePopup, setShowSentencePopup] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<TranscriptSegment | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const activeSentenceRef = useRef<HTMLDivElement>(null);

  const loadVideoAndTranscript = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [videoResult, transcriptResult] = await Promise.allSettled([
        studentShadowingApi.getVideo(videoId),
        studentShadowingApi.getTranscript(videoId),
      ]);

      if (videoResult.status === "rejected") {
        const message = (videoResult.reason as any)?.message || "Không thể tải thông tin video.";
        setError(message);
        return;
      }

      const v = videoResult.value;
      const t = transcriptResult.status === "fulfilled" ? transcriptResult.value : null;

      setRawVideo(v);
      setTranscript(t);
    } catch (err: any) {
      const message = err?.message || "Không thể tải thông tin video.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadVideoAndTranscript();
  }, [loadVideoAndTranscript]);

  const video = useMemo(() => {
    if (!rawVideo) return null;
    const segments: TranscriptSegment[] = (transcript?.segments ?? []).map((s: any, idx: number) => ({
      id: s.id || idx.toString(),
      startTime: s.startTime,
      endTime: s.endTime,
      text: s.jpText,
      translation: s.vnText || "",
      romaji: getDemoRomaji(s.jpText),
      vocabulary: (s.vocabList ?? []).map((v: any) => ({
        word: v.word,
        reading: v.reading || v.furigana || "",
        meaning: v.meaning,
        partOfSpeech: v.partOfSpeech || "",
        example: v.example || "",
        exampleMeaning: v.exampleMeaning || "",
      })),
      grammar: s.grammarPoint ? {
        grammar: s.grammarPoint.grammar,
        meaning: s.grammarPoint.meaning,
      } : undefined,
    }));

    return {
      id: rawVideo.id,
      title: rawVideo.title,
      description: rawVideo.description || "",
      videoUrl: rawVideo.videoUrl,
      thumbnail: rawVideo.thumbnailUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop",
      duration: rawVideo.duration || 0,
      jlptLevel: rawVideo.jlptLevel || "N5",
      topic: rawVideo.topic || "General",
      titleVn: rawVideo.topic || "General",
      script: segments
    };
  }, [rawVideo, transcript]);

  const topic = useMemo(() => {
    if (!rawVideo) return null;
    return {
      id: (rawVideo.topic || "General").toLowerCase().replace(/\s+/g, "-"),
      title: rawVideo.topic || "General",
      titleVn: getTopicVn(rawVideo.topic || "General"),
      jlptLevel: rawVideo.jlptLevel || "N5"
    };
  }, [rawVideo]);

  const activeSubtitle = useMemo(() => {
    if (!video || !video.script) return null;
    return video.script.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    );
  }, [video, currentTime]);

  const getCurrentSentenceIndex = useCallback(() => {
    if (!video || !video.script || video.script.length === 0) return -1;
    const idx = video.script.findIndex(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    );
    if (idx !== -1) return idx;
    for (let i = video.script.length - 1; i >= 0; i--) {
      if (currentTime >= video.script[i].startTime) {
        return i;
      }
    }
    return 0;
  }, [video, currentTime]);

  const currentIndex = getCurrentSentenceIndex();

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration || video?.duration || 0);
  };

  const handleSentenceClick = useCallback((s: TranscriptSegment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = s.startTime;
      setCurrentTime(s.startTime);
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleWordClick = useCallback((word: VocabularyItem, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setSelectedWord(word);
    setShowWordPopup(true);
    setShowSentencePopup(false);
  }, []);

  const handleDetailPopupOpen = useCallback((segment: TranscriptSegment, event: React.MouseEvent) => {
    event.stopPropagation(); // Stop from jumping the video
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 200),
      y: Math.max(rect.top - 10, 100),
    });
    setSelectedSegment(segment);
    setShowSentencePopup(true);
    setShowWordPopup(false);
  }, []);

  // Custom Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === videoContainerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Video tag playbackRate synchronization
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Click handler on custom player timeline
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const player = videoRef.current;
    if (!player || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const targetTime = clickPercent * duration;
    player.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const togglePlay = () => {
    const player = videoRef.current;
    if (!player) return;
    if (player.paused) {
      player.play().catch(() => {});
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const player = videoRef.current;
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cyclePlaybackRate = () => {
    const rates = [0.8, 1.0, 1.2, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIdx]);
  };

  const toggleFullscreen = () => {
    const container = videoContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowWordPopup(false);
        setShowSentencePopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  const handleStartShadowing = () => {
    navigate({ to: "/student/shadowing/practice/$videoId", params: { videoId } });
  };

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    loadVideoAndTranscript();
  }, [loadVideoAndTranscript]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Không thể tải video</h3>
          <p className="text-sm text-white/60 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!video || !topic) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Video not found</h3>
          <p className="text-sm text-white/60 mb-4">The video you're looking for doesn't exist.</p>
          <Link
            to="/student/shadowing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Shadowing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col pb-12">
      <SakuraBg count={14} />
      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Section (Mockup Matching) */}
        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/student/shadowing"
              className="px-3.5 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-display font-black text-slate-800 dark:text-white leading-tight flex items-center gap-1">
                Bài học: {video.title}
                <Info className="w-4 h-4 text-muted-foreground opacity-60 shrink-0 cursor-help" />
              </h1>
              <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 text-[10px] py-0 px-2 rounded-full font-bold">
                JLPT {video.jlptLevel}
              </Badge>
            </div>
          </div>

          {/* Toolbar Controls */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {/* Toggle Transcript Panel */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTranscriptEnabled(!transcriptEnabled)}
              className={cn(
                "rounded-xl h-9 px-3.5 font-bold border-slate-200 dark:border-white/10 transition flex items-center gap-1.5 text-xs cursor-pointer",
                transcriptEnabled
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                  : "bg-white/40 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground"
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              {transcriptEnabled ? "Ẩn danh sách" : "Hiện danh sách"}
            </Button>

            {/* Luyện Shadowing Button */}
            <Button
              onClick={handleStartShadowing}
              className="rounded-xl h-9 px-4 font-black bg-gradient-hero text-white hover:opacity-95 shadow-md transition flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Headphones className="w-4 h-4" />
              Luyện Shadowing
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={cn(
          "grid gap-6 items-start",
          transcriptEnabled ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 max-w-4xl mx-auto"
        )}>
          
          {/* Left Column: Video Player */}
          <div className={cn(
            transcriptEnabled ? "lg:col-span-8" : "w-full"
          )}>
            
            {/* Custom Styled Video Player Container */}
            <div
              ref={videoContainerRef}
              className={cn(
                "relative w-full overflow-hidden bg-[#0f172a] border border-slate-800/80 shadow-2xl flex flex-col transition-all duration-150 group",
                isFullscreen ? "w-screen h-screen rounded-none border-0" : "aspect-video rounded-3xl"
              )}
            >
              <video
                ref={videoRef}
                src={video.videoUrl}
                poster={video.thumbnail}
                className="flex-1 w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onCanPlay={(e) => {
                  e.currentTarget.playbackRate = playbackRate;
                }}
                controls={false}
              />

              {/* CUSTOM PLAYER CONTROL BAR */}
              <div className="bg-[#0b0f19]/95 border-t border-slate-850 px-4 py-3 flex flex-col gap-2 shrink-0 select-none">
                {/* Timeline and Sentence Markers */}
                <div
                  onClick={handleTimelineClick}
                  className="relative w-full h-1.5 bg-slate-800 rounded-full cursor-pointer hover:h-2 transition-all flex items-center"
                >
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  {/* Yellow timeline dots markers */}
                  {duration > 0 && video.script.map((s, idx) => {
                    const pct = (s.startTime / duration) * 100;
                    const isPassed = currentTime >= s.startTime;
                    return (
                      <button
                        key={s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSentenceClick(s);
                        }}
                        style={{ left: `${pct}%` }}
                        className={cn(
                          "absolute w-2 h-2 rounded-full -translate-x-1/2 border transition-all duration-150 cursor-pointer",
                          idx === currentIndex
                            ? "bg-primary border-white scale-125 z-20 shadow-md shadow-primary"
                            : isPassed
                            ? "bg-amber-400 border-amber-500 scale-100 hover:scale-110"
                            : "bg-slate-400 border-slate-500 hover:bg-white"
                        )}
                        title={`Câu ${idx + 1}`}
                      />
                    );
                  })}
                </div>

                {/* Bottom row controls */}
                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={togglePlay}
                      className="hover:text-primary transition p-1 cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-slate-300 hover:fill-primary" />
                      ) : (
                        <Play className="w-4 h-4 fill-slate-300 hover:fill-primary" />
                      )}
                    </button>

                    <button
                      onClick={toggleMute}
                      className="hover:text-primary transition p-1 cursor-pointer"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>

                    <span className="text-xs font-mono font-medium select-none">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 text-xs">
                    <button
                      onClick={cyclePlaybackRate}
                      className="font-mono font-black border border-slate-700/80 px-2 py-0.5 rounded-lg hover:border-slate-500 transition cursor-pointer"
                    >
                      {playbackRate.toFixed(1)}x
                    </button>

                    <button
                      onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                      className={cn(
                        "p-1 hover:text-primary transition cursor-pointer",
                        subtitlesEnabled ? "text-primary" : "text-slate-400"
                      )}
                      title="Hiện/Ẩn phụ đề"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setTranscriptMode(transcriptMode === "both" ? "japanese" : "both")}
                      className="hover:text-primary transition p-1 cursor-pointer"
                      title="Chỉnh ngôn ngữ hiển thị"
                    >
                      <Sliders className="w-4 h-4" />
                    </button>

                    <button
                      onClick={toggleFullscreen}
                      className="hover:text-primary transition p-1 cursor-pointer"
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4" />
                      ) : (
                        <Maximize className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtitle Overlay (Modern Blurred Glass Style) */}
              {subtitlesEnabled && activeSubtitle && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[85%] bg-slate-950/70 dark:bg-black/60 backdrop-blur-md border border-white/10 px-6 py-3.5 rounded-2xl text-white text-center shadow-2xl select-none pointer-events-none z-10 transition-all duration-150 leading-normal">
                  {(transcriptMode === "japanese" || transcriptMode === "both") && (
                    <div className="text-lg md:text-2xl font-extrabold tracking-wide text-white leading-normal">{activeSubtitle.text}</div>
                  )}
                  {(transcriptMode === "vietnamese" || transcriptMode === "both") && activeSubtitle.translation && (
                    <div className={cn(
                      "text-xs md:text-sm text-slate-200/90 font-medium tracking-normal",
                      transcriptMode === "both" && "mt-1.5 border-t border-white/10 pt-1"
                    )}>
                      {activeSubtitle.translation}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Transcript Panel */}
          {transcriptEnabled && (
            <div className="flex flex-col border border-slate-200/60 dark:border-white/10 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden h-[450px] lg:h-full min-h-[400px] w-full lg:col-span-4 shadow-sm">
              {/* Panel Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3.5 border-b border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/20 gap-2 shrink-0">
                <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-primary" />
                  Danh sách câu
                </span>

                {/* Language Filter Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl p-0.5">
                  <button
                    onClick={() => setTranscriptMode("japanese")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer",
                      transcriptMode === "japanese"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-slate-800 dark:hover:text-white"
                    )}
                  >
                    Nhật
                  </button>
                  <button
                    onClick={() => setTranscriptMode("vietnamese")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer",
                      transcriptMode === "vietnamese"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-slate-800 dark:hover:text-white"
                    )}
                  >
                    Việt
                  </button>
                  <button
                    onClick={() => setTranscriptMode("both")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer",
                      transcriptMode === "both"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-slate-800 dark:hover:text-white"
                    )}
                  >
                    Cả hai
                  </button>
                </div>
              </div>

              {/* Transcript List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {video.script.length > 0 ? (
                  video.script.map((segment, index) => {
                    const isActive = currentIndex === index;
                    return (
                      <div
                        key={segment.id}
                        ref={isActive ? activeSentenceRef : null}
                        onClick={() => handleSentenceClick(segment)}
                        className={cn(
                          "p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative group flex items-start gap-3",
                          isActive
                            ? "bg-primary/10 border-primary/20 shadow-sm shadow-primary/5 border-l-4 border-l-primary"
                            : "hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:border-slate-200 border-transparent dark:hover:border-white/5"
                        )}
                      >
                        {/* Order & Circular Play Icon */}
                        <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-bold">
                            {index + 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSentenceClick(segment);
                            }}
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center border transition shadow-xs cursor-pointer",
                              isActive
                                ? "bg-primary border-primary text-white"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-primary/40 hover:text-primary"
                            )}
                          >
                            <Play className="w-3 h-3 ml-0.5 fill-current" />
                          </button>
                        </div>

                        {/* Content text (Japanese + Romaji/translation) */}
                        <div className="flex-1 min-w-0">
                          {/* Japanese */}
                          {(transcriptMode === "japanese" || transcriptMode === "both") && (
                            <div
                              className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-relaxed"
                              style={{ fontFamily: "var(--font-japanese, serif)" }}
                            >
                              {segment.text
                                .split(/([^\s。、！？「」『』（）〔〕【】]+)/g)
                                .map((part, i) => {
                                  const vocab = segment.vocabulary.find((v) => v.word === part);
                                  if (vocab) {
                                    return (
                                      <span
                                        key={i}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleWordClick(vocab, e);
                                        }}
                                        className="inline-block px-0.5 py-0.5 -mx-0.5 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition cursor-pointer underline decoration-dotted underline-offset-2"
                                      >
                                        {part}
                                      </span>
                                    );
                                  }
                                  return part;
                                })}
                            </div>
                          )}

                          {/* Romaji display */}
                          {transcriptMode === "both" && segment.romaji && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-relaxed font-sans opacity-80">
                              {segment.romaji}
                            </div>
                          )}

                          {/* Vietnamese Translation */}
                          {(transcriptMode === "vietnamese" || transcriptMode === "both") && segment.translation && (
                            <div className={cn(
                              "text-xs leading-relaxed mt-0.5",
                              transcriptMode === "both" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-600 dark:text-slate-300"
                            )}>
                              {segment.translation}
                            </div>
                          )}
                        </div>

                        {/* Timestamp & details clicker */}
                        <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono font-bold">
                            {formatTime(segment.startTime)}
                          </span>

                          <button
                            onClick={(e) => handleDetailPopupOpen(segment, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-primary transition p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Chi tiết câu & ngữ pháp"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground text-center p-4">
                    Không có transcript cho video này.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Word Popup */}
      <AnimatePresence>
        {showWordPopup && selectedWord && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50"
            style={{
              left: popupPosition.x,
              top: popupPosition.y,
              transform: "translate(-50%, -100%)",
            }}
            ref={popupRef}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/20 p-4 w-72">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4
                    className="text-lg font-bold text-slate-800 dark:text-white"
                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                  >
                    {selectedWord.word}
                  </h4>
                  <p className="text-sm text-muted-foreground">[{selectedWord.reading}]</p>
                </div>
                <button
                  onClick={() => setShowWordPopup(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                {selectedWord.partOfSpeech && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium">
                    {selectedWord.partOfSpeech}
                  </span>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedWord.meaning}</p>
                {selectedWord.example && (
                  <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs">
                    <p
                      className="text-slate-600 dark:text-slate-400 font-medium"
                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                    >
                      {selectedWord.example}
                    </p>
                    {selectedWord.exampleMeaning && (
                      <p className="text-muted-foreground mt-1 italic">{selectedWord.exampleMeaning}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-white/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sentence Popup */}
      <AnimatePresence>
        {showSentencePopup && selectedSegment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50"
            style={{
              left: popupPosition.x,
              top: popupPosition.y,
              transform: "translate(-50%, -100%)",
              maxWidth: "400px",
            }}
            ref={popupRef}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/20 p-4 w-96 max-h-[450px] overflow-y-auto scrollbar-thin">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {video.script.findIndex((s) => s.id === selectedSegment.id) + 1}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-white">Chi tiết câu</h4>
                </div>
                <button
                  onClick={() => setShowSentencePopup(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Original Sentence */}
              <div
                className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-3 border border-slate-100 dark:border-white/5"
                style={{ fontFamily: "var(--font-japanese, serif)" }}
              >
                <p className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">{selectedSegment.text}</p>
                <p className="text-xs text-muted-foreground mt-1 italic">{selectedSegment.translation}</p>
              </div>

              {/* Grammar */}
              {selectedSegment.grammar && (
                <div className="mb-3">
                  <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">
                    Ngữ pháp
                  </h5>
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-lg">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {selectedSegment.grammar.grammar}
                    </p>
                    <p className="text-[11px] text-purple-500 dark:text-purple-300 mt-0.5">
                      {selectedSegment.grammar.meaning}
                    </p>
                  </div>
                </div>
              )}

              {/* Vocabulary */}
              {selectedSegment.vocabulary && selectedSegment.vocabulary.length > 0 ? (
                <div>
                  <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">
                    Từ vựng ({selectedSegment.vocabulary.length})
                  </h5>
                  <div className="space-y-1">
                    {selectedSegment.vocabulary.map((vocab, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div>
                          <span
                            className="text-sm font-semibold text-slate-800 dark:text-white"
                            style={{ fontFamily: "var(--font-japanese, serif)" }}
                          >
                            {vocab.word}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1.5 font-medium">
                            [{vocab.reading}]
                          </span>
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 text-right">
                          {vocab.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic text-center py-2">
                  Không có từ vựng riêng lẻ cho câu này. Click vào từ trong câu để xem nghĩa.
                </div>
              )}
            </div>
            <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-white/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
