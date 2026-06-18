import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Search, Trash2,
  X, ChevronRight, ChevronDown,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  RotateCcw, Shuffle,
  Plus, BookOpen, Check, Eye,
  Send, Pencil, Save, EyeOff, ArrowLeft
} from "lucide-react";
import { getFlashcards, subscribeFlashcards, addFlashcard, deleteFlashcard as deleteFlashcardFromStore } from "../stores/flashcard-store";
import { getVocabulary, subscribeVocabulary } from "../stores/vocabulary-store";
import type {
  Flashcard,
  JLPTLevel,
  VocabularyItem,
} from "../types/content-library";

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export const Route = createFileRoute("/admin/flashcard-library")({
  component: FlashcardLibraryPage,
});

function getLessonTitle(lessonId: string): string {
  const lessonNames: Record<string, string> = {
    "lesson-01": "Bài 1: Giới thiệu về bản thân",
    "lesson-02": "Bài 2: Động từ & Tính từ",
    "lesson-03": "Bài 3: Mệnh đề & Ngữ cảnh",
    "lesson-04": "Bài 4: Ngữ pháp nâng cao",
    "lesson-05": "Bài 5: Kết nối câu",
    "lesson-06": "Bài 6: Ngôn ngữ học thuật",
    "lesson-07": "Bài 7: Liên từ cơ bản",
    "lesson-08": "Bài 8: Liên từ nâng cao",
  };
  return lessonNames[lessonId] || `Bài ${lessonId.replace("lesson-", "")}`;
}

function FlashcardLibraryPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>(getFlashcards());
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>(getVocabulary());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "all">("all");
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCards, setPreviewCards] = useState<Flashcard[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    return subscribeFlashcards(setFlashcards);
  }, []);

  useEffect(() => {
    return subscribeVocabulary(setVocabulary);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  const lessonsData = useMemo(() => {
    const filtered = flashcards.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = selectedLevel === "all" || item.jlptLevel === selectedLevel;
      return matchesSearch && matchesLevel;
    });

    const lessonMap = filtered.reduce((acc, item) => {
      if (!acc[item.lessonId]) {
        acc[item.lessonId] = [];
      }
      acc[item.lessonId].push(item);
      return acc;
    }, {} as Record<string, Flashcard[]>);

    return Object.entries(lessonMap)
      .map(([lessonId, items]) => ({
        id: lessonId,
        title: getLessonTitle(lessonId),
        jlptLevel: items[0].jlptLevel,
        cardCount: items.length,
        items: items,
        isExpanded: expandedLessons[lessonId] ?? false,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [flashcards, searchQuery, selectedLevel, expandedLessons]);

  const totalCount = flashcards.length;
  const levelCounts = useMemo(() => {
    return JLPT_LEVELS.reduce((acc, level) => {
      acc[level] = flashcards.filter((item) => item.jlptLevel === level).length;
      return acc;
    }, {} as Record<JLPTLevel, number>);
  }, [flashcards]);

  const handleDelete = (id: string) => {
    deleteFlashcardFromStore(id);
    showToast("Flashcard deleted!", "success");
  };

  const handlePublish = (newCards: Flashcard[]) => {
    newCards.forEach(card => addFlashcard(card));
    setShowPreview(false);
    setPreviewCards([]);
    showToast(`Published ${newCards.length} flashcards!`, "success");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Flashcard Library</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Manage flashcards organized by lessons
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl glass-surface text-xs">
            <div className="text-center">
              <p className="text-primary font-bold text-lg">{totalCount}</p>
              <p className="text-muted-col">Published</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Create from Vocabulary
          </button>
        </div>
      </div>

      {/* Level Quick Stats */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedLevel("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedLevel === "all"
              ? "bg-gradient-hero text-white shadow-md"
              : "glass-surface text-secondary-col hover:text-primary hover:bg-primary/5"
          }`}
        >
          All <span className="opacity-70 ml-1">({totalCount})</span>
        </button>
        {JLPT_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(selectedLevel === level ? "all" : level)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              selectedLevel === level
                ? "bg-gradient-hero text-white shadow-md"
                : "glass-surface text-secondary-col hover:text-primary hover:bg-primary/5"
            }`}
          >
            {level} <span className="opacity-70 ml-1">({levelCounts[level]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
        <input
          type="text"
          placeholder="Search flashcards by word or meaning..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl input-glass text-sm"
        />
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {lessonsData.length === 0 ? (
          <div className="card-base p-12 text-center">
            <Layers className="w-12 h-12 text-muted-col mx-auto mb-4" />
            <h3 className="font-semibold text-primary-col mb-2">No flashcards yet</h3>
            <p className="text-muted-col text-sm mb-4">Create flashcards from vocabulary to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Flashcards
            </button>
          </div>
        ) : (
          lessonsData.map((lesson) => (
            <div key={lesson.id} className="card-base overflow-hidden">
              {/* Lesson Header */}
              <button
                onClick={() => toggleLesson(lesson.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    lesson.jlptLevel === "N5" ? "bg-blue-100 text-blue-600" :
                    lesson.jlptLevel === "N4" ? "bg-green-100 text-green-600" :
                    lesson.jlptLevel === "N3" ? "bg-yellow-100 text-yellow-600" :
                    lesson.jlptLevel === "N2" ? "bg-orange-100 text-orange-600" :
                    "bg-red-100 text-red-600"
                  }`}>
                    <span className="text-sm font-bold">{lesson.jlptLevel}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-primary-col">{lesson.title}</h3>
                    <p className="text-xs text-muted-col">{lesson.cardCount} flashcards</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lesson.isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-col" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-col" />
                  )}
                </div>
              </button>

              {/* Quizlet-Style Study Area */}
              <AnimatePresence>
                {lesson.isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <StudyMode
                      flashcards={lesson.items}
                      lessonTitle={lesson.title}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Create Modal - Create from Vocabulary Lesson */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateFromLessonModal
            vocabulary={vocabulary}
            flashcards={flashcards}
            onClose={() => setShowCreateModal(false)}
            onPreview={(cards) => {
              setPreviewCards(cards);
              setShowPreview(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal - Flashcard Style */}
      <AnimatePresence>
        {showPreview && previewCards.length > 0 && (
          <FlashcardPreviewModal
            cards={previewCards}
            onClose={() => {
              setShowPreview(false);
              setPreviewCards([]);
            }}
            onPublish={() => handlePublish(previewCards)}
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

// ─── Create from Lesson Modal ─────────────────────────────────────────────────────
function CreateFromLessonModal({
  vocabulary,
  flashcards,
  onClose,
  onPreview,
}: {
  vocabulary: VocabularyItem[];
  flashcards: Flashcard[];
  onClose: () => void;
  onPreview: (cards: Flashcard[]) => void;
}) {
  const [selectedLesson, setSelectedLesson] = useState("lesson-01");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "all">("all");

  // Get unique lessons that have vocabulary
  const availableLessons = useMemo(() => {
    const lessonIds = [...new Set(vocabulary.map(v => v.lessonId))].sort();
    return lessonIds.map(id => ({
      id,
      title: getLessonTitle(id),
      vocabCount: vocabulary.filter(v => v.lessonId === id).length,
      jlptLevel: vocabulary.find(v => v.lessonId === id)?.jlptLevel || "N5",
    }));
  }, [vocabulary]);

  const filteredVocab = useMemo(() => {
    return vocabulary.filter(v => {
      const matchesLesson = v.lessonId === selectedLesson;
      const matchesLevel = selectedLevel === "all" || v.jlptLevel === selectedLevel;
      return matchesLesson && matchesLevel;
    });
  }, [vocabulary, selectedLesson, selectedLevel]);

  // Check which vocab already has flashcard
  const vocabWithFlashcard = useMemo(() => {
    return new Set(
      flashcards.filter(fc => filteredVocab.some(v => v.word === fc.front)).map(fc => fc.front)
    );
  }, [flashcards, filteredVocab]);

  const vocabWithoutFlashcard = filteredVocab.filter(v => !vocabWithFlashcard.has(v.word));

  const handlePreview = () => {
    if (vocabWithoutFlashcard.length === 0) return;
    
    const newFlashcards: Flashcard[] = vocabWithoutFlashcard.map(vocab => ({
      id: `fc-${Date.now()}-${vocab.id}`,
      front: vocab.word,
      back: vocab.meaning,
      jlptLevel: vocab.jlptLevel,
      lessonId: vocab.lessonId,
      tags: vocab.tags,
      difficulty: "medium" as const,
      exampleSentence: vocab.exampleSentence,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    }));
    
    onPreview(newFlashcards);
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
        className="relative z-10 w-full max-w-2xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-primary-col text-lg">Create Flashcards from Vocabulary</h2>
              <p className="text-muted-col text-xs">Select a lesson to create flashcards</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b separator bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm"
            >
              {availableLessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title} ({lesson.vocabCount} words)
                </option>
              ))}
            </select>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setSelectedLevel("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  selectedLevel === "all" ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                All
              </button>
              {JLPT_LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setSelectedLevel(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    selectedLevel === l ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredVocab.map(vocab => {
              const hasFlashcard = vocabWithFlashcard.has(vocab.word);
              return (
                <div
                  key={vocab.id}
                  className={`p-3 rounded-lg border text-center transition ${
                    hasFlashcard
                      ? "bg-green-50 border-green-200 opacity-60"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <p className={`font-bold text-sm ${hasFlashcard ? "text-green-700" : "text-primary-col"}`}>
                    {vocab.word}
                  </p>
                  <p className="text-muted-col text-xs truncate">{vocab.meaning}</p>
                  {hasFlashcard && (
                    <span className="text-[10px] text-green-600 font-medium">✓ Created</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t separator bg-gray-50/50 flex items-center justify-between">
          <div className="text-sm text-muted-col">
            <span className="text-primary font-bold">{vocabWithoutFlashcard.length}</span> new / 
            <span className="text-green-600 font-bold ml-2">{vocabWithFlashcard.size}</span> already created
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl glass-surface text-secondary-col text-sm font-bold">
              Cancel
            </button>
            <button
              onClick={handlePreview}
              disabled={vocabWithoutFlashcard.length === 0}
              className="px-6 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
            >
              <Eye className="w-4 h-4" /> Preview & Publish
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Flashcard Preview Modal (Quizlet-style) ──────────────────────────────────────
function FlashcardPreviewModal({
  cards,
  onClose,
  onPublish,
}: {
  cards: Flashcard[];
  onClose: () => void;
  onPublish: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIndex];

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg flex flex-col items-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-white/60 text-sm">Preview</p>
            <p className="text-white font-bold">{currentIndex + 1} / {cards.length}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-8">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="w-full max-w-md cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative min-h-[320px] rounded-2xl shadow-2xl overflow-hidden ${
            isFlipped ? "bg-gradient-to-br from-purple-50 to-indigo-50" : "bg-white"
          }`}>
            <motion.div
              className="absolute inset-0"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 p-8 flex flex-col items-center justify-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                    {currentCard.jlptLevel}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {getLessonTitle(currentCard.lessonId)}
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 mb-4">{currentCard.front}</p>
                  <p className="text-gray-400 text-sm">Click to reveal answer</p>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-400">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-xs">Click card to flip</span>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 p-8 flex flex-col items-center justify-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-600">
                    Answer
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-medium text-gray-800 whitespace-pre-line">{currentCard.back}</p>

                  {currentCard.exampleSentence && (
                    <div className="mt-6 p-4 bg-white/60 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Example:</p>
                      <p className="text-lg text-gray-700 font-medium mb-1">{currentCard.exampleSentence.sentence}</p>
                      <p className="text-sm text-gray-500">{currentCard.exampleSentence.meaning}</p>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-400">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-xs">Click to flip back</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between w-full max-w-md mt-6">
          <button
            onClick={prevCard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-surface text-white hover:bg-white/10 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {cards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsFlipped(false);
                  setTimeout(() => setCurrentIndex(idx), 150);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "w-6 bg-purple-400"
                    : "w-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextCard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white hover:opacity-90 transition"
          >
            <span className="text-sm font-medium">Next</span>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Publish Button */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl glass-surface text-white text-sm font-bold hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={onPublish}
            className="px-8 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition shadow-lg"
          >
            <Send className="w-4 h-4" /> Publish {cards.length} Flashcards
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Quizlet-Style Study Mode ─────────────────────────────────────────────────────
function StudyMode({ flashcards, lessonTitle, onDelete }: { flashcards: Flashcard[]; lessonTitle: string; onDelete: (id: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<Flashcard[]>(flashcards);

  const currentCard = displayOrder[currentIndex];

  const shuffleCards = () => {
    const shuffled = [...displayOrder].sort(() => Math.random() - 0.5);
    setDisplayOrder(shuffled);
    setIsShuffled(true);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const resetCards = () => {
    setDisplayOrder(flashcards);
    setIsShuffled(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % displayOrder.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + displayOrder.length) % displayOrder.length);
    }, 150);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const progress = ((currentIndex + 1) / displayOrder.length) * 100;

  const difficultyColors = {
    easy: { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-100" },
    medium: { bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-100" },
    hard: { bg: "bg-rose-500", text: "text-rose-600", light: "bg-rose-100" },
  };

  return (
    <div className="p-6 pt-0">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-col" />
          <span className="text-sm text-muted-col">{lessonTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={shuffleCards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass-surface hover:bg-primary/10 transition"
          >
            <Shuffle className="w-3.5 h-3.5" /> Shuffle
          </button>
          {isShuffled && (
            <button
              onClick={resetCards}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass-surface hover:bg-primary/10 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-col">Progress</span>
          <span className="text-xs font-medium text-primary-col">{currentIndex + 1} / {displayOrder.length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="relative max-w-2xl mx-auto">
        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="cursor-pointer"
          onClick={handleFlip}
        >
          <div className={`relative min-h-[320px] rounded-2xl shadow-xl overflow-hidden ${
            isFlipped ? "bg-gradient-to-br from-purple-50 to-indigo-50" : "bg-gradient-to-br from-white to-gray-50"
          }`}>
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 p-8 flex flex-col items-center justify-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                    {currentCard.jlptLevel}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${difficultyColors[currentCard.difficulty].light} ${difficultyColors[currentCard.difficulty].text}`}>
                    {currentCard.difficulty}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(currentCard.id);
                    }}
                    className="ml-2 p-1 rounded-lg hover:bg-red-100 text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 mb-4">{currentCard.front}</p>
                  <p className="text-gray-400 text-sm">Click to reveal answer</p>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-400">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-xs">Click card to flip</span>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 p-8 flex flex-col items-center justify-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-600">
                    Answer
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-medium text-gray-800 whitespace-pre-line">{currentCard.back}</p>

                  {currentCard.exampleSentence && (
                    <div className="mt-6 p-4 bg-white/60 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Example:</p>
                      <p className="text-lg text-gray-700 font-medium mb-1">{currentCard.exampleSentence.sentence}</p>
                      <p className="text-sm text-gray-500">{currentCard.exampleSentence.meaning}</p>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-400">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-xs">Click to flip back</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={prevCard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-surface hover:bg-primary/10 transition disabled:opacity-30"
            disabled={displayOrder.length <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {displayOrder.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsFlipped(false);
                  setTimeout(() => setCurrentIndex(idx), 150);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "w-6 bg-primary"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextCard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white hover:opacity-90 transition disabled:opacity-30"
            disabled={displayOrder.length <= 1}
          >
            <span className="text-sm font-medium">Next</span>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
