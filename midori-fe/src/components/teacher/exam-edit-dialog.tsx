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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { TeacherExamView, JLPTLevel } from "@/types/teacher-exam";

interface ExamEditDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exam: TeacherExamView | null;
  onSave: (updated: TeacherExamView) => void;
}

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export function ExamEditDialog({ open, onOpenChange, exam, onSave }: ExamEditDialogProps) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<JLPTLevel>("N5");
  const [duration, setDuration] = useState(60);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    if (exam && open) {
      setTitle(exam.title);
      setLevel(exam.level);
      setDuration(exam.duration);
      setTotalQuestions(exam.totalQuestions);
      setScheduledAt(exam.scheduledAt);
    }
  }, [exam, open]);

  const handleSave = () => {
    if (!exam) return;
    if (!title.trim()) {
      toast.error("Please enter an exam title");
      return;
    }
    if (!scheduledAt) {
      toast.error("Please select a scheduled date");
      return;
    }
    if (duration <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }
    if (totalQuestions <= 0) {
      toast.error("Total questions must be greater than 0");
      return;
    }

    const updated: TeacherExamView = {
      ...exam,
      title: title.trim(),
      level,
      duration,
      totalQuestions,
      scheduledAt,
    };

    onSave(updated);
    toast.info("Exam update API is not available yet. Changes were not saved to the server.");
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
          <DialogDescription>
            Update the exam details below. Click Save Changes when you are done.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exam-title">Title</Label>
            <Input
              id="exam-title"
              placeholder="e.g. N5 Mid-term Assessment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-level">Level</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as JLPTLevel)}>
              <SelectTrigger id="exam-level">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {JLPT_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-duration">Duration (minutes)</Label>
            <Input
              id="exam-duration"
              type="number"
              min={1}
              max={300}
              placeholder="60"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-questions">Total Questions</Label>
            <Input
              id="exam-questions"
              type="number"
              min={1}
              max={200}
              placeholder="30"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-scheduled">Scheduled Date</Label>
            <Input
              id="exam-scheduled"
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
