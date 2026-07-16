import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Grid, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherQuestionsApi, TeacherQuestionResponse } from "@/lib/api/teacherQuestions";
import { Loader2 } from "lucide-react";
import { MyQuestionCard } from "@/components/teacher/my-questions/MyQuestionCard";
import { MyQuestionModal } from "@/components/teacher/my-questions/MyQuestionModal";
import { DeleteDialog } from "@/components/teacher/my-questions/DeleteDialog";
import { SearchBar } from "@/components/teacher/my-questions/SearchBar";
import { SortDropdown, SortOption } from "@/components/teacher/my-questions/SortDropdown";
import type { JLPTLevel, Skill } from "@/data/teacher-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/teacher/my-questions")({
  head: () => ({ meta: [{ title: "My Questions — MIDORI Teacher" }] }),
  component: MyQuestionsPage,
});

const JLPT_ORDER: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const SKILL_ORDER: Skill[] = ["Vocabulary", "Grammar", "Listening", "Reading", "Kanji"];

function MyQuestionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "All">("All");
  const [selectedSkill, setSelectedSkill] = useState<Skill | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: rawQuestions = [], isLoading } = useQuery({
    queryKey: ["teacherQuestions"],
    queryFn: () => teacherQuestionsApi.getQuestions(),
  });

  // Modal State
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<TeacherQuestionResponse | null>(null);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<TeacherQuestionResponse | null>(null);

  // Filter, group, and sort questions
  const groupedQuestions = useMemo(() => {
    // 1. Only display questions created by the currently logged-in teacher
    const myQuestions = rawQuestions.filter((q) => q.teacherId === user?.id);

    // 2. Apply search and filters
    const filtered = myQuestions.filter((q) => {
      // Search matching prompt, tags, or topicId
      const matchesSearch =
        searchQuery === "" ||
        (q.prompt && q.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.tags && q.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.topicId && q.topicId.toLowerCase().includes(searchQuery.toLowerCase()));

      // Level filter matching
      const matchesLevel = selectedLevel === "All" || q.level === selectedLevel;

      // Skill filter matching
      const matchesSkill = selectedSkill === "All" || q.skill === selectedSkill;

      return matchesSearch && matchesLevel && matchesSkill;
    });

    // 3. Group by JLPT level and then by Skill
    const groups = {} as Record<JLPTLevel, Record<Skill, TeacherQuestionResponse[]>>;
    JLPT_ORDER.forEach((lvl) => {
      groups[lvl] = {} as Record<Skill, TeacherQuestionResponse[]>;
      SKILL_ORDER.forEach((sk) => {
        groups[lvl][sk] = [];
      });
    });

    filtered.forEach((q) => {
      const levelKey = (q.level || "N5") as JLPTLevel;
      const skillKey = (q.skill || "Grammar") as Skill;
      if (groups[levelKey] && groups[levelKey][skillKey]) {
        groups[levelKey][skillKey].push(q);
      }
    });

    // 4. Sort questions inside each skill group by Created Date (newest first)
    JLPT_ORDER.forEach((lvl) => {
      SKILL_ORDER.forEach((sk) => {
        groups[lvl][sk].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      });
    });

    return groups;
  }, [rawQuestions, user?.id, searchQuery, selectedLevel, selectedSkill]);

  // Determine if there are any questions matching the filters
  const hasMatchingQuestions = useMemo(() => {
    return JLPT_ORDER.some((lvl) =>
      SKILL_ORDER.some((sk) => groupedQuestions[lvl][sk].length > 0)
    );
  }, [groupedQuestions]);

  // Actions
  const handleViewQuestion = (q: TeacherQuestionResponse) => {
    setModalMode("view");
    setSelectedQuestion(q);
    setIsModalOpen(true);
  };

  const handleEditQuestion = (q: TeacherQuestionResponse) => {
    setModalMode("edit");
    setSelectedQuestion(q);
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (
    data: Omit<TeacherQuestionResponse, "id" | "createdAt" | "updatedAt" | "teacherId" | "points"> & { id?: string }
  ) => {
    const isNew = !data.id;
    
    const reqBody = {
      prompt: data.prompt,
      jpPrompt: data.jpPrompt,
      questionType: data.questionType || "Multiple Choice",
      difficulty: data.difficulty || "MEDIUM",
      correctAnswerIndex: data.correctAnswerIndex,
      explanation: data.explanation || "",
      tags: data.tags || "",
      options: data.options,
      level: data.level,
      skill: data.skill,
      status: data.status || "ACTIVE",
    };

    try {
      if (!isNew && data.id) {
        await teacherQuestionsApi.updateQuestion(data.id, reqBody);
        toast.success("Question updated successfully.");
      } else {
        await teacherQuestionsApi.createQuestion(reqBody);
        toast.success("Question created successfully.");
      }
      await queryClient.invalidateQueries({ queryKey: ["teacherQuestions"] });
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save question");
    }
  };

  const handleDuplicateQuestion = async (q: TeacherQuestionResponse) => {
    try {
      const full = await teacherQuestionsApi.getQuestionById(q.id);
      await teacherQuestionsApi.createQuestion({
        prompt: `${full.prompt} (Copy)`,
        jpPrompt: full.jpPrompt,
        questionType: full.questionType,
        difficulty: full.difficulty,
        correctAnswerIndex: full.correctAnswerIndex,
        explanation: full.explanation || "",
        tags: full.tags || "",
        options: full.options,
        level: full.level,
        skill: full.skill,
      });
      toast.success("Question duplicated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["teacherQuestions"] });
    } catch (err: any) {
      toast.error("Failed to duplicate question.");
    }
  };

  const handleArchiveToggle = async (q: TeacherQuestionResponse) => {
    const updatedStatus = q.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    try {
      const full = await teacherQuestionsApi.getQuestionById(q.id);
      await teacherQuestionsApi.updateQuestion(q.id, {
        prompt: full.prompt,
        jpPrompt: full.jpPrompt,
        questionType: full.questionType,
        difficulty: full.difficulty,
        correctAnswerIndex: full.correctAnswerIndex,
        explanation: full.explanation || "",
        tags: full.tags || "",
        options: full.options,
        level: full.level,
        skill: full.skill,
        status: updatedStatus,
      });
      toast.success(
        updatedStatus === "ARCHIVED"
          ? "Question archived successfully."
          : "Question restored successfully."
      );
      await queryClient.invalidateQueries({ queryKey: ["teacherQuestions"] });
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteClick = (q: TeacherQuestionResponse) => {
    setQuestionToDelete(q);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (questionToDelete) {
      try {
        await teacherQuestionsApi.deleteQuestion(questionToDelete.id);
        toast.success("Question deleted successfully.");
        await queryClient.invalidateQueries({ queryKey: ["teacherQuestions"] });
      } catch (err: any) {
        toast.error("Failed to delete question.");
      }
      setIsDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Personal library"
        title="My Questions"
        subtitle="Manage your personal question library."
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-2">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          
          <Select value={selectedLevel} onValueChange={(val) => setSelectedLevel(val as any)}>
            <SelectTrigger className="w-[140px] h-10 border-border/60 shrink-0">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Levels</SelectItem>
              <SelectItem value="N5">N5</SelectItem>
              <SelectItem value="N4">N4</SelectItem>
              <SelectItem value="N3">N3</SelectItem>
              <SelectItem value="N2">N2</SelectItem>
              <SelectItem value="N1">N1</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSkill} onValueChange={(val) => setSelectedSkill(val as any)}>
            <SelectTrigger className="w-[140px] h-10 border-border/60 shrink-0">
              <SelectValue placeholder="All Skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Skills</SelectItem>
              <SelectItem value="Vocabulary">Vocabulary</SelectItem>
              <SelectItem value="Grammar">Grammar</SelectItem>
              <SelectItem value="Listening">Listening</SelectItem>
              <SelectItem value="Reading">Reading</SelectItem>
              <SelectItem value="Kanji">Kanji</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Button variant="default" className="h-10" onClick={() => {
            setModalMode("create");
            setSelectedQuestion(null);
            setIsModalOpen(true);
          }}>
            Create Question
          </Button>

          <div className="flex items-center border rounded-lg p-0.5 bg-background border-border/60 shrink-0">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8.5 w-8.5 rounded-md"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8.5 w-8.5 rounded-md"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grouped JLPT Level and Skill Sections */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading your questions...</span>
        </div>
      ) : !hasMatchingQuestions ? (
        <Card className="py-16 text-center border-border/60 shadow-sm flex flex-col items-center justify-center space-y-4">
          <p className="text-muted-foreground text-base">
            {selectedLevel !== "All" || selectedSkill !== "All" || searchQuery
              ? "No questions found matching the selected filters."
              : "You haven't created any questions yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {JLPT_ORDER.map((lvl) => {
            // Count total questions in this level group
            const levelCount = SKILL_ORDER.reduce(
              (acc, sk) => acc + groupedQuestions[lvl][sk].length,
              0
            );
            if (levelCount === 0) return null;

            return (
              <div key={lvl} className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                  <h2 className="text-xl font-bold text-foreground font-display">{lvl}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-semibold">
                    {levelCount} {levelCount === 1 ? "Question" : "Questions"}
                  </span>
                </div>

                <div className="pl-4 space-y-6">
                  {SKILL_ORDER.map((sk) => {
                    const list = groupedQuestions[lvl][sk];
                    if (list.length === 0) return null;

                    return (
                      <div key={sk} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            {sk}
                          </h3>
                          <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-semibold">
                            {list.length}
                          </span>
                        </div>

                        <div
                          className={
                            viewMode === "grid"
                              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                              : "flex flex-col gap-3"
                          }
                        >
                          {list.map((q) => (
                            <MyQuestionCard
                              key={q.id}
                              question={q}
                              viewMode={viewMode}
                              onView={handleViewQuestion}
                              onEdit={handleEditQuestion}
                              onDuplicate={handleDuplicateQuestion}
                              onArchiveToggle={handleArchiveToggle}
                              onDelete={handleDeleteClick}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals and Dialogs */}
      <MyQuestionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        question={selectedQuestion}
        onSave={handleSaveQuestion}
      />

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
