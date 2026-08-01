import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertCircle,
  BookOpen,
  Hash,
  X,
  UserPlus,
  Pencil,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Loader2,
  Trash2,
} from "lucide-react";
import { classesApi, UpdateClassRequest } from "@/lib/api/classes";
import { ApiError, isApiError } from "@/lib/api/client";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
}

function parseEmails(input: string): { valid: string[]; invalid: string[] } {
  const parts = input
    .split(/[,;\n\r\t]+/)
    .map((e) => e.trim())
    .filter(Boolean);
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
  classId?: string;
  className?: string;
  classLevel?: string;
  teacherName?: string;
}) {
  const queryClient = useQueryClient();
  
  // File Import States
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<any | null>(null);

  // Manual Entry States
  const [emailsInput, setEmailsInput] = useState("");
  const [manualSending, setManualSending] = useState(false);

  const { data: fetchedClass } = useQuery({
    queryKey: ["teacherClassDetail", classId],
    queryFn: () => classesApi.getClassById(classId!),
    enabled: !!classId && open && (!className || !classLevel),
  });

  const displayClassName = className ?? fetchedClass?.name ?? "the class";
  const displayLevel = classLevel ?? fetchedClass?.level ?? "";

  const { valid, invalid } = useMemo(() => parseEmails(emailsInput), [emailsInput]);
  const canSendManual = valid.length > 0 && invalid.length === 0 && !!classId;

  const invalidateClassQueries = (id: string) => {
    void queryClient.invalidateQueries({ queryKey: ["classStudents", id] });
    void queryClient.invalidateQueries({ queryKey: ["teacherClassDetail", id] });
    void queryClient.invalidateQueries({ queryKey: ["teacherAllClasses"] });
    void queryClient.invalidateQueries({ queryKey: ["studentJoinedClassesDashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["studentJoinedClasses"] });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const name = droppedFile.name.toLowerCase();
      if (name.endsWith(".csv") || name.endsWith(".xlsx")) {
        if (droppedFile.size > 5 * 1024 * 1024) {
          toast.error("File is too large. Max size is 5MB.");
          return;
        }
        setFile(droppedFile);
      } else {
        toast.error("Unsupported file format. Please upload .xlsx or .csv");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const name = selectedFile.name.toLowerCase();
      if (name.endsWith(".csv") || name.endsWith(".xlsx")) {
        if (selectedFile.size > 5 * 1024 * 1024) {
          toast.error("File is too large. Max size is 5MB.");
          return;
        }
        setFile(selectedFile);
      } else {
        toast.error("Unsupported file format. Please upload .xlsx or .csv");
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("midori_access_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api"}/teacher/classes/import/template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to download template");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
    } catch (err) {
      toast.error("Failed to download template");
    }
  };

  const handleImport = async () => {
    if (!file || !classId) return;

    setUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const response = await classesApi.importStudents(classId, file);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setResults(response.data || response);
        setUploading(false);
        invalidateClassQueries(classId);
        toast.success("Import completed successfully");
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      setUploading(false);
      setUploadProgress(0);
      const msg = isApiError(err) ? err.message : err.message || "Failed to import students";
      toast.error(msg);
    }
  };

  const handleManualSend = async () => {
    if (!canSendManual) return;

    setManualSending(true);
    let successCount = 0;
    const failed: { email: string; message: string }[] = [];

    for (const email of valid) {
      try {
        await classesApi.inviteStudent(classId!, email);
        successCount += 1;
      } catch (err) {
        const message =
          isApiError(err)
            ? err.message
            : err instanceof Error
              ? err.message
              : "Unknown error";
        failed.push({ email, message });
      }
    }

    setManualSending(false);

    if (failed.length === 0) {
      toast.success(`Added ${successCount} student(s) successfully.`);
      invalidateClassQueries(classId!);
      setEmailsInput("");
      onOpenChange(false);
      return;
    }

    if (successCount > 0) {
      invalidateClassQueries(classId!);
      toast.warning(`${successCount} student(s) added, ${failed.length} failed.`);
    }
    for (const f of failed) {
      toast.error(`${f.email}: ${f.message}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
    setUploadProgress(0);
    setUploading(false);
    setEmailsInput("");
  };

  const handleClose = () => {
    if (uploading || manualSending) return;
    onOpenChange(false);
    setTimeout(() => {
      handleReset();
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Students
          </DialogTitle>
          <DialogDescription>
            Add students to {displayClassName} ({displayLevel}) by email manually or by uploading Excel/CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 py-2">
          {!results ? (
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="manual">Add Manually</TabsTrigger>
                <TabsTrigger value="file">Import File</TabsTrigger>
              </TabsList>

              {/* Tab 1: Add Manually */}
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-emails">Student emails</Label>
                  <Textarea
                    id="invite-emails"
                    rows={4}
                    placeholder="hiroshi@example.com, yuki@example.com"
                    value={emailsInput}
                    onChange={(e) => setEmailsInput(e.target.value)}
                    className="resize-none"
                    disabled={manualSending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate emails with commas, newlines, or tabs.
                  </p>
                </div>

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
                    <div className="font-medium text-foreground">{displayLevel || "—"}</div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Will be added:</span>
                    </div>
                    <div className="font-medium text-foreground">
                      {valid.length > 0 ? `${valid.length} student${valid.length !== 1 ? "s" : ""}` : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={handleClose} disabled={manualSending}>
                    Cancel
                  </Button>
                  <Button disabled={!canSendManual || manualSending} onClick={handleManualSend}>
                    {manualSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add students
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Tab 2: Import File */}
              <TabsContent value="file" className="space-y-4">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : file
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="import-file-input"
                    className="hidden"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />

                  {file ? (
                    <div className="text-center space-y-2">
                      <FileSpreadsheet className="w-12 h-12 mx-auto text-emerald-500" />
                      <div>
                        <p className="font-semibold text-sm text-foreground truncate max-w-md">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        disabled={uploading}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        Remove file
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold">Drag & drop your file here, or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">Supports .xlsx and .csv files up to 5MB</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="cursor-pointer"
                        disabled={uploading}
                      >
                        <label htmlFor="import-file-input">Choose File</label>
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold">Need the file structure?</p>
                    <p className="text-[11px] text-muted-foreground">Download the Excel template with required fields.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    disabled={uploading}
                    className="h-8 gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Template
                  </Button>
                </div>

                {uploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Uploading and processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={handleClose} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button disabled={!file || uploading} onClick={handleImport}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Import
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            // Results Dashboard
            <div className="space-y-5">
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h3 className="font-semibold text-sm">Import Result</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    <div className="font-bold text-lg">{results.summary?.added ?? 0}</div>
                    <div className="text-[10px] uppercase font-semibold">Added</div>
                  </div>
                  <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400">
                    <div className="font-bold text-lg">{results.summary?.alreadyInClass ?? 0}</div>
                    <div className="text-[10px] uppercase font-semibold">In Class</div>
                  </div>
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
                    <div className="font-bold text-lg">{results.summary?.accountNotFound ?? 0}</div>
                    <div className="text-[10px] uppercase font-semibold">Not Found</div>
                  </div>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                    <div className="font-bold text-lg">{results.summary?.invalidEmail ?? 0}</div>
                    <div className="text-[10px] uppercase font-semibold">Invalid</div>
                  </div>
                  <div className="p-2 rounded bg-gray-500/10 border border-gray-500/20 text-gray-700 dark:text-gray-400">
                    <div className="font-bold text-lg">{results.summary?.duplicateInFile ?? 0}</div>
                    <div className="text-[10px] uppercase font-semibold">Duplicate</div>
                  </div>
                </div>
              </div>

              {/* View Details table */}
              <div className="space-y-1.5">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Detailed Report</h4>
                <div className="rounded-lg border max-h-[30vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.details?.length > 0 ? (
                        results.details.map((detail: any, idx: number) => {
                          let badgeStyle = "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
                          if (detail.status === "SUCCESS") {
                            badgeStyle = "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400";
                          } else if (detail.status === "ALREADY_IN_CLASS") {
                            badgeStyle = "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
                          } else if (detail.status === "ACCOUNT_NOT_FOUND") {
                            badgeStyle = "text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400";
                          } else if (detail.status === "INVALID_EMAIL") {
                            badgeStyle = "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
                          } else if (detail.status === "DUPLICATE_IN_FILE") {
                            badgeStyle = "text-neutral-700 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400";
                          }
                          return (
                            <TableRow key={idx}>
                              <TableCell className="font-medium text-xs">{detail.row}</TableCell>
                              <TableCell className="text-xs">{detail.email}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${badgeStyle}`}>
                                  {detail.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{detail.message}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                            No details reported.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {results && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
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

interface EditClassDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  classData: {
    id: string;
    name: string;
    level: string;
    maxStudents: number;
    studentCount: number;
  } | null;
}

export function EditClassDialog({ open, onOpenChange, classData }: EditClassDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [maxStudents, setMaxStudents] = useState<number>(30);
  const [nameError, setNameError] = useState<string>("");
  const [maxStudentsError, setMaxStudentsError] = useState<string>("");

  useEffect(() => {
    if (classData && open) {
      setName(classData.name);
      setMaxStudents(classData.maxStudents);
      setNameError("");
      setMaxStudentsError("");
    }
  }, [classData, open]);

  const minMaxStudents = classData?.studentCount ?? 0;

  const mutation = useMutation({
    mutationFn: (data: UpdateClassRequest) => {
      return classesApi.updateClass(classData!.id, data);
    },
    onSuccess: () => {
      toast.success("Class updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["teacherAllClasses"] });
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        isApiError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to update class.";
      toast.error(message);
    },
  });

  const handleSave = () => {
    let hasError = false;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Class name is required.");
      hasError = true;
    } else if (trimmedName.length > 100) {
      setNameError("Class name must not exceed 100 characters.");
      hasError = true;
    } else {
      setNameError("");
    }

    if (maxStudents < minMaxStudents) {
      setMaxStudentsError(
        `Maximum students must be at least ${minMaxStudents} (current enrolled students).`,
      );
      hasError = true;
    } else if (maxStudents > 100) {
      setMaxStudentsError("Maximum students cannot exceed 100.");
      hasError = true;
    } else {
      setMaxStudentsError("");
    }

    if (hasError) return;

    mutation.mutate({
      name: trimmedName,
      level: classData!.level,
      maxStudents,
    });
  };

  const isSaving = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Class
          </DialogTitle>
          <DialogDescription>Update the class name and maximum student capacity.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="class-name">
              Class Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="class-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="e.g. N5 Beginner"
              maxLength={100}
              aria-invalid={!!nameError}
            />
            <div className="flex justify-between">
              {nameError ? <p className="text-xs text-destructive">{nameError}</p> : <span />}
              <p className="text-xs text-muted-foreground">{name.length}/100</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max-students">
              Maximum Students <span className="text-destructive">*</span>
            </Label>
            <Input
              id="max-students"
              type="number"
              min={minMaxStudents}
              max={100}
              value={maxStudents}
              onChange={(e) => {
                setMaxStudents(parseInt(e.target.value, 10) || 0);
                if (maxStudentsError) setMaxStudentsError("");
              }}
              aria-invalid={!!maxStudentsError}
            />
            {maxStudentsError ? (
              <p className="text-xs text-destructive">{maxStudentsError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Current enrolled: {minMaxStudents} student{minMaxStudents !== 1 ? "s" : ""}.
                Minimum: {minMaxStudents}.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Level:</span>
              </div>
              <div className="font-medium text-foreground">{classData?.level ?? "—"}</div>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span>Enrolled:</span>
              </div>
              <div className="font-medium text-foreground">
                {minMaxStudents} student{minMaxStudents !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
