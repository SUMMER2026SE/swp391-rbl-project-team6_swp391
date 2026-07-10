import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Play,
  Pause,
  Clock,
  Languages,
  Mic,
  Maximize,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Settings,
  Menu,
  X,
  Keyboard,
  Sparkles,
  Eye,
  EyeOff,
  BookOpen,
  Volume1,
  BookMarked,
  Award,
  Lightbulb,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi, type StudentShadowingLesson, type AIFeedback, type DiffToken } from "@/lib/api/studentShadowing";
import { cn, getAbsoluteVideoUrl } from "@/lib/utils";

type TranscriptMode = "japanese" | "japanese-vn";
type PracticeState = "intro" | "practicing" | "recording" | "feedback" | "result";

interface SentenceResult {
  sentenceId: string;
  text: string;
  translation: string;
  score: number;
  feedback: AIFeedback;
}

export const Route = createFileRoute("/student/shadowing/video/$videoId")({
  component: VideoLearningPage,
});

// Kurated N5 vocabulary dictionary
const COMMON_N5_VOCAB = [
  { word: "私", reading: "わたし", meaning: "Tôi", pos: "Đại từ" },
  { word: "あなた", reading: "あなた", meaning: "Bạn", pos: "Đại từ" },
  { word: "名前", reading: "なまえ", meaning: "Tên", pos: "Danh từ" },
  { word: "日本語", reading: "にほんご", meaning: "Tiếng Nhật", pos: "Danh từ" },
  { word: "先生", reading: "せんせい", meaning: "Giáo viên", pos: "Danh từ" },
  { word: "学生", reading: "がくせい", meaning: "Học sinh / Sinh viên", pos: "Danh từ" },
  { word: "こんにちは", reading: "こんにちは", meaning: "Xin chào", pos: "Chào hỏi" },
  { word: "初めまして", reading: "はじめまして", meaning: "Rất hân hạnh được gặp", pos: "Chào hỏi" },
  { word: "美味しい", reading: "おいしい", meaning: "Ngon miệng", pos: "Tính từ" },
  { word: "家族", reading: "かぞく", meaning: "Gia đình", pos: "Danh từ" },
  { word: "友達", reading: "ともだち", meaning: "Bạn bè", pos: "Danh từ" },
  { word: "日本", reading: "にほん", meaning: "Nhật Bản", pos: "Danh từ" },
  { word: "好き", reading: "すき", meaning: "Thích", pos: "Tính từ đuôi na" },
  { word: "何", reading: "なに / なん", meaning: "Cái gì", pos: "Đại từ nghi vấn" },
  { word: "ありがとう", reading: "ありがとう", meaning: "Cám ơn", pos: "Chào hỏi" },
];

// Kurated N5 grammar tips
const COMMON_N5_GRAMMAR = [
  { trigger: "は", title: "Trợ từ は (Chủ đề)", desc: "Đứng sau danh từ để đánh dấu chủ đề chính của câu nói." },
  { trigger: "です", title: "Cấu trúc ~です (Thì, là)", desc: "Đứng ở cuối câu khẳng định danh từ hoặc tính từ, tạo sự lịch sự trang nhã." },
  { trigger: "を", title: "Trợ từ を (Tân ngữ)", desc: "Đứng trước động từ để đánh dấu đối tượng trực tiếp chịu tác động của hành động." },
  { trigger: "か", title: "Trợ từ か (Hỏi)", desc: "Đứng cuối câu để chuyển đổi câu kể thành câu hỏi trực tiếp." },
  { trigger: "に", title: "Trợ từ に (Hướng / Giờ)", desc: "Đứng sau danh từ chỉ thời gian cụ thể hoặc hướng đích đến của di chuyển." },
  { trigger: "で", title: "Trợ từ で (Địa điểm)", desc: "Đứng sau địa điểm nơi mà một hành động cụ thể đang diễn ra." },
];

const getThumbnail = (id: string) => {
  const images = [
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=640",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=640",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640",
    "https://images.unsplash.com/photo-1528164344705-47542687000d?w=640",
    "https://images.unsplash.com/photo-1524413840003-0587454c07a3?w=640",
  ];
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[hash % images.length];
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-500 dark:text-emerald-400";
  if (score >= 60) return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}

function scoreBg(score: number) {
  if (score >= 90)
    return "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30";
  if (score >= 60)
    return "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30";
  return "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30";
}

function scoreBarColor(score: number) {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

interface SelectedTokenInfo {
  type: "vocab" | "grammar" | "expression" | "loading";
  word: string;
  rect: DOMRect;
  // Vocab fields
  kanji?: string;
  hiragana?: string;
  meaning?: string;
  jlpt?: string;
  pos?: string;
  example?: string;
  relatedWords?: string[];
  collocations?: string[];
  reading?: string;
  // Grammar fields
  pattern?: string;
  explanation?: string;
  examples?: string[];
  title?: string;
  desc?: string;
  // Expression fields
  expression?: string;
  contextExplanation?: string;
}

const renderInteractiveText = (
  text: string,
  onSelectToken: (token: SelectedTokenInfo) => void,
  selectedWord?: string,
  onWordClick?: (word: string) => void
) => {
  // Split text into words while preserving punctuation and spaces
  const tokens = text.split(/([、。！？「」『』（）〔〕【】〈〉《》〜…――\s]+)/);
  
  return (
    <span className="font-japanese">
      {tokens.map((token, idx) => {
        // Skip empty tokens
        if (!token) return null;
        
        // Check if this is punctuation or whitespace
        if (/^[、。！？「」『』（）〔〕【】〈〉《》〜…――\s]+$/.test(token)) {
          return <span key={idx} className="text-white">{token}</span>;
        }
        
        // This is a word - make it clickable
        return (
          <span
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              onSelectToken({
                type: "loading",
                word: token,
                rect,
              });
              if (onWordClick) {
                onWordClick(token);
              }
            }}
            className={cn(
              "cursor-pointer transition-colors",
              selectedWord === token ? "bg-pink-500/30 rounded px-0.5" : "hover:bg-white/20 rounded px-0.5"
            )}
          >
            {token}
          </span>
        );
      })}
    </span>
  );
};

const drawWaveform = async (blob: Blob, canvas: HTMLCanvasElement, color: string) => {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, width, height);
    
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;
    
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const idx = i * step + j;
        if (idx >= channelData.length) break;
        const datum = channelData[idx];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      const h = Math.max(2, (max - min) * amp);
      ctx.fillStyle = color;
      ctx.fillRect(i, height / 2 - h / 2, 1.5, h);
    }
  } catch (err) {
    console.error("Error decoding audio data for waveform", err);
  } finally {
    audioCtx.close();
  }
};

const drawReferenceWaveform = (canvas: HTMLCanvasElement, color: string) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  
  ctx.fillStyle = "transparent";
  ctx.fillRect(0, 0, width, height);
  
  ctx.fillStyle = color;
  const amp = height / 3;
  
  for (let i = 0; i < width; i++) {
    const envelope = Math.sin((i / width) * Math.PI) * 
                     (0.5 + 0.5 * Math.sin((i / width) * 10 * Math.PI)) * 
                     (0.8 + 0.2 * Math.random());
    const h = Math.max(4, envelope * amp * 2);
    ctx.fillRect(i, height / 2 - h / 2, 1.5, h);
  }
};

const renderHighlightedDiff = (
  expectedText: string,
  diff: DiffToken[] | undefined,
  incorrectWords: string[] | undefined,
  onSelectToken?: (token: SelectedTokenInfo) => void,
  selectedWord?: string,
  onWordClick?: (word: string) => void
) => {
  if (diff && diff.length > 0) {
    return (
      <div className="flex flex-wrap justify-center items-center gap-y-2 gap-x-1 font-japanese leading-relaxed">
        {diff.map((token, idx) => {
          const isPunctuation = /^[、。！？「」『』（）〔〕【】〈〉《》〜…――\s]+$/.test(token.text);
          let colorClass = "";
          let borderClass = "";
          let tooltip = "";

          if (isPunctuation) {
            colorClass = "text-white/40";
          } else {
            switch (token.status) {
              case "correct":
                colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                borderClass = "border-b-2 border-emerald-500";
                tooltip = "Chính xác";
                break;
              case "incorrect":
                colorClass = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                borderClass = "border-b-2 border-rose-500";
                tooltip = "Chưa chính xác";
                break;
              case "missing":
                colorClass = "text-slate-400 dark:text-slate-500 bg-slate-500/5 border-slate-500/10 line-through decoration-slate-400";
                borderClass = "border-b border-dashed border-slate-400";
                tooltip = "Bị thiếu";
                break;
              case "extra":
                colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                borderClass = "border-b-2 border-amber-500";
                tooltip = "Từ thừa";
                break;
            }
          }

          const isClickable = onSelectToken && onWordClick && !isPunctuation;

          return (
            <span
              key={idx}
              className={cn(
                "px-1.5 py-0.5 rounded-lg text-lg font-bold transition-all inline-block select-none shadow-xs",
                colorClass,
                borderClass,
                isClickable && "cursor-pointer hover:scale-105 active:scale-95"
              )}
              title={tooltip}
              onClick={isClickable ? (e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                onSelectToken!({
                  type: "loading",
                  word: token.text,
                  rect,
                });
                onWordClick!(token.text);
              } : undefined}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    );
  }

  const words = expectedText.split(/([、。！？「」『』（）〔〕【】〈〉《》〜…――\s]+)/);
  return (
    <span className="font-japanese leading-relaxed text-white text-lg">
      {words.map((word, idx) => {
        if (!word) return null;
        if (/^[、。！？「」『』（）〔〕【】〈〉《》〜…――\s]+$/.test(word)) {
          return <span key={idx} className="text-white/40">{word}</span>;
        }
        
        const isIncorrect = incorrectWords && incorrectWords.some(iw => word.includes(iw) || iw.includes(word));
        const isClickable = onSelectToken && onWordClick;

        return (
          <span 
            key={idx} 
            className={cn(
              "px-1.5 py-0.5 rounded-lg border-b-2 font-bold mx-0.5 inline-block",
              isIncorrect 
                ? "text-rose-400 bg-rose-500/10 border-rose-500/30" 
                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
              isClickable && "cursor-pointer hover:bg-white/10 transition-colors"
            )}
            onClick={isClickable ? (e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              onSelectToken!({
                type: "loading",
                word,
                rect,
              });
              onWordClick!(word);
            } : undefined}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};

function VideoLearningPage() {
  const params = Route.useParams();
  const videoId = params.videoId;

  // Core Data
  const [video, setVideo] = useState<StudentShadowingLesson | null>(null);
  const [loading, setLoading] = useState(true);

  // Interface Modes
  const [mode, setMode] = useState<"watch" | "shadow">("watch");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [subtitleDisplayMode, setSubtitleDisplayMode] = useState<"all" | "japanese" | "vietnamese" | "none">("all");
  const [panelOpen, setPanelOpen] = useState(true);
  const [vocabExpanded, setVocabExpanded] = useState(true);
  const [showShortcutInfo, setShowShortcutInfo] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SelectedTokenInfo | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Shadowing Practice State
  const [practiceState, setPracticeState] = useState<PracticeState>("practicing");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sentenceResults, setSentenceResults] = useState<SentenceResult[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastRecordedBlob, setLastRecordedBlob] = useState<Blob | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const userWaveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const refWaveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    studentShadowingApi.getShadowingDetail(videoId)
      .then((res) => {
        setVideo(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [videoId]);

  // Active Segment based on time
  const activeSegment = useMemo(() => {
    if (!video) return null;
    return video.segments.find(
      (seg) => currentTime >= seg.startTime && currentTime <= seg.endTime
    );
  }, [video, currentTime]);

  // Auto scroll active segment into view
  useEffect(() => {
    if (activeSegment && segmentRefs.current[activeSegment.id] && panelOpen && !isFocusMode) {
      segmentRefs.current[activeSegment.id]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSegment, panelOpen, isFocusMode]);

  // Collapsible Vocab & Grammar detector from current sentence
  const activeVocabAndGrammar = useMemo(() => {
    const defaultData = { vocab: [] as typeof COMMON_N5_VOCAB, grammar: [] as typeof COMMON_N5_GRAMMAR };
    const targetSegment = mode === "shadow" ? video?.segments[currentSentenceIndex] : activeSegment;
    if (!targetSegment) return defaultData;

    const text = targetSegment.japaneseText;
    const vocab = COMMON_N5_VOCAB.filter(v => text.includes(v.word));
    const grammar = COMMON_N5_GRAMMAR.filter(g => text.includes(g.trigger));
    return { vocab, grammar };
  }, [activeSegment, currentSentenceIndex, mode, video]);

  // Dismiss vocab/grammar popover on scroll
  useEffect(() => {
    const handleScroll = () => {
      setSelectedToken(null);
      setSelectedWord(null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle text selection (bôi đen) or word click to show AI vocab/grammar/expression definition
  useEffect(() => {
    const handleSelection = async () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      if (selectedText.length > 25) return;

      const targetSentence = mode === "shadow"
        ? video?.segments[currentSentenceIndex]?.japaneseText
        : activeSegment?.japaneseText;

      if (!targetSentence) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedToken({
        type: "loading",
        word: selectedText,
        rect,
      });

      try {
        const response = await studentShadowingApi.explainText(selectedText, targetSentence);
        if (response) {
          // Transform API response to match frontend field names
          const transformed: any = {
            type: response.type,
            word: selectedText,
            rect,
          };
          
          if (response.type === "vocab") {
            transformed.kanji = response.kanji || selectedText;
            transformed.hiragana = response.hiragana || "";
            transformed.meaning = response.meaning || "";
            transformed.jlpt = response.jlpt || "";
            transformed.pos = response.jlpt || ""; // Use JLPT as POS label
            transformed.example = response.example || "";
            transformed.relatedWords = response.relatedWords || [];
            transformed.collocations = response.collocations || [];
          } else if (response.type === "grammar") {
            transformed.title = response.pattern || response.meaning || "Ngữ pháp";
            transformed.desc = response.explanation || response.meaning || "";
            transformed.pattern = response.pattern || "";
            transformed.explanation = response.explanation || "";
            transformed.examples = response.examples || [];
          } else if (response.type === "expression") {
            transformed.title = response.expression || selectedText;
            transformed.desc = response.contextExplanation || response.meaning || "";
            transformed.expression = response.expression || "";
            transformed.contextExplanation = response.contextExplanation || "";
            transformed.examples = response.examples || [];
          }
          
          setSelectedToken(transformed);
        }
      } catch (err) {
        console.error("AI explanation failed", err);
        setSelectedToken({
          type: "vocab",
          word: selectedText,
          meaning: "Không thể lấy giải nghĩa lúc này. Vui lòng thử lại.",
          kanji: selectedText,
          hiragana: "",
          rect,
        });
      }
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, [mode, video, currentSentenceIndex, activeSegment]);

  // Fetch word explanation when selectedWord changes (clicked word lookup)
  useEffect(() => {
    if (!selectedWord || !selectedToken || selectedToken.type !== "loading") return;

    const fetchExplanation = async () => {
      const targetSentence = mode === "shadow"
        ? video?.segments[currentSentenceIndex]?.japaneseText
        : activeSegment?.japaneseText;

      if (!targetSentence) return;

      try {
        const response = await studentShadowingApi.explainText(selectedWord, targetSentence);
        if (response) {
          const transformed: any = {
            type: response.type || "vocab",
            word: selectedWord,
            rect: selectedToken.rect,
          };
          
          if (response.type === "vocab" || !response.type) {
            transformed.kanji = response.kanji || selectedWord;
            transformed.hiragana = response.hiragana || "";
            transformed.meaning = response.meaning || "";
            transformed.jlpt = response.jlpt || "";
            transformed.pos = response.jlpt || "";
            transformed.example = response.example || "";
            transformed.relatedWords = response.relatedWords || [];
            transformed.collocations = response.collocations || [];
          } else if (response.type === "grammar") {
            transformed.title = response.pattern || response.meaning || "Ngữ pháp";
            transformed.desc = response.explanation || response.meaning || "";
            transformed.pattern = response.pattern || "";
            transformed.explanation = response.explanation || "";
            transformed.examples = response.examples || [];
          } else if (response.type === "expression") {
            transformed.title = response.expression || selectedWord;
            transformed.desc = response.contextExplanation || response.meaning || "";
            transformed.expression = response.expression || "";
            transformed.contextExplanation = response.contextExplanation || "";
            transformed.examples = response.examples || [];
          }
          
          setSelectedToken(transformed);
        }
      } catch (err) {
        console.error("AI explanation failed", err);
        setSelectedToken({
          type: "vocab",
          word: selectedWord,
          meaning: "Không thể lấy giải nghĩa lúc này. Vui lòng thử lại.",
          kanji: selectedWord,
          hiragana: "",
          rect: selectedToken.rect,
        });
      }
    };

    fetchExplanation();
  }, [selectedWord]);

  // Draw waveforms comparison on showFeedback
  useEffect(() => {
    if (showFeedback && lastResult && userWaveformCanvasRef.current && refWaveformCanvasRef.current) {
      if (lastRecordedBlob) {
        drawWaveform(lastRecordedBlob, userWaveformCanvasRef.current, "#ec4899");
        drawReferenceWaveform(refWaveformCanvasRef.current, "#10b981");
      }
    }
  }, [showFeedback, lastRecordedBlob, sentenceResults, currentSentenceIndex]);


  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (!videoRef.current) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case "ArrowRight":
          e.preventDefault();
          videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 5);
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          handleMuteToggle();
          break;
        case "ArrowUp":
          e.preventDefault();
          const newVolUp = Math.min(1.0, videoRef.current.volume + 0.1);
          videoRef.current.volume = newVolUp;
          setVolume(newVolUp);
          setIsMuted(newVolUp === 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          const newVolDown = Math.max(0.0, videoRef.current.volume - 0.1);
          videoRef.current.volume = newVolDown;
          setVolume(newVolDown);
          setIsMuted(newVolDown === 0);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isFullscreen]);

  const handlePlayPause = () => {
    setSelectedToken(null);
    setSelectedWord(null);
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error(err));
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.error("Error enabling fullscreen mode:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedToken(null);
    setSelectedWord(null);
    if (!videoRef.current) return;
    const value = parseFloat(e.target.value);
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleSegmentClick = (startTime: number) => {
    setSelectedToken(null);
    setSelectedWord(null);
    if (mode === "shadow") return;
    if (!videoRef.current) return;
    videoRef.current.currentTime = startTime;
    videoRef.current.play().then(() => {
      setIsPlaying(true);
    });
  };

  // Shadowing Mode Logic
  const currentSentence = useMemo(() => {
    if (!video || video.segments.length === 0) return null;
    return video.segments[currentSentenceIndex];
  }, [video, currentSentenceIndex]);

  const isLastSentence = useMemo(() => {
    if (!video) return true;
    return currentSentenceIndex === video.segments.length - 1;
  }, [video, currentSentenceIndex]);

  const overallScore = useMemo(() => {
    if (sentenceResults.length === 0) return 0;
    const total = sentenceResults.reduce((acc, r) => acc + r.score, 0);
    return Math.round(total / sentenceResults.length);
  }, [sentenceResults]);

  const handlePlayAudio = useCallback(() => {
    if (!videoRef.current || !currentSentence) return;
    videoRef.current.pause();
    videoRef.current.currentTime = currentSentence.startTime;
    videoRef.current.play().then(() => {
      setIsPlaying(true);
    });

    const onTimeUpdate = () => {
      if (videoRef.current && videoRef.current.currentTime >= currentSentence.endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.removeEventListener("timeupdate", onTimeUpdate);
      }
    };

    videoRef.current.addEventListener("timeupdate", onTimeUpdate);
  }, [currentSentence]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setLastRecordedBlob(audioBlob);
        
        setIsEvaluating(true);
        try {
          if (currentSentence) {
            const feedback = await studentShadowingApi.evaluateSpeech(audioBlob, currentSentence.japaneseText, duration);
            const result: SentenceResult = {
              sentenceId: currentSentence.id,
              text: currentSentence.japaneseText,
              translation: currentSentence.vietnameseTranslation,
              score: feedback.overallScore,
              feedback,
            };
            setSentenceResults((prev) => {
              const idx = prev.findIndex(r => r.sentenceId === currentSentence.id);
              if (idx > -1) {
                const next = [...prev];
                next[idx] = result;
                return next;
              }
              return [...prev, result];
            });
            setShowFeedback(true);
          }
        } catch (err) {
          console.error("Evaluation failed", err);
          if (currentSentence) {
            const fallbackFeedback = {
              pronunciation: 0,
              pitchAccent: 0,
              fluency: 0,
              speed: 0,
              overallScore: 0,
              feedback: "Không thể phân tích giọng nói lúc này. Vui lòng thử lại!",
              strengths: [],
              improvements: [],
              advice: "Hãy thử lại.",
              retries: 1,
              speedRecommendation: "N/A",
              incorrectWords: [],
              spokenText: ""
            };
            const result: SentenceResult = {
              sentenceId: currentSentence.id,
              text: currentSentence.japaneseText,
              translation: currentSentence.vietnameseTranslation,
              score: 0,
              feedback: fallbackFeedback,
            };
            setSentenceResults((prev) => {
              const idx = prev.findIndex(r => r.sentenceId === currentSentence.id);
              if (idx > -1) {
                const next = [...prev];
                next[idx] = result;
                return next;
              }
              return [...prev, result];
            });
            setShowFeedback(true);
          }
        } finally {
          setIsEvaluating(false);
        }
      };
      
      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setShowFeedback(false);
      
      // Auto stop after 8 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          stopRecording();
        }
      }, 8000);
      
    } catch (err) {
      console.error("Microphone access failed", err);
      alert("Không thể truy cập Microphone. Vui lòng cấp quyền sử dụng Micro!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  const handleRecord = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, currentSentence]);

  const handleNextSentence = useCallback(() => {
    setShowFeedback(false);
    if (isLastSentence) {
      setPracticeState("result");
    } else {
      setCurrentSentenceIndex((prev) => prev + 1);
      setPracticeState("practicing");
    }
  }, [isLastSentence]);

  const handleRetry = useCallback(() => {
    setIsRecording(false);
    setShowFeedback(false);
    setSentenceResults((prev) => prev.filter(r => r.sentenceId !== currentSentence?.id));
  }, [currentSentence]);

  const handleRestartPractice = useCallback(() => {
    setCurrentSentenceIndex(0);
    setSentenceResults([]);
    setShowFeedback(false);
    setPracticeState("practicing");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-slate-950">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/80">Khởi tạo môi trường học tập Fluent-AI...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <h3 className="text-lg font-bold text-primary-col mb-2">Không tìm thấy bài học</h3>
          <Link
            to="/student/shadowing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-surface border border-[var(--border)] text-primary-col text-sm font-semibold hover:bg-[var(--accent)] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại Shadowing
          </Link>
        </div>
      </div>
    );
  }

  const lastResult = sentenceResults.find(r => r.sentenceId === currentSentence?.id);

  return (
    <div className="min-h-screen relative flex flex-col pb-12">
      <SakuraBg count={8} />
      
      <div className="relative z-10 flex-1 max-w-[1750px] w-full mx-auto px-4 md:px-8">
        
        {/* Navigation & Premium Workspace Header */}
        <div className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[var(--border)] mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/student/shadowing"
              className="w-11 h-11 rounded-2xl glass-surface border border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)] transition shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-primary-col" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-pink-500/10 text-pink-500 border border-pink-500/20">
                  JLPT N5
                </span>
                <h1 className="font-display font-extrabold text-xl text-primary-col line-clamp-1 tracking-tight">
                  {video.title}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">Trình mô phỏng học tiếng Nhật cao cấp tích hợp phân tích AI</p>
            </div>
          </div>

          {/* Core Settings / Actions bar */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Mode Toggle [ Watch | Shadowing ] */}
            <div className="flex bg-[var(--muted)] p-1 rounded-2xl border border-[var(--border)] w-60 shadow-inner">
              <button
                onClick={() => {
                  setMode("watch");
                  setIsPlaying(false);
                  if (videoRef.current) videoRef.current.pause();
                }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer",
                  mode === "watch"
                    ? "bg-gradient-hero text-white shadow-md scale-100"
                    : "text-muted-foreground hover:text-primary-col"
                )}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Chế độ Xem
              </button>
              <button
                onClick={() => {
                  setMode("shadow");
                  setIsPlaying(false);
                  if (videoRef.current) videoRef.current.pause();
                }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer",
                  mode === "shadow"
                    ? "bg-gradient-hero text-white shadow-md scale-100"
                    : "text-muted-foreground hover:text-primary-col"
                )}
              >
                <Mic className="w-3.5 h-3.5" />
                Luyện Nói
              </button>
            </div>

            {/* Focus Mode button */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={cn(
                "p-2.5 rounded-2xl border transition-all duration-200 flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer",
                isFocusMode
                  ? "bg-pink-500/10 border-pink-500/30 text-pink-500"
                  : "glass-surface text-primary-col hover:bg-[var(--accent)]"
              )}
              title={isFocusMode ? "Thoát Chế độ Tập trung" : "Chế độ Tập trung"}
            >
              {isFocusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFocusMode ? "Thoát tập trung" : "Chế độ tập trung"}</span>
            </button>
          </div>
        </div>

        {/* Primary Workspace Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          
          {/* Left Column: Player, Vocabulary & Shadowing controls */}
          <div 
            className={cn(
              "transition-all duration-300 flex flex-col gap-6", 
              isFocusMode 
                ? "w-full" 
                : mode === "watch" 
                  ? "w-full lg:w-[75%]" 
                  : "w-full lg:w-[65%]"
            )}
          >
            
            {/* The upgraded premium Video Player wrapper */}
            <div 
              ref={playerContainerRef}
              className={cn(
                "relative bg-black overflow-hidden flex items-center justify-center group shadow-2xl border border-[var(--border)] transition-all duration-300",
                isFullscreen ? "w-full h-full rounded-none" : "aspect-video w-full rounded-3xl"
              )}
            >
              <video
                ref={videoRef}
                src={getAbsoluteVideoUrl(video.videoUrl)}
                onClick={handlePlayPause}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => {
                  setCurrentTime(e.currentTarget.currentTime);
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration || 0);
                  }
                }}
                onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                className="w-full h-full object-contain cursor-pointer select-none"
              />

              {/* Subtitle overlay directly inside video layout */}
              {subtitleDisplayMode !== "none" && activeSegment && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl text-center transition-all select-none pointer-events-none z-10 flex flex-col justify-center items-center gap-1.5">
                  {(subtitleDisplayMode === "all" || subtitleDisplayMode === "japanese") && (
                      <p 
                      className="text-xl sm:text-3xl font-extrabold text-white leading-relaxed tracking-wide font-japanese pointer-events-auto"
                      style={{ 
                        fontFamily: "var(--font-japanese, serif)",
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.95), -1px -1px 0 rgba(0, 0, 0, 0.95), 1px -1px 0 rgba(0, 0, 0, 0.95), -1px 1px 0 rgba(0, 0, 0, 0.95), 1px 1px 0 rgba(0, 0, 0, 0.95)"
                      }}
                    >
                      {renderInteractiveText(activeSegment.japaneseText, setSelectedToken, selectedWord || undefined, setSelectedWord)}
                    </p>
                  )}
                  {(subtitleDisplayMode === "all" || subtitleDisplayMode === "vietnamese") && (
                    <p 
                      className="text-sm sm:text-lg text-yellow-300 font-bold leading-relaxed"
                      style={{ 
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.95), -1px -1px 0 rgba(0, 0, 0, 0.95), 1px -1px 0 rgba(0, 0, 0, 0.95), -1px 1px 0 rgba(0, 0, 0, 0.95), 1px 1px 0 rgba(0, 0, 0, 0.95)"
                      }}
                    >
                      {activeSegment.vietnameseTranslation}
                    </p>
                  )}
                </div>
              )}

              {/* Collapsible Panel Toggle inside Fullscreen */}
              {isFullscreen && (
                <button
                  onClick={() => setPanelOpen(!panelOpen)}
                  className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 transition pointer-events-auto"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              {/* Custom Player HUD panel */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 pointer-events-none z-20">
                {/* HUD Top bar */}
                <div className="flex justify-between items-center w-full pointer-events-auto">
                  <span className="text-white/80 font-bold text-xs select-none pl-2 line-clamp-1">{video.title}</span>
                  <button 
                    onClick={() => setShowShortcutInfo(true)}
                    className="p-1.5 text-white/50 hover:text-white transition"
                    title="Keyboard Shortcuts"
                  >
                    <Keyboard className="w-4 h-4" />
                  </button>
                </div>

                {/* HUD Bottom bar */}
                <div className="w-full flex flex-col gap-3 pointer-events-auto">
                  {/* Scrubber track */}
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-[10px] text-white/70 font-mono select-none">
                      {formatDuration(Math.round(currentTime))}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={handleTimelineChange}
                      className="flex-1 h-1 bg-white/20 hover:h-1.5 rounded-lg appearance-none cursor-pointer accent-pink-500 transition-all timeline-scrubber"
                    />
                    <span className="text-[10px] text-white/70 font-mono select-none">
                      {formatDuration(Math.round(duration))}
                    </span>
                  </div>

                  {/* Buttons group */}
                  <div className="flex justify-between items-center w-full pr-1 pl-1">
                    {/* Left control set */}
                    <div className="flex items-center gap-4">
                      <button onClick={handlePlayPause} className="text-white hover:text-pink-500 hover:scale-110 transition">
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>
                      
                      <div className="flex items-center gap-2 group/volume relative">
                        <button onClick={handleMuteToggle} className="text-white hover:text-pink-500 transition">
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.1}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const newVol = parseFloat(e.target.value);
                            setVolume(newVol);
                            if (videoRef.current) {
                              videoRef.current.volume = newVol;
                              videoRef.current.muted = newVol === 0;
                            }
                            setIsMuted(newVol === 0);
                          }}
                          className="w-0 group-hover/volume:w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Right control set */}
                    <div className="flex items-center gap-3 relative">
                      {/* Playback speed selector */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSettings(!showSettings)}
                          className="px-2.5 py-1 rounded-md text-[10px] bg-white/10 hover:bg-white/25 text-white font-bold border border-white/10 transition"
                        >
                          Tốc độ ({playbackRate}x)
                        </button>
                        {showSettings && (
                          <div className="absolute bottom-8 right-0 bg-slate-900/95 backdrop-blur border border-white/10 rounded-xl py-1.5 w-24 text-center shadow-xl flex flex-col z-30">
                            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => handlePlaybackRateChange(rate)}
                                className={cn(
                                  "py-1 text-[11px] font-semibold text-left px-3 hover:bg-white/10 w-full transition",
                                  playbackRate === rate ? "text-pink-500" : "text-white"
                                )}
                              >
                                {rate}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Subtitle visibility modifier */}
                      <button
                        onClick={() => {
                          const order: Array<"all" | "japanese" | "vietnamese" | "none"> = ["all", "japanese", "vietnamese", "none"];
                          const nextIdx = (order.indexOf(subtitleDisplayMode) + 1) % order.length;
                          setSubtitleDisplayMode(order[nextIdx]);
                        }}
                        className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
                        title="Thay đổi phụ đề"
                      >
                        <Languages className="w-4 h-4" />
                      </button>

                      {/* Fullscreen handler toggle */}
                      <button onClick={toggleFullscreen} className="text-white hover:text-pink-500 hover:scale-110 transition">
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction guidance / ELSA-inspired Shadowing Mode practice panel */}
            {mode === "watch" ? (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-500/10 rounded-2xl select-none">
                <Sparkles className="w-5 h-5 text-pink-500 shrink-0 animate-pulse" />
                <p className="text-xs text-muted-foreground font-medium">
                  <strong>Trải nghiệm Fluent-AI:</strong> Bạn đang ở Chế độ Xem. Chuyển sang <strong>Chế độ Luyện Nói</strong> bất kỳ lúc nào để bắt đầu thực hành phát âm và nhận phân tích âm điệu từ Trợ lý AI.
                </p>
              </div>
            ) : (
              /* Shadowing Practice UI (ELSA Speak inspired) */
              <div className="glass-card rounded-3xl border border-[var(--border)] p-6 md:p-8 shadow-xl flex flex-col gap-6 w-full">
                {practiceState === "result" ? (
                  /* Practice summary view */
                  <div className="text-center space-y-6 py-4">
                    <div>
                      <span className="text-5xl">👑</span>
                      <h2 className="text-2xl font-black text-primary-col mt-4 tracking-tight">
                        Bài luyện nói hoàn tất!
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tuyệt vời! Bạn đã vượt qua tất cả các câu thoại của bài học này.
                      </p>
                    </div>

                    <div className="inline-block p-6 rounded-3xl glass-surface border border-[var(--border)] shadow-inner">
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Điểm số trung bình</p>
                      <p className={cn("text-6xl font-black mt-1.5", scoreColor(overallScore))}>
                        {overallScore}%
                      </p>
                    </div>

                    <div className="text-left space-y-2.5 max-h-[220px] overflow-y-auto pr-2 border-y border-[var(--border)] py-4 scrollbar-thin">
                      <p className="text-xs font-bold text-primary-col">Nhật ký điểm nói:</p>
                      {sentenceResults.map((res, i) => (
                        <div
                          key={res.sentenceId}
                          className="p-3 rounded-xl border border-[var(--border)] glass-surface flex items-center justify-between"
                        >
                          <div>
                            <p className="text-[10px] text-muted-foreground font-bold">Câu {i + 1}</p>
                            <p className="text-sm font-semibold text-primary-col font-japanese mt-0.5">
                              {res.text}
                            </p>
                          </div>
                          <span className={cn("text-base font-bold", scoreColor(res.score))}>
                            {res.score}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleRestartPractice}
                        className="flex-1 py-3.5 rounded-2xl border border-[var(--border)] text-primary-col font-bold text-xs hover:bg-[var(--accent)] transition cursor-pointer"
                      >
                        Luyện tập lại từ đầu
                      </button>
                      <button
                        onClick={() => setMode("watch")}
                        className="flex-1 py-3.5 rounded-2xl bg-gradient-hero text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Quay lại Chế độ Xem
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Live Practice panel */
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-black tracking-wider border-b border-[var(--border)] pb-3 w-full">
                      <span>Câu thoại {currentSentenceIndex + 1} / {video.segments.length}</span>
                      <div className="w-32 h-2 bg-[var(--muted)] rounded-full overflow-hidden border border-[var(--border)]">
                        <div 
                          className="h-full bg-pink-500 transition-all duration-300 rounded-full"
                          style={{ width: `${((currentSentenceIndex + 1) / video.segments.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {currentSentence && (
                      <div className="text-center py-4 space-y-3">
                        <p
                          className="text-2xl sm:text-3xl font-black text-primary-col leading-relaxed font-japanese"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {renderInteractiveText(currentSentence.japaneseText, setSelectedToken, selectedWord || undefined, setSelectedWord)}
                        </p>
                        <p className="text-sm text-secondary-col font-medium">
                          {currentSentence.vietnameseTranslation}
                        </p>
                      </div>
                    )}

                    {/* Microphone waveform container */}
                    <div className="flex flex-col items-center gap-4 glass-surface p-6 rounded-3xl border border-[var(--border)] shadow-inner">
                      {isEvaluating ? (
                        <div className="h-10 flex items-center justify-center gap-2 select-none">
                          <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-pink-500 font-semibold animate-pulse">AI đang phân tích giọng nói...</span>
                        </div>
                      ) : isRecording ? (
                        /* Simulated dynamic Waveform */
                        <div className="h-10 flex items-center gap-1 select-none">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => (
                            <motion.div
                              key={bar}
                              animate={{ height: [10, 36, 10] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.5 + bar * 0.04,
                                ease: "easeInOut",
                              }}
                              className="w-1 bg-pink-500 rounded-full"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="h-10 flex items-center text-xs text-muted-col italic">
                          {showFeedback ? "Phân tích nói hoàn tất" : "Lắng nghe mẫu rồi nhấn nút Mic để bắt đầu nói"}
                        </div>
                      )}

                      <div className="flex items-center gap-5">
                        {/* Play sample audio */}
                        <button
                          onClick={handlePlayAudio}
                          disabled={isPlaying || isRecording || isEvaluating}
                          className={cn(
                            "w-12 h-12 rounded-full border flex items-center justify-center transition cursor-pointer shadow-sm",
                            isPlaying
                              ? "bg-pink-50 border-pink-200 text-pink-500"
                              : "glass-surface border-[var(--border)] text-primary-col hover:bg-[var(--accent)]"
                          )}
                          title="Nghe mẫu phát âm"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>

                        {/* Mic recording button */}
                        <button
                          onClick={handleRecord}
                          disabled={isPlaying || isEvaluating || showFeedback}
                          className={cn(
                            "w-18 h-18 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer",
                            isRecording
                              ? "bg-red-500 text-white animate-pulse"
                              : showFeedback
                                ? "bg-[var(--muted)] text-muted-col cursor-not-allowed"
                                : "bg-gradient-hero text-white hover:scale-105"
                          )}
                          title="Ghi âm"
                        >
                          <Mic className="w-7 h-7" />
                        </button>

                        {/* Spacer */}
                        <div className="w-12" />
                      </div>

                      <p className="text-[10px] text-muted-foreground select-none">
                        {isEvaluating 
                          ? "Hệ thống AI đang chấm điểm..." 
                          : isRecording 
                            ? "Đang ghi âm... Bấm lại để hoàn tất" 
                            : "Bấm Micro để ghi âm giọng nói"}
                      </p>
                    </div>

                    {/* Upgraded Premium AI Feedback Card */}
                    {showFeedback && lastResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("p-6 rounded-3xl border space-y-6 shadow-xl relative overflow-hidden", scoreBg(lastResult.score))}
                      >
                        {/* Overall score and recognition status */}
                        <div className="glass-surface p-5 rounded-2xl border border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          <div className="md:col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[var(--border)] pb-4 md:pb-0 md:pr-6 text-center">
                            <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider block mb-1">Overall Match</span>
                            <div className={cn("text-4xl font-black tracking-tight", scoreColor(lastResult.score))}>
                              {lastResult.score}%
                            </div>
                            <div className="w-full mt-2.5 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", scoreBarColor(lastResult.score))}
                                style={{ width: `${lastResult.score}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="md:col-span-2 space-y-3 text-left">
                            <div>
                              <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider block">Status</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {lastResult.score >= 90 ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Matched (Khớp hoàn toàn)
                                  </span>
                                ) : lastResult.score >= 60 ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Partially Matched (Khớp một phần)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    Not Matched (Không khớp)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider block">Your Speech (AI Transcript)</span>
                              <p className="text-primary-col font-bold font-japanese text-sm mt-0.5 leading-relaxed">
                                {lastResult.feedback.spokenText ? `"${lastResult.feedback.spokenText}"` : "(Không nhận dạng được giọng nói)"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Difference Highlights Card */}
                        <div className="glass-surface p-5 rounded-2xl border border-[var(--border)] space-y-3">
                          <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider block">Differences Highlight</span>
                          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center">
                            {renderHighlightedDiff(
                              lastResult.text,
                              lastResult.feedback.diff,
                              lastResult.feedback.incorrectWords,
                              setSelectedToken,
                              selectedWord || undefined,
                              setSelectedWord
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 justify-center text-[9px] font-bold text-muted-col pt-1">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 inline-block" /> Đúng</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/10 border border-rose-500/30 inline-block" /> Chưa đúng</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-500/5 border border-slate-500/20 line-through inline-block" /> Bị thiếu</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/10 border border-amber-500/30 inline-block" /> Thừa</span>
                          </div>
                        </div>



                        {/* Practice Tips */}
                        <div className="bg-blue-500/5 rounded-2xl border border-blue-500/10 p-5 space-y-2.5">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Practice Tips</span>
                          <ul className="space-y-1 text-xs text-blue-300 leading-relaxed list-disc list-inside">
                            <li>Lắng nghe câu mẫu nhiều lần trước khi ghi âm.</li>
                            <li>Nói tự nhiên, không nên ngắt quãng quá lâu.</li>
                            <li>Nếu điểm khớp thấp, kiểm tra các từ bị thiếu (màu xám gạch chân) và sửa ở lần nói tiếp theo.</li>
                          </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2.5 justify-end pt-1">
                          <button
                            onClick={handleRetry}
                            className="px-4 py-2 border border-[var(--border)] text-primary-col font-bold text-xs rounded-xl hover:bg-[var(--accent)] transition cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Thực hành lại
                          </button>
                          <button
                            onClick={handleNextSentence}
                            className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer"
                          >
                            {isLastSentence ? "Xem Kết Quả" : "Câu Tiếp Theo"}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Right Column: collapsible Transcript list (Watch mode and Fullscreen overlay drawer) */}
          {panelOpen && !isFocusMode && (
            <div 
              className={cn(
                "transition-all duration-300 glass-card rounded-3xl border border-[var(--border)] shadow-lg p-5",
                isFullscreen
                  ? "absolute right-4 top-16 bottom-4 w-80 z-40 bg-[var(--popover)] border-[var(--border)]"
                  : cn("w-full transition-all duration-300", mode === "watch" ? "lg:w-[25%]" : "lg:w-[35%]")
              )}
            >
              {/* Header inside Panel */}
              <div className="flex justify-between items-center pb-3 border-b border-[var(--border)] mb-4 select-none">
                <span className="text-xs font-black text-primary-col uppercase tracking-wider flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-pink-500" />
                  Danh sách câu thoại
                </span>
                
                {/* Close drawer icon inside fullscreen */}
                {isFullscreen && (
                  <button onClick={() => setPanelOpen(false)} className="text-muted-col hover:text-primary-col">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Subtitle visibility selector inside sidebar */}
              <div className="flex gap-1 bg-[var(--muted)] p-0.5 rounded-xl border border-[var(--border)] mb-4">
                {[
                  { mode: "all", label: "Nhật + Việt" },
                  { mode: "japanese", label: "Tiếng Nhật" },
                  { mode: "none", label: "Ẩn dịch" }
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setSubtitleDisplayMode(item.mode as any)}
                    className={cn(
                      "flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer",
                      subtitleDisplayMode === item.mode
                        ? "bg-[var(--card)] text-pink-500 shadow-sm"
                        : "text-muted-foreground hover:text-primary-col"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Scrollable list of sentences */}
              <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-340px)] pr-1 scrollbar-thin scrollbar-thumb-pink-500/10">
                {video.segments.map((segment, index) => {
                  const isHighlighted = activeSegment?.id === segment.id;
                  const isCompleted = sentenceResults.some(r => r.sentenceId === segment.id);
                  const resultScore = sentenceResults.find(r => r.sentenceId === segment.id)?.score;
                  
                  return (
                    <div
                      key={segment.id}
                      ref={(el) => { segmentRefs.current[segment.id] = el; }}
                      onClick={() => handleSegmentClick(segment.startTime)}
                      className={cn(
                        "w-full text-left p-3 rounded-2xl border transition-all duration-300 flex flex-col gap-1 cursor-pointer relative overflow-hidden group",
                        isHighlighted
                          ? "bg-pink-500/10 border-pink-500/30 shadow-sm shadow-pink-500/5 translate-x-1"
                          : "glass-surface border-[var(--border)] hover:bg-[var(--accent)]/50"
                      )}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                          isHighlighted
                            ? "bg-pink-500 text-white"
                            : "bg-primary/10 text-primary"
                        )}>
                          {index + 1}
                        </span>

                        <div className="flex-1 min-w-0 pr-1">
                          <p
                            className="text-sm text-slate-800 dark:text-white leading-relaxed font-semibold font-japanese"
                            style={{ fontFamily: "var(--font-japanese, serif)" }}
                          >
                            {renderInteractiveText(segment.japaneseText, setSelectedToken, selectedWord || undefined, setSelectedWord)}
                          </p>
                          {subtitleDisplayMode === "all" && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {segment.vietnameseTranslation}
                            </p>
                          )}
                        </div>

                        {/* Score or timestamp */}
                        <div className="flex flex-col items-end shrink-0 select-none gap-0.5">
                          <span className="text-[9px] text-muted-foreground">
                            {formatDuration(Math.round(segment.startTime))}
                          </span>
                          {isCompleted && (
                            <span className={cn("text-[9px] font-black px-1.5 py-0.2 rounded border bg-black/5 dark:bg-black/25", scoreColor(resultScore || 0))}>
                              {resultScore}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts modal dialog */}
      {showShortcutInfo && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-3xl max-w-sm w-full p-6 relative shadow-2xl flex flex-col gap-4 text-center">
            <button 
              onClick={() => setShowShortcutInfo(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto text-pink-500">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg">Phím tắt trình phát</h3>
              <p className="text-xs text-muted-foreground mt-1">Điều khiển bài học dễ dàng hơn bằng bàn phím</p>
            </div>
            
            <div className="text-left space-y-2.5 text-xs text-slate-300 py-2 border-y border-white/5 my-2">
              <div className="flex justify-between"><kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono">Space</kbd> <span>Phát / Tạm dừng</span></div>
              <div className="flex justify-between"><kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono">← / →</kbd> <span>Tua nhanh / chậm 5s</span></div>
              <div className="flex justify-between"><kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono">↑ / ↓</kbd> <span>Tăng / Giảm âm lượng 10%</span></div>
              <div className="flex justify-between"><kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono">M</kbd> <span>Tắt tiếng</span></div>
              <div className="flex justify-between"><kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono">F</kbd> <span>Xem toàn màn hình</span></div>
            </div>

            <button
              onClick={() => setShowShortcutInfo(false)}
              className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs"
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* Floating Vocab/Grammar Popover */}
      {selectedToken && (
        <div 
          className="fixed inset-0 z-50 pointer-events-auto" 
          onClick={() => {
            setSelectedToken(null);
            setSelectedWord(null);
          }}
        >
          {(() => {
            const popoverWidth = 280;
            const rawLeft = selectedToken.rect.left + selectedToken.rect.width / 2;
            const popoverLeft = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, rawLeft - popoverWidth / 2));
            
            const showAbove = selectedToken.rect.bottom > window.innerHeight - 300;
            const popoverTop = showAbove ? selectedToken.rect.top - 8 : selectedToken.rect.bottom + 8;
            const arrowLeft = rawLeft - popoverLeft;

            return (
              <div 
                className="absolute bg-[#121214] border border-white/10 rounded-2xl shadow-2xl select-text animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                style={{
                  left: `${popoverLeft}px`,
                  top: `${popoverTop}px`,
                  width: `${popoverWidth}px`,
                  transform: showAbove ? "translateY(-100%)" : "none",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with word */}
                <div className="p-4 bg-gradient-to-b from-pink-500/20 to-transparent">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 
                        className="font-japanese text-2xl font-black text-white leading-tight"
                        style={{ fontFamily: "var(--font-japanese, serif)" }}
                      >
                        {selectedToken.word}
                      </h3>
                      {selectedToken.hiragana && (
                        <p className="text-xs text-white/50 mt-1 font-medium">{selectedToken.hiragana}</p>
                      )}
                    </div>
                    {selectedToken.jlpt && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        {selectedToken.jlpt}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
                
                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Meaning */}
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Nghĩa</p>
                    <p className="text-sm text-white font-semibold leading-relaxed">
                      {selectedToken.meaning || selectedToken.desc || "Đang tải..."}
                    </p>
                  </div>
                  
                  {/* Example */}
                  {selectedToken.example && (
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Ví dụ</p>
                      <p className="text-xs text-white/70 font-medium leading-relaxed bg-white/5 rounded-lg p-2.5 border border-white/5">
                        {selectedToken.example}
                      </p>
                    </div>
                  )}
                  
                  {/* Related words */}
                  {selectedToken.relatedWords && selectedToken.relatedWords.length > 0 && (
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1.5">Từ liên quan</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedToken.relatedWords.slice(0, 5).map((word, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/10 text-white/80 border border-white/10"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Grammar pattern */}
                  {selectedToken.pattern && (
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Mẫu ngữ pháp</p>
                      <p className="text-xs text-pink-400 font-mono bg-pink-500/10 rounded-lg p-2 border border-pink-500/20">
                        {selectedToken.pattern}
                      </p>
                    </div>
                  )}
                  
                  {/* Grammar examples */}
                  {selectedToken.examples && selectedToken.examples.length > 0 && (
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Ví dụ ngữ pháp</p>
                      <div className="space-y-1.5">
                        {selectedToken.examples.slice(0, 2).map((ex, idx) => (
                          <p key={idx} className="text-xs text-white/60 font-medium leading-relaxed">
                            {ex}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Expression */}
                  {selectedToken.expression && selectedToken.expression !== selectedToken.word && (
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Cụm từ</p>
                      <p className="text-xs text-white/70 font-medium font-japanese">
                        {selectedToken.expression}
                      </p>
                    </div>
                  )}
                  
                  {/* Loading state */}
                  {selectedToken.type === "loading" && (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Arrow */}
                <div 
                  className={cn(
                    "absolute w-0 h-0 border-x-8 border-x-transparent",
                    showAbove 
                      ? "bottom-0 translate-y-full border-t-8 border-t-[#121214] border-b-0" 
                      : "top-0 -translate-y-full border-b-8 border-b-[#121214] border-t-0"
                  )}
                  style={{
                    left: `${arrowLeft}px`,
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
