import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, Plus, Eye, Edit3, Trash2,
  X, Loader2, CheckCircle, ChevronRight, ChevronDown,
  Copy, Tag, Calendar, Save, Volume2, Upload, FileText,
  FolderOpen, Mic, Download, MoreVertical, BookMarked, Settings,
  Layers
} from "lucide-react";
import { getVocabulary, subscribeVocabulary } from "../stores/vocabulary-store";
import type {
  VocabularyItem,
  JLPTLevel,
  Flashcard,
} from "../types/content-library";

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

interface Lesson {
  id: string;
  title: string;
  jlptLevel: JLPTLevel;
  vocabCount: number;
  items: VocabularyItem[];
  isExpanded: boolean;
}

export const Route = createFileRoute("/admin/vocabulary-library")({
  component: VocabularyLibraryPage,
});

function VocabularyLibraryPage() {
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>(getVocabulary());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "all">("all");
  const [viewingItem, setViewingItem] = useState<VocabularyItem | null>(null);
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [selectedForFlashcard, setSelectedForFlashcard] = useState<Set<string>>(new Set());

  // Subscribe to vocabulary changes from other pages
  useEffect(() => {
    return subscribeVocabulary(setVocabItems);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Group items by lesson
  const lessonsData = useMemo(() => {
    const filtered = vocabItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hiragana.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.meaning.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = selectedLevel === "all" || item.jlptLevel === selectedLevel;
      return matchesSearch && matchesLevel;
    });

    const lessonMap = filtered.reduce((acc, item) => {
      if (!acc[item.lessonId]) {
        acc[item.lessonId] = [];
      }
      acc[item.lessonId].push(item);
      return acc;
    }, {} as Record<string, VocabularyItem[]>);

    return Object.entries(lessonMap)
      .map(([lessonId, items]) => ({
        id: lessonId,
        title: getLessonTitle(lessonId),
        jlptLevel: items[0].jlptLevel,
        vocabCount: items.length,
        items: items.sort((a, b) => a.word.localeCompare(b.word)),
        isExpanded: expandedLessons[lessonId] ?? false,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [vocabItems, searchQuery, selectedLevel, expandedLessons]);

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  // Stats
  const totalCount = vocabItems.length;
  const lessonCount = lessonsData.length;
  const levelCounts = useMemo(() => {
    return JLPT_LEVELS.reduce((acc, level) => {
      acc[level] = vocabItems.filter((item) => item.jlptLevel === level).length;
      return acc;
    }, {} as Record<JLPTLevel, number>);
  }, [vocabItems]);

  const handleCreate = (newItem: VocabularyItem) => {
    setVocabItems((prev) => [newItem, ...prev]);
    showToast("Vocabulary created!", "success");
    setShowCreateModal(false);
  };

  const handleUpdate = (updatedItem: VocabularyItem) => {
    setVocabItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    showToast("Vocabulary updated!", "success");
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    setVocabItems((prev) => prev.filter((item) => item.id !== id));
    showToast("Vocabulary deleted!", "success");
    if (viewingItem?.id === id) setViewingItem(null);
    if (editingItem?.id === id) setEditingItem(null);
  };

  const handleCreateLesson = (lessonId: string, jlptLevel: JLPTLevel) => {
    setSelectedLessonId(lessonId);
    setShowCreateModal(true);
  };

  const handleBatchUpload = (items: VocabularyItem[]) => {
    setVocabItems((prev) => [...items, ...prev]);
    showToast(`Imported ${items.length} vocabulary items!`, "success");
    setShowUploadModal(false);
  };

  const getAllLessonIds = () => {
    const ids = new Set(vocabItems.map((v) => v.lessonId));
    return Array.from(ids).sort();
  };

  // Create flashcard from selected vocabulary
  const handleCreateFlashcard = (vocab: VocabularyItem, showToastFn?: (msg: string) => void) => {
    const flashcard: Flashcard = {
      id: `fc-${Date.now()}-${vocab.id}`,
      front: vocab.word,
      back: vocab.meaning,
      jlptLevel: vocab.jlptLevel,
      lessonId: vocab.lessonId,
      tags: vocab.tags,
      difficulty: "medium",
      exampleSentence: vocab.exampleSentence,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    addFlashcard(flashcard);
    const message = `Created flashcard for "${vocab.word}"!`;
    showToastFn ? showToastFn(message) : showToast(message, "success");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Vocabulary Library</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Manage JLPT vocabulary organized by lessons
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl glass-surface text-xs">
            <div className="text-center">
              <p className="text-primary font-bold text-lg">{totalCount}</p>
              <p className="text-muted-col">Words</p>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div className="text-center">
              <p className="text-primary font-bold text-lg">{lessonCount}</p>
              <p className="text-muted-col">Lessons</p>
            </div>
            {JLPT_LEVELS.slice(0, 2).map((level) => (
              <div key={level} className="text-center">
                <p className="text-primary font-bold">{levelCounts[level]}</p>
                <p className="text-muted-col">{level}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition"
          >
            <Upload className="w-4 h-4" /> Import File
          </button>
          <button
            onClick={() => setShowLessonModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> New Lesson
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
          <input
            type="text"
            placeholder="Search vocabulary..."
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

      {/* Lessons List */}
      <div className="space-y-4">
        {lessonsData.map((lesson) => (
          <div key={lesson.id} className="card-base overflow-hidden">
            {/* Lesson Header */}
            <div
              onClick={() => toggleLesson(lesson.id)}
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--accent)] transition"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  lesson.isExpanded ? "bg-gradient-hero text-white" : "bg-primary/10 text-primary"
                }`}>
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-primary-col">{lesson.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                      {lesson.jlptLevel}
                    </span>
                  </div>
                  <p className="text-muted-col text-xs">
                    {lesson.vocabCount} words · Lesson {lesson.id.replace("lesson-", "")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateLesson(lesson.id, lesson.jlptLevel);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition"
                >
                  + Add Word
                </button>
                {lesson.isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-col" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-col" />
                )}
              </div>
            </div>

            {/* Vocabulary Items */}
            <AnimatePresence>
              {lesson.isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t separator"
                >
                  <div className="divide-y divide-[var(--border)]">
                    {lesson.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--accent)] transition group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold">{item.word.slice(0, 2)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary-col">{item.word}</span>
                            <span className="text-secondary-col text-sm">({item.hiragana})</span>
                          </div>
                          <p className="text-muted-col text-xs truncate">{item.meaning}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => setViewingItem(item)}
                            className="p-1.5 rounded-lg glass-surface text-secondary-col hover:text-primary"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 rounded-lg glass-surface text-secondary-col hover:text-primary"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this word?")) handleDelete(item.id);
                            }}
                            className="p-1.5 rounded-lg glass-surface text-secondary-col hover:text-[var(--status-rejected)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {lessonsData.length === 0 && (
        <div className="card-base p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-col/40 mx-auto mb-4" />
          <h3 className="font-display font-bold text-primary-col text-lg mb-2">
            No Vocabulary Found
          </h3>
          <p className="text-secondary-col text-sm mb-6">
            {searchQuery ? "Try adjusting your search" : "Create a lesson to add vocabulary"}
          </p>
          <button
            onClick={() => setShowLessonModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold mx-auto"
          >
            <Plus className="w-4 h-4" /> New Lesson
          </button>
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {viewingItem && (
          <VocabDetailModal
            item={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={() => {
              setEditingItem(viewingItem);
              setViewingItem(null);
            }}
            onCreateFlashcard={handleCreateFlashcard}
          />
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingItem) && (
          <VocabFormModal
            item={editingItem}
            defaultLessonId={selectedLessonId || undefined}
            onClose={() => {
              setShowCreateModal(false);
              setEditingItem(null);
              setSelectedLessonId(null);
            }}
            onSubmit={editingItem ? handleUpdate : handleCreate}
          />
        )}
      </AnimatePresence>

      {/* New Lesson Modal */}
      <AnimatePresence>
        {showLessonModal && (
          <NewLessonModal
            existingLessons={getAllLessonIds()}
            onClose={() => setShowLessonModal(false)}
            onCreated={(lessonId, jlptLevel, title) => {
              setSelectedLessonId(lessonId);
              setShowLessonModal(false);
              setShowCreateModal(true);
              showToast(`Lesson "${title}" created! Add vocabulary now.`, "success");
            }}
          />
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadVocabModal
            existingLessons={getAllLessonIds()}
            onClose={() => setShowUploadModal(false)}
            onImport={handleBatchUpload}
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

// ─── Helper Functions ────────────────────────────────────────────────────────────
function getLessonTitle(lessonId: string): string {
  const titles: Record<string, string> = {
    "lesson-01": "Lesson 1 - Basic Greetings",
    "lesson-02": "Lesson 2 - Numbers & Time",
    "lesson-03": "Lesson 3 - Food & Drink",
    "lesson-04": "Lesson 4 - Transportation",
    "lesson-05": "Lesson 5 - Daily Activities",
    "lesson-06": "Lesson 6 - Shopping",
    "lesson-n4-01": "N4 Lesson 1",
    "lesson-n4-02": "N4 Lesson 2",
    "lesson-n4-03": "N4 Lesson 3",
    "lesson-n3-01": "N3 Lesson 1",
    "lesson-n3-02": "N3 Lesson 2",
    "lesson-n2-01": "N2 Lesson 1",
    "lesson-n2-02": "N2 Lesson 2",
    "lesson-n1-01": "N1 Lesson 1",
    "lesson-n1-02": "N1 Lesson 2",
  };
  return titles[lessonId] || `Lesson ${lessonId.replace("lesson-", "")}`;
}

// ─── New Lesson Modal ────────────────────────────────────────────────────────────
function NewLessonModal({
  existingLessons,
  onClose,
  onCreated,
}: {
  existingLessons: string[];
  onClose: () => void;
  onCreated: (lessonId: string, jlptLevel: JLPTLevel, title: string) => void;
}) {
  const [lessonNumber, setLessonNumber] = useState(existingLessons.length + 1);
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>("N5");
  const [lessonTitle, setLessonTitle] = useState("");

  const lessonId = `lesson-${lessonNumber}`;

  const handleCreate = () => {
    const title = lessonTitle || `Lesson ${lessonNumber}`;
    onCreated(lessonId, jlptLevel, title);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-gray-900 text-lg">Create New Lesson</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 bg-white">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Lesson ID</label>
            <input
              type="text"
              value={lessonId}
              readOnly
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900"
            />
            <p className="text-gray-400 text-xs mt-1">This will be used to group vocabulary</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Lesson Title</label>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="e.g., Basic Greetings"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">JLPT Level</label>
            <div className="flex gap-2">
              {JLPT_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setJlptLevel(level)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                    jlptLevel === level
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-gray-900 text-sm font-medium">Preview</p>
            <p className="text-gray-500 text-xs mt-1">
              {lessonTitle || `Lesson ${lessonNumber}`} · {jlptLevel}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition">
            Cancel
          </button>
          <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition">
            <Save className="w-4 h-4" /> Create & Add Words
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Upload Vocabulary Modal ────────────────────────────────────────────────────
function UploadVocabModal({
  existingLessons,
  onClose,
  onImport,
}: {
  existingLessons: string[];
  onClose: () => void;
  onImport: (items: VocabularyItem[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedLesson, setSelectedLesson] = useState(existingLessons[0] || "lesson-01");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>("N5");
  const [previewData, setPreviewData] = useState<VocabularyItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const items = parseVocabFile(content, selectedLesson, jlptLevel);
        if (items.length === 0) {
          setError("No valid vocabulary found in file");
        } else {
          setPreviewData(items);
        }
      } catch {
        setError("Failed to parse file. Please check format.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const parseVocabFile = (content: string, lessonId: string, level: JLPTLevel): VocabularyItem[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    const items: VocabularyItem[] = [];
    const today = new Date().toISOString().split("T")[0];

    lines.forEach((line, index) => {
      // Format: word|hiragana|meaning|exampleSentence|exampleMeaning
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length >= 3) {
        items.push({
          id: `vocab-${Date.now()}-${index}`,
          word: parts[0],
          hiragana: parts[1],
          meaning: parts[2],
          exampleSentence: parts[4]
            ? { sentence: parts[3], meaning: parts[4] }
            : { sentence: `例：${parts[0]}`, meaning: "Example" },
          lessonId,
          jlptLevel: level,
          tags: ["imported"],
          createdAt: today,
          updatedAt: today,
        });
      }
    });

    return items;
  };

  const handleImport = () => {
    if (previewData.length > 0) {
      // Update lessonId and level for all items
      const items = previewData.map((item, index) => ({
        ...item,
        id: `vocab-${Date.now()}-${index}`,
        lessonId: selectedLesson,
        jlptLevel,
      }));
      onImport(items);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-900 text-lg">Import Vocabulary</h2>
              <p className="text-gray-400 text-xs">Upload file to batch import vocabulary</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 bg-white">
          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Upload File</label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                file ? "border-green-500/50 bg-green-50" : "border-gray-300 hover:border-blue-400"
              }`}
            >
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="vocab-file"
              />
              <label htmlFor="vocab-file" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-gray-900 font-semibold">{file.name}</p>
                      <p className="text-gray-400 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Click to upload file</p>
                    <p className="text-gray-400 text-xs mt-1">.txt or .csv file</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Lesson & Level Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Add to Lesson</label>
              <select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none"
              >
                {existingLessons.map((id) => (
                  <option key={id} value={id}>{getLessonTitle(id)}</option>
                ))}
                <option value={`lesson-${existingLessons.length + 1}`}>+ New Lesson</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">JLPT Level</label>
              <select
                value={jlptLevel}
                onChange={(e) => setJlptLevel(e.target.value as JLPTLevel)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none"
              >
                {JLPT_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* File Format Help */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-gray-600 text-xs font-bold mb-2">File Format (one word per line):</p>
            <code className="text-gray-900 text-xs block">
              日本|にほん|Nhật Bản|私は日本に行きたい。|Tôi muốn đi Nhật Bản。
            </code>
            <p className="text-gray-400 text-xs mt-2">Format: word|hiragana|meaning|[example sentence]|[example meaning]</p>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div>
              <p className="text-gray-600 text-xs font-bold mb-2">
                Preview ({previewData.length} words found)
              </p>
              <div className="max-h-40 overflow-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-gray-500">Word</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-500">Kana</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-500">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.slice(0, 10).map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-900">{item.word}</td>
                        <td className="px-3 py-2 text-gray-600">{item.hiragana}</td>
                        <td className="px-3 py-2 text-gray-400">{item.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <p className="px-3 py-2 text-gray-400 text-xs text-center border-t border-gray-200">
                    + {previewData.length - 10} more words...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={previewData.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Import {previewData.length} Words
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Vocab Detail Modal ─────────────────────────────────────────────────────────
function VocabDetailModal({
  item,
  onClose,
  onEdit,
  onCreateFlashcard,
}: {
  item: VocabularyItem;
  onClose: () => void;
  onEdit: () => void;
  onCreateFlashcard: (vocab: VocabularyItem, showToast: (msg: string) => void) => void;
}) {
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const handleCreateFlashcard = () => {
    onCreateFlashcard(item, (msg) => {
      setToast({ message: msg });
      setTimeout(() => setToast(null), 2500);
    });
    onClose();
  };
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                {item.jlptLevel}
              </span>
              <h2 className="font-display font-bold text-gray-900 text-lg">
                {item.word}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-white">
          <div className="text-center p-6 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
            <p className="font-bold text-gray-900 text-3xl mb-2">{item.word}</p>
            <p className="text-blue-600 text-xl">{item.hiragana}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Meaning</h3>
            <p className="text-gray-900 text-lg">{item.meaning}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Example</h3>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-gray-900 font-medium mb-1">{item.exampleSentence.sentence}</p>
              <p className="text-gray-600 text-sm">{item.exampleSentence.meaning}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {item.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 pt-4 border-t border-gray-200">
            <span>Lesson: {item.lessonId}</span>
            <span>Created: {item.createdAt}</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition">
            Close
          </button>
          <button onClick={handleCreateFlashcard} className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition">
            <Layers className="w-4 h-4" /> Create Flashcard
          </button>
          <button onClick={onEdit} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 rounded-xl text-sm font-bold bg-purple-600 text-white shadow-lg whitespace-nowrap"
          >
            {toast.message}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Vocab Form Modal ────────────────────────────────────────────────────────────
function VocabFormModal({
  item,
  defaultLessonId,
  onClose,
  onSubmit,
}: {
  item: VocabularyItem | null;
  defaultLessonId?: string;
  onClose: () => void;
  onSubmit: (item: VocabularyItem) => void;
}) {
  const [word, setWord] = useState(item?.word || "");
  const [hiragana, setHiragana] = useState(item?.hiragana || "");
  const [meaning, setMeaning] = useState(item?.meaning || "");
  const [lessonId, setLessonId] = useState(item?.lessonId || defaultLessonId || "lesson-01");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(item?.jlptLevel || "N5");
  const [tags, setTags] = useState(item?.tags.join(", ") || "");
  const [exSentence, setExSentence] = useState(item?.exampleSentence.sentence || "");
  const [exMeaning, setExMeaning] = useState(item?.exampleSentence.meaning || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!word || !meaning) {
      alert("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);

    // Simulate network delay for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newItem: VocabularyItem = {
      id: item?.id || `vocab-${Date.now()}`,
      word,
      hiragana: hiragana || word,
      meaning,
      lessonId,
      jlptLevel,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      exampleSentence: { sentence: exSentence || `例：${word}`, meaning: exMeaning || "" },
      createdAt: item?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setIsSubmitting(false);
    onSubmit(newItem);
  };

  const commonTags = ["noun", "verb", "adjective", "adverb", "basic", "advanced", "daily-life", "business", "formal", "casual"];

  const toggleTag = (tag: string) => {
    const currentTags = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    if (currentTags.includes(tag)) {
      setTags(currentTags.filter((t) => t !== tag).join(", "));
    } else {
      setTags([...currentTags, tag].join(", "));
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-xl glass-modal rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-primary-col text-lg">
              {item ? "Edit Vocabulary" : "Add New Vocabulary"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-[60vh] overflow-auto">
          <div className="space-y-5">
            {/* Word & Hiragana */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                  Word / Kanji *
                </label>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="新しい"
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                  Hiragana
                </label>
                <input
                  type="text"
                  value={hiragana}
                  onChange={(e) => setHiragana(e.target.value)}
                  placeholder="あたらしい"
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                />
              </div>
            </div>

            {/* Meaning */}
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                Meaning *
              </label>
              <textarea
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="Explain the meaning..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none"
              />
            </div>

            {/* Level & Lesson */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                  JLPT Level
                </label>
                <div className="flex gap-2">
                  {JLPT_LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => setJlptLevel(l)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                        jlptLevel === l
                          ? "bg-gradient-hero text-white"
                          : "glass-surface text-secondary-col"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                  Lesson ID
                </label>
                <input
                  type="text"
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  placeholder="lesson-01"
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                />
              </div>
            </div>

            {/* Example Sentence */}
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                Example Sentence
              </label>
              <input
                type="text"
                value={exSentence}
                onChange={(e) => setExSentence(e.target.value)}
                placeholder="私は新しい車を買いました。"
                className="w-full px-4 py-3 rounded-xl input-glass text-sm"
              />
            </div>

            {/* Translation */}
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                Translation
              </label>
              <input
                type="text"
                value={exMeaning}
                onChange={(e) => setExMeaning(e.target.value)}
                placeholder="I bought a new car."
                className="w-full px-4 py-3 rounded-xl input-glass text-sm"
              />
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
                placeholder="noun, daily-life, beginner"
                className="w-full px-4 py-3 rounded-xl input-glass text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !word || !meaning}
            className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {item ? "Update" : "Save"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getJLPTLevelName(level: JLPTLevel): string {
  const names: Record<JLPTLevel, string> = {
    N5: "Beginner",
    N4: "Elementary",
    N3: "Intermediate",
    N2: "Pre-Advanced",
    N1: "Advanced",
  };
  return names[level];
}
