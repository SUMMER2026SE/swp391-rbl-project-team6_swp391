import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getStudentsByClass } from "@/data/teacher-data";
import { LevelBadge } from "@/components/teacher/badges";
import { PreviewSheet, InviteStudentsDialog, ConfirmDialog } from "@/components/teacher/dialogs";
import { Search, UserPlus, Mail, Send, Trash2, MoreVertical, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/classes/$classId/students")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { classId } = Route.useParams();
  const { q: urlQ } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const students = getStudentsByClass(classId);
  const [tab, setTab] = useState<"active" | "invited">("active");
  const [open, setOpen] = useState<string | null>(null);
  const [invite, setInvite] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const active = students.filter((s) => s.status !== "invited");
  const invited = students.filter((s) => s.status === "invited");
  const list = (tab === "active" ? active : invited).filter((s) =>
    !urlQ || s.name.toLowerCase().includes(urlQ.toLowerCase()) || s.email.toLowerCase().includes(urlQ.toLowerCase()),
  );
  const selected = students.find((s) => s.id === open);

  const handlePageSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate({ search: { q: e.target.value || undefined } });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search student…"
            value={urlQ}
            onChange={handlePageSearchChange}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-md border bg-card p-0.5">
          <Button
            size="sm"
            variant={tab === "active" ? "default" : "ghost"}
            onClick={() => setTab("active")}
          >
            Active ({active.length})
          </Button>
          <Button
            size="sm"
            variant={tab === "invited" ? "default" : "ghost"}
            onClick={() => setTab("invited")}
          >
            Pending ({invited.length})
          </Button>
        </div>
        <Button onClick={() => setInvite(true)} className="ml-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite students
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No students in this view.
            </div>
          ) : (
            <ul className="divide-y">
              {list.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={s.avatar} />
                    <AvatarFallback>{s.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <button
                      onClick={() => setOpen(s.id)}
                      className="truncate text-left font-medium hover:text-primary"
                    >
                      {s.name}
                    </button>
                    <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Progress
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={s.progress} className="h-1 w-20" />
                      <span className="text-xs font-medium">{s.progress}%</span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    {s.status === "invited" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-[11px] font-medium text-info">
                        Invited
                      </span>
                    ) : s.status === "at-risk" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        At risk
                      </span>
                    ) : (
                      <LevelBadge level={s.level} />
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setOpen(s.id)}>
                        Open profile
                      </DropdownMenuItem>
                      {s.status === "invited" ? (
                        <>
                          <DropdownMenuItem onSelect={() => toast.success("Invitation resent")}>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend invitation
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setRemoving(s.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove invitation
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onSelect={() => toast.success(`Reminder sent to ${s.name}`)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setRemoving(s.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove student
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <PreviewSheet
        open={!!selected}
        onOpenChange={(o) => !o && setOpen(null)}
        title={selected?.name ?? ""}
        description={selected?.email}
      >
        {selected && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <LevelBadge level={selected.level} />
                  <span className="text-xs text-muted-foreground">
                    Last active {selected.lastActive}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Progress</div>
                    <div className="text-lg font-bold">{selected.progress}%</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Avg score</div>
                    <div className="text-lg font-bold">{selected.averageScore}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Attendance</div>
                    <div className="text-lg font-bold">{selected.attendance}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Weak skill</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{selected.weakSkill}</CardContent>
            </Card>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  toast.success(`Reminder sent to ${selected.name}`);
                  setOpen(null);
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Send reminder
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRemoving(selected.id);
                  setOpen(null);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </PreviewSheet>

      <InviteStudentsDialog open={invite} onOpenChange={setInvite} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove from class?"
        description="This action removes the student from this class. You can re-invite later."
        confirmLabel="Remove"
        destructive
        onConfirm={() => toast.success("Student removed")}
      />
    </div>
  );
}
