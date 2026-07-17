import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Mic,
  CheckCircle,
  XCircle,
  Home,
  Languages,
  ChevronRight,
  Maximize,
  Minimize,
  Lock,
  Loader2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Star,
  Lightbulb,
  Target,
  Clock,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi } from "@/lib/api/shadowing";
import { getTopicVn } from "./student.shadowing";
import { evaluateShadowingSentence, type ShadowingEvaluationResponse } from "@/lib/api/shadowingEvaluation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ClickableTranscript } from "@/components/clickable-transcript";
import { SavedWordsButton } from "@/components/saved-words-panel";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type PracticeState = "practicing" | "recording" | "feedback" | "result";

interface AIFeedback {
  overallScore: number;
  pronunciation: number;
  pitchAccent: number;
  fluency: number;
  speed: number;
  feedback: string;
  tips: string[];
  wordResults: { word: string; correct: boolean }[];
  spokenText: string;
  practiceSuggestions?: string[];
}

interface SentenceResult {
  sentenceId: string;
  text: string;
  translation: string;
  score: number;
  feedback: AIFeedback;
  needAI?: boolean;
  evaluation?: ShadowingEvaluationResponse;
  recordedAudioUrl?: string;
  tokens?: any[];
}

export const Route = createFileRoute("/student/shadowing/practice/$videoId")({
  component: ShadowingPracticePage,
});

function getRatingLabel(score: number): string {
  if (score >= 90) return "Xuất sắc";
  if (score >= 80) return "Rất tốt";
  if (score >= 70) return "Khá tốt";
  if (score >= 60) return "Trung bình";
  return "Cần cố gắng";
}

function getRatingStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 60) return 2;
  return 1;
}

function getScoreColorClass(score: number): string {
  if (score >= 85) return "text-emerald-500 dark:text-emerald-400";
  if (score >= 70) return "text-amber-500 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function getScoreBgClass(score: number): string {
  if (score >= 85) return "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/40";
  if (score >= 70) return "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/40";
  return "bg-red-50/60 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/40";
}

function getScoreGradient(score: number): string {
  if (score >= 85) return "from-emerald-500 to-teal-400";
  if (score >= 70) return "from-amber-500 to-orange-400";
  return "from-red-500 to-rose-400";
}

function getProgressColor(score: number): string {
  if (score >= 85) return "bg-gradient-to-r from-emerald-500 to-teal-400";
  if (score >= 70) return "bg-gradient-to-r from-amber-500 to-orange-400";
  return "bg-gradient-to-r from-red-500 to-rose-400";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function buildLocalFeedback(evaluation: ShadowingEvaluationResponse, reference: string): AIFeedback {
  return {
    overallScore: evaluation.overall,
    pronunciation: evaluation.overall,
    pitchAccent: evaluation.overall,
    fluency: evaluation.overall,
    speed: evaluation.overall,
    feedback: evaluation.feedback?.length ? evaluation.feedback[0] : "Đã phân tích với độ chính xác cao.",
    tips: evaluation.needAI ? evaluation.feedback : [],
    wordResults: [],
    spokenText: reference,
    practiceSuggestions: evaluation.practiceSuggestions || [],
  };
}

async function getAudioDurationMs(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audioContext = new AudioContext();
    const reader = new FileReader();
    reader.onload = () => {
      audioContext.decodeAudioData(reader.result as ArrayBuffer).then((buffer) => {
        const ms = buffer.duration * 1000;
        audioContext.close();
        resolve(ms);
      }).catch(() => resolve(0));
    };
    reader.onerror = () => resolve(0);
    reader.readAsArrayBuffer(blob);
  });
}

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/aac"
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

function getLcsAlignment(ref: string, spoken: string) {
  const m = ref.length;
  const n = spoken.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (ref[i - 1] === spoken[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const result: { char: string; isCorrect: boolean }[] = [];
  let i = m;
  let j = n;
  
  while (j > 0) {
    if (i > 0 && ref[i - 1] === spoken[j - 1]) {
      result.push({ char: spoken[j - 1], isCorrect: true });
      i--;
      j--;
    } else {
      if (i === 0 || dp[i][j - 1] >= dp[i - 1][j]) {
        result.push({ char: spoken[j - 1], isCorrect: false });
        j--;
      } else {
        i--;
      }
    }
  }
  
  return result.reverse();
}

function getGroupedLcsAlignment(ref: string, spoken: string) {
  const alignment = getLcsAlignment(ref, spoken);
  const groups: { text: string; isCorrect: boolean }[] = [];
  if (alignment.length === 0) return groups;
  
  let currentGroup = { text: alignment[0].char, isCorrect: alignment[0].isCorrect };
  for (let i = 1; i < alignment.length; i++) {
    const item = alignment[i];
    if (item.isCorrect === currentGroup.isCorrect) {
      currentGroup.text += item.char;
    } else {
      groups.push(currentGroup);
      currentGroup = { text: item.char, isCorrect: item.isCorrect };
    }
  }
  groups.push(currentGroup);
  return groups;
}

function ShadowingPracticePage() {
  const params = Route.useParams();
  const videoId = params.videoId;

  const [rawVideo, setRawVideo] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [practiceState, setPracticeState] = useState<PracticeState>("practicing");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingCompleted, setRecordingCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [sentenceResults, setSentenceResults] = useState<SentenceResult[]>([]);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [unsavedRecordings, setUnsavedRecordings] = useState<Record<string, { blob: Blob; file: File; url: string; seconds: number }>>({});
  const [showResultDialog, setShowResultDialog] = useState(false);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  // Warm up microphone permission on mount so first click doesn't delay/fail due to prompt
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch((err) => {
          console.warn("Microphone pre-authorization declined or not available:", err);
        });
    }
  }, []);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playLimit, setPlayLimit] = useState<{ start: number; end: number } | null>(null);

  const hasLoadedProgressRef = useRef(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRecordingRef = useRef(false);

  const loadVideoAndTranscript = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [v, t] = await Promise.all([
        studentShadowingApi.getVideo(videoId),
        studentShadowingApi.getTranscript(videoId),
      ]);
      setRawVideo(v);
      setTranscript(t);
    } catch (err: any) {
      const message = err?.message || "Không thể tải thông tin video.";
      console.error("Error loading video details:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadVideoAndTranscript();
  }, [loadVideoAndTranscript]);

  const sentences = useMemo(() => {
    return (transcript?.segments ?? []).map((s: any, idx: number) => ({
      id: s.id || idx.toString(),
      startTime: s.startTime,
      endTime: s.endTime,
      text: s.jpText,
      translation: s.vnText || "",
      tokens: Array.isArray(s.tokens) ? s.tokens : [],
    }));
  }, [transcript]);

  const video = useMemo(() => {
    if (!rawVideo) return null;
    return {
      id: rawVideo.id,
      title: rawVideo.title,
      description: rawVideo.description || "",
      videoUrl: rawVideo.videoUrl,
      thumbnail: rawVideo.thumbnailUrl || "",
      duration: rawVideo.duration || 0,
      jlptLevel: rawVideo.jlptLevel || "N5",
      topic: rawVideo.topic || "General",
      sentences,
    };
  }, [rawVideo, sentences]);

  const syncRecordingForSentence = useCallback((index: number, currentResults = sentenceResults, currentUnsaved = unsavedRecordings) => {
    const targetSentence = video?.sentences?.[index];
    if (!targetSentence) return;
    
    const evaluatedRes = currentResults.find((r) => r.sentenceId === targetSentence.id);
    const unsaved = currentUnsaved[targetSentence.id];
    
    if (evaluatedRes) {
      setRecordedAudioUrl(evaluatedRes.recordedAudioUrl ?? null);
      setRecordedBlob(null);
      setRecordedFile(null);
      setRecordingCompleted(true);
      setRecordingSeconds(0);
    } else if (unsaved) {
      setRecordedAudioUrl(unsaved.url);
      setRecordedBlob(unsaved.blob);
      setRecordedFile(unsaved.file);
      setRecordingCompleted(true);
      setRecordingSeconds(unsaved.seconds);
    } else {
      setRecordedAudioUrl(null);
      setRecordedBlob(null);
      setRecordedFile(null);
      setRecordingCompleted(false);
      setRecordingSeconds(0);
    }
  }, [video, sentenceResults, unsavedRecordings]);

  // Load progress once rawVideo and video are ready
  useEffect(() => {
    if (typeof window === "undefined" || !videoId || !video?.sentences?.length || hasLoadedProgressRef.current) return;
    try {
      const saved = localStorage.getItem(`shadowing-practice-${videoId}`);
      if (saved) {
        const { savedIndex, savedResults } = JSON.parse(saved);
        if (typeof savedIndex === "number" && Array.isArray(savedResults)) {
          setCurrentSentenceIndex(savedIndex);
          setSentenceResults(savedResults);
          
          const currentRes = savedResults.find((r) => r.sentenceId === video.sentences[savedIndex]?.id);
          if (currentRes) {
            setRecordedAudioUrl(currentRes.recordedAudioUrl ?? null);
            setRecordingCompleted(true);
            setShowFeedback(true);
            setPracticeState("feedback");
          }
        }
      }
      hasLoadedProgressRef.current = true;
    } catch (e) {
      console.error("Failed to load shadowing practice progress:", e);
    }
  }, [videoId, video]);

  // Save progress to localStorage when state changes
  useEffect(() => {
    if (typeof window === "undefined" || !videoId || !hasLoadedProgressRef.current) return;
    try {
      localStorage.setItem(
        `shadowing-practice-${videoId}`,
        JSON.stringify({
          savedIndex: currentSentenceIndex,
          savedResults: sentenceResults,
        })
      );
    } catch (e) {
      console.error("Failed to save shadowing practice progress:", e);
    }
  }, [videoId, currentSentenceIndex, sentenceResults]);

  const topic = useMemo(() => {
    if (!rawVideo) return null;
    return {
      id: (rawVideo.topic || "General").toLowerCase().replace(/\s+/g, "-"),
      title: rawVideo.topic || "General",
      titleVn: getTopicVn(rawVideo.topic || "General"),
      jlptLevel: rawVideo.jlptLevel || "N5",
    };
  }, [rawVideo]);

  const currentSentence = video?.sentences?.[currentSentenceIndex];
  const isLastSentence = currentSentenceIndex === (video?.sentences?.length ?? 0) - 1;

  const [historyAttempts, setHistoryAttempts] = useState<any[]>([]);

  const loadHistory = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("shadowing-attempts-history");
        setHistoryAttempts(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const currentSentenceHistory = useMemo(() => {
    if (!currentSentence) return [];
    return historyAttempts
      .filter((h: any) => h.sentenceId === currentSentence.id)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [historyAttempts, currentSentence]);

  const overallScore = useMemo(() => {
    if (sentenceResults.length === 0) return 0;
    const total = sentenceResults.reduce((acc, r) => acc + r.score, 0);
    return Math.round(total / sentenceResults.length);
  }, [sentenceResults]);

  const passed = overallScore >= 80;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === videoContainerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = useCallback(() => {
    const player = videoPlayerRef.current;
    if (!player) return;
    if (player.paused) {
      player.play().catch(() => {});
    } else {
      player.pause();
    }
  }, []);

  const playSentenceRange = useCallback((start: number, end: number) => {
    const player = videoPlayerRef.current;
    if (!player) return;
    setPlayLimit({ start, end });
    player.currentTime = start;
    player.play().catch(() => {});
  }, []);

  const handlePlayOriginal = useCallback(() => {
    if (currentSentence) {
      playSentenceRange(currentSentence.startTime, currentSentence.endTime);
    }
  }, [currentSentence, playSentenceRange]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const player = e.currentTarget;
    setCurrentTime(player.currentTime);
    if (playLimit && player.currentTime >= playLimit.end) {
      player.pause();
      setPlayLimit(null);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration || video?.duration || 0);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const player = videoPlayerRef.current;
    if (!player || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const targetTime = clickPercent * duration;
    player.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const toggleMute = () => {
    const player = videoPlayerRef.current;
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

  const startRecordingTimer = () => {
    setRecordingSeconds(0);
    setRecordingCompleted(false);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 14) {
          stopRecording();
          return 15;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const startAudioCapture = async () => {
    if (!currentSentence) return null;
    
    // Stop any existing recording first
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping recorder:", e);
      }
      mediaRecorderRef.current = null;
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : undefined;
    const recorder = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    return new Promise<MediaRecorder>((resolve, reject) => {
      recorder.onstop = () => {
        const activeMime = mimeType || recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: activeMime });
        let extension = "webm";
        if (activeMime.includes("mp4") || activeMime.includes("aac") || activeMime.includes("m4a")) {
          extension = "m4a";
        } else if (activeMime.includes("ogg")) {
          extension = "ogg";
        }
        const file = new File([blob], `shadowing-${Date.now()}.${extension}`, { type: activeMime });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedFile(file);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        
        if (currentSentence) {
          setUnsavedRecordings(prev => {
            const updated = {
              ...prev,
              [currentSentence.id]: { blob, file, url, seconds: recordingSeconds }
            };
            return updated;
          });
        }
      };
      
      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        stream.getTracks().forEach((track) => track.stop());
        reject(new Error("Recording error"));
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
      resolve(recorder);
    });
  };

  const stopRecording = async () => {
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        setRecordingCompleted(false);
        resolve();
        return;
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);

      const originalOnStop = recorder.onstop;
      recorder.onstop = (e) => {
        // Set recordingCompleted BEFORE calling original onstop
        // to ensure state is updated before Promise resolves
        setRecordingCompleted(true);
        if (originalOnStop) {
          originalOnStop.call(recorder, e);
        }
        resolve();
      };

      try {
        recorder.stop();
      } catch (err) {
        console.error("Failed to stop MediaRecorder:", err);
        setRecordingCompleted(false);
        resolve();
      }
    });
  };

  const handleRecordClick = useCallback(async () => {
    if (isProcessingRecordingRef.current) return;
    if (isRecording) {
      isProcessingRecordingRef.current = true;
      await stopRecording();
      isProcessingRecordingRef.current = false;
    } else {
      isProcessingRecordingRef.current = true;
      setEvaluationError(null);
      setRecordingCompleted(false);
      setShowFeedback(false);
      if (playbackRef.current) {
        playbackRef.current.pause();
        playbackRef.current = null;
      }
      try {
        await startAudioCapture();
        setIsRecording(true);
        setPracticeState("recording");
        startRecordingTimer();
      } catch (err: any) {
        console.error("Microphone capture failed:", err);
        setIsRecording(false);
        setRecordingCompleted(false);
        setEvaluationError(
          "Không thể ghi âm. Vui lòng cấp quyền truy cập microphone cho trang web này và kiểm tra kết nối micro của bạn."
        );
      }
      isProcessingRecordingRef.current = false;
    }
  }, [isRecording]);

  const lastResult = sentenceResults.find((r) => r.sentenceId === currentSentence?.id);

  const playRecordedAudio = useCallback(() => {
    // Ưu tiên dùng lastResult URL (khi quay lại câu cũ đã chấm)
    const url = recordedAudioUrl ?? lastResult?.recordedAudioUrl;
    if (!url) return;
    if (playbackRef.current) {
      if (playbackRef.current.paused) {
        playbackRef.current.play();
      } else {
        playbackRef.current.pause();
        playbackRef.current.currentTime = 0;
      }
      return;
    }
    const audio = new Audio(url);
    playbackRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => {
      playbackRef.current = null;
    };
  }, [recordedAudioUrl, lastResult]);

  const playRecordedAudioForSentence = useCallback((url: string) => {
    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current = null;
    }
    const audio = new Audio(url);
    playbackRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => {
      playbackRef.current = null;
    };
  }, []);

  const handleNextSentence = useCallback(() => {
    setShowFeedback(false);
    setRecordingSeconds(0);
    setEvaluationError(null);
    if (isLastSentence) {
      setPracticeState("result");
    } else {
      const nextIdx = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIdx);
      setPracticeState("practicing");
      syncRecordingForSentence(nextIdx);
    }
  }, [currentSentenceIndex, isLastSentence, syncRecordingForSentence]);

  const handleRetry = useCallback(() => {
    setPracticeState("practicing");
    setCurrentSentenceIndex(0);
    setSentenceResults([]);
    setUnsavedRecordings({});
    setShowFeedback(false);
    setRecordingCompleted(false);
    setRecordingSeconds(0);
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordedFile(null);
    setEvaluationError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`shadowing-practice-${videoId}`);
    }
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = 0;
      videoPlayerRef.current.pause();
    }
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <p className="text-sm text-white/60 mb-4">{error || "Không thể tải video."}</p>
          <Link
            to="/student/shadowing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentSentenceIndex + (showFeedback ? 1 : 0)) / (video.sentences.length || 1)) * 100);

  return (
    <div className="min-h-screen relative flex flex-col pb-12">
      <SakuraBg count={14} />
          <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm mb-6">
          <div className="flex items-center gap-3.5">
            <Link
              to="/student/shadowing/video/$videoId"
              params={{ videoId }}
              className="w-10 h-10 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-primary/10 text-primary border border-primary/20">
                  JLPT {video.jlptLevel}
                </span>
                <h1 className="font-display font-black text-sm text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-[320px]">
                  {video.title}
                </h1>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Luyện Shadowing</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SavedWordsButton />
            {practiceState !== "result" && (
              <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                <span className="text-[10px] text-muted-foreground font-bold">
                  Tiến trình: <span className="text-primary font-black">{currentSentenceIndex + 1}</span> / {video.sentences.length} câu
                </span>
                <div className="w-40 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300/40 dark:border-white/5">
                  <motion.div
                    className="h-full bg-linear-to-r from-pink-500 to-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">

          {/* Top Section: Smaller Video + Current Sentence */}
          {practiceState !== "result" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left: Smaller Video Player */}
              <div className="lg:col-span-5">
                <div
                  ref={videoContainerRef}
                  className={cn(
                    "relative bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl flex flex-col transition-all duration-150 group",
                    isFullscreen ? "w-screen h-screen rounded-none border-0" : "aspect-video"
                  )}
                >
                  <video
                    ref={videoPlayerRef}
                    src={video.videoUrl}
                    poster={video.thumbnail}
                    className="flex-1 w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls={false}
                  />

                  <div className="bg-[#0b0f19]/95 border-t border-slate-800 px-3 py-2 flex flex-col gap-1.5 shrink-0 select-none">
                    <div
                      onClick={handleTimelineClick}
                      className="relative w-full h-1 bg-slate-800 rounded-full cursor-pointer hover:h-1.5 transition-all flex items-center"
                    >
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                      {duration > 0 && video.sentences.map((s: { id: string; startTime: number; endTime: number }, idx: number) => {
                        const pct = (s.startTime / duration) * 100;
                        return (
                          <button
                            key={s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              playSentenceRange(s.startTime, s.endTime);
                              setCurrentSentenceIndex(idx);
                              setPracticeState("practicing");
                              setShowFeedback(false);
                              syncRecordingForSentence(idx);
                            }}
                            style={{ left: `${pct}%` }}
                            className={cn(
                              "absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 border transition-all duration-150 cursor-pointer",
                              idx === currentSentenceIndex
                                ? "bg-primary border-white scale-125 z-20"
                                : "bg-slate-500 border-slate-400 hover:scale-110"
                            )}
                          />
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-2">
                        <button onClick={togglePlay} className="hover:text-primary transition p-0.5 cursor-pointer">
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={toggleMute} className="hover:text-primary transition p-0.5 cursor-pointer">
                          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-[10px] font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>
                      <button onClick={toggleFullscreen} className="hover:text-primary transition p-0.5 cursor-pointer">
                        {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Current Sentence Display */}
              {currentSentence && (
                <div className="lg:col-span-7 bg-slate-900/70 dark:bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">
                      Câu {currentSentenceIndex + 1} / {video.sentences.length}
                    </span>
                    <button
                      onClick={() => setShowTranslation(!showTranslation)}
                      className={cn(
                        "p-1.5 rounded-lg transition cursor-pointer hover:bg-white/10",
                        showTranslation ? "text-primary" : "text-slate-400"
                      )}
                      title="Hiện/Ẩn nghĩa"
                    >
                      <Languages className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col justify-center">
                    <div className="relative">
                      <ClickableTranscript
                        text={currentSentence.text}
                        contextSentence={currentSentence.text}
                        tokens={currentSentence.tokens}
                        className="text-xl md:text-2xl font-black text-slate-100 leading-relaxed"
                      />
                      <span className="absolute -top-5 right-0 text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                        Tap word to see meaning
                      </span>
                    </div>
                    {showTranslation && (
                      <p className="text-xs md:text-sm text-emerald-400 italic font-medium">
                        {currentSentence.translation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayOriginal}
                      disabled={isRecording}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-slate-700/80 text-slate-300 hover:text-primary hover:bg-white/10 transition text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Nghe mẫu
                    </button>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 shrink-0">
                      <span>{formatTime(currentSentence.startTime)}</span>
                      <span>→</span>
                      <span>{formatTime(currentSentence.endTime)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress bar */}
          {practiceState !== "result" && (
            <div className="flex items-center gap-3 px-1">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider shrink-0">
                Tiến trình
              </span>
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300/40 dark:border-white/5">
                <motion.div
                  className="h-full bg-linear-to-r from-pink-500 to-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0">
                {currentSentenceIndex + 1}/{video.sentences.length}
              </span>
            </div>
          )}

          {/* 3-Step Practice Cards */}
          {practiceState !== "result" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

              {/* Card 1: Ghi âm */}
              <div className="md:col-span-4 bg-white/40 dark:bg-slate-900/20 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-red-500" />
                    1. Ghi âm
                  </h3>
                  <span className="text-[9px] font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {isRecording ? "Đang ghi..." : recordingCompleted ? "Hoàn thành" : "Chờ ghi"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                  Nhấn để bắt đầu ghi âm câu của bạn. Tối đa 15 giây.
                </p>
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-1">
                  {/* Animated waveform */}
                  <div className="flex items-center gap-1 h-8">
                    {[12, 20, 8, 16, 24, 10, 18, 6].map((h, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-0.5 rounded-full transition-all bg-slate-400 dark:bg-slate-600",
                          isRecording ? "bg-red-400 animate-pulse" : "bg-slate-400 dark:bg-slate-600"
                        )}
                        style={{
                          height: isRecording ? `${h}px` : "4px",
                          animationDelay: `${i * 80}ms`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    {isRecording ? `${recordingSeconds}s / 15s` : recordingCompleted ? "Đã ghi xong" : "Sẵn sàng"}
                  </span>
                  <button
                    onClick={handleRecordClick}
                    disabled={isPlaying || isProcessingRecordingRef.current}
                    className="group relative"
                    title={isProcessingRecordingRef.current ? "Đang xử lý..." : "Nhấn để ghi âm"}
                  >
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping scale-110" />
                    )}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all border duration-300 relative z-10 cursor-pointer",
                        isRecording
                          ? "bg-red-500 border-red-600 scale-105"
                          : "bg-linear-to-br from-pink-500 to-red-500 hover:scale-105 border-transparent"
                      )}
                    >
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                <Button
                  onClick={playRecordedAudio}
                  disabled={
                    !recordingCompleted ||
                    isRecording
                  }
                  className="rounded-xl h-9 font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed w-full justify-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {recordingCompleted ? "Nghe lại bản ghi" : "Chưa có bản ghi"}
                </Button>
                  {recordingCompleted && !showFeedback && (
                    <p className="text-[9px] text-center font-bold text-muted-foreground">
                      Bấm "Chấm điểm ngay" bên cạnh để xem kết quả
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: Kết quả luyện tập */}
              <div className="md:col-span-8 bg-white/40 dark:bg-slate-900/20 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    2. Kết Quả Luyện Tập
                  </h3>
                  {showFeedback && lastResult && (
                    <span className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      Đã hoàn thành
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                  Bấm nút để hệ thống phân tích bản ghi và đưa ra phản hồi chi tiết.
                </p>

                {/* Result Display */}
                {isEvaluating ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-[11px] font-bold text-primary animate-pulse text-center leading-relaxed">
                      Đang phân tích bản ghi của bạn...<br />Vui lòng đợi trong giây lát.
                    </span>
                  </div>
                ) : evaluationError ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4 text-center px-4">
                    <XCircle className="w-8 h-8 text-red-500 animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">
                      Lỗi phân tích
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-relaxed max-w-xs">
                      {evaluationError}
                    </span>
                  </div>
                ) : !showFeedback || !lastResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 py-2">
                    {recordingCompleted ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/30">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 text-center leading-relaxed px-2">
                          Bản ghi âm đã sẵn sàng!<br />Nhấn "Chấm điểm" dưới đây để xem kết quả.
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        <span className="text-[9px] font-bold text-muted-foreground text-center leading-relaxed px-2">
                          Hoàn thành ghi âm<br />để xem kết quả
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/30">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Phân tích hoàn tất!
                    </span>
                    <Button
                      onClick={() => setShowResultDialog(true)}
                      className="mt-1 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-102 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      Xem kết quả & lịch sử luyện
                    </Button>
                    <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-white/10 shadow-2xl scrollbar-thin">
                        <div className="flex flex-col gap-4">
                          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Chi tiết kết quả & Lịch sử
                          </h2>

                    {/* Compact Score Card */}
                    <div className={cn(
                      "rounded-2xl p-4 border flex items-center justify-between gap-4 shadow-sm",
                      getScoreBgClass(lastResult.score)
                    )}>
                      <div className="flex items-center gap-4">
                        {/* Mini Circular Score */}
                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="26" className="stroke-slate-200/60 dark:stroke-slate-800/40 fill-none" strokeWidth="6" />
                            <circle
                              cx="32"
                              cy="32"
                              r="26"
                              className="fill-none transition-all duration-500 ease-out"
                              strokeWidth="6"
                              strokeDasharray={2 * Math.PI * 26}
                              strokeDashoffset={2 * Math.PI * 26 * (1 - lastResult.score / 100)}
                              stroke="currentColor"
                              style={{
                                color: lastResult.score >= 85 ? '#10b981' : lastResult.score >= 70 ? '#f59e0b' : '#ef4444'
                              }}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className={cn("text-lg font-black leading-none", getScoreColorClass(lastResult.score))}>
                              {lastResult.score}
                            </span>
                            <span className="text-[8px] font-bold text-muted-foreground">/100</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < getRatingStars(lastResult.score)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300 dark:text-slate-700"
                                )}
                              />
                            ))}
                          </div>
                          <div className={cn(
                            "inline-flex w-fit px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                            lastResult.score >= 85
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : lastResult.score >= 70
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                                : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                          )}>
                            {getRatingLabel(lastResult.score)}
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground">
                            {lastResult.evaluation
                              ? `Độ chính xác: ${Math.round(lastResult.evaluation.accuracy ?? lastResult.score)}% · Độ trùng khớp: ${Math.round(lastResult.evaluation.similarity ?? lastResult.score)}%`
                              : "Đã chấm"}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Detailed section: metrics + pronunciation comparison + suggestions + history */}
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                      {/* Detailed Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-slate-200/50 dark:border-white/5 flex flex-col justify-between gap-3 shadow-xs">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  Độ chính xác
                                </span>
                                <span className={cn("text-xs font-black font-mono", getScoreColorClass(lastResult.evaluation?.accuracy ?? lastResult.score))}>
                                  {Math.round(lastResult.evaluation?.accuracy ?? lastResult.score)}%
                                </span>
                              </div>
                              <p className="text-[9px] text-muted-foreground font-medium mb-2">
                                Tỉ lệ phát âm chính xác các từ vựng trong câu mẫu.
                              </p>
                            </div>
                            <Progress
                              value={lastResult.evaluation?.accuracy ?? lastResult.score}
                              className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"
                              indicatorClassName={getProgressColor(lastResult.evaluation?.accuracy ?? lastResult.score)}
                            />
                          </div>

                          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-slate-200/50 dark:border-white/5 flex flex-col justify-between gap-3 shadow-xs">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  Độ trùng khớp
                                </span>
                                <span className={cn("text-xs font-black font-mono", getScoreColorClass(lastResult.evaluation?.similarity ?? lastResult.score))}>
                                  {Math.round(lastResult.evaluation?.similarity ?? lastResult.score)}%
                                </span>
                              </div>
                              <p className="text-[9px] text-muted-foreground font-medium mb-2">
                                Mức độ tương đồng về ngữ điệu và nhịp điệu so với câu mẫu.
                              </p>
                            </div>
                            <Progress
                              value={lastResult.evaluation?.similarity ?? lastResult.score}
                              className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"
                              indicatorClassName={getProgressColor(lastResult.evaluation?.similarity ?? lastResult.score)}
                            />
                          </div>
                        </div>

                        {/* Transcript Comparison */}
                        {(() => {
                          const ref = lastResult.text;
                          const eval_ = lastResult.evaluation;
                          if (!eval_) return null;

                          const spokenText = eval_.transcript || lastResult.feedback.spokenText || "";

                          return (
                            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-slate-200/50 dark:border-white/5 flex flex-col gap-3 shadow-xs">
                              <div className="flex items-center gap-2 mb-0.5">
                                <Target className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                  So sánh phát âm chi tiết
                                </span>
                              </div>

                              {/* Reference Sentence */}
                              <div>
                                <div className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1.5">
                                  Câu mẫu chuẩn
                                </div>
                                <p
                                  className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed bg-slate-50/50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-white/5"
                                  style={{ fontFamily: "var(--font-japanese, serif)" }}
                                >
                                  {ref}
                                </p>
                              </div>

                              {/* Your Pronunciation */}
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                    Phát âm của bạn
                                  </div>
                                  {(recordedAudioUrl || lastResult?.recordedAudioUrl) && (
                                    <button
                                      onClick={playRecordedAudio}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 text-[9px] font-bold transition-all cursor-pointer hover:scale-102"
                                      title="Nghe lại câu nói của bạn"
                                    >
                                      <Volume2 className="w-3 h-3" />
                                      Nghe lại
                                    </button>
                                  )}
                                </div>

                                {/* Word/Character Comparison */}
                                <div className="flex flex-wrap gap-1.5 bg-slate-50/50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 min-h-[46px] items-center">
                                  {spokenText.trim() ? (
                                    getGroupedLcsAlignment(ref, spokenText).map((group, i) => {
                                      if (group.text === " " || /^[。、！？「」『』（）]+$/.test(group.text)) {
                                        return <span key={i} className="text-slate-700 dark:text-slate-300 text-sm font-bold">{group.text}</span>;
                                      }
                                      return (
                                        <span
                                          key={i}
                                          className={cn(
                                            "px-2.5 py-1.5 rounded-xl text-xs font-black shadow-xs border transition-all duration-200 hover:scale-105 select-none",
                                            group.isCorrect
                                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30"
                                              : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30"
                                          )}
                                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                                          title={group.isCorrect ? "Đúng" : "Sai / Thừa"}
                                        >
                                          {group.text}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <p className="text-xs italic text-slate-455">Không nhận diện được giọng nói</p>
                                  )}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-slate-200/40 dark:border-white/5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đúng</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sai / Thừa</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Practice Suggestions */}
                        <div className="bg-linear-to-br from-purple-50/60 to-pink-50/60 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-3 border border-purple-200/40 dark:border-purple-800/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                              Gợi ý luyện tập
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {lastResult.evaluation?.practiceSuggestions && lastResult.evaluation.practiceSuggestions.length > 0 ? (
                              lastResult.evaluation.practiceSuggestions.slice(0, 5).map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{suggestion}</span>
                                </li>
                              ))
                            ) : (
                              <>
                                <li className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>Nghe mẫu phát âm chậm rãi và nhắm mắt theo dõi.</span>
                                </li>
                                <li className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>Chú ý đến âm dài (long vowels) và thanh điệu.</span>
                                </li>
                                <li className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>Lặp lại câu này 3-5 lần để ghi nhớ.</span>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>

                        {/* Sentence Practice History */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/40 dark:border-white/5 space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-700/50 pb-1.5">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              Lịch sử luyện tập ({currentSentenceHistory.length} lần)
                            </span>
                          </div>
                          {currentSentenceHistory.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic">Chưa có lịch sử luyện tập trước đó.</p>
                          ) : (
                            <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                              {currentSentenceHistory.map((attempt: any, idx: number) => {
                                const date = new Date(attempt.timestamp);
                                const formattedTime = date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
                                const formattedDate = date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });

                                return (
                                  <div key={idx} className="flex items-center justify-between gap-4 p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5 text-[10px]">
                                    <div className="text-slate-500 dark:text-slate-400 font-medium">
                                      {formattedTime} - {formattedDate}
                                    </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">Điểm:</span>
                                  <span className={cn("font-bold font-mono", getScoreColorClass(attempt.score))}>
                                    {attempt.score}/100
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-700">|</span>
                                  <span className="text-slate-400">Độ khớp:</span>
                                  <span className="font-bold text-slate-600 dark:text-slate-300 font-mono">
                                    {attempt.similarity}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                        </div>
                      </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* Evaluate Button */}
                <Button
                  onClick={async () => {
                    if (!currentSentence || !recordedFile) return;
                    setEvaluationError(null);
                    setIsEvaluating(true);
                    try {
                      const durationMs = await getAudioDurationMs(recordedBlob!);
                      // Bypass check if durationMs is 0 (decoding issue on WebM) or allow if duration is at least 200ms
                      if (durationMs > 0 && durationMs < 200) {
                        setEvaluationError("Bản ghi quá ngắn. Vui lòng ghi âm ít nhất 0.2 giây và thử lại.");
                        setIsEvaluating(false);
                        return;
                      }
                      const eval_ = await evaluateShadowingSentence(videoId, currentSentenceIndex + 1, recordedFile);
                      if (eval_.validationError) {
                        setEvaluationError(eval_.validationError);
                        setIsEvaluating(false);
                        return;
                      }
                      const feedback = buildLocalFeedback(eval_, currentSentence.text);
                      const result: SentenceResult = {
                        sentenceId: currentSentence.id,
                        text: currentSentence.text,
                        translation: currentSentence.translation,
                        score: eval_.overall,
                        feedback,
                        needAI: eval_.needAI,
                        evaluation: eval_,
                        recordedAudioUrl: recordedAudioUrl ?? undefined,
                        tokens: currentSentence.tokens,
                      };
                      setSentenceResults((prev) => {
                        const idx = prev.findIndex((r) => r.sentenceId === currentSentence.id);
                        if (idx !== -1) {
                          const updated = [...prev];
                          updated[idx] = result;
                          return updated;
                        }
                        return [...prev, result];
                      });
                      
                      // Save attempt to history
                      if (typeof window !== "undefined") {
                        try {
                          const historyKey = "shadowing-attempts-history";
                          const storedHistory = localStorage.getItem(historyKey);
                          const historyList = storedHistory ? JSON.parse(storedHistory) : [];
                          
                          const newAttempt = {
                            videoId,
                            sentenceId: currentSentence.id,
                            sentenceText: currentSentence.text,
                            score: eval_.overall,
                            accuracy: eval_.accuracy,
                            similarity: eval_.similarity,
                            timestamp: new Date().toISOString(),
                          };
                          
                          localStorage.setItem(historyKey, JSON.stringify([newAttempt, ...historyList].slice(0, 1000)));
                          loadHistory(); // Refresh history
                        } catch (e) {
                          console.error("Failed to save shadowing attempt history:", e);
                        }
                      }
                      setUnsavedRecordings(prev => {
                        const updated = { ...prev };
                        delete updated[currentSentence.id];
                        return updated;
                      });
                      setShowFeedback(true);
                      setPracticeState("feedback");
                    } catch (err: any) {
                      setEvaluationError(err?.message || "Phân tích thất bại");
                    } finally {
                      setIsEvaluating(false);
                    }
                  }}
                  disabled={!recordingCompleted || showFeedback || isRecording || !recordedFile || isEvaluating}
                  className={cn(
                    "rounded-xl h-11 font-bold transition text-sm flex items-center gap-2 w-full justify-center cursor-pointer",
                    !recordingCompleted || showFeedback || isRecording || !recordedFile || isEvaluating
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      : "bg-linear-to-r from-purple-500 to-pink-500 hover:opacity-95 text-white shadow-md"
                  )}
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {showFeedback ? "Đã hoàn thành" : "Chấm điểm ngay"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {evaluationError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
              {evaluationError}
            </div>
          )}

          {/* Navigation: prev / next */}
          {practiceState !== "result" && (
            <div className="flex items-center justify-between w-full pt-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentSentenceIndex === 0 || isRecording}
                onClick={() => {
                  if (currentSentenceIndex > 0) {
                    const prevIdx = currentSentenceIndex - 1;
                    setCurrentSentenceIndex(prevIdx);
                    setSentenceResults((prev) => prev.slice(0, -1));
                    setShowFeedback(false);
                    setEvaluationError(null);
                    syncRecordingForSentence(prevIdx);
                  }
                }}
                className="text-xs font-bold text-muted-foreground hover:text-primary transition flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed h-9 rounded-xl"
              >
                ◀ Câu trước
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLastSentence || isRecording}
                onClick={() => {
                  if (!isLastSentence) {
                    const nextIdx = currentSentenceIndex + 1;
                    setCurrentSentenceIndex(nextIdx);
                    setShowFeedback(false);
                    setEvaluationError(null);
                    syncRecordingForSentence(nextIdx);
                  }
                }}
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed h-9 rounded-xl"
                >
                  Bỏ qua ▶
                </Button>
                <Button
                  onClick={handleNextSentence}
                  disabled={!showFeedback}
                  className="rounded-xl h-9 px-4 font-black bg-gradient-hero text-white hover:opacity-95 transition text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  {isLastSentence ? "Xem kết quả" : "Câu tiếp theo"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {practiceState === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              {/* Overall Result Card */}
              <div className={cn(
                "rounded-3xl p-8 text-center border-2",
                passed
                  ? "bg-linear-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/60 dark:border-emerald-800/40"
                      : "bg-linear-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/60 dark:border-amber-800/40"
              )}>
                {/* Success Icon */}
                <div className="relative inline-block mb-4">
                  <div className={cn(
                    "w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg",
                    passed
                      ? "bg-linear-to-br from-emerald-400 to-teal-500"
                      : "bg-linear-to-br from-amber-400 to-orange-500"
                  )}>
                    {passed ? (
                      <CheckCircle className="w-10 h-10 text-white" />
                    ) : (
                      <RefreshCw className="w-10 h-10 text-white" />
                    )}
                  </div>
                  {passed && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2 mb-6">
                  <h2 className={cn(
                    "text-2xl font-black uppercase tracking-wide",
                    passed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  )}>
                    {passed ? "Chúc mừng bạn!" : "Cần luyện thêm"}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                    {passed
                      ? "Bạn đã hoàn thành bài luyện tập. Hãy tiếp tục phát huy nhé!"
                      : "Đừng nản lòng! Hãy luyện tập thêm để cải thiện kỹ năng phát âm."}
                  </p>
                </div>

                {/* Overall Score */}
                <div className="flex justify-center items-baseline gap-1 py-2 mb-4">
                  <span className={cn(
                    "text-7xl font-black leading-none bg-clip-text text-transparent bg-linear-to-r",
                    passed ? "from-emerald-500 to-teal-400" : "from-amber-500 to-orange-400"
                  )}>
                    {overallScore}
                  </span>
                  <span className="text-lg font-bold text-muted-foreground">/100</span>
                </div>

                {/* Stars Rating */}
                <div className="flex items-center justify-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < getRatingStars(overallScore)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      )}
                    />
                  ))}
                </div>

                {/* Rating Label */}
                <div className={cn(
                  "inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4",
                  passed
                    ? "bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-100/60 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                )}>
                  {getRatingLabel(overallScore)}
                </div>

                {/* Summary Stats */}
                <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-200/40 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      <span className="font-black text-foreground">{sentenceResults.filter((r) => r.score >= 80).length}</span> / {sentenceResults.length} câu đạt
                    </span>
                  </div>
                </div>
              </div>

              {/* Sentence Scores */}
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Chi Tiết Từng Câu
                  </h3>
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-800/85 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {showTranslation ? "Ẩn Nghĩa" : "Hiện Nghĩa"}
                  </button>
                </div>
                <div className="space-y-2.5">
                  {sentenceResults.map((result, i) => (
                    <div
                      key={result.sentenceId}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3 rounded-2xl border transition-all duration-200 shadow-xs",
                        getScoreBgClass(result.score)
                      )}
                    >
                      <span
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 shadow-xs",
                          result.score >= 80
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <ClickableTranscript
                          text={result.text}
                          contextSentence={result.text}
                          tokens={result.tokens}
                          className="text-sm font-bold text-slate-800 dark:text-white truncate"
                        />
                        {showTranslation && (
                          <p className="text-[11px] text-muted-foreground truncate italic mt-0.5">{result.translation}</p>
                        )}
                      </div>

                      {result.recordedAudioUrl && (
                        <button
                          onClick={() => playRecordedAudioForSentence(result.recordedAudioUrl!)}
                          className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-pink-500 transition shrink-0 cursor-pointer shadow-xs"
                          title="Nghe lại"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}

                      <span className={cn("text-base font-black shrink-0", getScoreColorClass(result.score))}>
                        {result.score}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="rounded-2xl py-5 font-bold border-2 border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs text-sm h-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  Luyện lại
                </Button>
                <Link
                  to="/student/shadowing"
                  className="flex items-center justify-center gap-2 rounded-2xl py-5 bg-linear-to-r from-pink-500 to-purple-500 text-white font-bold text-sm hover:opacity-95 shadow-md transition"
                >
                  <Home className="w-4 h-4" />
                  Về trang chính
                </Link>
                <Link
                  to="/student/shadowing/review/$videoId"
                  params={{ videoId }}
                  className="flex items-center justify-center gap-2 rounded-2xl py-5 bg-linear-to-r from-sky-500 to-blue-500 text-white font-bold text-sm hover:opacity-95 shadow-md transition"
                >
                  <ArrowRight className="w-4 h-4" />
                  Tiếp tục học
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
