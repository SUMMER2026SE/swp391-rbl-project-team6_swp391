import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones, Search, Plus, Eye, Edit3, Trash2,
  X, Loader2, CheckCircle, ChevronRight, Play, Pause,
  Copy, Tag, Calendar, Save, Clock, Volume2
} from "lucide-react";
import { mockListening } from "../mock/listening";
import type {
  ListeningItem,
  ListeningQuestion,
  JLPTLevel,
} from "../types/content-library";

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export const Route = createFileRoute("/admin/listening-library")({
  component: ListeningLibraryPage,
});

function ListeningLibraryPage() {
  const [items, setItems] = useState<ListeningItem[]>(mockListening);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "all">("all");
  const [viewingItem, setViewingItem] = useState<ListeningItem | null>(null);
  const [editingItem, setEditingItem] = useState<ListeningItem | null>(null);
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
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = selectedLevel === "all" || item.jlptLevel === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }, [items, searchQuery, selectedLevel]);

  const itemsByLevel = useMemo(() => {
    const grouped: Record<JLPTLevel, ListeningItem[]> = {
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

  const handleCreate = (newItem: ListeningItem) => {
    setItems((prev) => [newItem, ...prev]);
    showToast("Listening exercise created!", "success");
    setShowCreateModal(false);
  };

  const handleUpdate = (updatedItem: ListeningItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    showToast("Listening exercise updated!", "success");
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast("Listening exercise deleted!", "success");
    if (viewingItem?.id === id) setViewingItem(null);
    if (editingItem?.id === id) setEditingItem(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Listening Library</h1>
          <p className="text-sm text-secondary-col mt-0.5">Manage JLPT listening exercises</p>
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
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
          <input
            type="text"
            placeholder="Search by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl input-glass text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedLevel("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              selectedLevel === "all" ? "bg-gradient-hero text-white" : "glass-surface text-secondary-col hover:text-primary"
            }`}
          >
            All
          </button>
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                selectedLevel === level ? "bg-gradient-hero text-white" : "glass-surface text-secondary-col hover:text-primary"
              }`}
            >
              {level}
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
                  <span className="text-muted-col text-sm">{itemsByLevel[level].length} exercises</span>
                </div>
                <div className="grid gap-3">
                  {itemsByLevel[level].map((item) => (
                    <ListeningCard key={item.id} item={item} onView={() => setViewingItem(item)} onEdit={() => setEditingItem(item)} onDelete={() => handleDelete(item.id)} />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((item) => (
            <ListeningCard key={item.id} item={item} onView={() => setViewingItem(item)} onEdit={() => setEditingItem(item)} onDelete={() => handleDelete(item.id)} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="card-base p-12 text-center">
          <Headphones className="w-12 h-12 text-muted-col/40 mx-auto mb-4" />
          <h3 className="font-display font-bold text-primary-col text-lg mb-2">No Listening Exercises Found</h3>
          <p className="text-secondary-col text-sm mb-6">
            {searchQuery ? "Try adjusting your search" : "Add your first listening exercise"}
          </p>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold mx-auto">
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {viewingItem && (
          <ListeningDetailModal item={viewingItem} onClose={() => setViewingItem(null)} onEdit={() => { setEditingItem(viewingItem); setViewingItem(null); }} />
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingItem) && (
          <ListeningFormModal
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

// ─── Listening Card ──────────────────────────────────────────────────────────────
function ListeningCard({ item, onView, onEdit, onDelete }: { item: ListeningItem; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-4 hover:border-primary/20 transition cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Headphones className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{item.jlptLevel}</span>
            <span className="text-muted-col text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDuration(item.duration)}
            </span>
            <span className="text-muted-col text-xs">{item.questions.length} questions</span>
          </div>
          <h3 className="font-display font-bold text-primary-col text-base mb-1">{item.title}</h3>
          <div className="flex gap-2 flex-wrap">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted/10 text-muted-col">{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-lg glass-surface text-secondary-col hover:text-primary">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) onDelete(); }} className="p-2 rounded-lg glass-surface text-secondary-col hover:text-[var(--status-rejected)]">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Listening Detail Modal ──────────────────────────────────────────────────────
function ListeningDetailModal({ item, onClose, onEdit }: { item: ListeningItem; onClose: () => void; onEdit: () => void }) {
  const [playingQuestion, setPlayingQuestion] = useState<number | null>(null);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{item.jlptLevel}</span>
              <h2 className="font-display font-bold text-primary-col text-lg">{item.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Audio Player Placeholder */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-4">
              <button className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                <Play className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-primary/20">
                  <div className="h-2 rounded-full bg-gradient-hero w-1/3" />
                </div>
                <p className="text-muted-col text-xs mt-2">Audio placeholder - {item.audioUrl}</p>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div>
            <h3 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Transcript</h3>
            <div className="p-4 rounded-xl bg-muted/5 whitespace-pre-wrap text-sm">
              {item.transcript}
            </div>
          </div>

          {/* Questions */}
          <div>
            <h3 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3">Questions ({item.questions.length})</h3>
            <div className="space-y-3">
              {item.questions.map((q, i) => (
                <div key={q.id} className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="font-medium text-primary-col mb-2">{i + 1}. {q.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, j) => (
                      <span key={j} className={`px-3 py-1.5 rounded-lg text-xs ${j === q.correctAnswer ? "bg-[var(--status-active)]/20 text-[var(--status-active)] font-medium" : "bg-muted/10 text-secondary-col"}`}>
                        {opt}
                      </span>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-muted-col text-xs mt-2 italic">Explanation: {q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {item.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{tag}</span>
            ))}
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

// ─── Listening Form Modal ────────────────────────────────────────────────────────
function ListeningFormModal({ item, onClose, onSubmit }: { item: ListeningItem | null; onClose: () => void; onSubmit: (item: ListeningItem) => void }) {
  const [title, setTitle] = useState(item?.title || "");
  const [audioUrl, setAudioUrl] = useState(item?.audioUrl || "");
  const [transcript, setTranscript] = useState(item?.transcript || "");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(item?.jlptLevel || "N5");
  const [duration, setDuration] = useState(item?.duration || 120);
  const [tags, setTags] = useState(item?.tags.join(", ") || "");
  const [questions, setQuestions] = useState<ListeningQuestion[]>(item?.questions || [{ id: "q1", question: "", options: ["", "", "", ""], correctAnswer: 0 }]);

  const addQuestion = () => {
    setQuestions([...questions, { id: `q${questions.length + 1}`, question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const updateQuestion = (index: number, field: keyof ListeningQuestion, value: any) => {
    const updated = [...questions];
    if (field === "options") {
      updated[index].options = value;
    } else {
      (updated[index] as any)[field] = value;
    }
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!title || !transcript) {
      alert("Please fill in title and transcript");
      return;
    }

    const newItem: ListeningItem = {
      id: item?.id || `listen-${Date.now()}`,
      title,
      audioUrl,
      transcript,
      questions: questions.filter((q) => q.question && q.options.every((o) => o)),
      jlptLevel,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      duration,
      createdAt: item?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    onSubmit(newItem);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <h2 className="font-display font-bold text-primary-col text-lg">{item ? "Edit Exercise" : "Add Listening Exercise"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="N5 - At the Station" className="w-full px-4 py-3 rounded-xl input-glass text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Level</label>
              <select value={jlptLevel} onChange={(e) => setJlptLevel(e.target.value as JLPTLevel)} className="w-full px-4 py-3 rounded-xl input-glass text-sm">
                {JLPT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Audio URL</label>
            <input type="text" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="/audio/n5-station.mp3" className="w-full px-4 py-3 rounded-xl input-glass text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Duration (seconds)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 120)} className="w-full px-4 py-3 rounded-xl input-glass text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Tags</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="dialogue, daily-life" className="w-full px-4 py-3 rounded-xl input-glass text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Transcript *</label>
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={4} placeholder="Enter the full transcript..." className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-muted-col uppercase tracking-wider">Questions</label>
              <button onClick={addQuestion} className="text-xs font-medium text-primary hover:underline">+ Add Question</button>
            </div>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={q.id} className="p-4 rounded-xl glass-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-col">Question {i + 1}</span>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(i)} className="text-xs text-[var(--status-rejected)] hover:underline">Remove</button>
                    )}
                  </div>
                  <input type="text" value={q.question} onChange={(e) => updateQuestion(i, "question", e.target.value)} placeholder="Question text" className="w-full px-3 py-2 rounded-lg input-glass text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input type="radio" checked={q.correctAnswer === j} onChange={() => updateQuestion(i, "correctAnswer", j)} className="accent-primary" />
                        <input type="text" value={opt} onChange={(e) => { const newOpts = [...q.options]; newOpts[j] = e.target.value; updateQuestion(i, "options", newOpts); }} placeholder={`Option ${j + 1}`} className="flex-1 px-3 py-1.5 rounded-lg input-glass text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
