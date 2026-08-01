import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  Clock,
  X,
  Play,
  Bookmark,
  Zap,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
  Check,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  BookOpen,
  Hash,
  BrainCircuit,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { dictionaryApi, type SavedWordResponse } from "@/lib/api/dictionary";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface RouteSearchParams {
  sourceVideoId?: string;
}

export const Route = createFileRoute("/student/vocabulary/flashcards")({
  validateSearch: (search: Record<string, unknown>): RouteSearchParams => {
    return {
      sourceVideoId: search.sourceVideoId as string | undefined,
    };
  },
  component: FlashcardsPage,
});

function speakJapanese(text: string) {
  if (!text?.trim()) return;
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);
}

function FlashcardsPage() {
  const { sourceVideoId } = Route.useSearch();
  const navigate = useNavigate();

  // Screen state
  const [step, setStep] = useState<"setup" | "study" | "completion">("setup");

  // Filters state
  const [range, setRange] = useState<"all" | "video" | "new" | "review" | "difficult">(() => {
    return sourceVideoId ? "video" : "all";
  });
  const [limitCount, setLimitCount] = useState<number | "all">(20);
  const [sortOrder, setSortOrder] = useState<"random" | "newest" | "oldest" | "need_review">("random");
  const [frontSideMode, setFrontSideMode] = useState<"ja" | "vi" | "both">("ja");

  // Load all words first for statistics card counters
  const { data: allSavedWords = [], isLoading: isLoadingAll, refetch: refetchAll } = useQuery({
    queryKey: ["allSavedWordsForStats"],
    queryFn: () => dictionaryApi.getSavedWords(),
  });

  // Derived statistics
  const stats = useMemo(() => {
    const total = allSavedWords.length;
    const unlearned = allSavedWords.filter(w => w.learningStatus === "NEW").length;
    const learning = allSavedWords.filter(w => w.learningStatus === "LEARNING" || w.learningStatus === "REVIEW").length;
    const mastered = allSavedWords.filter(w => w.learningStatus === "MASTERED").length;
    return { total, unlearned, learning, mastered };
  }, [allSavedWords]);

  // Actual words filtered & fetched for the session
  const { data: sessionPool = [], isLoading: isLoadingSession, refetch: refetchSession } = useQuery({
    queryKey: ["sessionWordsPool", range, sortOrder],
    queryFn: async () => {
      const statusFilter = range === "new" ? "NEW" : range === "review" ? "NEED_REVIEW" : undefined;
      const difficultFilter = range === "difficult" ? true : undefined;
      const videoFilter = range === "video" ? sourceVideoId : undefined;

      const list = await dictionaryApi.getSavedWords({
        sourceVideoId: videoFilter,
        status: statusFilter,
        difficult: difficultFilter,
        sort: sortOrder === "need_review" ? undefined : sortOrder, // Let FE handle special sorting if needed, else match backend sort
      });

      // Handle additional sorting
      let sorted = [...list];
      if (sortOrder === "need_review") {
        sorted.sort((a, b) => {
          const nextA = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
          const nextB = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
          return nextA - nextB;
        });
      } else if (sortOrder === "random") {
        // shuffle
        for (let i = sorted.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        }
      }
      return sorted;
    },
  });

  // Session state variables
  const [cards, setCards] = useState<SavedWordResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<Record<string, "AGAIN" | "HARD" | "GOOD" | "MASTERED">>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [submittingProgress, setSubmittingProgress] = useState<string | null>(null);

  // Spacing helper for reinserting AGAIN/HARD cards back into the current session
  const reinsertCard = useCallback((card: SavedWordResponse, offset: number) => {
    setCards((prev) => {
      const newCards = [...prev];
      const targetIndex = Math.min(currentIndex + offset, newCards.length);
      newCards.splice(targetIndex, 0, card);
      return newCards;
    });
  }, [currentIndex]);

  // Session Timer
  useEffect(() => {
    if (step !== "study") return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleStartStudy = () => {
    if (sessionPool.length === 0) {
      toast.error("Không tìm thấy từ vựng nào khớp với bộ lọc");
      return;
    }
    const selectedCount = limitCount === "all" ? sessionPool.length : Math.min(limitCount, sessionPool.length);
    setCards(sessionPool.slice(0, selectedCount));
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionResults({});
    setTimerSeconds(0);
    setStartTime(Date.now());
    setStep("study");
  };

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const next = !prev;
      if (next && cards[currentIndex]) {
        // Speak Japanese word on flip reveal
        speakJapanese(cards[currentIndex].reading || cards[currentIndex].surface);
      }
      return next;
    });
  }, [cards, currentIndex]);

  const handleAssess = async (result: "AGAIN" | "HARD" | "GOOD" | "MASTERED") => {
    const currentCard = cards[currentIndex];
    if (!currentCard || submittingProgress) return;

    setSubmittingProgress(currentCard.id);
    try {
      // Send progress report to backend API
      await dictionaryApi.updateProgress(currentCard.id, { result });
      
      setSessionResults((prev) => ({
        ...prev,
        [currentCard.id]: result,
      }));

      // If AGAIN, reinsert after 3 cards
      if (result === "AGAIN") {
        reinsertCard(currentCard, 3);
      } else if (result === "HARD") {
        // If HARD, reinsert after 6 cards
        reinsertCard(currentCard, 6);
      }

      toast.success(
        result === "AGAIN"
          ? "Đã đánh dấu xem lại sớm"
          : result === "HARD"
          ? "Đã lưu độ khó: Khó"
          : result === "GOOD"
          ? "Đã lưu độ khó: Nhớ"
          : "Đã lưu độ khó: Đã thuộc"
      );

      // Advance
      if (currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        // End session
        setStep("completion");
        refetchAll(); // refresh setup statistics
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật tiến trình học");
    } finally {
      setSubmittingProgress(null);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (step !== "study" || showExitConfirm) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (["Digit1", "Digit2", "Numpad1", "Numpad2"].includes(e.code)) {
        const key = e.code.replace("Digit", "").replace("Numpad", "");
        if (key === "1") handleAssess("AGAIN");
        else if (key === "2") handleAssess("MASTERED");
      } else if (e.code === "ArrowLeft" && currentIndex > 0 && !isFlipped) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.code === "ArrowRight" && currentIndex < cards.length - 1 && isFlipped) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, isFlipped, currentIndex, cards, showExitConfirm]);

  const handleExitSession = (saveProgress: boolean) => {
    setShowExitConfirm(false);
    if (saveProgress) {
      setStep("completion");
      refetchAll();
    } else {
      setStep("setup");
    }
  };

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // derived accuracy stats for final dashboard
  const completionStats = useMemo(() => {
    const total = Object.keys(sessionResults).length;
    const again = Object.values(sessionResults).filter(v => v === "AGAIN").length;
    const hard = Object.values(sessionResults).filter(v => v === "HARD").length;
    const good = Object.values(sessionResults).filter(v => v === "GOOD").length;
    const mastered = Object.values(sessionResults).filter(v => v === "MASTERED").length;
    
    // list of difficult words to review
    const troubledWords = cards.filter(w => sessionResults[w.id] === "AGAIN" || sessionResults[w.id] === "HARD");

    return {
      total,
      again,
      hard,
      good,
      mastered,
      accuracy: total > 0 ? Math.round(((good + mastered) / total) * 100) : 0,
      troubledWords,
    };
  }, [sessionResults, cards]);

  if (isLoadingAll) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500">Đang đồng bộ dữ liệu từ vựng...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[90vh] flex flex-col p-4 md:p-6 lg:p-8">
      <SakuraBg count={10} />

      {/* ─── 1. SETUP SCREEN ────────────────────────────────────────────────── */}
      {step === "setup" && (
        <div className="max-w-4xl mx-auto w-full space-y-6 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-white/10 pb-4">
            <Link
              to={sourceVideoId ? `/student/shadowing/video/${sourceVideoId}` : "/student/shadowing"}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-indigo-300 hover:text-primary transition font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại học Shadowing
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2 mt-2">
              <BrainCircuit className="w-7 h-7 text-primary" />
              Ôn tập từ vựng
            </h1>
            <p className="text-sm text-slate-500 dark:text-indigo-200/60">
              Học lại những từ bạn đã lưu bằng phương pháp trắc nghiệm thẻ ghi nhớ (Flashcard).
            </p>
          </div>

          {allSavedWords.length === 0 ? (
            /* Empty State */
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-100 dark:border-white/10 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Bạn chưa lưu từ vựng nào</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Hãy click vào các từ vựng xuất hiện trong bản dịch (Transcript) của phần Shadowing để lưu lại trước.
              </p>
              <Link
                to="/student/shadowing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-hero text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition"
              >
                Khám phá video Shadowing
              </Link>
            </div>
          ) : (
            /* Setup Dashboard & Filters */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Stats & Setup Filters */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-100 dark:border-white/5 shadow-sm text-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Đã lưu</span>
                    <p className="text-2xl font-black text-primary mt-1">{stats.total}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-100 dark:border-white/5 shadow-sm text-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Chưa học</span>
                    <p className="text-2xl font-black text-blue-500 mt-1">{stats.unlearned}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-100 dark:border-white/5 shadow-sm text-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Đang học</span>
                    <p className="text-2xl font-black text-amber-500 mt-1">{stats.learning}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-100 dark:border-white/5 shadow-sm text-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Đã thuộc</span>
                    <p className="text-2xl font-black text-emerald-500 mt-1">{stats.mastered}</p>
                  </div>
                </div>

                {/* Filters Board */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-white/8 shadow-md space-y-5">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2">
                    Cấu hình ôn tập
                  </h3>

                  {/* Phạm vi học */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Phạm vi ôn tập</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => setRange("all")}
                        className={cn(
                          "p-3 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer",
                          range === "all"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                        )}
                      >
                        Tất cả từ đã lưu
                        <Bookmark className="w-3.5 h-3.5 opacity-60" />
                      </button>

                      {sourceVideoId && (
                        <button
                          onClick={() => setRange("video")}
                          className={cn(
                            "p-3 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer",
                            range === "video"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                          )}
                        >
                          Trong video hiện tại
                          <Play className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      )}

                      <button
                        onClick={() => setRange("new")}
                        className={cn(
                          "p-3 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer",
                          range === "new"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                        )}
                      >
                        Từ chưa học (NEW)
                        <Sparkles className="w-3.5 h-3.5 opacity-60" />
                      </button>

                    </div>
                  </div>

                  {/* Thứ tự học */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Thứ tự hiển thị</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border-0 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="random">Ngẫu nhiên</option>
                      <option value="newest">Mới lưu trước</option>
                      <option value="oldest">Cũ nhất trước</option>
                      <option value="need_review">Từ cần ôn trước</option>
                    </select>
                  </div>

                  {/* Mặt trước thẻ */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Mặt trước của Flashcard</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
                      {([
                        { key: "ja", label: "Tiếng Nhật" },
                        { key: "vi", label: "Tiếng Việt" },
                        { key: "both", label: "Hai chiều ngẫu nhiên" },
                      ] as const).map((mode) => (
                        <button
                          key={mode.key}
                          onClick={() => setFrontSideMode(mode.key)}
                          className={cn(
                            "flex-1 py-2 text-center text-[11px] font-bold rounded-xl transition cursor-pointer",
                            frontSideMode === mode.key
                              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                          )}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Setup Preview Panel */}
              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-white/8 shadow-md flex flex-col justify-between min-h-[300px]">
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                    Tổng kết bộ lọc
                  </h4>

                  {isLoadingSession ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs py-2 border-b border-slate-100 dark:border-white/5">
                        <span className="text-slate-400">Số từ khớp bộ lọc:</span>
                        <span className="font-bold text-slate-700 dark:text-white">{sessionPool.length} từ</span>
                      </div>
                      <div className="flex justify-between text-xs py-2 border-b border-slate-100 dark:border-white/5">
                        <span className="text-slate-400">Số lượng học dự kiến:</span>
                        <span className="font-bold text-primary">
                          {limitCount === "all" ? sessionPool.length : Math.min(limitCount, sessionPool.length)} thẻ
                        </span>
                      </div>
                    </div>
                  )}

                  {sessionPool.length === 0 && !isLoadingSession && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        Không tìm thấy từ vựng nào khớp với cấu hình hiện tại. Vui lòng đổi phạm vi học.
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-6">
                  <Button
                    onClick={handleStartStudy}
                    disabled={sessionPool.length === 0 || isLoadingSession}
                    className="w-full rounded-2xl py-3 font-bold bg-gradient-hero text-white shadow-md hover:opacity-90 active:scale-95 transition cursor-pointer"
                  >
                    Bắt đầu học ({limitCount === "all" ? sessionPool.length : Math.min(limitCount, sessionPool.length)} thẻ)
                  </Button>
                  
                  {sourceVideoId && (
                    <Link
                      to={`/student/shadowing/video/${sourceVideoId}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-indigo-200/70 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                    >
                      Quay lại video Shadowing
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 2. MAIN FLASHCARD STUDY INTERFACE ─────────────────────────────────── */}
      {step === "study" && cards.length > 0 && (
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col gap-6 relative z-10">
          
          {/* Top study header */}
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowExitConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-indigo-300 hover:text-primary transition font-bold"
              >
                <X className="w-4 h-4" />
                Thoát buổi học
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono font-bold">
                <Clock className="w-4 h-4 text-slate-400" />
                {formatTimer(timerSeconds)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Thẻ {currentIndex + 1} / {cards.length}</span>
                <span>{Math.round(((currentIndex) / cards.length) * 100)}% hoàn thành</span>
              </div>
              <Progress value={((currentIndex) / cards.length) * 100} className="h-2" />
            </div>
          </div>

          {/* Main card viewport */}
          <div className="flex-1 flex items-center justify-center py-4 min-h-[420px]">
            {/* Perspective flip container */}
            <div
              onClick={handleFlip}
              className="relative w-full max-w-xl h-96 cursor-pointer group select-none"
              style={{ perspective: 1200 }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleFlip();
                }
              }}
              aria-label="Flashcard từ vựng. Nhấn phím cách hoặc click chuột để lật thẻ."
            >
              {/* Rotatable inner element */}
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative w-full h-full w-full"
              >
                
                {/* FRONT SIDE */}
                <div
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  className="absolute inset-0 p-6 flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl bg-white dark:bg-slate-900"
                >
                  {/* Front Top header */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs",
                      cards[currentIndex].learningStatus === "NEW"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : cards[currentIndex].learningStatus === "MASTERED"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {cards[currentIndex].learningStatus === "NEW" ? "Chưa học" : cards[currentIndex].learningStatus === "MASTERED" ? "Đã thuộc" : "Đang học"}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {cards[currentIndex].jlptLevel && (
                        <span className="text-[9px] font-black bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 rounded-full">
                          {cards[currentIndex].jlptLevel}
                        </span>
                      )}
                      {cards[currentIndex].isDifficult && (
                        <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">
                          Khó
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Front Center Word */}
                  <div className="text-center space-y-4">
                    <h2
                      className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-wide"
                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                    >
                      {frontSideMode === "vi" ? cards[currentIndex].meaning : cards[currentIndex].surface}
                    </h2>
                    {frontSideMode !== "vi" && cards[currentIndex].reading && cards[currentIndex].reading !== cards[currentIndex].surface && (
                      <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                        [{cards[currentIndex].reading}]
                      </p>
                    )}
                    {cards[currentIndex].wordType && (
                      <span className="inline-flex px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {cards[currentIndex].wordType}
                      </span>
                    )}
                  </div>

                  {/* Front Hint */}
                  <p className="text-center text-[10px] text-slate-400 tracking-wide">
                    Nhấn vào thẻ hoặc phím Space để xem đáp án
                  </p>
                </div>

                {/* BACK SIDE */}
                <div
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  className="absolute inset-0 p-6 flex flex-col justify-between overflow-y-auto scrollbar-none rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl bg-white dark:bg-slate-900"
                >
                  {/* Back Top header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mặt sau thẻ</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakJapanese(cards[currentIndex].reading || cards[currentIndex].surface);
                      }}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-primary transition cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Back Center Meaning */}
                  <div className="text-center space-y-4 py-3">
                    <div className="space-y-1">
                      <p
                        className="text-2xl font-black text-slate-800 dark:text-white"
                        style={{ fontFamily: "var(--font-japanese, serif)" }}
                      >
                        {cards[currentIndex].surface}
                      </p>
                      {cards[currentIndex].reading && cards[currentIndex].reading !== cards[currentIndex].surface && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">[{cards[currentIndex].reading}]</p>
                      )}
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 inline-block max-w-md mx-auto">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed">
                        {cards[currentIndex].meaning}
                      </p>
                    </div>

                    {/* Context sentence */}
                    {cards[currentIndex].context && cards[currentIndex].context.trim() && (
                      <div className="text-left max-w-md mx-auto border-t border-slate-100 dark:border-white/5 pt-3 space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ngữ cảnh gốc</span>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                          {cards[currentIndex].context}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Back Hint */}
                  <p className="text-center text-[10px] text-slate-400 tracking-wide">
                    Chọn mức độ nhớ ở bên dưới để lưu tiến độ
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Assessment & Study Actions */}
          <div className="flex flex-col gap-4 shrink-0">
            {/* Spaced repetition buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={submittingProgress !== null}
                onClick={() => handleAssess("AGAIN")}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer gap-1 shadow-sm border-red-200 dark:border-red-500/30 bg-white dark:bg-slate-950 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95"
              >
                <span className="text-xs font-black">Chưa thuộc</span>
                <span className="text-[9px] font-bold opacity-60">Phím 1</span>
              </button>

              <button
                disabled={submittingProgress !== null}
                onClick={() => handleAssess("MASTERED")}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer gap-1 shadow-sm border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-950 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 active:scale-95"
              >
                <span className="text-xs font-black">Đã thuộc</span>
                <span className="text-[9px] font-bold opacity-60">Phím 2</span>
              </button>
            </div>

            {/* Prev/Next manual buttons */}
            <div className="flex justify-between items-center px-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => prev - 1);
                }}
                className="flex items-center gap-1.5 text-sm font-black text-primary dark:text-cyan-400 hover:text-primary/80 dark:hover:text-cyan-300 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 stroke-[3]" />
                Thẻ trước
              </button>
              
              {!isFlipped && (
                <button
                  onClick={handleFlip}
                  className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-indigo-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Lật thẻ
                </button>
              )}

              <button
                disabled={currentIndex === cards.length - 1}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => prev + 1);
                }}
                className="flex items-center gap-1.5 text-sm font-black text-primary dark:text-cyan-400 hover:text-primary/80 dark:hover:text-cyan-300 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Thẻ tiếp
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. COMPLETION SCREEN ────────────────────────────────────────────── */}
      {step === "completion" && (
        <div className="max-w-2xl mx-auto w-full space-y-6 relative z-10 text-center py-6">
          {/* Celebratory header */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-2">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
              Hoàn thành buổi học!
            </h1>
            <p className="text-xs text-slate-500 dark:text-indigo-200/50">
              Bạn đã ôn tập xong {completionStats.total} thẻ ghi nhớ. Dưới đây là thống kê chi tiết.
            </p>
          </div>

          {/* Statistics visualization */}
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-white/8 shadow-md grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {/* Accuracy Circular progress */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase font-black text-slate-400">Độ nhớ thẻ</span>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-slate-100 dark:stroke-white/5"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-emerald-500"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - completionStats.accuracy / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xl font-black text-slate-800 dark:text-white">
                  {completionStats.accuracy}%
                </span>
              </div>
            </div>

            {/* Stats breakdown lists */}
            <div className="sm:col-span-2 space-y-3.5 text-left text-xs font-bold text-slate-500">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tổng thời gian ôn:</span>
                  <span className="text-slate-700 dark:text-white font-mono">{formatTimer(timerSeconds)}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Đã thuộc / Nhớ:
                  </span>
                  <span className="text-slate-800 dark:text-white font-black">
                    {completionStats.good + completionStats.mastered} từ
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Chưa nhớ:
                  </span>
                  <span className="text-slate-800 dark:text-white font-black">
                    {completionStats.again} từ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* List of troubled words (AGAIN/HARD) */}
          {completionStats.troubledWords.length > 0 && (
            <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-white/8 shadow-md text-left space-y-3">
              <h3 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Từ vựng cần lưu ý ôn tập lại
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
                {completionStats.troubledWords.map((vocab, i) => (
                  <div
                    key={vocab.id}
                    className="flex justify-between items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                        {vocab.surface}
                      </span>
                      {vocab.reading && vocab.reading !== vocab.surface && (
                        <span className="text-[10px] text-slate-400 ml-1.5 font-medium">[{vocab.reading}]</span>
                      )}
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold max-w-[200px] truncate">
                      {vocab.meaning}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => {
                refetchSession().then(() => handleStartStudy());
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-hero text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition cursor-pointer"
            >
              Học lại toàn bộ
            </button>

            <button
              onClick={() => setStep("setup")}
              className="px-5 py-3 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-95 transition cursor-pointer"
            >
              Về trang thiết lập
            </button>

            {sourceVideoId && (
              <Link
                to={`/student/shadowing/video/${sourceVideoId}`}
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-95 transition"
              >
                Quay lại video Shadowing
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ─── 4. EXIT DIALOG CONFIRMATION ────────────────────────────────────────── */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/15 p-6 w-full max-w-sm shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 text-slate-800 dark:text-white">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">Thoát học Flashcard?</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-indigo-200/70 leading-relaxed">
                Bạn vẫn chưa hoàn thành buổi học hiện tại. Bạn có muốn lưu kết quả của những từ đã học hoặc thoát hẳn không?
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full rounded-2xl py-2 text-xs font-bold cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Tiếp tục học
                </Button>
                <Button
                  onClick={() => handleExitSession(true)}
                  className="w-full rounded-2xl py-2 text-xs font-bold cursor-pointer bg-gradient-hero text-white shadow-md hover:opacity-90 transition"
                >
                  Thoát và lưu tiến độ
                </Button>
                <Button
                  onClick={() => handleExitSession(false)}
                  variant="ghost"
                  className="w-full rounded-2xl py-2 text-xs font-bold cursor-pointer text-destructive hover:bg-destructive/10 transition"
                >
                  Thoát không lưu
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
