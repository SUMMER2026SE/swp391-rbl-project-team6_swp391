import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { katakanaDakutenLesson } from "@/mock/alphabet/katakanaDakuten";

export const Route = createFileRoute("/student/learning/alphabet/katakana/dakuten")({
  component: KatakanaDakutenPage,
});

function KatakanaDakutenPage() {
  return (
    <AlphabetLessonPage
      lesson={katakanaDakutenLesson}
      progressKey="katakana-dakuten"
    />
  );
}
