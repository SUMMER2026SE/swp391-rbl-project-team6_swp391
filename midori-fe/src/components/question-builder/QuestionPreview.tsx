import React from "react";
import { BuilderQuestion } from "../../types/question";
import { QuestionCard } from "./QuestionCard";

interface QuestionPreviewProps {
  questions: BuilderQuestion[];
}

export const QuestionPreview: React.FC<QuestionPreviewProps> = React.memo(({ questions }) => {
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-col text-sm">
        No questions have been added yet. Click "+ Add Question" to start building your homework.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <QuestionCard key={q.id} question={q} index={idx} />
      ))}
    </div>
  );
});

QuestionPreview.displayName = "QuestionPreview";
