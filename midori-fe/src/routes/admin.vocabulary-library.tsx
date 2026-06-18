import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, Plus, Eye, Edit3, Trash2,
  X, Loader2, Save, ChevronRight, ChevronLeft,
  Globe, EyeOff, Check, ArrowLeft, Volume2, Upload, Download, FileText
} from "lucide-react";
import { teacherVocabularyApi } from "../lib/api/teacherVocabulary";
import type { JLPTLevel } from "../types/content-library";

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

// ─── Types ────────────────────────────────────────────────────────────────────────

interface Word {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  exampleSentence: string;
  exampleMeaning: string;
  audioUrl?: string;
}

// Text-to-Speech utility for Japanese pronunciation
const generateAudio = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.8;
    
    // Get audio as blob
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const mediaStreamDest = audioContext.createMediaStreamDestination();
    
    // Use speechSynthesis
    const synth = window.speechSynthesis;
    synth.cancel();
    synth.speak(utterance);
    
    // For now, we'll use a simple approach - just mark that audio is available
    // The actual playback will use Web Speech API directly
    resolve("tts-generated");
  });
};

// Play TTS audio
const playTTS = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

interface Lesson {
  id: string;
  title: string;
  level: JLPTLevel;
  wordCount: number;
  isPublished: boolean;
  words: Word[];
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/vocabulary-library")({
  component: VocabularyLibraryPage,
});

function VocabularyLibraryPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "all">("all");
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Load lessons
  const loadLessons = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await teacherVocabularyApi.getTeacherLessons();
      const mapped: Lesson[] = data.map((l) => ({
        id: l.id,
        title: l.title,
        level: (l.level?.replace("N", "N") || "N5") as JLPTLevel,
        wordCount: l.wordCount || 0,
        isPublished: l.isPublished || false,
        words: [],
      }));
      setLessons(mapped);
    } catch (error) {
      console.error("Failed to load lessons:", error);
      showToast("Failed to load lessons", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Toast
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Filter
  const filteredLessons = lessons.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "all" || l.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  // Stats
  const totalWords = lessons.reduce((sum, l) => sum + l.wordCount, 0);

  // ─── Lesson CRUD ──────────────────────────────────────────────────────────────

  const handleCreateLesson = async (title: string, level: JLPTLevel) => {
    try {
      await teacherVocabularyApi.createLesson({
        title,
        level,
        description: "",
        words: [],
      });
      showToast(`Lesson "${title}" created!`, "success");
      setShowLessonModal(false);
      loadLessons();
    } catch (error) {
      console.error("Failed to create lesson:", error);
      showToast("Failed to create lesson", "error");
    }
  };

  const handleUpdateLesson = async (id: string, title: string, level: JLPTLevel) => {
    try {
      await teacherVocabularyApi.updateLesson(id, {
        title,
        level,
      });
      showToast("Lesson updated!", "success");
      setEditingLesson(null);
      loadLessons();
    } catch (error) {
      console.error("Failed to update lesson:", error);
      showToast("Failed to update lesson", "error");
    }
  };

  const handleDeleteLesson = async (id: string, title: string) => {
    if (!confirm(`Delete lesson "${title}" and all its words?`)) return;
    try {
      await teacherVocabularyApi.deleteLesson(id);
      showToast("Lesson deleted!", "success");
      loadLessons();
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      showToast("Failed to delete lesson", "error");
    }
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    try {
      if (lesson.isPublished) {
        await teacherVocabularyApi.unpublishLesson(lesson.id);
        showToast("Lesson is now private", "success");
      } else {
        await teacherVocabularyApi.publishLesson(lesson.id);
        showToast("Lesson is now public!", "success");
      }
      loadLessons();
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      showToast("Failed to update visibility", "error");
    }
  };

  // ─── Load Words for Viewing ───────────────────────────────────────────────────

  const loadLessonWords = async (lesson: Lesson) => {
    try {
      setIsLoading(true);
      const detail = await teacherVocabularyApi.getTeacherLessonDetail(lesson.id);
      const words: Word[] = (detail.words || []).map((w) => ({
        id: w.id,
        word: w.word || w.japanese || "",
        reading: w.furigana || w.reading || "",
        meaning: w.meaning || w.vietnamese || "",
        exampleSentence: w.exampleJapanese || "",
        exampleMeaning: w.exampleMeaning || "",
        audioUrl: w.audioUrl || "",
      }));
      setViewingLesson({ ...lesson, words });
    } catch (error) {
      console.error("Failed to load words:", error);
      showToast("Failed to load words", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Word CRUD ────────────────────────────────────────────────────────────────

  const handleAddWord = async (lessonId: string, word: string, reading: string, meaning: string, exampleSentence: string, exampleMeaning: string, audioUrl?: string) => {
    try {
      await teacherVocabularyApi.addWord(lessonId, {
        word,
        japanese: word,
        reading,
        meaning,
        vietnamese: meaning,
        exampleJapanese: exampleSentence,
        exampleVietnamese: exampleMeaning,
        audioUrl,
      });
      showToast("Word added!", "success");
      // Reload words
      if (viewingLesson) {
        await loadLessonWords(viewingLesson);
      }
    } catch (error) {
      console.error("Failed to add word:", error);
      showToast("Failed to add word", "error");
    }
  };

  const handleUpdateWord = async (wordId: string, lessonId: string, word: string, reading: string, meaning: string, exampleSentence: string, exampleMeaning: string, audioUrl?: string) => {
    try {
      await teacherVocabularyApi.updateWord(wordId, {
        word,
        japanese: word,
        reading,
        meaning,
        vietnamese: meaning,
        exampleJapanese: exampleSentence,
        exampleVietnamese: exampleMeaning,
        audioUrl,
      });
      showToast("Word updated!", "success");
      if (viewingLesson) {
        await loadLessonWords(viewingLesson);
      }
    } catch (error) {
      console.error("Failed to update word:", error);
      showToast("Failed to update word", "error");
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm("Delete this word?")) return;
    try {
      await teacherVocabularyApi.deleteWord(wordId);
      showToast("Word deleted!", "success");
      // Reload words
      if (viewingLesson) {
        await loadLessonWords(viewingLesson);
      }
    } catch (error) {
      console.error("Failed to delete word:", error);
      showToast("Failed to delete word", "error");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (viewingLesson) {
    return (
      <LessonDetailView
        lesson={viewingLesson}
        isLoading={isLoading}
        onBack={() => setViewingLesson(null)}
        onAddWord={handleAddWord}
        onUpdateWord={handleUpdateWord}
        onDeleteWord={handleDeleteWord}
        toast={toast}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Vocabulary Lessons</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Manage vocabulary lessons and their words
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl glass-surface text-xs">
            <div className="text-center">
              <p className="text-primary font-bold text-lg">{lessons.length}</p>
              <p className="text-muted-col">Lessons</p>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div className="text-center">
              <p className="text-primary font-bold text-lg">{totalWords}</p>
              <p className="text-muted-col">Words</p>
            </div>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold shadow-md hover:bg-purple-700 transition"
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
            placeholder="Search lessons..."
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

      {/* Loading */}
      {isLoading && (
        <div className="card-base p-12 text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-secondary-col">Loading lessons...</p>
        </div>
      )}

      {/* Lessons List */}
      {!isLoading && (
        <>
          {filteredLessons.length === 0 ? (
            <div className="card-base p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-col/40 mx-auto mb-4" />
              <h3 className="font-display font-bold text-primary-col text-lg mb-2">
                No Lessons Found
              </h3>
              <p className="text-secondary-col text-sm mb-6">
                {searchQuery ? "Try adjusting your search" : "Create your first vocabulary lesson"}
              </p>
              <button
                onClick={() => setShowLessonModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold"
              >
                <Plus className="w-4 h-4 inline mr-1" /> New Lesson
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredLessons.map((lesson) => (
                <div key={lesson.id} className="card-base p-5 hover:border-primary/20 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                          {lesson.level}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lesson.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {lesson.isPublished ? "Public" : "Private"}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-primary-col text-lg">
                        {lesson.title}
                      </h3>
                      <p className="text-muted-col text-sm">
                        {lesson.wordCount} word{lesson.wordCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(lesson)}
                        className={`p-2 rounded-lg transition ${
                          lesson.isPublished
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        title={lesson.isPublished ? "Make Private" : "Make Public"}
                      >
                        {lesson.isPublished ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditingLesson(lesson)}
                        className="p-2 rounded-lg glass-surface text-secondary-col hover:text-primary transition"
                        title="Edit Lesson"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                        className="p-2 rounded-lg glass-surface text-secondary-col hover:text-red-500 transition"
                        title="Delete Lesson"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => loadLessonWords(lesson)}
                        className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition flex items-center gap-2"
                      >
                        View Words <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* New Lesson Modal */}
      <AnimatePresence>
        {showLessonModal && (
          <LessonModal
            onClose={() => setShowLessonModal(false)}
            onSave={handleCreateLesson}
          />
        )}
      </AnimatePresence>

      {/* Edit Lesson Modal */}
      <AnimatePresence>
        {editingLesson && (
          <LessonModal
            lesson={editingLesson}
            onClose={() => setEditingLesson(null)}
            onSave={(title, level) => handleUpdateLesson(editingLesson.id, title, level)}
          />
        )}
      </AnimatePresence>

      {/* Import Words Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportWordsModal
            lessons={lessons}
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              loadLessons();
              if (viewingLesson) {
                loadLessonWords(viewingLesson);
              }
            }}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg z-50 flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Lesson Detail View ─────────────────────────────────────────────────────────

function LessonDetailView({
  lesson,
  isLoading,
  onBack,
  onAddWord,
  onUpdateWord,
  onDeleteWord,
  toast,
}: {
  lesson: Lesson;
  isLoading: boolean;
  onBack: () => void;
  onAddWord: (lessonId: string, word: string, reading: string, meaning: string, exampleSentence: string, exampleMeaning: string) => void;
  onUpdateWord: (wordId: string, lessonId: string, word: string, reading: string, meaning: string, exampleSentence: string, exampleMeaning: string) => void;
  onDeleteWord: (wordId: string) => void;
  toast: { message: string; type: "success" | "error" } | null;
}) {
  const [words, setWords] = useState<Word[]>(lesson.words);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState({ 
    word: "", 
    reading: "", 
    meaning: "", 
    exampleSentence: "", 
    exampleMeaning: "",
    audioUrl: "auto"
  });
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Check if form is valid for preview
  const isFormValid = newWord.word.trim() && newWord.meaning.trim();

  // Update words when lesson changes
  useEffect(() => {
    setWords(lesson.words);
  }, [lesson.words]);

  const handleAdd = () => {
    if (!newWord.word || !newWord.meaning) return;
    onAddWord(lesson.id, newWord.word, newWord.reading, newWord.meaning, newWord.exampleSentence, newWord.exampleMeaning);
    setNewWord({ word: "", reading: "", meaning: "", exampleSentence: "", exampleMeaning: "", audioUrl: "auto" });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                {lesson.level}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                lesson.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {lesson.isPublished ? "Public" : "Private"}
              </span>
            </div>
            <h1 className="text-2xl font-display font-black text-primary-col">{lesson.title}</h1>
            <p className="text-sm text-secondary-col">{words.length} words</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Word
        </button>
      </div>

      {/* Add Word Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card-base p-5 border-primary/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-primary-col">Add New Word</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded-lg text-muted-col hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-col uppercase mb-1">Word (Kanji) *</label>
                  <input
                    type="text"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    placeholder="日本"
                    className="w-full px-4 py-2.5 rounded-xl input-glass text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-col uppercase mb-1">Reading (Hiragana)</label>
                  <input
                    type="text"
                    value={newWord.reading}
                    onChange={(e) => setNewWord({ ...newWord, reading: e.target.value })}
                    placeholder="にほん"
                    className="w-full px-4 py-2.5 rounded-xl input-glass text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-col uppercase mb-1">Meaning *</label>
                  <input
                    type="text"
                    value={newWord.meaning}
                    onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                    placeholder="Nhật Bản"
                    className="w-full px-4 py-2.5 rounded-xl input-glass text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-col uppercase mb-1">Example Sentence</label>
                  <input
                    type="text"
                    value={newWord.exampleSentence}
                    onChange={(e) => setNewWord({ ...newWord, exampleSentence: e.target.value })}
                    placeholder="私は日本に行きたいです。"
                    className="w-full px-4 py-2.5 rounded-xl input-glass text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-col uppercase mb-1">Translation</label>
                  <input
                    type="text"
                    value={newWord.exampleMeaning}
                    onChange={(e) => setNewWord({ ...newWord, exampleMeaning: e.target.value })}
                    placeholder="Tôi muốn đi Nhật Bản"
                    className="w-full px-4 py-2.5 rounded-xl input-glass text-sm"
                  />
                </div>

                {/* Audio Preview */}
                {newWord.word && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-muted-col uppercase mb-1">Preview Audio (TTS)</label>
                    <button
                      type="button"
                      onClick={() => playTTS(newWord.reading || newWord.word)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition"
                    >
                      <Volume2 className="w-4 h-4" /> 
                      Nghe phát âm: {newWord.reading || newWord.word}
                    </button>
                  </div>
                )}

                {/* Preview Card */}
                {isFormValid && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-bold text-primary">Preview:</p>
                      <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                    </div>
                    <div className="card-base p-4 border-primary/20 bg-primary/5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold">{words.length + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-primary-col text-lg">{newWord.word}</span>
                            {newWord.reading && (
                              <span className="text-secondary-col text-sm">({newWord.reading})</span>
                            )}
                            {newWord.word && (
                              <button
                                onClick={() => playTTS(newWord.reading || newWord.word)}
                                className="p-1 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                                title="Nghe phát âm"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-secondary-col text-sm">{newWord.meaning}</p>
                          {newWord.exampleSentence && (
                            <p className="text-muted-col text-xs mt-1">
                              例: {newWord.exampleSentence}
                              {newWord.exampleMeaning && (
                                <span className="ml-2">→ {newWord.exampleMeaning}</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl glass-surface text-secondary-col text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newWord.word || !newWord.meaning}
                  className="px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Add Word
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="card-base p-12 text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-secondary-col">Loading words...</p>
        </div>
      )}

      {/* Words List */}
      {!isLoading && (
        <>
          {words.length === 0 ? (
            <div className="card-base p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-col/40 mx-auto mb-4" />
              <h3 className="font-display font-bold text-primary-col text-lg mb-2">
                No Words Yet
              </h3>
              <p className="text-secondary-col text-sm mb-6">
                Add your first word to this lesson
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Add First Word
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {words.map((word, index) => (
                <WordCard
                  key={word.id}
                  word={word}
                  index={index}
                  isEditing={editingWordId === word.id}
                  onEdit={() => setEditingWordId(word.id)}
                  onCancel={() => setEditingWordId(null)}
                  onSave={(w, r, m, es, em, au) => onUpdateWord(word.id, lesson.id, w, r, m, es, em, au)}
                  onDelete={() => onDeleteWord(word.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg z-50 flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Word Card ─────────────────────────────────────────────────────────────────

function WordCard({
  word,
  index,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  word: Word;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (word: string, reading: string, meaning: string, exampleSentence: string, exampleMeaning: string, audioUrl?: string) => void;
  onDelete: () => void;
}) {
  const [editData, setEditData] = useState(word);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setEditData(word);
  }, [word]);

  const handleSave = () => {
    onSave(editData.word, editData.reading, editData.meaning, editData.exampleSentence, editData.exampleMeaning, editData.audioUrl);
  };

  const playAudio = (word: Word) => {
    // Use stored audio URL if available, otherwise use TTS
    if (word.audioUrl && word.audioUrl !== "tts-generated" && word.audioUrl !== "auto") {
      setIsPlaying(true);
      const audio = new Audio(word.audioUrl);
      audio.play();
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
    } else {
      // Use Text-to-Speech
      playTTS(word.reading || word.word);
    }
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-base p-4 border-primary/30"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-primary">Editing Word #{index + 1}</span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg glass-surface text-secondary-col text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editData.word || !editData.meaning}
              className="px-3 py-1.5 rounded-lg bg-gradient-hero text-white text-xs font-bold disabled:opacity-50"
            >
              <Check className="w-3 h-3 inline mr-1" /> Save
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase mb-1">Word</label>
            <input
              type="text"
              value={editData.word}
              onChange={(e) => setEditData({ ...editData, word: e.target.value })}
              className="w-full px-3 py-2 rounded-lg input-glass text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase mb-1">Reading</label>
            <input
              type="text"
              value={editData.reading}
              onChange={(e) => setEditData({ ...editData, reading: e.target.value })}
              className="w-full px-3 py-2 rounded-lg input-glass text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-muted-col uppercase mb-1">Meaning</label>
            <input
              type="text"
              value={editData.meaning}
              onChange={(e) => setEditData({ ...editData, meaning: e.target.value })}
              className="w-full px-3 py-2 rounded-lg input-glass text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase mb-1">Example</label>
            <input
              type="text"
              value={editData.exampleSentence}
              onChange={(e) => setEditData({ ...editData, exampleSentence: e.target.value })}
              className="w-full px-3 py-2 rounded-lg input-glass text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase mb-1">Translation</label>
            <input
              type="text"
              value={editData.exampleMeaning}
              onChange={(e) => setEditData({ ...editData, exampleMeaning: e.target.value })}
              className="w-full px-3 py-2 rounded-lg input-glass text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-muted-col uppercase mb-1">Audio URL</label>
            <input
              type="text"
              value={editData.audioUrl || ""}
              onChange={(e) => setEditData({ ...editData, audioUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg input-glass text-sm"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="card-base p-4 hover:border-primary/20 transition group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-primary-col text-lg">{word.word}</span>
            {word.reading && (
              <span className="text-secondary-col text-sm">({word.reading})</span>
            )}
            {word.audioUrl && (
              <button
                onClick={() => playAudio(word)}
                className={`p-1 rounded-lg transition ${isPlaying ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}`}
                title="Phát âm"
              >
                <Volume2 className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} />
              </button>
            )}
          </div>
          <p className="text-secondary-col text-sm">{word.meaning}</p>
          {word.exampleSentence && (
            <p className="text-muted-col text-xs mt-1">
              例: {word.exampleSentence}
              {word.exampleMeaning && <span className="ml-2">→ {word.exampleMeaning}</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg glass-surface text-secondary-col hover:text-primary transition"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg glass-surface text-secondary-col hover:text-red-500 transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lesson Modal ───────────────────────────────────────────────────────────────

function LessonModal({
  lesson,
  onClose,
  onSave,
}: {
  lesson?: Lesson;
  onClose: () => void;
  onSave: (title: string, level: JLPTLevel) => void;
}) {
  const [title, setTitle] = useState(lesson?.title || "");
  const [level, setLevel] = useState<JLPTLevel>(lesson?.level || "N5");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim(), level);
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
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              {lesson ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <h2 className="font-display font-bold text-primary-col text-lg">
              {lesson ? "Edit Lesson" : "Create New Lesson"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Lesson Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Basic Greetings"
              className="w-full px-4 py-3 rounded-xl input-glass text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              JLPT Level
            </label>
            <div className="flex gap-2">
              {JLPT_LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                    level === l
                      ? "bg-gradient-hero text-white"
                      : "glass-surface text-secondary-col"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> {lesson ? "Update" : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Import Words Modal ───────────────────────────────────────────────────────────

interface ParsedWord {
  word: string;
  reading: string;
  meaning: string;
  exampleSentence: string;
  exampleMeaning: string;
  audioUrl?: string;
}

function ImportWordsModal({
  lessons,
  onClose,
  onSuccess,
  showToast,
}: {
  lessons: Lesson[];
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type: "success" | "error") => void;
}) {
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id || "");
  const [file, setFile] = useState<File | null>(null);
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const words = parseVocabFile(content);
        if (words.length === 0) {
          setError("No valid vocabulary found. Check file format.");
        } else {
          setParsedWords(words);
        }
      } catch {
        setError("Failed to read file. Please try again.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const parseVocabFile = (content: string): ParsedWord[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    const words: ParsedWord[] = [];

    for (const line of lines) {
      // Support 2 formats:
      // 1. word|reading|meaning|example|exampleMeaning
      // 2. word|meaning (simple)
      const parts = line.split("|").map((p) => p.trim());
      
      if (parts.length >= 2 && parts[0]) {
        words.push({
          word: parts[0] || "",
          reading: parts[1] || "",
          meaning: parts[2] || parts[1] || "",
          exampleSentence: parts[3] || "",
          exampleMeaning: parts[4] || "",
          audioUrl: parts[5] || "",
        });
      }
    }

    return words;
  };

  const handleImport = async () => {
    if (!selectedLessonId || parsedWords.length === 0) return;

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const word of parsedWords) {
      try {
        await teacherVocabularyApi.addWord(selectedLessonId, {
          word: word.word,
          japanese: word.word,
          reading: word.reading,
          meaning: word.meaning,
          vietnamese: word.meaning,
          exampleJapanese: word.exampleSentence,
          exampleVietnamese: word.exampleMeaning,
          audioUrl: word.audioUrl,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setIsImporting(false);

    if (errorCount === 0) {
      showToast(`Imported ${successCount} words successfully!`, "success");
      onSuccess();
      onClose();
    } else {
      showToast(`Imported ${successCount}, failed ${errorCount}`, "error");
    }
  };

  const downloadTemplate = () => {
    const template = `# Vocabulary Import Template
# Format: word|reading|meaning|example|exampleMeaning|audioUrl
# Lines starting with # are comments

# Example:
日本|にほん|Nhật Bản|私は日本に行きたいです。|Tôi muốn đi Nhật Bản.|https://example.com/audio.mp3
アメリカ|あめりか|Hoa Kỳ / Mỹ|私はアメリカに行きました。|Tôi đã đi Mỹ.|
`;

    const blob = new Blob([template], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vocabulary_template.txt";
    a.click();
    URL.revokeObjectURL(url);
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
        className="relative z-10 w-full max-w-2xl glass-modal rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-primary-col text-lg">Import Vocabulary</h2>
              <p className="text-muted-col text-xs">Upload file to add multiple words at once</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-auto flex-1">
          {/* Select Lesson */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Import to Lesson
            </label>
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl input-glass text-sm"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title} ({l.level})</option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider">
                Upload File
              </label>
              <button
                onClick={downloadTemplate}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Download Template
              </button>
            </div>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                file ? "border-green-500/50 bg-green-50" : "border-[var(--border)] hover:border-primary/50"
              }`}
            >
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-primary-col font-semibold">{file.name}</p>
                      <p className="text-muted-col text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-col mx-auto mb-3" />
                    <p className="text-secondary-col font-medium">Click to upload file</p>
                    <p className="text-muted-col text-xs mt-1">.txt or .csv file</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Format Help */}
          <div className="p-4 rounded-xl bg-[var(--accent)] border border-[var(--border)]">
            <p className="text-xs font-bold text-primary-col mb-2">File Format (one word per line):</p>
            <code className="text-secondary-col text-xs block">
              日本|にほん|Nhật Bản|私は日本に行きたい。|Tôi muốn đi Nhật。|https://...
            </code>
            <p className="text-muted-col text-xs mt-2">
              Format: <span className="font-mono">word|reading|meaning|example|translation|audio</span>
            </p>
            <p className="text-muted-col text-xs">
              Minimum: <span className="font-mono">word|meaning</span>
            </p>
          </div>

          {/* Preview */}
          {parsedWords.length > 0 && (
            <div>
              <p className="text-xs font-bold text-primary-col mb-2">
                Preview ({parsedWords.length} words found)
              </p>
              <div className="max-h-48 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                <table className="w-full text-xs">
                  <thead className="bg-[var(--accent)] sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-muted-col">Word</th>
                      <th className="px-3 py-2 text-left font-bold text-muted-col">Reading</th>
                      <th className="px-3 py-2 text-left font-bold text-muted-col">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {parsedWords.slice(0, 20).map((word, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-primary-col font-medium">{word.word}</td>
                        <td className="px-3 py-2 text-secondary-col">{word.reading}</td>
                        <td className="px-3 py-2 text-muted-col">{word.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedWords.length > 20 && (
                  <p className="px-3 py-2 text-muted-col text-xs text-center border-t border-[var(--border)]">
                    + {parsedWords.length - 20} more words...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t separator flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || parsedWords.length === 0 || !selectedLessonId}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold shadow-md hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
            ) : (
              <><Download className="w-4 h-4" /> Import {parsedWords.length} Words</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
