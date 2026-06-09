import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit3, Trash2, ArrowLeft, Search, X, Save,
  BookOpen, Tag, Eye, Download, Loader2,
  BookText, Layers, Volume2,
} from "lucide-react";
import {
  teacherVocabularyApi,
  type VocabularyLessonDetailResponse,
  type VocabularyWordResponse,
  type VocabularyWordCreateRequest,
  type VocabularyWordUpdateRequest,
} from "@/lib/api/teacherVocabulary";
import { ApiError } from "@/lib/api/client";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const TOPICS = ["General", "Nature", "Life", "Work", "Social", "Emotions", "Travel", "Food", "Health", "Technology", "Education", "Business", "Culture", "Sports", "Art", "Science", "Politics", "Entertainment"];
const WORD_TYPES = ["noun", "verb", "adjective", "adverb", "expression"];
const PAGE_SIZE = 10;

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

export const Route = createFileRoute("/teacher/vocabulary/$lessonId")({
  component: VocabularyLessonDetailPage,
});

// ─── Pagination ────────────────────────────────────────────────────────────
function PaginationUI({ current, total, onPage }: { current: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">{Math.min((current - 1) * PAGE_SIZE + 1, total)}</span>
        {" – "}
        <span className="font-semibold text-foreground">{Math.min(current * PAGE_SIZE, total)}</span>
        {" of "}
        <span className="font-semibold text-foreground">{total}</span>
        {" words"}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          ‹
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
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

// ─── Word Modal ───────────────────────────────────────────────────────────
interface WordModalProps {
  title: string;
  word: Partial<VocabularyWordResponse>;
  onChange: (w: Partial<VocabularyWordResponse>) => void;
  onSave: () => void;
  onClose: () => void;
  saveLabel: string;
  saving?: boolean;
  error?: string | null;
}

function WordModal({ title, word, onChange, onSave, onClose, saveLabel, saving, error }: WordModalProps) {
  const set = <K extends keyof VocabularyWordResponse>(key: K, val: VocabularyWordResponse[K]) =>
    onChange({ ...word, [key]: val });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4"
        style={{ maxWidth: 640 }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-lg text-foreground">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
              Word (Kanji/Hiragana) <span className="text-red-400">*</span>
            </label>
            <input
              value={word.word ?? ""}
              onChange={e => set("word", e.target.value)}
              autoFocus
              placeholder="環境"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
              Furigana
            </label>
            <input
              value={word.furigana ?? ""}
              onChange={e => set("furigana", e.target.value)}
              placeholder="かんきょう"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">Romaji</label>
            <input
              value={word.romaji ?? ""}
              onChange={e => set("romaji", e.target.value)}
              placeholder="kankyou"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
              Meaning <span className="text-red-400">*</span>
            </label>
            <input
              value={word.meaning ?? ""}
              onChange={e => set("meaning", e.target.value)}
              placeholder="e.g. Environment"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">Level</label>
            <select
              value={word.level ?? "N5"}
              onChange={e => set("level", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              {JLPT_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">Topic</label>
            <select
              value={word.level ?? "General"}
              onChange={e => set("level", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              {TOPICS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">Example (Japanese)</label>
            <input
              value={word.exampleJapanese ?? ""}
              onChange={e => set("exampleJapanese", e.target.value)}
              placeholder="e.g. 環境に問題がある。"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">Example (Meaning)</label>
            <input
              value={word.exampleMeaning ?? ""}
              onChange={e => set("exampleMeaning", e.target.value)}
              placeholder="e.g. There are problems with the environment."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-40">
            Cancel
          </button>
          <button onClick={onSave}
            disabled={!word.word?.trim() || !word.meaning?.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow flex items-center justify-center gap-2 disabled:opacity-40 transition">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : saveLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────
function VocabularyLessonDetailPage() {
  const params = Route.useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<VocabularyLessonDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [words, setWords] = useState<VocabularyWordResponse[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "alpha" | "level">("default");
  const [filterTopic, setFilterTopic] = useState("All");
  const [page, setPage] = useState(1);

  // Modal states
  const [addNew, setAddNew] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWordResponse | null>(null);
  const [deleteWord, setDeleteWord] = useState<VocabularyWordResponse | null>(null);
  const [viewWord, setViewWord] = useState<VocabularyWordResponse | null>(null);

  // Word form state (partial — we only send non-empty fields to backend)
  const makeNewWord = (): Partial<VocabularyWordResponse> => ({
    word: "",
    furigana: "",
    romaji: "",
    meaning: "",
    level: lesson?.level ?? "N5",
  });
  const [newWord, setNewWord] = useState<Partial<VocabularyWordResponse>>(makeNewWord());
  const [editForm, setEditForm] = useState<Partial<VocabularyWordResponse> | null>(null);

  // Loading states for word operations
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Fetch lesson detail from backend
  const fetchLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherVocabularyApi.getTeacherLessonDetail(params.lessonId);
      setLesson(data);
      setWords(data.words ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load lesson.");
    } finally {
      setLoading(false);
    }
  }, [params.lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  // Sync words when lesson changes
  useEffect(() => {
    if (lesson) setWords(lesson.words ?? []);
  }, [lesson]);

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

  // Filter + sort
  const filtered = [...words]
    .filter(w => {
      const matchSearch = !search ||
        w.word?.toLowerCase().includes(search.toLowerCase()) ||
        w.meaning?.toLowerCase().includes(search.toLowerCase()) ||
        w.furigana?.toLowerCase().includes(search.toLowerCase());
      const matchTopic = filterTopic === "All";
      return matchSearch && matchTopic;
    })
    .sort((a, b) => {
      if (sortBy === "alpha") return (a.word ?? "").localeCompare(b.word ?? "");
      if (sortBy === "level") {
        const order = ["N5", "N4", "N3", "N2", "N1"];
        return (order.indexOf(a.level ?? "") - order.indexOf(b.level ?? ""));
      }
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Topics from current words
  const wordTopics = Array.from(new Set(words.map(w => w.level).filter(Boolean) as string[])).sort();

  // Handlers
  const handleAddWord = async () => {
    if (!newWord.word?.trim() || !newWord.meaning?.trim()) return;
    setAddSaving(true);
    setAddError(null);
    try {
      const payload: VocabularyWordCreateRequest = {
        word: newWord.word!.trim(),
        furigana: newWord.furigana?.trim() || undefined,
        romaji: newWord.romaji?.trim() || undefined,
        meaning: newWord.meaning!.trim(),
        exampleJapanese: newWord.exampleJapanese?.trim() || undefined,
        exampleMeaning: newWord.exampleMeaning?.trim() || undefined,
      };
      await teacherVocabularyApi.addWord(params.lessonId, payload);
      setNewWord(makeNewWord());
      setAddNew(false);
      await fetchLesson(); // refetch to get updated words
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Failed to add word.");
    } finally {
      setAddSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingWord || !editForm?.word?.trim() || !editForm?.meaning?.trim()) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const payload: VocabularyWordUpdateRequest = {
        word: editForm.word!.trim(),
        furigana: editForm.furigana?.trim() || undefined,
        romaji: editForm.romaji?.trim() || undefined,
        meaning: editForm.meaning!.trim(),
        exampleJapanese: editForm.exampleJapanese?.trim() || undefined,
        exampleMeaning: editForm.exampleMeaning?.trim() || undefined,
      };
      await teacherVocabularyApi.updateWord(editingWord.id, payload);
      setEditingWord(null);
      await fetchLesson();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Failed to update word.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteWord = async () => {
    if (!deleteWord) return;
    setDeleteSaving(true);
    try {
      await teacherVocabularyApi.deleteWord(deleteWord.id);
      setDeleteWord(null);
      await fetchLesson();
    } catch {
      setDeleteWord(null); // close on error
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleTopicFilter = (val: string) => { setFilterTopic(val); setPage(1); };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading lesson...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-muted-foreground">
        <BookOpen className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-lg font-bold text-red-500">{error ?? "Lesson not found"}</p>
        <Link to="/teacher/vocabulary" className="mt-3 text-primary underline text-sm">
          ← Back to lesson list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/teacher/vocabulary" as any)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-primary/40 transition-all shadow-sm flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-black text-foreground truncate">
              {lesson.title}
            </h1>
            {lesson.level && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${levelBadge(lesson.level)}`}>
                {lesson.level}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {words.length} words · Created {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString() : "—"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold transition-all shadow-sm opacity-50 cursor-not-allowed" title="Coming soon">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold transition-all shadow-sm opacity-50 cursor-not-allowed" title="Coming soon">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setAddNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add word
          </button>
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total words", value: words.length, icon: BookText, color: "text-blue-500" },
          { label: "Topics", value: wordTopics.length, icon: Tag, color: "text-purple-500" },
          { label: "N5–N3", value: words.filter(w => ["N5","N4","N3"].includes(w.level ?? "")).length, icon: Layers, color: "text-green-500" },
          { label: "N2–N1", value: words.filter(w => ["N2","N1"].includes(w.level ?? "")).length, icon: Layers, color: "text-orange-500" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-display font-black text-xl leading-none ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-64 max-w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search word, meaning, kana..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none"
        >
          <option value="default">Default</option>
          <option value="alpha">A → Z</option>
          <option value="level">By level</option>
        </select>
      </div>

      {/* ── Empty states ─────────────────────────────────────── */}
      {filtered.length === 0 && !search && filterTopic === "All" && (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-muted-foreground font-semibold text-base mb-1">No vocabulary yet</p>
          <p className="text-sm text-muted-foreground/60 mb-5">Click "Add word" to get started</p>
          <button
            onClick={() => setAddNew(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition">
            <Plus className="w-4 h-4 inline mr-1" /> Add your first word
          </button>
        </div>
      )}

      {filtered.length === 0 && (search || filterTopic !== "All") && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-semibold">No matching words found</p>
          <button onClick={() => { setSearch(""); setFilterTopic("All"); setPage(1); }}
            className="mt-2 text-primary underline text-sm">Clear filters</button>
        </div>
      )}

      {/* ── Word list table ───────────────────────────────────── */}
      {paginated.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
          {/* Table header */}
          <div className="grid grid-cols-[1.5fr_1.5fr_2fr_1.5fr_100px_120px] gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            <div>Japanese</div>
            <div>Reading</div>
            <div>Meaning</div>
            <div>Tags</div>
            <div className="text-center">Level</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {paginated.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[1.5fr_1.5fr_2fr_1.5fr_100px_120px] gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition items-center"
              >
                {/* Japanese */}
                <div>
                  <div className="font-display font-black text-lg text-foreground">{w.word ?? "—"}</div>
                  {w.romaji && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">{w.romaji}</div>
                  )}
                </div>

                {/* Reading */}
                <div>
                  <div className="text-sm text-sky-500 dark:text-sky-400 font-medium">{w.furigana ?? "—"}</div>
                </div>

                {/* Meaning */}
                <div>
                  <div className="text-sm font-semibold text-foreground">{w.meaning ?? "—"}</div>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex flex-wrap gap-1">
                    {w.level && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${levelBadge(w.level)}`}>
                        {w.level}
                      </span>
                    )}
                  </div>
                </div>

                {/* Level */}
                <div className="text-center">
                  {w.level && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(w.level)}`}>
                      {w.level}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="text-right flex justify-end gap-1.5">
                  <button
                    onClick={() => setViewWord(w)}
                    title="View details"
                    className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setEditForm(w); setEditingWord(w); setEditError(null); }}
                    title="Edit"
                    className="w-8 h-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center text-blue-500 hover:text-blue-600 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteWord(w)}
                    title="Delete"
                    className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-red-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          <div className="px-5 pb-5">
            <PaginationUI current={page} total={filtered.length} onPage={setPage} />
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}

      {/* ADD WORD */}
      <AnimatePresence>
        {addNew && (
          <WordModal
            title="Add new word"
            word={newWord}
            onChange={setNewWord}
            onSave={handleAddWord}
            onClose={() => { setAddNew(false); setAddError(null); }}
            saveLabel="Add word"
            saving={addSaving}
            error={addError}
          />
        )}
      </AnimatePresence>

      {/* EDIT WORD */}
      <AnimatePresence>
        {editingWord && editForm && (
          <WordModal
            title="Edit word"
            word={editForm}
            onChange={setEditForm}
            onSave={handleSaveEdit}
            onClose={() => { setEditingWord(null); setEditError(null); }}
            saveLabel="Save changes"
            saving={editSaving}
            error={editError}
          />
        )}
      </AnimatePresence>

      {/* VIEW WORD DETAIL */}
      <AnimatePresence>
        {viewWord && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewWord(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5"
              style={{ maxWidth: 560 }}>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-lg text-foreground">Vocabulary details</h2>
                <button onClick={() => setViewWord(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Word display */}
              <div className="text-center p-5 rounded-2xl bg-gradient-hero/5 border border-primary/20">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="font-display font-black text-4xl text-foreground">{viewWord.word ?? "—"}</div>
                  <button onClick={(e) => { e.stopPropagation(); speakJapanese(viewWord.furigana || viewWord.word || ""); }}
                    title="Play pronunciation"
                    className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-500 flex items-center justify-center transition flex-shrink-0">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-lg text-sky-500 font-medium">{viewWord.furigana ?? "—"}</div>
                {viewWord.romaji && (
                  <div className="text-sm text-muted-foreground mt-1">{viewWord.romaji}</div>
                )}
              </div>

              {/* Meaning */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Meaning</div>
                <div className="text-base font-semibold text-foreground">{viewWord.meaning ?? "—"}</div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                {viewWord.level && (
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${levelBadge(viewWord.level)}`}>
                    {viewWord.level}
                  </span>
                )}
              </div>

              {/* Example */}
              {viewWord.exampleJapanese && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Example</div>
                  <div className="text-sm text-foreground">{viewWord.exampleJapanese}</div>
                  {viewWord.exampleMeaning && (
                    <div className="text-sm text-muted-foreground mt-1">{viewWord.exampleMeaning}</div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setViewWord(null); setEditForm(viewWord); setEditingWord(viewWord); setEditError(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition"
                >
                  <Edit3 className="w-4 h-4" /> Edit word
                </button>
                <button
                  onClick={() => setViewWord(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteWord && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteWord(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl text-center border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: 420 }}>
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/20 grid place-items-center mx-auto mb-3">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="font-display font-black text-lg mb-1">Delete word?</h2>
              <p className="text-sm text-muted-foreground mb-1">
                Delete <strong className="text-foreground">{deleteWord.word}</strong> ({deleteWord.meaning})?
              </p>
              <p className="text-xs text-red-400 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteWord(null)}
                  disabled={deleteSaving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-40">
                  Cancel
                </button>
                <button onClick={handleDeleteWord}
                  disabled={deleteSaving}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleteSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deleteSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
