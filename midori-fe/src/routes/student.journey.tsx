import { createFileRoute, Outlet } from "@tanstack/react-router";
import { JourneyMap, type LessonSkillSummary } from "@/components/student/journey";
import { useLocation } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { lessonsApi, type SkillStatus, type SkillType } from "@/lib/api/lessons";
import { studentVocabularyApi } from "@/lib/api/vocabulary";
import { studentGrammarApi, type GrammarLessonResponse } from "@/lib/api/grammarContent";
import { studentReadingApi } from "@/lib/api/reading";
import { studentListeningApi } from "@/lib/api/listening";
import { classesApi } from "@/lib/api/classes";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api/client";

interface JourneySearchParams {
  level?: string;
}

export const Route = createFileRoute("/student/journey")({
  validateSearch: (search: Record<string, unknown>): JourneySearchParams => {
    return {
      level: search.level ? String(search.level) : undefined,
    };
  },
  component: JourneyLayout,
});

function JourneySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
        ))}
      </div>
    </div>
  );
}

function JourneyLayout() {
  const search = Route.useSearch();
  const levelParam = search.level;
  const navigate = Route.useNavigate();
  const location = useLocation();
  const isIndex = location.pathname === "/student/journey" || location.pathname === "/student/journey/";

  // 1. Fetch joined classes using React Query (same cache key as Dashboard)
  const {
    data: classes = [],
    isLoading: isClassesLoading,
    isError: isClassesError,
  } = useQuery({
    queryKey: ["studentJoinedClassesDashboard"],
    queryFn: () => classesApi.getJoinedClasses(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const availableLevels = useMemo(
    () => Array.from(new Set(classes.map((cls: any) => cls.level))).sort(),
    [classes],
  );

  const selectedLevel = useMemo(() => {
    if (levelParam && availableLevels.includes(levelParam)) {
      return levelParam;
    }
    return availableLevels[0] || "N5";
  }, [levelParam, availableLevels]);

  // Sync selectedLevel to internal state when levelParam changes
  const [currentLevel, setCurrentLevel] = useState(selectedLevel);
  useEffect(() => {
    setCurrentLevel(selectedLevel);
  }, [selectedLevel]);

  const activeLevel = currentLevel || selectedLevel || "N5";

  // 2. Fetch Lessons for active level
  const { data: lessons = [], isLoading: isLessonsLoading } = useQuery({
    queryKey: ["student-journey-lessons", activeLevel],
    queryFn: () => lessonsApi.getLessonsByLevel(activeLevel),
    enabled: !!activeLevel,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: vocabLessons = [] } = useQuery({
    queryKey: ["student-journey-vocab", activeLevel],
    queryFn: () => studentVocabularyApi.getVocabularyLessons({ level: activeLevel }),
    enabled: !!activeLevel,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: grammarLessons = [] } = useQuery({
    queryKey: ["student-journey-grammar", activeLevel],
    queryFn: () => studentGrammarApi.getGrammarLessons({ level: activeLevel }),
    enabled: !!activeLevel,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: readingLessons = [] } = useQuery({
    queryKey: ["student-journey-reading", activeLevel],
    queryFn: () => studentReadingApi.getReadingLessons({ level: activeLevel }),
    enabled: !!activeLevel,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: listeningLessons = [] } = useQuery({
    queryKey: ["student-journey-listening", activeLevel],
    queryFn: () => studentListeningApi.getListeningLessons({ level: activeLevel }),
    enabled: !!activeLevel,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // 3. Build skill status map
  const skillStatusByLesson = useMemo((): Record<string, LessonSkillSummary[]> => {
    const vocabLessonIds = new Set(
      vocabLessons
        .map((v: any) => v.lessonId)
        .filter((id: any): id is string => id !== null),
    );

    const grammarByLessonNumber = new Map<number, GrammarLessonResponse>();
    (grammarLessons as GrammarLessonResponse[]).forEach((lesson) => {
      grammarByLessonNumber.set(lesson.lessonNumber, lesson);
    });

    const readingByLessonId = new Map<string, any>();
    (readingLessons as any[]).forEach((lesson) => {
      if (lesson.lessonId) readingByLessonId.set(lesson.lessonId, lesson);
    });

    const listeningByLessonId = new Map<string, any>();
    (listeningLessons as any[]).forEach((lesson) => {
      if (lesson.lessonId) listeningByLessonId.set(lesson.lessonId, lesson);
    });

    const result: Record<string, LessonSkillSummary[]> = {};
    lessons.forEach((lesson) => {
      const skills: LessonSkillSummary[] = (
        ["VOCABULARY", "GRAMMAR", "READING", "LISTENING"] as SkillType[]
      ).map((type) => {
        let available = false;
        switch (type) {
          case "VOCABULARY":
            available = vocabLessonIds.has(lesson.id);
            break;
          case "GRAMMAR":
            available = grammarByLessonNumber.has(lesson.lessonNumber);
            break;
          case "READING":
            available = readingByLessonId.has(lesson.id);
            break;
          case "LISTENING":
            available = listeningByLessonId.has(lesson.id);
            break;
        }
        return {
          type,
          status: (available ? "AVAILABLE" : "COMING_SOON") as SkillStatus,
        };
      });
      result[lesson.id] = skills;
    });

    return result;
  }, [lessons, vocabLessons, grammarLessons, readingLessons, listeningLessons]);

  if (!isIndex) {
    return <Outlet />;
  }

  // Loading state
  if (isClassesLoading) {
    return <JourneySkeleton />;
  }

  // Error state
  if (isClassesError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Learning Journey" subtitle="Pick a lesson to explore its skills." />
        <div className="text-center py-12 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-dashed border-red-300 dark:border-red-700">
          <p className="font-semibold text-lg">Failed to load your classes.</p>
          <p className="text-sm mt-1">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Journey"
        subtitle="Pick a lesson to explore its skills."
      />

      {availableLevels.length > 1 && (
        <div className="inline-flex p-1 space-x-1 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50">
          {availableLevels.map((lvl) => {
            const isActive = activeLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => {
                  setCurrentLevel(lvl);
                  navigate({ search: { level: lvl } });
                }}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-white dark:bg-gray-700 text-primary shadow-sm scale-102 font-bold"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/40"
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Not enrolled ─────────────────────────────────────────────────── */}
      {availableLevels.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="font-semibold text-lg">You are not enrolled in any classes.</p>
          <p className="text-sm mt-1 text-gray-400">Please contact your teacher to join a class.</p>
        </div>
      ) : isLessonsLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="font-semibold text-lg">No lessons available for level {activeLevel}.</p>
        </div>
      ) : (
        <JourneyMap lessons={lessons} skillStatusByLesson={skillStatusByLesson} />
      )}
    </div>
  );
}