import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Calendar, Loader2, Users } from "lucide-react";
import { classesApi } from "@/lib/api/classes";
import { examsApi } from "@/lib/api/exams";
import { ApiError } from "@/lib/api/client";
import type { TeacherExamView } from "@/types/teacher-exam";
import { LevelBadge } from "@/components/teacher/badges";
import { cn } from "@/lib/utils";

interface ExamAssignDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exam: TeacherExamView | null;
  /** Called after successful assignment with the assigned classId. */
  onSuccess?: (classId: string) => void;
}

export function ExamAssignDialog({ open, onOpenChange, exam, onSuccess }: ExamAssignDialogProps) {
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
    enabled: open,
  });

  const activeClasses = classes.filter((c) => c.status === "ACTIVE");

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedClassId(exam?.classId ?? null);
      setScheduledAt("");
    }
  }, [open, exam?.classId]);

  const selectedClass = activeClasses.find((c) => c.id === selectedClassId) ?? null;

  const canAssign = !!(
    exam &&
    selectedClassId &&
    !isAssigning
  );

  const handleAssign = async () => {
    if (!exam || !selectedClassId) return;

    if (!selectedClassId) {
      toast.error("Please select a class.");
      return;
    }

    setIsAssigning(true);
    try {
      await examsApi.assignExamToClass(exam.id, selectedClassId);
      toast.success(`Exam assigned to ${selectedClass?.name ?? "class"}.`);
      onOpenChange(false);
      onSuccess?.(selectedClassId);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr?.message ?? "Failed to assign exam. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Exam to Class</DialogTitle>
          <DialogDescription>
            Select a class and schedule date to assign this exam.
            {exam && (
              <span className="block mt-1 font-medium text-foreground">
                Exam: {exam.title}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Active Classes</Label>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading classes…
              </div>
            ) : (
              <RadioGroup
                value={selectedClassId ?? ""}
                onValueChange={(v) => setSelectedClassId(v)}
                className="grid gap-2"
              >
                {activeClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No active classes available.
                  </p>
                ) : (
                  activeClasses.map((cls) => (
                    <label
                      key={cls.id}
                      htmlFor={`class-${cls.id}`}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                        "hover:border-primary/50 hover:bg-muted/50",
                        selectedClassId === cls.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-card",
                      )}
                    >
                      <RadioGroupItem value={cls.id} id={`class-${cls.id}`} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{cls.name}</span>
                          <LevelBadge level={cls.level} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {cls.studentCount ?? 0} students
                          </span>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </RadioGroup>
            )}
          </div>

          {selectedClassId && (
            <div className="space-y-2">
              <Label htmlFor="assign-scheduled">Scheduled Date</Label>
              <Input
                id="assign-scheduled"
                type="date"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-[11px] text-muted-foreground">
                Schedule date is stored locally until backend scheduling is available.
              </p>
            </div>
          )}

          {selectedClass && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Assignment Preview
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{selectedClass.name}</span>
                <LevelBadge level={selectedClass.level} />
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedClass.studentCount ?? 0} students &bull; Scheduled: {scheduledAt || "—"}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Cancel
          </Button>
          <Button disabled={!canAssign} onClick={handleAssign}>
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning…
              </>
            ) : (
              "Assign to Class"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
