import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  BookOpen,
  Layers,
  X,
  Save,
  ChevronDown,
  BookText,
  Tag,
  Volume2,
  Loader2,
  Globe,
  User,
  Star,
  Users,
  Cpu,
} from "lucide-react";
import {
  teacherVocabularyApi,
  type VocabularyLessonResponse,
  type VocabularyWordResponse,
  type VocabularyLessonDetailResponse,
  type VocabularyLessonCreateRequest,
} from "@/lib/api/teacherVocabulary";
import { ApiError, isApiError } from "@/lib/api/client";
import { TopicCombobox } from "@/components/TopicCombobox";

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];
const PAGE_SIZE = 9;

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

// Maps VocabularyLessonDetailResponse (with words) to VocabularyLessonResponse (list display)
type LessonDisplay = VocabularyLessonResponse & { _words?: VocabularyWordResponse[] };

// Extract lesson number from title like "Bài 1: Chào hỏi" → 1
function extractLessonNumber(title?: string): number {
  if (!title) return Infinity;
  const match = title.match(/Bài\s*\.?\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : Infinity;
}

// Extract lesson number from title like "Bài 1: Chào hỏi" → "Bài 1"
function getLessonLabel(title?: string): string {
  if (!title) return "Bài";
  const match = title.match(/^(Bài\s*\.?\s*)(\d+)/i);
  if (match) {
    return `Bài ${match[2]}`;
  }
  const numMatch = title.match(/^(\d+)/);
  if (numMatch) {
    return `Bài ${numMatch[1]}`;
  }
  return title;
}

// Get subtitle from title like "Bài 1: Chào hỏi" → "Chào hỏi"
function getLessonSubtitle(title?: string): string | null {
  if (!title) return null;
  const match = title.match(/^[^:：]+[：:]\s*(.+)$/);
  return match ? match[1].trim() : null;
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

export const Route = createFileRoute("/teacher/vocabulary")({
  component: VocabularyManagementPage,
});

// ─── Pagination component ────────────────────────────────────────────────────
function PaginationUI({
  current,
  total,
  onPage,
}: {
  current: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {Math.min((current - 1) * PAGE_SIZE + 1, total)}
        </span>
        {" – "}
        <span className="font-semibold text-foreground">
          {Math.min(current * PAGE_SIZE, total)}
        </span>
        {" of "}
        <span className="font-semibold text-foreground">{total}</span>
        {" lessons"}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          ‹
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
              p === current
                ? "bg-gradient-hero text-white shadow"
                : "border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(current + 1)}
          disabled={current === pages}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Topic filter dropdown ───────────────────────────────────────────────
function TopicFilter({
  topics,
  selected,
  onSelect,
}: {
  topics: string[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(false);
    if (open) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
          selected !== "All"
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-muted-foreground hover:text-foreground"
        }`}
      >
        <Tag className="w-4 h-4" />
        {selected === "All" ? "All Topics" : selected}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 py-2 max-h-72 overflow-y-auto"
          >
            <button
              onClick={() => {
                onSelect("All");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition ${
                selected === "All"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All Topics
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  onSelect(topic);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition ${
                  selected === topic
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Tag className="w-3.5 h-3.5 opacity-60" />
                {topic}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────
function VocabularyManagementPage() {
  const [lessons, setLessons] = useState<VocabularyLessonResponse[]>([]);
  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [viewingLesson, setViewingLesson] = useState<VocabularyLessonDetailResponse | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState("N5");
  const [newTopic, setNewTopic] = useState("General");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublished, setNewIsPublished] = useState(false);
  const [editing, setEditing] = useState<VocabularyLessonResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState("N5");
  const [editTopic, setEditTopic] = useState("");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [deleting, setDeleting] = useState<VocabularyLessonResponse | null>(null);

  // Inline vocabulary form state (Add modal)
  const [lessonWords, setLessonWords] = useState<VocabularyWordResponse[]>([]);
  const lessonWordsRef = useRef<VocabularyWordResponse[]>([]);
  const [showWordForm, setShowWordForm] = useState(false);
  const [editingWordIdx, setEditingWordIdx] = useState<number | null>(null);
  const [tempTopics, setTempTopics] = useState<string[]>([]);
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [wordForm, setWordForm] = useState({
    word: "",
    furigana: "",
    romaji: "",
    meaning: "",
    examples: "",
  });

  // Edit modal vocabulary state
  const [editTempWords, setEditTempWords] = useState<VocabularyWordResponse[]>([]);
  const [editShowWordForm, setEditShowWordForm] = useState(false);
  const [editEditingIdx, setEditEditingIdx] = useState<number | null>(null);
  const [editTempTopics, setEditTempTopics] = useState<string[]>([]);
  const [editShowCustomTopic, setEditShowCustomTopic] = useState(false);
  const [editCustomTopicInput, setEditCustomTopicInput] = useState("");
  const [editDeletedWordIds, setEditDeletedWordIds] = useState<Set<string>>(new Set());
  const [editWordForm, setEditWordForm] = useState({
    word: "",
    furigana: "",
    romaji: "",
    meaning: "",
    examples: "",
  });

  // Create lesson loading
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit lesson loading
  const [editingSave, setEditingSave] = useState(false);
  const [editSaveError, setEditSaveError] = useState<string | null>(null);

  // Delete loading
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  // Load lessons from backend with server-side filters
  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lessonParams = {
        level: levelFilter !== "All" ? levelFilter : undefined,
        topic: topicFilter !== "All" ? topicFilter : undefined,
        search: search.trim() || undefined,
      };

      const [allData, filteredData] = await Promise.all([
        teacherVocabularyApi.getTeacherLessons(),
        teacherVocabularyApi.getTeacherLessons(lessonParams),
      ]);

      const allSorted = sortLessonsByNumber(allData);
      const filteredSorted = sortLessonsByNumber(filteredData);

      const topics = Array.from(
        new Set(allSorted.map((l) => l.topic).filter(Boolean) as string[]),
      ).sort();
      setAllTopics(topics);
      setLessons(filteredSorted);
    } catch (err) {
      setError(isApiError(err) ? err.message : "Failed to load lessons. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [levelFilter, topicFilter, search]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const totalWords = lessons.reduce((s, l) => s + (l.wordCount ?? 0), 0);

  // Group lessons by ownership after filtering
  const myLessons = lessons.filter((l) => l.ownedByMe === true);
  const otherLessons = lessons.filter(
    (l) =>
      l.ownedByMe === false &&
      l.teacherName &&
      l.teacherName !== "MIDORI" &&
      l.teacherName !== "System",
  );
  const systemLessons = lessons.filter(
    (l) =>
      l.ownedByMe === false &&
      (!l.teacherName || l.teacherName === "MIDORI" || l.teacherName === "System"),
  );

  // Pagination per group
  const [myPage, setMyPage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);
  const [systemPage, setSystemPage] = useState(1);
  const GROUP_PAGE_SIZE = 12;

  const paginatedMy = myLessons.slice((myPage - 1) * GROUP_PAGE_SIZE, myPage * GROUP_PAGE_SIZE);
  const paginatedOther = otherLessons.slice(
    (otherPage - 1) * GROUP_PAGE_SIZE,
    otherPage * GROUP_PAGE_SIZE,
  );
  const paginatedSystem = systemLessons.slice(
    (systemPage - 1) * GROUP_PAGE_SIZE,
    systemPage * GROUP_PAGE_SIZE,
  );

  // Reset pages when filter/search changes
  useEffect(() => {
    setPage(1);
    setMyPage(1);
    setOtherPage(1);
    setSystemPage(1);
  }, [levelFilter, topicFilter, search]);

  // Helper to render lesson card
  const renderLessonCard = (lesson: VocabularyLessonResponse, index: number, groupOffset = 0) => (
    <motion.div
      key={lesson.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden"
    >
      <div className="h-1.5 bg-gradient-hero w-full" />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center">
              {index + 1 + groupOffset}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-display font-black text-sm text-foreground leading-tight truncate">
                {lesson.title}
              </h3>
              {lesson.level && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(lesson.level)}`}
                >
                  {lesson.level}
                </span>
              )}
              {lesson.isPublished ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                  Published
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookText className="w-3 h-3" />
                {lesson.wordCount ?? lesson.word_count ?? 0} words
              </span>
              {lesson.topic && (
                <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold">
                  {lesson.topic}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70 mt-1">
              <User className="w-3 h-3" />
              <span className="truncate">Teacher: {lesson.teacherName ?? "MIDORI"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openViewLesson(lesson);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          {lesson.ownedByMe && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(lesson);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500 text-xs font-bold transition-all"
                title="Edit lesson"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleting(lesson);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 text-xs font-bold transition-all"
                title="Delete lesson"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderGroupSection = (
    title: string,
    icon: React.ReactNode,
    lessons: VocabularyLessonResponse[],
    paginated: VocabularyLessonResponse[],
    page: number,
    setPage: (p: number) => void,
    badge: string,
    emptyText: string,
  ) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${badge}`}>
          {lessons.length}
        </span>
      </div>
      {lessons.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground/50 text-sm italic">{emptyText}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((lesson, i) =>
              renderLessonCard(lesson, i, (page - 1) * GROUP_PAGE_SIZE),
            )}
          </div>
          {Math.ceil(lessons.length / GROUP_PAGE_SIZE) > 1 && (
            <div className="flex justify-center mt-4">
              <PaginationUI current={page} total={lessons.length} onPage={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );

  const handleSearch = (val: string) => {
    setSearch(val);
  };
  const handleLevel = (val: string) => {
    setLevelFilter(val);
  };
  const handleTopic = (val: string) => {
    setTopicFilter(val);
  };

  const levelBadge = (l: string) => {
    const map: Record<string, string> = {
      N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      N4: "bg-green-50 text-green-500 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-800",
      N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
      N1: "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-300 border-red-200 dark:border-red-800",
    };
    return map[l] ?? "bg-slate-50 text-slate-500 border-slate-200";
  };

  // Open view modal — fetch lesson detail (with words) from backend
  const openViewLesson = async (lesson: VocabularyLessonResponse) => {
    setViewingLesson((prev) =>
      prev?.id === lesson.id ? prev : ({ ...lesson, words: [] } as VocabularyLessonDetailResponse),
    );
    setViewLoading(true);
    setViewError(null);
    try {
      const detail = await teacherVocabularyApi.getTeacherLessonDetail(lesson.id);
      setViewingLesson(detail);
    } catch (err) {
      setViewError(isApiError(err) ? err.message : "Failed to load lesson details.");
      setViewingLesson((prev) =>
        prev?.id === lesson.id
          ? prev
          : ({ ...lesson, words: [] } as VocabularyLessonDetailResponse),
      );
    } finally {
      setViewLoading(false);
    }
  };

  const [editDetailLoading, setEditDetailLoading] = useState(false);
  const [editDetailError, setEditDetailError] = useState<string | null>(null);

  const openEdit = async (l: VocabularyLessonResponse) => {
    setEditing(l);
    setEditName(l.title ?? "");
    setEditLevel(l.level ?? "N5");
    setEditTopic(l.topic ?? "");
    setEditIsPublished(l.isPublished ?? false);
    setEditTempTopics([]);
    setEditDeletedWordIds(new Set());
    setEditShowWordForm(false);
    setEditEditingIdx(null);
    setEditWordForm({ word: "", furigana: "", romaji: "", meaning: "", examples: "" });
    setEditSaveError(null);
    setEditDetailError(null);
    setEditDetailLoading(true);

    try {
      const detail = await teacherVocabularyApi.getTeacherLessonDetail(l.id);
      setEditTempWords(detail.words || []);
      setEditing(detail);
      setEditName(detail.title ?? l.title ?? "");
      setEditLevel(detail.level ?? l.level ?? "N5");
      setEditTopic(detail.topic ?? l.topic ?? "");
      setEditIsPublished(detail.isPublished ?? l.isPublished ?? false);
    } catch (err) {
      setEditDetailError(isApiError(err) ? err.message : "Failed to load lesson details.");
      setEditTempWords([]);
    } finally {
      setEditDetailLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing || !editName.trim()) return;
    setEditingSave(true);
    setEditSaveError(null);
    try {
      // Delete removed words
      if (editDeletedWordIds.size > 0) {
        await Promise.all(
          Array.from(editDeletedWordIds).map((wordId) => teacherVocabularyApi.deleteWord(wordId)),
        );
      }

      await teacherVocabularyApi.updateLesson(editing.id, {
        title: editName.trim(),
        level: editLevel,
        topic: editTopic || undefined,
        isPublished: editIsPublished,
      });
      setEditing(null);
      setEditDeletedWordIds(new Set());
      await fetchLessons();
    } catch (err) {
      setEditSaveError(isApiError(err) ? err.message : "Failed to update lesson.");
    } finally {
      setEditingSave(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingInProgress(true);
    try {
      await teacherVocabularyApi.deleteLesson(deleting.id);
      setDeleting(null);
      await fetchLessons();
    } catch (err) {
      setDeleting(null);
    } finally {
      setDeletingInProgress(false);
    }
  };

  const handleAddWord = () => {
    const hasWord = wordForm.word.trim();
    const hasFurigana = wordForm.furigana.trim();
    const hasRomaji = wordForm.romaji.trim();
    const hasMeaning = wordForm.meaning.trim();
    const hasExamples = wordForm.examples.trim();

    // Accept any language — Vietnamese, Japanese, English, etc.
    if (!hasWord && !hasFurigana && !hasRomaji && !hasMeaning && !hasExamples) return;

    const newWord: VocabularyWordResponse = {
      id:
        editingWordIdx !== null
          ? (lessonWordsRef.current[editingWordIdx]?.id ?? `temp-${Date.now()}`)
          : `temp-${Date.now()}`,
      lessonId: "",
      word: hasWord
        ? wordForm.word.trim()
        : hasFurigana
          ? wordForm.furigana.trim()
          : hasRomaji
            ? wordForm.romaji.trim()
            : "",
      furigana: hasFurigana ? wordForm.furigana.trim() : undefined,
      romaji: hasRomaji ? wordForm.romaji.trim() : undefined,
      meaning: hasMeaning
        ? wordForm.meaning.trim()
        : hasWord
          ? wordForm.word.trim()
          : hasFurigana
            ? wordForm.furigana.trim()
            : hasRomaji
              ? wordForm.romaji.trim()
              : "",
      exampleJapanese: hasExamples ? wordForm.examples.trim() : undefined,
      exampleMeaning: undefined,
      audioUrl: undefined,
      displayOrder:
        editingWordIdx !== null ? editingWordIdx + 1 : lessonWordsRef.current.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLessonWords((prev) => {
      const next =
        editingWordIdx !== null
          ? prev.map((w, i) => (i === editingWordIdx ? newWord : w))
          : [...prev, newWord];
      lessonWordsRef.current = next;
      return next;
    });

    setShowWordForm(false);
    setEditingWordIdx(null);
    setWordForm({ word: "", furigana: "", romaji: "", meaning: "", examples: "" });
  };

  const handleCreateLesson = async () => {
    if (!newName.trim()) return;

    const pendingWordReady = wordForm.word.trim() && wordForm.meaning.trim();
    // Use ref to avoid stale state — lessonWordsRef.current is always in sync
    const baseWords = lessonWordsRef.current;
    const effectiveLessonWords = pendingWordReady
      ? [
          ...baseWords,
          {
            id: `temp-${Date.now()}`,
            lessonId: "",
            word: wordForm.word.trim(),
            furigana: wordForm.furigana.trim() || undefined,
            romaji: wordForm.romaji.trim() || undefined,
            meaning: wordForm.meaning.trim(),
            exampleJapanese: wordForm.examples.trim() || undefined,
            exampleMeaning: undefined,
            audioUrl: undefined,
            displayOrder: baseWords.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
      : baseWords;

    const payload = {
      title: newName.trim(),
      level: newLevel,
      topic: newTopic || undefined,
      description: newDescription.trim() || undefined,
      isPublished: newIsPublished,
      words: effectiveLessonWords.map((word, index) => ({
        japanese: word.word,
        reading: word.furigana ?? undefined,
        romaji: word.romaji ?? undefined,
        vietnamese: word.meaning,
        exampleJapanese: word.exampleJapanese ?? undefined,
        exampleVietnamese: word.exampleMeaning ?? undefined,
        audioUrl: word.audioUrl ?? undefined,
        displayOrder: index + 1,
      })),
    } satisfies VocabularyLessonCreateRequest;

    setCreating(true);
    setCreateError(null);
    try {
      await teacherVocabularyApi.createLesson(payload);

      // Reset form and close
      setNewName("");
      setNewLevel("N5");
      setNewTopic("");
      setNewDescription("");
      setNewIsPublished(false);
      setLessonWords([]);
      lessonWordsRef.current = [];
      setTempTopics([]);
      setShowWordForm(false);
      setEditingWordIdx(null);
      setWordForm({ word: "", furigana: "", romaji: "", meaning: "", examples: "" });
      setShowAdd(false);
      await fetchLessons();
    } catch (err) {
      setCreateError(isApiError(err) ? err.message : "Failed to create lesson.");
    } finally {
      setCreating(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <BookOpen className="w-10 h-10 text-primary animate-pulse" />
        <p className="text-foreground font-semibold text-sm">Loading vocabulary...</p>
        <p className="text-muted-foreground text-xs">
          Please wait while information is being prepared.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">
            Vocabulary Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lessons.length} lessons · {totalWords} words
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setLessonWords([]);
            lessonWordsRef.current = [];
            setShowWordForm(false);
            setEditingWordIdx(null);
            setWordForm({ word: "", furigana: "", romaji: "", meaning: "", examples: "" });
            setCreateError(null);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add lesson
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Lessons", value: lessons.length, icon: BookText, color: "text-blue-500" },
          { label: "Words", value: totalWords, icon: Layers, color: "text-green-500" },
          { label: "Levels", value: "N5 – N1", icon: Tag, color: "text-purple-500", noNum: true },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700 ${stat.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-display font-black text-xl leading-none ${stat.color}`}>
                    {stat.noNum ? stat.value : stat.value.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-64 max-w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search lessons..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Level pills */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {JLPT_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                levelFilter === lvl
                  ? "bg-gradient-hero text-white shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Topic filter */}
        {allTopics.length > 0 && (
          <TopicFilter topics={allTopics} selected={topicFilter} onSelect={handleTopic} />
        )}
      </div>

      {/* ── Loading / Error / Empty states ───────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-3 text-sm font-semibold">Loading lessons...</span>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-red-200 dark:border-red-800">
          <p className="font-semibold text-red-500 mb-2">{error}</p>
          <button onClick={fetchLessons} className="text-sm text-primary underline">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && lessons.length === 0 && (
        <div className="text-center py-20 text-muted-foreground rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-base">No lessons found.</p>
          <p className="text-sm mt-1">
            Nothing to display at the moment. Try adjusting your filters.
          </p>
          <button
            onClick={() => {
              setShowAdd(true);
              setLessonWords([]);
              lessonWordsRef.current = [];
              setShowWordForm(false);
              setEditingWordIdx(null);
              setWordForm({ word: "", furigana: "", romaji: "", meaning: "", examples: "" });
              setCreateError(null);
            }}
            className="mt-3 text-primary underline text-sm"
          >
            + Create your first lesson
          </button>
        </div>
      )}

      {/* ── Grouped lesson sections ────────────────────────────── */}
      {!loading && !error && lessons.length > 0 && (
        <>
          {/* My Lessons */}
          {renderGroupSection(
            "My Lessons",
            <Star className="w-4 h-4 text-amber-500" />,
            myLessons,
            paginatedMy,
            myPage,
            setMyPage,
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            "You haven't created any lessons yet.",
          )}

          {/* Other Teachers' Lessons */}
          {renderGroupSection(
            "Other Teachers' Lessons",
            <Users className="w-4 h-4 text-blue-500" />,
            otherLessons,
            paginatedOther,
            otherPage,
            setOtherPage,
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            "No lessons from other teachers.",
          )}

          {/* System Lessons */}
          {renderGroupSection(
            "System Lessons",
            <Cpu className="w-4 h-4 text-slate-400" />,
            systemLessons,
            paginatedSystem,
            systemPage,
            setSystemPage,
            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
            "No system lessons.",
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ADD LESSON MODAL — with inline vocabulary list
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAdd && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 760, maxHeight: "90vh" }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5 shrink-0">
                <h2 className="font-display font-black text-lg text-foreground">Add new lesson</h2>
                <button
                  onClick={() => setShowAdd(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-1">
                {createError && (
                  <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                    {createError}
                  </div>
                )}

                {/* ── Lesson Info ───────────────────────────────── */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Lesson title <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Lesson 4 — Numbers"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* ── JLPT Level ────────────────────────────────── */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    JLPT Level
                  </label>
                  <div className="flex gap-1">
                    {["N5", "N4", "N3", "N2", "N1"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setNewLevel(lvl)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          newLevel === lvl
                            ? "bg-gradient-hero text-white shadow"
                            : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Topic ──────────────────────────────── */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Topic
                  </label>
                  <TopicCombobox
                    value={newTopic}
                    onChange={setNewTopic}
                    options={[...allTopics, ...tempTopics].filter((t, i, a) => a.indexOf(t) === i)}
                    placeholder="Select topic..."
                  />
                </div>

                {/* ── Publish Toggle ───────────────────────────── */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Globe
                      className={`w-5 h-5 ${newIsPublished ? "text-green-500" : "text-muted-foreground"}`}
                    />
                    <div>
                      <div className="text-sm font-semibold text-foreground">Publish lesson</div>
                      <div className="text-xs text-muted-foreground">
                        {newIsPublished
                          ? "Students can see this lesson"
                          : "Only you can see this lesson"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewIsPublished((p) => !p)}
                    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-[3px] transition-colors overflow-hidden border ${
                      newIsPublished
                        ? "bg-green-500 border-green-400"
                        : "bg-slate-600 border-white/10"
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                        newIsPublished ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* ── Vocabulary List ────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Vocabulary list
                    </label>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {lessonWords.length} words
                    </span>
                  </div>

                  {/* Word form toggle */}
                  {!showWordForm ? (
                    <button
                      type="button"
                      onClick={() => setShowWordForm(true)}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add vocabulary
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {/* Form header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-bold text-foreground">
                          {editingWordIdx !== null ? "Edit word" : "Add new word"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowWordForm(false);
                            setEditingWordIdx(null);
                            setWordForm({
                              word: "",
                              furigana: "",
                              romaji: "",
                              meaning: "",
                              examples: "",
                            });
                          }}
                          className="text-muted-foreground hover:text-foreground transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Form fields */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                              Word <span className="text-red-400">*</span>
                            </label>
                            <input
                              value={wordForm.word}
                              onChange={(e) => setWordForm((f) => ({ ...f, word: e.target.value }))}
                              placeholder="環境"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                              Reading (Hiragana)
                            </label>
                            <input
                              value={wordForm.furigana}
                              onChange={(e) =>
                                setWordForm((f) => ({ ...f, furigana: e.target.value }))
                              }
                              placeholder="かんきょう"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                              ROMAJI
                            </label>
                            <input
                              value={wordForm.romaji}
                              onChange={(e) =>
                                setWordForm((f) => ({ ...f, romaji: e.target.value }))
                              }
                              placeholder="e.g. kankyou"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                              Meaning <span className="text-red-400">*</span>
                            </label>
                            <input
                              value={wordForm.meaning}
                              onChange={(e) =>
                                setWordForm((f) => ({ ...f, meaning: e.target.value }))
                              }
                              placeholder="e.g. Environment"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                              Example Japanese
                            </label>
                            <input
                              value={wordForm.examples}
                              onChange={(e) =>
                                setWordForm((f) => ({ ...f, examples: e.target.value }))
                              }
                              placeholder="環境の大切さを学んだ"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowWordForm(false);
                              setEditingWordIdx(null);
                              setWordForm({
                                word: "",
                                furigana: "",
                                romaji: "",
                                meaning: "",
                                examples: "",
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddWord}
                            disabled={
                              !wordForm.word.trim() &&
                              !wordForm.meaning.trim() &&
                              !wordForm.furigana.trim() &&
                              !wordForm.romaji.trim() &&
                              !wordForm.examples.trim()
                            }
                            className="flex-1 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition"
                          >
                            {editingWordIdx !== null ? "Update word" : "Add word"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Word cards list */}
                  {lessonWords.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {lessonWords.map((w, idx) => (
                        <motion.div
                          key={w.id || idx}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition group"
                        >
                          {/* Reorder handle */}
                          <div className="shrink-0 cursor-grab text-slate-300 dark:text-slate-600 group-hover:text-slate-400">
                            <Layers className="w-4 h-4" />
                          </div>

                          {/* Index */}
                          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                            {idx + 1}
                          </div>

                          {/* Word info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">{w.word}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakJapanese(w.furigana || w.word);
                                }}
                                title="Play pronunciation"
                                className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-500 flex items-center justify-center transition shrink-0"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              {w.furigana && (
                                <span className="text-xs text-sky-500">{w.furigana}</span>
                              )}
                              {w.romaji && (
                                <span className="text-xs text-muted-foreground italic">
                                  / {w.romaji}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">→</span>
                              <span className="text-xs font-semibold text-foreground">
                                {w.meaning}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingWordIdx(idx);
                                setWordForm({
                                  word: w.word,
                                  furigana: w.furigana ?? "",
                                  romaji: w.romaji ?? "",
                                  meaning: w.meaning,
                                  examples: w.exampleJapanese ?? "",
                                });
                                setShowWordForm(true);
                              }}
                              className="w-7 h-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center text-blue-400 hover:text-blue-600 transition"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setLessonWords((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-red-400 hover:text-red-500 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {lessonWords.length > 0
                    ? `${lessonWords.length} words will be saved`
                    : "No words added yet"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdd(false);
                      setLessonWords([]);
                      lessonWordsRef.current = [];
                      setShowWordForm(false);
                      setEditingWordIdx(null);
                      setWordForm({
                        word: "",
                        furigana: "",
                        romaji: "",
                        meaning: "",
                        examples: "",
                      });
                      setCreateError(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateLesson}
                    disabled={!newName.trim() || creating}
                    className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition flex items-center gap-2"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    {creating ? "Creating..." : "Create lesson"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          EDIT LESSON MODAL — with full vocabulary list
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editing && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 760, maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5 shrink-0">
                <h2 className="font-display font-black text-lg text-foreground">Edit lesson</h2>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-1">
                {/* Loading state */}
                {editDetailLoading && (
                  <div className="flex items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="ml-3 text-sm font-semibold">Loading lesson details...</span>
                  </div>
                )}

                {/* Error state */}
                {!editDetailLoading && editDetailError && (
                  <div className="text-center py-12">
                    <p className="font-semibold text-red-500 mb-2">{editDetailError}</p>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* Main content */}
                {!editDetailLoading && !editDetailError && (
                  <div className="space-y-5">
                    {editSaveError && (
                      <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                        {editSaveError}
                      </div>
                    )}

                    {/* ── Lesson Info ──────────────────────────────── */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                        Lesson title
                      </label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                        Level JLPT
                      </label>
                      <div className="flex gap-1">
                        {["N5", "N4", "N3", "N2", "N1"].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setEditLevel(lvl)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              editLevel === lvl
                                ? "bg-gradient-hero text-white shadow"
                                : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Topic ──────────────────────────────── */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                        Topic
                      </label>
                      <TopicCombobox
                        value={editTopic}
                        onChange={setEditTopic}
                        options={[...allTopics, ...editTempTopics].filter(
                          (t, i, a) => a.indexOf(t) === i,
                        )}
                        placeholder="Select topic..."
                      />
                    </div>

                    {/* ── Publish Toggle ───────────────────────────── */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <Globe
                          className={`w-5 h-5 shrink-0 ${editIsPublished ? "text-green-500" : "text-slate-400"}`}
                        />
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            Publish lesson
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {editIsPublished
                              ? "Students can see this lesson"
                              : "Only you can see this lesson"}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditIsPublished((p) => !p)}
                        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-[3px] transition-colors overflow-hidden border ${
                          editIsPublished
                            ? "bg-green-500 border-green-400"
                            : "bg-slate-600 border-white/10"
                        }`}
                      >
                        <span
                          className={`block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                            editIsPublished ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* ── Vocabulary List ──────────────────────────── */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Vocabulary list
                        </label>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {editTempWords.length} words
                        </span>
                      </div>

                      {/* Word form toggle */}
                      {!editShowWordForm ? (
                        <button
                          type="button"
                          onClick={() => setEditShowWordForm(true)}
                          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add vocabulary
                        </button>
                      ) : (
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-3">
                          {/* Form header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-sm font-bold text-foreground">
                              {editEditingIdx !== null ? "Edit word" : "Add new word"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditShowWordForm(false);
                                setEditEditingIdx(null);
                                setEditWordForm({
                                  word: "",
                                  furigana: "",
                                  romaji: "",
                                  meaning: "",
                                  examples: "",
                                });
                              }}
                              className="text-muted-foreground hover:text-foreground transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Form fields */}
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                                  Word <span className="text-red-400">*</span>
                                </label>
                                <input
                                  value={editWordForm.word}
                                  onChange={(e) =>
                                    setEditWordForm((f) => ({ ...f, word: e.target.value }))
                                  }
                                  placeholder="環境"
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                                  Reading (Hiragana)
                                </label>
                                <input
                                  value={editWordForm.furigana}
                                  onChange={(e) =>
                                    setEditWordForm((f) => ({ ...f, furigana: e.target.value }))
                                  }
                                  placeholder="かんきょう"
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                                  ROMAJI
                                </label>
                                <input
                                  value={editWordForm.romaji}
                                  onChange={(e) =>
                                    setEditWordForm((f) => ({ ...f, romaji: e.target.value }))
                                  }
                                  placeholder="e.g. kankyou"
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                                  Meaning <span className="text-red-400">*</span>
                                </label>
                                <input
                                  value={editWordForm.meaning}
                                  onChange={(e) =>
                                    setEditWordForm((f) => ({ ...f, meaning: e.target.value }))
                                  }
                                  placeholder="e.g. Environment"
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                                  Example Japanese
                                </label>
                                <input
                                  value={editWordForm.examples}
                                  onChange={(e) =>
                                    setEditWordForm((f) => ({ ...f, examples: e.target.value }))
                                  }
                                  placeholder="環境の大切さを学んだ"
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditShowWordForm(false);
                                  setEditEditingIdx(null);
                                  setEditWordForm({
                                    word: "",
                                    furigana: "",
                                    romaji: "",
                                    meaning: "",
                                    examples: "",
                                  });
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!editWordForm.word.trim() || !editWordForm.meaning.trim())
                                    return;
                                  const w: VocabularyWordResponse = {
                                    id:
                                      editEditingIdx !== null
                                        ? (editTempWords[editEditingIdx]?.id ?? "")
                                        : `temp-${Date.now()}`,
                                    lessonId: editing?.id ?? "",
                                    word: editWordForm.word.trim(),
                                    furigana: editWordForm.furigana.trim() || undefined,
                                    romaji: editWordForm.romaji.trim() || undefined,
                                    meaning: editWordForm.meaning.trim(),
                                    exampleJapanese: editWordForm.examples.trim() || undefined,
                                    displayOrder:
                                      editEditingIdx !== null
                                        ? (editTempWords[editEditingIdx]?.displayOrder ?? 0)
                                        : editTempWords.length,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                  };
                                  if (editEditingIdx !== null) {
                                    const updated = [...editTempWords];
                                    updated[editEditingIdx] = w;
                                    setEditTempWords(updated);
                                  } else {
                                    setEditTempWords((prev) => [...prev, w]);
                                  }
                                  setEditShowWordForm(false);
                                  setEditEditingIdx(null);
                                  setEditWordForm({
                                    word: "",
                                    furigana: "",
                                    romaji: "",
                                    meaning: "",
                                    examples: "",
                                  });
                                }}
                                disabled={!editWordForm.word.trim() || !editWordForm.meaning.trim()}
                                className="flex-1 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition"
                              >
                                {editEditingIdx !== null ? "Update word" : "Add word"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Word cards list */}
                      {editTempWords.length > 0 ? (
                        <div className="space-y-2">
                          {editTempWords.map((w, idx) => (
                            <motion.div
                              key={w.id || idx}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition group"
                            >
                              {/* Reorder */}
                              <div className="shrink-0 cursor-grab text-slate-300 dark:text-slate-600 group-hover:text-slate-400">
                                <Layers className="w-4 h-4" />
                              </div>

                              {/* Index */}
                              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                                {idx + 1}
                              </div>

                              {/* Word info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-foreground">
                                    {w.word}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      speakJapanese(w.furigana || w.word);
                                    }}
                                    title="Play pronunciation"
                                    className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-500 flex items-center justify-center transition shrink-0"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                  {w.furigana && (
                                    <span className="text-xs text-sky-500">{w.furigana}</span>
                                  )}
                                  {w.romaji && (
                                    <span className="text-xs text-muted-foreground italic">
                                      / {w.romaji}
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <span className="text-xs font-semibold text-foreground">
                                    {w.meaning}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditEditingIdx(idx);
                                    setEditWordForm({
                                      word: w.word,
                                      furigana: w.furigana ?? "",
                                      romaji: w.romaji ?? "",
                                      meaning: w.meaning,
                                      examples: w.exampleJapanese ?? "",
                                    });
                                    setEditShowWordForm(true);
                                  }}
                                  className="w-7 h-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center text-blue-400 hover:text-blue-600 transition"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const wordId = editTempWords[idx]?.id;
                                    if (wordId && !wordId.startsWith("temp-")) {
                                      setEditDeletedWordIds((prev) => new Set([...prev, wordId]));
                                    }
                                    setEditTempWords((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-red-400 hover:text-red-500 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                          <p className="text-xs text-muted-foreground">
                            No words in this lesson yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {editTempWords.length > 0 ? `${editTempWords.length} words` : "No words"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setEditTempWords([]);
                      setEditDeletedWordIds(new Set());
                      setEditShowWordForm(false);
                      setEditEditingIdx(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={!editName.trim() || editingSave}
                    className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition flex items-center gap-2"
                  >
                    {editingSave && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Save className="w-4 h-4" />
                    Save changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          VIEW VOCABULARY LIST MODAL
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewingLesson !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingLesson(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 800, maxHeight: "90vh" }}
            >
              {/* Loading */}
              {viewLoading && (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-3 text-sm font-semibold">Loading...</span>
                </div>
              )}

              {/* Error */}
              {!viewLoading && viewError && (
                <div className="text-center py-16">
                  <p className="font-semibold text-red-500 mb-2">{viewError}</p>
                  <button
                    onClick={() => openViewLesson(viewingLesson)}
                    className="text-sm text-primary underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Content */}
              {!viewLoading && !viewError && viewingLesson && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5 shrink-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-display font-black text-lg text-foreground">
                          {viewingLesson.title}
                        </h2>
                        {viewingLesson.level && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${levelBadge(viewingLesson.level)}`}
                          >
                            {viewingLesson.level}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {viewingLesson.words?.length ?? 0} words · Created{" "}
                        {viewingLesson.createdAt
                          ? new Date(viewingLesson.createdAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {viewingLesson.ownedByMe && (
                        <button
                          onClick={() => {
                            setViewingLesson(null);
                            openEdit(viewingLesson);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500 text-xs font-bold transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => setViewingLesson(null)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable word list */}
                  <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                    {viewingLesson.words?.length === 0 ? (
                      <div className="py-20 text-center">
                        <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/20" />
                        <p className="font-semibold text-base text-foreground mb-1">No words yet</p>
                        <p className="text-sm text-muted-foreground">
                          This lesson has no vocabulary added yet.
                        </p>
                        {viewingLesson.ownedByMe && (
                          <button
                            onClick={() => {
                              setViewingLesson(null);
                              openEdit(viewingLesson);
                            }}
                            className="mt-4 px-4 py-2 rounded-xl bg-gradient-hero text-white text-xs font-bold shadow hover:opacity-90 transition"
                          >
                            + Add vocabulary
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {viewingLesson.words?.map((w, i) => (
                          <motion.div
                            key={w.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025 }}
                            className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden hover:border-primary/30 transition group"
                          >
                            {/* Top accent line */}
                            <div className="h-1 bg-gradient-hero w-full" />

                            <div className="p-4">
                              <div className="flex items-start gap-4">
                                {/* Number */}
                                <div className="w-8 h-8 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </div>

                                {/* Word info */}
                                <div className="flex-1 min-w-0">
                                  {/* Word + Reading */}
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="font-display font-black text-xl text-foreground">
                                      {w.word}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakJapanese(w.furigana || w.word);
                                      }}
                                      title="Play pronunciation"
                                      className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-500 flex items-center justify-center transition shrink-0"
                                    >
                                      <Volume2 className="w-4 h-4" />
                                    </button>
                                    {w.furigana && (
                                      <span className="text-base text-sky-500 font-medium">
                                        {w.furigana}
                                      </span>
                                    )}
                                    {w.romaji && (
                                      <span className="text-xs text-muted-foreground italic">
                                        {w.romaji}
                                      </span>
                                    )}
                                  </div>

                                  {/* Meaning */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-semibold text-foreground">
                                      {w.meaning}
                                    </span>
                                  </div>

                                  {/* Example */}
                                  {w.exampleJapanese && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      <span className="font-semibold text-foreground/60">
                                        Example:
                                      </span>{" "}
                                      {w.exampleJapanese}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {viewingLesson.words?.length > 0
                          ? `${viewingLesson.words.length} words`
                          : "0 words"}
                      </span>
                      <button
                        onClick={() => setViewingLesson(null)}
                        className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          DELETE LESSON MODAL
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleting && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleting(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl text-center border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: 420 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/20 grid place-items-center mx-auto mb-3">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="font-display font-black text-lg mb-1">Delete lesson?</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Lesson <strong className="text-foreground">{deleting.title}</strong> will be
                permanently deleted.
              </p>
              <p className="text-xs text-red-400 mb-5">
                This will also delete {deleting.wordCount ?? deleting.word_count ?? 0} words inside.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleting(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  disabled={deletingInProgress}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingInProgress}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingInProgress && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deletingInProgress ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
