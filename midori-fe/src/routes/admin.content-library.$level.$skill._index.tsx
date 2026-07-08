import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen,
  GraduationCap,
  Headphones,
  Mic,
  Plus,
  Search,
  Edit3,
  Trash2,
  Upload,
  ArrowLeft as ArrowLeftIcon,
  Save,
  X,
  Eye,
  Download,
  ChevronDown,
  Cloud,
  CloudOff,
} from "lucide-react";
import { useContentLibrary } from "@/services/contentLibraryService";
import {
  type JLPTLevel,
  type ContentSkill,
  type VocabularyLesson,
  type GrammarLesson,
  type ReadingLesson,
  type ReadingItem,
  type ListeningLesson,
  type ShadowingItem,
  type VocabularyItem,
  type GrammarItem,
  type ListeningItem,
  type ShadowingSegment,
  type ReadingVocabulary,
  generateId,
} from "@/mocks/contentLibraryMock";
import {
  type AdminReadingLesson,
  type AdminReadingPassage,
  type ReadingQuestion,
} from "@/types/content-library";
import {
  useFetchReadingLessons,
  useFetchReadingDetail,
  useCreateReadingLesson,
  useUpdateReadingLesson,
  useDeleteReadingLesson,
  usePublishReadingLesson,
  useUnpublishReadingLesson,
} from "@/services/adminReadingService";

export const Route = createFileRoute("/admin/content-library/$level/$skill/_index")({
  component: SkillDetailPage,
});

const SKILL_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    accent: string;
  }
> = {
  vocabulary: {
    label: "Vocabulary",
    icon: BookOpen,
    color: "text-sakura",
    bg: "bg-sakura/15",
    border: "border-sakura/20",
    accent: "sakura",
  },
  grammar: {
    label: "Grammar",
    icon: GraduationCap,
    color: "text-lavender",
    bg: "bg-lavender/15",
    border: "border-lavender/20",
    accent: "lavender",
  },
  listening: {
    label: "Listening",
    icon: Headphones,
    color: "text-sky-blue",
    bg: "bg-sky-blue/15",
    border: "border-sky-blue/20",
    accent: "sky-blue",
  },
  reading: {
    label: "Reading",
    icon: BookOpen,
    color: "text-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/20",
    accent: "emerald",
  },
  shadowing: {
    label: "Shadowing",
    icon: Mic,
    color: "text-jp-red",
    bg: "bg-jp-red/15",
    border: "border-jp-red/20",
    accent: "jp-red",
  },
};

// Skill color helper - will be overridden in main page component
const getSkillColor = (skill: string) => SKILL_CONFIG[skill]?.color || "text-primary";
const getSkillBg = (skill: string) => SKILL_CONFIG[skill]?.bg || "bg-primary/15";

// ─── Status Badge Component ───────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const s = status || "active";
  const styles: Record<string, { color: string; bg: string }> = {
    active: { color: "text-[var(--status-active)]", bg: "bg-[var(--status-active)]" },
    inactive: { color: "text-muted-col", bg: "bg-muted" },
    pending: { color: "text-[var(--status-pending)]", bg: "bg-[var(--status-pending)]" },
    draft: { color: "text-[var(--status-pending)]", bg: "bg-[var(--status-pending)]" },
  };
  const cfg = styles[s] || styles.active;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

// ─── Modal Component (Match Question Bank) ───────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl" | "2xl";
}) {
  if (!open) return null;

  const sizeClasses = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-[90vw]",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative z-10 w-full ${sizeClasses[size]} glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator shrink-0">
          <h2 className="font-display font-bold text-primary-col text-base">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirmation (Match Question Bank AlertDialog) ─────────────────────

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="font-display font-bold text-primary-col text-lg text-center">{title}</h3>
          <p className="text-secondary-col text-sm text-center">{message}</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t separator">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Vocabulary Edit Form (Match Question Bank styles) ─────────────────────────

function VocabEditForm({
  lesson,
  onSave,
  onCancel,
}: {
  lesson: VocabularyLesson;
  onSave: (data: Partial<VocabularyLesson>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    description: lesson.description || "",
    status: (lesson as unknown as { status?: string }).status || "active",
    items: [...lesson.items] as VocabularyItem[],
  });
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const addItem = () => {
    const newItem = {
      id: generateId("v"),
      word: "",
      kanji: "",
      meaningVietnamese: "",
      meaningJapanese: "",
      exampleSentence: "",
      audioUrl: "",
    };
    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
    setExpandedItems((prev) => new Set([...prev, newItem.id]));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setForm((f) => {
      const items = f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...f, items } as typeof f;
    });
  };

  const removeItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: lesson.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-[120px_1fr_180px] gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Number
              </label>
              <input
                type="number"
                value={form.lessonNumber}
                onChange={(e) => setForm((f) => ({ ...f, lessonNumber: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-secondary-col mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[100px]"
            />
          </div>
        </div>

        {/* Vocabulary Items */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Vocabulary Items</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.items.length} item{form.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">
                No vocabulary items yet. Click "Add Item" below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.items.map((item, i) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    {/* Item Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-primary-col">
                            {item.kanji || item.word || "New Item"}
                          </span>
                          {item.word && item.word !== item.kanji && (
                            <span className="text-xs text-muted-col ml-2">{item.word}</span>
                          )}
                        </div>
                        {item.meaningVietnamese && (
                          <span className="text-xs text-muted-col hidden sm:inline">
                            — {item.meaningVietnamese}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(i);
                          }}
                          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Item Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 glass-card space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Word (Hiragana)
                            </label>
                            <input
                              value={item.word}
                              onChange={(e) => updateItem(i, "word", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Word"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-col mb-1">Kanji</label>
                            <input
                              value={item.kanji}
                              onChange={(e) => updateItem(i, "kanji", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Kanji"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">
                            Meaning (Vietnamese)
                          </label>
                          <input
                            value={item.meaningVietnamese}
                            onChange={(e) => updateItem(i, "meaningVietnamese", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Meaning (Vietnamese)"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">
                            Meaning (Japanese)
                          </label>
                          <input
                            value={item.meaningJapanese}
                            onChange={(e) => updateItem(i, "meaningJapanese", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Meaning (Japanese)"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">
                            Example Sentence
                          </label>
                          <input
                            value={item.exampleSentence}
                            onChange={(e) => updateItem(i, "exampleSentence", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Example sentence"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Item Button - At Bottom */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addItem}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-cyan-500/25"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Grammar Edit Form ─────────────────────────────────────────────────────────

function GrammarEditForm({
  lesson,
  onSave,
  onCancel,
}: {
  lesson: GrammarLesson;
  onSave: (data: Partial<GrammarLesson>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    status: (lesson as unknown as { status?: string }).status || "active",
    items: [...lesson.items] as GrammarItem[],
  });
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const addItem = () => {
    const newItem = {
      id: generateId("g"),
      grammarPoint: "",
      meaningVietnamese: "",
      meaningJapanese: "",
      explanation: "",
      exampleSentence: "",
      notes: "",
    };
    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
    setExpandedItems((prev) => new Set([...prev, newItem.id]));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setForm((f) => {
      const items = f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...f, items } as typeof f;
    });
  };

  const removeItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: lesson.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-[120px_1fr_180px] gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Number
              </label>
              <input
                type="number"
                value={form.lessonNumber}
                onChange={(e) => setForm((f) => ({ ...f, lessonNumber: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grammar Points */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Grammar Points</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.items.length} point{form.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">
                No grammar points yet. Click "Add Point" below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.items.map((item, i) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    {/* Item Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-primary-col">
                            {item.grammarPoint || "New Point"}
                          </span>
                        </div>
                        {item.meaningVietnamese && (
                          <span className="text-xs text-muted-col hidden sm:inline">
                            — {item.meaningVietnamese}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(i);
                          }}
                          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Item Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 glass-card space-y-3">
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Grammar Point</label>
                          <input
                            value={item.grammarPoint}
                            onChange={(e) => updateItem(i, "grammarPoint", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="e.g. 〜ます"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Meaning (Vietnamese)
                            </label>
                            <input
                              value={item.meaningVietnamese}
                              onChange={(e) => updateItem(i, "meaningVietnamese", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Meaning"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Example Sentence
                            </label>
                            <input
                              value={item.exampleSentence}
                              onChange={(e) => updateItem(i, "exampleSentence", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Example"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Explanation</label>
                          <input
                            value={item.explanation}
                            onChange={(e) => updateItem(i, "explanation", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Explanation"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Point Button - At Bottom */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addItem}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Point
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-cyan-500/25"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Listening Edit Form ───────────────────────────────────────────────────────

function ListeningEditForm({
  lesson,
  onSave,
  onCancel,
}: {
  lesson: ListeningLesson;
  onSave: (data: Partial<ListeningLesson>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    status: (lesson as unknown as { status?: string }).status || "active",
    items: [...lesson.items] as ListeningLesson["items"],
  });
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const addItem = () => {
    const newItem = {
      id: generateId("list"),
      title: "",
      audioUrl: "",
      transcriptJapanese: "",
      translationVietnamese: "",
      questions: [],
    };
    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
    setExpandedItems((prev) => new Set([...prev, newItem.id]));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setForm((f) => {
      const items = f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...f, items } as typeof f;
    });
  };

  const removeItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: lesson.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-[120px_1fr_180px] gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Number
              </label>
              <input
                type="number"
                value={form.lessonNumber}
                onChange={(e) => setForm((f) => ({ ...f, lessonNumber: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listening Items */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Listening Items</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.items.length} item{form.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">
                No listening items yet. Click "Add Item" below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.items.map((item, i) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    {/* Item Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-primary-col">
                            {item.title || "New Item"}
                          </span>
                        </div>
                        {item.audioUrl && (
                          <span className="text-xs text-muted-col hidden sm:inline">
                            — Audio attached
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(i);
                          }}
                          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Item Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 glass-card space-y-3">
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Item Title</label>
                          <input
                            value={item.title}
                            onChange={(e) => updateItem(i, "title", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Item title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Upload Audio</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept=".mp3,.wav,.m4a"
                              className="hidden"
                              id={`audio-upload-${item.id}`}
                            />
                            <label
                              htmlFor={`audio-upload-${item.id}`}
                              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col cursor-pointer hover:bg-[var(--accent)] transition flex items-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              {item.audioUrl || "Choose file..."}
                            </label>
                          </div>
                          <p className="text-xs text-muted-col mt-1">Supported: .mp3, .wav, .m4a</p>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">
                            Japanese Transcript
                          </label>
                          <textarea
                            value={item.transcriptJapanese}
                            onChange={(e) => updateItem(i, "transcriptJapanese", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[80px]"
                            placeholder="Japanese transcript"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">
                            Vietnamese Translation
                          </label>
                          <textarea
                            value={item.translationVietnamese}
                            onChange={(e) => updateItem(i, "translationVietnamese", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[80px]"
                            placeholder="Vietnamese translation"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Item Button - At Bottom */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addItem}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-cyan-500/25"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Reading Edit Form ────────────────────────────────────────────────────────

function ReadingEditForm({
  lesson,
  onSave,
  onCancel,
}: {
  lesson: ReadingLesson;
  onSave: (data: Partial<ReadingLesson>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    status: (lesson as unknown as { status?: string }).status || "active",
    items: [...lesson.items] as ReadingLesson["items"],
  });
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const addItem = () => {
    const newItem: ReadingItem = {
      id: generateId("read"),
      title: "",
      passage: "",
      translationVietnamese: "",
      vocabularyHints: [],
      questions: [],
    };
    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
    setExpandedItems((prev) => new Set([...prev, newItem.id]));
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    setForm((f) => {
      const items = f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...f, items } as typeof f;
    });
  };

  const removeItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: lesson.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-[120px_1fr_180px] gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Number
              </label>
              <input
                type="number"
                value={form.lessonNumber}
                onChange={(e) => setForm((f) => ({ ...f, lessonNumber: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reading Items */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Reading Passages</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.items.length} passage{form.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">
                No reading passages yet. Click "Add Passage" below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.items.map((item, i) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    {/* Item Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-primary-col">
                            {item.title || "New Passage"}
                          </span>
                        </div>
                        {item.passage && (
                          <span className="text-xs text-muted-col hidden sm:inline truncate max-w-[200px]">
                            — {item.passage.substring(0, 40)}...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-col hidden sm:inline">
                          {item.questions?.length || 0} Q
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(i);
                          }}
                          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Item Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 glass-card space-y-3">
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Passage Title</label>
                          <input
                            value={item.title}
                            onChange={(e) => updateItem(i, "title", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Passage title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Japanese Passage</label>
                          <textarea
                            value={item.passage}
                            onChange={(e) => updateItem(i, "passage", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[100px]"
                            placeholder="Paste Japanese reading passage here..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Vietnamese Translation</label>
                          <textarea
                            value={item.translationVietnamese}
                            onChange={(e) => updateItem(i, "translationVietnamese", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[80px]"
                            placeholder="Vietnamese translation"
                          />
                        </div>

                        {/* Vocabulary Hints */}
                        <div className="border-t border-[var(--border)] pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-muted-col font-medium">Vocabulary Hints</label>
                            <button
                              type="button"
                              onClick={() => {
                                const hints = item.vocabularyHints || [];
                                updateItem(i, "vocabularyHints", [
                                  ...hints,
                                  { japanese: "", reading: "", meaning: "" },
                                ]);
                              }}
                              className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition"
                            >
                              + Add Vocab
                            </button>
                          </div>
                          {(item.vocabularyHints || []).map((vocab, vi) => (
                            <div key={vi} className="flex gap-2 mb-2 items-center">
                              <input
                                value={vocab.japanese}
                                onChange={(e) => {
                                  const hints = [...(item.vocabularyHints || [])];
                                  hints[vi] = { ...hints[vi], japanese: e.target.value };
                                  updateItem(i, "vocabularyHints", hints);
                                }}
                                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                                placeholder="Japanese"
                              />
                              <input
                                value={vocab.reading}
                                onChange={(e) => {
                                  const hints = [...(item.vocabularyHints || [])];
                                  hints[vi] = { ...hints[vi], reading: e.target.value };
                                  updateItem(i, "vocabularyHints", hints);
                                }}
                                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                                placeholder="Reading"
                              />
                              <input
                                value={vocab.meaning}
                                onChange={(e) => {
                                  const hints = [...(item.vocabularyHints || [])];
                                  hints[vi] = { ...hints[vi], meaning: e.target.value };
                                  updateItem(i, "vocabularyHints", hints);
                                }}
                                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                                placeholder="Meaning"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const hints = (item.vocabularyHints || []).filter((_, idx) => idx !== vi);
                                  updateItem(i, "vocabularyHints", hints);
                                }}
                                className="text-red-400 hover:text-red-600 shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Questions */}
                        <div className="border-t border-[var(--border)] pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-muted-col font-medium">
                              Questions ({item.questions?.length || 0})
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const questions = item.questions || [];
                                updateItem(i, "questions", [
                                  ...questions,
                                  {
                                    id: generateId("rq"),
                                    question: "",
                                    options: ["", "", "", ""],
                                    correctAnswer: 0,
                                    explanation: "",
                                  },
                                ]);
                              }}
                              className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition"
                            >
                              + Add Q
                            </button>
                          </div>
                          {(item.questions || []).map((q, qi) => (
                            <div key={q.id} className="rounded-lg border border-[var(--border)] p-3 mb-2 bg-[var(--card)]">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-primary-col">
                                  Q{qi + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const questions = (item.questions || []).filter((_, idx) => idx !== qi);
                                    updateItem(i, "questions", questions);
                                  }}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <input
                                value={q.question}
                                onChange={(e) => {
                                  const questions = [...(item.questions || [])];
                                  questions[qi] = { ...questions[qi], question: e.target.value };
                                  updateItem(i, "questions", questions);
                                }}
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col mb-2"
                                placeholder="Question text"
                              />
                              <div className="space-y-1">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <span className="text-xs text-muted-col w-4 shrink-0">{String.fromCharCode(65 + oi)}.</span>
                                    <input
                                      value={opt}
                                      onChange={(e) => {
                                        const questions = [...(item.questions || [])];
                                        const newOpts = [...questions[qi].options];
                                        newOpts[oi] = e.target.value;
                                        questions[qi] = { ...questions[qi], options: newOpts };
                                        updateItem(i, "questions", questions);
                                      }}
                                      className="flex-1 px-2 py-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const questions = [...(item.questions || [])];
                                        questions[qi] = { ...questions[qi], correctAnswer: oi };
                                        updateItem(i, "questions", questions);
                                      }}
                                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
                                        q.correctAnswer === oi
                                          ? "border-emerald-500 bg-emerald-500 text-white"
                                          : "border-[var(--border)]"
                                      }`}
                                      title="Set as correct answer"
                                    >
                                      {q.correctAnswer === oi && (
                                        <span className="w-2 h-2 rounded-full bg-white" />
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <input
                                value={q.explanation || ""}
                                onChange={(e) => {
                                  const questions = [...(item.questions || [])];
                                  questions[qi] = { ...questions[qi], explanation: e.target.value };
                                  updateItem(i, "questions", questions);
                                }}
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col mt-2"
                                placeholder="Explanation (optional)"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Item Button */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addItem}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Passage
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-cyan-500/25"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Shadowing Edit Form ─────────────────────────────────────────────────────

function ShadowingEditForm({
  item,
  onSave,
  onCancel,
}: {
  item: ShadowingItem;
  onSave: (data: Partial<ShadowingItem>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: item.title,
    videoUrl: item.videoUrl,
    thumbnailUrl: item.thumbnailUrl || "",
    transcriptJapanese: item.transcriptJapanese || "",
    translationVietnamese: item.translationVietnamese || "",
    segments: [...item.segments] as ShadowingItem["segments"],
  });
  const [saving, setSaving] = useState(false);
  const [expandedSegs, setExpandedSegs] = useState<Set<string>>(new Set());

  const addSegment = () => {
    const newSeg = {
      id: generateId("seg"),
      startTime: 0,
      endTime: 0,
      japaneseText: "",
      vietnameseTranslation: "",
    };
    setForm((f) => ({ ...f, segments: [...f.segments, newSeg] }));
    setExpandedSegs((prev) => new Set([...prev, newSeg.id]));
  };

  const updateSegment = (index: number, field: string, value: string | number) => {
    setForm((f) => {
      const segments = f.segments.map((seg, i) => (i === index ? { ...seg, [field]: value } : seg));
      return { ...f, segments } as typeof f;
    });
  };

  const removeSegment = (index: number) => {
    setForm((f) => ({ ...f, segments: f.segments.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedSegs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: item.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Video URL
              </label>
              <input
                value={form.videoUrl}
                onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-secondary-col mb-1.5">
              Japanese Transcript
            </label>
            <textarea
              value={form.transcriptJapanese}
              onChange={(e) => setForm((f) => ({ ...f, transcriptJapanese: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[80px]"
            />
          </div>
        </div>

        {/* Segments */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Segments</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.segments.length} segment{form.segments.length !== 1 ? "s" : ""}
            </p>
          </div>

          {form.segments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">
                No segments yet. Click "Add Segment" below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.segments.map((seg, i) => {
                const isExpanded = expandedSegs.has(seg.id);
                return (
                  <div
                    key={seg.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    {/* Segment Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(seg.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-primary-col">
                            {seg.japaneseText || "New Segment"}
                          </span>
                        </div>
                        {seg.vietnameseTranslation && (
                          <span className="text-xs text-muted-col hidden sm:inline">
                            — {seg.vietnameseTranslation}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-col tabular-nums">
                          {seg.startTime}s – {seg.endTime}s
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSegment(i);
                          }}
                          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Segment Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 glass-card space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Japanese Text
                            </label>
                            <input
                              value={seg.japaneseText}
                              onChange={(e) => updateSegment(i, "japaneseText", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Japanese text"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Vietnamese Translation
                            </label>
                            <input
                              value={seg.vietnameseTranslation}
                              onChange={(e) =>
                                updateSegment(i, "vietnameseTranslation", e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Vietnamese"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Start Time (s)
                            </label>
                            <input
                              type="number"
                              value={seg.startTime}
                              onChange={(e) => updateSegment(i, "startTime", +e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              min={0}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              End Time (s)
                            </label>
                            <input
                              type="number"
                              value={seg.endTime}
                              onChange={(e) => updateSegment(i, "endTime", +e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              min={0}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Segment Button - At Bottom */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addSegment}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-[oklch(0.62_0.18_270)] hover:bg-[oklch(0.62_0.18_270)]/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Segment
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-cyan-500/25"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Create Lesson Forms ──────────────────────────────────────────────────────

function VocabLessonForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<VocabularyLesson>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: 1,
    title: "",
    description: "",
    status: "active",
    items: [
      {
        id: generateId("v"),
        word: "",
        kanji: "",
        meaningVietnamese: "",
        meaningJapanese: "",
        exampleSentence: "",
        audioUrl: "",
      },
    ],
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const updateItem = (index: number, field: string, value: string) => {
    setForm((f) => {
      const items = f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...f, items } as typeof f;
    });
  };

  const addItem = () => {
    const newItem = {
      id: generateId("v"),
      word: "",
      kanji: "",
      meaningVietnamese: "",
      meaningJapanese: "",
      exampleSentence: "",
      audioUrl: "",
    };
    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
    setExpandedItems((prev) => new Set([...prev, newItem.id]));
  };

  const removeItem = (index: number) => {
    setForm((f) => {
      const newItems = f.items.filter((_, i) => i !== index);
      return { ...f, items: newItems };
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-[120px_1fr_180px] gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Number
              </label>
              <input
                type="number"
                value={form.lessonNumber}
                onChange={(e) => setForm((f) => ({ ...f, lessonNumber: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-secondary-col mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[120px]"
              placeholder="Describe lesson objectives, content overview, and learning outcomes..."
            />
          </div>
        </div>

        {/* Vocabulary Items */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Vocabulary Items</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.items.length} item{form.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">
                No vocabulary items yet. Click "Add Item" below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.items.map((item, i) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    {/* Item Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-primary-col">
                            {item.kanji || item.word || "New Item"}
                          </span>
                          <span className="text-xs text-muted-col ml-2">
                            {item.word && item.word !== item.kanji ? item.word : ""}
                          </span>
                        </div>
                        {item.meaningVietnamese && (
                          <span className="text-xs text-muted-col hidden sm:inline">
                            — {item.meaningVietnamese}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(i);
                          }}
                          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Item Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 glass-card space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Word (Hiragana)
                            </label>
                            <input
                              value={item.word}
                              onChange={(e) => updateItem(i, "word", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Word"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-col mb-1">Kanji</label>
                            <input
                              value={item.kanji}
                              onChange={(e) => updateItem(i, "kanji", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Kanji"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">
                            Meaning (Vietnamese)
                          </label>
                          <input
                            value={item.meaningVietnamese}
                            onChange={(e) => updateItem(i, "meaningVietnamese", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Meaning (Vietnamese)"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">
                            Example Sentence
                          </label>
                          <input
                            value={item.exampleSentence}
                            onChange={(e) => updateItem(i, "exampleSentence", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Example sentence"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Item Button - At Bottom */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addItem}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim()}
          className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
        >
          Create Lesson
        </button>
      </div>
    </div>
  );
}

function GrammarLessonForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<GrammarLesson>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: 1,
    title: "",
    status: "active",
    items: [
      {
        id: generateId("g"),
        grammarPoint: "",
        meaningVietnamese: "",
        meaningJapanese: "",
        explanation: "",
        exampleSentence: "",
        notes: "",
      },
    ],
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const updateItem = (index: number, field: string, value: string) => {
    setForm((f) => {
      const items = f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...f, items } as typeof f;
    });
  };

  const addItem = () => {
    const newItem = {
      id: generateId("g"),
      grammarPoint: "",
      meaningVietnamese: "",
      meaningJapanese: "",
      explanation: "",
      exampleSentence: "",
      notes: "",
    };
    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
    setExpandedItems((prev) => new Set([...prev, newItem.id]));
  };

  const removeItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-[120px_1fr_180px] gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Number
              </label>
              <input
                type="number"
                value={form.lessonNumber}
                onChange={(e) => setForm((f) => ({ ...f, lessonNumber: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grammar Points */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Grammar Points</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.items.length} point{form.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">
                No grammar points yet. Click "Add Point" below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.items.map((item, i) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    {/* Item Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-primary-col">
                            {item.grammarPoint || "New Point"}
                          </span>
                        </div>
                        {item.meaningVietnamese && (
                          <span className="text-xs text-muted-col hidden sm:inline">
                            — {item.meaningVietnamese}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(i);
                          }}
                          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Item Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 glass-card space-y-3">
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Grammar Point</label>
                          <input
                            value={item.grammarPoint}
                            onChange={(e) => updateItem(i, "grammarPoint", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="e.g. 〜ます"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Meaning (Vietnamese)
                            </label>
                            <input
                              value={item.meaningVietnamese}
                              onChange={(e) => updateItem(i, "meaningVietnamese", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Meaning"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Example Sentence
                            </label>
                            <input
                              value={item.exampleSentence}
                              onChange={(e) => updateItem(i, "exampleSentence", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Example"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Explanation</label>
                          <input
                            value={item.explanation}
                            onChange={(e) => updateItem(i, "explanation", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Explanation"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Point Button - At Bottom */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addItem}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Point
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim()}
          className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
        >
          Create Lesson
        </button>
      </div>
    </div>
  );
}

function ListeningLessonForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<ListeningLesson>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: 1,
    title: "",
    status: "active",
    items: [
      {
        id: generateId("list"),
        title: "",
        audioUrl: "",
        transcriptJapanese: "",
        translationVietnamese: "",
        questions: [],
      },
    ],
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const updateItem = (index: number, field: string, value: string) => {
    setForm((f) => {
      const items = f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...f, items } as typeof f;
    });
  };

  const addItem = () => {
    const newItem = {
      id: generateId("list"),
      title: "",
      audioUrl: "",
      transcriptJapanese: "",
      translationVietnamese: "",
      questions: [],
    };
    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
    setExpandedItems((prev) => new Set([...prev, newItem.id]));
  };

  const removeItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-[120px_1fr_180px] gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Number
              </label>
              <input
                type="number"
                value={form.lessonNumber}
                onChange={(e) => setForm((f) => ({ ...f, lessonNumber: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listening Items */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Listening Items</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.items.length} item{form.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">
                No listening items yet. Click "Add Item" below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.items.map((item, i) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    {/* Item Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-primary-col">
                            {item.title || "New Item"}
                          </span>
                        </div>
                        {item.audioUrl && (
                          <span className="text-xs text-muted-col hidden sm:inline">
                            — Audio attached
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(i);
                          }}
                          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Item Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 glass-card space-y-3">
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Item Title</label>
                          <input
                            value={item.title}
                            onChange={(e) => updateItem(i, "title", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            placeholder="Item title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Upload Audio</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept=".mp3,.wav,.m4a"
                              className="hidden"
                              id={`create-audio-${i}`}
                            />
                            <label
                              htmlFor={`create-audio-${i}`}
                              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col cursor-pointer hover:bg-[var(--accent)] transition flex items-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              {item.audioUrl || "Choose file..."}
                            </label>
                          </div>
                          <p className="text-xs text-muted-col mt-1">Supported: .mp3, .wav, .m4a</p>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">
                            Japanese Transcript
                          </label>
                          <textarea
                            value={item.transcriptJapanese}
                            onChange={(e) => updateItem(i, "transcriptJapanese", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[80px]"
                            placeholder="Japanese transcript"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Item Button - At Bottom */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addItem}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim()}
          className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
        >
          Create Lesson
        </button>
      </div>
    </div>
  );
}

function ReadingLessonForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<ReadingLesson>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: 1,
    title: "",
    status: "active",
    items: [
      {
        id: generateId("read"),
        title: "",
        passage: "",
        translationVietnamese: "",
        vocabularyHints: [] as ReadingVocabulary[],
        questions: [] as ReadingQuestion[],
      },
    ],
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set([generateId("read")]));

  const updateItem = (index: number, field: string, value: unknown) => {
    setForm((f) => {
      const items = f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...f, items } as typeof f;
    });
  };

  const addItem = () => {
    const newItem = {
      id: generateId("read"),
      title: "",
      passage: "",
      translationVietnamese: "",
      vocabularyHints: [] as ReadingVocabulary[],
      questions: [] as ReadingQuestion[],
    };
    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
    setExpandedItems((prev) => new Set([...prev, newItem.id]));
  };

  const removeItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-[120px_1fr_180px] gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Number
              </label>
              <input
                type="number"
                value={form.lessonNumber}
                onChange={(e) => setForm((f) => ({ ...f, lessonNumber: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Lesson Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reading Items */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Reading Passages</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.items.length} passage{form.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-2">
            {form.items.map((item, i) => {
              const isExpanded = expandedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-[var(--border)] overflow-hidden"
                >
                  {/* Item Header */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="text-left">
                        <span className="text-sm font-medium text-primary-col">
                          {item.title || "New Passage"}
                        </span>
                      </div>
                      {item.passage && (
                        <span className="text-xs text-muted-col hidden sm:inline truncate max-w-[200px]">
                          — {item.passage.substring(0, 40)}...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-col hidden sm:inline">
                        {item.questions?.length || 0} Q
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(i);
                        }}
                        className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {/* Item Content */}
                  {isExpanded && (
                    <div className="px-4 py-4 glass-card space-y-3">
                      <div>
                        <label className="block text-xs text-muted-col mb-1">Passage Title</label>
                        <input
                          value={item.title}
                          onChange={(e) => updateItem(i, "title", e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                          placeholder="Passage title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-col mb-1">Japanese Passage</label>
                        <textarea
                          value={item.passage}
                          onChange={(e) => updateItem(i, "passage", e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[100px]"
                          placeholder="Paste Japanese reading passage here..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-col mb-1">Vietnamese Translation</label>
                        <textarea
                          value={item.translationVietnamese}
                          onChange={(e) => updateItem(i, "translationVietnamese", e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-y min-h-[80px]"
                          placeholder="Vietnamese translation"
                        />
                      </div>

                      {/* Vocabulary Hints */}
                      <div className="border-t border-[var(--border)] pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-muted-col font-medium">Vocabulary Hints</label>
                          <button
                            type="button"
                            onClick={() => {
                              const hints = item.vocabularyHints || [];
                              updateItem(i, "vocabularyHints", [
                                ...hints,
                                { japanese: "", reading: "", meaning: "" },
                              ]);
                            }}
                            className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition"
                          >
                            + Add Vocab
                          </button>
                        </div>
                        {(item.vocabularyHints || []).map((vocab, vi) => (
                          <div key={vi} className="flex gap-2 mb-2 items-center">
                            <input
                              value={vocab.japanese}
                              onChange={(e) => {
                                const hints = [...(item.vocabularyHints || [])];
                                hints[vi] = { ...hints[vi], japanese: e.target.value };
                                updateItem(i, "vocabularyHints", hints);
                              }}
                              className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                              placeholder="Japanese"
                            />
                            <input
                              value={vocab.reading}
                              onChange={(e) => {
                                const hints = [...(item.vocabularyHints || [])];
                                hints[vi] = { ...hints[vi], reading: e.target.value };
                                updateItem(i, "vocabularyHints", hints);
                              }}
                              className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                              placeholder="Reading"
                            />
                            <input
                              value={vocab.meaning}
                              onChange={(e) => {
                                const hints = [...(item.vocabularyHints || [])];
                                hints[vi] = { ...hints[vi], meaning: e.target.value };
                                updateItem(i, "vocabularyHints", hints);
                              }}
                              className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                              placeholder="Meaning"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const hints = (item.vocabularyHints || []).filter((_, idx) => idx !== vi);
                                updateItem(i, "vocabularyHints", hints);
                              }}
                              className="text-red-400 hover:text-red-600 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Questions */}
                      <div className="border-t border-[var(--border)] pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-muted-col font-medium">
                            Questions ({item.questions?.length || 0})
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const questions = item.questions || [];
                              updateItem(i, "questions", [
                                ...questions,
                                {
                                  id: generateId("rq"),
                                  question: "",
                                  options: ["", "", "", ""],
                                  correctAnswer: 0,
                                  explanation: "",
                                },
                              ]);
                            }}
                            className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition"
                          >
                            + Add Q
                          </button>
                        </div>
                        {(item.questions || []).map((q, qi) => (
                          <div key={q.id} className="rounded-lg border border-[var(--border)] p-3 mb-2 bg-[var(--card)]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-primary-col">Q{qi + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const questions = (item.questions || []).filter((_, idx) => idx !== qi);
                                  updateItem(i, "questions", questions);
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              value={q.question}
                              onChange={(e) => {
                                const questions = [...(item.questions || [])];
                                questions[qi] = { ...questions[qi], question: e.target.value };
                                updateItem(i, "questions", questions);
                              }}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col mb-2"
                              placeholder="Question text"
                            />
                            <div className="space-y-1">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-col w-4 shrink-0">
                                    {String.fromCharCode(65 + oi)}.
                                  </span>
                                  <input
                                    value={opt}
                                    onChange={(e) => {
                                      const questions = [...(item.questions || [])];
                                      const newOpts = [...questions[qi].options];
                                      newOpts[oi] = e.target.value;
                                      questions[qi] = { ...questions[qi], options: newOpts };
                                      updateItem(i, "questions", questions);
                                    }}
                                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const questions = [...(item.questions || [])];
                                      questions[qi] = { ...questions[qi], correctAnswer: oi };
                                      updateItem(i, "questions", questions);
                                    }}
                                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
                                      q.correctAnswer === oi
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-[var(--border)]"
                                    }`}
                                    title="Set as correct answer"
                                  >
                                    {q.correctAnswer === oi && (
                                      <span className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                            <input
                              value={q.explanation || ""}
                              onChange={(e) => {
                                const questions = [...(item.questions || [])];
                                questions[qi] = { ...questions[qi], explanation: e.target.value };
                                updateItem(i, "questions", questions);
                              }}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col mt-2"
                              placeholder="Explanation (optional)"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Item Button */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addItem}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Passage
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim()}
          className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
        >
          Create Lesson
        </button>
      </div>
    </div>
  );
}

function ShadowingLessonForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<ShadowingItem>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    videoUrl: "",
    thumbnailUrl: "",
    transcriptJapanese: "",
    translationVietnamese: "",
    segments: [
      {
        id: generateId("seg"),
        startTime: 0,
        endTime: 0,
        japaneseText: "",
        vietnameseTranslation: "",
      },
    ],
  });
  const [expandedSegs, setExpandedSegs] = useState<Set<string>>(new Set());

  const updateSegment = (index: number, field: string, value: string | number) => {
    setForm((f) => {
      const segments = f.segments.map((seg, i) => (i === index ? { ...seg, [field]: value } : seg));
      return { ...f, segments } as typeof f;
    });
  };

  const addSegment = () => {
    const newSeg = {
      id: generateId("seg"),
      startTime: 0,
      endTime: 0,
      japaneseText: "",
      vietnameseTranslation: "",
    };
    setForm((f) => ({ ...f, segments: [...f.segments, newSeg] }));
    setExpandedSegs((prev) => new Set([...prev, newSeg.id]));
  };

  const removeSegment = (index: number) => {
    setForm((f) => ({ ...f, segments: f.segments.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedSegs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Lesson Information */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Enter title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Video URL
              </label>
              <input
                value={form.videoUrl}
                onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Video URL"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Thumbnail URL
              </label>
              <input
                value={form.thumbnailUrl}
                onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Thumbnail URL"
              />
            </div>
          </div>
        </div>

        {/* Segments */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary-col">Segments</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {form.segments.length} segment{form.segments.length !== 1 ? "s" : ""}
            </p>
          </div>

          {form.segments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">
                No segments yet. Click "Add Segment" below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.segments.map((seg, i) => {
                const isExpanded = expandedSegs.has(seg.id);
                return (
                  <div
                    key={seg.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    {/* Segment Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(seg.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-primary-col">
                            {seg.japaneseText || "New Segment"}
                          </span>
                        </div>
                        {seg.vietnameseTranslation && (
                          <span className="text-xs text-muted-col hidden sm:inline">
                            — {seg.vietnameseTranslation}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-col tabular-nums">
                          {seg.startTime}s – {seg.endTime}s
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSegment(i);
                          }}
                          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-col transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Segment Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 glass-card space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Japanese Text
                            </label>
                            <input
                              value={seg.japaneseText}
                              onChange={(e) => updateSegment(i, "japaneseText", e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Japanese text"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Vietnamese Translation
                            </label>
                            <input
                              value={seg.vietnameseTranslation}
                              onChange={(e) =>
                                updateSegment(i, "vietnameseTranslation", e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              placeholder="Vietnamese"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Start Time (s)
                            </label>
                            <input
                              type="number"
                              value={seg.startTime}
                              onChange={(e) => updateSegment(i, "startTime", +e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              min={0}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              End Time (s)
                            </label>
                            <input
                              type="number"
                              value={seg.endTime}
                              onChange={(e) => updateSegment(i, "endTime", +e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                              min={0}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Segment Button - At Bottom */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={addSegment}
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-[oklch(0.62_0.18_270)] hover:bg-[oklch(0.62_0.18_270)]/10 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Segment
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim() || !form.videoUrl.trim()}
          className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
        >
          Create Lesson
        </button>
      </div>
    </div>
  );
}

// ─── Excel Import Modal (Match Question Bank) ─────────────────────────────────

function ExcelImportModal({
  skill,
  level,
  onClose,
  onImport,
}: {
  skill: string;
  level: JLPTLevel;
  onClose: () => void;
  onImport: (
    data: Partial<VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson>,
  ) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const getSkillLabel = () => {
    const labels: Record<string, string> = {
      vocabulary: "Vocabulary",
      grammar: "Grammar",
      listening: "Listening",
      shadowing: "Shadowing",
    };
    return labels[skill] || skill;
  };

  const getTemplateColumns = () => {
    const templates: Record<string, { columns: string[]; example: string[] }> = {
      vocabulary: {
        columns: [
          "Lesson Number",
          "Lesson Title",
          "Word",
          "Kanji",
          "Meaning Vietnamese",
          "Meaning Japanese",
          "Example Sentence",
          "Audio",
        ],
        example: [
          "1",
          "Greetings",
          "こんにちは",
          "今日",
          "Xin chào",
          "こんにちは",
          "こんにちは、元気ですか",
          "greeting.mp3",
        ],
      },
      grammar: {
        columns: [
          "Lesson Number",
          "Lesson Title",
          "Grammar Point",
          "Meaning",
          "Explanation",
          "Example Sentence",
          "Notes",
        ],
        example: [
          "1",
          "Potential Form",
          "〜ことができる",
          "Can do",
          "Express ability",
          "日本語を話すことができます",
          "N5 Grammar",
        ],
      },
      listening: {
        columns: [
          "Lesson Number",
          "Lesson Title",
          "Audio File Name",
          "Transcript Japanese",
          "Translation Vietnamese",
          "Question",
          "Correct Answer",
        ],
        example: [
          "1",
          "Daily Conversation",
          "daily01.mp3",
          "おはようございます",
          "Chào buổi sáng",
          "What did the speaker say?",
          "Good Morning",
        ],
      },
      shadowing: {
        columns: [
          "Lesson Number",
          "Lesson Title",
          "Video URL",
          "Japanese Script",
          "Vietnamese Translation",
          "Segment Start",
          "Segment End",
        ],
        example: [
          "1",
          "Shadowing Basic",
          "youtube.com/...",
          "おはようございます",
          "Chào buổi sáng",
          "00:05",
          "00:10",
        ],
      },
    };
    return templates[skill] || templates.vocabulary;
  };

  const handleDownloadTemplate = () => {
    const template = getTemplateColumns();
    const csvContent = [template.columns.join(","), template.example.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${skill.toLowerCase()}-template.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    if (!file) return;
    setImporting(true);
    setTimeout(() => {
      const mockData: Record<
        string,
        Partial<VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem>
      > = {
        vocabulary: {
          id: generateId("vocab"),
          lessonNumber: 99,
          title: `Imported ${skill} lesson`,
          ...({ status: "active" } as Partial<VocabularyLesson>),
          items: [],
        },
        grammar: {
          id: generateId("gram"),
          lessonNumber: 99,
          title: `Imported ${skill} lesson`,
          ...({ status: "active" } as Partial<GrammarLesson>),
          items: [],
        },
        listening: {
          id: generateId("list"),
          lessonNumber: 99,
          title: `Imported ${skill} lesson`,
          ...({ status: "active" } as Partial<ListeningLesson>),
          items: [],
        },
        shadowing: {
          id: generateId("shadow"),
          title: `Imported ${skill} lesson`,
          videoUrl: "",
          thumbnailUrl: "",
          segments: [],
        },
      };
      onImport(mockData[skill] || mockData.vocabulary);
      setImporting(false);
    }, 1000);
  };

  const template = getTemplateColumns();

  return (
    <div className="p-8 space-y-6">
      {/* Template Download */}
      <div className="bg-[var(--accent)]/30 rounded-xl p-4 border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-primary-col">Excel Template</h4>
            <p className="text-xs text-muted-col mt-1">
              Download the template with required columns
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 text-sm rounded-lg bg-gradient-hero text-white font-medium hover:opacity-90 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download {getSkillLabel()} Template
          </button>
        </div>
        <div className="mt-3 text-xs text-muted-col">
          <p className="font-medium mb-1">Columns:</p>
          <p>{template.columns.join(" | ")}</p>
        </div>
      </div>

      {/* File Upload */}
      <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center">
        <Upload className="w-10 h-10 mx-auto text-muted-col mb-3" />
        <p className="text-sm text-secondary-col mb-2">
          Drop your Excel file here or click to browse
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id="excel-upload"
        />
        <label
          htmlFor="excel-upload"
          className="inline-block px-4 py-2 text-sm rounded-xl border border-[var(--border)] text-secondary-col hover:bg-[var(--accent)] cursor-pointer transition"
        >
          Select File
        </label>
        {file && <p className="mt-2 text-sm text-primary-col">{file.name}</p>}
      </div>

      <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition flex items-center justify-center"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center disabled:opacity-40"
        >
          {importing ? "Importing..." : "Import"}
        </button>
      </div>
    </div>
  );
}

// ─── Skill Detail Page (Match Question Bank) ─────────────────────────────────

function SkillDetailPage() {
  console.log("[SKILL INDEX MOUNTED] /admin/content-library/$level/$skill");

  const { level, skill } = Route.useParams();
  const navigate = useNavigate();
  const upperLevel = level.toUpperCase() as JLPTLevel;
  const config = SKILL_CONFIG[skill];

  const { lessons, createLesson, updateLesson, deleteLesson } = useContentLibrary(
    upperLevel,
    skill as ContentSkill,
  );

  // ── Backend reading hooks (used only when skill === "reading") ──
  const readingQuery = useFetchReadingLessons(upperLevel);
  const readingLessons: AdminReadingLesson[] = (readingQuery.data ?? []) as AdminReadingLesson[];

  const [readingDetailId, setReadingDetailId] = useState<string | null>(null);
  const readingDetailQuery = useFetchReadingDetail(readingDetailId ?? "");
  const readingDetail: AdminReadingLesson | null =
    (readingDetailQuery.data != null ? readingDetailQuery.data : null) as AdminReadingLesson | null;

  const createReadingMutation = useCreateReadingLesson(upperLevel);
  const updateReadingMutation = useUpdateReadingLesson(upperLevel, readingDetailId ?? "");
  const deleteReadingMutation = useDeleteReadingLesson(upperLevel);
  const publishReadingMutation = usePublishReadingLesson(upperLevel);
  const unpublishReadingMutation = useUnpublishReadingLesson(upperLevel);

  console.log("[LESSON LIST]", {
    level,
    skill,
    upperLevel,
    lessonsLength: lessons?.length,
    lessons,
  });

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson | null
  >(null);

  // ── Reading-specific modals & state ──
  const [showReadingDetailModal, setShowReadingDetailModal] = useState(false);
  const [showReadingEditModal, setShowReadingEditModal] = useState(false);
  const [readingSelectedLesson, setReadingSelectedLesson] = useState<AdminReadingLesson | null>(null);
  const [readingEditMode, setReadingEditMode] = useState<"create" | "edit">("create");
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  const filtered = lessons.filter((item) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      ("title" in item && item.title?.toLowerCase().includes(s)) ||
      ("lessonNumber" in item && String((item as VocabularyLesson).lessonNumber).includes(s))
    );
  });

  // Backend-driven reading lessons
  const backendFiltered = readingLessons.filter((item) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(s) ||
      String(item.lessonNumber).includes(s) ||
      (item.jlptLevel?.toLowerCase().includes(s) ?? false) ||
      (item.difficulty?.toLowerCase().includes(s) ?? false)
    );
  });

  const handleCreate = (
    data: Partial<VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson>,
  ) => {
    createLesson(data);
    toast.success("Lesson created successfully");
    setShowCreateModal(false);
  };

  const handleEdit = (item: VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleUpdate = (
    data: Partial<VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson>,
  ) => {
    if (!selectedItem) return;
    updateLesson(selectedItem.id, data);
    toast.success("Lesson updated successfully");
    setShowEditModal(false);
    setSelectedItem(null);
  };

  const handleImport = (
    data: Partial<VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson>,
  ) => {
    createLesson(data);
    toast.success("Lesson imported successfully");
    setShowImportModal(false);
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    deleteLesson(selectedItem.id);
    toast.success("Lesson deleted successfully");
    setShowDeleteConfirm(false);
    setSelectedItem(null);
  };

  // ── Reading CRUD handlers (backend) ──
  const handleReadView = (lesson: AdminReadingLesson) => {
    setReadingSelectedLesson(lesson);
    setReadingDetailId(lesson.id);
    setShowReadingDetailModal(true);
  };

  const handleReadEdit = (lesson: AdminReadingLesson) => {
    setReadingSelectedLesson(lesson);
    setReadingDetailId(lesson.id);
    setReadingEditMode("edit");
    setShowReadingEditModal(true);
  };

  const handleReadCreate = () => {
    setReadingSelectedLesson(null);
    setReadingEditMode("create");
    setShowReadingEditModal(true);
  };

  const handleReadDelete = (lesson: AdminReadingLesson) => {
    setReadingSelectedLesson(lesson);
    setShowDeleteConfirm(true);
  };

  const handleReadPublish = (lesson: AdminReadingLesson) => {
    setReadingSelectedLesson(lesson);
    setShowPublishConfirm(true);
  };

  const handleReadUnpublish = (lesson: AdminReadingLesson) => {
    setReadingSelectedLesson(lesson);
    setShowUnpublishConfirm(true);
  };

  const confirmReadPublish = () => {
    if (!readingSelectedLesson) return;
    publishReadingMutation.mutate(readingSelectedLesson.id, {
      onSuccess: () => {
        toast.success("Reading lesson published successfully");
        setShowPublishConfirm(false);
        setReadingSelectedLesson(null);
      },
      onError: () => {
        toast.error("Failed to publish reading lesson");
        setShowPublishConfirm(false);
      },
    });
  };

  const confirmReadUnpublish = () => {
    if (!readingSelectedLesson) return;
    unpublishReadingMutation.mutate(readingSelectedLesson.id, {
      onSuccess: () => {
        toast.success("Reading lesson unpublished successfully");
        setShowUnpublishConfirm(false);
        setReadingSelectedLesson(null);
      },
      onError: () => {
        toast.error("Failed to unpublish reading lesson");
        setShowUnpublishConfirm(false);
      },
    });
  };

  const confirmReadDelete = () => {
    if (!readingSelectedLesson) return;
    deleteReadingMutation.mutate(readingSelectedLesson.id, {
      onSuccess: () => {
        toast.success("Reading lesson deleted successfully");
        setShowDeleteConfirm(false);
        setReadingSelectedLesson(null);
      },
      onError: () => {
        toast.error("Failed to delete reading lesson");
        setShowDeleteConfirm(false);
      },
    });
  };

  const normalizeDifficulty = (value: string | null | undefined): string | undefined => {
    if (!value) return undefined;
    const normalized = value.trim().toUpperCase();
    return ["EASY", "MEDIUM", "HARD"].includes(normalized) ? normalized : undefined;
  };

  const handleReadSave = (data: AdminReadingLesson) => {
    const difficulty = normalizeDifficulty(data.difficulty);
    const firstPassage = (data.passages ?? []).find((passage) => passage.passage.trim());
    const mainPassage = firstPassage?.passage ?? data.passage ?? "";
    const questions = (data.passages ?? []).flatMap((passage) =>
      passage.questions.map((q, idx) => ({
        questionOrder: idx + 1,
        question: q.question,
        optionA: q.options[0] || "",
        optionB: q.options[1] || "",
        optionC: q.options[2] || "",
        optionD: q.options[3] || "",
        correctAnswer: String.fromCharCode(65 + ((q.correctAnswer ?? 0) % 4)),
        explanation: q.explanation,
      })),
    );

    const payload = {
      lesson: {
        jlptLevel: readingEditMode === "create" ? upperLevel : readingSelectedLesson?.jlptLevel || upperLevel,
        lessonNumber: data.lessonNumber,
        title: data.title,
        description: data.description ?? undefined,
        passage: mainPassage,
        vietnameseTranslation: data.vietnameseTranslation ?? undefined,
        estimatedMinutes: data.estimatedMinutes ?? undefined,
        difficulty: difficulty ?? undefined,
        isActive: data.isActive,
      },
      passages: (data.passages ?? []).map((passage, index) => ({
        passageOrder: index + 1,
        passage: passage.passage,
        vietnameseTranslation: passage.translationVietnamese ?? undefined,
      })),
      questions,
    };

    console.log("[READING SAVE]", { mode: readingEditMode, payload });

    const mutateOptions = {
      onSuccess: () => {
        toast.success(
          readingEditMode === "create"
            ? "Reading lesson created successfully"
            : "Reading lesson updated successfully",
        );
        setShowReadingEditModal(false);
        setReadingSelectedLesson(null);
        readingQuery.refetch();
      },
      onError: (error: unknown) => {
        console.error("[READING SAVE ERROR]", error);
        const message =
          error instanceof Error
            ? error.message
            : readingEditMode === "create"
              ? "Failed to create reading lesson"
              : "Failed to update reading lesson";
        toast.error(message);
      },
    };

    if (readingEditMode === "create") {
      createReadingMutation.mutate(payload, mutateOptions);
    } else {
      updateReadingMutation.mutate(payload, mutateOptions);
    }
  };

  const getItemCount = (
    item: VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson | AdminReadingLesson,
  ): number => {
    if ("items" in item && Array.isArray(item.items)) return item.items.length;
    if ("segments" in item && Array.isArray(item.segments)) return item.segments.length;
    if ("questions" in item && Array.isArray(item.questions)) return item.questions.length;
    return 0;
  };

  if (!config) {
    return <div className="p-8 text-center text-muted-col text-sm">Invalid skill: {skill}</div>;
  }

  const SkillIcon = config.icon;

  return (
    <div className="space-y-5">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/admin/content-library/$level", params: { level } })}
            className="inline-flex items-center gap-2 text-sm text-muted-col hover:text-primary-col transition"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-black text-primary-col">
              {config.label} Library
            </h1>
            <p className="text-sm text-secondary-col mt-0.5">{upperLevel} Level</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-secondary-col hover:bg-[var(--accent)] transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import Excel
          </button>
          <button
            onClick={() => (skill === "reading" ? handleReadCreate() : setShowCreateModal(true))}
            className="px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Lesson
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${config.label.toLowerCase()} lessons...`}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--card)] text-primary-col placeholder:text-muted-col focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30"
        />
      </div>

      {/* Table (Match Question Bank style) */}
      {skill !== "reading" ? (
        <div className="card-base overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b separator">
            <div
              className={
                skill === "listening"
                  ? "col-span-1 text-left text-[10px] uppercase tracking-wider text-muted-col font-bold"
                  : "col-span-2 text-left text-[10px] uppercase tracking-wider text-muted-col font-bold"
              }
            >
              Lesson
            </div>
            <div
              className={
                skill === "listening"
                  ? "col-span-3 text-left text-[10px] uppercase tracking-wider text-muted-col font-bold"
                  : "col-span-4 text-left text-[10px] uppercase tracking-wider text-muted-col font-bold"
              }
            >
              Title
            </div>
            {skill === "listening" && (
              <div className="col-span-2 text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
                Audio File
              </div>
            )}
            {skill !== "shadowing" && skill !== "listening" && (
              <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
                Items
              </div>
            )}
            <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Status
            </div>
            <div className="col-span-2 text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Actions
            </div>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-[var(--accent)]/50 transition items-center"
              >
                <div
                  className={
                    skill === "listening"
                      ? "col-span-1 text-sm font-medium text-muted-col whitespace-nowrap"
                      : "col-span-2 text-sm font-medium text-muted-col whitespace-nowrap"
                  }
                >
                  #{(item as VocabularyLesson).lessonNumber || "-"}
                </div>
                <div className={skill === "listening" ? "col-span-3" : "col-span-4"}>
                  <div className="font-medium text-sm text-primary-col">{item.title}</div>
                </div>
                {skill === "listening" && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5 text-sm text-muted-col">
                      <Headphones className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {(item as ListeningLesson).items?.[0]?.audioUrl || "No audio"}
                      </span>
                    </div>
                  </div>
                )}
                {skill !== "shadowing" && skill !== "listening" && (
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-medium text-muted-col">{getItemCount(item)}</span>
                  </div>
                )}
                <div className="col-span-2 flex justify-center">
                  <StatusBadge status={(item as unknown as { status?: string }).status} />
                </div>
                <div className="col-span-2 flex justify-end items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition text-xs font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-muted-col">
                  No {config.label.toLowerCase()} content found{search ? " matching your search" : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Reading Backend Table ── */
        <div className="card-base overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b separator">
            <div className="col-span-1 text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Lesson #
            </div>
            <div className="col-span-3 text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Title
            </div>
            <div className="col-span-1 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              JLPT
            </div>
            <div className="col-span-1 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Difficulty
            </div>
            <div className="col-span-1 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Est. Min
            </div>
            <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Questions
            </div>
            <div className="col-span-1 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Status
            </div>
            <div className="col-span-2 text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Actions
            </div>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-[var(--border)]">
            {readingQuery.isLoading ? (
              <div className="px-5 py-12 text-center">
                <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-col mt-2">Loading reading lessons...</p>
              </div>
            ) : readingQuery.isError ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-red-500">Failed to load reading lessons.</p>
              </div>
            ) : backendFiltered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-muted-col">
                  No reading content found{search ? " matching your search" : ""}
                </p>
              </div>
            ) : (
              backendFiltered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-12 gap-3 px-5 py-4 hover:bg-emerald-500/5 transition items-center"
                >
                  <div className="col-span-1 text-sm font-medium text-muted-col whitespace-nowrap">
                    #{item.lessonNumber}
                  </div>
                  <div className="col-span-3">
                    <div className="font-medium text-sm text-primary-col">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-muted-col truncate mt-0.5">{item.description}</div>
                    )}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                      {item.jlptLevel}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs text-muted-col">
                      {item.difficulty || "-"}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs text-muted-col">
                      {item.estimatedMinutes != null ? `${item.estimatedMinutes}m` : "-"}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-medium text-muted-col">{item.questions.length}</span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <StatusBadge status={item.isActive ? "active" : "inactive"} />
                  </div>
                  <div className="col-span-2 flex justify-end items-center gap-1.5">
                    <button
                      onClick={() => handleReadView(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleReadEdit(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition text-xs font-medium"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleReadDelete(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-xs font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {item.isActive ? (
                      <button
                        onClick={() => handleReadUnpublish(item)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition text-xs font-medium"
                        title="Unpublish"
                      >
                        <CloudOff className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReadPublish(item)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition text-xs font-medium"
                        title="Publish"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
          setReadingSelectedLesson(null);
        }}
        onConfirm={
          skill === "reading" && readingSelectedLesson
            ? confirmReadDelete
            : handleDelete
        }
        title={skill === "reading" && readingSelectedLesson ? "Delete Reading Lesson" : "Delete Lesson"}
        message={
          skill === "reading" && readingSelectedLesson
            ? `Are you sure you want to delete "${readingSelectedLesson.title}"? This action cannot be undone.`
            : `Are you sure you want to delete "${selectedItem?.title}"? This action cannot be undone.`
        }
      />

      {/* Publish/Unpublish Confirmations */}
      <ConfirmDialog
        open={showPublishConfirm}
        onClose={() => {
          setShowPublishConfirm(false);
          setReadingSelectedLesson(null);
        }}
        onConfirm={confirmReadPublish}
        title="Publish Reading Lesson"
        message={`Are you sure you want to publish "${readingSelectedLesson?.title}"? It will become available to students.`}
      />

      <ConfirmDialog
        open={showUnpublishConfirm}
        onClose={() => {
          setShowUnpublishConfirm(false);
          setReadingSelectedLesson(null);
        }}
        onConfirm={confirmReadUnpublish}
        title="Unpublish Reading Lesson"
        message={`Are you sure you want to unpublish "${readingSelectedLesson?.title}"? It will no longer be available to students.`}
      />

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        title={`Edit ${config.label} Lesson`}
        size="xl"
      >
        {selectedItem && (
          <>
            {skill === "vocabulary" && (
              <VocabEditForm
                lesson={selectedItem as VocabularyLesson}
                onSave={handleUpdate}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
              />
            )}
            {skill === "grammar" && (
              <GrammarEditForm
                lesson={selectedItem as GrammarLesson}
                onSave={handleUpdate}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
              />
            )}
            {skill === "listening" && (
              <ListeningEditForm
                lesson={selectedItem as ListeningLesson}
                onSave={handleUpdate}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
              />
            )}
            {skill === "shadowing" && (
              <ShadowingEditForm
                item={selectedItem as ShadowingItem}
                onSave={handleUpdate}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
              />
            )}
          </>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Create ${config.label} Lesson`}
        size="xl"
      >
        {skill === "vocabulary" && (
          <VocabLessonForm onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />
        )}
        {skill === "grammar" && (
          <GrammarLessonForm onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />
        )}
        {skill === "listening" && (
          <ListeningLessonForm onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />
        )}
        {skill === "shadowing" && (
          <ShadowingLessonForm onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />
        )}
      </Modal>

      {/* Import Excel Modal */}
      <Modal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        title={`Import ${config.label} from Excel`}
        size="md"
      >
        <ExcelImportModal
          skill={skill}
          level={upperLevel}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      </Modal>

      {/* ── Reading Backend: Detail Modal ── */}
      <ReadingDetailModal
        open={showReadingDetailModal}
        onClose={() => {
          setShowReadingDetailModal(false);
          setReadingSelectedLesson(null);
          setReadingDetailId(null);
        }}
        lesson={(readingDetail ?? readingSelectedLesson) as AdminReadingLesson | null}
        isLoading={readingDetailQuery.isLoading}
        isError={readingDetailQuery.isError}
      />

      {/* ── Reading Backend: Create/Edit Modal ── */}
      <ReadingBackendEditForm
        open={showReadingEditModal}
        mode={readingEditMode}
        lesson={readingSelectedLesson}
        onSave={handleReadSave}
        onCancel={() => {
          setShowReadingEditModal(false);
          setReadingSelectedLesson(null);
        }}
        isSaving={createReadingMutation.isPending || updateReadingMutation.isPending}
      />
    </div>
  );
}

// ─── Reading Backend: Detail Modal ────────────────────────────────────────────

function ReadingDetailModal({
  open,
  onClose,
  lesson,
  isLoading,
  isError,
}: {
  open: boolean;
  onClose: () => void;
  lesson: AdminReadingLesson | null;
  isLoading: boolean;
  isError: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-4xl glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator shrink-0">
          <div>
            <h2 className="font-display font-bold text-primary-col text-base">
              {lesson?.title ?? "Reading Lesson Detail"}
            </h2>
            {lesson && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-col">JLPT {lesson.jlptLevel}</span>
                {lesson.difficulty && (
                  <>
                    <span className="text-xs text-muted-col">•</span>
                    <span className="text-xs text-muted-col">{lesson.difficulty}</span>
                  </>
                )}
                {lesson.estimatedMinutes != null && (
                  <>
                    <span className="text-xs text-muted-col">•</span>
                    <span className="text-xs text-muted-col">{lesson.estimatedMinutes} min</span>
                  </>
                )}
                <span className="text-xs text-muted-col">•</span>
                <StatusBadge status={lesson.isActive ? "active" : "inactive"} />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-col">Loading...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-red-500 text-sm">
              Failed to load reading lesson details.
            </div>
          ) : lesson ? (
            <div className="space-y-6">
              {lesson.description && (
                <div className="glass-card p-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-secondary-col">{lesson.description}</p>
                </div>
              )}

              <div className="glass-card p-4">
                <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide mb-2">
                  Passage
                </h3>
                <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
                  <p className="text-sm text-primary-col leading-relaxed whitespace-pre-wrap">
                    {lesson.passage}
                  </p>
                </div>
              </div>

              {lesson.vietnameseTranslation && (
                <div className="glass-card p-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide mb-2">
                    Vietnamese Translation
                  </h3>
                  <p className="text-sm text-secondary-col leading-relaxed">{lesson.vietnameseTranslation}</p>
                </div>
              )}

              {lesson.questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                    Questions ({lesson.questions.length})
                  </h3>
                  {lesson.questions.map((q: ReadingQuestion, qi: number) => (
                    <div
                      key={q.id || qi}
                      className="glass-card p-4 space-y-3 border-l-4 border-emerald-500"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {qi + 1}
                        </span>
                        <p className="text-sm font-medium text-primary-col">{q.question}</p>
                      </div>
                      <div className="space-y-1.5 ml-9">
                        {q.options.map((opt: string, oi: number) => (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                              oi === q.correctAnswer
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-medium"
                                : "bg-[var(--card)] border border-[var(--border)] text-secondary-col"
                            }`}
                          >
                            <span className="font-bold shrink-0">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            <span>{opt}</span>
                            {oi === q.correctAnswer && (
                              <span className="ml-auto text-emerald-600 font-semibold">Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="ml-9 mt-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="text-xs text-blue-600">
                            <span className="font-semibold">Explanation: </span>
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-col text-sm">
              No lesson data available.
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Reading Backend: Create/Edit Form ────────────────────────────────────────

function ReadingBackendEditForm({
  open,
  mode,
  lesson,
  onSave,
  onCancel,
  isSaving,
}: {
  open: boolean;
  mode: "create" | "edit";
  lesson: AdminReadingLesson | null;
  onSave: (data: AdminReadingLesson) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const createEmptyPassage = (): AdminReadingPassage => ({
    id: `passage-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: "",
    passage: "",
    translationVietnamese: "",
    questions: [],
  });

  const createEmptyQuestion = (): ReadingQuestion => ({
    id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });

  const [form, setForm] = useState<AdminReadingLesson>(() => {
    const initialPassages =
      !lesson || !lesson.passages || lesson.passages.length === 0
        ? [createEmptyPassage()]
        : lesson.passages.map((passage) => ({
            ...passage,
            questions: passage.questions.map((question) => ({ ...question })),
          }));

    return {
      id: lesson?.id ?? "",
      jlptLevel: lesson?.jlptLevel ?? "N5",
      lessonNumber: lesson?.lessonNumber ?? 1,
      title: lesson?.title ?? "",
      description: lesson?.description ?? null,
      passage: lesson?.passage ?? "",
      vietnameseTranslation: lesson?.vietnameseTranslation ?? null,
      estimatedMinutes: lesson?.estimatedMinutes ?? null,
      difficulty: lesson?.difficulty ?? null,
      isActive: lesson?.isActive ?? true,
      createdAt: lesson?.createdAt ?? new Date().toISOString(),
      updatedAt: lesson?.updatedAt ?? new Date().toISOString(),
      questions: lesson?.questions ?? [],
      passages: initialPassages,
    };
  });

  useEffect(() => {
    if (!lesson) return;

    const passages =
      lesson.passages && lesson.passages.length > 0
        ? lesson.passages.map((passage) => ({
            ...passage,
            questions: passage.questions.map((question) => ({ ...question })),
          }))
        : [
            {
              id: `passage-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: lesson.title,
              passage: lesson.passage,
              translationVietnamese: lesson.vietnameseTranslation ?? "",
              questions: lesson.questions.map((question) => ({ ...question })),
            },
          ];

    setForm({
      id: lesson.id,
      jlptLevel: lesson.jlptLevel,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      description: lesson.description,
      passage: lesson.passage,
      vietnameseTranslation: lesson.vietnameseTranslation,
      estimatedMinutes: lesson.estimatedMinutes,
      difficulty: lesson.difficulty,
      isActive: lesson.isActive,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      questions: lesson.questions,
      passages,
    });
  }, [lesson]);

  const updateField = <K extends keyof AdminReadingLesson>(key: K, value: AdminReadingLesson[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const addPassage = () => {
    setForm((f) => ({
      ...f,
      passages: [...f.passages ?? [], createEmptyPassage()],
    }));
  };

  const removePassage = (passageId: string) => {
    setForm((f) => ({
      ...f,
      passages: (f.passages ?? []).filter((passage) => passage.id !== passageId),
    }));
  };

  const updatePassage = (passageId: string, patch: Partial<AdminReadingPassage>) => {
    setForm((f) => ({
      ...f,
      passages: (f.passages ?? []).map((passage) =>
        passage.id === passageId ? { ...passage, ...patch } : passage,
      ),
    }));
  };

  const addQuestionToPassage = (passageId: string) => {
    setForm((f) => ({
      ...f,
      passages: (f.passages ?? []).map((passage) =>
        passage.id === passageId
          ? {
              ...passage,
              questions: [...passage.questions, createEmptyQuestion()],
            }
          : passage,
      ),
    }));
  };

  const removeQuestionFromPassage = (passageId: string, questionId: string) => {
    setForm((f) => ({
      ...f,
      passages: (f.passages ?? []).map((passage) =>
        passage.id === passageId
          ? {
              ...passage,
              questions: passage.questions.filter((question) => question.id !== questionId),
            }
          : passage,
      ),
    }));
  };

  const updateQuestionInPassage = (
    passageId: string,
    questionId: string,
    patch: Partial<ReadingQuestion>,
  ) => {
    setForm((f) => ({
      ...f,
      passages: (f.passages ?? []).map((passage) =>
        passage.id === passageId
          ? {
              ...passage,
              questions: passage.questions.map((question) =>
                question.id === questionId ? { ...question, ...patch } : question,
              ),
            }
          : passage,
      ),
    }));
  };

  const derivedQuestions = (form.passages ?? []).flatMap((passage) => passage.questions);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-4xl glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator shrink-0">
          <h2 className="font-display font-bold text-primary-col text-base">
            {mode === "create" ? "Create Reading Lesson" : "Edit Reading Lesson"}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">
          {/* Lesson Info */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary-col mb-1.5">
                  Lesson Number
                </label>
                <input
                  type="number"
                  value={form.lessonNumber}
                  onChange={(e) => updateField("lessonNumber", +e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                  min={1}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-secondary-col mb-1.5">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                  placeholder="Lesson title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-col mb-1.5">
                  Active
                </label>
                <select
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) => updateField("isActive", e.target.value === "active")}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-col mb-1.5">
                Description
              </label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => updateField("description", e.target.value || null)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition resize-y min-h-[80px]"
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary-col mb-1.5">
                  JLPT Level
                </label>
                <select
                  value={form.jlptLevel}
                  onChange={(e) => updateField("jlptLevel", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition cursor-pointer"
                >
                  {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-col mb-1.5">
                  Difficulty
                </label>
                <input
                  value={form.difficulty ?? ""}
                  onChange={(e) => updateField("difficulty", e.target.value || null)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                  placeholder="e.g. beginner"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-col mb-1.5">
                  Est. Minutes
                </label>
                <input
                  type="number"
                  value={form.estimatedMinutes ?? ""}
                  onChange={(e) => updateField("estimatedMinutes", e.target.value ? +e.target.value : null)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                  placeholder="e.g. 15"
                  min={1}
                />
              </div>
            </div>
          </div>

          {/* Reading Passages */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-primary-col">Reading Passages</h3>
                <p className="text-xs text-muted-col mt-0.5">
                  {(form.passages ?? []).length} passage{(form.passages ?? []).length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={addPassage}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition font-medium"
              >
                + Add Passage
              </button>
            </div>

            <div className="space-y-4">
              {(form.passages ?? []).map((passage, passageIndex) => (
                <div key={passage.id} className="glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600">
                      Passage {passageIndex + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-col">
                        {passage.questions.length} question{passage.questions.length === 1 ? "" : "s"}
                      </span>
                      {(form.passages ?? []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassage(passage.id)}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-secondary-col mb-1.5">
                        Passage Title
                      </label>
                      <input
                        value={passage.title}
                        onChange={(e) => updatePassage(passage.id, { title: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                        placeholder="Passage title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-secondary-col mb-1.5">
                        Japanese Passage
                      </label>
                      <textarea
                        value={passage.passage}
                        onChange={(e) => updatePassage(passage.id, { passage: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition resize-y min-h-[120px]"
                        placeholder="Paste Japanese reading passage here..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-secondary-col mb-1.5">
                        Vietnamese Translation
                      </label>
                      <textarea
                        value={passage.translationVietnamese}
                        onChange={(e) => updatePassage(passage.id, { translationVietnamese: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition resize-y min-h-[80px]"
                        placeholder="Vietnamese translation"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary-col">
                        Questions ({passage.questions.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => addQuestionToPassage(passage.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition font-medium"
                      >
                        + Add Question
                      </button>
                    </div>

                    {passage.questions.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-col">
                          No questions yet. Click "Add Question" to add one.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {passage.questions.map((question, questionIndex) => (
                          <div
                            key={question.id}
                            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-600">
                                Q{questionIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeQuestionFromPassage(passage.id, question.id)}
                                className="text-red-400 hover:text-red-600 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              value={question.question}
                              onChange={(e) =>
                                updateQuestionInPassage(passage.id, question.id, {
                                  question: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                              placeholder="Question text"
                            />
                            <div className="space-y-1.5">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-col font-bold w-4 shrink-0">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <input
                                    value={option}
                                    onChange={(e) =>
                                      updateQuestionInPassage(passage.id, question.id, {
                                        options: question.options.map((currentOption, currentIndex) =>
                                          currentIndex === optionIndex ? e.target.value : currentOption,
                                        ),
                                      })
                                    }
                                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuestionInPassage(passage.id, question.id, {
                                        correctAnswer: optionIndex,
                                      })
                                    }
                                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
                                      question.correctAnswer === optionIndex
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-[var(--border)]"
                                    }`}
                                    title="Set as correct answer"
                                  >
                                    {question.correctAnswer === optionIndex && (
                                      <span className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                            <input
                              value={question.explanation ?? ""}
                              onChange={(e) =>
                                updateQuestionInPassage(passage.id, question.id, {
                                  explanation: e.target.value || undefined,
                                })
                              }
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                              placeholder="Explanation (optional)"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={
              isSaving ||
              !form.title.trim() ||
              !(form.passages ?? []).some((passage) => passage.passage.trim())
            }
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : mode === "create" ? "Create Lesson" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
