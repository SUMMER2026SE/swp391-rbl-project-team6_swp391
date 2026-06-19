import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { katakanaCombinationLesson } from "@/mock/alphabet/katakanaCombination";

export const Route = createFileRoute("/student/learning/alphabet/katakana/combination")({
  component: KatakanaCombinationPage,
});

function KatakanaCombinationPage() {
  return (
    <AlphabetLessonPage
      lesson={katakanaCombinationLesson}
      progressKey="katakana-combination"
    />
  );
}
