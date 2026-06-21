import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { ChevronRight, BookOpen, GraduationCap, Trophy, Target } from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { useRouterState } from "@tanstack/react-router";
import { ALPHABET_LESSONS, HIRAGANA_LESSONS, KATAKANA_LESSONS, type getLessonById } from "@/mock/alphabet";
import { loadLessonProgress } from "@/mock/alphabet/progress";

export const Route = createFileRoute("/student/learning/alphabet")({
  component: AlphabetOverviewPage,
});

function AlphabetOverviewPage() {
  const routerState = useRouterState();
  const isChildRouteActive = routerState.location.pathname !== "/student/learning/alphabet";

  // Get progress for each lesson
  const getLessonProgress = (lessonId: string) => {
    return loadLessonProgress(lessonId);
  };

  const alphabetCards = [
    {
      to: "/student/learning/alphabet/hiragana",
      title: "Hiragana",
      subtitle: "Basic Japanese Syllabary",
      description: "Learn the fundamental Japanese character set used for native Japanese words and grammatical elements.",
      icon: "あ",
      color: "from-pink-400 to-rose-500",
      stats: "46 basic characters + voiced + combinations",
      lessonCount: HIRAGANA_LESSONS.length,
      lessons: HIRAGANA_LESSONS,
    },
    {
      to: "/student/learning/alphabet/katakana",
      title: "Katakana",
      subtitle: "Japanese Syllabary",
      description: "Master the character set primarily used for foreign words, loanwords, and emphasis.",
      icon: "ア",
      color: "from-blue-400 to-cyan-500",
      stats: "46 basic characters + voiced + combinations + loanwords",
      lessonCount: KATAKANA_LESSONS.length,
      lessons: KATAKANA_LESSONS,
    },
  ];

  if (isChildRouteActive) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="Alphabet"
            subtitle="Learn the Japanese writing systems: Hiragana and Katakana"
          />

          {/* Hiragana & Katakana Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {alphabetCards.map((card) => (
              <div key={card.to} className="space-y-4">
                <Link to={card.to} className="group block">
                  <Card className={cn(
                    "p-6 h-full transition-all duration-200",
                    "hover:shadow-xl hover:-translate-y-1",
                    "border-slate-200 dark:border-white/10",
                    "hover:border-primary/50"
                  )}>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl bg-linear-to-br flex items-center justify-center text-3xl font-bold text-white shadow-lg",
                        card.color
                      )}>
                        {card.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {card.title}
                          </h3>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{card.subtitle}</p>
                        <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2">{card.description}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {card.stats}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>

                {/* Lesson list */}
                <div className="space-y-2 pl-2">
                  {card.lessons.map((lesson, index) => {
                    const progress = getLessonProgress(lesson.id);
                    return (
                      <Link
                        key={lesson.id}
                        to={lesson.path}
                        className="group flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/40 dark:border-white/10 hover:bg-white/80 hover:shadow-md transition-all"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl bg-linear-to-br flex items-center justify-center text-lg font-bold text-white shadow",
                          lesson.color
                        )}>
                          {lesson.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              {index + 1}.
                            </span>
                            <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {lesson.title}
                            </h4>
                            {progress.completed && (
                              <Trophy className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground ml-5">
                            {lesson.totalCharacters} characters
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {progress.attempts > 0 && (
                            <span className="text-xs font-medium text-muted-foreground">
                              Best: {progress.score}%
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
