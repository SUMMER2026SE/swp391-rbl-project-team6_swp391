import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Clock, ChevronRight, CheckCircle, X,
  Volume2, Play, ChevronLeft, Trophy,
  Bookmark, Zap, ChevronDown, Tag,
  Loader2, Star, Search, User,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import {
  studentVocabularyApi,
  type VocabularyLessonResponse,
  type VocabularyLessonDetailResponse,
} from "@/lib/api/studentVocabulary";
import {
  studentProgressApi,
  type ContentType,
} from "@/lib/api/studentProgress";
import { ApiError } from "@/lib/api/client";

// ─── Word Status ───────────────────────────────────────────────────────────────
type WordStatus = "new" | "learning" | "mastered";

// Extract lesson number from title like "Bài 1: Chào hỏi" → 1
function extractLessonNumber(title?: string): number {
  if (!title) return Infinity;
  const match = title.match(/Bài\s*\.?\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : Infinity;
}

// Sort lessons by lesson number in title (Bài 1, Bài 2, ..., Bài 10)
function sortLessonsByNumber(lessons: VocabularyLessonResponse[]): VocabularyLessonResponse[] {
  return [...lessons].sort((a, b) => {
    const numA = extractLessonNumber(a.title);
    const numB = extractLessonNumber(b.title);
    if (numA !== numB) {
      return numA - numB;
    }
    // Fallback: sort by createdAt if same or no number
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateA - dateB;
  });
}

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

const FILTER_TABS = ["All", "Mastered", "Learning", "Favorite"] as const;

function speakJapanese(text: string) {
  if (!text?.trim()) return;
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

function getLevelGradient(level: string): string {
  const g: Record<string, string> = {
    N5: "from-blue-300 via-sky-400 to-cyan-400",
    N4: "from-blue-300 via-sky-400 to-cyan-400",
    N3: "from-blue-300 via-sky-400 to-cyan-400",
    N2: "from-blue-300 via-sky-400 to-cyan-400",
    N1: "from-blue-300 via-sky-400 to-cyan-400",
  };
  return g[level] ?? "from-blue-300 via-sky-400 to-cyan-400";
}

function getLevelGradientDark(level: string): string {
  const g: Record<string, string> = {
    N5: "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80",
    N4: "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80",
    N3: "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80",
    N2: "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80",
    N1: "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80",
  };
  return g[level] ?? "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80";
}

function getLevelBadge(level: string): string {
  const c: Record<string, string> = {
    N5: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
    N4: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
    N3: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
    N2: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
    N1: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
  };
  return c[level] ?? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300";
}

function getTopicColor(topic: string): string {
  const c: Record<string, string> = {
    Family:
      "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-800",
    School:
      "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Food: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    Travel:
      "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    Shopping:
      "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    Work: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    "Daily Life":
      "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800",
    "Business Japanese":
      "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    Nature:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  };
  return (
    c[topic] ??
    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
  );
}

function getTopicIcon(topic: string): string {
  const icons: Record<string, string> = {
    "All Topics": "🌐",
    "Daily Life": "🌅",
    General: "📚",
    Family: "👨‍👩‍👧‍👦",
    School: "🏫",
    Food: "🍜",
    Shopping: "🛍️",
    Travel: "✈️",
    Nature: "🌿",
    Business: "💼",
    "Business Japanese": "📊",
  };
  return icons[topic] ?? "📚";
}

interface TopicsDropdownProps {
  topics: string[];
  selected: string;
  onSelect: (topic: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function TopicsDropdown({ topics, selected, onSelect, isOpen, onToggle }: TopicsDropdownProps) {
  const handleSelect = (topic: string) => {
    onSelect(topic);
    onToggle();
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-sm ${
          isOpen || selected !== "All Topics"
            ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-md"
            : "bg-white/70 dark:bg-white/6 backdrop-blur-sm border border-white/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/80 hover:text-foreground dark:hover:bg-white/10 dark:hover:border-white/15"
        }`}
      >
        <span className="text-base">{getTopicIcon(selected)}</span>
        <span>{selected}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-64 sm:w-72 z-50 max-w-[calc(100vw-2rem)]"
          >
            <div className="bg-white/95 dark:bg-indigo-950/90 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-indigo-400/20 shadow-xl shadow-black/10 p-2">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground dark:text-indigo-200/70">
                  <Tag className="w-3.5 h-3.5" />
                  Topics
                </div>
                <span className="text-[10px] text-muted-foreground dark:text-indigo-200/60">
                  {topics.length - 1} topics
                </span>
              </div>

              {/* Topic Pills */}
              <div className="space-y-1">
                {topics.map((topic) => {
                  const isSelected = topic === selected;
                  return (
                    <button
                      key={topic}
                      onClick={() => handleSelect(topic)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-md"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.07] text-slate-700 dark:text-indigo-200/80"
                      }`}
                    >
                      <span className="text-base">{getTopicIcon(topic)}</span>
                      <span className="flex-1 text-left">{topic}</span>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 px-3 pb-1">
                <p className="text-[10px] text-muted-foreground text-center">
                  Tap to filter · Tap again or outside to close
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/student/vocabulary")({ component: VocabularyPage });

function VocabularyPage() {
  const [lessons, setLessons] = useState<VocabularyLessonResponse[]>([]);
  const [allLessonsBase, setAllLessonsBase] = useState<VocabularyLessonResponse[]>([]);
  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("All Topics");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<(typeof FILTER_TABS)[number]>("All");
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const WORDS_PER_PAGE = 10;

  // Word status: "new" | "learning" | "mastered"
  const [wordStatuses, setWordStatuses] = useState<Record<string, WordStatus>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [progressLoading, setProgressLoading] = useState(false);
  // Lesson detail state
  const [lessonDetail, setLessonDetail] = useState<VocabularyLessonDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // ── Fetch progress from API on mount ────────────────────────────────────────
  useEffect(() => {
    const fetchProgress = async () => {
      setProgressLoading(true);
      try {
        const progressList = await studentProgressApi.getProgress({ contentType: "VOCABULARY" });

        // Build word statuses from API data
        const newStatuses: Record<string, WordStatus> = {};
        const newFavorites = new Set<string>();
        const newCompletedLessons = new Set<string>();

        progressList.forEach((p) => {
          const contentKey = `${p.contentId}`;
          if (p.mastered) {
            newStatuses[contentKey] = "mastered";
          } else if (p.learned) {
            newStatuses[contentKey] = "learning";
          }
          if (p.favorite) {
            newFavorites.add(contentKey);
          }
          if (p.completed) {
            newCompletedLessons.add(p.contentId);
          }
        });

        setWordStatuses(newStatuses);
        setFavorites(newFavorites);
        setCompletedLessons(newCompletedLessons);
      } catch (err) {
        // Silently fail - use empty state on error
        console.error("Failed to load progress:", err);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgress();
  }, []);

  // Fetch lesson detail when opening a lesson
  const openLesson = async (lessonId: string) => {
    setActiveLesson(lessonId);
    setDetailLoading(true);
    setDetailError(null);
    setLessonDetail(null);
    setFilterTab("All");
    setCurrentPage(1);
    try {
      const detail = await studentVocabularyApi.getPublishedLessonDetail(lessonId);
      setLessonDetail(detail);
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : "Failed to load lesson details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Fetch published lessons from API
  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lessonParams = {
        level: selectedLevel !== "all" ? selectedLevel : undefined,
        topic: selectedTopic !== "All Topics" ? selectedTopic : undefined,
        search: appliedSearch.trim() || undefined,
      };

      const [allData, filteredData] = await Promise.all([
        studentVocabularyApi.getPublishedLessons(),
        studentVocabularyApi.getPublishedLessons(lessonParams),
      ]);

      setAllLessonsBase(sortLessonsByNumber(allData));
      setLessons(sortLessonsByNumber(filteredData));

      const topics = Array.from(new Set(allData.map(l => l.topic).filter(Boolean) as string[])).sort();
      setAllTopics(topics);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load lessons");
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, selectedTopic, appliedSearch]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const filteredLessons = lessons;

  // ── Derived: topics available within the selected level ─────────────────────
  const topicsInLevel = useMemo(() => {
    const levelFiltered = allTopics.filter(Boolean);
    return ["All Topics", ...levelFiltered];
  }, [allTopics]);

  const totalWordsAll = allLessonsBase.reduce((sum, l) => sum + (l.wordCount ?? l.word_count ?? 0), 0);
  const totalLearned = Object.values(wordStatuses).filter(s => s === "mastered").length;
  const totalLearning = totalWordsAll - totalLearned;
  const totalFavorites = favorites.size;

  const getWordStatus = (wordKey: string): WordStatus => wordStatuses[wordKey] ?? "new";
  const getWordStatusDot = (wordKey: string): string => {
    const s = getWordStatus(wordKey);
    if (s === "mastered") return "bg-green-400";
    if (s === "learning") return "bg-amber-400";
    return "bg-slate-300";
  };

  const setWordStatus = (wordKey: string, status: WordStatus) => {
    // Find lesson ID from wordKey
    const lessonId = activeLesson ?? wordKey.split("-")[0];
    const word = wordKey.includes("-") ? wordKey.split("-").slice(1).join("-") : wordKey;

    // Update local state immediately
    setWordStatuses((prev) => {
      const next = { ...prev };
      if (status === "new") {
        delete next[wordKey];
      } else {
        next[wordKey] = status;
      }
      return next;
    });

    // Call API
    const markAsMasteredFn = async () => {
      try {
        if (status === "mastered") {
          await studentProgressApi.markAsMastered("VOCABULARY", lessonId);
        } else if (status === "new") {
          // Unmark as mastered
          await studentProgressApi.markAsLearned("VOCABULARY", lessonId);
        }
      } catch (err) {
        console.error("Failed to update progress:", err);
      }
    };
    markAsMasteredFn();
  };

  const toggleFavoriteWord = (wordKey: string) => {
    // Find lesson ID from wordKey
    const lessonId = activeLesson ?? wordKey.split("-")[0];

    // Update local state immediately
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(wordKey)) {
        next.delete(wordKey);
      } else {
        next.add(wordKey);
      }
      return next;
    });

    // Call API
    const toggleFn = async () => {
      try {
        await studentProgressApi.toggleFavorite("VOCABULARY", lessonId);
      } catch (err) {
        console.error("Failed to toggle favorite:", err);
      }
    };
    toggleFn();
  };

  // ── Lesson Detail View ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="dark:bg-gradient-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 min-h-screen flex flex-col items-center justify-center gap-4">
        <SakuraBg count={14} />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <BookOpen className="w-12 h-12 text-primary/60 dark:text-cyan-400/60 animate-pulse" />
          <p className="text-base font-bold dark:text-white">Loading vocabulary...</p>
          <p className="text-sm text-muted-foreground dark:text-slate-300">Please wait while information is being prepared.</p>
        </div>
      </div>
    );
  }

  if (activeLesson && lessonDetail) {
    const words = lessonDetail.words ?? [];
    const lessonProgress = words.filter(w => wordStatuses[`${activeLesson}-${w.word}`] === "mastered").length;
    const progressPct = words.length > 0 ? Math.round((lessonProgress / words.length) * 100) : 0;

    // Build word list from lessonDetail
    const lessonWords = words.map(w => ({
      id: w.word,
      word: w.word,
      furigana: w.furigana || w.romaji || "",
      meaning: w.meaning,
      example: w.exampleJapanese || "",
      exampleMeaning: w.exampleMeaning || "",
    }));

    const filteredWords = lessonWords.filter((_, idx) => {
      const wordKey = `${activeLesson}-${words[idx]?.word}`;
      const status = getWordStatus(wordKey);
      if (filterTab === "Mastered") return status === "mastered";
      if (filterTab === "Learning") return status !== "mastered";
      if (filterTab === "Favorite") return favorites.has(wordKey);
      return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredWords.length / WORDS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedWords = filteredWords.slice(
      (safePage - 1) * WORDS_PER_PAGE,
      safePage * WORDS_PER_PAGE,
    );

    return (
      <div className="dark:bg-linear-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950">
        <SakuraBg count={14} />
        <div className="relative z-10">
          <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            {/* Lesson Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setActiveLesson(null); setLessonDetail(null); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card/70 dark:bg-white/6 backdrop-blur-sm border border-border/50 dark:border-white/10 text-xs font-semibold hover:bg-card dark:hover:bg-white/9 transition shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-base dark:text-white">{lessonDetail.title}</h2>
                  {lessonDetail.level && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${getLevelBadge(lessonDetail.level)}`}>
                      {lessonDetail.level}
                    </span>
                  )}
                  {lessonDetail.topic && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTopicColor(lessonDetail.topic)}`}>
                      {lessonDetail.topic}
                    </span>
                  )}
                  {progressPct === 100 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-800 text-[10px] font-bold">
                      <CheckCircle className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson Meta Bar */}
            <div className="flex items-center gap-3 flex-wrap px-4 py-3 rounded-2xl bg-card/60 dark:bg-indigo-950/40 backdrop-blur-sm border border-border/50 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <div className="w-24 h-2 rounded-full bg-slate-300/70 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-blue-500 to-pink-500 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-muted-foreground dark:text-indigo-200/80">{progressPct}%</span>
              </div>
              <div className="w-px h-4 bg-border dark:bg-white/10" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-indigo-200/70">
                <BookOpen className="w-3 h-3" />
                <span>{words.length} words</span>
              </div>
              {lessonDetail.estimatedMinutes && (
                <>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>~{lessonDetail.estimatedMinutes} min</span>
                  </div>
                </>
              )}
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                <span>{lessonProgress} mastered</span>
              </div>
              <div className="w-px h-4 bg-border dark:bg-white/10" />
              <div className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
                <Zap className="w-3 h-3" />
                <span>{words.length - words.filter(w => wordStatuses[`${activeLesson}-${w.word}`] === "mastered").length} learning</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => { setFilterTab(tab); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    filterTab === tab
                      ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-sm"
                      : "bg-card/60 dark:bg-white/4.5 backdrop-blur-sm border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/[0.07] dark:hover:border-white/15"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Vocabulary Cards */}
            {detailLoading && (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-3 text-sm font-semibold">Loading words...</span>
              </div>
            )}

            {detailError && (
              <div className="text-center py-12">
                <X className="w-10 h-10 mx-auto text-red-500 mb-3" />
                <p className="text-red-500 mb-2 font-semibold">{detailError}</p>
                <button
                  onClick={() => openLesson(activeLesson)}
                  className="text-sm text-primary underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!detailLoading && !detailError && paginatedWords.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50 dark:text-indigo-300/40 mb-2" />
                <p className="text-sm text-muted-foreground dark:text-slate-300">No words in this category</p>
              </div>
            ) : !detailLoading && !detailError && (
              <div className="space-y-2">
                {paginatedWords.map((word, i) => {
                  const wordKey = `${activeLesson}-${word.word}`;
                  const status = getWordStatus(wordKey);
                  const isFav = favorites.has(wordKey);

                  return (
                    <motion.div
                      key={word.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group bg-card/80 dark:bg-[#0f1430] dark:border-indigo-400/20 dark:hover:border-cyan-300/40 dark:hover:shadow-xl dark:hover:shadow-indigo-500/10 rounded-2xl border border-border/50 px-4 py-3 hover:shadow-md hover:border-blue-200/60 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="grid grid-cols-[auto_minmax(280px,34%)_1px_minmax(260px,1fr)_auto] items-start gap-x-4 gap-y-1">
                        {/* Status dot */}
                        <div className={`w-2 h-2 rounded-full shrink-0 self-start mt-1 ${getWordStatusDot(wordKey)}`} />

                        {/* Japanese + Furigana */}
                        <div className="shrink-0 min-w-0">
                          <div className="font-display text-xl font-black text-foreground dark:text-white leading-tight">{word.word}</div>
                          <div className="text-xs text-primary/80 dark:text-cyan-400 font-medium leading-tight">{word.furigana || word.romaji}</div>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block h-16 w-px self-start shrink-0 rounded-full bg-slate-300/80 dark:bg-indigo-400/50" />

                        {/* Meaning */}
                        <div className="min-w-0 flex items-start pt-0.5">
                          <div className="text-sm font-semibold text-foreground dark:text-slate-100 leading-snug">
                            {word.meaning}
                          </div>
                        </div>

                        {/* Action icons */}
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => setWordStatus(wordKey, "mastered")}
                            title="Mastered"
                            className={`p-1.5 rounded-lg transition-all ${
                              status === "mastered"
                                ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
                                : "text-muted-foreground dark:text-indigo-300/60 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-500"
                            }`}
                          >
                            <CheckCircle
                              className={`w-4 h-4 ${status === "mastered" ? "fill-green-400" : ""}`}
                            />
                          </button>
                          <button
                            onClick={() => setWordStatus(wordKey, "new")}
                            title="Learning"
                            className={`p-1.5 rounded-lg transition-all ${
                              status === "new"
                                ? "bg-muted text-muted-foreground dark:bg-indigo-500/20 dark:text-indigo-300"
                                : "text-muted-foreground dark:text-indigo-300/60 hover:bg-muted/50 dark:hover:bg-indigo-500/15 hover:text-foreground"
                            }`}
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleFavoriteWord(wordKey)}
                            className="p-1.5 rounded-lg transition-all text-muted-foreground dark:text-indigo-300/60 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500 dark:hover:text-amber-400 group/icon"
                          >
                            {isFav ? (
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            ) : (
                              <Star className="w-4 h-4 dark:group-hover/icon:text-amber-400 transition-colors" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakJapanese(word.furigana || word.word);
                            }}
                            title="Play pronunciation"
                            className="p-1.5 rounded-lg text-muted-foreground dark:text-indigo-300/60 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded — Example Sentence */}
                      {(word.example || word.exampleMeaning) && (
                        <div className="mt-2 pt-2 border-t border-border/60 dark:border-indigo-400/15">
                          {word.example && (
                            <div className="text-xs text-muted-foreground dark:text-slate-300/80 italic pl-3" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                              {word.example}
                            </div>
                          )}
                          {word.exampleMeaning && (
                            <div className="text-xs text-muted-foreground/80 dark:text-indigo-200/70 pl-3 mt-0.5">
                              {word.exampleMeaning}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {/* Complete Lesson Button */}
                {paginatedWords.length > 0 && (
                  <div className="flex justify-center pt-2">
                    {progressPct === 100 ? (
                      <div className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 text-sm font-bold border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!activeLesson) return;
                          const newStatuses: Record<string, WordStatus> = {};
                          words.forEach(w => {
                            newStatuses[`${activeLesson}-${w.word}`] = "mastered";
                          });
                          setWordStatuses(prev => ({ ...prev, ...newStatuses }));
                          setCompletedLessons(prev => { const n = new Set(prev); n.add(activeLesson); return n; });
                          try {
                            await studentProgressApi.markAsMastered("VOCABULARY", activeLesson);
                          } catch (err) {
                            console.error("Failed to mark lesson as completed:", err);
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-linear-to-r from-blue-400 to-pink-400 text-white text-sm font-bold shadow-lg shadow-purple-200/30 hover:opacity-90 transition"
                      >
                        <Trophy className="w-4 h-4" /> Complete Lesson
                      </button>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-xl flex items-center justify-center bg-card/70 dark:bg-white/6 border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/9 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          page === currentPage
                            ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-md"
                            : "bg-card/70 dark:bg-white/6 border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/9"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-xl flex items-center justify-center bg-card/70 dark:bg-white/6 border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/9 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

  // ── Browse Lessons View ──────────────────────────────────────────────────────

  return (
    <div className="dark:bg-linear-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-black">Vocabulary Lessons</h1>
              <p className="text-sm text-muted-foreground dark:text-slate-300 mt-0.5">
                Learn Japanese vocabulary through structured lessons.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {[
                { label: "Mastered", value: totalLearned, color: "text-green-500" },
                { label: "Learning", value: totalLearning, color: "text-amber-500" },
                { label: "Total", value: totalWordsAll, color: "text-blue-500" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center px-3 py-2 rounded-xl bg-card/70 dark:bg-indigo-950/50 backdrop-blur-sm border border-border/50 dark:border-indigo-400/20 shadow-sm"
                >
                  <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-3 text-sm font-semibold">Loading lessons...</span>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-16">
              <X className="w-10 h-10 mx-auto text-red-500 mb-3" />
              <p className="text-red-500 mb-2 font-semibold">{error}</p>
              <button onClick={fetchLessons} className="text-sm text-primary underline">Try again</button>
            </div>
          )}

          {/* Content after loading */}
          {!loading && !error && (
            <>
              {/* JLPT Level Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {/* All button */}
                <button
                  onClick={() => { setSelectedLevel("all"); setSelectedTopic("All Topics"); }}
                  className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                    selectedLevel === "all"
                      ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-md"
                      : "bg-card/70 dark:bg-white/4.5 backdrop-blur-sm border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/80 hover:shadow-sm dark:hover:bg-white/8 dark:hover:border-indigo-300/20"
                  }`}
                >
                  <span className="font-display font-bold text-sm leading-none">All</span>
                  <span className={`text-[10px] leading-none ${selectedLevel === "all" ? "text-white/70" : "text-muted-foreground/70 dark:text-indigo-300/60"}`}>
                    {allLessonsBase.length} lessons
                  </span>
                </button>
                {JLPT_LEVELS.map(level => {
                  const lvlCount = allLessonsBase.filter(l => l.level === level).length;
                  const isSelected = level === selectedLevel;
                  return (
                    <button
                      key={level}
                      onClick={() => { setSelectedLevel(level); setSelectedTopic("All Topics"); }}
                      className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                        isSelected
                          ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-md"
                          : "bg-card/70 dark:bg-white/4.5 backdrop-blur-sm border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/80 hover:shadow-sm dark:hover:bg-white/8 dark:hover:border-indigo-300/20"
                      }`}
                    >
                      <span className="font-display font-bold text-sm leading-none">{level}</span>
                      <span className={`text-[10px] leading-none ${isSelected ? "text-white/70" : "text-muted-foreground/70 dark:text-indigo-300/60"}`}>
                        {lvlCount} lessons
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search + Topics dropdown */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search */}
                <div className="flex-1 relative flex">
                  <input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        setAppliedSearch(searchInput.trim());
                      }
                    }}
                    placeholder="Search vocabulary…"
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-card/70 dark:bg-white/5.5 backdrop-blur-sm border border-border/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 dark:focus:ring-cyan-300/30 dark:focus:border-cyan-300/30 shadow-sm dark:placeholder:text-slate-400 dark:text-slate-200 dark:focus:bg-white/[0.07] pr-20"
                  />
                  {searchInput && (
                    <button
                      onClick={() => { setSearchInput(""); setAppliedSearch(""); }}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setAppliedSearch(searchInput.trim())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>

                {/* Topics Dropdown */}
                {allTopics.length > 0 && (
                  <TopicsDropdown
                    topics={topicsInLevel}
                    selected={selectedTopic}
                    onSelect={setSelectedTopic}
                    isOpen={topicsOpen}
                    onToggle={() => setTopicsOpen(v => !v)}
                  />
                )}
              </div>

              {/* Lessons Grid */}
              {filteredLessons.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 dark:text-indigo-300/40 mb-3" />
                  <p className="text-muted-foreground dark:text-slate-300 font-semibold">No lessons found.</p>
                  <p className="text-sm text-muted-foreground/70 dark:text-slate-400 mt-1">Nothing to display at the moment. Try a different level or topic.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredLessons.map((lesson, i) => {
                    const wordCount = lesson.wordCount ?? lesson.word_count ?? 0;
                    const masteredCount = Object.entries(wordStatuses).filter(
                      ([k]) => k.startsWith(`${lesson.id}-`) && wordStatuses[k as string] === "mastered"
                    ).length;
                    const lessonPct = wordCount > 0 ? Math.round((masteredCount / wordCount) * 100) : 0;
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <button
                          onClick={() => openLesson(lesson.id)}
                          className="w-full text-left rounded-2xl bg-white/90 dark:bg-white/[0.035] backdrop-blur-sm border border-slate-200/70 dark:border-white/10 hover:shadow-xl hover:border-blue-300/50 dark:hover:border-cyan-300/25 hover:-translate-y-1 transition-all duration-200 overflow-hidden group flex flex-col shadow-sm"
                        >
                          {/* Clean Header */}
                          <div className={`relative px-4 pt-4 pb-3 bg-linear-to-br ${getLevelGradient(lesson.level ?? "N5")} ${getLevelGradientDark(lesson.level ?? "N5")}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/30 text-white backdrop-blur-sm dark:bg-slate-900/60 dark:text-white dark:border dark:border-white/20">{lesson.level}</span>
                                {lesson.topic && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white/80 backdrop-blur-sm border border-white/20 dark:bg-slate-900/50 dark:text-white/80 dark:border-white/15">{lesson.topic}</span>
                                )}
                              </div>
                              {lessonPct === 100 && (
                                <span className="w-6 h-6 rounded-full bg-green-100/70 dark:bg-green-900/50 backdrop-blur-sm flex items-center justify-center">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-300" />
                                </span>
                              )}
                            </div>
                            <h4 className="font-display font-black text-base leading-tight text-white mt-2 group-hover:text-white/90 transition">{lesson.title}</h4>
                            {/* Play overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 dark:group-hover:bg-white/20 transition">
                                <Play className="w-5 h-5 text-white fill-white" />
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 mt-auto space-y-2 bg-slate-50/80 dark:bg-white/2.5">
                            <p className="text-xs text-slate-600 dark:text-slate-300/85 line-clamp-2 min-h-[2.5rem] leading-relaxed">{lesson.description || "No description"}</p>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-indigo-200/70">
                              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {lesson.wordCount ?? lesson.word_count ?? 0} words</span>
                              {lesson.estimatedMinutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{lesson.estimatedMinutes}m</span>}
                            </div>
                            {(lesson as VocabularyLessonResponse).teacherName && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-indigo-200/50">
                                <User className="w-3 h-3" />
                                <span className="truncate">{(lesson as VocabularyLessonResponse).teacherName}</span>
                              </div>
                            )}

                            {/* Progress */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-linear-to-r from-blue-500 to-pink-500 transition-all"
                                  style={{ width: `${lessonPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold tabular-nums shrink-0 dark:text-indigo-200/70">{lessonPct}%</span>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
