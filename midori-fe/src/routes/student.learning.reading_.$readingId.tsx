import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, CheckCircle2, XCircle, Trophy, RotateCcw,
  BookOpen, Clock, Send, X
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { getReadingById } from "@/mock/reading";
import { readingProgressStore } from "@/mock/reading/progress";

export const Route = createFileRoute("/student/learning/reading_/$readingId")({
  component: ReadingDetailPage,
});

const levelColors: Record<string, string> = {
  N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30",
  N4: "bg-green-50 text-green-500 dark:bg-green-950/30",
  N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  N1: "bg-red-50 text-red-500 dark:bg-red-950/30",
};

interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
}

function ReadingDetailPage() {
  const params = Route.useParams();
  const readingId = params.readingId;

  const reading = useMemo(() => getReadingById(readingId), [readingId]);

  // Quiz state
  const [quizState, setQuizState] = useState<"testing" | "submitted">("testing");
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [showWordPopup, setShowWordPopup] = useState(false);
  const [selectedWordData, setSelectedWordData] = useState<VocabularyItem | null>(null);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const questions = reading?.comprehensionQuestions ?? [];
  const wordCount = (reading?.passageText ?? "").split(/[\s\n]+/).filter(Boolean).length;

  // Initialize answers
  useEffect(() => {
    if (questions.length > 0 && selectedAnswers.length === 0) {
      setSelectedAnswers(new Array(questions.length).fill(null));
    }
  }, [questions.length, selectedAnswers.length]);

  // Generate vocabulary from passage
  const vocabulary: VocabularyItem[] = useMemo(() => {
    if (!reading?.passageText) return [];
    const commonWords: VocabularyItem[] = [
      { word: "私", reading: "わたし", meaning: "I, myself", partOfSpeech: "pronoun" },
      { word: "は", reading: "wa", meaning: "topic marker particle", partOfSpeech: "particle" },
      { word: "です", reading: "desu", meaning: "to be (polite)", partOfSpeech: "copula" },
      { word: "の", reading: "no", meaning: "possessive particle", partOfSpeech: "particle" },
      { word: "大学", reading: "だいがく", meaning: "university", partOfSpeech: "noun" },
      { word: "学生", reading: "がくせい", meaning: "student", partOfSpeech: "noun" },
      { word: "日本", reading: "にほん", meaning: "Japan", partOfSpeech: "noun" },
      { word: "日本語", reading: "にほんご", meaning: "Japanese language", partOfSpeech: "noun" },
      { word: "勉強", reading: "べんきょう", meaning: "study", partOfSpeech: "noun/verb" },
      { word: "先生", reading: "せんせい", meaning: "teacher", partOfSpeech: "noun" },
      { word: "友達", reading: "ともだち", meaning: "friend", partOfSpeech: "noun" },
      { word: "家族", reading: "かぞく", meaning: "family", partOfSpeech: "noun" },
      { word: "父", reading: "ちち", meaning: "father", partOfSpeech: "noun" },
      { word: "母", reading: "はは", meaning: "mother", partOfSpeech: "noun" },
      { word: "会社", reading: "かいしゃ", meaning: "company", partOfSpeech: "noun" },
      { word: "社長", reading: "しゃちょう", meaning: "company president", partOfSpeech: "noun" },
      { word: "毎日", reading: "まいにち", meaning: "every day", partOfSpeech: "adverb" },
      { word: "朝", reading: "あさ", meaning: "morning", partOfSpeech: "noun" },
      { word: "起きる", reading: "おきる", meaning: "to wake up", partOfSpeech: "verb" },
    ];
    return commonWords.filter(v => reading.passageText.includes(v.word));
  }, [reading]);

  // Calculate score
  const score = useMemo(() => {
    return selectedAnswers.reduce((acc, answer, index) => {
      const q = questions[index];
      if (!q) return acc;
      if (answer === q.correctAnswer) return acc + 1;
      return acc;
    }, 0);
  }, [selectedAnswers, questions]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowWordPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle vocab click
  const handleVocabClick = useCallback((word: VocabularyItem, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setSelectionPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setSelectedWordData(word);
    setShowWordPopup(true);
  }, []);

  // Guard
  if (!reading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Reading not found</h3>
          <Link
            to="/student/learning/reading"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Reading
          </Link>
        </div>
      </div>
    );
  }

  // Select answer
  const handleSelectAnswer = (questionIndex: number, answerIndex: number) => {
    if (quizState === "submitted") return;
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  // Submit
  const handleSubmitTest = () => {
    questions.forEach((q, index) => {
      const answer = selectedAnswers[index];
      if (answer !== null) {
        readingProgressStore.recordAnswer(readingId, {
          questionId: q.id,
          selectedAnswer: answer,
          correctAnswer: q.correctAnswer,
          isCorrect: answer === q.correctAnswer,
        });
      }
    });
    const timeSpent = startTime ? Math.round((Date.now() - startTime.getTime()) / 60000) : 0;
    readingProgressStore.completeLesson(readingId, score, questions.length);
    readingProgressStore.updateProgress(readingId, { timeSpent });
    setQuizState("submitted");
  };

  // Retry
  const handleRetry = () => {
    setSelectedAnswers(new Array(questions.length).fill(null));
    setQuizState("testing");
  };

  const answeredCount = selectedAnswers.filter(a => a !== null).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="min-h-screen relative flex flex-col">
      <SakuraBg count={14} />
      <div className="relative z-10 bg-white dark:bg-slate-900 flex-1">
        {/* Header */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/student/learning/reading"
                  className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${levelColors[reading.jlptLevel]}`}>
                      {reading.jlptLevel}
                    </span>
                    <h1 className="font-display font-bold text-slate-800 dark:text-white text-sm">
                      {reading.title}
                    </h1>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {wordCount} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{reading.estimatedTime} min
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                {quizState === "testing" ? (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {answeredCount}/{questions.length} câu
                    </span>
                    <div className="w-32 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-linear-to-r from-blue-400 to-pink-400 transition-all"
                        style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    Đã nộp bài
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto">
          <div className="flex min-h-[calc(100vh-140px)]">
            
            {/* LEFT - Reading Passage */}
            <div className="lg:w-1/2 lg:border-r border-slate-200 dark:border-white/10">
              <div className="sticky top-[140px] h-[calc(100vh-140px)] overflow-y-auto">
                <div className="p-6 lg:p-8 space-y-6">
                  
                  {/* Section Header */}
                  <div>
                    <h2 className="text-lg font-display font-bold text-slate-800 dark:text-white mb-1">
                      Bài đọc
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Bôi đen từ để xem nghĩa
                    </p>
                  </div>

                  {/* Japanese Text */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                    <p 
                      className="text-lg leading-loose text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-medium"
                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                    >
                      {reading.passageText.split(/((?:[^\s。、！？「」『』（）〔〕【】\n]+))/g).map((segment, i) => {
                        const vocabItem = vocabulary.find(v => v.word === segment);
                        if (vocabItem) {
                          return (
                            <span
                              key={i}
                              onClick={(e) => handleVocabClick(vocabItem, e)}
                              className="inline-block px-1 py-0.5 -mx-1 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition cursor-pointer underline decoration-dotted underline-offset-2"
                            >
                              {segment}
                            </span>
                          );
                        }
                        return segment;
                      })}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {reading.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-500 dark:text-pink-300 text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT - Questions */}
            <div className="lg:w-1/2 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="p-6 lg:p-8 overflow-y-auto" style={{ height: "calc(100vh - 140px)" }}>
                
                {quizState === "testing" ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-display font-bold text-slate-800 dark:text-white">
                        Câu hỏi
                      </h2>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                      {questions.map((q, qIndex) => (
                        <div key={q.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                          <div className="flex items-start gap-3 mb-4">
                            <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                              {qIndex + 1}
                            </span>
                            <p className="text-base font-semibold text-slate-800 dark:text-white leading-relaxed">
                              {q.question}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((option, oIndex) => {
                              const isSelected = selectedAnswers[qIndex] === oIndex;
                              return (
                                <button
                                  key={oIndex}
                                  onClick={() => handleSelectAnswer(qIndex, oIndex)}
                                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                                    isSelected
                                      ? "bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300"
                                      : "bg-white/80 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white hover:border-blue-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                                      isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300 dark:border-slate-500"
                                    }`}>
                                      {String.fromCharCode(65 + oIndex)}
                                    </span>
                                    <span className="flex-1">{option}</span>
                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmitTest}
                      disabled={!allAnswered}
                      className={`w-full py-4 rounded-2xl font-bold text-lg shadow-md transition flex items-center justify-center gap-2 ${
                        allAnswered
                          ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-5 h-5" />
                      Nộp bài ({answeredCount}/{questions.length})
                    </button>
                  </div>
                ) : (
                  /* SUBMITTED STATE */
                  <div className="space-y-6">
                    {/* Score Card */}
                    <div className="bg-linear-to-r from-blue-500 to-pink-500 rounded-2xl p-6 text-white text-center shadow-lg">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-1">Kết quả bài kiểm tra</h3>
                      <div className="text-4xl font-black my-3">
                        {score}/{questions.length}
                      </div>
                      <p className="text-white/80">
                        {Math.round((score / questions.length) * 100)}% điểm
                      </p>
                      <div className="mt-3 flex justify-center gap-6 text-sm">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {score} đúng
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          {questions.length - score} sai
                        </span>
                      </div>
                    </div>

                    {/* Answer Review */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                        Đáp án
                      </h3>
                      
                      {questions.map((q, qIndex) => {
                        const userAnswer = selectedAnswers[qIndex];
                        const isCorrect = userAnswer === q.correctAnswer;
                        return (
                          <div 
                            key={q.id} 
                            className={`rounded-2xl p-4 border ${
                              isCorrect 
                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" 
                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-white mb-1 text-sm">
                                  Câu {qIndex + 1}
                                </p>
                                <div className="text-xs space-y-0.5">
                                  <p className={isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                                    <span className="font-medium">Bạn chọn:</span> {q.options[userAnswer ?? 0] || "—"}
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-emerald-600 dark:text-emerald-400">
                                      <span className="font-medium">Đáp án đúng:</span> {q.options[q.correctAnswer]}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Làm lại
                      </button>
                      <Link
                        to="/student/learning/reading"
                        className="flex-1 py-3 rounded-2xl bg-linear-to-r from-blue-400 to-pink-400 text-white font-bold text-sm text-center hover:opacity-90 transition"
                      >
                        Danh sách bài đọc
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Word Popup */}
      <AnimatePresence>
        {showWordPopup && selectedWordData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50"
            style={{
              left: selectionPosition.x,
              top: selectionPosition.y,
              transform: "translate(-50%, -100%)",
            }}
            ref={popupRef}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/20 p-4 w-72">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                    {selectedWordData.word}
                  </h4>
                  <p className="text-sm text-muted-foreground">[{selectedWordData.reading}]</p>
                </div>
                <button
                  onClick={() => setShowWordPopup(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium">
                  {selectedWordData.partOfSpeech}
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedWordData.meaning}
                </p>
              </div>
            </div>
            <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-white/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
