import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, X, Eye, Loader2, ArrowLeft, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { questionBankService, useQuestionBank } from "../services/questionBankService";
import type { Lesson, Question } from "../services/questionBankService";
import type { JLPTLevel } from "../services/questionBank.types";

// ─── Status Badge Component ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: "Active" | "Draft" }) {
  const configs = {
    Active: {
      label: "Active",
      color: "text-[var(--status-active)]",
      bg: "bg-[var(--status-active)]",
    },
    Draft: {
      label: "Draft",
      color: "text-[var(--status-pending)]",
      bg: "bg-[var(--status-pending)]",
    },
  };
  const cfg = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/question-bank/$level")({
  component: QuestionBankLessonListPage,
});

function QuestionBankLessonListPage() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const level = (params.level?.toUpperCase() || "N5") as JLPTLevel;

  const { lessons, questions, isLoading, createLesson, updateLesson, deleteLesson } =
    useQuestionBank(level);

  // Calculate question count per lesson
  const getLessonStats = (lessonId: number) => {
    return questions.filter((q) => q.lesson === lessonId).length;
  };

  const totalQuestionsForLevel = questions;

  // ─── Create/Edit Lesson ──────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLessonNumber, setNewLessonNumber] = useState("");
  const [newLessonName, setNewLessonName] = useState("");
  const [newLessonStatus, setNewLessonStatus] = useState<"Active" | "Draft" | "">("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const handleStartEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setNewLessonNumber(lesson.lessonNumber.toString());
    setNewLessonName(lesson.lessonName);
    setNewLessonStatus(lesson.status);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingLesson(null);
    setNewLessonNumber("");
    setNewLessonName("");
    setNewLessonStatus("");
  };

  const handleSaveLesson = async () => {
    if (!newLessonNumber.trim() || !newLessonName.trim()) {
      toast.error("Please fill in both Lesson Number and Lesson Name");
      return;
    }

    const lessonNum = parseInt(newLessonNumber);
    if (isNaN(lessonNum) || lessonNum < 1) {
      toast.error("Please enter a valid lesson number");
      return;
    }

    setIsCreating(true);

    try {
      if (editingLesson) {
        console.log(
          `[QB] EDIT: Updating lesson ${editingLesson.id} to ${lessonNum} - ${newLessonName} (${newLessonStatus})`,
        );
        await updateLesson(
          editingLesson.id,
          newLessonName.trim(),
          lessonNum,
          newLessonStatus || "Draft",
        );
        toast.success("Lesson updated successfully.");
      } else {
        console.log(`[QB] CREATE: Creating lesson ${lessonNum} - ${newLessonName}`);
        await createLesson(newLessonName.trim(), lessonNum);
        toast.success("Lesson created successfully.");
      }
      handleCloseModal();
    } catch (err: any) {
      console.error("[QB] SAVE: Failed to save lesson", err);
      toast.error(err?.message || "Failed to update lesson.");
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Delete Lesson ───────────────────────────────────────────────────────────
  const [deleteLessonId, setDeleteLessonId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteLesson = async () => {
    if (deleteLessonId === null) return;

    console.log(`[QB] DELETE: Deleting lesson ${deleteLessonId}`);
    try {
      await deleteLesson(deleteLessonId);
      toast.success("Lesson deleted successfully.");
    } catch (err: any) {
      console.error("[QB] DELETE: Failed to delete lesson", err);
      toast.error(err?.message || "Failed to delete lesson");
    }

    setDeleteLessonId(null);
    setShowDeleteConfirm(false);
  };

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
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Total Lessons
            </p>
            <p className="font-display font-black text-lg text-primary-col">{lessons.length}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[var(--status-active)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Total Questions
            </p>
            <p className="font-display font-black text-lg text-primary-col">
              {totalQuestionsForLevel.length}
            </p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-pending)]/12 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[var(--status-pending)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Active Lessons
            </p>
            <p className="font-display font-black text-lg text-primary-col">
              {lessons.filter((l) => getLessonStats(l.id) > 0).length}
            </p>
          </div>
        </div>
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
          <p className="text-secondary-col text-xs mt-1">
            Create your first lesson to start adding questions
          </p>
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
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b separator">
            <div className="col-span-5 text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Lesson
            </div>
            <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Questions
            </div>
            <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Status
            </div>
            <div className="col-span-3 text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Actions
            </div>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-[var(--border)]">
            {lessons.map((lesson, index) => {
              const stats = getLessonStats(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-[var(--accent)]/50 transition items-center"
                >
                  <div className="col-span-5">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[oklch(0.62_0.18_270)]/10 flex items-center justify-center text-sm font-bold text-[oklch(0.62_0.18_270)]">
                        {lesson.lessonNumber}
                      </span>
                      <p className="text-sm text-primary-col font-medium">{lesson.lessonName}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-medium text-muted-col">{stats}</span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <StatusBadge status={lesson.status} />
                  </div>
                  <div className="col-span-3 flex justify-end gap-2">
                    <button
                      onClick={() =>
                        navigate({
                          to: `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lesson.id}`,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleStartEdit(lesson)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition text-xs font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeleteLessonId(lesson.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-xs font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
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
            onClick={() => !isCreating && handleCloseModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b separator">
                <h2 className="font-display font-bold text-primary-col text-base">
                  {editingLesson ? "Edit Lesson" : "Create New Lesson"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  disabled={isCreating}
                  className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                    Lesson Number
                  </label>
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
                  <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                    Lesson Name
                  </label>
                  <input
                    type="text"
                    value={newLessonName}
                    onChange={(e) => setNewLessonName(e.target.value)}
                    placeholder="e.g., Family Members"
                    className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                    disabled={isCreating}
                  />
                </div>
                {editingLesson && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={newLessonStatus}
                      onChange={(e) => setNewLessonStatus(e.target.value as "Active" | "Draft")}
                      className="w-full px-4 py-3 rounded-xl input-glass text-sm bg-card border border-[var(--border)] text-primary-col"
                      disabled={isCreating}
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t separator">
                <button
                  onClick={handleCloseModal}
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLesson}
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingLesson ? (
                        <>
                          <Pencil className="w-4 h-4" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create Lesson
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          setShowDeleteConfirm(open);
          if (!open) setDeleteLessonId(null);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-center">Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to delete this lesson? All questions in this lesson will also be
              deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
