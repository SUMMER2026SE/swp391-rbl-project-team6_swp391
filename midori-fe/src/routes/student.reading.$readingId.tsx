import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, CheckCircle2, XCircle, Trophy, RotateCcw, 
  BookOpen, Clock, CheckCircle, Circle
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { mockReading, getReadingById } from "@/mock/reading";
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

function ReadingDetailPage() {
  const params = Route.useParams();
  const readingId = params.readingId;

  const reading = useMemo(() => getReadingById(readingId), [readingId]);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

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

  const questions = reading.comprehensionQuestions;
  const question = questions[currentQuestion];
  const wordCount = reading.passageText.split(/[\s\n]+/).filter(Boolean).length;

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
    if (answer === questions[index].correctAnswer) return acc + 1;
    return acc;
  }, 0);

  const isCorrect = selectedAnswer === question?.correctAnswer;

  return (
    <div className="min-h-screen relative flex flex-col">
      <SakuraBg count={14} />
      <div className="relative z-10 bg-white dark:bg-slate-900 flex-1">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  to="/student/reading"
                  className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColors[reading.jlptLevel]}`}>
                      JLPT {reading.jlptLevel}
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

              {/* Progress */}
              {!quizFinished && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Question {currentQuestion + 1}/{questions.length}
                  </span>
                  <div className="w-24 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-blue-400 to-pink-400 transition-all duration-300"
                      style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Split Layout Content */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
            
            {/* LEFT COLUMN - Reading Passage (60%) */}
            <div className="lg:w-[60%] lg:border-r border-slate-200 dark:border-white/10">
              <div className="sticky top-[80px] h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] overflow-y-auto">
                <div className="p-6 lg:p-8">
                  <div className="space-y-6">
                    {/* Passage Header */}
                    <div>
                      <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">
                        Bài đọc
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Đọc kỹ đoạn văn bản bên dưới và trả lời các câu hỏi ở cột bên phải.
                      </p>
                    </div>

                    {/* Passage Content */}
                    <div className="bg-linear-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/20 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                      <div 
                        className="text-lg leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-medium"
                        style={{ fontFamily: "var(--font-japanese, serif)" }}
                      >
                        {reading.passageText}
                      </div>
                    </div>

                    {/* Vocabulary hints */}
                    <div className="flex flex-wrap gap-2">
                      {reading.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Quiz (40%) */}
            <div className="lg:w-[40%] bg-slate-50/50 dark:bg-slate-800/30">
              <div className="p-6 lg:p-8">
                {!quizFinished ? (
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
                ) : (
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
                              {!isCorrect && userAnswer !== null && (
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
