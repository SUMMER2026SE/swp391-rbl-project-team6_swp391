"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpenText, Loader2, Pencil, Plus, Search, Trash2, Edit3, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  adminGrammarApi,
  type GrammarDetailResponse,
  type GrammarLessonResponse,
  type GrammarLessonWithContentsRequest,
  type GrammarContentRequest,
} from "@/lib/api/grammarContent";
import { lessonsApi } from "@/lib/api/lessons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  GrammarDetailModal,
  GrammarBackendEditForm,
} from "../grammar";
import { AdminAiGenerateModal } from "./AdminAiGenerateModal";
import { AdminGrammarAiDraft } from "@/services/adminAiContentService";

interface AdminGrammarContentPageProps {
  level: string;
}

export function AdminGrammarContentPage({ level }: AdminGrammarContentPageProps) {
  const normalizedLevel = level.toUpperCase();
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit" | "view" | undefined>("create");
  const [selectedLesson, setSelectedLesson] = useState<GrammarLessonResponse | null>(null);
  const [selectedLessonDetail, setSelectedLessonDetail] = useState<GrammarDetailResponse | null>(null);

  // Fetch lessons
  const lessonsQuery = useQuery({
    queryKey: ["admin-grammar", normalizedLevel],
    queryFn: () => adminGrammarApi.getAdminGrammarLessons({ level: normalizedLevel }),
  });

  // Fetch next lesson number
  const allLessonsQuery = useQuery({
    queryKey: ["lessons", normalizedLevel],
    queryFn: () => lessonsApi.getLessonsByLevel(normalizedLevel),
  });

  const refreshGrammarQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-grammar"] }),
      queryClient.invalidateQueries({ queryKey: ["student-grammar"] }),
      queryClient.invalidateQueries({ queryKey: ["lessons"] }),
    ]);
    await router.invalidate();
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: GrammarLessonWithContentsRequest) =>
      adminGrammarApi.createGrammarLesson(input),
    onSuccess: async () => {
      await refreshGrammarQueries();
      toast.success("Grammar lesson created successfully");
      closeEditModal();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create grammar lesson"),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: GrammarLessonWithContentsRequest;
    }) => adminGrammarApi.updateGrammarLesson(id, input),
    onSuccess: async () => {
      await refreshGrammarQueries();
      toast.success("Grammar lesson updated successfully");
      closeEditModal();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update grammar lesson"),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (grammarId: string) => adminGrammarApi.deleteGrammarLesson(grammarId),
    onSuccess: async () => {
      await refreshGrammarQueries();
      toast.success("Grammar lesson deleted successfully");
      setShowDeleteConfirm(false);
      setSelectedLesson(null);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete grammar lesson"),
  });

  // Get grammar lessons
  const grammars: GrammarLessonResponse[] = lessonsQuery.data ?? [];

  // Calculate next lesson number
  const nextLessonNumber = allLessonsQuery.data && allLessonsQuery.data.length > 0
    ? Math.max(...allLessonsQuery.data.map((l) => l.lessonNumber)) + 1
    : 1;

  // Filter grammars by search
  const filteredGrammars = useMemo(() => {
    if (!search.trim()) return grammars;
    const term = search.toLowerCase();
    return grammars.filter((g) => g.title.toLowerCase().includes(term));
  }, [grammars, search]);

  // Handlers
  const handleView = async (lesson: GrammarLessonResponse) => {
    setSelectedLesson(lesson);
    try {
      const detail = await adminGrammarApi.getAdminGrammarLesson(lesson.id);
      setSelectedLessonDetail(detail);
      setEditMode("view");
      setShowDetailModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load lesson detail");
    }
  };

  const handleEdit = async (lesson: GrammarLessonResponse) => {
    setSelectedLesson(lesson);
    try {
      const detail = await adminGrammarApi.getAdminGrammarLesson(lesson.id);
      setSelectedLessonDetail(detail);
      setEditMode("edit");
      setShowEditModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load lesson detail");
    }
  };

  const handleApplyAiDraft = (draft: {
    title: string;
    description: string;
    grammarDraft?: AdminGrammarAiDraft;
  }) => {
    if (!draft.grammarDraft) return;

    const contents: GrammarContentRequest[] = draft.grammarDraft.items.map((item, idx) => ({
      grammarPoint: item.grammarPoint,
      meaningVietnamese: item.meaningVietnamese,
      meaningJapanese: item.meaningJapanese || "",
      explanation: item.explanation || "",
      exampleSentence: item.exampleSentence || "",
      notes: item.notes || "",
      contentOrder: idx + 1,
    }));

    setSelectedLesson(null);
    setSelectedLessonDetail({
      id: "",
      lessonNumber: nextLessonNumber,
      title: draft.title || "AI Generated Grammar Lesson",
      level: normalizedLevel,
      status: "draft",
      difficulty: "MEDIUM",
      contents: contents,
    } as any);
    setEditMode("create");
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setSelectedLesson(null);
    setSelectedLessonDetail(null);
    setEditMode("create");
    setShowEditModal(true);
  };

  const handleDelete = (lesson: GrammarLessonResponse) => {
    setSelectedLesson(lesson);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedLesson) {
      deleteMutation.mutate(selectedLesson.id);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedLesson(null);
    setSelectedLessonDetail(null);
    setEditMode("create");
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedLesson(null);
    setSelectedLessonDetail(null);
  };

  const handleSave = (data: Partial<GrammarDetailResponse> & { contents?: GrammarContentRequest[] }) => {
    const contents = data.contents ?? [];

    // Ensure difficulty is always a valid value or undefined
    const validDifficulties = ["EASY", "MEDIUM", "HARD"];
    const difficulty = data.difficulty && validDifficulties.includes(data.difficulty)
      ? data.difficulty
      : undefined;

    const lessonData = {
      jlptLevel: normalizedLevel,
      lessonNumber: data.lessonNumber ?? selectedLesson?.lessonNumber ?? nextLessonNumber,
      title: data.title ?? "",
      description: data.description ?? undefined,
      estimatedMinutes: data.estimatedMinutes ?? undefined,
      difficulty,
      isActive: data.isActive ?? true,
    };

    const payload: GrammarLessonWithContentsRequest = {
      lesson: lessonData,
      contents,
    };

    if (editMode === "create") {
      createMutation.mutate(payload);
    } else if (editMode === "edit" && selectedLesson) {
      updateMutation.mutate({ id: selectedLesson.id, input: payload });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/admin/content-library" });
    }
  };

  const isLoading = lessonsQuery.isLoading;
  const error = lessonsQuery.error;

  return (
    <div className="space-y-5">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--card)] hover:bg-[var(--border)] border border-[var(--border)] text-secondary-col hover:text-primary-col text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
          <div>
            <h1 className="text-2xl font-display font-black text-primary-col leading-tight">
              Grammar Library
            </h1>
            <p className="text-xs text-muted-col mt-0.5">{normalizedLevel} Level</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Generate with AI
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Manually
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search grammar lessons..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--card)] text-primary-col placeholder:text-muted-col focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30"
        />
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[60px_1fr_auto] gap-4 px-5 py-3 border-b separator items-center">
          <div className="text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
            Lesson #
          </div>
          <div className="text-left text-[10px] uppercase tracking-wider text-muted-col font-bold">
            Title
          </div>
          <div className="text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">
            Actions
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[var(--border)]">
          {isLoading ? (
            <div className="px-5 py-12 text-center">
              <div className="inline-block w-6 h-6 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-col mt-2">Loading grammar lessons...</p>
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-red-500">Failed to load grammar lessons: {(error as Error).message}</p>
            </div>
          ) : filteredGrammars.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted-col">
                No grammar content found{search ? " matching your search" : ""}
              </p>
            </div>
          ) : (
            filteredGrammars.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[60px_1fr_auto] gap-4 px-5 py-4 hover:bg-lavender/5 transition items-center"
              >
                <div className="text-sm font-medium text-muted-col whitespace-nowrap">
                  #{item.lessonNumber}
                </div>
                <div className="font-medium text-sm text-primary-col">{item.title}</div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition text-xs font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <GrammarDetailModal
        open={showDetailModal}
        onClose={closeDetailModal}
        lesson={selectedLessonDetail}
        isLoading={false}
        isError={false}
      />

      {/* Edit Modal */}
      <GrammarBackendEditForm
        open={showEditModal}
        mode={editMode}
        lesson={selectedLessonDetail}
        onSave={handleSave}
        onCancel={closeEditModal}
        isSaving={createMutation.isPending || updateMutation.isPending}
        isLoading={false}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedLesson(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Grammar Lesson"
        message={
          selectedLesson
            ? `Are you sure you want to delete "${selectedLesson.title}"? This action cannot be undone.`
            : ""
        }
      />

      {/* AI Generate Modal */}
      <AdminAiGenerateModal
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        skillType="GRAMMAR"
        currentLevel={normalizedLevel}
        onApplyDraft={handleApplyAiDraft}
      />
    </div>
  );
}
