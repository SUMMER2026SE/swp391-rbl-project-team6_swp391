import React, { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { OptionEditor } from "./OptionEditor";
import { QuestionToolbar } from "./QuestionToolbar";
import { ValidationBanner } from "./ValidationBanner";
import {
  parseReadingQuestionText,
  composeReadingQuestionText,
  shouldSplitReadingForQuestion,
} from "./readingQuestionParser";

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
  selectedSkills?: string[];
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
    selectedSkills = [],
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

    // Reading-passage split UI: when the question's category is Reading
    // and the AI packed both the passage and the question into a single
    // `content` string, surface them in two separate textareas. The DB
    // still receives a single string — we recompose on every edit.
    const splitReading = shouldSplitReadingForQuestion(question.category);
    const parsed = splitReading ? parseReadingQuestionText(question.content) : null;
    const [passageDraft, setPassageDraft] = React.useState<string>(
      parsed?.passage ?? "",
    );
    const [passageExpanded, setPassageExpanded] = useState<boolean>(true);
    const passageLabelKey = parsed?.labelKey ?? "en-read";

    // Re-sync local draft when the upstream content changes (e.g. user
    // uploads a different file). Without this the local state would
    // "stick" and silently overwrite later updates.
    React.useEffect(() => {
      setPassageDraft(parsed?.passage ?? "");
    }, [question.content, question.category]);

    const handleTextChange = (text: string) => {
      onUpdateQuestion(index, { content: text });
    };

    const handleReadingQuestionChange = (text: string) => {
      const composed = composeReadingQuestionText(
        passageDraft,
        text,
        passageLabelKey,
      );
      onUpdateQuestion(index, { content: composed });
    };

    const handleReadingPassageChange = (text: string) => {
      setPassageDraft(text);
      const currentQuestion = parsed?.split
        ? parsed.question
        : parseReadingQuestionText(question.content).question || question.content;
      const composed = composeReadingQuestionText(text, currentQuestion, passageLabelKey);
      onUpdateQuestion(index, { content: composed });
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
    } else if (type === "FILL_BLANK" || type === "SHORT_ANSWER") {
      // Single free-text answer; do not render multiple-choice options.
      if (answers.length === 0) {
        answers = [{ content: "", isCorrect: true }];
      } else {
        const first = answers[0];
        answers = [{ content: first?.content ?? "", isCorrect: true }];
      }
      // Make sure the question text actually has a blank marker for FILL_BLANK.
      if (type === "FILL_BLANK" && question.content && !/_{3,}|\(blank\)|【答え】|fill in/i.test(question.content)) {
        onUpdateQuestion(index, { content: `${question.content} ___` });
      }
    } else if (type === "MULTIPLE_CHOICE") {
      // If we're switching away from FILL/SHORT to MCQ, make sure we have
      // at least two distinct options.
      if (answers.length < 2) {
        answers = [
          { content: answers[0]?.content ?? "", isCorrect: true },
          { content: "", isCorrect: false },
        ];
      }
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
        {splitReading && parsed?.split ? (
          <div className="space-y-4">
            {/* Reading Passage block — bigger textarea, collapsible */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <label className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    Reading Passage
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setPassageExpanded((v) => !v)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-secondary-col hover:text-primary transition"
                  aria-label={passageExpanded ? "Collapse passage" : "Expand passage"}
                >
                  {passageExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Expand</span>
                    </>
                  )}
                </button>
              </div>
              {passageExpanded && (
                <textarea
                  value={passageDraft}
                  onChange={(e) => handleReadingPassageChange(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/40 transition resize-y min-h-[120px] max-h-[420px] leading-relaxed"
                  placeholder="Reading passage text..."
                />
              )}
              {!passageExpanded && (
                <p className="text-xs text-muted-col line-clamp-2 italic">
                  {passageDraft || "(empty passage)"}
                </p>
              )}
            </div>

            {/* Question text only — passage has been moved out */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
                Question Text
              </label>
              <textarea
                value={parsed.question}
                onChange={(e) => handleReadingQuestionChange(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
                placeholder="Enter question text..."
              />
            </div>
          </div>
        ) : (
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
        )}

        {/* Options / Answer field */}
        {correctIndex === -1 && question.type !== "FILL_BLANK" && question.type !== "SHORT_ANSWER" && (
          <div className="text-red-500 text-xs font-semibold my-2">
            Warning: Please select a correct answer.
          </div>
        )}
        {question.type === "FILL_BLANK" || question.type === "SHORT_ANSWER" ? (
          <div className="space-y-2 mt-3">
            <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
              {question.type === "FILL_BLANK" ? "Correct Text (Fill in the Blank)" : "Reference Answer (Short Answer)"}
            </label>
            <input
              type="text"
              data-testid={question.type === "FILL_BLANK" ? "fill-blank-input" : "short-answer-input"}
              value={question.answers[0]?.content ?? ""}
              onChange={(e) =>
                handleCorrectIndexChange === undefined
                  ? undefined
                  : onUpdateQuestion(index, {
                      answers: [{ content: e.target.value, isCorrect: true }],
                    })
              }
              placeholder={
                question.type === "FILL_BLANK"
                  ? "Type the expected fill-in text..."
                  : "Type the reference answer..."
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
            />
          </div>
        ) : question.type !== "TRUE_FALSE" ? (
          <OptionEditor
            options={question.answers.map((a) => a.content)}
            correctIndex={correctIndex}
            onChangeOptions={handleOptionsChange}
            onChangeCorrectIndex={handleCorrectIndexChange}
          />
        ) : (
          <div className="space-y-2 mt-3" data-testid="true-false-choices">
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
              Skill
            </label>
            {selectedSkills.length === 1 ? (
              <div className="px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col flex items-center">
                <span className="font-semibold">{selectedSkills[0]}</span>
              </div>
            ) : (() => {
              // The backend returns category as PascalCase ("Grammar", "Vocabulary",
              // "Reading") while `selectedSkills` are uppercase ("GRAMMAR",
              // "VOCABULARY"). Without normalizing the option list to the same
              // case as `question.category`, React's <select value> falls back to
              // the first <option> when the value doesn't match anything —
              // meaning every question displayed as "VOCABULARY" even though the
              // underlying state still held the correct category. The dropdown
              // also silently rewrote the state the moment the user opened it.
              //
              // Fix: build a label/value map keyed by uppercased skill so the
              // select always matches `question.category` regardless of case.
              const skillOptions: { label: string; value: string }[] = (
                selectedSkills.length > 0
                  ? selectedSkills
                  : ["VOCABULARY", "GRAMMAR", "READING"]
              ).map((s) => {
                const upper = s.toUpperCase();
                const pascal = upper.charAt(0) + upper.slice(1).toLowerCase();
                return { label: upper, value: pascal };
              });

              const current = question.category || "";
              // If the backend's normalized category is not in the user's
              // selected skills (e.g. backend returned "Reading" but the user
              // picked only Vocab+Grammar), fall back to the first selected
              // skill so the dropdown never appears empty.
              const value = skillOptions.some((o) => o.value === current)
                ? current
                : skillOptions[0]?.value ?? "Vocabulary";

              return (
                <select
                  value={value}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
                >
                  {skillOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              );
            })()}
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
