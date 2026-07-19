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

interface JourneySearchParams {
  level?: string;
}

export const Route = createFileRoute("/student/journey")({
  validateSearch: (search: Record<string, unknown>): JourneySearchParams => {
    return {
      level: search.level ? String(search.level) : undefined,
    };
  },
  loaderDeps: ({ search: { level } }) => ({ level }),
  component: JourneyLayout,
  loader: async ({ deps: { level } }) => {
    const classes = await classesApi.getJoinedClasses("ACTIVE").catch(() => []);
    const availableLevels = Array.from(new Set(classes.map((cls) => cls.level))).sort();

    let selectedLevel = level;
    if (!selectedLevel || !availableLevels.includes(selectedLevel)) {
      selectedLevel = availableLevels[0] || "N5";
    }

    const lessons = await lessonsApi.getLessonsByLevel(selectedLevel).catch(() => []);

    const [vocabLessons, grammarLessons, readingLessons, listeningLessons] =
      await Promise.all([
        studentVocabularyApi.getVocabularyLessons({ level: selectedLevel }).catch(() => []),
        studentGrammarApi.getGrammarLessons({ level: selectedLevel }).catch(() => [] as GrammarLessonResponse[]),
        studentReadingApi.getReadingLessons({ level: selectedLevel }).catch(() => []),
        studentListeningApi.getListeningLessons({ level: selectedLevel }).catch(() => []),
      ]);

    const vocabLessonIds = new Set(
      vocabLessons
        .map((vocabularyLesson) => vocabularyLesson.lessonId)
        .filter((lessonId): lessonId is string => lessonId !== null),
    );
    const grammarByLessonNumber = new Map<number, GrammarLessonResponse>();
    grammarLessons.forEach((lesson) => {
      grammarByLessonNumber.set(lesson.lessonNumber, lesson);
    });

    const readingByLessonId = new Map<string, typeof readingLessons[0]>();
    readingLessons.forEach((lesson) => {
      if (lesson.lessonId) {
        readingByLessonId.set(lesson.lessonId, lesson);
      }
    });

    const listeningByLessonId = new Map<string, typeof listeningLessons[0]>();
    listeningLessons.forEach((lesson) => {
      if (lesson.lessonId) {
        listeningByLessonId.set(lesson.lessonId, lesson);
      }
    });

    const skillStatusByLesson: Record<string, LessonSkillSummary[]> = {};

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
      skillStatusByLesson[lesson.id] = skills;
    });

    return { lessons, skillStatusByLesson, availableLevels, selectedLevel };
  },
});

function JourneyLayout() {
  const location = useLocation();
  const { lessons, skillStatusByLesson, availableLevels, selectedLevel } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const isIndex =
    location.pathname === "/student/journey" || location.pathname === "/student/journey/";

  if (isIndex) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Learning Journey"
          subtitle="Pick a lesson to explore its skills."
        />

        {availableLevels.length > 1 && (
          <div className="inline-flex p-1 space-x-1 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            {availableLevels.map((lvl) => {
              const isActive = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => navigate({ search: { level: lvl } })}
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

        {availableLevels.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="font-semibold text-lg">You are not enrolled in any classes.</p>
            <p className="text-sm mt-1 text-gray-400">Please contact your teacher to join a class.</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="font-semibold text-lg">No lessons available for level {selectedLevel}.</p>
          </div>
        ) : (
          <JourneyMap lessons={lessons} skillStatusByLesson={skillStatusByLesson} />
        )}
      </div>
    );
  }

  return <Outlet />;
}