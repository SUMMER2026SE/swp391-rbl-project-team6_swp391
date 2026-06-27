import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Send, AlertCircle, User, BookOpen, Hash, Clock, X } from "lucide-react";

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
  className,
  classLevel,
  teacherName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  className?: string;
  classLevel?: string;
  teacherName?: string;
}) {
  const [emailsInput, setEmailsInput] = useState("");
  const [optionalMessage, setOptionalMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { valid, invalid } = useMemo(() => parseEmails(emailsInput), [emailsInput]);

  const canSend = valid.length > 0 && invalid.length === 0;

  const handleSend = async () => {
    if (!canSend) return;

    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);

    const classDisplay = className ?? "this class";
    const levelDisplay = classLevel ? ` ${classLevel}` : "";

    if (valid.length === 1) {
      toast.success(`Invitation sent to ${valid[0]} for${levelDisplay} ${classDisplay}.`);
    } else {
      toast.success(`Invitations sent to ${valid.length} students for${levelDisplay} ${classDisplay}.`);
    }

    setEmailsInput("");
    setOptionalMessage("");
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const displayClassName = className ?? "the class";
  const displayLevel = classLevel ?? "N5";
  const displayTeacher = teacherName ?? "Your teacher";
  const previewSubject = `You're invited to join ${displayClassName} on MIDORI`;
  const previewBody = optionalMessage
    ? `Hello,\n\n${displayTeacher} has invited you to join the class "${displayClassName}" on MIDORI.\n\nClass level: ${displayLevel}\nYou can accept this invitation to access lessons, homework, exams, and progress tracking for this class.\n\nTeacher message:\n"${optionalMessage}"\n\nClick the invitation link to join the class.\n\nBest regards,\nMIDORI Team`
    : `Hello,\n\n${displayTeacher} has invited you to join the class "${displayClassName}" on MIDORI.\n\nClass level: ${displayLevel}\nYou can accept this invitation to access lessons, homework, exams, and progress tracking for this class.\n\nClick the invitation link to join the class.\n\nBest regards,\nMIDORI Team`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Invite Students
          </DialogTitle>
          <DialogDescription>
            Add students to {displayClassName} by email. They'll receive an invitation link.
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
                Please fix invalid email addresses before sending invitations.
              </div>
              <div className="text-xs text-destructive/80 space-y-0.5">
                {invalid.map((email, i) => (
                  <p key={i}>• {email}</p>
                ))}
              </div>
            </div>
          )}

          {/* Optional message */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-message">Optional message</Label>
            <Textarea
              id="invite-message"
              rows={2}
              placeholder="Write a short message for your students..."
              value={optionalMessage}
              onChange={(e) => setOptionalMessage(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Invitation preview */}
          <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Invitation Preview
              </p>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span>Sender:</span>
                </div>
                <div className="font-medium text-foreground truncate">{displayTeacher} / Teacher</div>

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
                  <Clock className="w-3.5 h-3.5" />
                  <span>Invited:</span>
                </div>
                <div className="font-medium text-foreground">
                  {valid.length > 0 ? `${valid.length} student${valid.length !== 1 ? "s" : ""}` : "—"}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Subject */}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Subject:</p>
                <p className="font-medium text-foreground leading-snug">{previewSubject}</p>
              </div>

              {/* Body */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Body:</p>
                <div className="rounded-lg bg-background/80 border border-border p-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {previewBody}
                </div>
              </div>
            </div>
          </div>

          {/* Recipients summary */}
          {valid.length > 0 && invalid.length === 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{valid.length}</span> student{valid.length !== 1 ? "s" : ""} will receive this invitation
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={!canSend || sending}
            onClick={handleSend}
          >
            {sending ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send invites
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
