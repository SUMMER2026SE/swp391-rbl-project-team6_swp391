import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { hiraganaDakutenLesson } from "@/mock/alphabet/hiraganaDakuten";

export const Route = createFileRoute("/student/learning/alphabet/hiragana/dakuten")({
  component: HiraganaDakutenPage,
});

function HiraganaDakutenPage() {
  return <AlphabetLessonPage lesson={hiraganaDakutenLesson} progressKey="hiragana-dakuten" />;
}
