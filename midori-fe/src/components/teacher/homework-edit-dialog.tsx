import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PenLine,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Eye,
  RefreshCw,
  X,
  HelpCircle,
  Award,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HomeworkResponse } from "@/lib/api/homework";
import { teacherQuestionsApi, type TeacherQuestionResponse } from "@/lib/api/teacherQuestions";
import { MyQuestionModal } from "./my-questions/MyQuestionModal";
import { LevelBadge, DifficultyBadge } from "./badges";

interface HomeworkEditDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  homework: HomeworkResponse | null;
  onSave: (updated: HomeworkResponse) => void;
}

export function HomeworkEditDialog({
  open,
  onOpenChange,
  homework,
  onSave,
}: HomeworkEditDialogProps) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [attempts, setAttempts] = useState(1);
  const [status, setStatus] = useState<"DRAFT" | "ASSIGNED" | "CLOSED">("ASSIGNED");

  // Questions state
  const [questions, setQuestions] = useState<TeacherQuestionResponse[]>([]);

  // Question editing/viewing state
  const [editingQuestion, setEditingQuestion] = useState<TeacherQuestionResponse | null>(null);
  const [questionModalMode, setQuestionModalMode] = useState<"view" | "edit">("edit");
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

  // Question bank dialog state
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  // Question bank filters
  const [bankLevel, setBankLevel] = useState<string>("All");
  const [bankSkill, setBankSkill] = useState<string>("All");
  const [bankDifficulty, setBankDifficulty] = useState<string>("All");
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

  // Fetch Question Bank
  const { data: bankQuestions = [] } = useQuery({
    queryKey: ["teacherQuestions"],
    queryFn: () => teacherQuestionsApi.getQuestions(),
    enabled: isBankOpen,
  });

  useEffect(() => {
    if (homework) {
      setTitle(homework.title);
      setInstructions(homework.instructions || "");
      setDueDate(homework.dueDate ? homework.dueDate.slice(0, 10) : "");
      setMaxScore(homework.maxScore);
      setAttempts(homework.attempts);
      setStatus(homework.status);
      setQuestions(homework.questions || []);
    }
  }, [homework]);

  // Sync Max Score automatically when questions list change
  useEffect(() => {
    const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 10), 0);
    if (totalPoints > 0) {
      setMaxScore(totalPoints);
    }
  }, [questions]);

  const handleSave = () => {
    if (!homework) return;
    const updated: HomeworkResponse = {
      ...homework,
      title,
      instructions,
      dueDate,
      maxScore,
      attempts,
      status,
      questions, // Send local edited/ordered questions list
    };
    onSave(updated);
    onOpenChange(false);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setQuestions(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleStartEditQuestion = (q: TeacherQuestionResponse) => {
    setEditingQuestion(q);
    setQuestionModalMode("edit");
    setIsQuestionModalOpen(true);
  };

  const handleStartViewQuestion = (q: TeacherQuestionResponse) => {
    setEditingQuestion(q);
    setQuestionModalMode("view");
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (data: any) => {
    try {
      const reqBody = {
        prompt: data.prompt,
        jpPrompt: data.jpPrompt,
        questionType: data.questionType || "Multiple Choice",
        difficulty: data.difficulty?.toUpperCase() || "MEDIUM",
        correctAnswerIndex: data.correctAnswerIndex,
        explanation: data.explanation || "",
        tags: data.tags || "",
        options: data.options,
        level: data.level,
        skill: data.skill,
        status: data.status || "ACTIVE",
        points: data.points,
      };
      if (questionModalMode === "create") {
        const res = await teacherQuestionsApi.createQuestion(reqBody);
        toast.success("Question created successfully.");
        setQuestions((prev) => [...prev, res]);
      } else {
        if (!editingQuestion) return;
        const res = await teacherQuestionsApi.updateQuestion(editingQuestion.id, reqBody);
        toast.success("Question updated successfully.");
        setQuestions((prev) => prev.map((q) => (q.id === editingQuestion.id ? res : q)));
      }
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save question");
    }
  };

  const handleStartReplace = (index: number) => {
    setReplacingIndex(index);
    setSelectedBankIds([]);
    setIsBankOpen(true);
  };

  // Filter Question Bank list
  const filteredBank = bankQuestions.filter((q) => {
    const matchLevel = bankLevel === "All" || q.level === bankLevel;
    const matchSkill = bankSkill === "All" || q.skill === bankSkill;
    const matchDifficulty =
      bankDifficulty === "All" || q.difficulty?.toUpperCase() === bankDifficulty.toUpperCase();
    const matchSearch =
      !bankSearch ||
      q.prompt.toLowerCase().includes(bankSearch.toLowerCase()) ||
      (q.jpPrompt && q.jpPrompt.toLowerCase().includes(bankSearch.toLowerCase()));

    // Prevent showing questions that are already in the list (unless replacing)
    const isAlreadySelected = questions.some((existing) => existing.id === q.id);
    if (replacingIndex === null && isAlreadySelected) return false;

    return matchLevel && matchSkill && matchDifficulty && matchSearch;
  });

  const handleAddSelectedFromBank = () => {
    if (replacingIndex !== null) {
      // Single replace
      if (selectedBankIds.length === 0) {
        toast.error("Please select a question to replace.");
        return;
      }
      const selectedQuestion = bankQuestions.find((q) => q.id === selectedBankIds[0]);
      if (selectedQuestion) {
        const updated = [...questions];
        updated[replacingIndex] = selectedQuestion;
        setQuestions(updated);
        setIsBankOpen(false);
        setReplacingIndex(null);
        toast.success("Question replaced successfully.");
      }
    } else {
      // Multiple add
      const selectedQuestions = bankQuestions.filter((q) => selectedBankIds.includes(q.id));
      if (selectedQuestions.length === 0) {
        toast.error("Please select questions to add.");
        return;
      }
      // Deduplicate before adding
      const toAdd = selectedQuestions.filter(
        (q) => !questions.some((existing) => existing.id === q.id),
      );
      setQuestions((prev) => [...prev, ...toAdd]);
      setIsBankOpen(false);
      toast.success(`Added ${toAdd.length} question(s) to homework.`);
    }
  };

  const toggleBankSelection = (id: string) => {
    if (replacingIndex !== null) {
      // Single select for replacement
      setSelectedBankIds([id]);
    } else {
      // Multi-select for adding
      setSelectedBankIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[94vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border">
          {/* Header */}
          <div className="p-6 pb-4 border-b flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-black font-display text-foreground dark:text-white">
                <PenLine className="w-5 h-5 text-primary" />
                Edit Homework
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                Update instructions and manage questions. Use the controls to arrange, add, edit, or
                swap questions.
              </DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Scroll Area */}
          <ScrollArea className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[68vh]">
            <div className="space-y-6">
              {/* Basic Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="hw-title"
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    Title *
                  </Label>
                  <Input
                    id="hw-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter homework title"
                    className="rounded-xl bg-muted/30 focus:bg-background transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="hw-instructions"
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    Instructions
                  </Label>
                  <Textarea
                    id="hw-instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={2}
                    placeholder="Enter instructions for students"
                    className="rounded-xl bg-muted/30 focus:bg-background transition resize-none leading-relaxed text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="hw-due-date"
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      Due Date
                    </Label>
                    <Input
                      id="hw-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="rounded-xl bg-muted/30 focus:bg-background transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="hw-status"
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      Status
                    </Label>
                    <Select
                      value={status}
                      onValueChange={(v) => setStatus(v as "DRAFT" | "ASSIGNED" | "CLOSED")}
                    >
                      <SelectTrigger
                        id="hw-status"
                        className="rounded-xl bg-muted/30 focus:bg-background transition"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ASSIGNED">Assigned</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label
                        htmlFor="hw-max-score"
                        className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      >
                        Max Score
                      </Label>
                      <span className="text-[10px] text-muted-foreground italic">
                        (Sum of question points)
                      </span>
                    </div>
                    <Input
                      id="hw-max-score"
                      type="number"
                      value={maxScore}
                      disabled
                      className="rounded-xl bg-muted/50 cursor-not-allowed font-mono text-sm font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="hw-attempts"
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      Attempts Limit
                    </Label>
                    <Input
                      id="hw-attempts"
                      type="number"
                      min={1}
                      value={attempts}
                      onChange={(e) => setAttempts(Number(e.target.value) || 1)}
                      className="rounded-xl bg-muted/30 focus:bg-background transition"
                    />
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border">
                  <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                      Homework Questions List ({questions.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Detailed view and ordering controls.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl bg-gradient-hero text-white font-bold"
                    onClick={() => {
                      setEditingQuestion(null);
                      setQuestionModalMode("create");
                      setIsQuestionModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add Question
                  </Button>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-3xl bg-muted/10">
                    <HelpCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-semibold">
                      No questions assigned to this homework.
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click "Add Question" to write a new question.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <div
                        key={`${q.id || ""}-${idx}`}
                        className="flex gap-4 p-5 bg-card hover:bg-muted/10 border border-slate-200 dark:border-slate-800 rounded-2xl transition shadow-sm relative group"
                      >
                        {/* Question Reordering Sidebar */}
                        <div className="flex flex-col gap-1 items-center justify-center shrink-0 border-r pr-4 bg-muted/5 rounded-xl">
                          <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <span className="text-xs font-black text-primary font-mono">
                            {idx + 1}
                          </span>
                          <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === questions.length - 1}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Full Question Details Panel */}
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Heading Line */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex flex-wrap gap-2 items-center">
                              {q.level && <LevelBadge level={q.level as any} />}
                              {q.difficulty && (
                                <DifficultyBadge
                                  d={
                                    (q.difficulty.charAt(0).toUpperCase() +
                                      q.difficulty.slice(1).toLowerCase()) as any
                                  }
                                />
                              )}
                              <span className="text-[10px] font-black uppercase text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-border/40">
                                {q.skill || "Vocabulary"}
                              </span>
                            </div>
                            <span className="text-xs font-black bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1 shrink-0">
                              <Award className="w-3 h-3 text-amber-500" />
                              {q.points ?? 10} pts
                            </span>
                          </div>

                          {/* Prompt */}
                          <div className="text-sm font-semibold text-foreground leading-normal">
                            {q.prompt}
                          </div>
                          {q.jpPrompt && (
                            <div className="text-xs font-medium text-muted-foreground font-jp">
                              {q.jpPrompt}
                            </div>
                          )}

                          {/* Answer Options */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-2">
                              {q.options.map((opt, oIdx) => {
                                const isCorrect = oIdx === q.correctAnswerIndex;
                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                                      isCorrect
                                        ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-400"
                                        : "bg-muted/40 border-border text-muted-foreground"
                                    }`}
                                  >
                                    <span className="font-bold mr-1.5">
                                      {String.fromCharCode(65 + oIdx)}.
                                    </span>{" "}
                                    {opt}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border-l-3 border-primary leading-relaxed">
                              <strong className="text-foreground">Explanation:</strong>{" "}
                              {q.explanation}
                            </div>
                          )}
                        </div>

                        {/* Actions Overlay */}
                        <div className="flex flex-col gap-1.5 shrink-0 border-l pl-4 justify-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-muted"
                            onClick={() => handleStartViewQuestion(q)}
                            title="View Question"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-muted"
                            onClick={() => handleStartEditQuestion(q)}
                            title="Edit Question"
                          >
                            <PenLine className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-muted"
                            onClick={() => handleStartReplace(idx)}
                            title="Replace Question"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveQuestion(idx)}
                            title="Remove Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-6 border-t bg-muted/10 flex justify-end gap-2.5">
            <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-gradient-hero text-white font-bold"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QUESTION EDITOR MODAL */}
      <MyQuestionModal
        open={isQuestionModalOpen}
        onOpenChange={setIsQuestionModalOpen}
        mode={questionModalMode}
        question={editingQuestion}
        onSave={handleSaveQuestion}
      />

      {/* QUESTION BANK SELECTOR DIALOG (Add / Replace workflow) */}
      <Dialog open={isBankOpen} onOpenChange={setIsBankOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border shadow-2xl">
          <div className="p-6 pb-4 border-b flex justify-between items-start">
            <div>
              <DialogTitle className="text-lg font-bold">
                {replacingIndex !== null ? "Replace Question" : "Add from Question Bank"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                {replacingIndex !== null
                  ? "Select a replacement question from the bank pool. The original question remains unmodified."
                  : "Filter, preview, and select questions to append to this homework."}
              </DialogDescription>
            </div>
            <button
              onClick={() => setIsBankOpen(false)}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-muted/30 border-b grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                JLPT Level
              </label>
              <Select value={bankLevel} onValueChange={setBankLevel}>
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
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

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Skill</label>
              <Select value={bankSkill} onValueChange={setBankSkill}>
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
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

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Difficulty
              </label>
              <Select value={bankDifficulty} onValueChange={setBankDifficulty}>
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                <Input
                  placeholder="Keyword..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="h-9 pl-9 rounded-xl text-xs bg-background"
                />
              </div>
            </div>
          </div>

          {/* List Area showing full preview content */}
          <ScrollArea className="flex-1 p-6 max-h-[48vh] overflow-y-auto">
            {filteredBank.length === 0 ? (
              <div className="text-center py-16 border border-dashed rounded-2xl bg-muted/10">
                <HelpCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No matching questions found in the bank pool.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBank.map((q) => {
                  const isChecked = selectedBankIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleBankSelection(q.id)}
                      className={`flex gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-muted/10 transition shadow-sm ${
                        isChecked
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <input
                        type={replacingIndex !== null ? "radio" : "checkbox"}
                        checked={isChecked}
                        readOnly
                        className="mt-1 h-4 w-4 rounded-lg text-primary border-slate-300 dark:border-slate-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Tags Line */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {q.level && <LevelBadge level={q.level as any} className="scale-90" />}
                            {q.difficulty && (
                              <DifficultyBadge
                                d={
                                  (q.difficulty.charAt(0).toUpperCase() +
                                    q.difficulty.slice(1).toLowerCase()) as any
                                }
                                className="scale-90"
                              />
                            )}
                            <span className="text-[9px] font-black uppercase text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/40">
                              {q.skill || "Vocabulary"}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-muted-foreground shrink-0">
                            {q.points ?? 10} pts
                          </span>
                        </div>

                        {/* Prompt */}
                        <p className="text-xs font-bold text-foreground leading-normal">
                          {q.prompt}
                        </p>

                        {/* Options preview */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid gap-1.5 grid-cols-1 sm:grid-cols-2 mt-1">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === q.correctAnswerIndex;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-1.5 rounded-lg border text-[10px] font-semibold transition ${
                                    isCorrect
                                      ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-400"
                                      : "bg-muted/40 border-border text-muted-foreground"
                                  }`}
                                >
                                  <span className="font-bold mr-1">
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span>{" "}
                                  {opt}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsBankOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-xl font-bold bg-gradient-hero text-white"
              onClick={handleAddSelectedFromBank}
            >
              {replacingIndex !== null
                ? "Replace Question"
                : `Add Selected (${selectedBankIds.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
