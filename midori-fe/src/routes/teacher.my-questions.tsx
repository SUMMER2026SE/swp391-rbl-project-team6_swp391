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

import {
  initialMockQuestions,
  MockQuestion,
} from "@/data/mockQuestions";
import { MyQuestionCard } from "@/components/teacher/my-questions/MyQuestionCard";
import { MyQuestionModal } from "@/components/teacher/my-questions/MyQuestionModal";
import { DeleteDialog } from "@/components/teacher/my-questions/DeleteDialog";
import { SearchBar } from "@/components/teacher/my-questions/SearchBar";
import { SortDropdown, SortOption } from "@/components/teacher/my-questions/SortDropdown";
import type { JLPTLevel } from "@/data/teacher-data";

export const Route = createFileRoute("/teacher/my-questions")({
  head: () => ({ meta: [{ title: "My Questions — MIDORI Teacher" }] }),
  component: MyQuestionsPage,
});

const JLPT_ORDER: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

function MyQuestionsPage() {
  const [questions, setQuestions] = useState<MockQuestion[]>(initialMockQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal State
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<MockQuestion | null>(null);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<MockQuestion | null>(null);

  // Group and sort questions by level
  const groupedQuestions = useMemo(() => {
    const filtered = questions.filter((q) => {
      // Search matching title, content, or tags
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // Level filter matching
      const matchesLevel = selectedLevel === "All" || q.level === selectedLevel;

      return matchesSearch && matchesLevel;
    });

    // Group questions by JLPT level
    const groups = {} as Record<JLPTLevel, MockQuestion[]>;
    JLPT_ORDER.forEach((lvl) => {
      groups[lvl] = [];
    });

    filtered.forEach((q) => {
      if (groups[q.level]) {
        groups[q.level].push(q);
      }
    });

    // Sort questions within each group
    JLPT_ORDER.forEach((lvl) => {
      groups[lvl].sort((a, b) => {
        switch (sortBy) {
          case "Newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "Oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "Recently Edited":
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case "Most Used":
            return b.usageCount - a.usageCount;
          case "Alphabetical":
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
    });

    return groups;
  }, [questions, searchQuery, selectedLevel, sortBy]);

  // Determine if there are any questions matching the filters
  const hasMatchingQuestions = useMemo(() => {
    return Object.values(groupedQuestions).some((list) => list.length > 0);
  }, [groupedQuestions]);

  // Actions
  const handleViewQuestion = (q: MockQuestion) => {
    setModalMode("view");
    setSelectedQuestion(q);
    setIsModalOpen(true);
  };

  const handleEditQuestion = (q: MockQuestion) => {
    setModalMode("edit");
    setSelectedQuestion(q);
    setIsModalOpen(true);
  };

  const handleSaveQuestion = (
    data: Omit<MockQuestion, "id" | "createdAt" | "updatedAt" | "usageCount"> & { id?: string }
  ) => {
    const nowStr = new Date().toISOString();
    if (data.id) {
      // Edit
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === data.id
            ? {
                ...q,
                ...data,
                updatedAt: nowStr,
              }
            : q
        )
      );
      toast.success("Question updated successfully.");
    } else {
      // Create (Fallback for duplicate flow / modal state handling)
      const newQuestion: MockQuestion = {
        ...data,
        id: `q-${Date.now()}`,
        usageCount: 0,
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      setQuestions((prev) => [newQuestion, ...prev]);
      toast.success("Question created successfully.");
    }
  };

  const handleDuplicateQuestion = (q: MockQuestion) => {
    const nowStr = new Date().toISOString();
    const duplicated: MockQuestion = {
      ...q,
      id: `q-${Date.now()}`,
      title: `${q.title} (Copy)`,
      usageCount: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
      status: "Active",
    };
    setQuestions((prev) => [duplicated, ...prev]);
    toast.success(`Duplicated question as "${duplicated.title}".`);
  };

  const handleArchiveToggle = (q: MockQuestion) => {
    const updatedStatus = q.status === "Active" ? "Archived" : "Active";
    setQuestions((prev) =>
      prev.map((item) =>
        item.id === q.id
          ? {
              ...item,
              status: updatedStatus,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    toast.success(
      updatedStatus === "Archived"
        ? "Question archived successfully."
        : "Question restored successfully."
    );
  };

  const handleDeleteClick = (q: MockQuestion) => {
    setQuestionToDelete(q);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (questionToDelete) {
      setQuestions((prev) => prev.filter((q) => q.id !== questionToDelete.id));
      toast.success("Question deleted successfully.");
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
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <SortDropdown value={sortBy} onChange={setSortBy} />

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

      {/* Grouped JLPT Level Sections */}
      {!hasMatchingQuestions ? (
        <Card className="py-16 text-center border-border/60 shadow-sm flex flex-col items-center justify-center space-y-4">
          <p className="text-muted-foreground text-base">
            {selectedLevel !== "All" || searchQuery
              ? "No questions found for this JLPT level."
              : "You haven't created any questions yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {JLPT_ORDER.map((lvl) => {
            const list = groupedQuestions[lvl];
            if (list.length === 0) return null;

            return (
              <div key={lvl} className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <h2 className="text-xl font-bold text-foreground font-display">{lvl}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-semibold">
                    {list.length} {list.length === 1 ? "Question" : "Questions"}
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
