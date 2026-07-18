import React from "react";
import { BuilderQuestion } from "../../types/question";

interface QuestionCardProps {
  question: BuilderQuestion;
  index: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = React.memo(({ question, index }) => {
  return (
    <div className="card-base p-5 border border-[var(--border)] rounded-2xl bg-card shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-muted-col uppercase tracking-wider">
            {question.type.replace("_", " ")}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {question.difficulty}
          </span>
          {question.points !== undefined && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-col font-bold">
              {question.points} pts
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-sm font-medium text-primary-col whitespace-pre-wrap">
        {question.content}
      </div>

      {/* Options */}
      {question.type !== "FILL_BLANK" && question.answers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {question.answers.map((ans, idx) => {
            const label = String.fromCharCode(65 + idx);
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  ans.isCorrect
                    ? "bg-green-500/10 border-green-500/30 text-green-700"
                    : "bg-[var(--accent)] border-[var(--border)] text-secondary-col"
                }`}
              >
                <span className="font-bold">{label}.</span>
                <span>{ans.content}</span>
              </div>
            );
          })}
        </div>
      )}

      {question.type === "FILL_BLANK" && question.answers[0] && (
        <div className="p-2.5 rounded-lg border text-xs bg-green-500/10 border-green-500/30 text-green-700 flex items-center gap-2 mt-2">
          <span className="font-bold">Answer:</span>
          <span>{question.answers[0].content}</span>
        </div>
      )}

      {/* Explanation */}
      {question.explanation && (
        <div className="text-xs text-muted-col bg-[var(--accent)]/50 p-2.5 rounded-lg border border-[var(--border)] mt-2">
          <span className="font-bold">Explanation: </span>
          {question.explanation}
        </div>
      )}
    </div>
  );
});

QuestionCard.displayName = "QuestionCard";
