import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
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
import type { Lesson, JLPTLevel, Skill } from "@/data/teacher-data";

interface LessonEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  onSave: (updated: Lesson) => void;
}

const SKILL_OPTIONS: Skill[] = [
  "Vocabulary",
  "Grammar",
  "Kanji",
  "Reading",
  "Listening",
  "Speaking",
  "Writing",
  "Mixed",
];

const LEVEL_OPTIONS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export function LessonEditDialog({
  open,
  onOpenChange,
  lesson,
  onSave,
}: LessonEditDialogProps) {
  const [title, setTitle] = useState("");
  const [jpTitle, setJpTitle] = useState("");
  const [skill, setSkill] = useState<Skill>("Vocabulary");
  const [level, setLevel] = useState<JLPTLevel>("N5");
  const [objective, setObjective] = useState("");
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    if (open && lesson) {
      setTitle(lesson.title);
      setJpTitle(lesson.jpTitle);
      setSkill(lesson.skill);
      setLevel(lesson.level);
      setObjective(lesson.objective);
      setDuration(lesson.duration);
    }
  }, [open, lesson]);

  const handleSave = () => {
    if (!lesson || !title.trim()) return;

    const updated: Lesson = {
      ...lesson,
      title: title.trim(),
      jpTitle: jpTitle.trim(),
      skill,
      level,
      objective: objective.trim(),
      duration,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    toast.success("Lesson updated");
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!lesson) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <PenLine className="h-5 w-5" />
            Edit Lesson
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update the lesson details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-foreground">
              Title
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-jp-title" className="text-foreground">
              Japanese Title
            </Label>
            <Input
              id="edit-jp-title"
              value={jpTitle}
              onChange={(e) => setJpTitle(e.target.value)}
              placeholder="日本語のタイトル"
              className="bg-background border-input text-foreground font-jp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-skill" className="text-foreground">
                Skill
              </Label>
              <Select
                value={skill}
                onValueChange={(value) => setSkill(value as Skill)}
              >
                <SelectTrigger
                  id="edit-skill"
                  className="bg-background border-input text-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {SKILL_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-foreground">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-level" className="text-foreground">
                Level
              </Label>
              <Select
                value={level}
                onValueChange={(value) => setLevel(value as JLPTLevel)}
              >
                <SelectTrigger
                  id="edit-level"
                  className="bg-background border-input text-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {LEVEL_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l} className="text-foreground">
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-objective" className="text-foreground">
              Objective
            </Label>
            <Textarea
              id="edit-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe the learning objective"
              rows={3}
              className="bg-background border-input text-foreground resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-duration" className="text-foreground">
              Duration (minutes)
            </Label>
            <Input
              id="edit-duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="bg-background border-input text-foreground"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
