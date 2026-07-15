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
  Award,
  ChevronRight,
  TrendingUp,
  Maximize,
  Minimize,
  Lock,
  Headphones,
  Loader2,
  BookmarkCheck,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi } from "@/lib/api/shadowing";
import { getTopicVn } from "./student.shadowing";
import { evaluateShadowingSentence, type ShadowingEvaluationResponse } from "@/lib/api/shadowingEvaluation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClickableTranscript } from "@/components/clickable-transcript";
import { SavedWordsButton } from "@/components/saved-words-panel";

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

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-500 dark:text-emerald-400";
  if (score >= 70) return "text-amber-500 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function scoreBg(score: number) {
  if (score >= 85) return "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30";
  if (score >= 70) return "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30";
  return "bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/30";
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
    feedback: evaluation.feedback?.length ? evaluation.feedback[0] : "Auto-evaluated with backend similarity check.",
    tips: evaluation.needAI ? evaluation.feedback : [],
    wordResults: [],
    spokenText: reference,
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

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playLimit, setPlayLimit] = useState<{ start: number; end: number } | null>(null);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

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
      setRecordingCompleted(true);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    return recorder;
  };

  const stopRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const handleRecordClick = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
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

  const handleNextSentence = useCallback(() => {
    setShowFeedback(false);
    // Chỉ xóa recording state nếu câu tiếp chưa được chấm
    const nextIdx = currentSentenceIndex + 1;
    const nextResult = sentenceResults.find(
      (r) => r.sentenceId === video?.sentences[nextIdx]?.id,
    );
    if (!nextResult) {
      setRecordingCompleted(false);
      setRecordedAudioUrl(null);
      setRecordedBlob(null);
      setRecordedFile(null);
    } else {
      // Restore URL để nút "Nghe lại" hoạt động
      setRecordedAudioUrl(nextResult.recordedAudioUrl ?? null);
      setRecordingCompleted(true);
    }
    setRecordingSeconds(0);
    setEvaluationError(null);
    if (isLastSentence) {
      setPracticeState("result");
    } else {
      setCurrentSentenceIndex((prev) => prev + 1);
      setPracticeState("practicing");
    }
  }, [currentSentenceIndex, isLastSentence, sentenceResults, video]);

  const handleRetry = useCallback(() => {
    setPracticeState("practicing");
    setCurrentSentenceIndex(0);
    setSentenceResults([]);
    setShowFeedback(false);
    setRecordingCompleted(false);
    setRecordingSeconds(0);
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordedFile(null);
    setEvaluationError(null);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = 0;
      videoPlayerRef.current.pause();
    }
  }, []);

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
                    {isRecording ? "Recording..." : recordingCompleted ? "Done" : "Chờ ghi"}
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
                    disabled={isPlaying}
                    className="group relative"
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
                      Bấm "Chấm điểm AI" bên cạnh để nhận kết quả
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: AI Chấm điểm */}
              <div className="md:col-span-8 bg-white/40 dark:bg-slate-900/20 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-500" />
                    2. AI Chấm điểm
                  </h3>
                  {showFeedback && lastResult && (
                    <span className="text-[9px] font-black text-purple-500 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full">
                      {lastResult.score}/100
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                  Bấm nút để AI phân tích bản ghi và đưa ra phản hồi chi tiết.
                </p>

                {/* AI Result Display */}
                {isEvaluating ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-[11px] font-bold text-primary animate-pulse text-center leading-relaxed">
                      AI đang chấm điểm của bạn...<br />Vui lòng đợi trong giây lát.
                    </span>
                  </div>
                ) : !showFeedback || !lastResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 py-2">
                    <Lock className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    <span className="text-[9px] font-bold text-muted-foreground text-center leading-relaxed px-2">
                      Hoàn thành ghi âm<br />để AI chấm điểm
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-2.5 py-1">
                    {/* Score display */}
                    <div className="flex items-center justify-between bg-slate-800/80 rounded-xl px-3 py-2">
                      <div className="text-center">
                        <div className={cn("text-2xl font-black", scoreColor(lastResult.score))}>
                          {lastResult.score}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tổng điểm</div>
                      </div>
                      <div className="h-8 w-px bg-slate-600" />
                      <div className="text-center">
                        <div className="text-2xl font-black text-emerald-400">
                          {Math.round(lastResult.evaluation?.accuracy ?? lastResult.score)}%
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Độ chính xác</div>
                      </div>
                      <div className="h-8 w-px bg-slate-600" />
                      <div className="text-center">
                        <div className="text-2xl font-black text-blue-400">
                          {Math.round(lastResult.evaluation?.similarity ?? lastResult.score)}%
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trùng khớp</div>
                      </div>
                    </div>

                    {/* Word-by-word comparison */}
                    {(() => {
                      const ref = lastResult.text;
                      const eval_ = lastResult.evaluation;
                      if (!eval_) return null;

                      const spokenText = eval_.transcript || lastResult.feedback.spokenText || "";
                      const spokenWords = spokenText.split(/\s+/).filter(Boolean);
                      const wrongSet = new Set(eval_.wrongWords ?? []);
                      const extraSet = new Set(eval_.extraWords ?? []);

                      return (
                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-200 dark:border-white/5 flex flex-col gap-3">
                          {/* System Sentence */}
                          <div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                              Câu hệ thống:
                            </span>
                            <p 
                              className="text-sm font-bold text-slate-800 dark:text-slate-100"
                              style={{ fontFamily: "var(--font-japanese, serif)" }}
                            >
                              {ref}
                            </p>
                          </div>

                          <div className="h-px bg-slate-200 dark:bg-slate-800" />

                          {/* Spoken Sentence */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Câu của bạn:
                              </span>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-800 border-2 border-emerald-400 dark:border-emerald-600" />
                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Đúng</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-3 h-3 rounded bg-red-200 dark:bg-red-800 border-2 border-red-400 dark:border-red-600" />
                                  <span className="text-[9px] font-bold text-red-600 dark:text-red-400">Sai</span>
                                </div>
                              </div>
                            </div>
                            {spokenWords.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {spokenWords.map((word, i) => {
                                  if (word === " " || /^[。、！？「」『』（）]+$/.test(word)) {
                                    return <span key={i} className="text-slate-700 dark:text-slate-300">{word}</span>;
                                  }
                                  const isWrong = wrongSet.has(word) || extraSet.has(word);
                                  if (isWrong) {
                                    return (
                                      <span 
                                        key={i} 
                                        className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-700 text-xs font-bold shadow-sm"
                                        style={{ fontFamily: "var(--font-japanese, serif)" }}
                                      >
                                        {word}
                                      </span>
                                    );
                                  }
                                  return (
                                    <span 
                                      key={i} 
                                      className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-300 dark:border-emerald-700 text-xs font-bold shadow-sm"
                                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                                    >
                                      {word}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs italic text-slate-400">Không nhận diện được giọng nói</p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Feedback text */}
                    {lastResult.feedback.feedback && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-relaxed px-1">
                        "{lastResult.feedback.feedback}"
                      </p>
                    )}
                  </div>
                )}

                {/* AI Grade Button */}
                <Button
                  onClick={async () => {
                    if (!currentSentence || !recordedFile) return;
                    setEvaluationError(null);
                    setIsEvaluating(true);
                    try {
                      const durationMs = await getAudioDurationMs(recordedBlob!);
                      if (durationMs < 300) {
                        setEvaluationError("Bản ghi quá ngắn. Vui lòng ghi âm ít nhất 0.3 giây và thử lại.");
                        setIsEvaluating(false);
                        return;
                      }
                      const eval_ = await evaluateShadowingSentence(videoId, currentSentenceIndex + 1, recordedFile);
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
                      setShowFeedback(true);
                      setPracticeState("feedback");
                    } catch (err: any) {
                      setEvaluationError(err?.message || "Evaluation failed");
                    } finally {
                      setIsEvaluating(false);
                    }
                  }}
                  disabled={!recordingCompleted || showFeedback || isRecording || !recordedFile || isEvaluating}
                  className={cn(
                    "rounded-xl h-9 font-black transition text-xs flex items-center gap-1.5 w-full justify-center cursor-pointer",
                    !recordingCompleted || showFeedback || isRecording || !recordedFile || isEvaluating
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      : "bg-linear-to-r from-purple-500 to-pink-500 hover:opacity-95 text-white shadow-md"
                  )}
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang chấm điểm...
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5" />
                      {showFeedback ? "Đã chấm điểm" : "Chấm điểm AI"}
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
                    const prevResult = sentenceResults.find(
                      (r) => r.sentenceId === video?.sentences[prevIdx]?.id,
                    );
                    setCurrentSentenceIndex((prev) => prev - 1);
                    setSentenceResults((prev) => prev.slice(0, -1));
                    setShowFeedback(false);
                    setEvaluationError(null);
                    setRecordingSeconds(0);
                    if (prevResult) {
                      setRecordedAudioUrl(prevResult.recordedAudioUrl ?? null);
                      setRecordingCompleted(true);
                    } else {
                      setRecordedAudioUrl(null);
                      setRecordedBlob(null);
                      setRecordedFile(null);
                      setRecordingCompleted(false);
                    }
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
                    const nextResult = sentenceResults.find(
                      (r) => r.sentenceId === video?.sentences[nextIdx]?.id,
                    );
                    setCurrentSentenceIndex((prev) => prev + 1);
                    setShowFeedback(false);
                    setEvaluationError(null);
                    setRecordingSeconds(0);
                    if (nextResult) {
                      setRecordedAudioUrl(nextResult.recordedAudioUrl ?? null);
                      setRecordingCompleted(true);
                    } else {
                      setRecordedAudioUrl(null);
                      setRecordedBlob(null);
                      setRecordedFile(null);
                      setRecordingCompleted(false);
                    }
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
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-8 rounded-3xl text-center shadow-md space-y-4">
                <div
                  className={cn(
                    "w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg border relative",
                    passed
                      ? "bg-linear-to-br from-emerald-400 to-green-500 border-emerald-300"
                      : "bg-linear-to-br from-red-400 to-orange-500 border-red-300"
                  )}
                >
                  {passed ? (
                    <CheckCircle className="w-10 h-10 text-white" />
                  ) : (
                    <XCircle className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <h2 className={cn("text-2xl font-black uppercase tracking-wider", passed ? "text-emerald-500" : "text-red-500")}>
                    {passed ? "Đạt Kết Quả 🎉" : "Chưa Đạt Yêu Cầu"}
                  </h2>
                  <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto leading-relaxed">
                    {passed
                      ? "Chúc mừng! Bạn đã học và phát âm rất chuẩn. Hãy phát huy thêm nhé!"
                      : "Lần này chưa đạt rồi. Đừng nản lòng, hãy ấn làm lại để cải thiện nhé!"}
                  </p>
                </div>
                <div className="flex justify-center items-baseline gap-1 py-1">
                  <span className={cn("text-7xl font-black leading-none bg-clip-text text-transparent bg-linear-to-r", passed ? "from-emerald-500 to-teal-400" : "from-red-500 to-orange-400")}>
                    {overallScore}
                  </span>
                  <span className="text-sm font-black text-muted-foreground">/100</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-muted-foreground border border-slate-200 dark:border-white/5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Đạt {sentenceResults.filter((r) => r.score >= 80).length} trên tổng số {sentenceResults.length} câu
                </div>
              </div>

              <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">
                    Bảng Điểm Từng Câu
                  </h3>
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-800/85 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-100 transition"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {showTranslation ? "Ẩn Nghĩa VN" : "Hiện Nghĩa VN"}
                  </button>
                </div>
                <div className="space-y-2.5">
                  {sentenceResults.map((result, i) => (
                    <div
                      key={result.sentenceId}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3 rounded-2xl border transition-all duration-200 shadow-xs",
                        scoreBg(result.score)
                      )}
                    >
                      <span
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs",
                          result.score >= 80
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400"
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
                      <span className={cn("text-base font-black shrink-0", scoreColor(result.score))}>
                        {result.score}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="rounded-2xl py-6 font-bold border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs text-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  Làm lại bài
                </Button>
                <Link
                  to="/student/shadowing"
                  className="flex-1 rounded-2xl py-3.5 bg-linear-to-r from-pink-500 to-purple-500 text-white font-black text-center hover:opacity-95 shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  <Home className="w-4 h-4" />
                  Bảng điều khiển
                </Link>
                <Link
                  to="/student/shadowing/review/$videoId"
                  params={{ videoId }}
                  className="flex-1 rounded-2xl py-3.5 bg-blue-500 text-white font-black text-center hover:bg-blue-600 shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  <Award className="w-4 h-4" />
                  Xem chi tiết bài đọc
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
