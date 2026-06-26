import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { katakanaBasicLesson } from "@/mock/alphabet/katakanaBasic";

export const Route = createFileRoute("/student/learning/alphabet/katakana/basic")({
  component: KatakanaBasicPage,
});

function KatakanaBasicPage() {
  return <AlphabetLessonPage lesson={katakanaBasicLesson} progressKey="katakana-basic" />;
}
