import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit3, Trash2, Eye, BookOpen, Layers,
  X, Save, BookText, Tag, Star, FlipHorizontal,
  GripVertical, AlertTriangle, EyeOff, ListChecks, Volume2,
  Loader2, Send
} from "lucide-react";
import { teacherFlashcardApi } from "../lib/api/teacherFlashcard";
import {
  type FlashcardSetResponse,
  type FlashcardSetDetailResponse,
  type FlashcardCardResponse,
  type FlashcardSetCreateRequest,
  type FlashcardSetUpdateRequest,
  type FlashcardCardCreateRequest,
  type FlashcardCardUpdateRequest,
  type FlashcardSetStatus,
} from "../lib/api/flashcardMappers";
import { ApiError } from "../lib/api/client";

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];
const PAGE_SIZE = 9;

// ─── Status badge ───────────────────────────────────────────────────────────────
function statusBadge(status: FlashcardSetStatus) {
  const map: Record<FlashcardSetStatus, { cls: string; label: string }> = {
    DRAFT: { cls: "bg-slate-100 text-slate-600 border-slate-200", label: "Draft" },
    PENDING: { cls: "bg-yellow-50 text-yellow-600 border-yellow-200", label: "Pending" },
    APPROVED: { cls: "bg-green-50 text-green-600 border-green-200", label: "Approved" },
    REJECTED: { cls: "bg-red-50 text-red-500 border-red-200", label: "Rejected" },
  };
  const s = map[status] ?? map.DRAFT;
  return { cls: `px-2 py-0.5 rounded-full text-[10px] font-black border ${s.cls}`, label: s.label };
}

// ─── Level badge ────────────────────────────────────────────────────────────────
function levelBadge(l: string | null | undefined) {
  const map: Record<string, string> = {
    N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    N4: "bg-green-50 text-green-500 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-800",
    N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    N1: "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-300 border-red-200 dark:border-red-800",
  };
  return map[l ?? ""] ?? "bg-slate-50 text-slate-500 border-slate-200";
}

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

export const Route = createFileRoute("/teacher/flashcards")({
  component: TeacherFlashcardsPage,
});

// ─── Pagination ────────────────────────────────────────────────────────────────
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
        {" / "}
        <span className="font-semibold text-foreground">{total}</span>
        {" sets"}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 transition"
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
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 transition"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Card Form Component (shared) ───────────────────────────────────────────────
type CardFormState = { frontText: string; backText: string; example: string; hint: string };

interface CardFormProps {
  mode: "add" | "edit";
  onSave: () => void;
  onCancel: () => void;
  form: CardFormState;
  setForm: React.Dispatch<React.SetStateAction<CardFormState>>;
}

function CardForm({ mode, onSave, onCancel, form, setForm }: CardFormProps) {
  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-hero text-white flex items-center justify-center text-[10px] font-black">
            {mode === "add" ? "+" : "✎"}
          </div>
          <span className="text-sm font-bold text-foreground">
            {mode === "add" ? "Add new card" : "Edit card"}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-primary/10 transition text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
              Front text <span className="text-red-400">*</span>
            </label>
            <input
              value={form.frontText}
              onChange={(e) => setForm((f) => ({ ...f, frontText: e.target.value }))}
              placeholder="環境"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
              Back text <span className="text-red-400">*</span>
            </label>
            <input
              value={form.backText}
              onChange={(e) => setForm((f) => ({ ...f, backText: e.target.value }))}
              placeholder="Môi trường"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
            Example
          </label>
          <input
            value={form.example}
            onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))}
            placeholder="今日は天気が很好です。"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
            Hint
          </label>
          <input
            value={form.hint}
            onChange={(e) => setForm((f) => ({ ...f, hint: e.target.value }))}
            placeholder="Optional hint for the card..."
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-muted-foreground hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!form.frontText.trim() || !form.backText.trim()}
            className="flex-1 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition flex items-center justify-center gap-2"
          >
            {mode === "add" ? (
              <><Plus className="w-4 h-4" /> Add card</>
            ) : (
              <><Save className="w-4 h-4" /> Update</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Toast ───────────────────────────────────────────────────────────
interface ToastState {
  message: string;
  type: "success" | "error";
}

function Toast({ toasts }: { toasts: ToastState[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border ${
              t.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function TeacherFlashcardsPage() {
  // ── Data state ───────────────────────────────────────────────────────────────
  const [sets, setSets] = useState<FlashcardSetResponse[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [setsError, setSetsError] = useState<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [page, setPage] = useState(1);

  // ── Add set modal ───────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addLevel, setAddLevel] = useState("N5");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── View set modal ──────────────────────────────────────────────────────────
  const [viewing, setViewing] = useState<FlashcardSetDetailResponse | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ── Edit set modal ──────────────────────────────────────────────────────────
  const [editSetId, setEditSetId] = useState<string | null>(null);
  const [editSet, setEditSet] = useState<FlashcardSetDetailResponse | null>(null);
  const [editCards, setEditCards] = useState<FlashcardCardResponse[]>([]);
  const [editSetInfo, setEditSetInfo] = useState({ title: "", description: "", level: "N5" });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Card forms ─────────────────────────────────────────────────────────────
  const [showAddCard, setShowAddCard] = useState(false);
  const [addCardForm, setAddCardForm] = useState({ frontText: "", backText: "", example: "", hint: "" });
  const [addingCard, setAddingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardCardResponse | null>(null);
  const [editCardForm, setEditCardForm] = useState({ frontText: "", backText: "", example: "", hint: "" });
  const [savingCard, setSavingCard] = useState(false);
  const [deletingCard, setDeletingCard] = useState<FlashcardCardResponse | null>(null);
  const [deletingCardLoading, setDeletingCardLoading] = useState(false);

  // ── Delete set ──────────────────────────────────────────────────────────────
  const [deleting, setDeleting] = useState<FlashcardSetResponse | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // ── Submit set ──────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState<Set<string>>(new Set());

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToasts((prev) => [...prev, { message, type }]);
    setTimeout(() => setToasts((prev) => prev.slice(1)), 3000);
  }, []);

  // ── Load sets on mount ─────────────────────────────────────────────────────
  const loadSets = useCallback(async () => {
    setLoadingSets(true);
    setSetsError(null);
    try {
      const data = await teacherFlashcardApi.getFlashcardSets();
      setSets(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load flashcard sets.";
      setSetsError(msg);
      showToast(msg, "error");
    } finally {
      setLoadingSets(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSets();
  }, [loadSets]);

  // ── Reset page on filter change ─────────────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [search, levelFilter]);

  // ── Filtered + paginated sets ────────────────────────────────────────────────
  const filtered = sets.filter((s) => {
    const mLvl = levelFilter === "All" || s.level === levelFilter;
    const mSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return mLvl && mSearch;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalCards = sets.reduce((sum, s) => sum + (s.cardCount ?? 0), 0);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // Add set
  const handleAddSet = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const payload: FlashcardSetCreateRequest = {
        title: addName.trim(),
        description: addDesc.trim() || undefined,
        level: addLevel || undefined,
      };
      const created = await teacherFlashcardApi.createFlashcardSet(payload);
      setSets((prev) => [created, ...prev]);
      setAddName("");
      setAddDesc("");
      setAddLevel("N5");
      setShowAdd(false);
      showToast("Flashcard set created successfully!", "success");
      // Open edit modal for the new set
      openEditSet(created.id);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create flashcard set.";
      setAddError(msg);
      showToast(msg, "error");
    } finally {
      setAdding(false);
    }
  };

  // Open edit set
  const openEditSet = async (setId: string) => {
    setEditSetId(setId);
    setEditLoading(true);
    setEditError(null);
    try {
      const detail = await teacherFlashcardApi.getFlashcardSetDetail(setId);
      setEditSet(detail);
      setEditCards(detail.cards ?? []);
      setEditSetInfo({
        title: detail.title,
        description: detail.description ?? "",
        level: detail.level ?? "N5",
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load flashcard set.";
      showToast(msg, "error");
      setEditSetId(null);
    } finally {
      setEditLoading(false);
    }
  };

  // Save edit set
  const handleSaveEditSet = async () => {
    if (!editSetId || !editSetInfo.title.trim()) return;
    setEditSaving(true);
    setEditError(null);
    try {
      // Auto-add draft card if form is filled but not added yet
      if (addCardForm.frontText.trim() && addCardForm.backText.trim()) {
        console.log("[Flashcards] Auto-adding draft card before save:", addCardForm);
        const draftPayload: FlashcardCardCreateRequest = {
          frontText: addCardForm.frontText.trim(),
          backText: addCardForm.backText.trim(),
          example: addCardForm.example.trim() || undefined,
          hint: addCardForm.hint.trim() || undefined,
        };
        const draftCreated = await teacherFlashcardApi.createCard(editSetId, draftPayload);
        setEditCards((prev) => [...prev, draftCreated]);
        setAddCardForm({ frontText: "", backText: "", example: "", hint: "" });
        setShowAddCard(false);
      }

      console.log("[Flashcards] cards before save:", editCards);
      const payload: FlashcardSetUpdateRequest = {
        title: editSetInfo.title.trim(),
        description: editSetInfo.description.trim() || undefined,
        level: editSetInfo.level || undefined,
      };
      console.log("[Flashcards] payload:", payload);
      console.log("[Flashcards] editCards count:", editCards.length);

      const updated = await teacherFlashcardApi.updateFlashcardSet(editSetId, payload);
      console.log("[Flashcards] updated set:", updated);

      // Update local sets list
      setSets((prev) => prev.map((s) => (s.id === editSetId ? updated : s)));

      // Close modal
      closeEditSet();

      // Refetch the entire list to get accurate cardCount from backend
      await loadSets();

      showToast("Flashcard set saved successfully!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save flashcard set.";
      setEditError(msg);
      showToast(msg, "error");
    } finally {
      setEditSaving(false);
    }
  };

  // Add card
  const handleAddCard = async () => {
    if (!addCardForm.frontText.trim() || !addCardForm.backText.trim() || !editSetId) return;
    setAddingCard(true);
    try {
      const payload: FlashcardCardCreateRequest = {
        frontText: addCardForm.frontText.trim(),
        backText: addCardForm.backText.trim(),
        example: addCardForm.example.trim() || undefined,
        hint: addCardForm.hint.trim() || undefined,
      };
      console.log("[Flashcards] Adding card with payload:", payload);
      const created = await teacherFlashcardApi.createCard(editSetId, payload);
      console.log("[Flashcards] Card created:", created);
      setEditCards((prev) => [...prev, created]);
      setAddCardForm({ frontText: "", backText: "", example: "", hint: "" });
      setShowAddCard(false);
      showToast("Card added successfully!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to add card.";
      showToast(msg, "error");
    } finally {
      setAddingCard(false);
    }
  };

  // Open edit card
  const openEditCard = (card: FlashcardCardResponse) => {
    setEditingCard(card);
    setEditCardForm({
      frontText: card.frontText,
      backText: card.backText,
      example: card.example ?? "",
      hint: card.hint ?? "",
    });
    setShowAddCard(false);
  };

  // Save edit card
  const handleSaveEditCard = async () => {
    if (!editingCard || !editCardForm.frontText.trim()) return;
    setSavingCard(true);
    try {
      const payload: FlashcardCardUpdateRequest = {
        frontText: editCardForm.frontText.trim(),
        backText: editCardForm.backText.trim(),
        example: editCardForm.example.trim() || undefined,
        hint: editCardForm.hint.trim() || undefined,
      };
      const updated = await teacherFlashcardApi.updateCard(editingCard.id, payload);
      setEditCards((prev) => prev.map((c) => (c.id === editingCard.id ? updated : c)));
      setEditingCard(null);
      showToast("Card updated!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update card.";
      showToast(msg, "error");
    } finally {
      setSavingCard(false);
    }
  };

  // Delete card
  const handleDeleteCard = async () => {
    if (!deletingCard) return;
    setDeletingCardLoading(true);
    try {
      await teacherFlashcardApi.deleteCard(deletingCard.id);
      setEditCards((prev) => prev.filter((c) => c.id !== deletingCard.id));
      setDeletingCard(null);
      showToast("Card deleted!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete card.";
      showToast(msg, "error");
    } finally {
      setDeletingCardLoading(false);
    }
  };

  // Delete set
  const handleDeleteSet = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await teacherFlashcardApi.deleteFlashcardSet(deleting.id);
      setSets((prev) => prev.filter((s) => s.id !== deleting.id));
      setDeleting(null);
      showToast("Flashcard set deleted!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete flashcard set.";
      showToast(msg, "error");
    } finally {
      setDeletingLoading(false);
    }
  };

  // Submit set for review
  const handleSubmitSet = async (setId: string) => {
    setSubmitting((prev) => new Set([...prev, setId]));
    try {
      const updated = await teacherFlashcardApi.submitFlashcardSet(setId);
      setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
      showToast("Flashcard set submitted for review!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit flashcard set.";
      showToast(msg, "error");
    } finally {
      setSubmitting((prev) => {
        const next = new Set(prev);
        next.delete(setId);
        return next;
      });
    }
  };

  // Open view modal
  const openView = async (setId: string) => {
    setViewLoading(true);
    try {
      const detail = await teacherFlashcardApi.getFlashcardSetDetail(setId);
      setViewing(detail);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load flashcard set.";
      showToast(msg, "error");
    } finally {
      setViewLoading(false);
    }
  };

  const closeEditSet = () => {
    setEditSetId(null);
    setEditSet(null);
    setEditCards([]);
    setShowAddCard(false);
    setEditingCard(null);
    setEditError(null);
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  MAIN PAGE
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <Toast toasts={toasts} />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Flashcard Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sets.length} sets · {totalCards} cards
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add flashcard set
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Flashcard sets", value: sets.length, icon: Layers, color: "text-blue-500" },
          { label: "Total cards", value: totalCards, icon: BookText, color: "text-green-500" },
          {
            label: "Pending review",
            value: sets.filter((s) => s.status === "PENDING").length,
            icon: Star,
            color: "text-yellow-500",
          },
          {
            label: "Approved",
            value: sets.filter((s) => s.status === "APPROVED").length,
            icon: Tag,
            color: "text-purple-500",
          },
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
                  <div
                    className={`font-display font-black text-xl leading-none ${stat.color}`}
                  >
                    {stat.label === "Levels" ? stat.value : stat.value.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-64 max-w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search flashcard sets..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {JLPT_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setLevelFilter(lvl);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                levelFilter === lvl
                  ? "bg-gradient-hero text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading / Error / Empty ─────────────────────────────────── */}
      {loadingSets ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading flashcard sets...</span>
        </div>
      ) : setsError ? (
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="font-semibold text-base text-red-500">{setsError}</p>
          <button
            onClick={loadSets}
            className="mt-3 px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-base text-muted-foreground">No flashcard sets found</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 text-primary underline text-sm"
          >
            + Create your first set
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((s, i) => {
              const st = statusBadge(s.status);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden"
                >
                  <div className="h-1.5 bg-gradient-hero w-full" />
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center">
                          {i + 1 + (page - 1) * PAGE_SIZE}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-display font-black text-sm text-foreground leading-tight truncate">
                            {s.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(s.level)}`}>
                            {s.level ?? "—"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                        {s.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {s.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookText className="w-3 h-3" />
                            {s.cardCount ?? 0} cards
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openView(s.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => openEditSet(s.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500 text-xs font-bold transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleting(s)}
                        className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 text-xs font-bold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <PaginationUI current={page} total={filtered.length} onPage={setPage} />
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          ADD SET MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAdd && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setShowAdd(false);
              setAddName("");
              setAddDesc("");
              setAddLevel("N5");
              setAddError(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5"
              style={{ maxWidth: 480 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-lg text-foreground">
                  Create new flashcard set
                </h2>
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setAddName("");
                    setAddDesc("");
                    setAddLevel("N5");
                    setAddError(null);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {addError && (
                <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-semibold">
                  {addError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Set name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Greetings N5"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={addDesc}
                    onChange={(e) => setAddDesc(e.target.value)}
                    placeholder="Short description for this flashcard set..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Level
                  </label>
                  <select
                    value={addLevel}
                    onChange={(e) => setAddLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setAddName("");
                    setAddDesc("");
                    setAddLevel("N5");
                    setAddError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSet}
                  disabled={!addName.trim() || adding}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition flex items-center justify-center gap-2"
                >
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                  {adding ? "Creating..." : "Create & manage cards"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════
          DELETE SET MODAL
      ═════════════════════════════════════════════════════════════════════ */}
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
              <h2 className="font-display font-black text-lg mb-1">Delete flashcard set?</h2>
              <p className="text-sm text-muted-foreground mb-1">
                <strong className="text-foreground">{deleting.title}</strong> will be permanently
                deleted.
              </p>
              <p className="text-xs text-red-400 mb-5">
                Includes {deleting.cardCount ?? 0} cards inside.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleting(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSet}
                  disabled={deletingLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition flex items-center justify-center gap-2"
                >
                  {deletingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deletingLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════
          VIEW SET MODAL — READ-ONLY
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewing !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewing(null)}
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
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="font-display font-black text-lg text-foreground">
                      {viewing.title}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${levelBadge(viewing.level)}`}
                    >
                      {viewing.level ?? "—"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-black border ${statusBadge(viewing.status).cls}`}
                    >
                      {statusBadge(viewing.status).label}
                    </span>
                  </div>
                  {viewing.description && (
                    <p className="text-sm text-muted-foreground">{viewing.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(viewing.cards ?? []).length} cards · Created{" "}
                    {new Date(viewing.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-muted-foreground font-semibold border border-slate-200 dark:border-slate-700">
                    <EyeOff className="w-3 h-3 inline mr-1" />
                    Read-only
                  </div>
                  <button
                    onClick={() => setViewing(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card list — read only */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
                {viewLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground text-sm">Loading cards...</span>
                  </div>
                ) : (viewing.cards ?? []).length === 0 ? (
                  <div className="py-20 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="font-semibold text-muted-foreground">No cards yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click Edit (✏️) to manage flashcards
                    </p>
                  </div>
                ) : (
                  viewing.cards.map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden hover:border-primary/30 transition"
                    >
                      <div className="h-1 bg-gradient-hero w-full" />
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                              <span className="font-display font-black text-xl text-foreground">
                                {card.frontText}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakJapanese(card.frontText);
                                }}
                                title="Play pronunciation"
                                className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-500 flex items-center justify-center transition flex-shrink-0"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-sm font-semibold text-foreground mb-2">
                              {card.backText}
                            </div>
                            {card.example && (
                              <div className="text-xs text-muted-foreground italic mb-2">
                                "{card.example}"
                              </div>
                            )}
                            {card.hint && (
                              <div className="text-xs text-yellow-600 italic mb-2">
                                💡 Hint: {card.hint}
                              </div>
                            )}
                          </div>
                          <FlipHorizontal className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {(viewing.cards ?? []).length} cards
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setViewing(null);
                      openEditSet(viewing.id);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-500 text-sm font-bold transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {viewing.status === "DRAFT" && (
                    <button
                      onClick={() => {
                        setViewing(null);
                        handleSubmitSet(viewing.id);
                      }}
                      disabled={submitting.has(viewing.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-950/30 hover:bg-green-100 text-green-600 text-sm font-bold transition-all disabled:opacity-50"
                    >
                      {submitting.has(viewing.id) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Submit for review
                    </button>
                  )}
                  <button
                    onClick={() => setViewing(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════
          EDIT SET MODAL — FULL CARD MANAGEMENT
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editSetId !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeEditSet}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 880, maxHeight: "92vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-gradient-hero text-white flex items-center justify-center text-xs font-black">
                      <ListChecks className="w-3 h-3" />
                    </div>
                    <h2 className="font-display font-black text-lg text-foreground">
                      Manage flashcards
                    </h2>
                  </div>
                  {editSet && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {editSetInfo.title || editSet.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(editSetInfo.level)}`}
                      >
                        {editSetInfo.level}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadge(editSet.status).cls}`}
                      >
                        {statusBadge(editSet.status).label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {editCards.length} cards
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={closeEditSet}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading flashcard set...</span>
                </div>
              ) : (
                <>
                  {editError && (
                    <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-semibold flex-shrink-0">
                      {editError}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* ── Set info mini-form ── */}
                    <div className="flex items-end gap-3 flex-shrink-0">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                          Set name
                        </label>
                        <input
                          value={editSetInfo.title}
                          onChange={(e) =>
                            setEditSetInfo((i) => ({ ...i, title: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                          Level
                        </label>
                        <select
                          value={editSetInfo.level}
                          onChange={(e) =>
                            setEditSetInfo((i) => ({ ...i, level: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                            <option key={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                          Description
                        </label>
                        <input
                          value={editSetInfo.description}
                          onChange={(e) =>
                            setEditSetInfo((i) => ({ ...i, description: e.target.value }))
                          }
                          placeholder="Short description..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddCard(true)}
                        disabled={editSaving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Add card
                      </button>
                    </div>

                    {/* ── Add/Edit card form ── */}
                    {(showAddCard || editingCard) && (
                      <div className="flex-shrink-0">
                        <CardForm
                          mode={editingCard ? "edit" : "add"}
                          onSave={editingCard ? handleSaveEditCard : handleAddCard}
                          onCancel={() => {
                            setShowAddCard(false);
                            setEditingCard(null);
                            setAddCardForm({ frontText: "", backText: "", example: "", hint: "" });
                            setEditCardForm({ frontText: "", backText: "", example: "", hint: "" });
                          }}
                          form={editingCard ? editCardForm : addCardForm}
                          setForm={editingCard ? setEditCardForm : setAddCardForm}
                        />
                      </div>
                    )}

                    {/* ── Card list ── */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
                      {editCards.length === 0 && !showAddCard && !editingCard ? (
                        <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          <Layers className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
                          <p className="font-semibold text-muted-foreground text-sm mb-1">
                            No cards yet in this set
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click "Add card" to get started
                          </p>
                          <button
                            onClick={() => setShowAddCard(true)}
                            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition"
                          >
                            <Plus className="w-4 h-4" /> Add first flashcard
                          </button>
                        </div>
                      ) : (
                        editCards.map((card, i) => (
                          <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition group"
                          >
                            <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0 cursor-grab" />
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground">
                                  {card.frontText}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakJapanese(card.frontText);
                                  }}
                                  title="Play pronunciation"
                                  className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-500 flex items-center justify-center transition flex-shrink-0"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs text-muted-foreground">→</span>
                                <span className="text-xs font-semibold text-foreground">
                                  {card.backText}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {card.hint && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 border border-yellow-100 dark:border-yellow-900">
                                    💡 {card.hint}
                                  </span>
                                )}
                                {card.example && (
                                  <span className="text-[9px] text-muted-foreground italic truncate max-w-[120px]">
                                    "{card.example}"
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => openEditCard(card)}
                                className="w-8 h-8 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center text-blue-400 hover:text-blue-600 transition"
                                title="Edit card"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingCard(card)}
                                className="w-8 h-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-red-400 hover:text-red-500 transition"
                                title="Delete card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {editCards.length > 0 ? `${editCards.length} cards` : "No cards"}
                    </span>
                    <div className="flex gap-2">
                      {editSet?.status === "DRAFT" && (
                        <button
                          onClick={() => handleSubmitSet(editSetId!)}
                          disabled={submitting.has(editSetId!)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-950/30 hover:bg-green-100 text-green-600 text-sm font-bold transition-all disabled:opacity-50"
                        >
                          {submitting.has(editSetId!) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Submit for review
                        </button>
                      )}
                      <button
                        onClick={closeEditSet}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditSet}
                        disabled={editSaving || !editSetInfo.title.trim()}
                        className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow flex items-center gap-2 hover:opacity-90 transition disabled:opacity-40"
                      >
                        {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" /> Save all
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════
          DELETE CARD CONFIRM MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deletingCard !== null && (
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeletingCard(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl text-center border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: 400 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/20 grid place-items-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="font-display font-black text-lg mb-1">Delete card?</h2>
              <p className="text-sm text-muted-foreground mb-1">
                Are you sure you want to delete{" "}
                <strong className="text-foreground">"{deletingCard.frontText}"</strong> (
                {deletingCard.backText})?
              </p>
              <p className="text-xs text-red-400 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingCard(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCard}
                  disabled={deletingCardLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition flex items-center justify-center gap-2"
                >
                  {deletingCardLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deletingCardLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
