import { createFileRoute, Outlet } from "@tanstack/react-router";
import { JourneyMap, type LessonSkillSummary } from "@/components/student/journey";
import { useLocation } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { lessonsApi, type SkillStatus, type SkillType } from "@/lib/api/lessons";
import { studentVocabularyApi } from "@/lib/api/vocabulary";
import { studentGrammarApi, type GrammarLessonResponse } from "@/lib/api/grammarContent";
import { studentReadingApi } from "@/lib/api/reading";
import { studentListeningApi } from "@/lib/api/listening";

export const Route = createFileRoute("/student/journey")({
  component: JourneyLayout,
  loader: async () => {
    const lessons = await lessonsApi.getAllLessons();

    const [vocabLessons, grammarLessons, readingLessons, listeningLessons] =
      await Promise.all([
        studentVocabularyApi.getVocabularyLessons().catch(() => []),
        studentGrammarApi.getGrammarLessons().catch(() => [] as GrammarLessonResponse[]),
        studentReadingApi.getReadingLessons().catch(() => []),
        studentListeningApi.getListeningLessons().catch(() => []),
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

    return { lessons, skillStatusByLesson };
  },
});

function JourneyLayout() {
  const location = useLocation();
  const { lessons, skillStatusByLesson } = Route.useLoaderData();
  const isIndex =
    location.pathname === "/student/journey" || location.pathname === "/student/journey/";

  if (isIndex) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Learning Journey"
          subtitle="Pick a lesson to explore its skills."
        />
        <JourneyMap lessons={lessons} skillStatusByLesson={skillStatusByLesson} />
      </div>
    );
  }

  return <Outlet />;
}