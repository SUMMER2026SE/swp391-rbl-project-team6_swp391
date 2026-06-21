import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClasses } from "@/data/teacher-data";
import { LevelBadge } from "@/components/teacher/badges";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Users, BookOpenCheck, TrendingUp, Calendar, Edit, UserPlus, Archive, TrendingUp as TgIcon, MoreVertical, ArrowRight } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { InviteStudentsDialog } from "@/components/teacher/dialogs";
import { cn } from "@/lib/utils";

const LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"] as const;
const STATUSES = ["All", "Draft", "Active", "Archived"] as const;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; dot: string; text: string }> = {
    Active:   { label: "Active",   dot: "bg-[var(--status-active)]",   text: "text-[var(--status-active)]" },
    Draft:    { label: "Draft",    dot: "bg-[var(--status-pending)]", text: "text-[var(--status-pending)]" },
    Archived: { label: "Archived", dot: "bg-gray-400",                text: "text-gray-400" },
    Upcoming: { label: "Upcoming", dot: "bg-[var(--status-pending)]", text: "text-[var(--status-pending)]" },
  };
  const c = map[status] ?? { label: status, dot: "bg-muted", text: "text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider", c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export const Route = createFileRoute("/teacher/classes")({
  head: () => ({ meta: [{ title: "My Classes — MIDORI Teacher" }] }),
  component: ClassesLayout,
});

function ClassesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/teacher/classes") {
    return <Outlet />;
  }

  const [q, setQ] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [inviteFor, setInviteFor] = useState<string | null>(null);

  const all = getClasses();

  const filtered = useMemo(() => {
    return all.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(q.toLowerCase());
      const matchLevel = levelFilter === "All" || c.level === levelFilter;
      const matchStatus = statusFilter === "All" || c.status === statusFilter;
      return matchSearch && matchLevel && matchStatus;
    });
  }, [all, q, levelFilter, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Classroom"
        title="My Classes"
        subtitle="All your active and upcoming Japanese language classes."
        actions={<Button asChild><Link to="/teacher/classes/create"><Plus className="mr-2 h-4 w-4" />New class</Link></Button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search class..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((lv) => (
            <Button key={lv} size="sm" variant={levelFilter === lv ? "default" : "outline"} onClick={() => setLevelFilter(lv)}>{lv}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>{s}</Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No classes match your filters.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="group overflow-hidden border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
              <div className="h-1.5 bg-gradient-to-r from-primary via-success to-info" />
              <CardContent className="p-5">
                <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <LevelBadge level={c.level} />
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="truncate font-display text-lg font-semibold">{c.name}</div>
                    <div className="font-jp text-xs text-muted-foreground">{c.jpName}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link to="/teacher/classes/$classId" params={{ classId: c.id }}><Edit className="mr-2 h-4 w-4" />Edit class</Link></DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setInviteFor(c.id)}><UserPlus className="mr-2 h-4 w-4" />Invite students</DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/teacher/classes/$classId/progress" params={{ classId: c.id }}><TgIcon className="mr-2 h-4 w-4" />View progress</Link></DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toast.success(`${c.name} archived`)}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{c.schedule}</span>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><Users className="h-3 w-3" />Students</div>
                    <div className="mt-0.5 text-sm font-bold">{c.studentCount}/{c.capacity}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><BookOpenCheck className="h-3 w-3" />Homework</div>
                    <div className="mt-0.5 text-sm font-bold">{c.openHomework}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><TrendingUp className="h-3 w-3" />Exams</div>
                    <div className="mt-0.5 text-sm font-bold">{c.upcomingExams}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Class progress</span>
                    <span className="font-semibold">{c.progress}%</span>
                  </div>
                  <Progress value={c.progress} className="h-2" />
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1"><Link to="/teacher/classes/$classId" params={{ classId: c.id }}>Open class<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
                  <Button variant="outline" onClick={() => setInviteFor(c.id)}><UserPlus className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InviteStudentsDialog open={!!inviteFor} onOpenChange={(o) => !o && setInviteFor(null)} className={all.find((c) => c.id === inviteFor)?.name} />
    </div>
  );
}
