import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, CheckCircle2, XCircle, Trophy, RotateCcw,
  BookOpen, Clock, CheckCircle, Circle, BookText, List, GraduationCap, Volume2,
  AlertCircle
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { getReadingById } from "@/mock/reading";
import type { ReadingQuestion } from "@/types/content-library";

export const Route = createFileRoute("/student/reading/$readingId")({
  component: ReadingDetailPage,
});

const levelColors: Record<string, string> = {
  N5: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  N4: "bg-green-500/20 text-green-400 border-green-400/30",
  N3: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  N2: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  N1: "bg-red-500/20 text-red-400 border-red-400/30",
};

const levelGradients: Record<string, string> = {
  N5: "from-blue-400 to-cyan-400",
  N4: "from-green-400 to-emerald-400",
  N3: "from-yellow-400 to-orange-400",
  N2: "from-orange-400 to-red-400",
  N1: "from-red-400 to-pink-400",
};

// Tab types
type TabType = "reading" | "vocabulary" | "grammar" | "quiz";

// Extended reading type (if available)
interface ExtendedReading {
  id: string;
  title: string;
  passageText: string;
  romaji?: string;
  translation?: string;
  vocabulary?: VocabularyItem[];
  grammarPoints?: GrammarPoint[];
  comprehensionQuestions: ReadingQuestion[];
  jlptLevel: string;
  tags: string[];
  estimatedTime: number;
}

interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
}

interface GrammarPoint {
  grammar: string;
  explanation: string;
  example: string;
  exampleTranslation: string;
}

function ReadingDetailPage() {
  const params = Route.useParams();
  const readingId = params.readingId;

  const reading = useMemo(() => getReadingById(readingId) as ExtendedReading | null, [readingId]);

  // Try to get extended reading data
  const extendedData = useMemo(() => {
    // Try to import extended readings
    try {
      const { extendedReadings } = require("@/mock/reading/extended-readings");
      return extendedReadings.find((r: ExtendedReading) => r.id === readingId);
    } catch {
      return null;
    }
  }, [readingId]);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("reading");

  // Guard: ensure reading exists before any property access
  if (!reading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Reading not found</h3>
          <p className="text-sm text-white/60 mb-4">The reading you're looking for doesn't exist.</p>
          <Link
            to="/student/reading"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Reading
          </Link>
        </div>
      </div>
    );
  }

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  const questions = reading.comprehensionQuestions ?? [];
  const question = questions[currentQuestion];
  const wordCount = (reading.passageText ?? "").split(/[\s\n]+/).filter(Boolean).length;
  const tags = reading.tags ?? [];

  // Get vocabulary and grammar from extended data
  const vocabulary = extendedData?.vocabulary ?? [];
  const grammarPoints = extendedData?.grammarPoints ?? [];

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);
    setQuizFinished(false);
  };

  // Calculate score
  const score = answers.reduce((acc, answer, index) => {
    const q = questions[index];
    if (!q) return acc;
    if (answer === q.correctAnswer) return acc + 1;
    return acc;
  }, 0);

  const isCorrect = selectedAnswer !== null && question?.correctAnswer !== undefined
    ? selectedAnswer === question.correctAnswer
    : false;

  // Tab navigation items
  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "reading", label: "Bài đọc", icon: <BookText className="w-4 h-4" /> },
    { id: "vocabulary", label: "Từ vựng", icon: <List className="w-4 h-4" />, count: vocabulary.length },
    { id: "grammar", label: "Ngữ pháp", icon: <GraduationCap className="w-4 h-4" />, count: grammarPoints.length },
    { id: "quiz", label: "Luyện tập", icon: <Trophy className="w-4 h-4" />, count: questions.length },
  ];

  return (
    <div className="min-h-screen relative flex flex-col">
      <SakuraBg count={14} />
      <div className="relative z-10 space-y-6">
        {/* Breadcrumb + Header */}
        <div className="px-6 pt-6 space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/student/reading"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
            >
              <BookOpen className="w-4 h-4" />
              Reading
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${levelColors[reading.jlptLevel]}`}>
              {reading.jlptLevel}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-foreground">{reading.title}</span>
          </div>

          {/* Reading Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${levelGradients[reading.jlptLevel]} flex-shrink-0`}>
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-black">{reading.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{reading.titleVn}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${levelColors[reading.jlptLevel]}`}>
                    JLPT {reading.jlptLevel}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <List className="w-3.5 h-3.5" />
                    {wordCount} words
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ~{reading.estimatedTime} min
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-xl font-black text-blue-500">{wordCount}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5" /> Words
                </div>
              </div>
              <div className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-xl font-black text-purple-500">{questions.length}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <Trophy className="w-3.5 h-3.5" /> Questions
                </div>
              </div>
              <div className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-xl font-black text-green-500">{reading.estimatedTime}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5" /> Min
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                    : "text-muted-foreground hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-200 dark:bg-slate-600"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* LEFT COLUMN - Content Area */}
            <div className="lg:w-[60%] lg:border-r border-slate-200 dark:border-white/10">
              <div className="sticky top-[160px] h-[calc(100vh-160px)] lg:h-[calc(100vh-160px)] overflow-y-auto">
                <div className="p-6 lg:p-8">
                  <div className="space-y-6">

                    {/* READING TAB */}
                    {activeTab === "reading" && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">
                            Bài đọc
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Đọc kỹ đoạn văn bản bên dưới và trả lời các câu hỏi.
                          </p>
                        </div>

                        {/* Japanese Text */}
                        <div className="bg-linear-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/20 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                          <div 
                            className="text-lg leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-medium"
                            style={{ fontFamily: "var(--font-japanese, serif)" }}
                          >
                            {reading.passageText}
                          </div>
                        </div>

                        {/* Romaji (if available) */}
                        {extendedData?.romaji && (
                          <div className="bg-slate-100 dark:bg-slate-800/30 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Romaji</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                              {extendedData.romaji}
                            </p>
                          </div>
                        )}

                        {/* Translation (if available) */}
                        {extendedData?.translation && (
                          <div className="bg-green-50/50 dark:bg-green-900/20 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 uppercase">English Translation</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {extendedData.translation}
                            </p>
                          </div>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {tags.map(tag => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* VOCABULARY TAB */}
                    {activeTab === "vocabulary" && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">
                            Từ vựng
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Danh sách từ vựng từ bài đọc ({vocabulary.length} từ)
                          </p>
                        </div>

                        {vocabulary.length > 0 ? (
                          <div className="space-y-3">
                            {vocabulary.map((item, index) => (
                              <div
                                key={index}
                                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="text-lg font-bold text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                                        {item.word}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        [{item.reading}]
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] font-medium">
                                        {item.partOfSpeech}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                      {item.meaning}
                                    </p>
                                  </div>
                                  <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              Không có từ vựng cho bài đọc này.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Hãy thử chuyển sang tab "Bài đọc" hoặc "Luyện tập"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* GRAMMAR TAB */}
                    {activeTab === "grammar" && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">
                            Ngữ pháp
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Các cấu trúc ngữ pháp từ bài đọc ({grammarPoints.length} điểm ngữ pháp)
                          </p>
                        </div>

                        {grammarPoints.length > 0 ? (
                          <div className="space-y-4">
                            {grammarPoints.map((point, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl p-5 border border-amber-200/50 dark:border-amber-700/30"
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-300 text-sm font-bold">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                                      {point.grammar}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                      {point.explanation}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Example */}
                                <div className="bg-white/80 dark:bg-slate-800/50 rounded-lg p-4 mt-3">
                                  <p className="text-sm text-slate-600 dark:text-slate-300 italic mb-1" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                                    {point.example}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {point.exampleTranslation}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              Không có ngữ pháp cho bài đọc này.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Hãy thử chuyển sang tab "Bài đọc" hoặc "Luyện tập"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* QUIZ TAB - Instructions */}
                    {activeTab === "quiz" && !quizFinished && !question && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">
                            Luyện tập
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Trả lời các câu hỏi để kiểm tra sự hiểu biết của bạn.
                          </p>
                        </div>

                        {questions.length > 0 ? (
                          <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/30 dark:from-blue-900/20 dark:to-purple-900/10 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30">
                            <div className="text-center">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-8 h-8 text-primary" />
                              </div>
                              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                                Sẵn sàng kiểm tra?
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Bài kiểm tra gồm <span className="font-bold text-primary">{questions.length}</span> câu hỏi.
                              </p>
                              <button
                                onClick={() => setCurrentQuestion(0)}
                                className="px-6 py-3 rounded-xl bg-linear-to-r from-blue-500 to-pink-500 text-white font-bold text-sm shadow-md hover:opacity-90 transition"
                              >
                                Bắt đầu làm bài
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              Không có câu hỏi cho bài đọc này.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Quiz Area (visible when in quiz tab with active question) */}
            <div className="lg:w-[40%] bg-slate-50/50 dark:bg-slate-800/30">
              <div className="p-6 lg:p-8">
                {/* Quiz Tab - Question Area */}
                {activeTab === "quiz" && !quizFinished && question ? (
                  <div className="space-y-6">
                    {/* Question */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                          {currentQuestion + 1}
                        </span>
                        <h3 className="font-bold text-slate-800 dark:text-white">
                          Câu hỏi
                        </h3>
                      </div>
                      
                      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                        <p className="text-base font-semibold text-slate-800 dark:text-white mb-4 leading-relaxed">
                          {question.question}
                        </p>

                        {/* Options */}
                        <div className="space-y-3">
                          {question.options.map((option, index) => {
                            const isSelected = selectedAnswer === index;
                            const isCorrectOption = index === question.correctAnswer;
                            const showCorrect = showResult && isCorrectOption;
                            const showIncorrect = showResult && isSelected && !isCorrectOption;

                            let btnStyle = "bg-white/80 dark:bg-slate-700/50 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-600";
                            if (showCorrect) {
                              btnStyle = "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300";
                            } else if (showIncorrect) {
                              btnStyle = "bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-300";
                            } else if (isSelected) {
                              btnStyle = "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300";
                            }

                            return (
                              <button
                                key={index}
                                onClick={() => handleSelectAnswer(index)}
                                disabled={showResult}
                                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${btnStyle}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                                    isSelected ? "border-current bg-current/10" : "border-slate-300 dark:border-slate-500"
                                  }`}>
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  <span className="flex-1">{option}</span>
                                  {showCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                  {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Result Feedback */}
                      {showResult && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-2xl border ${
                            isCorrect
                              ? "bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
                              : "bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                          }`}
                        >
                          <div className={`flex items-center gap-2 font-bold text-sm ${
                            isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-5 h-5" />
                                Chính xác! Giỏi lắm!
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5" />
                                Chưa đúng rồi!
                              </>
                            )}
                          </div>
                          {!isCorrect && question.explanation && (
                            <p className="text-xs text-muted-foreground mt-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="font-semibold">Giải thích:</span> {question.explanation}
                            </p>
                          )}
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {!showResult ? (
                          <button
                            onClick={handleCheckAnswer}
                            disabled={selectedAnswer === null}
                            className="flex-1 py-3 rounded-2xl bg-linear-to-r from-blue-500 to-pink-500 text-white font-bold text-sm shadow-md hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Kiểm tra đáp án
                          </button>
                        ) : (
                          <button
                            onClick={handleNextQuestion}
                            className="flex-1 py-3 rounded-2xl bg-linear-to-r from-blue-500 to-pink-500 text-white font-bold text-sm shadow-md hover:opacity-90 transition"
                          >
                            {currentQuestion < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : activeTab === "quiz" && quizFinished ? (
                  /* Quiz Finished */
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-linear-to-r from-blue-500 to-pink-500 flex items-center justify-center mx-auto shadow-lg">
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                        Hoàn thành!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Bạn đã trả lời đúng <span className="font-bold text-primary">{score}</span> trên <span className="font-bold">{questions.length}</span> câu hỏi.
                      </p>
                    </div>

                    {/* Score Progress */}
                    {questions.length > 0 && (
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 dark:border-white/10">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Điểm của bạn</span>
                        <span className="font-bold text-slate-800 dark:text-white">{Math.round((score / questions.length) * 100)}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-linear-to-r from-blue-400 to-pink-400 transition-all duration-500"
                          style={{ width: `${(score / questions.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    )}

                    {/* Answer Summary */}
                    <div className="space-y-2">
                      {questions.map((q, index) => {
                        const userAnswer = answers[index];
                        const isCorrect = userAnswer === q.correctAnswer;
                        return (
                          <div
                            key={q.id}
                            className={`flex items-center gap-3 p-3 rounded-xl ${
                              isCorrect 
                                ? "bg-emerald-50/50 dark:bg-emerald-900/20" 
                                : "bg-red-50/50 dark:bg-red-900/20"
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-red-400 shrink-0" />
                            )}
                            <div className="flex-1 text-left">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-1">
                                {q.question}
                              </p>
                              {!isCorrect && userAnswer !== null && q.options[userAnswer] !== undefined && (
                                <p className="text-[10px] text-muted-foreground">
                                  Đáp án của bạn: {q.options[userAnswer]} → Đáp án đúng: {q.options[q.correctAnswer]}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Retry Button */}
                    <button
                      onClick={handleRetry}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/60 dark:bg-white/15 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white font-semibold text-sm hover:bg-white/80 dark:hover:bg-white/25 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Làm lại
                    </button>

                    {/* Back to List */}
                    <Link
                      to="/student/reading"
                      className="block w-full py-3 rounded-2xl bg-linear-to-r from-blue-500 to-pink-500 text-white font-bold text-sm text-center hover:opacity-90 transition"
                    >
                      Quay lại danh sách bài đọc
                    </Link>
                  </div>
                ) : (
                  /* Non-quiz tabs - Show reading preview */
                  <div className="space-y-4">
                    <div className="bg-white/80 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Quick Preview</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-6">
                        {reading.passageText}
                      </p>
                    </div>

                    <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20">
                      <p className="text-sm text-center text-muted-foreground">
                        Chuyển sang tab <span className="font-semibold text-primary">"Luyện tập"</span> để làm bài kiểm tra
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
