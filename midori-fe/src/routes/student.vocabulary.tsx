import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Star, Clock, ChevronRight, CheckCircle, X,
  Volume2, VolumeX, Play, ChevronLeft, Trophy,
  Bookmark, BookmarkCheck, ArrowRight, Zap, ChevronDown, Tag,
  Loader2,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import {
  studentVocabularyApi,
  type VocabularyLessonResponse,
  type VocabularyLessonDetailResponse,
} from "@/lib/api/studentVocabulary";
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

const FILTER_TABS = ["Tất cả", "Đã thuộc", "Chưa thuộc", "Yêu thích"] as const;

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
    N4: "from-violet-300 via-purple-400 to-fuchsia-400",
    N3: "from-pink-300 via-rose-400 to-red-300",
    N2: "from-amber-300 via-orange-400 to-yellow-300",
    N1: "from-red-300 via-pink-400 to-fuchsia-400",
  };
  return g[level] ?? "from-blue-400 to-purple-400";
}

function getLevelGradientDark(level: string): string {
  const g: Record<string, string> = {
    N5: "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80",
    N4: "dark:from-violet-700/90 dark:via-purple-500/75 dark:to-fuchsia-600/80",
    N3: "dark:from-pink-700/90 dark:via-rose-500/75 dark:to-red-600/80",
    N2: "dark:from-amber-700/90 dark:via-orange-500/75 dark:to-yellow-600/80",
    N1: "dark:from-red-700/90 dark:via-pink-500/75 dark:to-fuchsia-600/80",
  };
  return g[level] ?? "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80";
}

function getLevelBadge(level: string): string {
  const c: Record<string, string> = {
    N5: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
    N4: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300",
    N3: "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300",
    N2: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300",
    N1: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300",
  };
  return c[level] ?? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300";
}

function getTopicColor(topic: string): string {
  const c: Record<string, string> = {
    Family: "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-800",
    School: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Food: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    Travel: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    Shopping: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    Work: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    "Daily Life": "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800",
    "Business Japanese": "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    Nature: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  };
  return c[topic] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";
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
            ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md"
            : "bg-white/70 dark:bg-white/[0.06] backdrop-blur-sm border border-white/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/80 hover:text-foreground dark:hover:bg-white/[0.10] dark:hover:border-white/15"
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
            className="absolute top-full left-0 mt-2 w-64 sm:w-72 z-50"
          >
            <div className="bg-white/95 dark:bg-indigo-950/90 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-indigo-400/20 shadow-xl shadow-black/10 p-2">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground dark:text-indigo-200/70">
                  <Tag className="w-3.5 h-3.5" />
                  Topics
                </div>
                <span className="text-[10px] text-muted-foreground dark:text-indigo-200/60">{topics.length - 1} topics</span>
              </div>

              {/* Topic Pills */}
              <div className="space-y-1">
                {topics.map(topic => {
                  const isSelected = topic === selected;
                  return (
                    <button
                      key={topic}
                      onClick={() => handleSelect(topic)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.07] text-slate-700 dark:text-indigo-200/80"
                      }`}
                    >
                      <span className="text-base">{getTopicIcon(topic)}</span>
                      <span className="flex-1 text-left">{topic}</span>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
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
  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedLevel, setSelectedLevel] = useState<string>("N5");
  const [selectedTopic, setSelectedTopic] = useState<string>("All Topics");
  const [search, setSearch] = useState("");
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<typeof FILTER_TABS[number]>("Tất cả");
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const WORDS_PER_PAGE = 10;

  // Word status: "new" | "learning" | "mastered"
  const [wordStatuses, setWordStatuses] = useState<Record<string, WordStatus>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  // Lesson detail state
  const [lessonDetail, setLessonDetail] = useState<VocabularyLessonDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Fetch published lessons from API
  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allData = await studentVocabularyApi.getPublishedLessons();
      setLessons(sortLessonsByNumber(allData));
      
      // Extract all unique topics
      const topics = Array.from(new Set(allData.map(l => l.topic).filter(Boolean) as string[])).sort();
      setAllTopics(topics);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load lessons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Fetch lesson detail when opening a lesson
  const openLesson = async (lessonId: string) => {
    setActiveLesson(lessonId);
    setDetailLoading(true);
    setDetailError(null);
    setLessonDetail(null);
    setFilterTab("Tất cả");
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

  // Filter lessons by level, topic, and search
  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      if (selectedLevel !== "All" && l.level !== selectedLevel) return false;
      if (selectedTopic !== "All Topics" && l.topic !== selectedTopic) return false;
      if (search) {
        const q = search.toLowerCase();
        return l.title.toLowerCase().includes(q) ||
          (l.description?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });
  }, [lessons, selectedLevel, selectedTopic, search]);

  const topicsInLevel = useMemo(() => {
    const levelFiltered = lessons.filter(l => selectedLevel === "All" || l.level === selectedLevel);
    const topics = new Set(levelFiltered.map(l => l.topic).filter(Boolean));
    return ["All Topics", ...Array.from(topics)];
  }, [lessons, selectedLevel]);

  const totalWordsAll = lessons.reduce((sum, l) => sum + (l.wordCount ?? 0), 0);
  const totalLearned = Object.values(wordStatuses).filter(s => s === "mastered").length;
  const totalLearning = Object.values(wordStatuses).filter(s => s === "learning").length;
  const totalFavorites = favorites.size;

  const getWordStatus = (wordKey: string): WordStatus => wordStatuses[wordKey] ?? "new";
  const getWordStatusDot = (wordKey: string): string => {
    const s = getWordStatus(wordKey);
    if (s === "mastered") return "bg-green-400";
    if (s === "learning") return "bg-amber-400";
    return "bg-slate-300";
  };

  const setWordStatus = (wordKey: string, status: WordStatus) => {
    setWordStatuses(prev => {
      const next = { ...prev };
      if (prev[wordKey] === status) {
        delete next[wordKey];
      } else {
        next[wordKey] = status;
      }
      return next;
    });
  };

  const toggleFavoriteWord = (wordKey: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(wordKey)) next.delete(wordKey);
      else next.add(wordKey);
      return next;
    });
  };

  // ── Lesson Detail View ────────────────────────────────────────────────
  if (activeLesson && lessonDetail) {
    const words = lessonDetail.words ?? [];
    const lessonProgress = words.filter(w => wordStatuses[`${activeLesson}-${w.word}`] === "mastered").length;
    const progressPct = words.length > 0 ? Math.round((lessonProgress / words.length) * 100) : 0;

    const filteredWords = words.filter(w => {
      const key = `${activeLesson}-${w.word}`;
      const status = getWordStatus(key);
      const isFav = favorites.has(key);
      if (filterTab === "Đã thuộc") return status === "mastered";
      if (filterTab === "Chưa thuộc") return status === "new";
      if (filterTab === "Yêu thích") return isFav;
      return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredWords.length / WORDS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedWords = filteredWords.slice((safePage - 1) * WORDS_PER_PAGE, safePage * WORDS_PER_PAGE);

    return (
      <div className="dark:bg-gradient-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950">
        <SakuraBg count={14} />
        <div className="relative z-10">
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Lesson Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveLesson(null); setLessonDetail(null); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card/70 dark:bg-white/[0.06] backdrop-blur-sm border border-border/50 dark:border-white/10 text-xs font-semibold hover:bg-card dark:hover:bg-white/[0.09] transition shadow-sm"
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
              {completedLessons.has(activeLesson) && (
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
            <div className="w-24 h-2 rounded-full bg-white/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-pink-400 transition-all"
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
            <span>{words.filter(w => wordStatuses[`${activeLesson}-${w.word}`] === "learning").length} learning</span>
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
                      ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-sm"
                      : "bg-card/60 dark:bg-white/[0.045] backdrop-blur-sm border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/[0.07] dark:hover:border-white/15"
                  }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Vocabulary Cards */}
        {paginatedWords.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50 dark:text-indigo-300/40 mb-2" />
            <p className="text-sm text-muted-foreground dark:text-slate-300">No words in this category</p>
          </div>
        ) : (
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
                  <div className="flex items-center">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 self-start mt-1 mr-3 ${getWordStatusDot(wordKey)}`} />

                    {/* Japanese + Furigana */}
                    <div className="flex-shrink-0 w-36 mr-3">
                      <div className="font-display text-xl font-black text-foreground dark:text-white leading-tight">{word.word}</div>
                      <div className="text-xs text-primary/80 dark:text-cyan-400 font-medium leading-tight">{word.furigana || word.romaji}</div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px self-stretch shrink-0 rounded-full bg-gradient-to-b from-transparent via-indigo-400/40 to-transparent dark:bg-gradient-to-b dark:from-transparent dark:via-indigo-400/50 dark:to-transparent mr-4" />

                    {/* Meaning */}
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="text-sm font-semibold text-foreground dark:text-slate-100 leading-snug">
                        {word.meaning}
                      </div>
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => setWordStatus(wordKey, "mastered")}
                        title="Đã thuộc"
                        className={`p-1.5 rounded-lg transition-all ${
                          status === "mastered"
                            ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
                            : "text-muted-foreground dark:text-indigo-300/60 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-500"
                        }`}
                      >
                        <CheckCircle className={`w-4 h-4 ${status === "mastered" ? "fill-green-400" : ""}`} />
                      </button>
                      <button
                        onClick={() => setWordStatus(wordKey, "new")}
                        title="Chưa thuộc"
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
                        className="p-1.5 rounded-lg transition-all text-muted-foreground dark:text-indigo-300/60 hover:bg-amber-50 dark:hover:bg-amber-900/20 group/icon"
                      >
                        {isFav ? (
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <Star className="w-4 h-4 dark:group-hover/icon:text-amber-400 transition-colors" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); speakJapanese(word.furigana || word.word); }}
                        title="Play pronunciation"
                        className="p-1.5 rounded-lg text-muted-foreground dark:text-indigo-300/60 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded — Example Sentence */}
                  {(word.exampleJapanese || word.exampleMeaning) && (
                    <div className="mt-2 pt-2 border-t border-border/60 dark:border-indigo-400/15">
                      {word.exampleJapanese && (
                        <div className="text-xs text-muted-foreground dark:text-slate-300/80 italic pl-3" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                          {word.exampleJapanese}
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
                <button
                  onClick={() => setCompletedLessons(prev => { const n = new Set(prev); n.add(activeLesson ?? ""); return n; })}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-400 to-pink-400 text-white text-sm font-bold shadow-lg shadow-purple-200/30 hover:opacity-90 transition"
                >
                  <Trophy className="w-4 h-4" /> Complete Lesson
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-card/70 dark:bg-white/[0.06] border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      page === currentPage
                        ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md"
                        : "bg-card/70 dark:bg-white/[0.06] border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/[0.09]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-card/70 dark:bg-white/[0.06] border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
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

  // ── Browse Lessons View ───────────────────────────────────────────────
  return (
    <div className="dark:bg-gradient-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
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
              ].map(stat => (
                <div key={stat.label} className="text-center px-3 py-2 rounded-xl bg-card/70 dark:bg-indigo-950/50 backdrop-blur-sm border border-border/50 dark:border-indigo-400/20 shadow-sm">
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
              <p className="text-red-500 mb-2 font-semibold">{error}</p>
              <button onClick={fetchLessons} className="text-sm text-primary underline">Try again</button>
            </div>
          )}

          {/* Content after loading */}
          {!loading && !error && (
            <>
              {/* JLPT Level Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {JLPT_LEVELS.map(level => {
                  const lvlLessons = lessons.filter(l => l.level === level);
                  const lvlTotal = lvlLessons.reduce((s, l) => s + (l.wordCount ?? 0), 0);
                  const lvlLearned = lvlLessons.reduce((s, l) =>
                    s + l.words?.filter((w: any) => wordStatuses[`${l.id}-${w.word}`] === "mastered").length ?? 0, 0);
                  const pct = lvlTotal > 0 ? Math.round((lvlLearned / lvlTotal) * 100) : 0;
                  const isSelected = level === selectedLevel;
                  return (
                    <button
                      key={level}
                      onClick={() => { setSelectedLevel(level); setSelectedTopic("All Topics"); }}
                      className={`relative flex-shrink-0 flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-lg shadow-blue-200/40 dark:shadow-none"
                          : "bg-card/70 dark:bg-white/[0.045] backdrop-blur-sm border border-border/50 dark:border-white/10 hover:shadow-md dark:hover:bg-white/[0.08] dark:hover:border-indigo-300/20"
                      }`}
                    >
                      <span className="font-display font-black text-base">{level}</span>
                      <div className={`w-14 h-1 rounded-full overflow-hidden ${isSelected ? "bg-white/30" : "bg-slate-100 dark:bg-slate-700"}`}>
                        <div className={`h-full rounded-full transition-all ${isSelected ? "bg-white" : "bg-pink-300"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted-foreground dark:text-indigo-300/70"}`}>{pct}%</span>
                    </button>
                  );
                })}
              </div>

              {/* Search + Topics dropdown */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search */}
                <div className="flex-1 relative">
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search vocabulary…"
                    className="w-full px-4 py-2.5 rounded-2xl bg-card/70 dark:bg-white/[0.055] backdrop-blur-sm border border-border/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 dark:focus:ring-cyan-300/30 dark:focus:border-cyan-300/30 shadow-sm dark:placeholder:text-slate-400 dark:text-slate-200 dark:focus:bg-white/[0.07]"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
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
                  <p className="text-muted-foreground dark:text-slate-300 font-medium">No lessons found</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLessons.map((lesson, i) => {
                    const lessonLearned = 0;
                    const lessonLearning = 0;
                    const lessonPct = 0;
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <button
                          onClick={() => openLesson(lesson.id)}
                          className="w-full text-left rounded-2xl bg-card/80 dark:bg-white/[0.035] backdrop-blur-sm border border-border/50 dark:border-white/10 hover:shadow-xl hover:border-blue-300/50 dark:hover:border-cyan-300/25 hover:-translate-y-1 transition-all duration-200 overflow-hidden group"
                        >
                          {/* Clean Header */}
                          <div className={`relative px-4 pt-4 pb-3 bg-gradient-to-br ${getLevelGradient(lesson.level ?? "N5")} ${getLevelGradientDark(lesson.level ?? "N5")}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/30 text-white backdrop-blur-sm dark:bg-slate-900/60 dark:text-white dark:border dark:border-white/20">{lesson.level}</span>
                                {lesson.topic && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white/80 backdrop-blur-sm border border-white/20 dark:bg-slate-900/50 dark:text-white/80 dark:border-white/15">{lesson.topic}</span>
                                )}
                              </div>
                              {completedLessons.has(lesson.id) && (
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
                          <div className="p-4 space-y-2 dark:bg-white/[0.025]">
                            <p className="text-xs text-muted-foreground dark:text-slate-300/85 line-clamp-2 leading-relaxed">{lesson.description || "No description"}</p>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground dark:text-indigo-200/70">
                              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {lesson.wordCount ?? 0} words</span>
                              {lesson.estimatedMinutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{lesson.estimatedMinutes}m</span>}
                            </div>

                            {/* Progress */}
                            <div className="h-1.5 rounded-full bg-white/10 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-pink-400 transition-all"
                                style={{ width: `${lessonPct}%` }}
                              />
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
