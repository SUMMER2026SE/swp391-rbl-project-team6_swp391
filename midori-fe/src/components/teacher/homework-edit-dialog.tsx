import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PenLine } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Homework } from "@/data/teacher-data";

interface HomeworkEditDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  homework: Homework | null;
  onSave: (updated: Homework) => void;
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
  const [status, setStatus] = useState<"Draft" | "Assigned" | "Closed">("Assigned");

  useEffect(() => {
    if (homework) {
      setTitle(homework.title);
      setInstructions(homework.instructions);
      setDueDate(homework.dueDate);
      setMaxScore(homework.maxScore);
      setAttempts(homework.attempts);
      setStatus(homework.status);
    }
  }, [homework]);

  const handleSave = () => {
    if (!homework) return;
    const updated: Homework = {
      ...homework,
      title,
      instructions,
      dueDate,
      maxScore,
      attempts,
      status,
    };
    onSave(updated);
    toast.success("Homework updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Edit Homework
          </DialogTitle>
          <DialogDescription>
            Update the details for this homework assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hw-title">Title</Label>
            <Input
              id="hw-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter homework title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hw-instructions">Instructions</Label>
            <Textarea
              id="hw-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Enter instructions for students"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hw-due-date">Due Date</Label>
              <Input
                id="hw-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hw-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "Draft" | "Assigned" | "Closed")}
              >
                <SelectTrigger id="hw-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hw-max-score">Max Score</Label>
              <Input
                id="hw-max-score"
                type="number"
                min={1}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hw-attempts">Attempts</Label>
              <Input
                id="hw-attempts"
                type="number"
                min={1}
                value={attempts}
                onChange={(e) => setAttempts(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
