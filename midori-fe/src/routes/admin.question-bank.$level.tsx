import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronRight, Plus, X, Eye, Loader2, ArrowLeft, Trash2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type QuestionType = "Vocabulary" | "Grammar" | "Reading" | "Listening";
type Difficulty = "Easy" | "Medium" | "Hard";

interface Question {
  id: string;
  level: JLPTLevel;
  lesson: number;
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  createdAt?: string;
}

interface Lesson {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
// ⚠️ DEVELOPMENT ONLY - Set to false to disable mock data
const USE_MOCK_DATA = false;

const mockLessons: Record<JLPTLevel, Lesson[]> = {
  N5: [
    { id: 1, name: "Introduction to Japanese" },
    { id: 2, name: "Basic Greetings" },
    { id: 3, name: "Numbers and Counting" },
    { id: 4, name: "Colors and Shapes" },
    { id: 5, name: "Days and Months" },
  ],
  N4: [
    { id: 1, name: "Daily Conversations" },
    { id: 2, name: "Travel Japanese" },
    { id: 3, name: "Shopping and Dining" },
  ],
  N3: [
    { id: 1, name: "Intermediate Grammar" },
    { id: 2, name: "Reading Comprehension" },
  ],
  N2: [
    { id: 1, name: "Advanced Grammar Patterns" },
    { id: 2, name: "Business Japanese" },
  ],
  N1: [
    { id: 1, name: "Advanced Expressions" },
    { id: 2, name: "Academic Japanese" },
  ],
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const getLessonsKey = (level: JLPTLevel) => `qb_lessons_${level}`;
const getQuestionsKey = (level: JLPTLevel, lessonId: number) => `questions_${level}_${lessonId}`;

// ─── Routes ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/question-bank/$level")({
  component: QuestionBankLessonListPage,
});

function QuestionBankLessonListPage() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const level = (params.level?.toUpperCase() || "N5") as JLPTLevel;

  // FIXED: Always load fresh lessons when level changes
  // Using separate useEffect to ensure proper re-render on level change
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load lessons whenever level changes
  useEffect(() => {
    setIsLoading(true);
    const key = getLessonsKey(level);
    console.log(`[QB] ════════════════════════════════════════`);
    console.log(`[QB] USEFFECT: Loading lessons for level ${level}`);
    console.log(`[QB] USEFFECT: Storage Key: ${key}`);
    
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log(`[QB] USEFFECT: Found localStorage data with ${parsed.length} lessons`);
      console.log(`[QB] USEFFECT: Lesson IDs:`, parsed.map((l: Lesson) => l.id));
      console.log(`[QB] USEFFECT: Lesson names:`, parsed.map((l: Lesson) => l.name));
      setLessons(parsed);
    } else {
      // Only use mock data if explicitly enabled
      if (USE_MOCK_DATA) {
        const mock = mockLessons[level] || [];
        console.log(`[QB] USEFFECT: No localStorage data, using ${mock.length} mock lessons`);
        console.log(`[QB] USEFFECT: Mock lesson IDs:`, mock.map(l => l.id));
        setLessons(mock);
      } else {
        console.log(`[QB] USEFFECT: No localStorage data, starting with empty lessons`);
        setLessons([]);
      }
    }
    setIsLoading(false);
  }, [level]);

  // Persist lessons to localStorage when they change
  // Using functional update pattern to avoid stale closure issues
  const persistRef = useRef<{
    lessons: Lesson[];
    level: JLPTLevel;
  } | null>(null);

  useEffect(() => {
    persistRef.current = { lessons, level };
    console.log(`[QB] REF: Updated ref with ${lessons.length} lessons`);
  });

  useEffect(() => {
    console.log(`[QB] PERSIST: Effect triggered. Ref has ${persistRef.current?.lessons.length || 0} lessons`);
    const timeoutId = setTimeout(() => {
      if (persistRef.current && typeof window !== "undefined") {
        const { lessons: currentLessons, level: currentLevel } = persistRef.current;
        const key = getLessonsKey(currentLevel);
        console.log(`[QB] PERSIST: Writing ${currentLessons.length} lessons to [${key}]`);
        console.log(`[QB] PERSIST: Lesson IDs:`, currentLessons.map(l => l.id));
        localStorage.setItem(key, JSON.stringify(currentLessons));
        console.log(`[QB] PERSIST: localStorage write complete`);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [lessons, level]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLessonNumber, setNewLessonNumber] = useState("");
  const [newLessonName, setNewLessonName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [pendingNavLesson, setPendingNavLesson] = useState<number | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ─── Orphan Question Cleanup ─────────────────────────────────────────────────
  const cleanupOrphanQuestions = (questions: Question[], validLessonIds: number[]): { 
    cleaned: Question[]; 
    orphans: Question[];
    removedCount: number;
  } => {
    const validSet = new Set(validLessonIds);
    const orphans = questions.filter(q => !validSet.has(q.lesson));
    const cleaned = questions.filter(q => validSet.has(q.lesson));
    
    console.log(`[QB] CLEANUP: Valid lesson IDs: [${validLessonIds.join(', ')}]`);
    console.log(`[QB] CLEANUP: Found ${orphans.length} orphan questions`);
    console.log(`[QB] CLEANUP: Orphan question details:`, orphans.map(q => ({
      id: q.id,
      lessonId: q.lesson,
      text: q.questionText?.substring(0, 30) + '...'
    })));
    
    return { cleaned, orphans, removedCount: orphans.length };
  };

  // ─── Delete Questions for a Lesson ─────────────────────────────────────────
  const deleteQuestionsForLesson = (lessonId: number) => {
    const key = getQuestionsKey(level, lessonId);
    const saved = localStorage.getItem(key);
    if (saved) {
      const questions = JSON.parse(saved);
      console.log(`[QB] DELETE: Removing ${questions.length} questions from [${key}]`);
      localStorage.removeItem(key);
      return questions.length;
    }
    return 0;
  };

  // ─── Load questions with cleanup ────────────────────────────────────────────
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [cleanupStats, setCleanupStats] = useState<{ orphans: number; removed: number } | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined" && lessons.length > 0) {
      const questions: Question[] = [];
      
      // Load all questions from localStorage
      for (let i = 1; i <= 50; i++) {
        const saved = localStorage.getItem(getQuestionsKey(level, i));
        if (saved) {
          questions.push(...JSON.parse(saved));
        }
      }
      
      // Get valid lesson IDs
      const validLessonIds = lessons.map(l => l.id);
      
      // Cleanup orphan questions
      const { cleaned, orphans, removedCount } = cleanupOrphanQuestions(questions, validLessonIds);
      
      // Update cleanup stats for display
      setCleanupStats({ orphans: orphans.length, removed: removedCount });
      
      console.log(`[QB] LOADING: Found ${questions.length} total questions`);
      console.log(`[QB] LOADING: Questions by lesson (before cleanup):`, 
        questions.reduce((acc, q) => {
          acc[q.lesson] = (acc[q.lesson] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      );
      console.log(`[QB] LOADING: Questions by lesson (after cleanup):`, 
        cleaned.reduce((acc, q) => {
          acc[q.lesson] = (acc[q.lesson] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      );
      
      setAllQuestions(cleaned);
    } else if (lessons.length === 0) {
      setAllQuestions([]);
      setCleanupStats(null);
    }
  }, [level, lessons]);

  // Calculate lesson stats - ONLY count questions for ACTUAL lessons
  const getLessonStats = (lessonId: number) => {
    // Only count if this lesson actually exists
    const lessonExists = lessons.some(l => l.id === lessonId);
    if (!lessonExists) {
      return { total: 0, Vocabulary: 0, Grammar: 0, Reading: 0, Listening: 0 };
    }
    
    const lessonQs = allQuestions.filter(q => q.lesson === lessonId);
    return {
      total: lessonQs.length,
      Vocabulary: lessonQs.filter(q => q.type === "Vocabulary").length,
      Grammar: lessonQs.filter(q => q.type === "Grammar").length,
      Reading: lessonQs.filter(q => q.type === "Reading").length,
      Listening: lessonQs.filter(q => q.type === "Listening").length,
    };
  };
  
  // Calculate accurate Total Questions - only for actual lessons
  const totalQuestionsForLevel = allQuestions.filter(q => 
    lessons.some(l => l.id === q.lesson)
  );

  // Debug: Log when lessons are rendered
  console.log(`[QB] RENDER: lessons state has ${lessons.length} lessons`);
  console.log(`[QB] RENDER: Lesson IDs and names:`, lessons.map((l: Lesson) => `${l.id}: "${l.name}"`));
  console.log(`[QB] RENDER: Source: ${localStorage.getItem(getLessonsKey(level)) ? 'localStorage' : 'empty/default'}`);

  const handleCreateLesson = async () => {
    if (!newLessonNumber.trim() || !newLessonName.trim()) {
      alert("Please fill in both Lesson Number and Lesson Name");
      return;
    }

    const lessonNum = parseInt(newLessonNumber);
    if (isNaN(lessonNum) || lessonNum < 1) {
      alert("Please enter a valid lesson number");
      return;
    }

    console.log(`[QB] CREATE: Checking if lesson ${lessonNum} exists...`);
    console.log(`[QB] CREATE: Current lessons:`, lessons.map(l => l.id));
    
    if (lessons.some(l => l.id === lessonNum)) {
      console.log(`[QB] CREATE: Lesson ${lessonNum} already exists!`);
      alert("A lesson with this number already exists");
      return;
    }

    console.log(`[QB] CREATE: Lesson ${lessonNum} is new, proceeding...`);
    setIsCreating(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    const newLesson: Lesson = { 
      id: lessonNum, 
      name: newLessonName.trim(),
      createdAt: new Date().toISOString()
    };
    
    console.log(`[QB] CREATE: New lesson object:`, newLesson);
    console.log(`[QB] CREATE: Current state has ${lessons.length} lessons`);
    
    const updatedLessons = [...lessons, newLesson].sort((a, b) => a.id - b.id);
    
    console.log(`[QB] CREATE: Updated array has ${updatedLessons.length} lessons`);
    console.log(`[QB] CREATE: Updated lesson IDs:`, updatedLessons.map(l => l.id));
    console.log(`[QB] CREATE: Calling setLessons...`);
    
    setLessons(updatedLessons);
    
    console.log(`[QB] CREATE: setLessons called. Modal closing...`);
    console.log(`[QB] CREATE: Setting pendingNavLesson = ${lessonNum}`);
    
    setNewLessonNumber("");
    setShowCreateModal(false);
    setIsCreating(false);
    setPendingNavLesson(lessonNum);
  };

  // Navigate after state update commits
  useEffect(() => {
    if (lessons.length > 0 && pendingNavLesson) {
      const targetLesson = lessons.find(l => l.id === pendingNavLesson);
      if (targetLesson) {
        console.log(`[QB] NAV: Navigating to question-builder for lesson ${pendingNavLesson}`);
        navigate({ to: `/admin/question-bank/question-builder?level=${level.toLowerCase()}&lessonId=${pendingNavLesson}` });
      }
    }
  }, [lessons, pendingNavLesson, level, navigate]);

  const pageTitle = level ? `${level} Question Bank` : "Question Bank";

  return (
    <div className="space-y-5">
      {/* Back Button - Left aligned */}
      <Link 
        to="/admin/question-bank" 
        className="inline-flex items-center gap-2 text-sm text-muted-col hover:text-primary-col transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Question Bank
      </Link>

      {/* Header - Title and Actions grouped */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-black text-primary-col">{pageTitle}</h1>
            <p className="text-sm text-secondary-col mt-0.5">Select a lesson to manage questions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Create Lesson
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.18_270)]/12 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Total Lessons</p>
            <p className="font-display font-black text-lg text-primary-col">{lessons.length}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[var(--status-active)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Total Questions</p>
            <p className="font-display font-black text-lg text-primary-col">{totalQuestionsForLevel.length}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-pending)]/12 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[var(--status-pending)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Active Lessons</p>
            <p className="font-display font-black text-lg text-primary-col">{lessons.filter(l => getLessonStats(l.id).total > 0).length}</p>
          </div>
        </div>
        {cleanupStats && cleanupStats.orphans > 0 && (
          <div className="card-base p-4 flex items-center gap-3 border-red-500/30 bg-red-500/5">
            <div className="w-10 h-10 rounded-xl bg-red-500/12 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] text-red-500 uppercase tracking-wider font-bold">Orphans Cleaned</p>
              <p className="font-display font-black text-lg text-red-500">{cleanupStats.removed}</p>
            </div>
          </div>
        )}
      </div>

      {/* Lesson List */}
      {isLoading ? (
        <div className="card-base p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="card-base p-12 flex flex-col items-center justify-center">
          <BookOpen className="w-12 h-12 text-[var(--status-pending)]/40 mb-3" />
          <h3 className="text-primary-col font-semibold text-sm">No lessons yet</h3>
          <p className="text-secondary-col text-xs mt-1">Create your first lesson to start adding questions</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
          >
            Create Lesson
          </button>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator">
            <div className="col-span-1 text-[10px] uppercase tracking-wider text-muted-col font-bold">No.</div>
            <div className="col-span-7 text-[10px] uppercase tracking-wider text-muted-col font-bold">Lesson</div>
            <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">Total</div>
            <div className="col-span-2 text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">Action</div>
          </div>
          {/* Table Rows */}
          <div>
            {lessons.map((lesson, index) => {
              const stats = getLessonStats(lesson.id);
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition items-center"
                >
                  <div className="col-span-1">
                    <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                      {lesson.id}
                    </span>
                  </div>
                  <div className="col-span-7">
                    <p className="text-sm text-primary-col font-medium">{lesson.name}</p>
                    <div className="flex gap-2 mt-1 text-xs text-muted-col">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--status-active)]/10 text-[var(--status-active)]">V: {stats.Vocabulary}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[var(--status-pending)]/10 text-[var(--status-pending)]">G: {stats.Grammar}</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500">R: {stats.Reading}</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500">L: {stats.Listening}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center gap-1">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">{stats.total}</span>
                    <span className="px-1.5 py-1 rounded bg-[var(--status-active)]/10 text-[var(--status-active)] text-xs" title="Vocabulary">{stats.Vocabulary}</span>
                    <span className="px-1.5 py-1 rounded bg-[var(--status-pending)]/10 text-[var(--status-pending)] text-xs" title="Grammar">{stats.Grammar}</span>
                    <span className="px-1.5 py-1 rounded bg-orange-500/10 text-orange-500 text-xs" title="Reading">{stats.Reading}</span>
                    <span className="px-1.5 py-1 rounded bg-purple-500/10 text-purple-500 text-xs" title="Listening">{stats.Listening}</span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => navigate({ to: `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lesson.id}` })}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
                      title="View Questions"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteLessonId(lesson.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                      title="Delete Lesson"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Lesson Modal - Match Content Library exactly */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isCreating && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b separator">
                <h2 className="font-display font-bold text-primary-col text-base">Create New Lesson</h2>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  disabled={isCreating}
                  className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-col uppercase tracking-wider">Lesson Number</label>
                  <input
                    type="number"
                    value={newLessonNumber}
                    onChange={(e) => setNewLessonNumber(e.target.value)}
                    placeholder="e.g., 6"
                    min="1"
                    className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-col uppercase tracking-wider">Lesson Name</label>
                  <input
                    type="text"
                    value={newLessonName}
                    onChange={(e) => setNewLessonName(e.target.value)}
                    placeholder="e.g., Family Members"
                    className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t separator">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLesson}
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Lesson
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && deleteLessonId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-display font-bold text-primary-col text-lg text-center">Delete Lesson</h3>
                <p className="text-secondary-col text-sm text-center">
                  Are you sure you want to delete this lesson? All questions in this lesson will also be deleted. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const count = deleteQuestionsForLesson(deleteLessonId);
                    const updatedLessons = lessons.filter(l => l.id !== deleteLessonId);
                    setLessons(updatedLessons);
                    setDeleteLessonId(null);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}