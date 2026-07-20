import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, Volume2, CheckCircle, Mic, ChevronRight, Home, Loader2 } from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi } from "@/lib/api/shadowing";
import { dictionaryApi } from "@/lib/api/dictionary";
import { type ShadowingEvaluationResponse } from "@/lib/api/shadowingEvaluation";
import { getTopicVn } from "./student.shadowing";
import { ClickableTranscript } from "@/components/clickable-transcript";
import { SavedWordsButton } from "@/components/saved-words-panel";

export const Route = createFileRoute("/student/shadowing/review/$videoId")({
  component: ReviewPage,
});

interface SentenceReview {
  sentence: {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
    translation: string;
  };
  score: number;
  feedback: {
    pronunciation: number;
    pitchAccent: number;
    fluency: number;
    speed: number;
    overallScore: number;
    feedback: string;
    tips: string[];
  };
}

function ReviewPage() {
  const params = Route.useParams();
  const videoId = params.videoId;

  const [rawVideo, setRawVideo] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewData, setReviewData] = useState<SentenceReview[]>([]);
  const [resolvedMeanings, setResolvedMeanings] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadVideoAndTranscript = async () => {
      setIsLoading(true);
      try {
        const v = await studentShadowingApi.getVideo(videoId);
        const t = await studentShadowingApi.getTranscript(videoId);
        setRawVideo(v);
        setTranscript(t);

        const sentences = (t?.segments ?? []).map((s: any, idx: number) => {
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
          const vocabulary: any[] = [];
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
            tokens: Array.isArray(s.tokens) ? s.tokens : [],
            vocabulary
          };
        });

        const review = sentences.map((sentence: any) => ({
          sentence,
          score: 0,
          feedback: {
            pronunciation: 0,
            pitchAccent: 0,
            fluency: 0,
            speed: 0,
            overallScore: 0,
            feedback: "Chưa có dữ liệu chấm điểm.",
            tips: []
          }
        }));
        setReviewData(review);
        loadReviewScores(review);
      } catch (err) {
        console.error("Error loading video details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const loadReviewScores = async (initialReview: typeof reviewData) => {
      // Try to load real evaluation scores from localStorage (saved by practice page)
      const stored = localStorage.getItem(`shadowing-practice-${videoId}`);
      if (!stored) return;
      try {
        const { savedResults } = JSON.parse(stored) as { savedIndex: number; savedResults: any[] };
        if (!Array.isArray(savedResults)) return;

        setReviewData((prev) =>
          prev.map((review) => {
            const found = savedResults.find((r) => r.sentenceId === review.sentence.id);
            if (!found) return review;
            const ev = found.evaluation as ShadowingEvaluationResponse | undefined;
            if (!ev) return review;
            return {
              ...review,
              score: ev.overall ?? 0,
              feedback: {
                pronunciation: ev.accuracy ?? 0,
                pitchAccent: ev.similarity ? Math.round(ev.similarity * 0.8) : 0,
                fluency: ev.accuracy ? Math.round(ev.accuracy * 0.85) : 0,
                speed: ev.overall ? Math.round(ev.overall * 0.9) : 0,
                overallScore: ev.overall ?? 0,
                feedback: Array.isArray(ev.feedback) && ev.feedback.length > 0
                  ? ev.feedback.join(" ")
                  : "Chưa có dữ liệu chấm điểm.",
                tips: Array.isArray(ev.practiceSuggestions) ? ev.practiceSuggestions : [],
              },
            };
          })
        );
      } catch (e) {
        console.error("Failed to load shadowing review scores:", e);
      }
    };
    loadVideoAndTranscript();
  }, [videoId]);

  const video = useMemo(() => {
    if (!rawVideo) return null;
    return {
      id: rawVideo.id,
      title: rawVideo.title,
      description: rawVideo.description || "",
      videoUrl: rawVideo.videoUrl,
      thumbnail: rawVideo.thumbnailUrl || "",
      duration: rawVideo.duration,
      jlptLevel: rawVideo.jlptLevel || "N5",
      topic: rawVideo.topic || "General"
    };
  }, [rawVideo]);

  const topic = useMemo(() => {
    if (!rawVideo) return null;
    return {
      id: (rawVideo.topic || "General").toLowerCase().replace(/\s+/g, "-"),
      title: rawVideo.topic || "General",
      titleVn: getTopicVn(rawVideo.topic || "General"),
      jlptLevel: rawVideo.jlptLevel || "N5"
    };
  }, [rawVideo]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentReview = reviewData[selectedIndex];

  useEffect(() => {
    if (!currentReview || !currentReview.sentence) return;
    
    currentReview.sentence.vocabulary.forEach(async (vocab) => {
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
        console.error("Failed to lookup word in shadowing review popup:", wordKey, err);
      }
    });
  }, [currentReview]);

  // Close loader early if loading is done
  if (isLoading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!video || !topic) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <ChevronLeft className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Video not found</h3>
          <Link
            to="/student/shadowing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            Back to Shadowing
          </Link>
        </div>
      </div>
    );
  }

  const overallScore =
    reviewData.length > 0
      ? Math.round(reviewData.reduce((acc, r) => acc + r.score, 0) / reviewData.length)
      : 0;

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
                    Xem lại bài luyện tập
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">{video.title}</p>
              </div>

              {/* Overall Score */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-black text-pink-500">{overallScore}%</div>
                  <div className="text-xs text-muted-foreground">Điểm trung bình</div>
                </div>
                <SavedWordsButton />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT - Sentence List */}
            <div className="space-y-4">
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Danh sách câu</h2>

              <div className="space-y-2">
                {reviewData.map((review, index) => (
                  <motion.button
                    key={review.sentence.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedIndex(index)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedIndex === index
                        ? "bg-pink-500 text-white shadow-lg"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-pink-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          selectedIndex === index
                            ? "bg-white/20"
                            : review.score >= 80
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <ClickableTranscript
                          text={review.sentence.text}
                          contextSentence={review.sentence.text}
                          tokens={review.sentence.tokens}
                          className={`text-sm font-medium truncate ${
                            selectedIndex === index
                              ? "text-white"
                              : "text-slate-800 dark:text-white"
                          }`}
                        />
                        <p
                          className={`text-xs truncate ${
                            selectedIndex === index ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {review.sentence.translation}
                        </p>
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          selectedIndex === index
                            ? "text-white"
                            : review.score >= 80
                              ? "text-green-500"
                              : "text-red-500"
                        }`}
                      >
                        {review.score}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                  disabled={selectedIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>
                <span className="text-sm text-muted-foreground">
                  {selectedIndex + 1} / {reviewData.length}
                </span>
                <button
                  onClick={() =>
                    setSelectedIndex((prev) => Math.min(reviewData.length - 1, prev + 1))
                  }
                  disabled={selectedIndex === reviewData.length - 1}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* RIGHT - Detail View */}
            <AnimatePresence mode="wait">
              {currentReview && (
                <motion.div
                  key={currentReview.sentence.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Sentence Card */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          currentReview.score >= 80
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {selectedIndex + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">Câu</span>
                      <span
                        className={`ml-auto text-2xl font-black ${
                          currentReview.score >= 80 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {currentReview.score}
                      </span>
                    </div>

                    {/* Japanese */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-4">
                      <ClickableTranscript
                        text={currentReview.sentence.text}
                        contextSentence={currentReview.sentence.text}
                        tokens={currentReview.sentence.tokens}
                        className="text-xl text-slate-800 dark:text-white leading-relaxed"
                      />
                    </div>

                    {/* Translation */}
                    <p className="text-sm text-muted-foreground mb-6">
                      {currentReview.sentence.translation}
                    </p>

                    {/* Audio Placeholder */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-6">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-pink-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          Bản ghi của bạn
                        </p>
                        <p className="text-xs text-muted-foreground">3.2 giây</p>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white hover:bg-pink-600 transition">
                        <Play className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>

                    {/* AI Scores */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {currentReview.feedback.pronunciation}
                        </div>
                        <div className="text-[10px] text-blue-500">Phát âm</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {currentReview.feedback.fluency}
                        </div>
                        <div className="text-[10px] text-green-500">Tính lưu loát</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {currentReview.feedback.pitchAccent}
                        </div>
                        <div className="text-[10px] text-purple-500">Thanh điệu</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {currentReview.feedback.speed}
                        </div>
                        <div className="text-[10px] text-orange-500">Tốc độ</div>
                      </div>
                    </div>

                    {/* AI Feedback */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                        AI Phản hồi
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {currentReview.feedback.feedback}
                      </p>
                      {currentReview.feedback.tips.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {currentReview.feedback.tips.map((tip, i) => (
                            <p
                              key={i}
                              className="text-xs text-muted-foreground flex items-start gap-1"
                            >
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                              {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vocabulary */}
                  {currentReview.sentence.vocabulary.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-white/10">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                        Từ vựng ({currentReview.sentence.vocabulary.length})
                      </h4>
                      <div className="space-y-2">
                        {currentReview.sentence.vocabulary.map((vocab, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                          >
                            <div>
                              <span
                                className="text-sm font-medium text-slate-800 dark:text-white"
                                style={{ fontFamily: "var(--font-japanese, serif)" }}
                              >
                                {vocab.word}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                [{vocab.reading}]
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {resolvedMeanings[vocab.word] || vocab.meaning}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-center gap-3 mt-8 pt-8 border-t border-slate-200 dark:border-white/10">
            <Link
              to="/student/shadowing"
              className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Trang chủ Shadowing
            </Link>
            <Link
              to="/student/shadowing/practice/$videoId"
              params={{ videoId }}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 text-white font-bold text-sm hover:opacity-90 transition flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Luyện lại
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
