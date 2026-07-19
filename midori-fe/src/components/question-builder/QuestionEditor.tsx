import React from "react";
import { OptionEditor } from "./OptionEditor";
import { QuestionToolbar } from "./QuestionToolbar";
import { ValidationBanner } from "./ValidationBanner";
import {
  BuilderQuestion,
  QuestionType,
  QuestionDifficulty,
  QuestionSkill,
} from "../../types/question";
import { validateBuilderQuestion } from "../../utils/questionValidation";

interface QuestionEditorProps {
  question: BuilderQuestion;
  index: number;
  totalQuestions: number;
  onUpdateQuestion: (index: number, updated: Partial<BuilderQuestion>) => void;
  onDeleteQuestion: (index: number) => void;
  onDuplicateQuestion: (index: number) => void;
  onMoveQuestion: (index: number, direction: "up" | "down") => void;
  onReAnalyze?: (index: number) => void;
  isReAnalyzing?: boolean;
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
    isReAnalyzing = false,
  }) => {
    // Shared Validation
    const errors = validateBuilderQuestion(question);

    const correctIndex = question.answers.findIndex((a) => a.isCorrect);

    const handleTextChange = (text: string) => {
      onUpdateQuestion(index, { content: text });
    };

    const handleExplanationChange = (text: string) => {
      onUpdateQuestion(index, { explanation: text });
    };

    const handleDifficultyChange = (difficulty: QuestionDifficulty) => {
      onUpdateQuestion(index, { difficulty });
    };

    const handlePointsChange = (points: number) => {
      onUpdateQuestion(index, { points });
    };

    const handleSkillChange = (skill: QuestionSkill) => {
      onUpdateQuestion(index, { skill });
    };

    const handleTypeChange = (type: QuestionType) => {
      let answers = [...question.answers];
      if (type === "TRUE_FALSE") {
        answers = [
          { content: "True", isCorrect: true },
          { content: "False", isCorrect: false },
        ];
      } else if (type === "MULTIPLE_CHOICE" && answers.length < 2) {
        answers = [
          { content: "", isCorrect: true },
          { content: "", isCorrect: false },
        ];
      }
      onUpdateQuestion(index, { type, answers });
    };

    const handleOptionsChange = (newOptions: string[]) => {
      const answers = newOptions.map((opt, i) => ({
        content: opt,
        isCorrect: correctIndex === i || (correctIndex === -1 && i === 0),
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
      <div className="card-base p-5 space-y-4 border border-[var(--border)] hover:border-primary/20 transition relative bg-card rounded-2xl shadow-sm">
        {/* Header toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {index + 1}
            </span>
            <span className="text-xs font-semibold text-muted-col">Type:</span>
            <select
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              className="px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs text-primary-col cursor-pointer focus:outline-none"
            >
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="FILL_BLANK">Fill in Blank</option>
              <option value="MATCHING">Matching</option>
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
            onReAnalyze={onReAnalyze ? () => onReAnalyze(index) : undefined}
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
        {question.type !== "TRUE_FALSE" && question.type !== "FILL_BLANK" ? (
          <OptionEditor
            options={question.answers.map((a) => a.content)}
            correctIndex={correctIndex}
            onChangeOptions={handleOptionsChange}
            onChangeCorrectIndex={handleCorrectIndexChange}
          />
        ) : question.type === "TRUE_FALSE" ? (
          <div className="space-y-2 mt-3">
            <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
              True / False Correct Option
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
        ) : (
          <div className="space-y-1.5 mt-3">
            <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
              Correct Answer (Fill Blank)
            </label>
            <input
              type="text"
              value={question.answers[0]?.content || ""}
              onChange={(e) =>
                onUpdateQuestion(index, {
                  answers: [{ content: e.target.value, isCorrect: true }],
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
              placeholder="Enter the correct blank text..."
            />
          </div>
        )}

        {/* Skill & Difficulty & Points & Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
              Skill Category
            </label>
            <select
              value={question.skill || "Vocabulary"}
              onChange={(e) => handleSkillChange(e.target.value as QuestionSkill)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
            >
              <option value="Vocabulary">Vocabulary</option>
              <option value="Grammar">Grammar</option>
              <option value="Reading">Reading</option>
              <option value="Listening">Listening</option>
              <option value="Kanji">Kanji</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
              Difficulty
            </label>
            <select
              value={question.difficulty || "MEDIUM"}
              onChange={(e) => handleDifficultyChange(e.target.value as QuestionDifficulty)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
              Points
            </label>
            <input
              type="number"
              min={0}
              value={question.points ?? 1}
              onChange={(e) => handlePointsChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none transition"
            />
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
