import React from "react";
import { OptionEditor } from "./OptionEditor";
import { QuestionToolbar } from "./QuestionToolbar";
import { ValidationBanner } from "./ValidationBanner";

export interface ImportedQuestion {
  id: string;
  type: string; // MULTIPLE_CHOICE, TRUE_FALSE, FILL_BLANK, MATCHING, SHORT_ANSWER
  content: string;
  difficulty: string; // Easy, Medium, Hard
  explanation?: string;
  answers: Array<{ content: string; isCorrect: boolean }>;
  category?: string; // Vocabulary, Grammar, Reading, Listening
  needsReview?: boolean;
}

interface QuestionEditorProps {
  question: ImportedQuestion;
  index: number;
  totalQuestions: number;
  onUpdateQuestion: (index: number, updated: Partial<ImportedQuestion>) => void;
  onDeleteQuestion: (index: number) => void;
  onDuplicateQuestion: (index: number) => void;
  onMoveQuestion: (index: number, direction: "up" | "down") => void;
  onReAnalyze: (index: number) => void;
  isReAnalyzing: boolean;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = React.memo(
  ({
    question,
    index,
    totalQuestions,
    onUpdateQuestion,
    onDeleteQuestion,
    onDuplicateQuestion,
    onMoveQuestion,
    onReAnalyze,
    isReAnalyzing,
  }) => {
    // Validation
    const errors: string[] = [];
    if (!question.content.trim()) {
      errors.push("Question text is empty");
    }
    if (question.answers.length < 2) {
      errors.push("Needs at least 2 options");
    }
    const correctCount = question.answers.filter((a) => a.isCorrect).length;
    if (correctCount !== 1) {
      errors.push(`Exactly one correct answer required (currently: ${correctCount})`);
    }

    const correctIndex = question.answers.findIndex((a) => a.isCorrect);

    const handleTextChange = (text: string) => {
      onUpdateQuestion(index, { content: text });
    };

    const handleExplanationChange = (text: string) => {
      onUpdateQuestion(index, { explanation: text });
    };

    const handleDifficultyChange = (diff: string) => {
      onUpdateQuestion(index, { difficulty: diff });
    };

    const handleTypeChange = (type: string) => {
      let answers = [...question.answers];
      if (type === "TRUE_FALSE") {
        answers = [
          { content: "True", isCorrect: true },
          { content: "False", isCorrect: false },
        ];
      }
      onUpdateQuestion(index, { type, answers });
    };

    const handleCategoryChange = (category: string) => {
      onUpdateQuestion(index, { category });
    };

    const handleOptionsChange = (newOptions: string[]) => {
      const answers = newOptions.map((opt, i) => ({
        content: opt,
        isCorrect: correctIndex === i,
      }));
      onUpdateQuestion(index, { answers });
    };

    const handleCorrectIndexChange = (newCorrectIndex: number) => {
      const answers = question.answers.map((ans, i) => ({
        ...ans,
        isCorrect: i === newCorrectIndex,
      }));
      onUpdateQuestion(index, { answers });
    };

    return (
      <div className="card-base p-5 space-y-4 border border-[var(--border)] hover:border-primary/20 transition relative">
        {/* Header toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {index + 1}
            </span>
            <span className="text-xs font-semibold text-muted-col">Type:</span>
            <select
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs text-primary-col cursor-pointer"
            >
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="FILL_BLANK">Fill in Blank</option>
              <option value="MATCHING">Matching</option>
              <option value="SHORT_ANSWER">Short Answer</option>
            </select>

            {question.needsReview && (
              <span className="px-2 py-0.5 rounded bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] font-semibold text-[10px] uppercase tracking-wider animate-pulse">
                Needs Review
              </span>
            )}
          </div>

          <QuestionToolbar
            onMoveUp={() => onMoveQuestion(index, "up")}
            onMoveDown={() => onMoveQuestion(index, "down")}
            onDuplicate={() => onDuplicateQuestion(index)}
            onDelete={() => onDeleteQuestion(index)}
            onReAnalyze={() => onReAnalyze(index)}
            isReAnalyzing={isReAnalyzing}
            canMoveUp={index > 0}
            canMoveDown={index < totalQuestions - 1}
          />
        </div>

        {/* Question content */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
            Question Text
          </label>
          <textarea
            value={question.content}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
            placeholder="Enter question text..."
          />
        </div>

        {/* Options */}
        {question.type !== "TRUE_FALSE" ? (
          <OptionEditor
            options={question.answers.map((a) => a.content)}
            correctIndex={correctIndex}
            onChangeOptions={handleOptionsChange}
            onChangeCorrectIndex={handleCorrectIndexChange}
          />
        ) : (
          <div className="space-y-2 mt-3">
            <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
              True / False
            </label>
            <div className="flex gap-4">
              {question.answers.map((ans, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={ans.isCorrect}
                    onChange={() => handleCorrectIndexChange(idx)}
                    className="w-4 h-4 cursor-pointer text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-primary-col">{ans.content}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Section & Difficulty & Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
              JLPT Section
            </label>
            <select
              value={question.category || "Vocabulary"}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
            >
              <option value="Vocabulary">Vocabulary</option>
              <option value="Grammar">Grammar</option>
              <option value="Reading">Reading</option>
              <option value="Listening">Listening</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
              Difficulty
            </label>
            <select
              value={question.difficulty || "MEDIUM"}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 mt-2">
          <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
            Explanation
          </label>
          <textarea
            value={question.explanation || ""}
            onChange={(e) => handleExplanationChange(e.target.value)}
            rows={1}
            className="w-full px-3 py-1.5 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
            placeholder="Enter explanation (optional)..."
          />
        </div>

        {/* Validation Errors inline */}
        <ValidationBanner errors={errors} />
      </div>
    );
  },
);

QuestionEditor.displayName = "QuestionEditor";
