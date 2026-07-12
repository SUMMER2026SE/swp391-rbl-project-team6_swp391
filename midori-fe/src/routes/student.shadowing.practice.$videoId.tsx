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
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi } from "@/lib/api/shadowing";
import { Loader2 } from "lucide-react";
import { getTopicVn } from "./student.shadowing";
import { evaluateShadowingSentence, type ShadowingEvaluationResponse } from "@/lib/api/shadowingEvaluation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
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
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mimeType });
      const file = new File([blob], `shadowing-${Date.now()}.webm`, { type: mimeType });
      try {
        setEvaluationError(null);
        const evaluation = await evaluateShadowingSentence(videoId, currentSentenceIndex + 1, file);
        const feedback = buildLocalFeedback(evaluation, currentSentence.text);
        const result: SentenceResult = {
          sentenceId: currentSentence.id,
          text: currentSentence.text,
          translation: currentSentence.translation,
          score: evaluation.overall,
          feedback,
          needAI: evaluation.needAI,
          evaluation,
        };
        setSentenceResults((prev) => {
          const index = prev.findIndex((r) => r.sentenceId === currentSentence.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = result;
            return updated;
          }
          return [...prev, result];
        });
        setShowFeedback(true);
        setPracticeState("feedback");
      } catch (err: any) {
        const message = err?.message || "Evaluation failed";
        setEvaluationError(message);
        console.error("[ShadowingEvaluation] failed", err);
      } finally {
        stream.getTracks().forEach((track) => track.stop());
      }
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
    setRecordingCompleted(true);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const handleRecordClick = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      setIsRecording(true);
      setRecordingCompleted(false);
      setShowFeedback(false);
      setPracticeState("recording");
      setEvaluationError(null);
      startRecordingTimer();
      await startAudioCapture();
    }
  }, [isRecording, currentSentence, videoId]);

  const handleNextSentence = useCallback(() => {
    setShowFeedback(false);
    setRecordingCompleted(false);
    setRecordingSeconds(0);
    if (isLastSentence) {
      setPracticeState("result");
    } else {
      setCurrentSentenceIndex((prev) => prev + 1);
      setPracticeState("practicing");
    }
  }, [isLastSentence]);

  const handleRetry = useCallback(() => {
    setPracticeState("practicing");
    setCurrentSentenceIndex(0);
    setSentenceResults([]);
    setShowFeedback(false);
    setRecordingCompleted(false);
    setRecordingSeconds(0);
    setEvaluationError(null);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = 0;
      videoPlayerRef.current.pause();
    }
  }, []);

  const lastResult = sentenceResults.find((r) => r.sentenceId === currentSentence?.id);

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

        <div className="space-y-6">
          {practiceState !== "result" && (
            <div
              ref={videoContainerRef}
              className={cn(
                "relative bg-[#0f172a] rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl flex flex-col transition-all duration-150 group mx-auto",
                isFullscreen ? "w-screen h-screen rounded-none border-0" : "w-full max-w-2xl aspect-video"
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

              <div className="bg-[#0b0f19]/95 border-t border-slate-800 px-4 py-3 flex flex-col gap-2 shrink-0 select-none">
                <div
                  onClick={handleTimelineClick}
                  className="relative w-full h-1.5 bg-slate-800 rounded-full cursor-pointer hover:h-2 transition-all flex items-center"
                >
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  {duration > 0 && video.sentences.map((s, idx) => {
                    const pct = (s.startTime / duration) * 100;
                    const isPassed = currentTime >= s.startTime;
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
                          "absolute w-2 h-2 rounded-full -translate-x-1/2 border transition-all duration-150 cursor-pointer",
                          idx === currentSentenceIndex
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

                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-3.5">
                    <button onClick={togglePlay} className="hover:text-primary transition p-1 cursor-pointer">
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-slate-300 hover:fill-primary" />
                      ) : (
                        <Play className="w-4 h-4 fill-slate-300 hover:fill-primary" />
                      )}
                    </button>
                    <button onClick={toggleMute} className="hover:text-primary transition p-1 cursor-pointer">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
                      onClick={() => setShowTranslation(!showTranslation)}
                      className={cn(
                        "p-1 hover:text-primary transition cursor-pointer",
                        showTranslation ? "text-primary" : "text-slate-400"
                      )}
                      title="Hiện/Ẩn nghĩa Việt"
                    >
                      <Languages className="w-4 h-4" />
                    </button>
                    <button onClick={toggleFullscreen} className="hover:text-primary transition p-1 cursor-pointer">
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {practiceState !== "result" && currentSentence && (
            <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-md relative overflow-hidden flex items-start justify-between gap-6 transition-all duration-200">
              <div className="space-y-3.5 flex-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">
                  Câu hiện tại
                </span>
                <p
                  className="text-xl md:text-2xl font-black text-slate-100 leading-relaxed tracking-wide"
                  style={{ fontFamily: "var(--font-japanese, serif)" }}
                >
                  {currentSentence.text}
                </p>
                {showTranslation && (
                  <p className="text-xs md:text-sm text-slate-400 italic font-medium">
                    {currentSentence.translation}
                  </p>
                )}
              </div>
              <button
                onClick={handlePlayOriginal}
                disabled={isRecording}
                className="w-11 h-11 rounded-full bg-white/5 border border-slate-800/80 flex items-center justify-center text-slate-300 hover:text-primary hover:bg-white/10 transition shrink-0 self-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Nghe mẫu phát âm"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {practiceState !== "result" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch w-full">
              <div className="bg-white/40 dark:bg-slate-900/20 border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 shadow-xs flex flex-col justify-between items-center text-center h-[260px]">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
                    1. Nghe câu gốc
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed px-4">
                    Nghe cách người trong video phát âm câu này
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-500 shadow-xs">
                    <Headphones className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                <Button
                  onClick={handlePlayOriginal}
                  disabled={isRecording}
                  className="rounded-xl h-10 w-full font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Nghe lại câu này
                </Button>
              </div>

              <div className="bg-white/40 dark:bg-slate-900/20 border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 shadow-xs flex flex-col justify-between items-center text-center h-[260px]">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">2. Ghi âm của bạn</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed px-4">
                    Nhấn để bắt đầu ghi âm câu này
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className="flex gap-0.5 items-center h-8">
                      {[12, 24, 8, 16].map((h, i) => (
                        <div
                          key={i}
                          className={cn("w-0.5 rounded-full transition-all bg-primary/40", isRecording && "animate-pulse")}
                          style={{ height: isRecording ? `${h}px` : "4px" }}
                        />
                      ))}
                    </div>
                    <button onClick={handleRecordClick} disabled={isPlaying} className="group relative shrink-0">
                      {isRecording && (
                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping scale-110" />
                      )}
                      <div
                        className={cn(
                          "w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all border duration-300 relative z-10 cursor-pointer",
                          isRecording ? "bg-red-500 border-red-600 scale-105" : "bg-linear-to-br from-pink-500 to-purple-600 hover:scale-105 border-transparent"
                        )}
                      >
                        <Mic className="w-6 h-6 text-white" />
                      </div>
                    </button>
                    <div className="flex gap-0.5 items-center h-8">
                      {[16, 8, 24, 12].map((h, i) => (
                        <div
                          key={i}
                          className={cn("w-0.5 rounded-full transition-all bg-primary/40", isRecording && "animate-pulse")}
                          style={{ height: isRecording ? `${h}px` : "4px" }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground mt-2 select-none">
                    {isRecording ? `00:${recordingSeconds.toString().padStart(2, "0")}` : "00:00"} / 00:15
                  </span>
                </div>
                <Button
                  onClick={handlePlayOriginal}
                  disabled={!recordingCompleted || isRecording}
                  className="rounded-xl h-10 w-full font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Nghe lại bản ghi
                </Button>
              </div>

              <div className="bg-white/40 dark:bg-slate-900/20 border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 shadow-xs flex flex-col justify-between items-center text-center h-[260px]">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">3. AI chấm điểm</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed px-4">
                    Điểm và phản hồi chi tiết từ hệ thống
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center w-full">
                  {!showFeedback || !lastResult ? (
                    <div className="bg-slate-100/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-white/5 rounded-2xl w-full h-[100px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Lock className="w-5 h-5 opacity-40" />
                      <span className="text-[9px] font-bold px-3">Hoàn thành ghi âm để xem kết quả</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-1 w-full animate-fade-in">
                      <div className={cn("text-3xl font-black", scoreColor(lastResult.score))}>{lastResult.score}</div>
                      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                        Phát âm: {lastResult.feedback.pronunciation} • Lưu loát: {lastResult.feedback.fluency}
                      </div>
                      <p className="text-[9px] text-slate-500 italic max-h-[48px] overflow-y-auto leading-relaxed px-2 scrollbar-thin">
                        "{lastResult.feedback.feedback}"
                      </p>
                      {lastResult.needAI && (
                        <span className="text-[9px] font-black text-pink-500 uppercase">AI Feedback</span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleNextSentence}
                  disabled={!showFeedback}
                  className="rounded-xl h-10 w-full font-black bg-gradient-hero text-white hover:opacity-95 transition text-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  {isLastSentence ? "Xem tổng kết" : "Câu tiếp theo"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {evaluationError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
              {evaluationError}
            </div>
          )}

          {practiceState !== "result" && (
            <div className="flex items-center justify-between w-full pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentSentenceIndex === 0 || isRecording}
                onClick={() => {
                  if (currentSentenceIndex > 0) {
                    setCurrentSentenceIndex((prev) => prev - 1);
                    setSentenceResults((prev) => prev.slice(0, -1));
                    setShowFeedback(false);
                    setRecordingCompleted(false);
                    setRecordingSeconds(0);
                    setEvaluationError(null);
                  }
                }}
                className="text-xs font-bold text-muted-foreground hover:text-primary transition flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed h-9 rounded-xl"
              >
                ◀ Câu trước
              </Button>

              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/60 dark:bg-slate-900/40 px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/10">
                Câu {currentSentenceIndex + 1} / {video.sentences.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentSentenceIndex === video.sentences.length - 1 || isRecording}
                onClick={() => {
                  if (currentSentenceIndex < video.sentences.length - 1) {
                    setCurrentSentenceIndex((prev) => prev + 1);
                    setShowFeedback(false);
                    setRecordingCompleted(false);
                    setRecordingSeconds(0);
                    setEvaluationError(null);
                  }
                }}
                className="text-xs font-bold text-muted-foreground hover:text-primary transition flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed h-9 rounded-xl"
              >
                Bỏ qua câu ▶
              </Button>
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
                  <span className={cn("text-7xl font-black leading-none bg-clip-text text-transparent bg-gradient-to-r", passed ? "from-emerald-500 to-teal-400" : "from-red-500 to-orange-400")}>
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
                        <p
                          className="text-sm font-bold text-slate-800 dark:text-white truncate"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {result.text}
                        </p>
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
