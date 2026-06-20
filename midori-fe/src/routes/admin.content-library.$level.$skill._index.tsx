import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen, GraduationCap, FileText, Headphones, Mic,
  Plus, Search, Edit3, Trash2,
  Upload, ArrowLeft as ArrowLeftIcon, Save, X, Trash2 as TrashIcon,
} from "lucide-react";
import { useContentLibrary } from "@/services/contentLibraryService";
import {
  type JLPTLevel, type ContentSkill,
  type VocabularyLesson, type GrammarLesson, type ReadingLesson, type ListeningLesson, type ShadowingItem,
  type VocabularyItem, type GrammarItem,
  generateId,
} from "@/mocks/contentLibraryMock";

export const Route = createFileRoute("/admin/content-library/$level/$skill/_index")({
  component: SkillDetailPage,
});

const SKILL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  vocabulary: { label: "Vocabulary", icon: BookOpen, color: "text-[oklch(0.62_0.18_270)]", bg: "bg-[oklch(0.62_0.18_270)]/10", border: "border-[oklch(0.62_0.18_270)]/20" },
  grammar: { label: "Grammar", icon: GraduationCap, color: "text-[oklch(0.62_0.18_270)]", bg: "bg-[oklch(0.62_0.18_270)]/10", border: "border-[oklch(0.62_0.18_270)]/20" },
  reading: { label: "Reading", icon: FileText, color: "text-[oklch(0.62_0.18_270)]", bg: "bg-[oklch(0.62_0.18_270)]/10", border: "border-[oklch(0.62_0.18_270)]/20" },
  listening: { label: "Listening", icon: Headphones, color: "text-[oklch(0.62_0.18_270)]", bg: "bg-[oklch(0.62_0.18_270)]/10", border: "border-[oklch(0.62_0.18_270)]/20" },
  shadowing: { label: "Shadowing", icon: Mic, color: "text-[oklch(0.62_0.18_270)]", bg: "bg-[oklch(0.62_0.18_270)]/10", border: "border-[oklch(0.62_0.18_270)]/20" },
};

function StatusBadge({ status }: { status?: string }) {
  const s = status || "active";
  const styles: Record<string, string> = {
    active: "bg-[var(--status-active)]/10 text-[var(--status-active)]",
    inactive: "bg-muted text-muted-col",
    pending: "bg-[var(--status-pending)]/10 text-[var(--status-pending)]",
    draft: "bg-[var(--status-pending)]/10 text-[var(--status-pending)]",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${styles[s] || styles.active}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

// ─── Modal Component ─────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, size = "lg" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "md" | "lg" | "xl";
}) {
  if (!open) return null;
  
  const sizeClasses = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`relative z-10 w-full ${sizeClasses[size]} bg-[var(--card)] rounded-2xl shadow-2xl overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <h2 className="text-base font-display font-bold text-primary-col">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ open, onClose, onConfirm, title, message }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md bg-[var(--card)] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="font-display font-bold text-primary-col text-lg text-center">{title}</h3>
          <p className="text-secondary-col text-sm text-center">{message}</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t separator">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md hover:bg-red-600 transition">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Vocabulary Edit Form ─────────────────────────────────────────────────────

function VocabEditForm({ lesson, onSave, onCancel }: {
  lesson: VocabularyLesson; onSave: (data: Partial<VocabularyLesson>) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    description: lesson.description || "",
    status: (lesson as unknown as { status?: string }).status || "active",
    items: [...lesson.items] as VocabularyItem[],
  });
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, {
        id: generateId("v"),
        word: "", kanji: "", meaningVietnamese: "", meaningJapanese: "",
        exampleSentence: "", audioUrl: "",
      }],
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setForm(f => {
      const items = f.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...f, items } as typeof f;
    });
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: lesson.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Number</label>
            <input type="number" value={form.lessonNumber} onChange={e => setForm(f => ({ ...f, lessonNumber: +e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" min={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Description (optional)</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Vocabulary Items ({form.items.length})</h3>
          <button onClick={addItem} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {form.items.map((item, i) => (
            <div key={item.id} className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-xs text-muted-col font-medium">Item #{i + 1}</span>
                </div>
                <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-600 p-1 transition"><TrashIcon className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-col mb-1">Word (Hiragana)</label>
                  <input value={item.word} onChange={e => updateItem(i, "word", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Kanji</label>
                  <input value={item.kanji} onChange={e => updateItem(i, "kanji", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-xs text-muted-col mb-1">Meaning (Vietnamese)</label>
                  <input value={item.meaningVietnamese} onChange={e => updateItem(i, "meaningVietnamese", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Meaning (Japanese)</label>
                  <input value={item.meaningJapanese} onChange={e => updateItem(i, "meaningJapanese", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Example Sentence</label>
                  <input value={item.exampleSentence} onChange={e => updateItem(i, "exampleSentence", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
            </div>
          ))}
          {form.items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-col">No vocabulary items. Click "Add Item" to add one.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-border text-secondary-col hover:bg-muted transition flex items-center gap-2">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !form.title.trim() || form.items.length === 0} className="px-5 py-2.5 text-sm rounded-xl bg-[oklch(0.62_0.18_270)] text-white font-bold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-40">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Grammar Edit Form ─────────────────────────────────────────────────────────

function GrammarEditForm({ lesson, onSave, onCancel }: {
  lesson: GrammarLesson; onSave: (data: Partial<GrammarLesson>) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    status: (lesson as unknown as { status?: string }).status || "active",
    items: [...lesson.items] as GrammarItem[],
  });
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, {
        id: generateId("g"),
        grammarPoint: "", meaningVietnamese: "", meaningJapanese: "",
        explanation: "", exampleSentence: "", notes: "",
      }],
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setForm(f => {
      const items = f.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...f, items } as typeof f;
    });
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: lesson.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Number</label>
            <input type="number" value={form.lessonNumber} onChange={e => setForm(f => ({ ...f, lessonNumber: +e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" min={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Grammar Points ({form.items.length})</h3>
          <button onClick={addItem} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Point
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {form.items.map((item, i) => (
            <div key={item.id} className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-xs text-muted-col font-medium">Point #{i + 1}</span>
                </div>
                <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-600 p-1 transition"><TrashIcon className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-muted-col mb-1">Grammar Point</label>
                  <input value={item.grammarPoint} onChange={e => updateItem(i, "grammarPoint", e.target.value)} placeholder="e.g. 〜ます" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-col mb-1">Meaning (Vietnamese)</label>
                    <input value={item.meaningVietnamese} onChange={e => updateItem(i, "meaningVietnamese", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-col mb-1">Meaning (Japanese)</label>
                    <input value={item.meaningJapanese} onChange={e => updateItem(i, "meaningJapanese", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Explanation</label>
                  <textarea value={item.explanation} onChange={e => updateItem(i, "explanation", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]" />
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Example Sentence</label>
                  <input value={item.exampleSentence} onChange={e => updateItem(i, "exampleSentence", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
            </div>
          ))}
          {form.items.length === 0 && (
            <div className="text-center py-8"><p className="text-sm text-muted-col">No grammar points. Click "Add Point" to add one.</p></div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition flex items-center justify-center gap-2">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !form.title.trim() || form.items.length === 0} className="flex-1 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-40">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Reading Edit Form ────────────────────────────────────────────────────────

function ReadingEditForm({ lesson, onSave, onCancel }: {
  lesson: ReadingLesson; onSave: (data: Partial<ReadingLesson>) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    status: (lesson as unknown as { status?: string }).status || "active",
    items: [...lesson.items] as ReadingLesson["items"],
  });
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, {
        id: generateId("read"),
        title: "", passage: "", translationVietnamese: "", questions: [],
      }],
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setForm(f => {
      const items = f.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...f, items } as typeof f;
    });
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: lesson.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Number</label>
            <input type="number" value={form.lessonNumber} onChange={e => setForm(f => ({ ...f, lessonNumber: +e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" min={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Reading Passages ({form.items.length})</h3>
          <button onClick={addItem} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Passage
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {form.items.map((item, i) => (
            <div key={item.id} className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-xs text-muted-col font-medium">Passage #{i + 1}</span>
                </div>
                <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-600 p-1 transition"><TrashIcon className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-muted-col mb-1">Passage Title</label>
                  <input value={item.title} onChange={e => updateItem(i, "title", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Japanese Passage</label>
                  <textarea value={item.passage} onChange={e => updateItem(i, "passage", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]" />
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Vietnamese Translation</label>
                  <textarea value={item.translationVietnamese} onChange={e => updateItem(i, "translationVietnamese", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" />
                </div>
              </div>
            </div>
          ))}
          {form.items.length === 0 && (
            <div className="text-center py-8"><p className="text-sm text-muted-col">No passages. Click "Add Passage" to add one.</p></div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition flex items-center justify-center gap-2">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !form.title.trim() || form.items.length === 0} className="flex-1 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-40">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Listening Edit Form ───────────────────────────────────────────────────────

function ListeningEditForm({ lesson, onSave, onCancel }: {
  lesson: ListeningLesson; onSave: (data: Partial<ListeningLesson>) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    status: (lesson as unknown as { status?: string }).status || "active",
    items: [...lesson.items] as ListeningLesson["items"],
  });
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, {
        id: generateId("list"),
        title: "", audioUrl: "", transcriptJapanese: "", translationVietnamese: "", questions: [],
      }],
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setForm(f => {
      const items = f.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...f, items } as typeof f;
    });
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: lesson.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Number</label>
            <input type="number" value={form.lessonNumber} onChange={e => setForm(f => ({ ...f, lessonNumber: +e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" min={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Listening Items ({form.items.length})</h3>
          <button onClick={addItem} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {form.items.map((item, i) => (
            <div key={item.id} className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-xs text-muted-col font-medium">Item #{i + 1}</span>
                </div>
                <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-600 p-1 transition"><TrashIcon className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-muted-col mb-1">Item Title</label>
                  <input value={item.title} onChange={e => updateItem(i, "title", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Audio URL</label>
                  <input value={item.audioUrl} onChange={e => updateItem(i, "audioUrl", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Japanese Transcript</label>
                  <textarea value={item.transcriptJapanese} onChange={e => updateItem(i, "transcriptJapanese", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" />
                </div>
                <div>
                  <label className="block text-xs text-muted-col mb-1">Vietnamese Translation</label>
                  <textarea value={item.translationVietnamese} onChange={e => updateItem(i, "translationVietnamese", e.target.value)} className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" />
                </div>
              </div>
            </div>
          ))}
          {form.items.length === 0 && (
            <div className="text-center py-8"><p className="text-sm text-muted-col">No items. Click "Add Item" to add one.</p></div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition flex items-center justify-center gap-2">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !form.title.trim() || form.items.length === 0} className="flex-1 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-40">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Shadowing Edit Form ─────────────────────────────────────────────────────

function ShadowingEditForm({ item, onSave, onCancel }: {
  item: ShadowingItem; onSave: (data: Partial<ShadowingItem>) => void; onCancel: () => void;
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

  const addSegment = () => {
    setForm(f => ({
      ...f,
      segments: [...f.segments, {
        id: generateId("seg"),
        startTime: 0, endTime: 0,
        japaneseText: "", vietnameseTranslation: "",
      }],
    }));
  };

  const updateSegment = (index: number, field: string, value: string | number) => {
    setForm(f => {
      const segments = f.segments.map((seg, i) =>
        i === index ? { ...seg, [field]: value } : seg
      );
      return { ...f, segments } as typeof f;
    });
  };

  const removeSegment = (index: number) => {
    setForm(f => ({ ...f, segments: f.segments.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: item.id });
      setSaving(false);
    }, 200);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Video URL</label>
          <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Thumbnail URL</label>
          <input value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Japanese Transcript</label>
          <textarea value={form.transcriptJapanese} onChange={e => setForm(f => ({ ...f, transcriptJapanese: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[72px]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Vietnamese Translation</label>
          <textarea value={form.translationVietnamese} onChange={e => setForm(f => ({ ...f, translationVietnamese: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[72px]" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Segments ({form.segments.length})</h3>
          <button onClick={addSegment} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Segment
          </button>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-col uppercase tracking-wide whitespace-nowrap">#</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-col uppercase tracking-wide">Japanese Text</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-col uppercase tracking-wide">Vietnamese</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-col uppercase tracking-wide whitespace-nowrap">Start</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-col uppercase tracking-wide whitespace-nowrap">End</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-muted-col uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {form.segments.map((seg, i) => (
                <tr key={seg.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2">
                    <span className="w-6 h-6 rounded-lg bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  </td>
                  <td className="px-3 py-2">
                    <input value={seg.japaneseText} onChange={e => updateSegment(i, "japaneseText", e.target.value)} className="w-full px-2 py-1 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={seg.vietnameseTranslation} onChange={e => updateSegment(i, "vietnameseTranslation", e.target.value)} className="w-full px-2 py-1 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={seg.startTime} onChange={e => updateSegment(i, "startTime", +e.target.value)} className="w-20 px-2 py-1 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/30" min={0} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={seg.endTime} onChange={e => updateSegment(i, "endTime", +e.target.value)} className="w-20 px-2 py-1 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/30" min={0} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => removeSegment(i)} className="text-red-400 hover:text-red-600 p-1 transition"><TrashIcon className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {form.segments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-col text-sm">No segments. Click "Add Segment" to add one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition flex items-center justify-center gap-2">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.videoUrl.trim()} className="flex-1 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-40">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Create Lesson Forms ──────────────────────────────────────────────────────

function VocabLessonForm({ onSave, onCancel }: { onSave: (data: Partial<VocabularyLesson>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    lessonNumber: 1, title: "", description: "", status: "active",
    items: [{ id: generateId("v"), word: "", kanji: "", meaningVietnamese: "", meaningJapanese: "", exampleSentence: "", audioUrl: "" }],
  });

  const updateItem = (index: number, field: string, value: string) => {
    setForm(f => {
      const items = f.items.map((item, i) => i === index ? { ...item, [field]: value } : item);
      return { ...f, items } as typeof f;
    });
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { id: generateId("v"), word: "", kanji: "", meaningVietnamese: "", meaningJapanese: "", exampleSentence: "", audioUrl: "" }] }));
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Number</label>
            <input type="number" value={form.lessonNumber} onChange={e => setForm(f => ({ ...f, lessonNumber: +e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" min={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Vocabulary Items ({form.items.length})</h3>
          <button onClick={addItem} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {form.items.map((item, i) => (
            <div key={item.id} className="p-3 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-col font-medium">Item #{i + 1}</span>
                {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={item.word} onChange={e => updateItem(i, "word", e.target.value)} placeholder="Word" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={item.kanji} onChange={e => updateItem(i, "kanji", e.target.value)} placeholder="Kanji" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={item.meaningVietnamese} onChange={e => updateItem(i, "meaningVietnamese", e.target.value)} placeholder="Meaning (VN)" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={item.exampleSentence} onChange={e => updateItem(i, "exampleSentence", e.target.value)} placeholder="Example" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition flex items-center justify-center">
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={!form.title.trim()} className="flex-1 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center disabled:opacity-40">
          Create Lesson
        </button>
      </div>
    </div>
  );
}

function GrammarLessonForm({ onSave, onCancel }: { onSave: (data: Partial<GrammarLesson>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    lessonNumber: 1, title: "", status: "active",
    items: [{ id: generateId("g"), grammarPoint: "", meaningVietnamese: "", meaningJapanese: "", explanation: "", exampleSentence: "", notes: "" }],
  });

  const updateItem = (index: number, field: string, value: string) => {
    setForm(f => {
      const items = f.items.map((item, i) => i === index ? { ...item, [field]: value } : item);
      return { ...f, items } as typeof f;
    });
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { id: generateId("g"), grammarPoint: "", meaningVietnamese: "", meaningJapanese: "", explanation: "", exampleSentence: "", notes: "" }] }));
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Number</label>
            <input type="number" value={form.lessonNumber} onChange={e => setForm(f => ({ ...f, lessonNumber: +e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" min={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Grammar Points ({form.items.length})</h3>
          <button onClick={addItem} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Point
          </button>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {form.items.map((item, i) => (
            <div key={item.id} className="p-3 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-col font-medium">Point #{i + 1}</span>
                {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>}
              </div>
              <div className="space-y-2">
                <input value={item.grammarPoint} onChange={e => updateItem(i, "grammarPoint", e.target.value)} placeholder="Grammar Point (e.g. 〜ます)" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={item.meaningVietnamese} onChange={e => updateItem(i, "meaningVietnamese", e.target.value)} placeholder="Meaning (Vietnamese)" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={item.exampleSentence} onChange={e => updateItem(i, "exampleSentence", e.target.value)} placeholder="Example Sentence" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-border text-secondary-col hover:bg-muted transition">Cancel</button>
        <button onClick={() => onSave(form)} disabled={!form.title.trim()} className="flex-1 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center disabled:opacity-40">
          Create Lesson
        </button>
      </div>
    </div>
  );
}

function ReadingLessonForm({ onSave, onCancel }: { onSave: (data: Partial<ReadingLesson>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    lessonNumber: 1, title: "", status: "active",
    items: [{ id: generateId("read"), title: "", passage: "", translationVietnamese: "", questions: [] }],
  });

  const updateItem = (index: number, field: string, value: string) => {
    setForm(f => {
      const items = f.items.map((item, i) => i === index ? { ...item, [field]: value } : item);
      return { ...f, items } as typeof f;
    });
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { id: generateId("read"), title: "", passage: "", translationVietnamese: "", questions: [] }] }));
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Number</label>
            <input type="number" value={form.lessonNumber} onChange={e => setForm(f => ({ ...f, lessonNumber: +e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" min={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Reading Passages ({form.items.length})</h3>
          <button onClick={addItem} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Passage
          </button>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {form.items.map((item, i) => (
            <div key={item.id} className="p-3 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-col font-medium">Passage #{i + 1}</span>
                {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>}
              </div>
              <div className="space-y-2">
                <input value={item.title} onChange={e => updateItem(i, "title", e.target.value)} placeholder="Passage Title" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <textarea value={item.passage} onChange={e => updateItem(i, "passage", e.target.value)} placeholder="Japanese Passage" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" />
                <textarea value={item.translationVietnamese} onChange={e => updateItem(i, "translationVietnamese", e.target.value)} placeholder="Vietnamese Translation" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-border text-secondary-col hover:bg-muted transition">Cancel</button>
        <button onClick={() => onSave(form)} disabled={!form.title.trim()} className="flex-1 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center disabled:opacity-40">
          Create Lesson
        </button>
      </div>
    </div>
  );
}

function ListeningLessonForm({ onSave, onCancel }: { onSave: (data: Partial<ListeningLesson>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    lessonNumber: 1, title: "", status: "active",
    items: [{ id: generateId("list"), title: "", audioUrl: "", transcriptJapanese: "", translationVietnamese: "", questions: [] }],
  });

  const updateItem = (index: number, field: string, value: string) => {
    setForm(f => {
      const items = f.items.map((item, i) => i === index ? { ...item, [field]: value } : item);
      return { ...f, items } as typeof f;
    });
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { id: generateId("list"), title: "", audioUrl: "", transcriptJapanese: "", translationVietnamese: "", questions: [] }] }));
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Number</label>
            <input type="number" value={form.lessonNumber} onChange={e => setForm(f => ({ ...f, lessonNumber: +e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" min={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-col mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Lesson Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Listening Items ({form.items.length})</h3>
          <button onClick={addItem} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {form.items.map((item, i) => (
            <div key={item.id} className="p-3 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-col font-medium">Item #{i + 1}</span>
                {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>}
              </div>
              <div className="space-y-2">
                <input value={item.title} onChange={e => updateItem(i, "title", e.target.value)} placeholder="Item Title" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={item.audioUrl} onChange={e => updateItem(i, "audioUrl", e.target.value)} placeholder="Audio URL" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <textarea value={item.transcriptJapanese} onChange={e => updateItem(i, "transcriptJapanese", e.target.value)} placeholder="Japanese Transcript" className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-border text-secondary-col hover:bg-muted transition">Cancel</button>
        <button onClick={() => onSave(form)} disabled={!form.title.trim()} className="flex-1 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center disabled:opacity-40">
          Create Lesson
        </button>
      </div>
    </div>
  );
}

function ShadowingLessonForm({ onSave, onCancel }: { onSave: (data: Partial<ShadowingItem>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: "", videoUrl: "", thumbnailUrl: "",
    transcriptJapanese: "", translationVietnamese: "",
    segments: [{ id: generateId("seg"), startTime: 0, endTime: 0, japaneseText: "", vietnameseTranslation: "" }],
  });

  const updateSegment = (index: number, field: string, value: string | number) => {
    setForm(f => {
      const segments = f.segments.map((seg, i) => i === index ? { ...seg, [field]: value } : seg);
      return { ...f, segments } as typeof f;
    });
  };

  const addSegment = () => {
    setForm(f => ({ ...f, segments: [...f.segments, { id: generateId("seg"), startTime: 0, endTime: 0, japaneseText: "", vietnameseTranslation: "" }] }));
  };

  const removeSegment = (index: number) => {
    setForm(f => ({ ...f, segments: f.segments.filter((_, i) => i !== index) }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary-col border-b border-border/40 pb-2">Lesson Information</h3>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Video URL</label>
          <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-col mb-1.5">Thumbnail URL</label>
          <input value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-semibold text-primary-col">Segments ({form.segments.length})</h3>
          <button onClick={addSegment} type="button" className="px-3 py-1.5 text-xs rounded-xl border border-border text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Segment
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {form.segments.map((seg, i) => (
            <div key={seg.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-muted/20">
              <span className="text-xs text-muted-col w-6">{i + 1}</span>
              <input value={seg.japaneseText} onChange={e => updateSegment(i, "japaneseText", e.target.value)} placeholder="Japanese" className="flex-1 px-2 py-1 text-sm rounded-lg border border-border bg-background text-primary-col" />
              <input value={seg.vietnameseTranslation} onChange={e => updateSegment(i, "vietnameseTranslation", e.target.value)} placeholder="Vietnamese" className="flex-1 px-2 py-1 text-sm rounded-lg border border-border bg-background text-primary-col" />
              <input type="number" value={seg.startTime} onChange={e => updateSegment(i, "startTime", +e.target.value)} placeholder="Start" className="w-16 px-2 py-1 text-sm rounded-lg border border-border bg-background text-primary-col" min={0} />
              <input type="number" value={seg.endTime} onChange={e => updateSegment(i, "endTime", +e.target.value)} placeholder="End" className="w-16 px-2 py-1 text-sm rounded-lg border border-border bg-background text-primary-col" min={0} />
              {form.segments.length > 1 && <button type="button" onClick={() => removeSegment(i)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-border text-secondary-col hover:bg-muted transition">Cancel</button>
        <button onClick={() => onSave(form)} disabled={!form.title.trim() || !form.videoUrl.trim()} className="px-5 py-2.5 text-sm rounded-xl bg-[var(--status-active)] text-white font-bold hover:opacity-90 transition disabled:opacity-40">
          Create Lesson
        </button>
      </div>
    </div>
  );
}

// ─── Excel Import Modal (Simple) ───────────────────────────────────────────────

function ExcelImportModal({ skill, level, onClose, onImport }: {
  skill: string; level: JLPTLevel; onClose: () => void; onImport: (data: Partial<VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem>) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = () => {
    if (!file) return;
    setImporting(true);
    setTimeout(() => {
      const mockData: Record<string, Partial<VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem>> = {
        vocabulary: { id: generateId("vocab"), lessonNumber: 99, title: `Imported ${skill} lesson`, status: "active", items: [] },
        grammar: { id: generateId("gram"), lessonNumber: 99, title: `Imported ${skill} lesson`, status: "active", items: [] },
        reading: { id: generateId("read"), lessonNumber: 99, title: `Imported ${skill} lesson`, status: "active", items: [] },
        listening: { id: generateId("list"), lessonNumber: 99, title: `Imported ${skill} lesson`, status: "active", items: [] },
        shadowing: { id: generateId("shadow"), title: `Imported ${skill} lesson`, videoUrl: "", thumbnailUrl: "", segments: [] },
      };
      onImport(mockData[skill] || mockData.vocabulary);
      setImporting(false);
    }, 1000);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
        <Upload className="w-10 h-10 mx-auto text-muted-col mb-3" />
        <p className="text-sm text-secondary-col mb-2">Drop your Excel file here or click to browse</p>
        <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="excel-upload" />
        <label htmlFor="excel-upload" className="inline-block px-4 py-2 text-sm rounded-xl border border-border text-secondary-col hover:bg-muted cursor-pointer transition">
          Select File
        </label>
        {file && <p className="mt-2 text-sm text-primary-col">{file.name}</p>}
      </div>
      <div className="flex gap-3 px-6 py-4 border-t separator">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border text-secondary-col hover:bg-muted transition">Cancel</button>
        <button onClick={handleImport} disabled={!file || importing} className="px-5 py-2.5 text-sm rounded-xl bg-[oklch(0.62_0.18_270)] text-white font-bold hover:opacity-90 transition disabled:opacity-40">
          {importing ? "Importing..." : "Import"}
        </button>
      </div>
    </div>
  );
}

// ─── Skill Detail Page (Index Route) ─────────────────────────────────────────

function SkillDetailPage() {
  console.log("[SKILL INDEX MOUNTED] /admin/content-library/$level/$skill");
  
  const { level, skill } = Route.useParams();
  const navigate = useNavigate();
  const upperLevel = level.toUpperCase() as JLPTLevel;
  const config = SKILL_CONFIG[skill];

  const { lessons, createLesson, updateLesson, deleteLesson } = useContentLibrary(upperLevel, skill as ContentSkill);
  
  console.log("[LESSON LIST]", { level, skill, upperLevel, lessonsLength: lessons?.length, lessons });

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem | null>(null);

  const filtered = lessons.filter(item => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return ("title" in item && item.title?.toLowerCase().includes(s)) ||
           ("lessonNumber" in item && String((item as VocabularyLesson).lessonNumber).includes(s));
  });

  const handleCreate = (data: Partial<VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem>) => {
    createLesson(data);
    toast.success("Lesson created successfully");
    setShowCreateModal(false);
  };

  const handleEdit = (item: VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleUpdate = (data: Partial<VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem>) => {
    if (!selectedItem) return;
    updateLesson(selectedItem.id, data);
    toast.success("Lesson updated successfully");
    setShowEditModal(false);
    setSelectedItem(null);
  };

  const handleImport = (data: Partial<VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem>) => {
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

  const getItemCount = (item: VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem): number => {
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
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="bg-[var(--background)]/95 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Row */}
            <div className="flex items-center gap-2 py-3">
              <button
                onClick={() => navigate({ to: "/admin/content-library/$level", params: { level } })}
                className="inline-flex items-center gap-1.5 text-sm text-muted-col hover:text-primary-col transition bg-[var(--card)] px-3 py-1.5 rounded-lg border border-border hover:border-primary-col/30 shrink-0"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 text-xs text-muted-col overflow-x-auto scrollbar-hide">
                <a href="/admin/content-library" className="hover:text-primary-col transition whitespace-nowrap">Content Library</a>
                <span>/</span>
                <a href={`/admin/content-library/${level}`} className="hover:text-primary-col transition whitespace-nowrap">{upperLevel}</a>
                <span>/</span>
                <span className="text-primary-col font-medium whitespace-nowrap">{config.label}</span>
              </div>
            </div>

            {/* Title + Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.bg} border ${config.border}`}>
                  <SkillIcon className={`w-4.5 h-4.5 ${config.color}`} />
                </div>
                <div>
                  <h1 className="text-xl font-display font-black text-primary-col truncate">{config.label} Library</h1>
                  <p className="text-sm text-secondary-col mt-0.5 hidden sm:block">{upperLevel} Level</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-secondary-col hover:bg-muted hover:text-primary-col transition flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Import Excel
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-sm hover:opacity-90 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Search Row */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${config.label.toLowerCase()} lessons...`}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-[var(--card)] text-primary-col placeholder:text-muted-col focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Table Card */}
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  {skill !== "shadowing" && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-col uppercase tracking-wide whitespace-nowrap">Lesson</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-col uppercase tracking-wide">Title</th>
                  {skill !== "shadowing" && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-col uppercase tracking-wide whitespace-nowrap">Items</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-col uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-col uppercase tracking-wide whitespace-nowrap">Updated</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-col uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {skill !== "shadowing" && (
                      <td className="px-4 py-3.5 text-sm font-medium text-primary-col whitespace-nowrap">
                        #{(item as VocabularyLesson).lessonNumber || "-"}
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-sm text-primary-col">{item.title}</div>
                    </td>
                    {skill !== "shadowing" && (
                      <td className="px-4 py-3.5 text-sm text-muted-col whitespace-nowrap">{getItemCount(item)}</td>
                    )}
                    <td className="px-4 py-3.5 whitespace-nowrap"><StatusBadge status={(item as unknown as { status?: string }).status} /></td>
                    <td className="px-4 py-3.5 text-sm text-muted-col whitespace-nowrap">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          type="button" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition" title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedItem(item); setShowDeleteConfirm(true); }}
                          type="button" className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition" title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={skill === "shadowing" ? 5 : 6} className="px-4 py-12 text-center text-muted-col text-sm">
                      No {config.label.toLowerCase()} content found{search ? " matching your search" : ""}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setSelectedItem(null); }}
        onConfirm={handleDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${selectedItem?.title}"? This action cannot be undone.`}
      />

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setSelectedItem(null); }} title={`Edit ${config.label} Lesson`} size="xl">
        {selectedItem && (
          <>
            {skill === "vocabulary" && <VocabEditForm lesson={selectedItem as VocabularyLesson} onSave={handleUpdate} onCancel={() => { setShowEditModal(false); setSelectedItem(null); }} />}
            {skill === "grammar" && <GrammarEditForm lesson={selectedItem as GrammarLesson} onSave={handleUpdate} onCancel={() => { setShowEditModal(false); setSelectedItem(null); }} />}
            {skill === "reading" && <ReadingEditForm lesson={selectedItem as ReadingLesson} onSave={handleUpdate} onCancel={() => { setShowEditModal(false); setSelectedItem(null); }} />}
            {skill === "listening" && <ListeningEditForm lesson={selectedItem as ListeningLesson} onSave={handleUpdate} onCancel={() => { setShowEditModal(false); setSelectedItem(null); }} />}
            {skill === "shadowing" && <ShadowingEditForm item={selectedItem as ShadowingItem} onSave={handleUpdate} onCancel={() => { setShowEditModal(false); setSelectedItem(null); }} />}
          </>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title={`Create ${config.label} Lesson`} size="lg">
        {skill === "vocabulary" && <VocabLessonForm onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />}
        {skill === "grammar" && <GrammarLessonForm onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />}
        {skill === "reading" && <ReadingLessonForm onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />}
        {skill === "listening" && <ListeningLessonForm onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />}
        {skill === "shadowing" && <ShadowingLessonForm onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />}
      </Modal>

      {/* Import Excel Modal */}
      <Modal open={showImportModal} onClose={() => setShowImportModal(false)} title={`Import ${config.label} from Excel`} size="md">
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
