import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit3, Trash2, Eye,
  GraduationCap, BookOpen, Mic, ArrowUpDown, CheckCircle,
  XCircle, Star, Clock, ArrowLeft, ChevronLeft, ChevronRight,
  BarChart3, Users, TrendingUp
} from "lucide-react";

const grammarLessons = [
  { id: 1, title: "〜ても", level: "N5", jlpt: "N5", meaning: "even if / even though", status: "published", views: 1240, completions: 890, rating: 4.8, updated: "2 days ago" },
  { id: 2, title: "〜ながら", level: "N4", jlpt: "N4", meaning: "while (doing)", status: "published", views: 980, completions: 720, rating: 4.6, updated: "5 days ago" },
  { id: 3, title: "〜なければならない", level: "N4", jlpt: "N4", meaning: "must / have to", status: "published", views: 1560, completions: 1100, rating: 4.9, updated: "1 week ago" },
  { id: 4, title: "〜そうだ (appearance)", level: "N3", jlpt: "N3", meaning: "it seems / it looks like", status: "pending", views: 340, completions: 0, rating: 0, updated: "3 days ago" },
  { id: 5, title: "〜にわたって", level: "N2", jlpt: "N2", meaning: "throughout / over (a period)", status: "published", views: 620, completions: 410, rating: 4.5, updated: "2 weeks ago" },
  { id: 6, title: "〜にもかかわらず", level: "N1", jlpt: "N1", meaning: "despite / in spite of", status: "draft", views: 0, completions: 0, rating: 0, updated: "Just now" },
  { id: 7, title: "〜つつある", level: "N1", jlpt: "N1", meaning: "in the process of (gradual change)", status: "pending", views: 120, completions: 0, rating: 0, updated: "1 day ago" },
  { id: 8, title: "〜かわり (に)", level: "N2", jlpt: "N2", meaning: "instead of / in place of", status: "published", views: 780, completions: 540, rating: 4.7, updated: "3 days ago" },
  { id: 9, title: "〜べきだ", level: "N4", jlpt: "N4", meaning: "should / ought to", status: "published", views: 890, completions: 610, rating: 4.6, updated: "4 days ago" },
  { id: 10, title: "〜つつある (2)", level: "N1", jlpt: "N1", meaning: "gradually changing", status: "draft", views: 0, completions: 0, rating: 0, updated: "1 day ago" },
  { id: 11, title: "〜ざるを得ない", level: "N2", jlpt: "N2", meaning: "cannot help but", status: "pending", views: 210, completions: 0, rating: 0, updated: "6 days ago" },
  { id: 12, title: "〜反面", level: "N3", jlpt: "N3", meaning: "on the other hand / whereas", status: "published", views: 430, completions: 280, rating: 4.4, updated: "1 week ago" },
];

const levelFilters = ["All", "N5", "N4", "N3", "N2", "N1"];
const statusFilters = ["All", "published", "pending", "draft"];

const levelColors: Record<string, string> = {
  N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30",
  N4: "bg-green-50 text-green-500 dark:bg-green-950/30",
  N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  N1: "bg-red-50 text-red-500 dark:bg-red-950/30",
};

const statusColors: Record<string, string> = {
  published: "bg-green-50 text-green-600 dark:bg-green-950/30",
  pending: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  draft: "bg-slate-50 text-slate-500 dark:bg-slate-800",
};

const PAGE_SIZE = 8;

export const Route = createFileRoute("/teacher/grammar")({ component: GrammarPage });

type ViewMode = "list" | "preview" | "edit";
type EditMode = "create" | "edit";

function Pagination({
  current,
  total,
  onPage,
}: {
  current: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  const pageNums = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{Math.min((current - 1) * PAGE_SIZE + 1, total)}</span>
        {" – "}
        <span className="font-semibold text-foreground">{Math.min(current * PAGE_SIZE, total)}</span>
        {" of "}
        <span className="font-semibold text-foreground">{total}</span>
        {" lessons"}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNums.map(p => (
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
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function GrammarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedLesson, setSelectedLesson] = useState<typeof grammarLessons[0] | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("create");
  const [page, setPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    level: "N5",
    meaning: "",
    formation: "",
    explanation: "",
    status: "draft",
    examples: [
      { japanese: "", english: "" },
      { japanese: "", english: "" },
      { japanese: "", english: "" },
    ],
  });

  const filtered = grammarLessons.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.meaning.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "All" || l.level === levelFilter;
    const matchStatus = statusFilter === "All" || l.status === statusFilter;
    return matchSearch && matchLevel && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleLevelFilter = (val: string) => {
    setLevelFilter(val);
    setPage(1);
  };

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const openPreview = (lesson: typeof grammarLessons[0]) => {
    setSelectedLesson(lesson);
    setViewMode("preview");
  };

  const openEdit = (lesson?: typeof grammarLessons[0]) => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        level: lesson.level,
        meaning: lesson.meaning,
        formation: "V (ます) + ながら",
        explanation: "This grammar pattern is used to express...",
        status: lesson.status,
        examples: [
          { japanese: "歩きながらも読書をしてた", english: "Reading while walking" },
          { japanese: "悪いと知りながらも嘘をついた", english: "Lied while knowing it was wrong" },
          { japanese: "忙し，更何况ながらも...", english: "Even though busy, still..." },
        ],
      });
      setEditMode("edit");
      setSelectedLesson(lesson);
    } else {
      setFormData({
        title: "",
        level: "N5",
        meaning: "",
        formation: "",
        explanation: "",
        status: "draft",
        examples: [
          { japanese: "", english: "" },
          { japanese: "", english: "" },
          { japanese: "", english: "" },
        ],
      });
      setEditMode("create");
      setSelectedLesson(null);
    }
    setViewMode("edit");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black">Grammar Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create, edit and manage your grammar lessons</p>
          </div>
          <button
            onClick={() => openEdit()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> New Lesson
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search grammar patterns..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {levelFilters.map(l => (
              <button
                key={l}
                onClick={() => handleLevelFilter(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  levelFilter === l ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={e => handleStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            {statusFilters.map(s => (
              <option key={s} value={s}>{s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_80px_1.5fr_100px_100px_100px_120px] gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            <div className="flex items-center gap-1 cursor-pointer hover:text-foreground select-none">
              Title <ArrowUpDown className="w-3 h-3" />
            </div>
            <div>Level</div>
            <div>Meaning</div>
            <div className="text-center">Views</div>
            <div className="text-center">Completions</div>
            <div className="text-center">Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {paginated.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No grammar lessons found.
              </div>
            ) : (
              paginated.map((lesson, i) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-[2fr_80px_1.5fr_100px_100px_100px_120px] gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition cursor-pointer items-center"
                  onClick={() => openPreview(lesson)}
                >
                  {/* Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{lesson.title}</div>
                      <div className="text-[10px] text-muted-foreground">{lesson.jlpt} JLPT</div>
                    </div>
                  </div>

                  {/* Level */}
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${levelColors[lesson.level]}`}>
                      {lesson.level}
                    </span>
                  </div>

                  {/* Meaning */}
                  <div className="text-sm text-muted-foreground truncate pr-2">{lesson.meaning}</div>

                  {/* Views */}
                  <div className="text-center text-sm font-semibold">{lesson.views > 0 ? lesson.views.toLocaleString() : "—"}</div>

                  {/* Completions */}
                  <div className="text-center text-sm font-semibold text-green-600 dark:text-green-400">
                    {lesson.completions > 0 ? lesson.completions.toLocaleString() : "—"}
                  </div>

                  {/* Status */}
                  <div className="text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[lesson.status]}`}>
                      {lesson.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="text-right flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(lesson)}
                      title="Edit"
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openPreview(lesson)}
                      title="View"
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 pb-5">
              <Pagination current={page} total={filtered.length} onPage={setPage} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PREVIEW VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === "preview" && selectedLesson) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("list")}
              className="p-2 rounded-xl hover:bg-muted transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-black">Grammar Preview</h1>
              <p className="text-sm text-muted-foreground mt-0.5">View lesson details and student engagement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(selectedLesson)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition"
            >
              <Edit3 className="w-4 h-4" /> Edit
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition">
              Publish
            </button>
          </div>
        </div>

        {/* Metadata + Engagement Grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Lesson Metadata */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Lesson Info</h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Pattern</div>
                <div className="font-display font-black text-lg">{selectedLesson.title}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Level</div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${levelColors[selectedLesson.level]}`}>
                  {selectedLesson.level}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Meaning</div>
                <div className="text-sm font-semibold">{selectedLesson.meaning}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Status</div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[selectedLesson.status]}`}>
                  {selectedLesson.status}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Last Updated</div>
                <div className="text-sm">{selectedLesson.updated}</div>
              </div>
            </div>
          </div>

          {/* Student Engagement */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Student Engagement</h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                <div className="font-display font-black text-xl text-blue-500">{selectedLesson.views.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Views</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                <div className="font-display font-black text-xl text-green-500">{selectedLesson.completions.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Completions</div>
              </div>
            </div>

            {/* Completion Rate Bar */}
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
                <span>Completion Rate</span>
                <span className="font-semibold">{selectedLesson.views > 0 ? Math.round((selectedLesson.completions / selectedLesson.views) * 100) : 0}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedLesson.views > 0 ? (selectedLesson.completions / selectedLesson.views) * 100 : 0}%` }}
                  className="h-full bg-gradient-hero rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Avg. time</span>
                </div>
                <span className="text-sm font-bold">4m 32s</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Active learners</span>
                </div>
                <span className="text-sm font-bold">234</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span>Difficulty</span>
                </div>
                <span className="text-sm font-bold">Medium</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-display font-bold">Lesson Content</h3>
            <button className="px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold hover:bg-muted/80 transition">
              <Eye className="w-3.5 h-3.5 inline mr-1" /> Student View
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Formation */}
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
              <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Formation</div>
              <div className="font-display font-black text-lg text-purple-700 dark:text-purple-300">
                Động từ (thể ます) + ながらも
              </div>
            </div>

            {/* Explanation */}
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Explanation</div>
              <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Dùng để diễn đạt hai hành động xảy ra đồng thời, hoặc một hành động trái ngược với kỳ vọng.
                Cấu trúc này mang nghĩa "trong khi đang... vẫn..." hoặc "dù đang... vẫn...".
              </div>
            </div>

            {/* Examples */}
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Example Sentences</div>
              <div className="space-y-3">
                {[
                  { jp: "歩きながらも読書をしてた。", en: "Reading while walking." },
                  { jp: "悪いと知りながらも嘘をついた。", en: "Lied while knowing it was wrong." },
                  { jp: "忙したえ更何况ながらも遊び続けた。", en: "Continued playing even though busy." },
                ].map((ex, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/50 dark:bg-slate-700/30">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{ex.jp}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ex.en}</div>
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition self-start">
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDIT VIEW — Split Pane
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === "edit") {
    const updateExample = (index: number, field: "japanese" | "english", value: string) => {
      const newExamples = [...formData.examples];
      newExamples[index] = { ...newExamples[index], [field]: value };
      setFormData({ ...formData, examples: newExamples });
    };

    const isValid = formData.title.trim() && formData.meaning.trim() && formData.examples.some(e => e.japanese.trim());

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("list")}
              className="p-2 rounded-xl hover:bg-muted transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-black">{editMode === "edit" ? "Edit Grammar Lesson" : "Create Grammar Lesson"}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {editMode === "edit" ? `Editing: ${selectedLesson?.title}` : "Create a new grammar lesson"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className="px-4 py-2 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
            >
              Cancel
            </button>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
            >
              <option value="draft">Save as Draft</option>
              <option value="pending">Submit for Review</option>
              <option value="published">Publish</option>
            </select>
          </div>
        </div>

        {/* Split Pane */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Form Editor */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-5">
              <h3 className="font-display font-bold text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" /> Form Editor
              </h3>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Grammar Pattern <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 〜ながらも"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">JLPT Level</label>
                  <select
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none"
                  >
                    <option>N5</option><option>N4</option><option>N3</option><option>N2</option><option>N1</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Meaning</label>
                  <input
                    value={formData.meaning}
                    onChange={e => setFormData({ ...formData, meaning: e.target.value })}
                    placeholder="e.g. although / while"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Formation</label>
                <input
                  value={formData.formation}
                  onChange={e => setFormData({ ...formData, formation: e.target.value })}
                  placeholder="e.g. Verb (ます-stem) + めながら"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Explanation</label>
                <textarea
                  value={formData.explanation}
                  onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                  rows={4}
                  placeholder="Write a detailed explanation of the grammar pattern..."
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Example Sentences</label>
                <div className="space-y-2">
                  {formData.examples.map((ex, n) => (
                    <div key={n} className="flex gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-2.5">
                        {n + 1}
                      </div>
                      <div className="flex-1">
                        <input
                          value={ex.japanese}
                          onChange={e => updateExample(n, "japanese", e.target.value)}
                          placeholder="Japanese"
                          className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 mb-1"
                        />
                        <input
                          value={ex.english}
                          onChange={e => updateExample(n, "english", e.target.value)}
                          placeholder="English translation"
                          className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-400 transition self-start mt-1.5">
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setFormData({ ...formData, examples: [...formData.examples, { japanese: "", english: "" }] })}
                    className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition"
                  >
                    + Add Example
                  </button>
                </div>
              </div>
            </div>

            {/* Validation */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Validation</h4>
              <div className="space-y-1.5">
                {[
                  { ok: !!formData.title.trim(), label: "Pattern filled" },
                  { ok: !!formData.meaning.trim(), label: "Meaning filled" },
                  { ok: formData.examples.some(e => e.japanese.trim()), label: "At least 1 example" },
                  { ok: formData.examples.filter(e => e.japanese.trim()).length >= 2, label: "2+ examples (recommended)" },
                ].map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {v.ok ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={v.ok ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>
                      {v.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Preview */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-display font-bold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" /> Live Preview
                </h3>
              </div>

              <div className="p-5 space-y-5">
                {/* Formation Preview */}
                {formData.formation ? (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                    <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Formation</div>
                    <div className="font-display font-black text-lg text-purple-700 dark:text-purple-300">
                      {formData.formation}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-muted-foreground">Formation will appear here...</div>
                  </div>
                )}

                {/* Meaning Preview */}
                {formData.meaning ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${levelColors[formData.level]}`}>
                      {formData.level}
                    </span>
                    <span className="text-sm font-semibold">{formData.meaning}</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Meaning will appear here...</div>
                )}

                {/* Explanation Preview */}
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Explanation</div>
                  <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 min-h-[60px]">
                    {formData.explanation || <span className="text-muted-foreground italic">Explanation will appear here...</span>}
                  </div>
                </div>

                {/* Examples Preview */}
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Examples</div>
                  <div className="space-y-2">
                    {formData.examples.map((ex, i) => (
                      ex.japanese ? (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/50 dark:bg-slate-700/30">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{ex.japanese}</div>
                            {ex.english && (
                              <div className="text-xs text-muted-foreground mt-0.5">{ex.english}</div>
                            )}
                          </div>
                          <button className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition self-start">
                            <Mic className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null
                    ))}
                    {formData.examples.every(e => !e.japanese) && (
                      <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-xs text-muted-foreground">Examples will appear here...</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setViewMode("list")}
            className="px-5 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
          >
            Cancel
          </button>
          <button
            disabled={!isValid}
            className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition"
          >
            {editMode === "edit" ? "Update Lesson" : "Create Lesson"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
