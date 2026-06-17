import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Search, Filter, Plus, Eye, Edit3, Trash2,
  X, ChevronLeft, BookOpen, Clock, List, Loader2,
  CheckCircle, FileText, FolderOpen, Settings, ChevronRight,
  Copy, Tag, Calendar, ArrowUpDown, Save
} from "lucide-react";
import {
  grammarService,
  flashcardService,
  isUsingMockData,
} from "../services/content-library";
import type {
  GrammarItem,
  Flashcard,
  JLPTLevel,
} from "../types/content-library";
import { mockGrammar } from "../mock/grammar";

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export const Route = createFileRoute("/admin/grammar")({
  component: GrammarLibraryPage,
});

function GrammarLibraryPage() {
  const [grammarItems, setGrammarItems] = useState<GrammarItem[]>(mockGrammar);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "all">("all");
  const [viewingItem, setViewingItem] = useState<GrammarItem | null>(null);
  const [editingItem, setEditingItem] = useState<GrammarItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Filter grammar items
  const filteredItems = useMemo(() => {
    return grammarItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.grammarStructure.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = selectedLevel === "all" || item.jlptLevel === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }, [grammarItems, searchQuery, selectedLevel]);

  // Group by level
  const itemsByLevel = useMemo(() => {
    const grouped: Record<JLPTLevel, GrammarItem[]> = {
      N5: [],
      N4: [],
      N3: [],
      N2: [],
      N1: [],
    };
    filteredItems.forEach((item) => {
      grouped[item.jlptLevel].push(item);
    });
    return grouped;
  }, [filteredItems]);

  // Stats
  const totalCount = grammarItems.length;
  const levelCounts = useMemo(() => {
    return JLPT_LEVELS.reduce((acc, level) => {
      acc[level] = grammarItems.filter((item) => item.jlptLevel === level).length;
      return acc;
    }, {} as Record<JLPTLevel, number>);
  }, [grammarItems]);

  const handleCreateGrammar = (newItem: GrammarItem) => {
    setGrammarItems((prev) => [newItem, ...prev]);
    showToast("Grammar item created successfully!", "success");
    setShowCreateModal(false);
  };

  const handleUpdateGrammar = (updatedItem: GrammarItem) => {
    setGrammarItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    showToast("Grammar item updated successfully!", "success");
    setEditingItem(null);
  };

  const handleDeleteGrammar = (id: string) => {
    setGrammarItems((prev) => prev.filter((item) => item.id !== id));
    showToast("Grammar item deleted!", "success");
    if (viewingItem?.id === id) setViewingItem(null);
    if (editingItem?.id === id) setEditingItem(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Grammar Library</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Manage JLPT grammar structures
            {isUsingMockData && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--status-active)]/10 text-[var(--status-active)] text-xs">
                Demo Data
              </span>
            )}
          </p>
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
            <Plus className="w-4 h-4" /> Add Grammar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
          <input
            type="text"
            placeholder="Search grammar structures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl input-glass text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedLevel("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              selectedLevel === "all"
                ? "bg-gradient-hero text-white"
                : "glass-surface text-secondary-col hover:text-primary"
            }`}
          >
            All
          </button>
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                selectedLevel === level
                  ? "bg-gradient-hero text-white"
                  : "glass-surface text-secondary-col hover:text-primary"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Content by Level */}
      {selectedLevel === "all" ? (
        <div className="space-y-6">
          {JLPT_LEVELS.map((level) =>
            itemsByLevel[level].length > 0 ? (
              <div key={level} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-bold">
                    {level}
                  </span>
                  <span className="text-muted-col text-sm">
                    {itemsByLevel[level].length} items
                  </span>
                </div>
                <div className="grid gap-3">
                  {itemsByLevel[level].map((item) => (
                    <GrammarCard
                      key={item.id}
                      item={item}
                      onView={() => setViewingItem(item)}
                      onEdit={() => setEditingItem(item)}
                      onDelete={() => handleDeleteGrammar(item.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((item) => (
            <GrammarCard
              key={item.id}
              item={item}
              onView={() => setViewingItem(item)}
              onEdit={() => setEditingItem(item)}
              onDelete={() => handleDeleteGrammar(item.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="card-base p-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-col/40 mx-auto mb-4" />
          <h3 className="font-display font-bold text-primary-col text-lg mb-2">
            No Grammar Found
          </h3>
          <p className="text-secondary-col text-sm mb-6">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Add your first grammar structure to get started"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold mx-auto"
          >
            <Plus className="w-4 h-4" /> Add Grammar
          </button>
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {viewingItem && (
          <GrammarDetailModal
            item={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={() => {
              setEditingItem(viewingItem);
              setViewingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingItem) && (
          <GrammarFormModal
            item={editingItem}
            onClose={() => {
              setShowCreateModal(false);
              setEditingItem(null);
            }}
            onSubmit={editingItem ? handleUpdateGrammar : handleCreateGrammar}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-bold border shadow-lg z-50 ${
            toast.type === "success"
              ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
              : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </div>
  );
}

// ─── Grammar Card ───────────────────────────────────────────────────────────────
function GrammarCard({
  item,
  onView,
  onEdit,
  onDelete,
}: {
  item: GrammarItem;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-4 hover:border-primary/20 transition cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
              {item.jlptLevel}
            </span>
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted/10 text-muted-col"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="font-display font-bold text-primary-col text-base mb-1">
            {item.grammarStructure}
          </h3>
          <p className="text-secondary-col text-sm line-clamp-2">{item.meaning}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 rounded-lg glass-surface text-secondary-col hover:text-primary transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this grammar item?")) onDelete();
            }}
            className="p-2 rounded-lg glass-surface text-secondary-col hover:text-[var(--status-rejected)] transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Grammar Detail Modal ────────────────────────────────────────────────────────
function GrammarDetailModal({
  item,
  onClose,
  onEdit,
}: {
  item: GrammarItem;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                {item.jlptLevel}
              </span>
              <h2 className="font-display font-bold text-primary-col text-lg">
                {item.grammarStructure}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Meaning */}
          <div>
            <h3 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Meaning
            </h3>
            <p className="text-primary-col">{item.meaning}</p>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Tags
            </h3>
            <div className="flex gap-2 flex-wrap">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Example Sentences */}
          <div>
            <h3 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
              Example Sentences
            </h3>
            <div className="space-y-3">
              {item.exampleSentences.map((ex, i) => (
                <div key={i} className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-primary-col font-medium mb-1">{ex.sentence}</p>
                  <p className="text-secondary-col text-sm">{ex.meaning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-col pt-4 border-t separator">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created: {item.createdAt}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Updated: {item.updatedAt}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Grammar Form Modal ─────────────────────────────────────────────────────────
function GrammarFormModal({
  item,
  onClose,
  onSubmit,
}: {
  item: GrammarItem | null;
  onClose: () => void;
  onSubmit: (item: GrammarItem) => void;
}) {
  const [grammarStructure, setGrammarStructure] = useState(item?.grammarStructure || "");
  const [meaning, setMeaning] = useState(item?.meaning || "");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(item?.jlptLevel || "N5");
  const [tags, setTags] = useState(item?.tags.join(", ") || "");
  const [examples, setExamples] = useState(item?.exampleSentences || [
    { sentence: "", meaning: "" },
  ]);

  const addExample = () => {
    setExamples([...examples, { sentence: "", meaning: "" }]);
  };

  const updateExample = (index: number, field: "sentence" | "meaning", value: string) => {
    const updated = [...examples];
    updated[index][field] = value;
    setExamples(updated);
  };

  const removeExample = (index: number) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!grammarStructure || !meaning) {
      alert("Please fill in all required fields");
      return;
    }

    const newItem: GrammarItem = {
      id: item?.id || `gram-${Date.now()}`,
      grammarStructure,
      meaning,
      jlptLevel,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      exampleSentences: examples.filter((e) => e.sentence && e.meaning),
      createdAt: item?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    onSubmit(newItem);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <h2 className="font-display font-bold text-primary-col text-lg">
            {item ? "Edit Grammar" : "Add New Grammar"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Grammar Structure */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Grammar Structure *
            </label>
            <input
              type="text"
              value={grammarStructure}
              onChange={(e) => setGrammarStructure(e.target.value)}
              placeholder="e.g., ～は～です"
              className="w-full px-4 py-3 rounded-xl input-glass text-sm"
            />
          </div>

          {/* Meaning */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Meaning *
            </label>
            <textarea
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Explain the grammar structure..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              JLPT Level
            </label>
            <div className="flex gap-2">
              {JLPT_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setJlptLevel(level)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                    jlptLevel === level
                      ? "bg-gradient-hero text-white"
                      : "glass-surface text-secondary-col"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., basic, copula, declarative"
              className="w-full px-4 py-3 rounded-xl input-glass text-sm"
            />
          </div>

          {/* Example Sentences */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                Example Sentences
              </label>
              <button
                onClick={addExample}
                className="text-xs font-medium text-primary hover:underline"
              >
                + Add Example
              </button>
            </div>
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <div key={i} className="p-4 rounded-xl glass-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-col">
                      Example {i + 1}
                    </span>
                    {examples.length > 1 && (
                      <button
                        onClick={() => removeExample(i)}
                        className="text-xs text-[var(--status-rejected)] hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={ex.sentence}
                    onChange={(e) => updateExample(i, "sentence", e.target.value)}
                    placeholder="Japanese sentence"
                    className="w-full px-3 py-2 rounded-lg input-glass text-sm"
                  />
                  <input
                    type="text"
                    value={ex.meaning}
                    onChange={(e) => updateExample(i, "meaning", e.target.value)}
                    placeholder="Meaning / Translation"
                    className="w-full px-3 py-2 rounded-lg input-glass text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {item ? "Update" : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
