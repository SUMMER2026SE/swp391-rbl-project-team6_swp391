import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Play, Pause, Volume2, RotateCcw, Mic, 
  CheckCircle, XCircle, ArrowRight, Home, Eye, Star
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { getVideoById, getTopicForVideo, generateMockAIFeedback, type AIFeedback, type ShadowingSentence } from "@/mock/shadowing-student";

type PracticeState = "intro" | "practicing" | "recording" | "feedback" | "result";

interface SentenceResult {
  sentenceId: string;
  text: string;
  translation: string;
  score: number;
  feedback: AIFeedback;
}

export const Route = createFileRoute("/student/shadowing/practice/$videoId")({
  component: ShadowingPracticePage,
});

// Score color helper
function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-500 dark:text-emerald-400";
  if (score >= 70) return "text-amber-500 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function scoreBg(score: number) {
  if (score >= 85) return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40";
  if (score >= 70) return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40";
  return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40";
}

function ShadowingPracticePage() {
  const params = Route.useParams();
  const videoId = params.videoId;
  const navigate = useNavigate();

  const video = useMemo(() => getVideoById(videoId), [videoId]);
  const topic = useMemo(() => getTopicForVideo(videoId), [videoId]);

  const [practiceState, setPracticeState] = useState<PracticeState>("practicing");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sentenceResults, setSentenceResults] = useState<SentenceResult[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSentence = video?.sentences[currentSentenceIndex];
  const isLastSentence = currentSentenceIndex === (video?.sentences.length ?? 0) - 1;

  const overallScore = useMemo(() => {
    if (sentenceResults.length === 0) return 0;
    const total = sentenceResults.reduce((acc, r) => acc + r.score, 0);
    return Math.round(total / sentenceResults.length);
  }, [sentenceResults]);

  const passed = overallScore >= 80;

  const handlePlayAudio = useCallback(() => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  }, []);

  const handleRecord = useCallback(() => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      if (currentSentence) {
        const feedback = generateMockAIFeedback(currentSentence.text);
        const result: SentenceResult = {
          sentenceId: currentSentence.id,
          text: currentSentence.text,
          translation: currentSentence.translation,
          score: feedback.overallScore,
          feedback,
        };
        setSentenceResults(prev => [...prev, result]);
        setShowFeedback(true);
      }
    }, 3000);
  }, [currentSentence]);

  const handleNextSentence = useCallback(() => {
    setShowFeedback(false);
    if (isLastSentence) {
      setPracticeState("result");
    } else {
      setCurrentSentenceIndex(prev => prev + 1);
      setPracticeState("practicing");
    }
  }, [isLastSentence]);

  const handleStartPractice = useCallback(() => {
    setPracticeState("practicing");
    setCurrentSentenceIndex(0);
    setSentenceResults([]);
  }, []);

  const handleRetry = useCallback(() => {
    setPracticeState("practicing");
    setCurrentSentenceIndex(0);
    setSentenceResults([]);
    setShowFeedback(false);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!video || !topic) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Video not found</h3>
          <p className="text-sm text-muted-foreground mb-4">The video you're looking for doesn't exist.</p>
          <Link
            to="/student/shadowing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 text-slate-700 dark:text-white text-sm font-semibold hover:bg-white/80 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const lastResult = sentenceResults[sentenceResults.length - 1];

  return (
    <div className="min-h-screen relative flex flex-col">
      <SakuraBg count={14} />
      <div className="relative z-10 flex-1">

        {/* Header */}
        <div className="border-b border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                to="/student/shadowing/video/$videoId"
                params={{ videoId }}
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-500 dark:text-pink-400">
                    JLPT {topic.jlptLevel}
                  </span>
                  <h1 className="font-display font-bold text-base text-slate-800 dark:text-white">
                    {video.title}
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground">Luyện Shadowing</p>
              </div>

              {/* Progress dots */}
              {practiceState !== "result" && (
                <div className="flex items-center gap-1.5">
                  {video.sentences.map((_, i) => (
                    <div
                      key={i}
                      className={`transition-all rounded-full ${
                        i < currentSentenceIndex
                          ? "w-2.5 h-2.5 bg-pink-500"
                          : i === currentSentenceIndex
                          ? "w-3 h-3 bg-pink-400 ring-2 ring-pink-300"
                          : "w-2 h-2 bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs text-muted-foreground font-medium">
                    {currentSentenceIndex + 1}/{video.sentences.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-10">

          <AnimatePresence mode="wait">

            {/* PRACTICING STATE */}
            {(practiceState === "practicing" || practiceState === "recording") && currentSentence && !showFeedback && (
              <motion.div
                key={`practice-${currentSentenceIndex}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.3 }}
                className="space-y-10"
              >
                {/* Sentence display */}
                <div className="text-center space-y-3">
                  <span className="text-xs font-medium text-pink-500 dark:text-pink-400 uppercase tracking-widest">
                    Câu {currentSentenceIndex + 1} / {video.sentences.length}
                  </span>
                  <p
                    className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white leading-relaxed"
                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                  >
                    {currentSentence.text}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {currentSentence.translation}
                  </p>
                </div>

                {/* Recording status */}
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">Đang ghi âm...</span>
                    </div>
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-8">
                  {/* Listen */}
                  <button
                    onClick={handlePlayAudio}
                    disabled={isPlaying || isRecording}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all ${
                      isPlaying
                        ? "bg-blue-500 shadow-blue-300 scale-95"
                        : "bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:shadow-lg"
                    }`}>
                      {isPlaying ? (
                        <Volume2 className="w-7 h-7 text-white animate-pulse" />
                      ) : (
                        <Play className="w-7 h-7 text-blue-500 ml-0.5" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-slate-700 dark:group-hover:text-white transition">Nghe</span>
                  </button>

                  {/* Record */}
                  <button
                    onClick={handleRecord}
                    disabled={isRecording || isPlaying}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isRecording
                        ? "bg-red-500 scale-105 shadow-red-300"
                        : "bg-gradient-to-br from-pink-500 to-purple-600 hover:shadow-pink-300 hover:scale-105"
                    }`}>
                      <Mic className="w-9 h-9 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-white">
                      {isRecording ? "Đang ghi..." : "Ghi âm"}
                    </span>
                  </button>

                  {/* Replay */}
                  <button
                    onClick={handlePlayAudio}
                    disabled={isPlaying || isRecording}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-600 hover:shadow-lg transition-all">
                      <RotateCcw className="w-7 h-7 text-slate-500 dark:text-slate-300" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-slate-700 dark:group-hover:text-white transition">Nghe lại</span>
                  </button>
                </div>

                {/* Hint */}
                <p className="text-center text-xs text-muted-foreground">
                  Nhấn <strong>Nghe</strong> để nghe câu mẫu, sau đó nhấn <strong>Ghi âm</strong> để luyện tập
                </p>
              </motion.div>
            )}

            {/* FEEDBACK STATE */}
            {showFeedback && lastResult && (
              <motion.div
                key={`feedback-${currentSentenceIndex}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Score header */}
                <div className="text-center space-y-2">
                  <span className="text-xs font-medium text-pink-500 dark:text-pink-400 uppercase tracking-widest">
                    Kết quả câu {currentSentenceIndex + 1}
                  </span>
                  <div className={`text-6xl font-black ${scoreColor(lastResult.score)}`}>
                    {lastResult.score}
                  </div>
                  <p className="text-sm text-muted-foreground">Điểm phát âm</p>
                </div>

                {/* ─── Word-level comparison ─── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white text-center">
                    📢 Câu bạn nói — từ đúng <span className="text-emerald-500">xanh</span>, sai <span className="text-red-500">đỏ</span>
                  </h3>

                  {/* What user said (word-colored) */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {lastResult.feedback.wordResults?.map((wr, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-xl text-xl font-bold border transition ${
                          wr.correct
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40"
                            : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40"
                        }`}
                        style={{ fontFamily: "var(--font-japanese, serif)" }}
                      >
                        {wr.word}
                      </span>
                    ))}
                  </div>

                  {/* Correct sentence reference */}
                  <div className="mt-3">
                    <p className="text-xs text-center text-muted-foreground mb-2 font-medium">✅ Câu chuẩn</p>
                    <div className="text-center">
                      <p
                        className="text-2xl text-slate-800 dark:text-white font-bold"
                        style={{ fontFamily: "var(--font-japanese, serif)" }}
                      >
                        {lastResult.text}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{lastResult.translation}</p>
                    </div>
                  </div>
                </div>

                {/* AI breakdown scores */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">AI Phân tích</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Phát âm", value: lastResult.feedback.pronunciation, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
                      { label: "Lưu loát", value: lastResult.feedback.fluency, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                      { label: "Thanh điệu", value: lastResult.feedback.pitchAccent, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
                      { label: "Tốc độ", value: lastResult.feedback.speed, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
                    ].map(item => (
                      <div key={item.label} className={`${item.bg} rounded-2xl p-3 text-center`}>
                        <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Feedback text */}
                  <p className="text-sm text-center text-slate-600 dark:text-slate-300 italic">
                    {lastResult.feedback.feedback}
                  </p>
                </div>

                {/* Next button */}
                <button
                  onClick={handleNextSentence}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-base shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  {isLastSentence ? "Xem kết quả tổng" : "Câu tiếp theo"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* RESULT STATE */}
            {practiceState === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* Overall score */}
                <div className="text-center space-y-4">
                  <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-xl ${
                    passed
                      ? "bg-gradient-to-br from-emerald-400 to-green-500"
                      : "bg-gradient-to-br from-red-400 to-orange-500"
                  }`}>
                    {passed ? (
                      <CheckCircle className="w-12 h-12 text-white" />
                    ) : (
                      <XCircle className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className={`text-3xl font-black ${passed ? "text-emerald-500" : "text-red-500"}`}>
                      {passed ? "ĐẠT 🎉" : "CHƯA ĐẠT"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {passed ? "Xuất sắc! Bạn đã hoàn thành bài luyện tập." : "Hãy tiếp tục luyện tập để đạt điểm cao hơn!"}
                    </p>
                  </div>
                  <div className={`text-7xl font-black ${passed ? "text-emerald-500" : "text-red-500"}`}>
                    {overallScore}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sentenceResults.filter(r => r.score >= 80).length}/{sentenceResults.length} câu đạt yêu cầu
                  </p>
                </div>

                {/* Per-sentence summary */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white">Kết quả từng câu</h3>
                  {sentenceResults.map((result, i) => (
                    <div
                      key={result.sentenceId}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${scoreBg(result.score)}`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        result.score >= 80
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                      }`}>
                        {i + 1}
                      </span>
                      <p
                        className="flex-1 text-sm font-medium text-slate-800 dark:text-white truncate"
                        style={{ fontFamily: "var(--font-japanese, serif)" }}
                      >
                        {result.text}
                      </p>
                      <span className={`text-lg font-black shrink-0 ${scoreColor(result.score)}`}>
                        {result.score}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-3 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 text-slate-700 dark:text-white font-bold transition hover:bg-white/80 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Làm lại
                  </button>
                  <Link
                    to="/student/shadowing"
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-center transition hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Trang chủ
                  </Link>
                  <Link
                    to="/student/shadowing/review/$videoId"
                    params={{ videoId }}
                    className="flex-1 py-3 rounded-2xl bg-blue-500 text-white font-bold text-center transition hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Xem lại
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
