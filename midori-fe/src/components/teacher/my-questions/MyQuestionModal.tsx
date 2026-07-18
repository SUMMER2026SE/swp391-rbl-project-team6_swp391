import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeacherQuestionResponse } from "@/lib/api/teacherQuestions";
import type { JLPTLevel, Skill, Difficulty } from "@/data/teacher-data";
import { LevelBadge, DifficultyBadge } from "../badges";

interface MyQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "edit" | "create";
  question?: TeacherQuestionResponse | null;
  onSave: (
    q: Omit<TeacherQuestionResponse, "id" | "createdAt" | "updatedAt" | "teacherId"> & {
      id?: string;
    },
  ) => void;
}

export function MyQuestionModal({
  open,
  onOpenChange,
  mode,
  question,
  onSave,
}: MyQuestionModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Multiple Choice");
  const [level, setLevel] = useState<JLPTLevel>("N3");
  const [skill, setSkill] = useState<Skill>("Grammar");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [content, setContent] = useState("");
  const [choices, setChoices] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [points, setPoints] = useState<number>(10);

  // Load values when modal opens or question changes
  useEffect(() => {
    if (open) {
      if (mode !== "create" && question) {
        setTitle(
          question.jpPrompt ||
            (question.prompt && question.prompt.length > 40
              ? question.prompt.slice(0, 40) + "..."
              : question.prompt) ||
            "",
        );
        setType(question.questionType || "Multiple Choice");
        setLevel((question.level || "N3") as JLPTLevel);
        setSkill((question.skill || "Grammar") as Skill);

        const difficultyMapped = question.difficulty
          ? ((question.difficulty.charAt(0).toUpperCase() +
              question.difficulty.slice(1).toLowerCase()) as Difficulty)
          : "Medium";
        setDifficulty(difficultyMapped);

        setContent(question.prompt || "");
        setChoices(
          question.options && question.options.length > 0
            ? [...question.options]
            : ["", "", "", ""],
        );

        const correct =
          question.options && question.options[question.correctAnswerIndex] !== undefined
            ? question.options[question.correctAnswerIndex]
            : "";
        setCorrectAnswer(correct);
        setExplanation(question.explanation || "");
        setTagsInput(question.tags || "");
        setStatus(question.status || "ACTIVE");
        setPoints(question.points !== undefined ? question.points : 10);
      } else {
        // Reset to default/blank values for Create mode
        setTitle("");
        setType("Multiple Choice");
        setLevel("N3");
        setSkill("Grammar");
        setDifficulty("Medium");
        setContent("");
        setChoices(["", "", "", ""]);
        setCorrectAnswer("");
        setExplanation("");
        setTagsInput("");
        setStatus("ACTIVE");
        setPoints(10);
      }
    }
  }, [open, mode, question]);

  const handleChoiceChange = (index: number, val: string) => {
    const updated = [...choices];
    updated[index] = val;
    setChoices(updated);
  };

  const handleSave = () => {
    if (!content.trim()) return;

    // Filter out blank choices and parse tags
    const cleanedChoices = choices.map((c) => c.trim()).filter(Boolean);
    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .join(", ");

    onSave({
      id: question?.id,
      jpPrompt: title.trim() || undefined,
      questionType: type,
      level,
      skill,
      difficulty: difficulty.toUpperCase(),
      prompt: content.trim(),
      options: cleanedChoices,
      correctAnswerIndex:
        cleanedChoices.indexOf(correctAnswer) >= 0 ? cleanedChoices.indexOf(correctAnswer) : 0,
      explanation: explanation.trim(),
      tags: parsedTags,
      status,
      points,
    });
    onOpenChange(false);
  };

  const isView = mode === "view";

  const questionTitle =
    question?.jpPrompt ||
    (question?.prompt && question.prompt.length > 40
      ? question.prompt.slice(0, 40) + "..."
      : question?.prompt) ||
    "Question";
  const questionDifficulty = question?.difficulty
    ? ((question.difficulty.charAt(0).toUpperCase() +
        question.difficulty.slice(1).toLowerCase()) as Difficulty)
    : "Medium";
  const questionCorrectAnswer =
    question?.options && question.options[question.correctAnswerIndex] !== undefined
      ? question.options[question.correctAnswerIndex]
      : "";
  const questionTagsList = question?.tags
    ? question.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isView
              ? "Question Details"
              : mode === "edit"
                ? "Edit Question"
                : "Create New Question"}
          </DialogTitle>
          <DialogDescription>
            {isView
              ? "Detailed specifications and view of the question."
              : "Fill in the details to save the question to your library."}
          </DialogDescription>
        </DialogHeader>

        {isView && question ? (
          // VIEW MODE LAYOUT
          <div className="space-y-6 py-2">
            <div className="flex flex-wrap gap-2 items-center border-b pb-4">
              <LevelBadge level={(question.level || "N5") as JLPTLevel} />
              <DifficultyBadge d={questionDifficulty} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {question.skill || "Grammar"}
              </span>
              <span className="text-xs text-muted-foreground bg-accent/30 px-2 py-0.5 rounded">
                {question.questionType || "Multiple Choice"}
              </span>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {question.status === "ACTIVE" ? "Active" : "Archived"}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Title</h4>
              <p className="font-semibold text-base text-foreground">{questionTitle}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Prompt / Content</h4>
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-sm font-jp whitespace-pre-wrap">
                {question.prompt}
              </div>
            </div>

            {question.options && question.options.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Choices</h4>
                <div className="grid gap-2">
                  {question.options.map((choice, i) => {
                    const isCorrect = choice === questionCorrectAnswer;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${
                          isCorrect
                            ? "bg-success/10 border-success/40 text-success-foreground font-semibold"
                            : "bg-card border-border/50"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                            isCorrect
                              ? "bg-success text-success-foreground border-success"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="font-jp">{choice}</span>
                        {isCorrect && (
                          <span className="ml-auto text-xs font-bold uppercase">Correct</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!question.options?.length && questionCorrectAnswer && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Correct Answer</h4>
                <p className="text-sm font-semibold text-success font-jp">
                  {questionCorrectAnswer}
                </p>
              </div>
            )}

            {question.explanation && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Explanation</h4>
                <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">
                  {question.explanation}
                </p>
              </div>
            )}

            {questionTagsList.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1.5">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {questionTagsList.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // EDIT / CREATE MODE LAYOUT
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="q-title">Question Title</Label>
              <Input
                id="q-title"
                placeholder="e.g. JLPT N3 Grammar: ~からこそ"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="q-type">Question Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="q-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                    <SelectItem value="Fill in the blank">Fill in the blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="q-level">JLPT Level</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as JLPTLevel)}>
                  <SelectTrigger id="q-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N5">N5</SelectItem>
                    <SelectItem value="N4">N4</SelectItem>
                    <SelectItem value="N3">N3</SelectItem>
                    <SelectItem value="N2">N2</SelectItem>
                    <SelectItem value="N1">N1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="q-skill">Skill</Label>
                <Select value={skill} onValueChange={(v) => setSkill(v as Skill)}>
                  <SelectTrigger id="q-skill">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vocabulary">Vocabulary</SelectItem>
                    <SelectItem value="Grammar">Grammar</SelectItem>
                    <SelectItem value="Kanji">Kanji</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                    <SelectItem value="Listening">Listening</SelectItem>
                    <SelectItem value="Speaking">Speaking</SelectItem>
                    <SelectItem value="Writing">Writing</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="q-difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger id="q-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="q-points">Points</Label>
                <Input
                  id="q-points"
                  type="number"
                  min={0}
                  value={points}
                  onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="q-content">Question Content / Prompt</Label>
              <Textarea
                id="q-content"
                className="font-jp"
                placeholder="Write your question text here (e.g. 日本語を勉強している（　　）…)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
            </div>

            {type === "Multiple Choice" && (
              <div className="space-y-2.5">
                <Label>Choices</Label>
                <div className="grid gap-2">
                  {choices.map((choice, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs font-semibold text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <Input
                        className="font-jp flex-1"
                        placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                        value={choice}
                        onChange={(e) => handleChoiceChange(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="q-correct">Correct Answer</Label>
              {type === "Multiple Choice" ? (
                <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                  <SelectTrigger id="q-correct">
                    <SelectValue placeholder="Select correct option" />
                  </SelectTrigger>
                  <SelectContent>
                    {choices.map((c, i) => {
                      const choiceVal = c.trim();
                      if (!choiceVal) return null;
                      return (
                        <SelectItem key={i} value={choiceVal}>
                          {String.fromCharCode(65 + i)}: {choiceVal}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="q-correct"
                  className="font-jp"
                  placeholder="Enter correct answer"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="q-explanation">Explanation</Label>
              <Textarea
                id="q-explanation"
                placeholder="Explain why the answer is correct..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="q-tags">Tags (comma-separated)</Label>
                <Input
                  id="q-tags"
                  placeholder="grammar, n3, particle"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              {(mode === "edit" || mode === "create") && (
                <div className="grid gap-2">
                  <Label htmlFor="q-status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="q-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {isView ? (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!content.trim()}>
                Save Question
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
