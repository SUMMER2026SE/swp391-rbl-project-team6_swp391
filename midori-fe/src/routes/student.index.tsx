import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Flame, Sparkles, Trophy, Clock, ArrowRight, Loader2 } from "lucide-react";
import { leaderboard, weeklyXp } from "@/lib/mock-data";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { studentProgressApi } from "@/lib/api/studentProgress";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/student/")({ component: StudentHome });

function StudentHome() {
  const DAILY_GOAL_XP = 250;

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["progress-stats"],
    queryFn: () => studentProgressApi.getProgressStats(),
    staleTime: 60 * 1000,
  });

  const errorMessage = error instanceof ApiError ? error.message : "Failed to load dashboard progress.";

  const dailyGoalPercent = Math.min(100, Math.max(0, stats?.progressPercent ?? 0));
  const dailyGoalXp = Math.round((dailyGoalPercent / 100) * DAILY_GOAL_XP);
  const streak = stats?.learningStreak ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Good morning, Yuki"
        subtitle={isLoading ? "Loading your progress..." : error ? errorMessage : streak > 0 ? `Keep your ${streak}-day streak alive — finish today's lesson to earn +120 XP.` : "Start today's lesson to build your streak."}
      />

      {/* Stats */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Daily Goal", value: `${dailyGoalXp} / ${DAILY_GOAL_XP} XP`, hint: `${dailyGoalPercent}% complete`, icon: <Sparkles className="w-5 h-5 text-amber-400" />, accent: "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50" },
            { label: "Streak", value: `${streak} days`, hint: `Best: ${streak}`, icon: <Flame className="w-5 h-5 text-orange-400" />, accent: "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-amber-800/50" },
            { label: "Rank", value: "#4", hint: "Top 2% this week", icon: <Trophy className="w-5 h-5 text-pink-400" />, accent: "bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/50" },
            { label: "Today", value: "1h 42m", hint: "Study time", icon: <Clock className="w-5 h-5 text-blue-400" />, accent: "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50" },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl p-4 ${s.accent}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                {s.icon}
              </div>
              <div className="font-black text-xl text-foreground">{s.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.hint}</div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center py-12 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <Sparkles className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 mb-2 font-semibold">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Row 1: Continue learning + Leaderboard */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base text-foreground">Continue learning</h2>
            <Link to="/student/grammar" className="text-xs text-primary font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3"/>
            </Link>
          </div>

          {/* Hero banner */}
          <div className="rounded-2xl bg-gradient-hero p-6 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase opacity-70 tracking-widest font-semibold text-white/80">Start your lesson</div>
                <div className="font-display font-black text-xl mt-1 text-white">Choose a topic to begin</div>
                <div className="text-xs text-white/80 mt-0.5">Browse grammar, listening, or vocabulary</div>
              </div>
              <Link to="/student/grammar"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-primary font-bold text-xs shadow">
                Browse <ArrowRight className="w-3.5 h-3.5"/>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-foreground">Leaderboard</h2>
            <Link to="/student/leaderboard" className="text-[11px] text-primary font-semibold">See all</Link>
          </div>
          <div className="space-y-1.5">
            {leaderboard.slice(0, 5).map(p => (
              <div key={p.rank}
                className={`flex items-center gap-2.5 p-2 rounded-xl transition ${p.name === "You" ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                <div className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-black flex-shrink-0 ${
                  p.rank === 1 ? "bg-amber-400 text-white" :
                  p.rank === 2 ? "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200" :
                  p.rank === 3 ? "bg-orange-400 text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {p.rank}
                </div>
                <div className="w-7 h-7 rounded-full bg-sakura/60 text-jp-red grid place-items-center font-bold text-xs flex-shrink-0">
                  {p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.name === "You" ? `${streak}d streak` : `${p.streak}d streak`}</div>
                </div>
                <div className="text-sm font-black text-primary">{p.name === "You" ? `${dailyGoalXp.toLocaleString()}` : `${p.xp.toLocaleString()}`}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly XP */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-base text-foreground">Weekly XP</h2>
          <span className="text-xs font-semibold text-primary">1,780 XP this week</span>
        </div>
        <div className="w-full min-w-0">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyXp}>
              <defs>
                <linearGradient id="xpg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="oklch(0.62 0.18 270)"/>
                  <stop offset="100%" stopColor="oklch(0.75 0.18 340)"/>
                </linearGradient>
              </defs>
              <Tooltip contentStyle={{borderRadius: 12, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", backgroundColor: "var(--card)"}} />
              <Line type="monotone" dataKey="xp" stroke="url(#xpg)" strokeWidth={3}
                dot={{r: 4, fill: "white", strokeWidth: 2}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
