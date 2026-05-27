import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit3, Trash2, Eye,
  BookOpen, Layers, X, Save, ChevronDown,
  BookText, Tag
} from "lucide-react";
import { lessonsData, type Lesson, type VocabWord } from "../data/lessons";

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];
const VOCAB_TOPICS = ["General", "Daily Life", "School", "Food", "Shopping", "Travel", "Family", "Business", "Nature", "Work", "Social", "Emotions", "Health", "Technology", "Education", "Culture", "Sports", "Art", "Science", "Politics", "Entertainment"];
const STORAGE_KEY = "midori_vocab_lessons";
const PAGE_SIZE = 9;

function loadLessons(): Lesson[] {
  if (typeof window === "undefined") return lessonsData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Lesson[];
  } catch {}
  return lessonsData;
}

function getAllTopics(lessons: Lesson[]): string[] {
  const topics = new Set<string>();
  lessons.forEach(l => l.words.forEach(w => { if (w.topic) topics.add(w.topic); }));
  return Array.from(topics).sort();
}

export const Route = createFileRoute("/teacher/vocabulary")({ component: VocabularyManagementPage });

// ─── Pagination component ────────────────────────────────────────────────
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
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
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
              onClick={() => { onSelect("All"); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition ${
                selected === "All"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All Topics
            </button>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => { onSelect(topic); setOpen(false); }}
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
  const [lessons, setLessons] = useState<Lesson[]>(loadLessons);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [page, setPage] = useState(1);
  const allTopics = getAllTopics(lessons);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState("N5");
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState("N5");
  const [deleting, setDeleting] = useState<Lesson | null>(null);

  // Inline vocabulary form state (Add modal)
  const [tempWords, setTempWords] = useState<VocabWord[]>([]);
  const [showWordForm, setShowWordForm] = useState(false);
  const [editingWordIdx, setEditingWordIdx] = useState<number | null>(null);
  const [tempTopics, setTempTopics] = useState<string[]>([]);
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [wordForm, setWordForm] = useState({
    word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: "N5", examples: "",
  });

  // Edit modal vocabulary state
  const [editTempWords, setEditTempWords] = useState<VocabWord[]>([]);
  const [editShowWordForm, setEditShowWordForm] = useState(false);
  const [editEditingIdx, setEditEditingIdx] = useState<number | null>(null);
  const [editTempTopics, setEditTempTopics] = useState<string[]>([]);
  const [editShowCustomTopic, setEditShowCustomTopic] = useState(false);
  const [editCustomTopicInput, setEditCustomTopicInput] = useState("");
  const [editWordForm, setEditWordForm] = useState({
    word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: "N5", examples: "",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  }, [lessons]);

  const totalWords = lessons.reduce((s, l) => s + l.words.length, 0);

  const filtered = lessons.filter(l => {
    const matchLevel = levelFilter === "All" || l.level === levelFilter;
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    const matchTopic =
      topicFilter === "All" ||
      l.words.some(w => w.topic === topicFilter);
    return matchLevel && matchSearch && matchTopic;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleLevel = (val: string) => { setLevelFilter(val); setPage(1); };
  const handleTopic = (val: string) => { setTopicFilter(val); setPage(1); };

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

  const openEdit = (l: Lesson) => {
    setEditing(l); setEditName(l.title); setEditLevel(l.level);
    setEditTempWords([...l.words]);
    setEditShowWordForm(false);
    setEditEditingIdx(null);
    setEditWordForm({ word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: l.level, examples: "" });
  };

  const handleSaveEdit = () => {
    if (!editing || !editName.trim()) return;
    setLessons(prev => prev.map(l =>
      l.id === editing.id
        ? { ...l, title: editName.trim(), level: editLevel, stats: { ...l.stats, total: editTempWords.length }, words: editTempWords }
        : l
    ));
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    setLessons(prev => prev.filter(l => l.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Vocabulary Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lessons.length} bài học · {totalWords} từ vựng
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition active:scale-95"
        >
          <Plus className="w-4 h-4" /> Thêm bài học
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Bài học", value: lessons.length, icon: BookText, color: "text-blue-500" },
          { label: "Từ vựng", value: totalWords, icon: Layers, color: "text-green-500" },
          { label: "Cấp độ", value: "N5 – N1", icon: Tag, color: "text-purple-500", noNum: true },
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
              onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm bài học..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
          </div>
        </div>

        {/* Level pills */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {JLPT_LEVELS.map(lvl => (
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

      {/* ── Lesson grid ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-base">Không tìm thấy bài học nào</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-primary underline text-sm">
            + Tạo bài học đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((lesson, i) => (
            <motion.div
              key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden"
              >
                {/* Card top accent */}
                <div className="h-1.5 bg-gradient-hero w-full" />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center">
                        {i + 1 + (page - 1) * PAGE_SIZE}
                  </div>
                    </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-black text-sm text-foreground leading-tight truncate">
                        {lesson.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(lesson.level)}`}>
                        {lesson.level}
                      </span>
                    </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookText className="w-3 h-3" />
                        {lesson.words.length} từ
                      </span>
                        {lesson.words.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold">
                            {Array.from(new Set(lesson.words.map(w => w.topic))).slice(0, 2).join(", ") || "—"}
                      </span>
                        )}
                    </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewingLesson(lesson); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem
                    </button>
                  <button
                      onClick={(e) => { e.stopPropagation(); openEdit(lesson); }}
                      className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500 text-xs font-bold transition-all"
                    title="Sửa bài học"
                  >
                      <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                      onClick={(e) => { e.stopPropagation(); setDeleting(lesson); }}
                      className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 text-xs font-bold transition-all"
                    title="Xóa bài học"
                  >
                      <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                </div>
            </motion.div>
          ))}
        </div>

          {/* Pagination */}
          <PaginationUI current={page} total={filtered.length} onPage={setPage} />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ADD LESSON MODAL — with inline vocabulary list
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 760, maxHeight: "90vh" }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <h2 className="font-display font-black text-lg text-foreground">Thêm bài học mới</h2>
                <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-1">
                {/* ── Lesson Info ───────────────────────────────── */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Tên bài học <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ví dụ: Bài 4 — Numbers (Số đếm)"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* ── JLPT Level ────────────────────────────────── */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Cấp độ JLPT
                  </label>
                  <div className="flex gap-1">
                    {["N5","N4","N3","N2","N1"].map(lvl => (
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

                {/* ── Vocabulary List ────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Danh sách từ vựng
                    </label>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {tempWords.length} từ
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
                      Thêm từ vựng
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {/* Form header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-bold text-foreground">
                          {editingWordIdx !== null ? "Sửa từ vựng" : "Thêm từ mới"}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setShowWordForm(false); setEditingWordIdx(null); setWordForm({ word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: newLevel, examples: "" }); }}
                          className="text-muted-foreground hover:text-foreground transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Form fields */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Từ <span className="text-red-400">*</span></label>
                            <input
                              value={wordForm.word}
                              onChange={e => setWordForm(f => ({ ...f, word: e.target.value }))}
                              placeholder="環境"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Đọc (Hiragana)</label>
                            <input
                              value={wordForm.furigana}
                              onChange={e => setWordForm(f => ({ ...f, furigana: e.target.value }))}
                              placeholder="かんきょう"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Romaji</label>
                            <input
                              value={wordForm.romaji}
                              onChange={e => setWordForm(f => ({ ...f, romaji: e.target.value }))}
                              placeholder="kankyou"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Nghĩa <span className="text-red-400">*</span></label>
                            <input
                              value={wordForm.meaning}
                              onChange={e => setWordForm(f => ({ ...f, meaning: e.target.value }))}
                              placeholder="Môi trường"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Topic</label>
                            <div className="flex gap-1.5">
                              <select
                                value={wordForm.topic}
                                onChange={e => setWordForm(f => ({ ...f, topic: e.target.value }))}
                                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                              >
                                {VOCAB_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <div className="relative" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setShowCustomTopic(o => !o)}
                                  className="px-2.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition border border-primary/30"
                                  title="Tạo topic mới"
                                >
                                  +
                                </button>
                                {showCustomTopic && (
                                  <div className="absolute right-0 top-full mt-2 z-10 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-3 space-y-2">
                                    <input
                                      value={customTopicInput}
                                      onChange={e => setCustomTopicInput(e.target.value)}
                                      placeholder="Tên topic..."
                                      className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs outline-none focus:ring-1 focus:ring-primary/40"
                                      autoFocus
                                      onKeyDown={e => {
                                        if (e.key === "Enter" && customTopicInput.trim()) {
                                          if (!VOCAB_TOPICS.includes(customTopicInput.trim()) && !tempTopics.includes(customTopicInput.trim())) {
                                            setTempTopics(prev => [...prev, customTopicInput.trim()]);
                                            setWordForm(f => ({ ...f, topic: customTopicInput.trim() }));
                                          }
                                          setShowCustomTopic(false);
                                          setCustomTopicInput("");
                                        }
                                      }}
                                    />
                                    {customTopicInput.trim() && !VOCAB_TOPICS.includes(customTopicInput.trim()) && !tempTopics.includes(customTopicInput.trim()) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTempTopics(prev => [...prev, customTopicInput.trim()]);
                                          setWordForm(f => ({ ...f, topic: customTopicInput.trim() }));
                                          setShowCustomTopic(false);
                                          setCustomTopicInput("");
                                        }}
                                        className="w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition"
                                      >
                                        Tạo "{customTopicInput.trim()}"
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Cấp độ</label>
                            <select
                              value={wordForm.level}
                              onChange={e => setWordForm(f => ({ ...f, level: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            >
                              {["N5","N4","N3","N2","N1"].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Ví dụ</label>
                          <input
                            value={wordForm.examples}
                            onChange={e => setWordForm(f => ({ ...f, examples: e.target.value }))}
                            placeholder=" жизнь окружающей среды..."
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => { setShowWordForm(false); setEditingWordIdx(null); setWordForm({ word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: newLevel, examples: "" }); }}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          >
                  Hủy
                </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!wordForm.word.trim() || !wordForm.meaning.trim()) return;
                              const w = {
                                id: editingWordIdx !== null ? tempWords[editingWordIdx].id : Date.now(),
                                word: wordForm.word.trim(),
                                furigana: wordForm.furigana.trim(),
                                romaji: wordForm.romaji.trim(),
                                meaning: wordForm.meaning.trim(),
                                topic: wordForm.topic,
                                level: wordForm.level,
                                type: "noun" as const,
                                audio: false,
                                examples: 0,
                                views: 0,
                                favorites: 0,
                              };
                              if (editingWordIdx !== null) {
                                const updated = [...tempWords];
                                updated[editingWordIdx] = w;
                                setTempWords(updated);
                              } else {
                                setTempWords(prev => [...prev, w]);
                              }
                              setShowWordForm(false);
                              setEditingWordIdx(null);
                              setWordForm({ word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: newLevel, examples: "" });
                            }}
                            disabled={!wordForm.word.trim() || !wordForm.meaning.trim()}
                            className="flex-1 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition"
                          >
                            {editingWordIdx !== null ? "Cập nhật từ" : "Thêm từ"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Word cards list */}
                  {tempWords.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {tempWords.map((w, idx) => (
                        <motion.div
                          key={w.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition group"
                        >
                          {/* Reorder handle */}
                          <div className="flex-shrink-0 cursor-grab text-slate-300 dark:text-slate-600 group-hover:text-slate-400">
                            <Layers className="w-4 h-4" />
                          </div>

                          {/* Index */}
                          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            {idx + 1}
                          </div>

                          {/* Word info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">{w.word}</span>
                              {w.furigana && (
                                <span className="text-xs text-sky-500">{w.furigana}</span>
                              )}
                              <span className="text-xs text-muted-foreground">→</span>
                              <span className="text-xs font-semibold text-foreground">{w.meaning}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${levelBadge(w.level)}`}>
                                {w.level}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-500 border border-purple-100 dark:border-purple-900">
                                {w.topic}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingWordIdx(idx);
                                setWordForm({
                                  word: w.word,
                                  furigana: w.furigana,
                                  romaji: w.romaji,
                                  meaning: w.meaning,
                                  topic: w.topic,
                                  level: w.level,
                                  examples: "",
                                });
                                setShowWordForm(true);
                              }}
                              className="w-7 h-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center text-blue-400 hover:text-blue-600 transition"
                              title="Sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTempWords(prev => prev.filter((_, i) => i !== idx))}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-red-400 hover:text-red-500 transition"
                              title="Xóa"
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
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {tempWords.length > 0 ? `${tempWords.length} từ vựng sẽ được lưu` : "Chưa có từ vựng"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAdd(false); setTempWords([]); setShowWordForm(false); setEditingWordIdx(null); setWordForm({ word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: "N5", examples: "" }); }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newName.trim()) return;
                      const lesson: Lesson = {
                        id: "l" + Date.now(),
                        title: newName.trim(),
                        level: newLevel,
                        createdAt: new Date().toISOString().split("T")[0],
                        stats: { total: tempWords.length, audio: 0 },
                        words: tempWords,
                      };
                      setLessons(prev => [...prev, lesson]);
                      setNewName(""); setNewLevel("N5");
                      setTempWords([]);
                      setShowWordForm(false);
                      setEditingWordIdx(null);
                      setWordForm({ word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: "N5", examples: "" });
                      setShowAdd(false);
                    }}
                    disabled={!newName.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition"
                  >
                  Tạo bài học
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditing(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 760, maxHeight: "90vh" }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <h2 className="font-display font-black text-lg text-foreground">Sửa bài học</h2>
                <button onClick={() => setEditing(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-1">
                {/* ── Lesson Info ──────────────────────────────── */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Tên bài học
                  </label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Cấp độ JLPT
                  </label>
                  <div className="flex gap-1">
                    {["N5","N4","N3","N2","N1"].map(lvl => (
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

                {/* ── Vocabulary List ──────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Danh sách từ vựng
                    </label>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {editTempWords.length} từ
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
                      Thêm từ vựng
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-3">
                      {/* Form header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-bold text-foreground">
                          {editEditingIdx !== null ? "Sửa từ vựng" : "Thêm từ mới"}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setEditShowWordForm(false); setEditEditingIdx(null); setEditWordForm({ word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: editLevel, examples: "" }); }}
                          className="text-muted-foreground hover:text-foreground transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Form fields */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Từ <span className="text-red-400">*</span></label>
                            <input
                              value={editWordForm.word}
                              onChange={e => setEditWordForm(f => ({ ...f, word: e.target.value }))}
                              placeholder="環境"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Hiragana</label>
                            <input
                              value={editWordForm.furigana}
                              onChange={e => setEditWordForm(f => ({ ...f, furigana: e.target.value }))}
                              placeholder="かんきょう"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Romaji</label>
                            <input
                              value={editWordForm.romaji}
                              onChange={e => setEditWordForm(f => ({ ...f, romaji: e.target.value }))}
                              placeholder="kankyou"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Nghĩa <span className="text-red-400">*</span></label>
                            <input
                              value={editWordForm.meaning}
                              onChange={e => setEditWordForm(f => ({ ...f, meaning: e.target.value }))}
                              placeholder="Môi trường"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Topic</label>
                            <div className="flex gap-1.5">
                              <select
                                value={editWordForm.topic}
                                onChange={e => setEditWordForm(f => ({ ...f, topic: e.target.value }))}
                                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                              >
                                {[...VOCAB_TOPICS, ...editTempTopics].map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <div className="relative" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setEditShowCustomTopic(o => !o)}
                                  className="px-2.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition border border-primary/30"
                                  title="Tạo topic mới"
                                >
                                  +
                                </button>
                                {editShowCustomTopic && (
                                  <div className="absolute right-0 top-full mt-2 z-10 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-3 space-y-2">
                                    <input
                                      value={editCustomTopicInput}
                                      onChange={e => setEditCustomTopicInput(e.target.value)}
                                      placeholder="Tên topic..."
                                      className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs outline-none focus:ring-1 focus:ring-primary/40"
                                      autoFocus
                                      onKeyDown={e => {
                                        if (e.key === "Enter" && editCustomTopicInput.trim()) {
                                          const t = editCustomTopicInput.trim();
                                          if (![...VOCAB_TOPICS, ...editTempTopics].includes(t)) {
                                            setEditTempTopics(prev => [...prev, t]);
                                            setEditWordForm(f => ({ ...f, topic: t }));
                                          }
                                          setEditShowCustomTopic(false);
                                          setEditCustomTopicInput("");
                                        }
                                      }}
                                    />
                                    {editCustomTopicInput.trim() && ![...VOCAB_TOPICS, ...editTempTopics].includes(editCustomTopicInput.trim()) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const t = editCustomTopicInput.trim();
                                          setEditTempTopics(prev => [...prev, t]);
                                          setEditWordForm(f => ({ ...f, topic: t }));
                                          setEditShowCustomTopic(false);
                                          setEditCustomTopicInput("");
                                        }}
                                        className="w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition"
                                      >
                                        Tạo "{editCustomTopicInput.trim()}"
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Cấp độ</label>
                            <select
                              value={editWordForm.level}
                              onChange={e => setEditWordForm(f => ({ ...f, level: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            >
                              {["N5","N4","N3","N2","N1"].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Ví dụ</label>
                          <input
                            value={editWordForm.examples}
                            onChange={e => setEditWordForm(f => ({ ...f, examples: e.target.value }))}
                            placeholder=" жизнь окружающей среды..."
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => { setEditShowWordForm(false); setEditEditingIdx(null); setEditWordForm({ word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: editLevel, examples: "" }); }}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          >
                  Hủy
                </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!editWordForm.word.trim() || !editWordForm.meaning.trim()) return;
                              const w = {
                                id: editEditingIdx !== null ? editTempWords[editEditingIdx].id : Date.now(),
                                word: editWordForm.word.trim(),
                                furigana: editWordForm.furigana.trim(),
                                romaji: editWordForm.romaji.trim(),
                                meaning: editWordForm.meaning.trim(),
                                topic: editWordForm.topic,
                                level: editWordForm.level,
                                type: "noun" as const,
                                audio: false,
                                examples: 0,
                                views: 0,
                                favorites: 0,
                              };
                              if (editEditingIdx !== null) {
                                const updated = [...editTempWords];
                                updated[editEditingIdx] = w;
                                setEditTempWords(updated);
                              } else {
                                setEditTempWords(prev => [...prev, w]);
                              }
                              setEditShowWordForm(false);
                              setEditEditingIdx(null);
                              setEditWordForm({ word: "", furigana: "", romaji: "", meaning: "", topic: "General", level: editLevel, examples: "" });
                            }}
                            disabled={!editWordForm.word.trim() || !editWordForm.meaning.trim()}
                            className="flex-1 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition"
                          >
                            {editEditingIdx !== null ? "Cập nhật từ" : "Thêm từ"}
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
                          key={w.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition group"
                        >
                          {/* Reorder */}
                          <div className="flex-shrink-0 cursor-grab text-slate-300 dark:text-slate-600 group-hover:text-slate-400">
                            <Layers className="w-4 h-4" />
                          </div>

                          {/* Index */}
                          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            {idx + 1}
                          </div>

                          {/* Word info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">{w.word}</span>
                              {w.furigana && <span className="text-xs text-sky-500">{w.furigana}</span>}
                              <span className="text-xs text-muted-foreground">→</span>
                              <span className="text-xs font-semibold text-foreground">{w.meaning}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${levelBadge(w.level)}`}>
                                {w.level}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-500 border border-purple-100 dark:border-purple-900">
                                {w.topic}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditEditingIdx(idx);
                                setEditWordForm({ word: w.word, furigana: w.furigana, romaji: w.romaji, meaning: w.meaning, topic: w.topic, level: w.level, examples: "" });
                                setEditShowWordForm(true);
                              }}
                              className="w-7 h-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center text-blue-400 hover:text-blue-600 transition"
                              title="Sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditTempWords(prev => prev.filter((_, i) => i !== idx))}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-red-400 hover:text-red-500 transition"
                              title="Xóa"
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
                      <p className="text-xs text-muted-foreground">Chưa có từ vựng nào trong bài này</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {editTempWords.length > 0 ? `${editTempWords.length} từ vựng` : "Chưa có từ vựng"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditing(null); setEditTempWords([]); setEditShowWordForm(false); setEditEditingIdx(null); }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={!editName.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition"
                  >
                    <Save className="w-4 h-4 inline mr-1" /> Lưu thay đổi
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
        {viewingLesson && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingLesson(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 800, maxHeight: "90vh" }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display font-black text-lg text-foreground">{viewingLesson.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${levelBadge(viewingLesson.level)}`}>
                      {viewingLesson.level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {viewingLesson.words.length} từ vựng · Tạo {viewingLesson.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setViewingLesson(null); openEdit(viewingLesson); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500 text-xs font-bold transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Sửa bài
                  </button>
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
                {viewingLesson.words.length === 0 ? (
                  <div className="py-20 text-center">
                    <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/20" />
                    <p className="font-semibold text-base text-foreground mb-1">Chưa có từ vựng nào</p>
                    <p className="text-sm text-muted-foreground">Bài học này chưa có từ vựng nào được thêm.</p>
                    <button
                      onClick={() => { setViewingLesson(null); openEdit(viewingLesson); }}
                      className="mt-4 px-4 py-2 rounded-xl bg-gradient-hero text-white text-xs font-bold shadow hover:opacity-90 transition"
                    >
                      + Thêm từ vựng
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {viewingLesson.words.map((w, i) => (
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
                            <div className="w-8 h-8 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>

                            {/* Word info */}
                            <div className="flex-1 min-w-0">
                              {/* Word + Reading */}
                              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                                <span className="font-display font-black text-xl text-foreground">{w.word}</span>
                                {w.furigana && (
                                  <span className="text-base text-sky-500 font-medium">{w.furigana}</span>
                                )}
                                {w.romaji && (
                                  <span className="text-xs text-muted-foreground italic">{w.romaji}</span>
                                )}
                              </div>

                              {/* Meaning */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-foreground">{w.meaning}</span>
                              </div>

                              {/* Tags */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(w.level)}`}>
                                  {w.level}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-500 border border-purple-100 dark:border-purple-900">
                                  {w.topic}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground capitalize">
                                  {w.type}
                                </span>
                              </div>

                              {/* Example */}
                              {w.examples && w.examples > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground/60">Ví dụ:</span>{" "}
                                  {w.examples} câu
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
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {viewingLesson.words.length > 0
                      ? `${viewingLesson.words.length} từ vựng`
                      : "0 từ vựng"}
                  </span>
                  <button
                    onClick={() => setViewingLesson(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          DELETE LESSON MODAL
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleting && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleting(null)}>
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
              <h2 className="font-display font-black text-lg mb-1">Xóa bài học?</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Bài <strong className="text-foreground">{deleting.title}</strong> sẽ bị xóa vĩnh viễn.
              </p>
              <p className="text-xs text-red-400 mb-5">
                Điều này cũng xóa {deleting.words.length} từ vựng bên trong.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleting(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                  Hủy
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition">
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
