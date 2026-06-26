import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getClasses, getProgressByClass, getProgressOverview } from "@/data/teacher-data";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { PreviewSheet, EmptyState } from "@/components/teacher/dialogs";
import {
  Search,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Download,
  Send,
  Star,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { JLPTLevel, Student } from "@/data/teacher-data";

export const Route = createFileRoute("/teacher/progress")({
  component: TeacherProgressPage,
});

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

function OverviewCards({
  avgProgress,
  activeClasses,
  totalStudents,
  atRisk,
}: {
  avgProgress: number;
  activeClasses: number;
  totalStudents: number;
  atRisk: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgProgress}%</p>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-info/10">
              <svg
                className="h-5 w-5 text-info"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{activeClasses}</p>
              <p className="text-xs text-muted-foreground">Active Classes</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-success/10">
              <svg
                className="h-5 w-5 text-success"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atRisk}</p>
              <p className="text-xs text-muted-foreground">At-Risk Students</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentRow({ student, onPreview }: { student: Student; onPreview: (s: Student) => void }) {
  const initials = student.name
    .split(" ")
    .map((p) => p[0])
    .join("");
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
      <Avatar className="h-9 w-9">
        <AvatarImage src={student.avatar} alt={student.name} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{student.name}</p>
          <LevelBadge level={student.level} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{student.email}</p>
      </div>
      <div className="hidden text-right text-xs text-muted-foreground sm:block">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {student.lastActive}
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={() => onPreview(student)}>
        View
      </Button>
    </div>
  );
}

function StudentPreviewSheet({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  if (!student) return null;
  const initials = student.name
    .split(" ")
    .map((p) => p[0])
    .join("");
  return (
    <PreviewSheet
      open={open}
      onOpenChange={onOpenChange}
      title={student.name}
      description={`${student.level} Student`}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={student.avatar} alt={student.name} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{student.name}</p>
          <p className="text-sm text-muted-foreground">{student.email}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <LevelBadge level={student.level} />
            <StatusBadge status={student.status} />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{student.progress}%</span>
          </div>
          <Progress value={student.progress} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Attendance</p>
            <p className="text-lg font-semibold">{student.attendance}%</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Avg Score</p>
            <p className="text-lg font-semibold">{student.averageScore}</p>
          </div>
        </div>
        {student.weakSkill && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
            <p className="text-xs text-muted-foreground">Needs Improvement</p>
            <p className="text-sm font-medium">{student.weakSkill}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Button className="flex-1" size="sm">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Message
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            View Reports
          </Button>
        </div>
      </div>
    </PreviewSheet>
  );
}

// Inline MessageSquare since not imported above
function MessageSquare({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ClassDetailView({ classId, onBack }: { classId: string; onBack: () => void }) {
  const data = getProgressByClass(classId);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"progress" | "name" | "score">("progress");

  if (!data) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back to Overview
        </Button>
        <EmptyState
          icon={AlertTriangle}
          title="Class not found"
          description="This class may have been removed."
        />
      </div>
    );
  }

  const {
    class: cls,
    averageProgress,
    homeworkCompletion,
    examAverage,
    skills,
    students,
    atRisk,
  } = data;
  const skillEntries = Object.entries(skills) as [string, number][];

  const sortedStudents = [...students].sort((a, b) => {
    if (sortBy === "progress") return b.progress - a.progress;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return b.averageScore - a.averageScore;
  });

  const topStudents = sortedStudents.slice(0, 5);

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Back to Overview
      </Button>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl font-bold">{cls.name}</h2>
          <LevelBadge level={cls.level} />
          <StatusBadge status={cls.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{cls.schedule}</p>
      </div>

      {/* Class overview cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Class Progress</p>
            <p className="mt-1 text-2xl font-bold">{cls.progress}%</p>
            <Progress value={cls.progress} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Homework Completion</p>
            <p className="mt-1 text-2xl font-bold">{homeworkCompletion}%</p>
            <Progress value={homeworkCompletion} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Exam Average</p>
            <p className="mt-1 text-2xl font-bold">{examAverage}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-warning text-warning" />
              Score
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Students</p>
            <p className="mt-1 text-2xl font-bold">{students.length}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {cls.capacity - students.length} slots available
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Skill breakdown */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold">Skill Breakdown</h3>
            <div className="space-y-3">
              {skillEntries.map(([skill, value]) => (
                <div key={skill}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{skill}</span>
                    <span className="font-medium">{value}%</span>
                  </div>
                  <Progress value={value} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student ranking */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Student Ranking</h3>
              <div className="flex gap-1">
                {(["progress", "name", "score"] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={sortBy === s ? "default" : "outline"}
                    onClick={() => setSortBy(s)}
                    className="text-xs"
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {topStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                  onClick={() => {
                    setPreviewStudent(s);
                    setPreviewOpen(true);
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={s.avatar} alt={s.name} />
                    <AvatarFallback className="text-xs">
                      {s.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <div className="flex items-center gap-1.5">
                      <LevelBadge level={s.level} />
                      <span className="text-xs text-muted-foreground">
                        #{topStudents.indexOf(s) + 1}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{s.progress}%</p>
                    <p className="text-xs text-muted-foreground">Score: {s.averageScore}</p>
                  </div>
                </div>
              ))}
            </div>
            {students.length > 5 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                + {students.length - 5} more students
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* At-risk section */}
      {atRisk.length > 0 && (
        <Card className="mt-6 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold">Students Needing Attention ({atRisk.length})</h3>
            </div>
            <div className="space-y-2">
              {atRisk.slice(0, 3).map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  onPreview={(st) => {
                    setPreviewStudent(st);
                    setPreviewOpen(true);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <StudentPreviewSheet
        student={previewStudent}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

function BrowseAllSection({
  classes,
  onSelectClass,
}: {
  classes: ReturnType<typeof getClasses>;
  onSelectClass: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<JLPTLevel | "All">("All");

  const filtered = classes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) || c.jpName.includes(search);
    const matchesLevel = levelFilter === "All" || c.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="mt-8">
      <h2 className="mb-4 font-display text-xl font-bold">Browse All Classes</h2>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search classes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={levelFilter === "All" ? "default" : "outline"}
            onClick={() => setLevelFilter("All")}
          >
            All
          </Button>
          {LEVELS.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={levelFilter === l ? "default" : "outline"}
              onClick={() => setLevelFilter(l)}
            >
              {l}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cls) => (
          <Card
            key={cls.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => onSelectClass(cls.id)}
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{cls.name}</h3>
                  <p className="text-xs text-muted-foreground">{cls.jpName}</p>
                </div>
                <LevelBadge level={cls.level} />
              </div>
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{cls.progress}%</span>
                </div>
                <Progress value={cls.progress} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {cls.studentCount} / {cls.capacity} students
                </span>
                <div className="flex items-center gap-1">
                  <StatusBadge status={cls.status} />
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No classes match your search.
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherProgressPage() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const overview = getProgressOverview();
  const allClasses = getClasses();

  if (selectedClass) {
    return (
      <div>
        <ClassDetailView classId={selectedClass} onBack={() => setSelectedClass(null)} />
      </div>
    );
  }

  const activeClasses = allClasses.filter((c) => c.status === "Active");
  const topPerforming = [...activeClasses].sort((a, b) => b.progress - a.progress).slice(0, 4);
  const needsAttention = activeClasses
    .filter((c) => c.attention > 0)
    .sort((a, b) => b.attention - a.attention)
    .slice(0, 4);
  const recentlyActive = [...activeClasses]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="Progress Overview"
        subtitle="Track student performance and class progress"
      />

      <OverviewCards
        avgProgress={overview.averageProgress}
        activeClasses={overview.classesActive}
        totalStudents={overview.totalStudents}
        atRisk={overview.atRisk}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Top Performing */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <h2 className="font-semibold">Top Performing</h2>
          </div>
          <div className="space-y-2">
            {topPerforming.map((cls) => (
              <Card
                key={cls.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedClass(cls.id)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{cls.name}</p>
                      <LevelBadge level={cls.level} />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress value={cls.progress} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium">{cls.progress}%</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold">Needs Attention</h2>
          </div>
          {needsAttention.length > 0 ? (
            <div className="space-y-2">
              {needsAttention.map((cls) => (
                <Card
                  key={cls.id}
                  className="cursor-pointer border-destructive/30 transition-shadow hover:shadow-md"
                  onClick={() => setSelectedClass(cls.id)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{cls.name}</p>
                        <LevelBadge level={cls.level} />
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={cls.progress} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-destructive">
                          {cls.attention} alert{cls.attention > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No classes need attention right now.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recently Active */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-info" />
            <h2 className="font-semibold">Recently Active</h2>
          </div>
          <div className="space-y-2">
            {recentlyActive.map((cls) => (
              <Card
                key={cls.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedClass(cls.id)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{cls.name}</p>
                      <LevelBadge level={cls.level} />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{cls.studentCount} students</span>
                      <span>·</span>
                      <span>Started {cls.startDate}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BrowseAllSection classes={allClasses} onSelectClass={setSelectedClass} />
    </div>
  );
}
