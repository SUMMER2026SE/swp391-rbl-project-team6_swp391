import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Search, Plus, Eye, Edit3, Trash2,
  X, Loader2, CheckCircle, ChevronRight,
  Tag, Calendar, Save, Clock, Volume2, FlipHorizontal
} from "lucide-react";
import { mockFlashcards } from "../mock/flashcards";
import type {
  Flashcard,
  JLPTLevel,
} from "../types/content-library";

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const DIFFICULTIES: Flashcard["difficulty"][] = ["easy", "medium", "hard"];

export const Route = createFileRoute("/admin/flashcard-library")({
  component: FlashcardLibraryPage,
});

function FlashcardLibraryPage() {
  const [items, setItems] = useState<Flashcard[]>(mockFlashcards);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Flashcard["difficulty"] | "all">("all");
  const [viewingItem, setViewingItem] = useState<Flashcard | null>(null);
  const [editingItem, setEditingItem] = useState<Flashcard | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = selectedLevel === "all" || item.jlptLevel === selectedLevel;
      const matchesDifficulty = selectedDifficulty === "all" || item.difficulty === selectedDifficulty;
      return matchesSearch && matchesLevel && matchesDifficulty;
    });
  }, [items, searchQuery, selectedLevel, selectedDifficulty]);

  const itemsByLevel = useMemo(() => {
    const grouped: Record<JLPTLevel, Flashcard[]> = {
      N5: [], N4: [], N3: [], N2: [], N1: [],
    };
    filteredItems.forEach((item) => {
      grouped[item.jlptLevel].push(item);
    });
    return grouped;
  }, [filteredItems]);

  const totalCount = items.length;
  const levelCounts = useMemo(() => {
    return JLPT_LEVELS.reduce((acc, level) => {
      acc[level] = items.filter((item) => item.jlptLevel === level).length;
      return acc;
    }, {} as Record<JLPTLevel, number>);
  }, [items]);

  const difficultyCounts = useMemo(() => {
    return DIFFICULTIES.reduce((acc, diff) => {
      acc[diff] = items.filter((item) => item.difficulty === diff).length;
      return acc;
    }, {} as Record<Flashcard["difficulty"], number>);
  }, [items]);

  const handleCreate = (newItem: Flashcard) => {
    setItems((prev) => [newItem, ...prev]);
    showToast("Flashcard created!", "success");
    setShowCreateModal(false);
  };

  const handleUpdate = (updatedItem: Flashcard) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    showToast("Flashcard updated!", "success");
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast("Flashcard deleted!", "success");
    if (viewingItem?.id === id) setViewingItem(null);
    if (editingItem?.id === id) setEditingItem(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Flashcard Library</h1>
          <p className="text-sm text-secondary-col mt-0.5">Manage study flashcards for JLPT preparation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl glass-surface text-xs">
            <div className="text-center">
              <p className="text-primary font-bold text-lg">{totalCount}</p>
              <p className="text-muted-col">Total</p>
            </div>
            {JLPT_LEVELS.slice(0, 3).map((level) => (
              <div key={level} className="text-center">
                <p className="text-primary font-bold">{levelCounts[level]}</p>
                <p className="text-muted-col">{level}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Add Flashcard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
          <input
            type="text"
            placeholder="Search flashcards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl input-glass text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-muted-col self-center">Level:</span>
          <button
            onClick={() => setSelectedLevel("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedLevel === "all" ? "bg-gradient-hero text-white" : "glass-surface text-secondary-col hover:text-primary"
            }`}
          >
            All
          </button>
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedLevel === level ? "bg-gradient-hero text-white" : "glass-surface text-secondary-col hover:text-primary"
              }`}
            >
              {level}
            </button>
          ))}
          <span className="text-xs font-medium text-muted-col self-center ml-4">Difficulty:</span>
          <button
            onClick={() => setSelectedDifficulty("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedDifficulty === "all" ? "bg-gradient-hero text-white" : "glass-surface text-secondary-col hover:text-primary"
            }`}
          >
            All
          </button>
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                selectedDifficulty === diff ? "bg-gradient-hero text-white" : "glass-surface text-secondary-col hover:text-primary"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {selectedLevel === "all" ? (
        <div className="space-y-6">
          {JLPT_LEVELS.map((level) =>
            itemsByLevel[level].length > 0 ? (
              <div key={level} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-bold">{level}</span>
                  <span className="text-muted-col text-sm">{itemsByLevel[level].length} cards</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {itemsByLevel[level].map((item) => (
                    <FlashcardCard key={item.id} item={item} onView={() => setViewingItem(item)} onEdit={() => setEditingItem(item)} onDelete={() => handleDelete(item.id)} />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <FlashcardCard key={item.id} item={item} onView={() => setViewingItem(item)} onEdit={() => setEditingItem(item)} onDelete={() => handleDelete(item.id)} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="card-base p-12 text-center">
          <Layers className="w-12 h-12 text-muted-col/40 mx-auto mb-4" />
          <h3 className="font-display font-bold text-primary-col text-lg mb-2">No Flashcards Found</h3>
          <p className="text-secondary-col text-sm mb-6">
            {searchQuery ? "Try adjusting your search" : "Add your first flashcard"}
          </p>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold mx-auto">
            <Plus className="w-4 h-4" /> Add Flashcard
          </button>
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {viewingItem && (
          <FlashcardDetailModal item={viewingItem} onClose={() => setViewingItem(null)} onEdit={() => { setEditingItem(viewingItem); setViewingItem(null); }} />
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingItem) && (
          <FlashcardFormModal
            item={editingItem}
            onClose={() => { setShowCreateModal(false); setEditingItem(null); }}
            onSubmit={editingItem ? handleUpdate : handleCreate}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-bold border shadow-lg z-50 ${
            toast.type === "success" ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25" : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </div>
  );
}

// ─── Flashcard Card ───────────────────────────────────────────────────────────────
function FlashcardCard({ item, onView, onEdit, onDelete }: { item: Flashcard; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const difficultyColors = {
    easy: "bg-[var(--status-active)]/10 text-[var(--status-active)]",
    medium: "bg-yellow-500/10 text-yellow-600",
    hard: "bg-[var(--status-rejected)]/10 text-[var(--status-rejected)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-4 hover:border-primary/20 transition cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{item.jlptLevel}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${difficultyColors[item.difficulty]}`}>
            {item.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg glass-surface text-secondary-col hover:text-primary">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) onDelete(); }} className="p-1.5 rounded-lg glass-surface text-secondary-col hover:text-[var(--status-rejected)]">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="mb-3">
        <p className="text-muted-col text-xs mb-1">Front (Question)</p>
        <p className="text-primary-col font-medium text-sm line-clamp-2">{item.front}</p>
      </div>
      <div className="border-t separator pt-3">
        <p className="text-muted-col text-xs mb-1">Back (Answer)</p>
        <p className="text-secondary-col text-sm line-clamp-2">{item.back}</p>
      </div>
      <div className="flex gap-2 flex-wrap mt-3">
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted/10 text-muted-col">{tag}</span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Flashcard Detail Modal ───────────────────────────────────────────────────────
function FlashcardDetailModal({ item, onClose, onEdit }: { item: Flashcard; onClose: () => void; onEdit: () => void }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const difficultyColors = {
    easy: "bg-[var(--status-active)]/10 text-[var(--status-active)]",
    medium: "bg-yellow-500/10 text-yellow-600",
    hard: "bg-[var(--status-rejected)]/10 text-[var(--status-rejected)]",
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg glass-modal rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary mr-2">{item.jlptLevel}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${difficultyColors[item.difficulty]}`}>
                {item.difficulty}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Flashcard Display */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative min-h-[200px] p-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer hover:border-primary/30 transition"
          >
            <div className="absolute top-3 right-3 flex items-center gap-2 text-muted-col">
              <FlipHorizontal className="w-4 h-4" />
              <span className="text-xs">Click to flip</span>
            </div>
            {!isFlipped ? (
              <div className="text-center">
                <p className="text-muted-col text-xs mb-2">FRONT (Question)</p>
                <p className="text-primary-col font-bold text-2xl">{item.front}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-muted-col text-xs mb-2">BACK (Answer)</p>
                <p className="text-primary-col text-lg whitespace-pre-line">{item.back}</p>
              </div>
            )}
          </div>

          {/* Example Sentence */}
          {item.exampleSentence && (
            <div className="mt-6 p-4 rounded-xl bg-primary/5">
              <p className="text-muted-col text-xs mb-2">Example</p>
              <p className="text-primary-col font-medium mb-1">{item.exampleSentence.sentence}</p>
              <p className="text-secondary-col text-sm">{item.exampleSentence.meaning}</p>
            </div>
          )}

          {/* Tags */}
          <div className="mt-6">
            <p className="text-muted-col text-xs mb-2">Tags</p>
            <div className="flex gap-2 flex-wrap">
              {item.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{tag}</span>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-col pt-4 border-t separator">
            <span>Created: {item.createdAt}</span>
            <span>Updated: {item.updatedAt}</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold">Close</button>
          <button onClick={onEdit} className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold flex items-center justify-center gap-2">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Flashcard Form Modal ─────────────────────────────────────────────────────────
function FlashcardFormModal({ item, onClose, onSubmit }: { item: Flashcard | null; onClose: () => void; onSubmit: (item: Flashcard) => void }) {
  const [front, setFront] = useState(item?.front || "");
  const [back, setBack] = useState(item?.back || "");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(item?.jlptLevel || "N5");
  const [difficulty, setDifficulty] = useState<Flashcard["difficulty"]>(item?.difficulty || "medium");
  const [tags, setTags] = useState(item?.tags.join(", ") || "");
  const [exSentence, setExSentence] = useState(item?.exampleSentence?.sentence || "");
  const [exMeaning, setExMeaning] = useState(item?.exampleSentence?.meaning || "");

  const handleSubmit = () => {
    if (!front || !back) {
      alert("Please fill in front and back of the flashcard");
      return;
    }

    const newItem: Flashcard = {
      id: item?.id || `fc-${Date.now()}`,
      front,
      back,
      jlptLevel,
      difficulty,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      exampleSentence: exSentence && exMeaning ? { sentence: exSentence, meaning: exMeaning } : undefined,
      createdAt: item?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    onSubmit(newItem);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg glass-modal rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <h2 className="font-display font-bold text-primary-col text-lg">{item ? "Edit Flashcard" : "Add Flashcard"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Front */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Front (Question/Word) *</label>
            <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} placeholder="e.g., ～は～です" className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none" />
          </div>

          {/* Back */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Back (Answer/Meaning) *</label>
            <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} placeholder="e.g., A là B (mệnh đề khẳng định)&#10;Ví dụ: 私は学生です。" className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none" />
          </div>

          {/* Level & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Level</label>
              <select value={jlptLevel} onChange={(e) => setJlptLevel(e.target.value as JLPTLevel)} className="w-full px-4 py-3 rounded-xl input-glass text-sm">
                {JLPT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Flashcard["difficulty"])} className="w-full px-4 py-3 rounded-xl input-glass text-sm">
                {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Tags (comma-separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., grammar, basic, copula" className="w-full px-4 py-3 rounded-xl input-glass text-sm" />
          </div>

          {/* Example */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Example Sentence (optional)</label>
            <input type="text" value={exSentence} onChange={(e) => setExSentence(e.target.value)} placeholder="Japanese sentence" className="w-full px-4 py-3 rounded-xl input-glass text-sm mb-2" />
            <input type="text" value={exMeaning} onChange={(e) => setExMeaning(e.target.value)} placeholder="Translation" className="w-full px-4 py-3 rounded-xl input-glass text-sm" />
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {item ? "Update" : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
