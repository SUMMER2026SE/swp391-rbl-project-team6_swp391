import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { hiraganaCombinationLesson } from "@/mock/alphabet/hiraganaCombination";

export const Route = createFileRoute("/student/learning/alphabet/hiragana/combination")({
  component: HiraganaCombinationPage,
});

function HiraganaCombinationPage() {
  return (
    <AlphabetLessonPage
      lesson={hiraganaCombinationLesson}
      progressKey="hiragana-combination"
    />
  );
}
