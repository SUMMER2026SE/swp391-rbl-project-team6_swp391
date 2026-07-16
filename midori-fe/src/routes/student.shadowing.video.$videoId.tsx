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
  BookOpen,
  MessageSquare,
  BarChart2,
  Tag,
  AlignLeft,
  Bookmark,
  Loader2,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi } from "@/lib/api/shadowing";
import { dictionaryApi } from "@/lib/api/dictionary";
import { studentGrammarPatternApi, type GrammarPatternSummary, type GrammarPatternDetail } from "@/lib/api/studentGrammarPattern";
import { getTopicVn } from "./student.shadowing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSavedWords } from "@/components/word-popup";
import { ClickableTranscript } from "@/components/clickable-transcript";

export interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech?: string;
  example?: string;
  exampleMeaning?: string;
}

export interface TranscriptTokenItem {
  surface: string;
  lemma?: string;
  reading?: string;
  partOfSpeech?: string;
  position?: number;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  romaji?: string;
  vocabulary: VocabularyItem[];
  tokens?: TranscriptTokenItem[];
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
  const [activeTab, setActiveTab] = useState<"transcript" | "vocabulary" | "grammar">("transcript");
  const [vocabFilter, setVocabFilter] = useState<"grammar" | "saved">("grammar");

  // Grammar tab state
  const [grammarPatterns, setGrammarPatterns] = useState<GrammarPatternSummary[]>([]);
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [grammarFetched, setGrammarFetched] = useState(false);
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarPatternDetail | null>(null);
  const [grammarDetailLoading, setGrammarDetailLoading] = useState(false);
  const [showGrammarModal, setShowGrammarModal] = useState(false);

  const [grammarError, setGrammarError] = useState<string | null>(null);

  const loadGrammarPatterns = useCallback(async () => {
    if (grammarFetched || grammarLoading) return;
    setGrammarLoading(true);
    setGrammarError(null);
    try {
      const patterns = await studentGrammarPatternApi.getForVideo(videoId);
      setGrammarPatterns(patterns);
    } catch (err: any) {
      const isAuthError = err?.status === 403 || err?.status === 401;
      setGrammarError(
        isAuthError
          ? "Vui lòng đăng nhập để xem ngữ pháp."
          : "Không thể tải ngữ pháp. Vui lòng thử lại."
      );
      setGrammarPatterns([]);
    } finally {
      setGrammarLoading(false);
      setGrammarFetched(true);
    }
  }, [videoId, grammarFetched, grammarLoading]);

  const openGrammarDetail = useCallback(async (pattern: GrammarPatternSummary) => {
    setShowGrammarModal(true);
    setSelectedGrammar(null);
    setGrammarDetailLoading(true);
    try {
      const detail = await studentGrammarPatternApi.getDetail(pattern.id, videoId);
      setSelectedGrammar(detail);
    } catch {
      setSelectedGrammar(null);
    } finally {
      setGrammarDetailLoading(false);
    }
  }, [videoId]);
  
  // Use global saved words hook
  const { savedWords: globalSavedWords, isWordSaved: isGlobalWordSaved, saveWord: globalSaveWord, removeWord: globalRemoveWord } = useSavedWords();
  
  const handleToggleSaveFromList = useCallback((vocabWord: string, vocabReading: string, vocabMeaning: string) => {
    if (isGlobalWordSaved(vocabWord, vocabReading)) {
      globalRemoveWord(vocabWord, vocabReading);
    } else {
      globalSaveWord({ word: vocabWord, reading: vocabReading, meaning: vocabMeaning, savedAt: new Date().toISOString() });
    }
  }, [isGlobalWordSaved, globalSaveWord, globalRemoveWord]);

  // Popup states
  const [showSentencePopup, setShowSentencePopup] = useState(false);
  const [showWordPopup, setShowWordPopup] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<TranscriptSegment | null>(null);
  const [resolvedMeanings, setResolvedMeanings] = useState<Record<string, string>>({});
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!selectedSegment) return;
    
    selectedSegment.vocabulary.forEach(async (vocab) => {
      const wordKey = vocab.word;
      try {
        const result = await dictionaryApi.lookupWord({
          word: wordKey
        });
        
        if (result) {
          let meaning = "";
          if (result.contextMeaning && result.contextMeaning.trim()) {
            meaning = result.contextMeaning;
          } else if (result.primaryMeaning && result.primaryMeaning.trim()) {
            meaning = result.primaryMeaning;
          } else if (result.meanings && result.meanings.length > 0) {
            meaning = result.meanings.join("; ");
          }
          
          if (meaning.trim()) {
            setResolvedMeanings(prev => {
              if (prev[wordKey] === meaning) return prev;
              return {
                ...prev,
                [wordKey]: meaning
              };
            });
          }
        }
      } catch (err) {
        console.error("Failed to lookup word in shadowing popup:", wordKey, err);
      }
    });
  }, [selectedSegment]);

  const video = useMemo(() => {
    if (!rawVideo) return null;
    const segments: TranscriptSegment[] = (transcript?.segments ?? []).map((s: any, idx: number) => {
      const listVocab = (s.vocabList ?? []).map((v: any) => ({
        word: v.word,
        reading: v.reading || v.furigana || "",
        meaning: v.meaning,
        partOfSpeech: v.partOfSpeech || "",
        example: v.example || "",
        exampleMeaning: v.exampleMeaning || "",
      }));
      const tokenVocab = (s.tokens ?? [])
        .filter((t: any) => {
          const surface = t.surface || "";
          const isPunctuation = /^[\s\p{P}\p{S}、。！？「」『』（）]+$/u.test(surface);
          return !isPunctuation;
        })
        .map((t: any) => ({
          word: t.surface || t.lemma || "",
          reading: t.reading || t.lemma || "",
          meaning: "",
          partOfSpeech: t.partOfSpeech || "",
          example: "",
          exampleMeaning: "",
        }));
      const seen = new Set<string>();
      const vocabulary: VocabularyItem[] = [];
      for (const v of [...listVocab, ...tokenVocab]) {
        if (!seen.has(v.word)) {
          seen.add(v.word);
          vocabulary.push(v);
        }
      }

      return {
        id: s.id || idx.toString(),
        startTime: s.startTime,
        endTime: s.endTime,
        text: s.jpText,
        translation: s.vnText || "",
        romaji: getDemoRomaji(s.jpText),
        vocabulary,
        tokens: Array.isArray(s.tokens) ? s.tokens : [],
        grammar: s.grammarPoint ? {
          grammar: s.grammarPoint.grammar,
          meaning: s.grammarPoint.meaning,
        } : undefined,
      };
    });

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

  // Collect all grammar points from all segments (deduplicated)
  const allGrammar = useMemo(() => {
    if (!video || !video.script) return [];
    const seen = new Set<string>();
    const result: { grammar: string; meaning: string; segmentIndex: number }[] = [];
    video.script.forEach((seg, idx) => {
      if (seg.grammar && seg.grammar.grammar) {
        const key = seg.grammar.grammar;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            grammar: seg.grammar.grammar,
            meaning: seg.grammar.meaning,
            segmentIndex: idx,
          });
        }
      }
    });
    return result;
  }, [video]);

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

  const handleDetailPopupOpen = useCallback((segment: TranscriptSegment, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const popupWidth = 384; // Approximate popup width
    const popupHeight = 450;

    // Position below the button, centered
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 10;

    // Clamp x to keep popup within viewport (popup is centered on x due to translate)
    const halfWidth = popupWidth / 2;
    x = Math.max(halfWidth + 16, Math.min(x, window.innerWidth - halfWidth - 16));

    // If popup would go off bottom of screen, show above the button instead
    if (y + popupHeight > window.innerHeight - 20) {
      y = rect.top - popupHeight - 10;
    }

    setPopupPosition({ x, y });
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
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
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
    <div className="relative flex flex-col bg-transparent">

      {/* ── TOP BREADCRUMB BAR ─────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link
              to="/student/shadowing"
              className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-primary transition font-medium shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Shadowing</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link
              to="/student/shadowing/topic/$topicId"
              params={{ topicId: topic.id }}
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition font-medium truncate hidden sm:inline"
            >
              {topic.titleVn || topic.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
            <span className="text-slate-700 dark:text-slate-200 font-semibold truncate max-w-[200px] lg:max-w-[360px]">
              {video.title}
            </span>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn(
                "w-8 h-8 rounded-lg border flex items-center justify-center transition",
                isFavorite
                  ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-700/40"
                  : "border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-400 hover:border-red-200 dark:hover:border-red-700/40"
              )}
              title="Yêu thích"
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </button>
            <Button
              onClick={handleStartShadowing}
              className="rounded-xl h-9 px-4 font-black bg-gradient-hero text-white hover:opacity-90 shadow-md transition flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Headphones className="w-4 h-4" />
              <span className="hidden sm:inline">Luyện Shadowing</span>
              <span className="sm:hidden">Luyện</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className={cn(
          "grid gap-5",
          transcriptEnabled
            ? "grid-cols-1 xl:grid-cols-[1fr_320px]"
            : "grid-cols-1 max-w-4xl mx-auto"
        )}>

          {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* VIDEO PLAYER CARD */}
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200/70 dark:border-white/10 bg-[#0b0f19]">
              {/* Video container */}
              <div
                ref={videoContainerRef}
                className={cn(
                  "relative w-full bg-[#0b0f19] group",
                  isFullscreen ? "fixed inset-0 z-100" : ""
                )}
                style={{ aspectRatio: "16/9" }}
              >
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  poster={video.thumbnail}
                  className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onCanPlay={(e) => { e.currentTarget.playbackRate = playbackRate; }}
                  controls={false}
                />

                {/* Big play overlay (center) */}
                <AnimatePresence>
                  {!isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Subtitle overlay */}
                {subtitlesEnabled && activeSubtitle && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[85%] text-center pointer-events-none z-10 flex flex-col gap-1.5 justify-center items-center">
                    {(transcriptMode === "japanese" || transcriptMode === "both") && (
                      <div 
                        className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-white leading-normal pointer-events-auto"
                        style={{ 
                          textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)",
                          fontFamily: "var(--font-japanese, serif)"
                        }}
                      >
                        <ClickableTranscript
                          text={activeSubtitle.text}
                          contextSentence={activeSubtitle.text}
                          tokens={activeSubtitle.tokens}
                          className="inline-block"
                        />
                      </div>
                    )}
                    {(transcriptMode === "vietnamese" || transcriptMode === "both") && activeSubtitle.translation && (
                      <div 
                        className="text-xs sm:text-sm md:text-base text-yellow-300 font-semibold tracking-wide leading-normal"
                        style={{ 
                          textShadow: "0 1.5px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)"
                        }}
                      >
                        {activeSubtitle.translation}
                      </div>
                    )}
                  </div>
                )}

                {/* CUSTOM CONTROL BAR */}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent px-4 pt-8 pb-3 flex flex-col gap-2">
                  {/* Timeline */}
                  <div
                    onClick={handleTimelineClick}
                    className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer hover:h-1.5 transition-all flex items-center group/timeline"
                  >
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                    {/* Sentence markers */}
                    {duration > 0 && video.script.map((s, idx) => {
                      const pct = (s.startTime / duration) * 100;
                      const isPassed = currentTime >= s.startTime;
                      return (
                        <button
                          key={s.id}
                          onClick={(e) => { e.stopPropagation(); handleSentenceClick(s); }}
                          style={{ left: `${pct}%` }}
                          className={cn(
                            "absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 border transition-all duration-150 cursor-pointer",
                            idx === currentIndex
                              ? "bg-primary border-white scale-150 z-20 shadow-md shadow-primary"
                              : isPassed
                              ? "bg-amber-400 border-amber-500"
                              : "bg-white/40 border-white/30 hover:bg-white"
                          )}
                          title={`Câu ${idx + 1}`}
                        />
                      );
                    })}
                  </div>

                  {/* Controls row */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="hover:text-primary transition p-1 cursor-pointer">
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-white hover:fill-primary" />
                        ) : (
                          <Play className="w-5 h-5 fill-white hover:fill-primary" />
                        )}
                      </button>
                      <button onClick={toggleMute} className="hover:text-primary transition p-1 cursor-pointer">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <span className="text-xs font-mono text-white/70 select-none">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {/* Speed */}
                      <div className="relative" ref={speedMenuRef}>
                        <button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="font-mono font-bold text-white/70 hover:text-white border border-white/20 px-2 py-0.5 rounded-md transition cursor-pointer text-[11px]"
                        >
                          {playbackRate.toFixed(2)}x
                        </button>
                        {showSpeedMenu && (
                          <div className="absolute bottom-8 right-0 bg-slate-900/95 border border-white/10 rounded-xl py-1 shadow-2xl z-50 min-w-[80px] backdrop-blur-md">
                            {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => { setPlaybackRate(rate); setShowSpeedMenu(false); }}
                                className={cn(
                                  "w-full px-3 py-1.5 text-[11px] font-bold font-mono text-left hover:bg-white/10 hover:text-white transition cursor-pointer text-white/70",
                                  playbackRate === rate && "text-primary bg-primary/10"
                                )}
                              >
                                {rate.toFixed(2)}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Subtitle toggle */}
                      <button
                        onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                        className={cn(
                          "p-1 transition cursor-pointer rounded",
                          subtitlesEnabled ? "text-primary" : "text-white/50 hover:text-white"
                        )}
                        title="Phụ đề"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Fullscreen */}
                      <button onClick={toggleFullscreen} className="p-1 hover:text-primary transition cursor-pointer text-white/70">
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIDEO INFO BAR (below video, inside card) */}
              <div className="px-5 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] px-2 py-0 rounded-full font-bold shrink-0">
                      JLPT {video.jlptLevel}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-full text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 font-medium shrink-0">
                      <Tag className="w-2.5 h-2.5 mr-1" />
                      {topic.titleVn || topic.title}
                    </Badge>
                    {video.script.length > 0 && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-full text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 font-medium shrink-0">
                        <AlignLeft className="w-2.5 h-2.5 mr-1" />
                        {video.script.length} câu
                      </Badge>
                    )}
                    {duration > 0 && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-full text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 font-medium shrink-0">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {formatTime(duration)}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-base font-bold text-slate-800 dark:text-white leading-snug truncate">
                    {video.title}
                  </h1>
                  {video.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{video.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTranscriptEnabled(!transcriptEnabled)}
                    className={cn(
                      "rounded-xl h-8 px-3 font-bold border text-xs transition",
                      transcriptEnabled
                        ? "bg-primary/8 text-primary border-primary/20 hover:bg-primary/12"
                        : "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    )}
                  >
                    <Sliders className="w-3.5 h-3.5 mr-1" />
                    {transcriptEnabled ? "Ẩn bảng" : "Hiện bảng"}
                  </Button>
                </div>
              </div>
            </div>

            {/* ── VIDEO DESCRIPTION / INFO CARDS (below video) ─────── */}
            {video.description && (
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary" />
                  Giới thiệu bài học
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}

            {/* ── NEXT STEP CALL-TO-ACTION ─────────────────────────── */}
            <div className="rounded-2xl border border-primary/20 dark:border-primary/30 bg-linear-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black text-primary">Sẵn sàng luyện tập?</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Xem xong video, hãy thử luyện Shadowing để cải thiện phát âm và ngữ điệu của bạn ngay!
                </p>
              </div>
              <Button
                onClick={handleStartShadowing}
                className="rounded-xl h-10 px-5 font-black bg-gradient-hero text-white hover:opacity-90 shadow-md transition flex items-center gap-2 text-sm cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <Headphones className="w-4 h-4" />
                Bắt đầu Shadowing
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ── RIGHT COLUMN: PANEL ────────────────────────────────────── */}
          {transcriptEnabled && (
            <div className="flex flex-col rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm overflow-hidden"
              style={{ height: "calc(100vh - 160px)", position: "sticky", top: "80px" }}
            >
              {/* Panel Tab Bar */}
              <div className="flex border-b border-slate-200/60 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/30 shrink-0">
                {
                  [
                    { key: "transcript", label: "Transcript", icon: <AlignLeft className="w-3.5 h-3.5" /> },
                    { key: "vocabulary", label: "Từ vựng", icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { key: "grammar", label: "Ngữ pháp", icon: <Sparkles className="w-3.5 h-3.5" /> },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key as any);
                        if (tab.key === "grammar") loadGrammarPatterns();
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold transition cursor-pointer border-b-2",
                        activeTab === tab.key
                          ? "border-primary text-primary bg-white/50 dark:bg-slate-900/50"
                          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      )}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline xl:inline">{tab.label}</span>
                      {tab.key === "grammar" && grammarPatterns.length > 0 && (
                        <span className="ml-0.5 bg-primary/15 text-primary rounded-full text-[9px] font-bold px-1.5 py-0.5">{grammarPatterns.length}</span>
                      )}
                    </button>
                  ))}
              </div>

              {/* ── TRANSCRIPT TAB ──────────────────────────────────── */}
              {activeTab === "transcript" && (
                <>
                  {/* Language filter */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-white/8 shrink-0 gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {video.script.length} câu
                    </span>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-lg p-0.5 gap-0.5">
                      {(["japanese", "vietnamese", "both"] as TranscriptMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setTranscriptMode(mode)}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer",
                            transcriptMode === mode
                              ? "bg-primary text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          )}
                        >
                          {mode === "japanese" ? "日本語" : mode === "vietnamese" ? "Việt" : "Cả hai"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sentence list */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                    {video.script.length > 0 ? (
                      video.script.map((segment, index) => {
                        const isActive = currentIndex === index;
                        return (
                          <div
                            key={segment.id}
                            ref={isActive ? activeSentenceRef : null}
                            onClick={() => handleSentenceClick(segment)}
                            className={cn(
                              "p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3 group",
                              isActive
                                ? "bg-primary/8 border-primary/25 border-l-[3px] border-l-primary shadow-sm"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-white/8"
                            )}
                          >
                            {/* Index & play */}
                            <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                              <span className="text-[9px] text-slate-400 font-bold">{index + 1}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSentenceClick(segment); }}
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center border transition cursor-pointer",
                                  isActive
                                    ? "bg-primary border-primary text-white"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-400 hover:border-primary/50 hover:text-primary"
                                )}
                              >
                                <Play className="w-2.5 h-2.5 ml-0.5 fill-current" />
                              </button>
                            </div>

                            {/* Text content */}
                            <div className="flex-1 min-w-0">
                              {(transcriptMode === "japanese" || transcriptMode === "both") && (
                                <ClickableTranscript
                                  text={segment.text}
                                  contextSentence={segment.text}
                                  tokens={segment.tokens}
                                  className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-relaxed"
                                />
                              )}
                              {transcriptMode === "both" && segment.romaji && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-relaxed">
                                  {segment.romaji}
                                </div>
                              )}
                              {(transcriptMode === "vietnamese" || transcriptMode === "both") && segment.translation && (
                                <div className={cn(
                                  "text-[11px] leading-relaxed mt-0.5",
                                  transcriptMode === "both"
                                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                    : "text-slate-600 dark:text-slate-300"
                                )}>
                                  {segment.translation}
                                </div>
                              )}
                            </div>

                            {/* Timestamp & detail */}
                            <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-1.5">
                              <span className="text-[9px] text-slate-400 font-mono font-bold">
                                {formatTime(segment.startTime)}
                              </span>
                              <button
                                onClick={(e) => handleDetailPopupOpen(segment, e)}
                                className="opacity-0 group-hover:opacity-100 hover:text-primary transition p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Chi tiết câu & ngữ pháp"
                              >
                                <FileText className="w-3 h-3 text-slate-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3 text-slate-400">
                        <AlignLeft className="w-8 h-8 opacity-30" />
                        <p className="text-xs">Không có transcript cho video này.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── VOCABULARY TAB ──────────────────────────────────── */}
              {activeTab === "vocabulary" && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Sub-tabs for grammar vs saved */}
                  <div className="flex border-b border-slate-100 dark:border-white/5 p-1 gap-1 bg-slate-50/80 dark:bg-slate-800/20 shrink-0">
                    <button
                      onClick={() => setVocabFilter("grammar")}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer text-center",
                        vocabFilter === "grammar"
                          ? "bg-white dark:bg-slate-900/60 text-primary shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      Ngữ pháp ({allGrammar.length})
                    </button>
                    <button
                      onClick={() => setVocabFilter("saved")}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-center",
                        vocabFilter === "saved"
                          ? "bg-white dark:bg-slate-900/60 text-primary shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      <Bookmark className={cn("w-3 h-3", vocabFilter === "saved" && "fill-current")} />
                      Đã lưu ({globalSavedWords.length})
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                    {vocabFilter === "grammar" ? (
                      allGrammar.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3 text-slate-400">
                          <BookOpen className="w-8 h-8 opacity-30" />
                          <p className="text-xs">Không có ngữ pháp nào được gắn thẻ trong video này.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {allGrammar.map((grammar, i) => (
                            <div
                              key={`${grammar.grammar}-${i}`}
                              onClick={() => handleSentenceClick(video.script[grammar.segmentIndex])}
                              className="p-3 rounded-xl border border-slate-100 dark:border-white/8 bg-white/60 dark:bg-slate-800/30 hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex flex-col gap-1 text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                  {grammar.grammar}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {formatTime(video.script[grammar.segmentIndex].startTime)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {grammar.meaning}
                              </p>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      globalSavedWords.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3 text-slate-400">
                          <Bookmark className="w-8 h-8 opacity-30" />
                          <p className="text-xs">Chưa có từ vựng nào được lưu.<br />Bấm vào các từ trong Transcript để lưu.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {globalSavedWords.map((vocab, i) => {
                            const vocabWord = vocab.word;
                            const vocabReading = vocab.reading;
                            const vocabMeaning = vocab.meaning;
                            const saved = isGlobalWordSaved(vocabWord, vocabReading);
                            return (
                              <div
                                key={`${vocabWord}-${i}`}
                                className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/8 bg-white/60 dark:bg-slate-800/30 hover:border-primary/20 transition group cursor-default text-left"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className="text-sm font-bold text-slate-800 dark:text-white"
                                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                                    >
                                      {vocabWord}
                                    </span>
                                    {vocabReading && (
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                        [{vocabReading}]
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{vocabMeaning}</p>
                                </div>

                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleSaveFromList(vocabWord, vocabReading, vocabMeaning); }}
                                  className={cn(
                                    "p-1.5 rounded-lg border transition-all cursor-pointer",
                                    saved
                                      ? "bg-amber-50 border-amber-200 text-amber-500 dark:bg-amber-950/20 dark:border-amber-900/30"
                                      : "border-slate-100 hover:border-slate-300 text-slate-400 hover:text-slate-600 dark:border-transparent dark:hover:border-white/10 dark:hover:text-white"
                                  )}
                                  title={saved ? "Bỏ lưu từ" : "Lưu từ"}
                                >
                                  <Bookmark className={cn("w-3.5 h-3.5", saved && "fill-current")} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* ── GRAMMAR TAB ─────────────────────────────────────── */}
              {activeTab === "grammar" && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-white/8 shrink-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      {grammarLoading ? "Đang tải..." : `${grammarPatterns.length} mẫu ngữ pháp`}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                    {grammarLoading ? (
                      // Skeleton loading
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-white/8 bg-white/60 dark:bg-slate-800/30 animate-pulse">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700/60 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : grammarError ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3 text-slate-400">
                        <Sparkles className="w-8 h-8 opacity-30" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">{grammarError}</p>
                      </div>
                    ) : grammarPatterns.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3 text-slate-400">
                        <Sparkles className="w-8 h-8 opacity-30" />
                        <p className="text-xs">Không phát hiện mẫu ngữ pháp trong video này.</p>
                      </div>
                    ) : (
                      grammarPatterns.map((gp) => (
                        <motion.button
                          key={gp.id}
                          onClick={() => openGrammarDetail(gp)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full text-left p-3.5 rounded-2xl border border-slate-100 dark:border-white/8 bg-white/70 dark:bg-slate-800/40 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all shadow-sm cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            {gp.jlptLevel && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm">
                                {gp.jlptLevel}
                              </span>
                            )}
                            <span className="text-sm font-bold text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                              {gp.pattern}
                            </span>
                            {gp.meaningViAvailable && (
                              <span className="ml-auto text-[9px] text-emerald-500 dark:text-emerald-400 font-bold">🇻🇳</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-1">
                            {gp.meaningVi || gp.meaningEn || ""}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition">
                            <BookOpen className="w-3 h-3" />
                            Xem chi tiết
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── SENTENCE DETAIL POPUP ──────────────────────────────────────── */}
      <AnimatePresence>
        {showSentencePopup && selectedSegment && (
          <div className="fixed inset-0 z-[9998]" onClick={() => setShowSentencePopup(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              className="fixed z-[9999]"
              onClick={(e) => e.stopPropagation()}
              style={{
                left: popupPosition.x,
                top: popupPosition.y,
                transform: "translate(-50%, 0)",
                maxWidth: "min(400px, calc(100vw - 32px))",
              }}
              ref={popupRef}
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/20 p-4 w-96 max-h-[450px] overflow-y-auto scrollbar-thin"
                style={{ maxWidth: "min(384px, calc(100vw - 32px))" }}
              >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {video.script.findIndex((s) => s.id === selectedSegment.id) + 1}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">Chi tiết câu</h4>
                </div>
                <button
                  onClick={() => setShowSentencePopup(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Original Sentence */}
              <div
                className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-3 border border-slate-100 dark:border-white/8"
                style={{ fontFamily: "var(--font-japanese, serif)" }}
              >
                <p className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">{selectedSegment.text}</p>
                <p className="text-xs text-slate-400 mt-1 italic" style={{ fontFamily: "inherit" }}>{selectedSegment.translation}</p>
              </div>

              {/* Grammar */}
              {selectedSegment.grammar && (
                <div className="mb-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Ngữ pháp</h5>
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400">{selectedSegment.grammar.grammar}</p>
                    <p className="text-[11px] text-purple-500 dark:text-purple-300 mt-0.5">{selectedSegment.grammar.meaning}</p>
                  </div>
                </div>
              )}

              {/* Vocabulary */}
              {selectedSegment.vocabulary && selectedSegment.vocabulary.length > 0 ? (
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Từ vựng ({selectedSegment.vocabulary.length})
                  </h5>
                  <div className="space-y-1">
                    {selectedSegment.vocabulary.map((vocab, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0 gap-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="truncate">
                            <span
                              className="text-sm font-semibold text-slate-800 dark:text-white"
                              style={{ fontFamily: "var(--font-japanese, serif)" }}
                            >
                              {vocab.word}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-medium">[{vocab.reading}]</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-300 text-right shrink-0">{resolvedMeanings[vocab.word] || vocab.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic text-center py-2">
                  Không có từ vựng riêng lẻ. Click vào từ trong transcript để xem nghĩa.
                </div>
              )}
            </div>
            {/* Arrow pointing up toward the button */}
            <div className="absolute left-1/2 -top-2 transform -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-slate-200 dark:border-white/20 rotate-45" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── GRAMMAR DETAIL MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showGrammarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.55)" }}
            onClick={() => setShowGrammarModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 scrollbar-thin"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,245,255,0.97) 100%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dark mode overlay */}
              <div className="absolute inset-0 rounded-3xl dark:bg-slate-900/90 pointer-events-none" />

              {/* Close button */}
              <button
                onClick={() => setShowGrammarModal(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              <div className="relative z-10 p-6">
                {grammarDetailLoading ? (
                  /* Loading skeleton */
                  <div className="space-y-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-14 rounded-full bg-violet-200 dark:bg-violet-900/50" />
                      <div className="h-7 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                    <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                    <p className="text-center text-xs text-violet-500 animate-pulse">
                      ✨ Gemini đang dịch sang tiếng Việt...
                    </p>
                  </div>
                ) : selectedGrammar ? (
                  <div className="space-y-5">
                    {/* Header: pattern + JLPT */}
                    <div className="flex items-start gap-3">
                      {selectedGrammar.jlptLevel && (
                        <span className="mt-1 shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md">
                          {selectedGrammar.jlptLevel}
                        </span>
                      )}
                      <div>
                        <h2
                          className="text-2xl font-black text-slate-800 dark:text-white leading-tight"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {selectedGrammar.pattern}
                        </h2>
                        {selectedGrammar.translationPending && (
                          <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Dịch tiếng Việt đang được tạo lần đầu — sẽ sẵn sàng ngay sau đây.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Vietnamese Meaning (primary) */}
                    {selectedGrammar.meaningVi && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">🇻🇳 Ý nghĩa</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                          {selectedGrammar.meaningVi}
                        </p>
                      </div>
                    )}

                    {/* English meaning fallback or supplement */}
                    {selectedGrammar.meaningEn && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/8">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">📘 Meaning (EN)</span>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedGrammar.meaningEn}</p>
                      </div>
                    )}

                    {/* Vietnamese Description */}
                    {selectedGrammar.descriptionVi && (
                      <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                        <span className="text-[10px] font-black text-violet-500 uppercase tracking-wider mb-1.5 block">💡 Giải thích</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selectedGrammar.descriptionVi}</p>
                      </div>
                    )}

                    {/* Structure */}
                    {selectedGrammar.structure && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5 block">🏗 Cấu trúc</span>
                        <p
                          className="text-sm font-semibold text-slate-800 dark:text-white"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {selectedGrammar.structure}
                        </p>
                      </div>
                    )}

                    {/* Video example sentence */}
                    {selectedGrammar.videoExampleSentence && (
                      <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5 block">🎬 Trong video này</span>
                        <p
                          className="text-sm text-slate-800 dark:text-white leading-relaxed"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                          dangerouslySetInnerHTML={{
                            __html: selectedGrammar.videoExampleSentence.replace(
                              new RegExp(
                                selectedGrammar.pattern.replace(/[～〜~＋]/g, "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                                "g"
                              ),
                              (m) => `<mark style="background:rgba(139,92,246,0.2);color:inherit;border-radius:3px;padding:0 2px;">${m}</mark>`
                            ),
                          }}
                        />
                      </div>
                    )}

                    {/* Example */}
                    {selectedGrammar.exampleJapanese && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/8">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">📝 Ví dụ</span>
                        <p
                          className="text-sm font-semibold text-slate-800 dark:text-white mb-1 leading-relaxed"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {selectedGrammar.exampleJapanese}
                        </p>
                        {selectedGrammar.exampleVietnamese && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
                            → {selectedGrammar.exampleVietnamese}
                          </p>
                        )}
                        {!selectedGrammar.exampleVietnamese && selectedGrammar.exampleEnglish && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                            → {selectedGrammar.exampleEnglish}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Note */}
                    {selectedGrammar.note && (
                      <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1 block">⚠️ Ghi chú</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selectedGrammar.note}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-8 text-slate-400">
                    <Sparkles className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Không thể tải chi tiết ngữ pháp.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
