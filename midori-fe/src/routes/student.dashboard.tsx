import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Card, StatCard, LevelBadge, Progress } from "@/components/page-ui";
import { Flame, Sparkles, Trophy, Clock, ArrowRight, Loader2, School, ClipboardList, BookOpen, Brain, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { studentProgressApi } from "@/lib/api/studentProgress";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/student/dashboard")({ component: StudentHome });

function StudentHome() {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["progress-stats"],
    queryFn: () => studentProgressApi.getProgressStats(),
    staleTime: 60 * 1000,
  });

  const errorMessage = error instanceof ApiError ? error.message : "Failed to load dashboard progress.";

  const streak = stats?.learningStreak ?? 32;
  const totalXp = stats?.progressPercent ? Math.round(stats.progressPercent * 100) : 9820;

  // Mock data for new features requested by user
  const joinedClasses = [
    { name: "Japanese Basic N5 - Class A", teacher: "Kenji Sensei", level: "N5" },
    { name: "Elementary Kanji & Vocab - Class B", teacher: "Sakura Sensei", level: "N5" }
  ];

  const upcomingDeadlines = [
    { name: "Vocabulary Quiz Lesson 4", type: "Quiz", remainingDays: 2 },
    { name: "Grammar Particle Practice", type: "Homework", remainingDays: 5 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        subtitle="Manage your learning modules, class homework, and keep your daily streak alive!"
      />

      {/* Row 1: Welcome Banner & XP/Streak Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="bg-gradient-hero p-6 text-white border-none h-full relative overflow-hidden flex flex-col justify-center min-h-[160px]">
            <div className="relative z-10">
              <span className="text-[10px] uppercase opacity-70 tracking-widest font-semibold text-white/80">Welcome back</span>
              <h2 className="font-display font-black text-2xl mt-1 text-white">Xin chào {user?.name ?? "Nguyễn Văn A"}</h2>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm font-semibold opacity-90">Current Level:</span>
                <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-bold border border-white/20">
                  N5
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* XP and Streak */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Total XP"
            value={`${totalXp.toLocaleString()} XP`}
            hint="Keep studying to rank up"
            icon={<Sparkles className="w-5 h-5 text-amber-400" />}
            accent="primary"
          />
          <StatCard
            label="Daily Streak"
            value={`${streak} days`}
            hint="Don't break the streak!"
            icon={<Flame className="w-5 h-5 text-orange-400" />}
            accent="sakura"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="text-center py-8 px-4">
          <p className="text-red-500 mb-2 font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Row 2: Joined Classes & Assignment Summary */}
      {!isLoading && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Joined Classes */}
          <Card className="p-5">
            <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
              <School className="w-4.5 h-4.5 text-primary" />
              Joined Classes
            </h3>
            <div className="space-y-3">
              {joinedClasses.map((cls, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{cls.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Teacher: {cls.teacher}</div>
                  </div>
                  <LevelBadge level={cls.level} />
                </div>
              ))}
            </div>
          </Card>

          {/* Assignment Summary */}
          <Card className="p-5">
            <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-primary" />
              Assignment Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Not Started", value: 2, color: "text-red-500 bg-red-50 dark:bg-red-950/20" },
                { label: "In Progress", value: 1, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                { label: "Submitted", value: 3, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                { label: "Graded", value: 4, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
              ].map((stat, i) => (
                <div key={i} className={`rounded-xl p-3 text-center ${stat.color} flex flex-col justify-center`}>
                  <div className="text-xl font-black">{stat.value}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Row 3: Upcoming Deadlines & Learning Progress */}
      {!isLoading && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Upcoming Deadlines */}
          <div className="md:col-span-1">
            <Card className="p-5 h-full">
              <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-primary" />
                Upcoming Deadlines
              </h3>
              <div className="space-y-3">
                {upcomingDeadlines.map((dl, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-semibold text-sm text-foreground truncate">{dl.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{dl.type}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      dl.remainingDays <= 2 
                        ? "bg-red-500/10 text-red-500" 
                        : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                    }`}>
                      {dl.remainingDays}d left
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Learning Progress */}
          <div className="md:col-span-2">
            <Card className="p-5 h-full">
              <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-primary" />
                Learning Progress
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: "Vocabulary", val: stats?.progressPercent ? Math.round(stats.progressPercent) : 75, count: `${stats?.learnedWords ?? 0} learned` },
                  { name: "Grammar", val: stats?.grammarCompleted ? Math.round((stats.grammarCompleted / 100) * 100) : 60, count: `${stats?.completedLessons ?? 0} completed` },
                  { name: "Listening", val: 45, count: "12 exercises done" },
                  { name: "Shadowing", val: 35, count: "5 sessions passed" },
                  { name: "Writing", val: 20, count: "2 essays submitted" },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/50 bg-card hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm text-foreground">{item.name}</span>
                      <span className="text-xs font-bold text-primary">{item.val}%</span>
                    </div>
                    <div className="mb-2">
                      <Progress value={item.val} />
                    </div>
                    <div className="text-[11px] text-muted-foreground">{item.count}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
