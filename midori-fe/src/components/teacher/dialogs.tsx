import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, BookOpen, Hash, X, UserPlus } from "lucide-react";
import { classesApi } from "@/lib/api/classes";
import { ApiError } from "@/lib/api/client";

function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
}

function parseEmails(input: string): { valid: string[]; invalid: string[] } {
  const parts = input.split(",").map((e) => e.trim()).filter(Boolean);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of parts) {
    const lower = email.toLowerCase();
    if (isValidEmail(email)) {
      if (!seen.has(lower)) {
        seen.add(lower);
        valid.push(email.trim());
      }
    } else {
      invalid.push(email);
    }
  }
  return { valid, invalid };
}

export function InviteStudentsDialog({
  open,
  onOpenChange,
  classId,
  className,
  classLevel,
  teacherName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Required: the class to invite students into. */
  classId?: string;
  className?: string;
  classLevel?: string;
  teacherName?: string;
}) {
  const queryClient = useQueryClient();
  const [emailsInput, setEmailsInput] = useState("");
  const [sending, setSending] = useState(false);

  const { valid, invalid } = useMemo(() => parseEmails(emailsInput), [emailsInput]);

  const canSend = valid.length > 0 && invalid.length === 0 && !!classId;

  const invalidateClassQueries = (id: string) => {
    // Teacher-side: refresh the screens that show this class's students
    void queryClient.invalidateQueries({ queryKey: ["classStudents", id] });
    void queryClient.invalidateQueries({ queryKey: ["teacherClassDetail", id] });
    void queryClient.invalidateQueries({ queryKey: ["teacherAllClasses"] });
    // Student-side: when the newly-added student opens their dashboard /
    // classes list, they should already see the class. Invalidate any
    // currently-mounted student queries too (no-op if not mounted).
    void queryClient.invalidateQueries({ queryKey: ["studentJoinedClassesDashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["studentJoinedClasses"] });
  };

  const handleSend = async () => {
    if (!canSend) {
      if (!classId) {
        toast.error("Cannot add students: no class selected.");
      } else if (valid.length === 0) {
        toast.error("Please enter at least one valid email.");
      } else if (invalid.length > 0) {
        toast.error("Please fix invalid email addresses before adding.");
      }
      return;
    }

    setSending(true);
    let successCount = 0;
    const failed: { email: string; message: string }[] = [];

    for (const email of valid) {
      try {
        await classesApi.inviteStudent(classId!, email);
        successCount += 1;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Unknown error";
        failed.push({ email, message });
      }
    }

    setSending(false);

    if (failed.length === 0) {
      const levelDisplay = classLevel ? ` ${classLevel}` : "";
      const classDisplay = className ?? "this class";
      if (successCount === 1) {
        toast.success(`Added ${valid[0]} to${levelDisplay} ${classDisplay}.`);
      } else {
        toast.success(
          `Added ${successCount} students to${levelDisplay} ${classDisplay}.`,
        );
      }
      invalidateClassQueries(classId!);
      setEmailsInput("");
      onOpenChange(false);
      return;
    }

    // Partial or total failure
    if (successCount > 0) {
      invalidateClassQueries(classId!);
      toast.warning(
        `${successCount} student${successCount === 1 ? "" : "s"} added, ${failed.length} failed.`,
      );
    }
    for (const f of failed) {
      toast.error(`${f.email}: ${f.message}`);
    }
  };

  const handleClose = () => {
    if (sending) return;
    onOpenChange(false);
  };

  const displayClassName = className ?? "the class";
  const displayLevel = classLevel ?? "N5";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Students
          </DialogTitle>
          <DialogDescription>
            Add students to {displayClassName} by email. They will be enrolled immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-emails">Student emails</Label>
            <Textarea
              id="invite-emails"
              rows={3}
              placeholder="hiroshi@example.com, yuki@example.com"
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple emails with commas.
            </p>
          </div>

          {/* Invalid emails warning */}
          {invalid.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="w-4 h-4" />
                Please fix invalid email addresses before adding students.
              </div>
              <div className="text-xs text-destructive/80 space-y-0.5">
                {invalid.map((email, i) => (
                  <p key={i}>• {email}</p>
                ))}
              </div>
            </div>
          )}

          {/* No class context warning */}
          {!classId && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="w-4 h-4" />
                No class selected. Please open this dialog from a class page.
              </div>
            </div>
          )}

          {/* Summary of who's being added */}
          <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-2 text-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Summary
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Class:</span>
              </div>
              <div className="font-medium text-foreground truncate">{displayClassName}</div>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="w-3.5 h-3.5" />
                <span>Level:</span>
              </div>
              <div className="font-medium text-foreground">{displayLevel}</div>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Will be added:</span>
              </div>
              <div className="font-medium text-foreground">
                {valid.length > 0 ? `${valid.length} student${valid.length !== 1 ? "s" : ""}` : "—"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Students will be enrolled immediately and will see the class on their dashboard. No email is sent.
            </p>
          </div>

          {/* Recipients summary */}
          {valid.length > 0 && invalid.length === 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{valid.length}</span> student{valid.length !== 1 ? "s" : ""} will be added to this class
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            disabled={!canSend || sending}
            onClick={handleSend}
          >
            {sending ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add students
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PreviewSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-4 space-y-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SuccessBanner({
  title,
  children,
  onDismiss,
}: {
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
        &#10003;
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-success">{title}</div>
        {children && <div className="mt-0.5 text-sm text-muted-foreground">{children}</div>}
      </div>
      {onDismiss && (
        <Button size="icon" variant="ghost" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function ChipInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 rounded-md border bg-background p-2">
        {value.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
              e.preventDefault();
              onChange([...value, draft.trim()]);
              setDraft("");
            }
          }}
        />
        {draft && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange([...value, draft.trim()]);
              setDraft("");
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
