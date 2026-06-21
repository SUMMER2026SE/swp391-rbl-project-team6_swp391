import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Play, Pause, Volume2, RotateCcw, Mic, 
  CheckCircle, XCircle, ArrowRight, Home, Eye
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

function ShadowingPracticePage() {
  const params = Route.useParams();
  const videoId = params.videoId;
  const navigate = useNavigate();

  const video = useMemo(() => getVideoById(videoId), [videoId]);
  const topic = useMemo(() => getTopicForVideo(videoId), [videoId]);

  // Practice states
  const [practiceState, setPracticeState] = useState<PracticeState>("intro");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sentenceResults, setSentenceResults] = useState<SentenceResult[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSentence = video?.sentences[currentSentenceIndex];
  const isLastSentence = currentSentenceIndex === (video?.sentences.length ?? 0) - 1;
  const allResultsComplete = sentenceResults.length === (video?.sentences.length ?? 0);

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (sentenceResults.length === 0) return 0;
    const total = sentenceResults.reduce((acc, r) => acc + r.score, 0);
    return Math.round(total / sentenceResults.length);
  }, [sentenceResults]);

  const passed = overallScore >= 80;

  // Handle play audio
  const handlePlayAudio = useCallback(() => {
    setIsPlaying(true);
    // Simulate audio playback
    setTimeout(() => setIsPlaying(false), 2000);
  }, []);

  // Handle record
  const handleRecord = useCallback(() => {
    setIsRecording(true);
    // Simulate recording (3 seconds)
    setTimeout(() => {
      setIsRecording(false);
      // Generate mock AI feedback
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

  // Handle next sentence
  const handleNextSentence = useCallback(() => {
    setShowFeedback(false);
    if (isLastSentence) {
      setPracticeState("result");
    } else {
      setCurrentSentenceIndex(prev => prev + 1);
      setPracticeState("practicing");
    }
  }, [isLastSentence]);

  // Start practice
  const handleStartPractice = useCallback(() => {
    setPracticeState("practicing");
    setCurrentSentenceIndex(0);
    setSentenceResults([]);
  }, []);

  // Retry practice
  const handleRetry = useCallback(() => {
    setPracticeState("intro");
    setCurrentSentenceIndex(0);
    setSentenceResults([]);
    setShowFeedback(false);
  }, []);

  // Cleanup on unmount
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
    <div className="min-h-screen relative flex flex-col">
      <SakuraBg count={14} />
      <div className="relative z-10 bg-white dark:bg-slate-900 flex-1">
        {/* Header */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                to="/student/shadowing/video/$videoId"
                params={{ videoId }}
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-400">
                    JLPT {topic.jlptLevel}
                  </span>
                  <h1 className="font-display font-bold text-lg text-slate-800 dark:text-white">
                    Luyện Shadowing
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  {video.title}
                </p>
              </div>

              {/* Progress */}
              {practiceState !== "intro" && practiceState !== "result" && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {currentSentenceIndex + 1}/{video.sentences.length}
                  </span>
                  <div className="w-32 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 transition-all"
                      style={{ width: `${((currentSentenceIndex + 1) / video.sentences.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* INTRO STATE */}
          {practiceState === "intro" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Mic className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Bắt đầu luyện Shadowing
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Nghe câu tiếng Nhật, nhắc lại và nhận phản hồi AI về phát âm của bạn.
              </p>

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                    <Volume2 className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">Nghe</h3>
                  <p className="text-xs text-muted-foreground">Nghe câu mẫu từ giọng chuẩn</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                    <Mic className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">Nhắc lại</h3>
                  <p className="text-xs text-muted-foreground">Ghi âm phát âm của bạn</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">AI Phản hồi</h3>
                  <p className="text-xs text-muted-foreground">Nhận đánh giá chi tiết</p>
                </div>
              </div>

              {/* Sentence Count */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-8 inline-block">
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-slate-800 dark:text-white">{video.sentences.length}</span> câu để luyện tập
                </p>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartPractice}
                className="w-full max-w-sm py-4 rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 text-white font-bold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 mx-auto"
              >
                <Mic className="w-5 h-5" />
                Bắt đầu luyện tập
              </button>
            </motion.div>
          )}

          {/* PRACTICING STATE */}
          {(practiceState === "practicing" || practiceState === "recording") && currentSentence && (
            <motion.div
              key={currentSentenceIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Sentence Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-white/10">
                <div className="text-center mb-6">
                  <span className="text-xs text-muted-foreground mb-2 block">
                    Câu {currentSentenceIndex + 1} / {video.sentences.length}
                  </span>
                  <p 
                    className="text-2xl text-slate-800 dark:text-white leading-relaxed"
                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                  >
                    {currentSentence.text}
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    {currentSentence.translation}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4">
                  {/* Listen Button */}
                  <button
                    onClick={handlePlayAudio}
                    disabled={isPlaying}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition ${
                      isPlaying 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-500" 
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center shadow">
                      {isPlaying ? (
                        <Volume2 className="w-6 h-6 animate-pulse" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                      )}
                    </div>
                    <span className="text-xs font-medium">Nghe</span>
                  </button>

                  {/* Record Button */}
                  <button
                    onClick={handleRecord}
                    disabled={isRecording}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition ${
                      isRecording 
                        ? "bg-red-100 dark:bg-red-900/30 text-red-500" 
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow transition-colors ${
                      isRecording 
                        ? "bg-red-500 animate-pulse" 
                        : "bg-white dark:bg-slate-600"
                    }`}>
                      <Mic className={`w-6 h-6 ${isRecording ? "text-white" : ""}`} />
                    </div>
                    <span className="text-xs font-medium">
                      {isRecording ? "Đang ghi..." : "Ghi âm"}
                    </span>
                  </button>

                  {/* Replay Button */}
                  <button
                    onClick={handlePlayAudio}
                    disabled={isPlaying}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 transition"
                  >
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center shadow">
                      <RotateCcw className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium">Nghe lại</span>
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center gap-2">
                {video.sentences.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < currentSentenceIndex
                        ? "bg-pink-500"
                        : i === currentSentenceIndex
                        ? "bg-pink-300"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* FEEDBACK STATE */}
          {showFeedback && sentenceResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Current Sentence Result */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-white/10">
                <div className="text-center mb-6">
                  <span className="text-xs text-muted-foreground mb-2 block">
                    Kết quả câu {currentSentenceIndex + 1}
                  </span>
                  <p 
                    className="text-2xl text-slate-800 dark:text-white leading-relaxed"
                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                  >
                    {sentenceResults[sentenceResults.length - 1].text}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {sentenceResults[sentenceResults.length - 1].translation}
                  </p>
                </div>

                {/* Score Display */}
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-black text-pink-500">
                      {sentenceResults[sentenceResults.length - 1].score}
                    </div>
                    <div className="text-xs text-muted-foreground">Điểm</div>
                  </div>
                </div>

                {/* AI Feedback */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">AI Phản hồi</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {sentenceResults[sentenceResults.length - 1].feedback.pronunciation}
                      </div>
                      <div className="text-[10px] text-blue-500">Phát âm</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {sentenceResults[sentenceResults.length - 1].feedback.fluency}
                      </div>
                      <div className="text-[10px] text-green-500">Tính lưu loát</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {sentenceResults[sentenceResults.length - 1].feedback.pitchAccent}
                      </div>
                      <div className="text-[10px] text-purple-500">Thanh điệu</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {sentenceResults[sentenceResults.length - 1].feedback.speed}
                      </div>
                      <div className="text-[10px] text-orange-500">Tốc độ</div>
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {sentenceResults[sentenceResults.length - 1].feedback.feedback}
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNextSentence}
                  className="w-full mt-6 py-3 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 text-white font-bold transition hover:opacity-90 flex items-center justify-center gap-2"
                >
                  {isLastSentence ? "Xem kết quả" : "Câu tiếp theo"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* RESULT STATE */}
          {practiceState === "result" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Result Card */}
              <div className={`rounded-2xl p-8 text-center ${passed ? "bg-linear-to-br from-green-500 to-emerald-500" : "bg-linear-to-br from-red-500 to-orange-500"} text-white`}>
                <div className={`w-20 h-20 rounded-full ${passed ? "bg-white/20" : "bg-white/20"} flex items-center justify-center mx-auto mb-4`}>
                  {passed ? (
                    <CheckCircle className="w-10 h-10 text-white" />
                  ) : (
                    <XCircle className="w-10 h-10 text-white" />
                  )}
                </div>
                
                <h2 className="text-3xl font-black mb-2">
                  {passed ? "ĐẠT" : "CHƯA ĐẠT"}
                </h2>
                <p className="text-white/80 text-sm mb-4">
                  {passed ? "Chúc mừng bạn đã hoàn thành bài luyện tập!" : "Hãy tiếp tục luyện tập để cải thiện điểm số!"}
                </p>

                <div className="text-5xl font-black my-6">
                  {overallScore}%
                </div>
                <p className="text-white/60 text-sm">
                  {sentenceResults.filter(r => r.score >= 80).length} / {sentenceResults.length} câu đạt yêu cầu
                </p>
              </div>

              {/* Sentence Results */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-white/10">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Kết quả từng câu</h3>
                
                <div className="space-y-3">
                  {sentenceResults.map((result, i) => (
                    <div
                      key={result.sentenceId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        result.score >= 80 
                          ? "bg-green-100 text-green-600" 
                          : "bg-red-100 text-red-600"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                          {result.text}
                        </p>
                      </div>
                      <span className={`text-lg font-bold ${
                        result.score >= 80 ? "text-green-500" : "text-red-500"
                      }`}>
                        {result.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold transition hover:bg-slate-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Làm lại
                </button>
                <Link
                  to="/student/shadowing"
                  className="flex-1 py-3 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 text-white font-bold text-center transition hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Trang chủ
                </Link>
                <Link
                  to="/student/shadowing/review/$videoId"
                  params={{ videoId }}
                  className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold text-center transition hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Xem lại
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
