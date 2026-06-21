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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Calendar, Users } from "lucide-react";
import { getClasses, type Exam, type ClassItem } from "@/data/teacher-data";
import { LevelBadge } from "@/components/teacher/badges";
import { cn } from "@/lib/utils";

interface ExamAssignDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exam: Exam | null;
  onAssign: (classId: string, scheduledAt: string) => void;
}

export function ExamAssignDialog({
  open,
  onOpenChange,
  exam,
  onAssign,
}: ExamAssignDialogProps) {
  const allClasses = getClasses();
  const activeClasses = allClasses.filter((c) => c.status === "Active");

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedClassId(null);
      setScheduledAt("");
    }
  }, [open]);

  const selectedClass = allClasses.find((c) => c.id === selectedClassId) ?? null;

  const canAssign = selectedClassId && scheduledAt;

  const handleAssign = () => {
    if (!selectedClassId || !scheduledAt) return;

    const cls = allClasses.find((c) => c.id === selectedClassId);
    const className = cls?.name ?? selectedClassId;

    onAssign(selectedClassId, scheduledAt);
    toast.success(`Exam assigned to ${className}`);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
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
                        : "border-border bg-card"
                    )}
                  >
                    <RadioGroupItem
                      value={cls.id}
                      id={`class-${cls.id}`}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{cls.name}</span>
                        <LevelBadge level={cls.level} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cls.studentCount} students
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {cls.schedule}
                        </span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </RadioGroup>
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
                {selectedClass.studentCount} students &bull; Scheduled:{" "}
                {scheduledAt || "—"}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={!canAssign} onClick={handleAssign}>
            Assign to Class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
