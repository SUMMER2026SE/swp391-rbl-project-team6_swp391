"use client";

import { createFileRoute } from "@tanstack/react-router";
import { VocabularyLessonPage } from "@/components/student/vocabulary/VocabularyLessonPage";

export const Route = createFileRoute("/student/vocabulary/$lessonId")({
  component: VocabularyLessonPageWrapper,
});

function VocabularyLessonPageWrapper() {
  const { lessonId } = Route.useParams();
  return <VocabularyLessonPage lessonId={lessonId} />;
}
