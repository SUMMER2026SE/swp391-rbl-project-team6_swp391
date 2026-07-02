import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
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
  Sparkles,
  Film,
  AlertCircle,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useContentLibrary } from "@/services/contentLibraryService";
import {
  type JLPTLevel,
  type ContentSkill,
  type VocabularyLesson,
  type GrammarLesson,
  type ListeningLesson,
  type ShadowingItem,
  type VocabularyItem,
  type GrammarItem,
  generateId,
} from "@/mocks/contentLibraryMock";
import { adminShadowingApi } from "@/lib/api/adminShadowing";


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

// ─── Shadowing Form Body Component (Unified) ─────────────────────────────────

function ShadowingFormBody({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: ShadowingItem;
  onSave: (data: Partial<ShadowingItem>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || "");
  const [videoId, setVideoId] = useState("");
  const [fileName, setFileName] = useState(initialData?.videoUrl ? "Existing Video" : "");
  
  const [segments, setSegments] = useState<ShadowingItem["segments"]>(
    initialData?.segments ? [...initialData.segments] : []
  );

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const getAbsoluteVideoUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  // File Upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setFileName(file.name);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.video;
      return next;
    });

    try {
      const res = await adminShadowingApi.uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });
      setVideoUrl(res.videoUrl);
      setVideoId(res.videoId);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload video");
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const removeVideo = () => {
    setVideoUrl("");
    setVideoId("");
    setFileName("");
  };

  // AI Generation
  const handleGenerate = async () => {
    if (!videoUrl) {
      toast.error("Please upload a video first");
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.segments;
      return next;
    });

    // Step 1: Uploading...
    setGenerationStep(1);
    setGenerationProgress(10);
    
    await new Promise<void>((resolve) => {
      let current = 10;
      const interval = setInterval(() => {
        current += 5;
        if (current >= 25) {
          clearInterval(interval);
          resolve();
        }
        setGenerationProgress(current);
      }, 100);
    });

    // Step 2: Processing AI...
    setGenerationStep(2);
    setGenerationProgress(30);

    await new Promise<void>((resolve) => {
      let current = 30;
      const interval = setInterval(() => {
        current += 5;
        if (current >= 50) {
          clearInterval(interval);
          resolve();
        }
        setGenerationProgress(current);
      }, 120);
    });

    // Step 3: Generating subtitles...
    setGenerationStep(3);
    setGenerationProgress(60);

    const apiCall = adminShadowingApi.generateShadowing(videoId || "mock-vid");
    
    const animationInterval = setInterval(() => {
      setGenerationProgress((p) => (p < 90 ? p + 2 : p));
    }, 150);

    try {
      const generated = await apiCall;
      clearInterval(animationInterval);
      
      // Step 4: Completed
      setGenerationStep(4);
      setGenerationProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newSegments = generated.map((seg, idx) => ({
        id: seg.id || generateId(`seg-${idx}`),
        startTime: seg.startTime,
        endTime: seg.endTime,
        japaneseText: seg.japanese,
        vietnameseTranslation: seg.vietnamese,
      }));

      setSegments(newSegments);
      toast.success(`Successfully generated ${newSegments.length} sentences`);
    } catch (err: any) {
      clearInterval(animationInterval);
      toast.error(err.message || "Subtitles generation failed");
    } finally {
      setGenerating(false);
      setGenerationStep(null);
    }
  };

  // Table manipulation
  const updateSegment = (index: number, field: "japaneseText" | "vietnameseTranslation", value: string) => {
    setSegments((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
    
    // Clear error inline for this field
    if (value.trim() !== "") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`${field}-${index}`];
        return next;
      });
    }
  };

  const deleteSegment = (index: number) => {
    setSegments((prev) => prev.filter((_, idx) => idx !== index));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`japaneseText-${index}`];
      delete next[`vietnameseTranslation-${index}`];
      return next;
    });
  };

  const addSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const nextStart = lastSeg ? lastSeg.endTime : 0;
    const nextEnd = nextStart + 3;

    const newSeg = {
      id: generateId("seg"),
      startTime: Number(nextStart.toFixed(2)),
      endTime: Number(nextEnd.toFixed(2)),
      japaneseText: "",
      vietnameseTranslation: "",
    };

    setSegments((prev) => [...prev, newSeg]);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.segments;
      return next;
    });
  };

  const moveSegment = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === segments.length - 1) return;

    const swapIdx = direction === "up" ? index - 1 : index + 1;
    setSegments((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[swapIdx];
      copy[swapIdx] = temp;
      return copy;
    });
  };

  // Validation & Save
  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Lesson title is required";
    }

    if (!videoUrl) {
      newErrors.video = "Please upload a video file";
    }

    if (segments.length === 0) {
      newErrors.segments = "At least one segment sentence is required";
    }

    segments.forEach((seg, index) => {
      if (!seg.japaneseText.trim()) {
        newErrors[`japaneseText-${index}`] = "Japanese text cannot be empty";
      }
      if (!seg.vietnameseTranslation.trim()) {
        newErrors[`vietnameseTranslation-${index}`] = "Vietnamese translation cannot be empty";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix validation errors before saving");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        videoUrl,
        thumbnailUrl: initialData?.thumbnailUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640",
        segments: segments.map((seg) => ({
          startTime: seg.startTime,
          endTime: seg.endTime,
          japaneseText: seg.japaneseText,
          vietnameseTranslation: seg.vietnameseTranslation,
        })),
      };

      await adminShadowingApi.saveShadowing(payload);
      
      onSave({
        ...payload,
        id: initialData?.id || generateId("s"),
      } as any);
    } catch (err: any) {
      toast.error(err.message || "Failed to save shadowing lesson");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setPreviewTime(e.currentTarget.currentTime);
  };

  const activeSegment = segments.find(
    (seg) => previewTime >= seg.startTime && previewTime <= seg.endTime
  );

  return (
    <div className="flex flex-col h-full bg-[var(--card)] text-primary-col">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        
        {/* Lesson Title Input */}
        <div className="glass-card p-5 space-y-2">
          <label className="block text-xs font-semibold text-secondary-col uppercase tracking-wider">
            Lesson Title
          </label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.title;
                  return next;
                });
              }
            }}
            placeholder="Enter lesson title..."
            className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--card)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
              errors.title ? "border-red-500 focus:ring-red-500/30" : "border-[var(--border)]"
            }`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1 font-medium">{errors.title}</p>}
        </div>

        {/* Section 1: Video Upload Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Film className="w-4 h-4 text-sakura animate-pulse" />
            <h3 className="text-sm font-semibold text-primary-col">Section 1: Video Upload</h3>
          </div>

          {!videoUrl ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition ${
                dragActive
                  ? "border-primary bg-primary/10"
                  : errors.video
                  ? "border-red-500 bg-red-500/5"
                  : "border-[var(--border)] hover:border-primary/50 bg-[var(--card)]"
              }`}
            >
              <Upload className="w-10 h-10 text-muted-col" />
              <div className="text-center">
                <p className="text-sm font-medium text-primary-col">
                  Drag and drop your video file here, or click to upload
                </p>
                <p className="text-xs text-muted-col mt-1">MP4, WebM format</p>
              </div>

              <label className="cursor-pointer px-4 py-2 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/20 transition shadow-sm">
                Upload Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>

              {uploading && (
                <div className="w-full max-w-xs space-y-2 mt-2">
                  <div className="flex justify-between text-xs font-medium text-secondary-col">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[var(--border)] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {errors.video && <p className="text-red-500 text-xs mt-1 font-medium">{errors.video}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[var(--accent)]/15 px-4 py-3 rounded-lg border border-[var(--border)]">
                <div className="flex items-center gap-2 overflow-hidden mr-4">
                  <Film className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-primary-col truncate">{fileName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="cursor-pointer px-2.5 py-1.5 rounded-md border border-[var(--border)] text-secondary-col text-xs font-semibold hover:bg-[var(--accent)] transition">
                    Replace Video
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition"
                  >
                    Remove Video
                  </button>
                </div>
              </div>

              {/* Large Video Preview Player */}
              <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-black aspect-video max-h-[340px] mx-auto flex items-center justify-center">
                <video
                  src={getAbsoluteVideoUrl(videoUrl)}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: AI Generation */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Sparkles className="w-4 h-4 text-sakura animate-pulse" />
            <h3 className="text-sm font-semibold text-primary-col">Section 2: AI Generation</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!videoUrl || generating}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-sakura to-purple-600 text-white text-xs font-bold hover:opacity-90 disabled:opacity-40 transition shadow-md shadow-sakura/25 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? "Generating..." : "Generate Shadowing"}
            </button>
            <p className="text-xs text-muted-col text-center sm:text-left">
              Automatically process speech in the uploaded video to generate Japanese subtitles and Vietnamese translations.
            </p>
          </div>

          {generating && (
            <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--card)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="font-semibold text-primary">
                  {generationStep === 1 && "Step 1: Uploading..."}
                  {generationStep === 2 && "Step 2: Processing AI..."}
                  {generationStep === 3 && "Step 3: Generating subtitles..."}
                  {generationStep === 4 && "Step 4: Completed!"}
                </div>
                <div className="text-secondary-col font-bold">{generationProgress}%</div>
              </div>
              <div className="w-full bg-[var(--border)] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-sakura h-full rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px] text-muted-col font-semibold">
                <div className={`flex items-center gap-1.5 ${generationStep && generationStep >= 1 ? "text-primary-col font-bold" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${generationStep && generationStep >= 1 ? "bg-primary animate-ping" : "bg-muted"}`} />
                  Step 1: Uploading
                </div>
                <div className={`flex items-center gap-1.5 ${generationStep && generationStep >= 2 ? "text-primary-col font-bold" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${generationStep && generationStep >= 2 ? "bg-primary animate-ping" : "bg-muted"}`} />
                  Step 2: Processing AI
                </div>
                <div className={`flex items-center gap-1.5 ${generationStep && generationStep >= 3 ? "text-primary-col font-bold" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${generationStep && generationStep >= 3 ? "bg-primary animate-ping" : "bg-muted"}`} />
                  Step 3: Subtitles
                </div>
                <div className={`flex items-center gap-1.5 ${generationStep && generationStep >= 4 ? "text-[var(--status-active)] font-bold" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${generationStep && generationStep >= 4 ? "bg-[var(--status-active)]" : "bg-muted"}`} />
                  Step 4: Completed
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Generated Sentences */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sakura" />
              <h3 className="text-sm font-semibold text-primary-col">Section 3: Generated Sentences</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-sakura/10 text-sakura rounded-md">
              {segments.length} rows
            </span>
          </div>

          {errors.segments && (
            <div className="p-3 border border-red-500/20 rounded-lg bg-red-500/5 flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.segments}</span>
            </div>
          )}

          {segments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-xl">
              <p className="text-sm text-muted-col">
                No sentences yet. Upload video and generate subtitles, or add manually.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[var(--border)] rounded-xl bg-[var(--card)] shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--accent)]/10 border-b border-[var(--border)] text-xs text-secondary-col font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 w-5/12">Japanese</th>
                    <th className="py-3 px-4 w-5/12">Vietnamese</th>
                    <th className="py-3 px-3 w-20 text-center">Start Time</th>
                    <th className="py-3 px-3 w-20 text-center">End Time</th>
                    <th className="py-3 px-4 w-28 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-sm">
                  {segments.map((seg, i) => {
                    const jpErr = errors[`japaneseText-${i}`];
                    const vnErr = errors[`vietnameseTranslation-${i}`];
                    return (
                      <tr key={seg.id} className="hover:bg-[var(--accent)]/5 transition-colors group">
                        <td className="py-3 px-4 font-bold text-muted-col text-center">
                          {i + 1}
                        </td>
                        <td className="py-2 px-4">
                          <div className="space-y-1">
                            <textarea
                              rows={1}
                              value={seg.japaneseText}
                              onChange={(e) => updateSegment(i, "japaneseText", e.target.value)}
                              placeholder="Input Japanese text..."
                              className={`w-full px-2 py-1.5 bg-transparent border rounded focus:border-primary focus:bg-[var(--card)] focus:outline-none transition resize-none min-h-[38px] ${
                                jpErr ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-transparent hover:border-[var(--border)]"
                              }`}
                            />
                            {jpErr && <span className="text-[10px] text-red-500 font-medium">{jpErr}</span>}
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="space-y-1">
                            <textarea
                              rows={1}
                              value={seg.vietnameseTranslation}
                              onChange={(e) => updateSegment(i, "vietnameseTranslation", e.target.value)}
                              placeholder="Input Vietnamese translation..."
                              className={`w-full px-2 py-1.5 bg-transparent border rounded focus:border-primary focus:bg-[var(--card)] focus:outline-none transition resize-none min-h-[38px] ${
                                vnErr ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-transparent hover:border-[var(--border)]"
                              }`}
                            />
                            {vnErr && <span className="text-[10px] text-red-500 font-medium">{vnErr}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums text-xs text-muted-col font-medium select-none">
                          {seg.startTime.toFixed(2)}s
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums text-xs text-muted-col font-medium select-none">
                          {seg.endTime.toFixed(2)}s
                        </td>
                        <td className="py-2 px-4 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => moveSegment(i, "up")}
                              disabled={i === 0}
                              title="Move up"
                              className="p-1 rounded text-secondary-col hover:text-primary hover:bg-[var(--accent)]/30 disabled:opacity-20 transition"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSegment(i, "down")}
                              disabled={i === segments.length - 1}
                              title="Move down"
                              className="p-1 rounded text-secondary-col hover:text-primary hover:bg-[var(--accent)]/30 disabled:opacity-20 transition"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSegment(i)}
                              title="Delete"
                              className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--card)] sticky bottom-0 z-10 shrink-0">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={addSegment}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[var(--border)] text-primary-col text-xs font-semibold hover:bg-[var(--accent)] transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Sentence
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            disabled={!videoUrl || segments.length === 0}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[var(--border)] text-primary-col text-xs font-semibold hover:bg-[var(--accent)] disabled:opacity-40 transition flex items-center justify-center gap-1.5"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-[var(--border)] text-secondary-col text-xs font-semibold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Shadowing"}
          </button>
        </div>
      </div>

      {/* Preview Dialog */}
      {previewOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-sakura" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Shadowing Preview: {title || "Untitled Lesson"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center items-center bg-[#09090b]">
              <div className="relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden border border-white/15 shadow-2xl bg-black">
                <video
                  ref={videoRef}
                  src={getAbsoluteVideoUrl(videoUrl)}
                  controls
                  onTimeUpdate={handlePreviewTimeUpdate}
                  className="w-full h-full object-contain"
                />

                {/* Subtitle Overlay */}
                {activeSegment ? (
                  <div className="absolute bottom-14 left-4 right-4 px-6 py-4 bg-black/75 text-white text-center rounded-xl pointer-events-none select-none border border-white/5 backdrop-blur-sm animate-fade-in transition-all duration-200">
                    <p className="text-lg font-bold mb-1.5 tracking-wide text-sakura leading-relaxed">
                      {activeSegment.japaneseText}
                    </p>
                    <p className="text-sm text-gray-300 font-medium">
                      {activeSegment.vietnameseTranslation}
                    </p>
                  </div>
                ) : (
                  <div className="absolute bottom-14 left-0 right-0 text-center pointer-events-none select-none">
                    <span className="inline-block px-4 py-1.5 bg-black/40 text-gray-500 text-xs rounded-full uppercase tracking-widest font-bold">
                      No Spoken Audio
                    </span>
                  </div>
                )}
              </div>
              
              <div className="w-full max-w-3xl mt-4 flex items-center justify-between text-xs text-gray-400 font-medium">
                <span>Total Sentences: {segments.length}</span>
                <span className="tabular-nums font-bold">
                  Current Time: {previewTime.toFixed(2)}s
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShadowingEditForm({
  item,
  onSave,
  onCancel,
}: {
  item: ShadowingItem;
  onSave: (data: Partial<ShadowingItem>) => void;
  onCancel: () => void;
}) {
  return <ShadowingFormBody initialData={item} onSave={onSave} onCancel={onCancel} />;
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

function ShadowingLessonForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<ShadowingItem>) => void;
  onCancel: () => void;
}) {
  return <ShadowingFormBody onSave={onSave} onCancel={onCancel} />;
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
    data: Partial<VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem>,
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
          status: "active",
          items: [],
        },
        grammar: {
          id: generateId("gram"),
          lessonNumber: 99,
          title: `Imported ${skill} lesson`,
          status: "active",
          items: [],
        },
        listening: {
          id: generateId("list"),
          lessonNumber: 99,
          title: `Imported ${skill} lesson`,
          status: "active",
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

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem | null
  >(null);

  const { lessons, createLesson, updateLesson, deleteLesson } = useContentLibrary(
    upperLevel,
    skill as ContentSkill,
  );

  const isShadowingSkill = skill === "shadowing";
  const [shadowingLessons, setShadowingLessons] = React.useState<ShadowingItem[]>([]);
  const [shadowingLoading, setShadowingLoading] = React.useState(false);
  const [shadowingError, setShadowingError] = React.useState<string | null>(null);

  const [editDetail, setEditDetail] = React.useState<ShadowingItem | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const fetchShadowingLessons = React.useCallback(async () => {
    if (!isShadowingSkill) return;
    setShadowingLoading(true);
    setShadowingError(null);
    try {
      const res = await adminShadowingApi.listShadowing();
      setShadowingLessons(res);
    } catch (err: any) {
      setShadowingError(err.message || "Failed to load shadowing lessons");
    } finally {
      setShadowingLoading(false);
    }
  }, [isShadowingSkill]);

  React.useEffect(() => {
    if (isShadowingSkill) {
      fetchShadowingLessons();
    }
  }, [isShadowingSkill, fetchShadowingLessons]);

  React.useEffect(() => {
    if (showEditModal && selectedItem && isShadowingSkill) {
      setDetailLoading(true);
      adminShadowingApi.getShadowingDetail(selectedItem.id)
        .then((detail) => {
          setEditDetail(detail);
        })
        .catch((err) => {
          toast.error(err.message || "Failed to load shadowing lesson details");
          setShowEditModal(false);
        })
        .finally(() => {
          setDetailLoading(false);
        });
    } else {
      setEditDetail(null);
    }
  }, [showEditModal, selectedItem, isShadowingSkill]);

  console.log("[LESSON LIST]", {
    level,
    skill,
    upperLevel,
    lessonsLength: lessons?.length,
    lessons,
  });

  const displayLessons = isShadowingSkill ? shadowingLessons : lessons;

  const filtered = displayLessons.filter((item) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      ("title" in item && item.title?.toLowerCase().includes(s)) ||
      ("lessonNumber" in item && String((item as VocabularyLesson).lessonNumber).includes(s))
    );
  });

  const handleCreate = async (
    data: Partial<VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem>,
  ) => {
    if (isShadowingSkill) {
      try {
        await adminShadowingApi.saveShadowing(data);
        toast.success("Shadowing lesson created successfully");
        fetchShadowingLessons();
        setShowCreateModal(false);
      } catch (err: any) {
        toast.error(err.message || "Failed to create shadowing lesson");
      }
    } else {
      createLesson(data);
      toast.success("Lesson created successfully");
      setShowCreateModal(false);
    }
  };

  const handleEdit = (item: VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleUpdate = async (
    data: Partial<VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem>,
  ) => {
    if (!selectedItem) return;
    if (isShadowingSkill) {
      try {
        await adminShadowingApi.saveShadowing({ ...data, id: selectedItem.id });
        toast.success("Shadowing lesson updated successfully");
        fetchShadowingLessons();
        setShowEditModal(false);
        setSelectedItem(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to update shadowing lesson");
      }
    } else {
      updateLesson(selectedItem.id, data);
      toast.success("Lesson updated successfully");
      setShowEditModal(false);
      setSelectedItem(null);
    }
  };

  const handleImport = (
    data: Partial<VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem>,
  ) => {
    createLesson(data);
    toast.success("Lesson imported successfully");
    setShowImportModal(false);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (isShadowingSkill) {
      try {
        await adminShadowingApi.deleteShadowing(selectedItem.id);
        toast.success("Shadowing lesson deleted successfully");
        fetchShadowingLessons();
        setShowDeleteConfirm(false);
        setSelectedItem(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete shadowing lesson");
      }
    } else {
      deleteLesson(selectedItem.id);
      toast.success("Lesson deleted successfully");
      setShowDeleteConfirm(false);
      setSelectedItem(null);
    }
  };

  const getItemCount = (
    item: VocabularyLesson | GrammarLesson | ListeningLesson | ShadowingItem,
  ): number => {
    if ("items" in item && Array.isArray(item.items)) return item.items.length;
    if ("segments" in item && Array.isArray(item.segments)) return item.segments.length;
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
          {skill !== "shadowing" && (
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-secondary-col hover:bg-[var(--accent)] transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Import Excel
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
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
      <div className="card-base overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b separator">
          {skill === "shadowing" ? (
            <>
              <div className="col-span-2 text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
                Thumbnail
              </div>
              <div className="col-span-3 text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
                Title
              </div>
              <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
                Duration
              </div>
              <div className="col-span-1 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
                Sentences
              </div>
              <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
                Created At
              </div>
              <div className="col-span-1 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
                Status
              </div>
              <div className="col-span-1 text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">
                Actions
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
        {/* Table Rows */}
        <div className="divide-y divide-[var(--border)]">
          {isShadowingSkill && shadowingLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="grid grid-cols-12 gap-4 items-center animate-pulse">
                  <div className="col-span-2 h-10 bg-[var(--border)] rounded-lg" />
                  <div className="col-span-3 h-4 bg-[var(--border)] rounded" />
                  <div className="col-span-2 h-4 bg-[var(--border)] rounded" />
                  <div className="col-span-1 h-4 bg-[var(--border)] rounded" />
                  <div className="col-span-2 h-4 bg-[var(--border)] rounded" />
                  <div className="col-span-1 h-4 bg-[var(--border)] rounded" />
                  <div className="col-span-1 h-8 bg-[var(--border)] rounded-lg" />
                </div>
              ))}
            </div>
          ) : isShadowingSkill && shadowingError ? (
            <div className="px-5 py-8 text-center text-red-500 text-sm">
              {shadowingError}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted-col">
                No {config.label.toLowerCase()} content found{search ? " matching your search" : ""}
              </p>
            </div>
          ) : (
            filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-[var(--accent)]/50 transition items-center"
              >
                {skill === "shadowing" ? (
                  <>
                    <div className="col-span-2">
                      <div className="w-16 h-10 rounded-lg bg-black/20 flex items-center justify-center border border-[var(--border)] overflow-hidden relative group">
                        <Film className="w-4 h-4 text-muted-col" />
                      </div>
                    </div>
                    <div className="col-span-3 font-medium text-sm text-primary-col">
                      {item.title}
                    </div>
                    <div className="col-span-2 text-center text-sm text-secondary-col font-mono">
                      {item.duration ? `${Math.floor(item.duration / 60)}m ${Math.round(item.duration % 60)}s` : "0s"}
                    </div>
                    <div className="col-span-1 text-center text-sm font-medium text-muted-col">
                      {item.segments ? item.segments.length : 0}
                    </div>
                    <div className="col-span-2 text-center text-xs text-secondary-col">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <StatusBadge status={(item as any).status || "active"} />
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
                <div className={skill === "shadowing" ? "col-span-1 flex justify-end items-center gap-2" : "col-span-2 flex justify-end items-center gap-2"}>
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
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDelete}
        title="Delete Lesson"
        message={`Are you sure you want to delete "${selectedItem?.title}"? This action cannot be undone.`}
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
              detailLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-[oklch(0.62_0.18_270)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-secondary-col">Loading lesson details from backend...</p>
                </div>
              ) : editDetail ? (
                <ShadowingEditForm
                  item={editDetail}
                  onSave={handleUpdate}
                  onCancel={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                  }}
                />
              ) : null
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
    </div>
  );
}
