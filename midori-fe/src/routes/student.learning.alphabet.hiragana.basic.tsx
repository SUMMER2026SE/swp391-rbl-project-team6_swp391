import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { hiraganaBasicLesson } from "@/mock/alphabet/hiraganaBasic";

export const Route = createFileRoute("/student/learning/alphabet/hiragana/basic")({
  component: HiraganaBasicPage,
});

function HiraganaBasicPage() {
  return (
    <AlphabetLessonPage
      lesson={hiraganaBasicLesson}
      progressKey="hiragana-basic"
    />
  );
}
