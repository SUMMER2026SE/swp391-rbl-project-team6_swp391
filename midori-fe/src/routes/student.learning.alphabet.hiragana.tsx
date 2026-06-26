import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { ChevronRight, ChevronLeft, Trophy, Target } from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { useRouterState } from "@tanstack/react-router";
import { HIRAGANA_LESSONS } from "@/mock/alphabet";
import { loadLessonProgress } from "@/mock/alphabet/progress";

export const Route = createFileRoute("/student/learning/alphabet/hiragana")({
  component: HiraganaOverviewPage,
});

function HiraganaOverviewPage() {
  const routerState = useRouterState();
  const isChildRouteActive =
    routerState.location.pathname !== "/student/learning/alphabet/hiragana";

  const getLessonProgress = (lessonId: string) => {
    return loadLessonProgress(lessonId);
  };

  if (isChildRouteActive) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back button */}
          <Link
            to="/student/learning/alphabet"
            className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Alphabet
          </Link>

          <PageHeader title="Hiragana" subtitle="Learn the fundamental Japanese character set" />

          {/* Hiragana lessons */}
          <div className="grid md:grid-cols-1 gap-4">
            {HIRAGANA_LESSONS.map((lesson, index) => {
              const progress = getLessonProgress(lesson.id);
              return (
                <Link key={lesson.id} to={lesson.path} className="group block">
                  <Card
                    className={cn(
                      "p-6 h-full transition-all duration-200",
                      "hover:shadow-xl hover:-translate-y-1",
                      progress.completed
                        ? "border-green-300 dark:border-green-500/30"
                        : "border-slate-200 dark:border-white/10",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-2xl bg-linear-to-br flex items-center justify-center text-3xl font-bold text-white shadow-lg",
                          lesson.color,
                        )}
                      >
                        {lesson.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground font-medium">
                            Lesson {index + 1}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              lesson.difficulty === 1
                                ? "text-green-500 bg-green-500/10 border-green-500/20"
                                : lesson.difficulty === 2
                                  ? "text-blue-500 bg-blue-500/10 border-blue-500/20"
                                  : "text-amber-500 bg-amber-500/10 border-amber-500/20",
                            )}
                          >
                            Level {lesson.difficulty}
                          </span>
                          {progress.completed && <Trophy className="w-4 h-4 text-amber-500" />}
                        </div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                          {lesson.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{lesson.subtitle}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Target className="w-3 h-3" />
                            {lesson.totalCharacters} characters
                          </span>
                          {progress.attempts > 0 && (
                            <span className="text-xs font-medium text-muted-foreground">
                              Best: {progress.score}%
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
