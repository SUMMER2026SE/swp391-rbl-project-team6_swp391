import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AdminShadowingManagement } from "@/components/admin/AdminShadowingManagement";
import { AdminAiGenerateModal } from "@/components/admin/content-library/AdminAiGenerateModal";
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
  FileSpreadsheet,
  Sparkles,
  MoreHorizontal,
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
  type AdminListeningLesson,
  type AdminVocabularyLesson,
  type AdminVocabularyItem,
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
import {
  useFetchListeningLessons,
  useFetchListeningDetail,
  useCreateListeningLesson,
  useUpdateListeningLesson,
  useDeleteListeningLesson,
  usePublishListeningLesson,
  useUnpublishListeningLesson,
} from "@/services/adminListeningService";
import {
  useFetchVocabularyLessons,
  useFetchVocabularyDetail,
  useCreateVocabularyLesson,
  useUpdateVocabularyLesson,
  useDeleteVocabularyLesson,
  usePublishVocabularyLesson,
  useUnpublishVocabularyLesson,
} from "@/services/adminVocabularyService";
import { adminListeningApi, adminUploadApi } from "@/lib/api/listening";
import { AdminGrammarContentPage } from "@/components/admin/content-library/AdminGrammarContentPage";
import { adminGrammarApi, type GrammarLessonWithContentsRequest } from "@/lib/api/grammarContent";

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
        {/* Lesson Information - Simplified */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-sakura" />
            <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-4">
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

// ─── Audio Uploader Component ───────────────────────────────────────────────────

function AudioUploader({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      setError("Please upload an audio file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be less than 20MB");
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);

    try {
      const url = await adminUploadApi.uploadAudio(file, (p) => setProgress(p));
      onChange(url);
      setProgress(100);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload audio file";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary-col truncate">
            {value.split("/").pop() || "Audio file"}
          </p>
          <p className="text-xs text-muted-col">Audio uploaded</p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={disabled ? undefined : handleDragOver}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onClick={disabled ? undefined : () => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all
          ${disabled ? "opacity-50 cursor-not-allowed" : "border-[var(--border)] hover:border-sky-blue/50 hover:bg-sky-blue/5 cursor-pointer"}
          ${isDragging ? "border-sky-blue bg-sky-blue/10" : ""}
          ${isUploading ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          className="hidden"
        />
        {isUploading ? (
          <>
            <div className="w-10 h-10 rounded-xl bg-sky-blue/20 flex items-center justify-center mb-3 animate-pulse">
              <Upload className="w-5 h-5 text-sky-blue" />
            </div>
            <p className="text-sm text-primary-col">
              Uploading... {progress > 0 && progress < 100 ? `${progress}%` : ""}
            </p>
            {isUploading && progress > 0 && progress < 100 && (
              <div className="w-32 h-1 mt-2 bg-[var(--card)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-blue transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-sky-blue/20 flex items-center justify-center mb-3">
              <Headphones className="w-5 h-5 text-sky-blue" />
            </div>
            <p className="text-sm text-primary-col font-medium">Drop audio file here</p>
            <p className="text-xs text-muted-col mt-1">or click to browse</p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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

      {/* File Upload - Drag & Drop Style */}
      <div
        onClick={() => document.getElementById("excel-upload")?.click()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) setFile(f);
        }}
        onDragOver={(e) => e.preventDefault()}
        className={`
          relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all
          ${file ? "border-emerald-500/50 bg-emerald-500/5" : "border-[var(--border)] hover:border-sky-blue/50 hover:bg-sky-blue/5"}
        `}
      >
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-col truncate">{file.name}</p>
              <p className="text-xs text-muted-col">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-sky-blue/20 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-sky-blue" />
            </div>
            <p className="text-sm text-primary-col font-medium">Drop Excel file here</p>
            <p className="text-xs text-muted-col mt-1">or click to browse (.xlsx, .xls, .csv)</p>
          </>
        )}
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
  const { level, skill } = Route.useParams();

  if (skill === "grammar") {
    return <AdminGrammarContentPage level={level} />;
  }

  return <LegacySkillDetailPage />;
}

function LegacySkillDetailPage() {
  const { level, skill } = Route.useParams();
  const navigate = useNavigate();
  const upperLevel = level.toUpperCase() as JLPTLevel;
  const config = SKILL_CONFIG[skill];

  if (skill === "shadowing") {
    return (
      <div className="pb-12">
        <AdminShadowingManagement 
          defaultLevel={upperLevel} 
          onBack={() => navigate({ to: "/admin/content-library/$level", params: { level } })}
        />
      </div>
    );
  }

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

  // ── Grammar hooks for AI content ──
  const createGrammarMutation = useMutation({
    mutationFn: (data: GrammarLessonWithContentsRequest) => adminGrammarApi.createGrammarLesson(data),
    onSuccess: () => {
      toast.success("Grammar lesson created successfully");
      setShowGrammarEditModal(false);
      setGrammarDraftData(null);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create grammar lesson"),
  });

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
  const [showViewModal, setShowViewModal] = useState(false);
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

  const filtered = lessons.filter(
    (item): item is VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        ("title" in item && item.title?.toLowerCase().includes(s)) ||
        ("lessonNumber" in item && String((item as VocabularyLesson).lessonNumber).includes(s))
      );
    },
  );

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

  const handleView = (item: VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDeleteClick = (item: VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | ReadingLesson) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
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
        readingQuery.refetch();
      },
      onError: () => {
        toast.error("Failed to delete reading lesson");
        setShowDeleteConfirm(false);
      },
    });
  };

  const handleReadSave = (data: AdminReadingLesson) => {
    const firstPassage = (data.passages ?? []).find((passage) => passage.passage.trim());
    const mainPassage = firstPassage?.passage ?? data.passage ?? "";

    // Build passages with nested questions
    const passages = (data.passages ?? []).map((passage, index) => {
      let questionOrder = 1;
      const questions = (passage.questions ?? []).map((q) => {
        const order = questionOrder++;
        const isTempId = !q.id || q.id.startsWith("q-") || q.id.startsWith("temp-");
        return {
          ...(q.id && !isTempId ? { id: q.id } : {}),
          questionOrder: order,
          question: q.question,
          optionA: (q.options ?? [])[0] || "",
          optionB: (q.options ?? [])[1] || "",
          optionC: (q.options ?? [])[2] || "",
          optionD: (q.options ?? [])[3] || "",
          correctAnswer: (() => {
            const val = q.correctAnswer;
            if (typeof val === 'string' && /^[A-D]$/i.test(val)) {
              return val.toUpperCase();
            }
            const idx = typeof val === 'number' ? val : parseInt(String(val), 10);
            return isNaN(idx) ? 'A' : String.fromCharCode(65 + (idx % 4));
          })(),
          explanation: q.explanation,
        };
      });

      return {
        ...(passage.id && !passage.id.startsWith("passage-") && !passage.id.startsWith("temp-") ? { id: passage.id } : {}),
        passageOrder: index + 1,
        passage: passage.passage,
        questions,
      };
    });

    const payload = {
      lesson: {
        jlptLevel: readingEditMode === "create" ? upperLevel : readingSelectedLesson?.jlptLevel || upperLevel,
        lessonNumber: data.lessonNumber,
        title: data.title,
        description: data.description ?? undefined,
        passage: mainPassage,
        isActive: data.isActive,
      },
      passages,
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

  // ── Backend listening hooks (used only when skill === "listening") ──
  const listeningQuery = useFetchListeningLessons(upperLevel);
  const listeningLessons: AdminListeningLesson[] = (listeningQuery.data ?? []) as unknown as AdminListeningLesson[];

  const [listeningDetailId, setListeningDetailId] = useState<string | null>(null);
  // Use ref to always get the latest lessonId (fixes closure bug in mutation)
  const listeningDetailIdRef = useRef<string | null>(null);
  const listeningDetailQuery = useFetchListeningDetail(listeningDetailId ?? "");
  const listeningDetail: AdminListeningLesson | null =
    (listeningDetailQuery.data != null ? listeningDetailQuery.data : null) as AdminListeningLesson | null;

  // Update ref when detailId changes
  useEffect(() => {
    listeningDetailIdRef.current = listeningDetailId;
  }, [listeningDetailId]);

  const createListeningMutation = useCreateListeningLesson(upperLevel);
  const updateListeningMutation = useUpdateListeningLesson(upperLevel, listeningDetailId ?? "");
  const deleteListeningMutation = useDeleteListeningLesson(upperLevel);
  const publishListeningMutation = usePublishListeningLesson(upperLevel);
  const unpublishListeningMutation = useUnpublishListeningLesson(upperLevel);

  // ── Listening-specific modals & state ──
  const [showListeningDetailModal, setShowListeningDetailModal] = useState(false);
  const [showListeningEditModal, setShowListeningEditModal] = useState(false);
  const [listeningSelectedLesson, setListeningSelectedLesson] = useState<AdminListeningLesson | null>(null);
  const [listeningEditMode, setListeningEditMode] = useState<"create" | "edit" | "view" | undefined>("create");

  // Backend-driven listening lessons
  const listeningBackendFiltered = listeningLessons.filter((item) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(s) ||
      String(item.lessonNumber).includes(s) ||
      (item.jlptLevel?.toLowerCase().includes(s) ?? false) ||
      (item.difficulty?.toLowerCase().includes(s) ?? false)
    );
  });

  const handleListeningView = (lesson: AdminListeningLesson) => {
    setListeningSelectedLesson(lesson);
    setListeningDetailId(lesson.id);
    setListeningEditMode("view");
    setShowListeningDetailModal(true);
  };

  const handleListeningEdit = (lesson: AdminListeningLesson) => {
    setListeningSelectedLesson(lesson);
    setListeningDetailId(lesson.id);
    setListeningEditMode("edit");
    setShowListeningEditModal(true);
  };

  const handleListeningCreate = () => {
    setListeningSelectedLesson(null);
    setListeningDetailId(null);
    setListeningEditMode("create");
    setShowListeningEditModal(true);
  };

  const handleListeningDelete = (lesson: AdminListeningLesson) => {
    setListeningSelectedLesson(lesson);
    setShowDeleteConfirm(true);
  };

  const handleListeningPublish = (lesson: AdminListeningLesson) => {
    setListeningSelectedLesson(lesson);
    setShowPublishConfirm(true);
  };

  const handleListeningUnpublish = (lesson: AdminListeningLesson) => {
    setListeningSelectedLesson(lesson);
    setShowUnpublishConfirm(true);
  };

  const confirmListeningPublish = () => {
    if (!listeningSelectedLesson) return;
    publishListeningMutation.mutate(listeningSelectedLesson.id, {
      onSuccess: () => {
        toast.success("Listening lesson published successfully");
        setShowPublishConfirm(false);
        setListeningSelectedLesson(null);
      },
      onError: () => {
        toast.error("Failed to publish listening lesson");
        setShowPublishConfirm(false);
      },
    });
  };

  const confirmListeningUnpublish = () => {
    if (!listeningSelectedLesson) return;
    unpublishListeningMutation.mutate(listeningSelectedLesson.id, {
      onSuccess: () => {
        toast.success("Listening lesson unpublished successfully");
        setShowUnpublishConfirm(false);
        setListeningSelectedLesson(null);
      },
      onError: () => {
        toast.error("Failed to unpublish listening lesson");
        setShowUnpublishConfirm(false);
      },
    });
  };

  const confirmListeningDelete = () => {
    if (!listeningSelectedLesson) return;
    deleteListeningMutation.mutate(listeningSelectedLesson.id, {
      onSuccess: () => {
        toast.success("Listening lesson deleted successfully");
        setShowDeleteConfirm(false);
        setListeningSelectedLesson(null);
      },
      onError: () => {
        toast.error("Failed to delete listening lesson");
        setShowDeleteConfirm(false);
      },
    });
  };

  const handleListeningSave = (data: Partial<AdminListeningLesson>) => {
    const items = (data.listeningItems ?? []).map((q, idx) => ({
      id: q.id,
      questionOrder: idx + 1,
      audioUrl: q.audioUrl || "",
      question: q.question || "",
      optionA: q.optionA || "",
      optionB: q.optionB || "",
      optionC: q.optionC || "",
      optionD: q.optionD || "",
      correctAnswer: q.correctAnswer || "A",
      explanation: q.explanation ?? undefined,
    }));

    const payload = {
      lesson: {
        jlptLevel: listeningEditMode === "create" ? upperLevel : listeningSelectedLesson?.jlptLevel || upperLevel,
        lessonNumber: data.lessonNumber ?? listeningSelectedLesson?.lessonNumber ?? 1,
        title: data.title ?? listeningSelectedLesson?.title ?? "",
        description: data.description ?? listeningSelectedLesson?.description ?? undefined,
        transcript: data.transcript ?? listeningSelectedLesson?.transcript ?? undefined,
        isActive: data.isActive ?? listeningSelectedLesson?.isActive ?? true,
      },
      items,
    };

    console.log("[LISTENING SAVE]", { mode: listeningEditMode, payload });

    const mutateOptions = {
      onSuccess: () => {
        toast.success(
          listeningEditMode === "create"
            ? "Listening lesson created successfully"
            : "Listening lesson updated successfully",
        );
        setShowListeningEditModal(false);
        setShowCreateModal(false);
        setListeningEditMode(undefined);
        setListeningSelectedLesson(null);
        listeningQuery.refetch().catch(console.error);
      },
      onError: (error: unknown) => {
        console.error("[LISTENING SAVE ERROR]", error);
        const message =
          error instanceof Error
            ? error.message
            : listeningEditMode === "create"
              ? "Failed to create listening lesson"
              : "Failed to update listening lesson";
        toast.error(message);
      },
    };

    if (listeningEditMode === "create") {
      createListeningMutation.mutate(payload, mutateOptions);
    } else {
      // Get lessonId from selectedLesson (which is set when edit is clicked)
      const lessonId = listeningSelectedLesson?.id;
      if (!lessonId) {
        toast.error("No lesson selected for update");
        return;
      }
      adminListeningApi.updateListeningLesson(lessonId, payload)
        .then(() => {
          toast.success("Listening lesson updated successfully");
          setShowListeningEditModal(false);
          setListeningSelectedLesson(null);
          listeningQuery.refetch();
        })
        .catch((error: unknown) => {
          console.error("[LISTENING SAVE ERROR]", error);
          const message =
            error instanceof Error
              ? error.message
              : "Failed to update listening lesson";
          toast.error(message);
        });
    }
  };

  // ── Backend vocabulary hooks (used only when skill === "vocabulary") ──
  const vocabularyQuery = useFetchVocabularyLessons(upperLevel);
  const vocabularyLessons: AdminVocabularyLesson[] = (vocabularyQuery.data ?? []) as AdminVocabularyLesson[];

  const [vocabularyDetailId, setVocabularyDetailId] = useState<string | null>(null);
  const vocabularyDetailIdRef = useRef<string | null>(null);
  const vocabularyDetailQuery = useFetchVocabularyDetail(vocabularyDetailId ?? "");
  const vocabularyDetail: AdminVocabularyLesson | null =
    (vocabularyDetailQuery.data != null ? vocabularyDetailQuery.data : null) as AdminVocabularyLesson | null;

  useEffect(() => {
    vocabularyDetailIdRef.current = vocabularyDetailId;
  }, [vocabularyDetailId]);

  const createVocabularyMutation = useCreateVocabularyLesson(upperLevel);
  const updateVocabularyMutation = useUpdateVocabularyLesson(
    upperLevel,
    vocabularyDetailId ?? "",
  );
  const deleteVocabularyMutation = useDeleteVocabularyLesson(upperLevel);
  const publishVocabularyMutation = usePublishVocabularyLesson(upperLevel);
  const unpublishVocabularyMutation = useUnpublishVocabularyLesson(upperLevel);

  // ── Vocabulary-specific modals & state ──
  const [showVocabularyDetailModal, setShowVocabularyDetailModal] = useState(false);
  const [showVocabularyEditModal, setShowVocabularyEditModal] = useState(false);
  const [vocabularySelectedLesson, setVocabularySelectedLesson] =
    useState<AdminVocabularyLesson | null>(null);
  const [vocabularyEditMode, setVocabularyEditMode] = useState<
    "create" | "edit" | "view" | undefined
  >("create");

  // Backend-driven vocabulary lessons (search filter)
  const vocabularyBackendFiltered = vocabularyLessons.filter((item) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(s) ||
      String(item.lessonNumber).includes(s) ||
      (item.jlptLevel?.toLowerCase().includes(s) ?? false) ||
      (item.difficulty?.toLowerCase().includes(s) ?? false)
    );
  });

  const handleVocabularyView = (lesson: AdminVocabularyLesson) => {
    setVocabularySelectedLesson(lesson);
    setVocabularyDetailId(lesson.id);
    setVocabularyEditMode("view");
    setShowVocabularyDetailModal(true);
  };

  const handleVocabularyEdit = (lesson: AdminVocabularyLesson) => {
    setVocabularySelectedLesson(lesson);
    setVocabularyDetailId(lesson.id);
    setVocabularyEditMode("edit");
    setShowVocabularyEditModal(true);
  };

  const handleVocabularyCreate = () => {
    setVocabularySelectedLesson(null);
    setVocabularyDetailId(null);
    setVocabularyEditMode("create");
    setShowVocabularyEditModal(true);
  };

  const handleVocabularyDelete = (lesson: AdminVocabularyLesson) => {
    setVocabularySelectedLesson(lesson);
    setShowDeleteConfirm(true);
  };

  const handleVocabularyPublish = (lesson: AdminVocabularyLesson) => {
    setVocabularySelectedLesson(lesson);
    setShowPublishConfirm(true);
  };

  const handleVocabularyUnpublish = (lesson: AdminVocabularyLesson) => {
    setVocabularySelectedLesson(lesson);
    setShowUnpublishConfirm(true);
  };

  const confirmVocabularyPublish = () => {
    if (!vocabularySelectedLesson) return;
    publishVocabularyMutation.mutate(vocabularySelectedLesson.id, {
      onSuccess: () => {
        toast.success("Vocabulary lesson published successfully");
        setShowPublishConfirm(false);
        setVocabularySelectedLesson(null);
      },
      onError: () => {
        toast.error("Failed to publish vocabulary lesson");
        setShowPublishConfirm(false);
      },
    });
  };

  const confirmVocabularyUnpublish = () => {
    if (!vocabularySelectedLesson) return;
    unpublishVocabularyMutation.mutate(vocabularySelectedLesson.id, {
      onSuccess: () => {
        toast.success("Vocabulary lesson unpublished successfully");
        setShowUnpublishConfirm(false);
        setVocabularySelectedLesson(null);
      },
      onError: () => {
        toast.error("Failed to unpublish vocabulary lesson");
        setShowUnpublishConfirm(false);
      },
    });
  };

  const confirmVocabularyDelete = () => {
    if (!vocabularySelectedLesson) return;
    deleteVocabularyMutation.mutate(vocabularySelectedLesson.id, {
      onSuccess: () => {
        toast.success("Vocabulary lesson deleted successfully");
        setShowDeleteConfirm(false);
        setVocabularySelectedLesson(null);
      },
      onError: () => {
        toast.error("Failed to delete vocabulary lesson");
        setShowDeleteConfirm(false);
      },
    });
  };

  const handleVocabularySave = (data: Partial<AdminVocabularyLesson>) => {
    const items = (data.items ?? []).map((item, idx) => {
      const isTempId = !item.id || item.id.startsWith("temp-");
      return {
        ...(item.id && !isTempId ? { id: item.id } : {}),
        itemOrder: item.itemOrder || idx + 1,
        japanese: item.japanese,
        furigana: item.furigana ?? undefined,
        romaji: item.romaji ?? undefined,
        meaning: item.meaning,
        exampleSentence: item.exampleSentence ?? undefined,
        exampleTranslation: item.exampleTranslation ?? undefined,
        partOfSpeech: item.partOfSpeech ?? undefined,
      };
    });

    const payload = {
      lesson: {
        jlptLevel:
          vocabularyEditMode === "create"
            ? upperLevel
            : vocabularySelectedLesson?.jlptLevel || upperLevel,
        lessonNumber: data.lessonNumber ?? vocabularySelectedLesson?.lessonNumber ?? 1,
        title: data.title ?? vocabularySelectedLesson?.title ?? "",
        description: data.description ?? undefined,
        estimatedMinutes: data.estimatedMinutes ?? undefined,
        difficulty: data.difficulty ?? undefined,
        isActive: data.isActive ?? vocabularySelectedLesson?.isActive ?? true,
      },
      items,
    };

    const mutateOptions = {
      onSuccess: () => {
        toast.success(
          vocabularyEditMode === "create"
            ? "Vocabulary lesson created successfully"
            : "Vocabulary lesson updated successfully",
        );
        setShowVocabularyEditModal(false);
        setVocabularySelectedLesson(null);
        setShowCreateModal(false);
        vocabularyQuery.refetch().catch(console.error);
      },
      onError: (error: unknown) => {
        console.error("[VOCABULARY SAVE ERROR]", error);
        const message =
          error instanceof Error
            ? error.message
            : vocabularyEditMode === "create"
              ? "Failed to create vocabulary lesson"
              : "Failed to update vocabulary lesson";
        toast.error(message);
      },
    };

    if (vocabularyEditMode === "create") {
      createVocabularyMutation.mutate(payload, mutateOptions);
    } else {
      const lessonId = vocabularyDetailIdRef.current ?? vocabularySelectedLesson?.id;
      if (!lessonId) {
        toast.error("No lesson selected for update");
        return;
      }
      updateVocabularyMutation.mutate(payload, mutateOptions);
    }
  };

  const [showAiModal, setShowAiModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMoreMenu]);

  const handleApplyAiDraft = (draft: {
    title: string;
    description: string;
    lessonNumber?: number;
    vocabularyDraft?: any;
    grammarDraft?: any;
    readingDraft?: any;
  }) => {
    if (skill === "vocabulary" && draft.vocabularyDraft) {
      const draftItems = draft.vocabularyDraft.items || [];
      const items = draftItems.map((item: any, idx: number) => ({
        id: `temp-${idx + 1}`,
        itemOrder: idx + 1,
        japanese: item.japanese || "",
        furigana: item.furigana || "",
        romaji: item.romaji || "",
        meaning: item.meaning || "",
        exampleSentence: item.exampleSentence || "",
        exampleTranslation: item.exampleTranslation || "",
        partOfSpeech: item.partOfSpeech || "",
      }));

      handleVocabularySave({
        title: draft.title || "AI Generated Vocabulary Lesson",
        description: draft.description || "",
        lessonNumber: draft.lessonNumber || (vocabularyLessons.length || 0) + 1,
        isActive: false, // Default status: DRAFT (isActive: false)
        items: items,
      });
    } else if (skill === "grammar" && draft.grammarDraft) {
      // Apply grammar draft
      const draftItems = draft.grammarDraft.items || [];
      const contents = draftItems.map((item: any, idx: number) => ({
        contentOrder: idx + 1,
        pattern: item.grammarPoint || "",
        meaning: item.meaningVietnamese || "",
        structure: item.meaningJapanese || "",
        usage: item.explanation || "",
        examples: item.exampleSentence ? [{
          exampleOrder: 1,
          japanese: item.exampleSentence,
          vietnameseMeaning: item.notes || "",
        }] : [],
      }));

      const payload: GrammarLessonWithContentsRequest = {
        lesson: {
          jlptLevel: upperLevel,
          lessonNumber: draft.lessonNumber || 1,
          title: draft.title || "AI Generated Grammar Lesson",
          description: draft.description || "",
          isActive: false,
        },
        contents: contents,
      };

      createGrammarMutation.mutate(payload);
    } else if (skill === "reading" && draft.readingDraft) {
      const passages = (draft.readingDraft.passages || []).map((p: any, pIdx: number) => ({
        id: `temp-p-${pIdx + 1}`,
        passageOrder: pIdx + 1,
        title: p.title || `Passage ${pIdx + 1}`,
        content: p.content || "",
        questions: (p.questions || []).map((q: any, qIdx: number) => ({
          id: `temp-q-${pIdx}-${qIdx}`,
          questionOrder: qIdx + 1,
          question: q.questionText || "",
          explanation: q.explanation || "",
          optionA: q.options?.[0]?.optionText || "",
          optionB: q.options?.[1]?.optionText || "",
          optionC: q.options?.[2]?.optionText || "",
          optionD: q.options?.[3]?.optionText || "",
          correctAnswer: q.options?.findIndex((o: any) => o.isCorrect) === 1 ? "B" :
                         q.options?.findIndex((o: any) => o.isCorrect) === 2 ? "C" :
                         q.options?.findIndex((o: any) => o.isCorrect) === 3 ? "D" : "A",
        })),
      }));

      handleReadSave({
        title: draft.title || "AI Generated Reading Lesson",
        description: draft.description || "",
        lessonNumber: draft.lessonNumber || (readingLessons.length || 0) + 1,
        isActive: false, // Default status: DRAFT
        passages: passages,
      });
    }
  };

  // Grammar draft data state for AI-generated content
  const [grammarDraftData, setGrammarDraftData] = useState<any>(null);
  const [showGrammarEditModal, setShowGrammarEditModal] = useState(false);

  const getItemCount = (
    item:
      | VocabularyLesson
      | GrammarLesson
      | ListeningLesson
      | ShadowingItem
      | ReadingLesson
      | AdminReadingLesson
      | AdminVocabularyLesson,
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
          {(skill === "vocabulary" || skill === "reading" || skill === "grammar") && (
            <button
              onClick={() => setShowAiModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
          )}
          <button
            onClick={() =>
              skill === "reading"
                ? handleReadCreate()
                : skill === "listening"
                  ? handleListeningCreate()
                  : skill === "vocabulary"
                    ? handleVocabularyCreate()
                    : setShowCreateModal(true)
            }
            className="px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Manually
          </button>
          {/* More Actions Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-secondary-col hover:bg-[var(--accent)] transition flex items-center gap-1"
            >
              <MoreHorizontal className="w-5 h-5" />
              <ChevronDown className={`w-4 h-4 transition-transform ${showMoreMenu ? "rotate-180" : ""}`} />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl z-50 py-1 overflow-hidden">
                <button
                  onClick={() => {
                    setShowImportModal(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-primary-col hover:bg-[var(--accent)] transition flex items-center gap-3"
                >
                  <Upload className="w-4 h-4 text-emerald-500" />
                  Import Excel
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-primary-col hover:bg-[var(--accent)] transition flex items-center gap-3"
                >
                  <Download className="w-4 h-4 text-sky-500" />
                  Download Template
                </button>
                <div className="border-t border-[var(--border)] my-1" />
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-primary-col hover:bg-[var(--accent)] transition flex items-center gap-3"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  Export Data
                </button>
              </div>
            )}
          </div>
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
      {skill === "reading" || skill === "listening" || skill === "vocabulary" ? (
        /* ── Backend-driven Table (Reading, Listening, Vocabulary) ── */
        <div className="card-base overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_auto] gap-4 px-5 py-3 border-b separator items-center">
            <div className="text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Lesson #
            </div>
            <div className="text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Title
            </div>
            <div className="text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Actions
            </div>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-[var(--border)]">
            {skill === "reading" ? (
              readingQuery.isLoading ? (
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
                    className="grid grid-cols-[60px_1fr_auto] gap-4 px-5 py-4 hover:bg-emerald-500/5 transition items-center"
                  >
                    <div className="text-sm font-medium text-muted-col whitespace-nowrap">
                      #{item.lessonNumber}
                    </div>
                    <div className="font-medium text-sm text-primary-col">{item.title}</div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReadEdit(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition text-xs font-medium"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleReadDelete(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )
            ) : skill === "listening" ? (
              listeningQuery.isLoading ? (
                <div className="px-5 py-12 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-col mt-2">Loading listening lessons...</p>
                </div>
              ) : listeningQuery.isError ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-red-500">Failed to load listening lessons.</p>
                </div>
              ) : listeningBackendFiltered.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-muted-col">
                    No listening content found{search ? " matching your search" : ""}
                  </p>
                </div>
              ) : (
                listeningBackendFiltered.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-[60px_1fr_auto] gap-4 px-5 py-4 hover:bg-emerald-500/5 transition items-center"
                  >
                    <div className="text-sm font-medium text-muted-col whitespace-nowrap">
                      #{item.lessonNumber}
                    </div>
                    <div className="font-medium text-sm text-primary-col">{item.title}</div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleListeningEdit(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition text-xs font-medium"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleListeningDelete(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )
            ) : skill === "vocabulary" ? (
              vocabularyQuery.isLoading ? (
                <div className="px-5 py-12 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-col mt-2">Loading vocabulary lessons...</p>
                </div>
              ) : vocabularyQuery.isError ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-red-500">Failed to load vocabulary lessons.</p>
                </div>
              ) : vocabularyBackendFiltered.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-muted-col">
                    No vocabulary content found{search ? " matching your search" : ""}
                  </p>
                </div>
              ) : (
                vocabularyBackendFiltered.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-[60px_1fr_auto] gap-4 px-5 py-4 hover:bg-sakura/5 transition items-center"
                  >
                    <div className="text-sm font-medium text-muted-col whitespace-nowrap">
                      #{item.lessonNumber}
                    </div>
                    <div className="font-medium text-sm text-primary-col">{item.title}</div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleVocabularyEdit(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition text-xs font-medium"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleVocabularyDelete(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )
            ) : null}
          </div>
        </div>
      ) : (
        /* ── Mock Data Tables (grammar, shadowing) ── */
        <div className="card-base overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3 border-b separator items-center">
            <div className="text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Lesson
            </div>
            <div className="text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Actions
            </div>
          </div>
          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-muted-col">No lessons found for this level and skill.</p>
              </div>
            ) : (
              filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 items-center hover:bg-[var(--accent)] transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-col font-medium">#{"lessonNumber" in item ? (item as VocabularyLesson | GrammarLesson | ListeningLesson | ReadingLesson).lessonNumber : "—"}</span>
                    <span className="text-sm font-semibold text-primary-col">{item.title}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition text-xs font-medium"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition text-xs font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
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
          setListeningSelectedLesson(null);
          setVocabularySelectedLesson(null);
        }}
        onConfirm={
          skill === "reading" && readingSelectedLesson
            ? confirmReadDelete
            : skill === "listening" && listeningSelectedLesson
              ? confirmListeningDelete
              : skill === "vocabulary" && vocabularySelectedLesson
                ? confirmVocabularyDelete
                : handleDelete
        }
        title={
          skill === "reading" && readingSelectedLesson
            ? "Delete Reading Lesson"
            : skill === "listening" && listeningSelectedLesson
              ? "Delete Listening Lesson"
              : skill === "vocabulary" && vocabularySelectedLesson
                ? "Delete Vocabulary Lesson"
                : "Delete Lesson"
        }
        message={
          skill === "reading" && readingSelectedLesson
            ? `Are you sure you want to delete "${readingSelectedLesson.title}"? This action cannot be undone.`
            : skill === "listening" && listeningSelectedLesson
              ? `Are you sure you want to delete "${listeningSelectedLesson.title}"? This action cannot be undone.`
              : skill === "vocabulary" && vocabularySelectedLesson
                ? `Are you sure you want to delete "${vocabularySelectedLesson.title}"? This action cannot be undone.`
                : `Are you sure you want to delete "${selectedItem?.title}"? This action cannot be undone.`
        }
      />

      {/* Publish/Unpublish Confirmations */}
      <ConfirmDialog
        open={showPublishConfirm}
        onClose={() => {
          setShowPublishConfirm(false);
          setReadingSelectedLesson(null);
          setListeningSelectedLesson(null);
          setVocabularySelectedLesson(null);
        }}
        onConfirm={
          skill === "reading" && readingSelectedLesson
            ? confirmReadPublish
            : skill === "listening" && listeningSelectedLesson
              ? confirmListeningPublish
              : skill === "vocabulary" && vocabularySelectedLesson
                ? confirmVocabularyPublish
                : confirmReadPublish
        }
        title={
          skill === "reading" && readingSelectedLesson
            ? "Publish Reading Lesson"
            : skill === "listening" && listeningSelectedLesson
              ? "Publish Listening Lesson"
              : skill === "vocabulary" && vocabularySelectedLesson
                ? "Publish Vocabulary Lesson"
                : "Publish Lesson"
        }
        message={
          skill === "reading" && readingSelectedLesson
            ? `Are you sure you want to publish "${readingSelectedLesson?.title}"? It will become available to students.`
            : skill === "listening" && listeningSelectedLesson
              ? `Are you sure you want to publish "${listeningSelectedLesson?.title}"? It will become available to students.`
              : skill === "vocabulary" && vocabularySelectedLesson
                ? `Are you sure you want to publish "${vocabularySelectedLesson?.title}"? It will become available to students.`
                : ""
        }
      />

      <ConfirmDialog
        open={showUnpublishConfirm}
        onClose={() => {
          setShowUnpublishConfirm(false);
          setReadingSelectedLesson(null);
          setListeningSelectedLesson(null);
          setVocabularySelectedLesson(null);
        }}
        onConfirm={
          skill === "reading" && readingSelectedLesson
            ? confirmReadUnpublish
            : skill === "listening" && listeningSelectedLesson
              ? confirmListeningUnpublish
              : skill === "vocabulary" && vocabularySelectedLesson
                ? confirmVocabularyUnpublish
                : confirmReadUnpublish
        }
        title={
          skill === "reading" && readingSelectedLesson
            ? "Unpublish Reading Lesson"
            : skill === "listening" && listeningSelectedLesson
              ? "Unpublish Listening Lesson"
              : skill === "vocabulary" && vocabularySelectedLesson
                ? "Unpublish Vocabulary Lesson"
                : "Unpublish Lesson"
        }
        message={
          skill === "reading" && readingSelectedLesson
            ? `Are you sure you want to unpublish "${readingSelectedLesson?.title}"? It will no longer be available to students.`
            : skill === "listening" && listeningSelectedLesson
              ? `Are you sure you want to unpublish "${listeningSelectedLesson?.title}"? It will no longer be available to students.`
              : skill === "vocabulary" && vocabularySelectedLesson
                ? `Are you sure you want to unpublish "${vocabularySelectedLesson?.title}"? It will no longer be available to students.`
                : ""
        }
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
        lesson={(readingDetail ?? readingSelectedLesson) as AdminReadingLesson | null}
        onSave={handleReadSave}
        onCancel={() => {
          setShowReadingEditModal(false);
          setReadingSelectedLesson(null);
        }}
        isSaving={createReadingMutation.isPending || updateReadingMutation.isPending}
        isLoading={readingDetailQuery.isLoading && readingEditMode === "edit"}
      />

      {/* ── Listening Backend: Detail Modal ── */}
      <ListeningDetailModal
        open={showListeningDetailModal}
        onClose={() => {
          setShowListeningDetailModal(false);
          setListeningSelectedLesson(null);
          setListeningDetailId(null);
          setListeningEditMode(undefined);
        }}
        lesson={(listeningDetail ?? listeningSelectedLesson)}
        isLoading={listeningDetailQuery.isLoading}
        isError={listeningDetailQuery.isError}
      />

      {/* ── Listening Backend: Create/Edit Modal ── */}
      <ListeningBackendEditForm
        open={showListeningEditModal}
        mode={listeningEditMode}
        lesson={listeningDetail ?? listeningSelectedLesson}
        onSave={handleListeningSave}
        onCancel={() => {
          setShowListeningEditModal(false);
          setListeningSelectedLesson(null);
          setListeningDetailId(null);
          setListeningEditMode(undefined);
        }}
      />

      {/* ── Vocabulary Backend: Detail Modal ── */}
      <VocabularyDetailModal
        open={showVocabularyDetailModal}
        onClose={() => {
          setShowVocabularyDetailModal(false);
          setVocabularySelectedLesson(null);
          setVocabularyDetailId(null);
          setVocabularyEditMode(undefined);
        }}
        lesson={vocabularyDetail ?? vocabularySelectedLesson}
        isLoading={vocabularyDetailQuery.isLoading}
        isError={vocabularyDetailQuery.isError}
      />

      {/* ── Vocabulary Backend: Create/Edit Modal ── */}
      <VocabularyBackendEditForm
        open={showVocabularyEditModal}
        mode={vocabularyEditMode}
        lesson={vocabularyDetail ?? vocabularySelectedLesson}
        onSave={handleVocabularySave}
        onCancel={() => {
          setShowVocabularyEditModal(false);
          setVocabularySelectedLesson(null);
          setVocabularyDetailId(null);
          setVocabularyEditMode(undefined);
        }}
      />

      {/* AI Generate Modal */}
      {(skill === "vocabulary" || skill === "reading" || skill === "grammar") && (
        <AdminAiGenerateModal
          open={showAiModal}
          onClose={() => setShowAiModal(false)}
          skillType={skill.toUpperCase() as "VOCABULARY" | "GRAMMAR" | "READING"}
          currentLevel={upperLevel}
          onApplyDraft={handleApplyAiDraft}
        />
      )}
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

  // Transform API response to component format
  const transformedLesson = lesson ? {
    ...lesson,
    questions: (lesson.questions ?? []).map((q) => {
      // Check if options is already an array (form format) or needs conversion (API format)
      if (Array.isArray(q.options)) {
        return q;
      }
      // Convert API format (optionA, optionB, optionC, optionD) to array format
      return {
        ...q,
        options: [
          (q as any).optionA ?? "",
          (q as any).optionB ?? "",
          (q as any).optionC ?? "",
          (q as any).optionD ?? "",
        ],
        correctAnswer: typeof q.correctAnswer === 'string'
          ? ['A', 'B', 'C', 'D'].indexOf((q.correctAnswer as string).toUpperCase())
          : (q.correctAnswer ?? 0),
      };
    }),
  } : null;

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
          ) : transformedLesson ? (
            <div className="space-y-6">
              {transformedLesson.description && (
                <div className="glass-card p-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-secondary-col">{transformedLesson.description}</p>
                </div>
              )}

              <div className="glass-card p-4">
                <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide mb-2">
                  Passage
                </h3>
                <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
                  <p className="text-sm text-primary-col leading-relaxed whitespace-pre-wrap">
                    {transformedLesson.passage}
                  </p>
                </div>
              </div>



                  {transformedLesson.questions?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                    Questions ({transformedLesson.questions?.length ?? 0})
                  </h3>
                  {(transformedLesson.questions ?? []).map((q: ReadingQuestion, qi: number) => (
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
  isLoading,
}: {
  open: boolean;
  mode: "create" | "edit";
  lesson: AdminReadingLesson | null;
  onSave: (data: AdminReadingLesson) => void;
  onCancel: () => void;
  isSaving: boolean;
  isLoading?: boolean;
}) {
  // Show loading state while fetching lesson detail
  if (isLoading && mode === "edit") {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="glass-modal rounded-2xl p-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-center mt-4 text-sm text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

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

  const transformQuestion = (q: any): ReadingQuestion => ({
    id: q.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    question: q.question || "",
    options: Array.isArray(q.options) ? q.options : [q.optionA ?? "", q.optionB ?? "", q.optionC ?? "", q.optionD ?? ""],
    correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : (typeof q.correctAnswer === 'string' && /^[A-D]$/i.test(q.correctAnswer) ? ['A','B','C','D'].indexOf(q.correctAnswer.toUpperCase()) : 0),
    explanation: q.explanation || "",
  });

  const [form, setForm] = useState<AdminReadingLesson>(() => {
    // Build passages from either:
    // 1. lesson.passages (if exists) - new format
    // 2. lesson.questions (if exists) - create one passage with all questions
    // 3. empty - create one empty passage
    
    let initialPassages: AdminReadingPassage[];
    
    if (lesson?.passages && lesson.passages.length > 0) {
      // Use existing passages
      initialPassages = lesson.passages.map((passage) => ({
        ...passage,
        questions: (passage.questions ?? []).map(transformQuestion),
      }));
    } else if (lesson?.questions && lesson.questions.length > 0) {
      // API returns flat questions - create one passage with all questions
      initialPassages = [{
        id: `passage-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: lesson.title || "",
        passage: lesson.passage || "",
        translationVietnamese: lesson.vietnameseTranslation || "",
        questions: lesson.questions.map(transformQuestion),
      }];
    } else {
      // No data - create one empty passage
      initialPassages = [createEmptyPassage()];
    }

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
      questions: [], // Not used when passages exist
      passages: initialPassages,
    };
  });

  useEffect(() => {
    if (!lesson) return;

    let passages: AdminReadingPassage[];
    
    if (lesson.passages && lesson.passages.length > 0) {
      passages = lesson.passages.map((passage) => ({
        ...passage,
        questions: (passage.questions ?? []).map(transformQuestion),
      }));
    } else if (lesson.questions && lesson.questions.length > 0) {
      passages = [{
        id: `passage-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: lesson.title || "",
        passage: lesson.passage || "",
        translationVietnamese: lesson.vietnameseTranslation || "",
        questions: lesson.questions.map(transformQuestion),
      }];
    } else {
      passages = [createEmptyPassage()];
    }

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
      questions: [], // Not used when passages exist
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
              questions: (passage.questions ?? []).map((question) =>
                question.id === questionId ? { ...question, ...patch } : question,
              ),
            }
          : passage,
      ),
    }));
  };

  const derivedQuestions = (form.passages ?? []).flatMap((passage) => passage.questions ?? []);

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
          {/* Lesson Info - Simplified */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4">
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
              <div>
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
                        {(passage.questions?.length ?? 0)} question{(passage.questions?.length ?? 0) === 1 ? "" : "s"}
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
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary-col">
                        Questions ({passage.questions?.length ?? 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => addQuestionToPassage(passage.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition font-medium"
                      >
                        + Add Question
                      </button>
                    </div>

                    {(passage.questions?.length ?? 0) === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-col">
                          No questions yet. Click "Add Question" to add one.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(passage.questions ?? []).map((question, questionIndex) => (
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
                              {(question.options ?? []).map((option, optionIndex) => (
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

// ─── Listening Backend: Detail Modal ───────────────────────────────────────────

function ListeningDetailModal({
  open,
  onClose,
  lesson,
  isLoading,
  isError,
}: {
  open: boolean;
  onClose: () => void;
  lesson: AdminListeningLesson | null;
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
              {lesson?.title ?? "Listening Lesson Detail"}
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
              <div className="inline-block w-6 h-6 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-col">Loading...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-red-500 text-sm">
              Failed to load listening lesson details.
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

              {lesson.listeningItems?.length > 0 && (
                <div className="glass-card p-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide mb-3">
                    Audio Files
                  </h3>
                  <div className="space-y-3">
                    {lesson.listeningItems.map((it, idx) => (
                      <div key={it.id || idx} className="space-y-1">
                        <p className="text-xs text-muted-col">
                          Item {idx + 1}
                          {it.audioUrl ? "" : " (no audio)"}
                        </p>
                        {it.audioUrl && (
                          <audio
                            controls
                            preload="metadata"
                            src={it.audioUrl}
                            className="w-full h-9 rounded-lg"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lesson.transcript && (
                <div className="glass-card p-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide mb-2">
                    Japanese Transcript
                  </h3>
                  <p className="text-sm text-primary-col leading-relaxed whitespace-pre-wrap bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
                    {lesson.transcript}
                  </p>
                </div>
              )}

              {(lesson.listeningItems?.length ?? 0) > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                    Listening Items ({lesson.listeningItems?.length ?? 0})
                  </h3>
                  {lesson.listeningItems.map((q, qi) => (
                    <div
                      key={q.id || qi}
                      className="glass-card p-4 space-y-3 border-l-4 border-sky-blue"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-md bg-sky-blue/15 text-sky-blue text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {qi + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary-col">
                            {q.question || "No question text"}
                          </p>
                          {q.audioUrl && (
                            <audio
                              controls
                              preload="metadata"
                              src={q.audioUrl}
                              className="w-full h-9 mt-2 rounded-lg"
                            />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 ml-9">
                        {(["A", "B", "C", "D"] as const).map((opt) => {
                          const optValue =
                            q[`option${opt}` as "optionA" | "optionB" | "optionC" | "optionD"];
                          const isCorrect = q.correctAnswer === opt;
                          return (
                            <div
                              key={opt}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                                isCorrect
                                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-medium"
                                  : "bg-[var(--card)] border border-[var(--border)] text-secondary-col"
                              }`}
                            >
                              <span className="font-bold shrink-0">{opt}.</span>
                              <span>{optValue || "No option"}</span>
                              {isCorrect && (
                                <span className="ml-auto text-emerald-600 font-semibold">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
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

// ─── Listening Backend: Edit Modal ────────────────────────────────────────────

function ListeningBackendEditForm({
  open,
  mode,
  lesson,
  onSave,
  onCancel,
}: {
  open: boolean;
  mode: "create" | "edit" | "view" | undefined;
  lesson: AdminListeningLesson | null;
  onSave: (data: Partial<AdminListeningLesson>) => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const [form, setForm] = useState({
    lessonNumber: lesson?.lessonNumber || 1,
    title: lesson?.title || "",
    description: lesson?.description || "",
    transcript: lesson?.transcript || "",
    estimatedMinutes: lesson?.estimatedMinutes || "",
    difficulty: lesson?.difficulty || "",
    status: (lesson?.isActive ?? true) ? "active" : "inactive",
    listeningItems: [...(lesson?.listeningItems || [])] as AdminListeningLesson["listeningItems"],
  });

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  const addItem = () => {
    const newItem: AdminListeningLesson["listeningItems"][number] = {
      id: `temp-${Date.now()}`,
      questionOrder: form.listeningItems.length + 1,
      audioUrl: "",
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
      explanation: null,
    };
    setForm((f) => ({ ...f, listeningItems: [...f.listeningItems, newItem] }));
  };

  const updateItem = (index: number, field: string, value: string | number | null) => {
    setForm((f) => {
      const listeningItems = f.listeningItems.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      );
      return { ...f, listeningItems };
    });
  };

  const removeItem = (index: number) => {
    setForm((f) => {
      const listeningItems = f.listeningItems
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, questionOrder: i + 1 }));
      return { ...f, listeningItems };
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setForm((f) => {
      const next = [...f.listeningItems];
      const target = index + direction;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      const listeningItems = next.map((q, i) => ({ ...q, questionOrder: i + 1 }));
      return { ...f, listeningItems };
    });
  };

  const handleSave = () => {
    onSave({
      ...form,
      id: lesson?.id || "",
      isActive: form.status === "active",
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
      description: form.description || null,
      transcript: form.transcript || null,
      difficulty: form.difficulty || null,
    });
  };

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
              {mode === "create" ? "Create" : "Edit"} Listening Lesson
            </h2>
            {lesson?.title && (
              <p className="text-xs text-muted-col mt-0.5">{lesson.title}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          <div className="space-y-6">
            {/* Lesson Information - Simplified */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Headphones className="w-4 h-4 text-sky-blue" />
                <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-4">
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
                    disabled={isViewMode}
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
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            {/* Listening Items */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary-col">Listening Items</h3>
                  <p className="text-xs text-muted-col mt-0.5">
                    {form.listeningItems.length} item{form.listeningItems.length !== 1 ? "s" : ""} — each item has its own audio
                  </p>
                </div>
                {!isViewMode && (
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Listening Item
                  </button>
                )}
              </div>

              {form.listeningItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-col">
                    No listening items yet. Add at least one to publish the lesson.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.listeningItems.map((q, i) => (
                    <div
                      key={q.id}
                      className="rounded-lg border border-[var(--border)] overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-[var(--accent)]/40">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-sky-blue/15 text-sky-blue text-xs font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium text-primary-col">
                              {q.question || `Item ${i + 1}`}
                            </span>
                          </div>
                          {!isViewMode && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveItem(i, -1)}
                                disabled={i === 0}
                                className="p-1 rounded-md text-muted-col hover:bg-[var(--accent)] disabled:opacity-30"
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveItem(i, 1)}
                                disabled={i === form.listeningItems.length - 1}
                                className="p-1 rounded-md text-muted-col hover:bg-[var(--accent)] disabled:opacity-30"
                                title="Move down"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(i)}
                                className="p-1 rounded-md text-red-500 hover:bg-red-500/10"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-4 space-y-3 bg-[var(--card)]">
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Audio</label>
                          <AudioUploader
                            value={q.audioUrl}
                            onChange={(url) => updateItem(i, "audioUrl", url)}
                            disabled={isViewMode}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">Question</label>
                          <textarea
                            value={q.question}
                            onChange={(e) => updateItem(i, "question", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                            disabled={isViewMode}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs text-muted-col">Options</label>
                          {(["A", "B", "C", "D"] as const).map((opt) => (
                            <div key={opt} className="flex items-center gap-2">
                              <span className="text-xs text-muted-col w-4 shrink-0">{opt}.</span>
                              <input
                                value={q[`option${opt}` as "optionA" | "optionB" | "optionC" | "optionD"]}
                                onChange={(e) => updateItem(i, `option${opt}`, e.target.value)}
                                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                                disabled={isViewMode}
                              />
                              <button
                                type="button"
                                onClick={() => !isViewMode && updateItem(i, "correctAnswer", opt)}
                                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
                                  q.correctAnswer === opt
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-[var(--border)]"
                                } ${isViewMode ? "cursor-default" : "cursor-pointer"}`}
                                title="Set as correct answer"
                                disabled={isViewMode}
                              >
                                {q.correctAnswer === opt && (
                                  <span className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="block text-xs text-muted-col mb-1">
                            Explanation (optional)
                          </label>
                          <textarea
                            value={q.explanation ?? ""}
                            onChange={(e) => updateItem(i, "explanation", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col"
                            rows={2}
                            disabled={isViewMode}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            {isViewMode ? "Close" : "Cancel"}
          </button>
          {!isViewMode && (
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <Save className="w-4 h-4" />
              {mode === "create" ? "Create Lesson" : "Save Changes"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Vocabulary Backend: Detail Modal ────────────────────────────────────────

function VocabularyDetailModal({
  open,
  onClose,
  lesson,
  isLoading,
  isError,
}: {
  open: boolean;
  onClose: () => void;
  lesson: AdminVocabularyLesson | null;
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
              {lesson?.title ?? "Vocabulary Lesson Detail"}
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
              <div className="inline-block w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-col">Loading...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-red-500 text-sm">
              Failed to load vocabulary lesson details.
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

              {(lesson.items?.length ?? 0) > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                    Vocabulary Items ({lesson.items?.length ?? 0})
                  </h3>
                  {[...(lesson.items ?? [])]
                    .sort((a, b) => a.itemOrder - b.itemOrder)
                    .map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="glass-card p-4 space-y-3 border-l-4 border-sakura"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {item.itemOrder}
                          </span>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-muted-col mb-0.5">Japanese</p>
                                <p className="text-sm font-medium text-primary-col">{item.japanese}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-col mb-0.5">Meaning</p>
                                <p className="text-sm text-secondary-col">{item.meaning}</p>
                              </div>
                            </div>
                            {(item.furigana || item.romaji) && (
                              <div className="grid grid-cols-2 gap-3">
                                {item.furigana && (
                                  <div>
                                    <p className="text-xs text-muted-col mb-0.5">Furigana</p>
                                    <p className="text-sm text-secondary-col">{item.furigana}</p>
                                  </div>
                                )}
                                {item.romaji && (
                                  <div>
                                    <p className="text-xs text-muted-col mb-0.5">Romaji</p>
                                    <p className="text-sm text-secondary-col">{item.romaji}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            {(item.exampleSentence || item.exampleTranslation) && (
                              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
                                {item.exampleSentence && (
                                  <div>
                                    <p className="text-xs text-muted-col mb-0.5">Example Sentence</p>
                                    <p className="text-sm text-primary-col leading-relaxed">
                                      {item.exampleSentence}
                                    </p>
                                  </div>
                                )}
                                {item.exampleTranslation && (
                                  <div>
                                    <p className="text-xs text-muted-col mb-0.5">Example Translation</p>
                                    <p className="text-sm text-secondary-col leading-relaxed">
                                      {item.exampleTranslation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            {item.partOfSpeech && (
                              <div className="pt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--accent)] text-xs text-secondary-col">
                                  {item.partOfSpeech}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {(lesson.items?.length ?? 0) === 0 && (
                <div className="text-center py-8 text-muted-col text-sm">
                  No vocabulary items in this lesson yet.
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

// ─── Vocabulary Backend: Create/Edit Form ──────────────────────────────────────

function VocabularyBackendEditForm({
  open,
  mode,
  lesson,
  onSave,
  onCancel,
}: {
  open: boolean;
  mode: "create" | "edit" | "view" | undefined;
  lesson: AdminVocabularyLesson | null;
  onSave: (data: Partial<AdminVocabularyLesson>) => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const isViewMode = mode === "view";

  const [form, setForm] = useState<Partial<AdminVocabularyLesson>>(() => ({
    lessonNumber: lesson?.lessonNumber || 1,
    title: lesson?.title || "",
    description: lesson?.description || "",
    estimatedMinutes: lesson?.estimatedMinutes ?? null,
    difficulty: lesson?.difficulty || "",
    isActive: lesson?.isActive ?? true,
    items: (lesson?.items ?? []).map((item) => ({ ...item })),
  }));

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!lesson) return;
    setForm({
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      description: lesson.description ?? "",
      estimatedMinutes: lesson.estimatedMinutes ?? null,
      difficulty: lesson.difficulty ?? "",
      isActive: lesson.isActive,
      items: (lesson.items ?? []).map((item) => ({ ...item })),
    });
  }, [lesson]);

  const addItem = () => {
    const currentItems = form.items ?? [];
    const newItem: AdminVocabularyItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      itemOrder: currentItems.length + 1,
      japanese: "",
      furigana: null,
      romaji: null,
      meaning: "",
      exampleSentence: null,
      exampleTranslation: null,
      partOfSpeech: null,
    };
    // Normalize ALL item orders to ensure no duplicates after add
    const allItems = [...currentItems, newItem].map((item, i) => ({
      ...item,
      itemOrder: i + 1,
    }));
    setForm((f) => ({ ...f, items: allItems }));
    setExpandedItems((prev) => new Set([...prev, newItem.id]));
  };

  const updateItem = (index: number, patch: Partial<AdminVocabularyItem>) => {
    setForm((f) => {
      const items = (f.items ?? []).map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      );
      return { ...f, items };
    });
  };

  const removeItem = (index: number) => {
    setForm((f) => {
      const items = (f.items ?? [])
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, itemOrder: i + 1 }));
      return { ...f, items };
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

  const handleSubmit = () => {
    onSave({
      ...form,
      id: lesson?.id || "",
    });
  };

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
              {mode === "create" ? "Create" : "Edit"} Vocabulary Lesson
            </h2>
            {lesson?.title && (
              <p className="text-xs text-muted-col mt-0.5">{lesson.title}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">
          {/* Lesson Information - Simplified */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-sakura" />
              <h3 className="text-sm font-semibold text-primary-col">Lesson Information</h3>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary-col mb-1.5">
                  Lesson Number
                </label>
                <input
                  type="number"
                  value={form.lessonNumber ?? 1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lessonNumber: Number(e.target.value) }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-sakura/30 transition"
                  min={1}
                  disabled={isViewMode}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-col mb-1.5">
                  Lesson Title
                </label>
                <input
                  value={form.title ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-sakura/30 transition"
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>

          {/* Vocabulary Items */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-primary-col">Vocabulary Items</h3>
                <p className="text-xs text-muted-col mt-0.5">
                  {(form.items ?? []).length} item{(form.items ?? []).length !== 1 ? "s" : ""}
                </p>
              </div>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sakura/10 text-sakura hover:bg-sakura/20 transition text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              )}
            </div>

            {(form.items ?? []).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-col">
                  No vocabulary items yet. Click "Add Item" below to add one.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(form.items ?? []).map((item, i) => {
                  const isExpanded = expandedItems.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[var(--border)] overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-sakura/15 text-sakura text-xs font-bold flex items-center justify-center">
                            {item.itemOrder || i + 1}
                          </span>
                          <div className="text-left">
                            <span className="text-sm font-medium text-primary-col">
                              {item.japanese || "New Item"}
                            </span>
                            {item.meaning && (
                              <span className="text-xs text-muted-col ml-2">
                                — {item.meaning}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isViewMode && (
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
                          )}
                          <ChevronDown
                            className={`w-4 h-4 text-muted-col transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 py-4 glass-card space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-muted-col mb-1">
                                Japanese
                              </label>
                              <input
                                value={item.japanese}
                                onChange={(e) =>
                                  updateItem(i, { japanese: e.target.value })
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-sakura/30 transition"
                                placeholder="Japanese word"
                                disabled={isViewMode}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-muted-col mb-1">
                                Furigana
                              </label>
                              <input
                                value={item.furigana ?? ""}
                                onChange={(e) =>
                                  updateItem(i, {
                                    furigana: e.target.value || null,
                                  })
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-sakura/30 transition"
                                placeholder="Furigana (optional)"
                                disabled={isViewMode}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-muted-col mb-1">
                                Romaji
                              </label>
                              <input
                                value={item.romaji ?? ""}
                                onChange={(e) =>
                                  updateItem(i, {
                                    romaji: e.target.value || null,
                                  })
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-sakura/30 transition"
                                placeholder="Romaji (optional)"
                                disabled={isViewMode}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-muted-col mb-1">
                                Part of Speech
                              </label>
                              <input
                                value={item.partOfSpeech ?? ""}
                                onChange={(e) =>
                                  updateItem(i, {
                                    partOfSpeech: e.target.value || null,
                                  })
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-sakura/30 transition"
                                placeholder="e.g. noun, verb"
                                disabled={isViewMode}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-muted-col mb-1">
                              Meaning
                            </label>
                            <input
                              value={item.meaning}
                              onChange={(e) => updateItem(i, { meaning: e.target.value })}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-sakura/30 transition"
                              placeholder="Meaning (Vietnamese)"
                              disabled={isViewMode}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-muted-col mb-1">
                                Example Sentence
                              </label>
                              <textarea
                                value={item.exampleSentence ?? ""}
                                onChange={(e) =>
                                  updateItem(i, {
                                    exampleSentence: e.target.value || null,
                                  })
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-sakura/30 transition resize-y min-h-[60px]"
                                placeholder="Example sentence (optional)"
                                disabled={isViewMode}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-muted-col mb-1">
                                Example Translation
                              </label>
                              <textarea
                                value={item.exampleTranslation ?? ""}
                                onChange={(e) =>
                                  updateItem(i, {
                                    exampleTranslation: e.target.value || null,
                                  })
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-primary-col focus:outline-none focus:ring-2 focus:ring-sakura/30 transition resize-y min-h-[60px]"
                                placeholder="Example translation (optional)"
                                disabled={isViewMode}
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
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            {isViewMode ? "Close" : "Cancel"}
          </button>
          {!isViewMode && (
            <button
              onClick={handleSubmit}
              disabled={!form.title?.trim()}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-sakura to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-sakura/25"
            >
              <Save className="w-4 h-4" />
              {mode === "create" ? "Create Lesson" : "Save Changes"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
