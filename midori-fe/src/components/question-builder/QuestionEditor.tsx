import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { OptionEditor } from "./OptionEditor";
import { QuestionToolbar } from "./QuestionToolbar";
import { ValidationBanner } from "./ValidationBanner";
import {
  BuilderQuestion,
  QuestionType,
  QuestionDifficulty,
  QuestionSkill,
  TranslationMetadata,
  SentenceWritingMetadata,
  ErrorCorrectionMetadata,
  MatchingMetadata,
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
    const errors = validateBuilderQuestion(question);
    const correctIndex = question.answers.findIndex((a) => a.isCorrect);

    // Local state for format-specific metadata editing
    const [editingMetadata, setEditingMetadata] = useState(false);

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
      let newMetadata: Partial<BuilderQuestion> = { type };

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
      } else if (type === "TRANSLATION") {
        answers = [{ content: "", isCorrect: true }];
        newMetadata.translationMetadata = {
          direction: "JA_TO_VI",
          sourceText: "",
          referenceAnswer: "",
          sourceLanguage: "Japanese",
          targetLanguage: "Vietnamese",
        };
      } else if (type === "SENTENCE_WRITING") {
        answers = [{ content: "", isCorrect: true }];
        newMetadata.sentenceWritingMetadata = {
          requiredVocabulary: [],
          requiredGrammar: [],
          referenceAnswer: "",
          prompt: "",
        };
      } else if (type === "ERROR_CORRECTION") {
        answers = [{ content: "", isCorrect: true }];
        newMetadata.errorCorrectionMetadata = {
          incorrectText: "",
          correctedText: "",
          explanation: "",
        };
      } else if (type === "MATCHING") {
        answers = [];
        newMetadata.matchingMetadata = {
          leftItems: ["", ""],
          rightItems: ["", ""],
          correctPairs: [],
        };
      }

      onUpdateQuestion(index, { ...newMetadata, answers });
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

    // Format-specific handlers
    const handleTranslationChange = (field: keyof TranslationMetadata, value: string) => {
      const metadata = question.translationMetadata || {
        direction: "JA_TO_VI" as const,
        sourceText: "",
        referenceAnswer: "",
        sourceLanguage: "Japanese",
        targetLanguage: "Vietnamese",
      };
      onUpdateQuestion(index, {
        translationMetadata: { ...metadata, [field]: value },
      });
    };

    const handleSentenceWritingChange = (
      field: keyof SentenceWritingMetadata,
      value: string | string[]
    ) => {
      const metadata = question.sentenceWritingMetadata || {
        requiredVocabulary: [],
        requiredGrammar: [],
        referenceAnswer: "",
        prompt: "",
      };
      onUpdateQuestion(index, {
        sentenceWritingMetadata: { ...metadata, [field]: value },
      });
    };

    const handleErrorCorrectionChange = (
      field: keyof ErrorCorrectionMetadata,
      value: string
    ) => {
      const metadata = question.errorCorrectionMetadata || {
        incorrectText: "",
        correctedText: "",
        explanation: "",
      };
      onUpdateQuestion(index, {
        errorCorrectionMetadata: { ...metadata, [field]: value },
      });
    };

    const handleMatchingChange = (
      field: keyof MatchingMetadata,
      value: string[] | { leftIndex: number; rightIndex: number }[]
    ) => {
      const metadata = question.matchingMetadata || {
        leftItems: ["", ""],
        rightItems: ["", ""],
        correctPairs: [],
      };
      onUpdateQuestion(index, {
        matchingMetadata: { ...metadata, [field]: value },
      });
    };

    const addMatchingPair = () => {
      const metadata = question.matchingMetadata || {
        leftItems: ["", ""],
        rightItems: ["", ""],
        correctPairs: [],
      };
      const newPair = {
        leftIndex: metadata.correctPairs.length,
        rightIndex: metadata.correctPairs.length,
      };
      onUpdateQuestion(index, {
        matchingMetadata: {
          ...metadata,
          correctPairs: [...metadata.correctPairs, newPair],
        },
      });
    };

    const removeMatchingPair = (pairIndex: number) => {
      const metadata = question.matchingMetadata;
      if (!metadata) return;
      onUpdateQuestion(index, {
        matchingMetadata: {
          ...metadata,
          correctPairs: metadata.correctPairs.filter((_, i) => i !== pairIndex),
        },
      });
    };

    const updateMatchingPair = (
      pairIndex: number,
      field: "leftIndex" | "rightIndex",
      value: number
    ) => {
      const metadata = question.matchingMetadata;
      if (!metadata) return;
      const newPairs = [...metadata.correctPairs];
      newPairs[pairIndex] = { ...newPairs[pairIndex], [field]: value };
      onUpdateQuestion(index, {
        matchingMetadata: { ...metadata, correctPairs: newPairs },
      });
    };

    // Render format-specific metadata editor
    const renderFormatMetadataEditor = () => {
      switch (question.type) {
        case "TRANSLATION":
          return (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
                Translation Settings
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Direction</label>
                  <select
                    value={question.translationMetadata?.direction || "JA_TO_VI"}
                    onChange={(e) =>
                      handleTranslationChange("direction", e.target.value)
                    }
                    className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                  >
                    <option value="JA_TO_VI">Japanese → Vietnamese</option>
                    <option value="VI_TO_JA">Vietnamese → Japanese</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Source Text</label>
                  <input
                    type="text"
                    value={question.translationMetadata?.sourceText || ""}
                    onChange={(e) =>
                      handleTranslationChange("sourceText", e.target.value)
                    }
                    className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                    placeholder="Text to translate"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">
                  Reference Answer (correct translation)
                </label>
                <input
                  type="text"
                  value={question.translationMetadata?.referenceAnswer || ""}
                  onChange={(e) =>
                    handleTranslationChange("referenceAnswer", e.target.value)
                  }
                  className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                  placeholder="Correct translation"
                />
              </div>
            </div>
          );

        case "SENTENCE_WRITING":
          return (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
                Sentence Writing Settings
              </label>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">
                  Required Vocabulary (comma-separated)
                </label>
                <input
                  type="text"
                  value={
                    question.sentenceWritingMetadata?.requiredVocabulary?.join(", ") || ""
                  }
                  onChange={(e) =>
                    handleSentenceWritingChange(
                      "requiredVocabulary",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                  placeholder="e.g., 学校, 行く, 先生"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">
                  Required Grammar (comma-separated)
                </label>
                <input
                  type="text"
                  value={
                    question.sentenceWritingMetadata?.requiredGrammar?.join(", ") || ""
                  }
                  onChange={(e) =>
                    handleSentenceWritingChange(
                      "requiredGrammar",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                  placeholder="e.g., 〜ています, 〜たい"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">
                  Reference Answer
                </label>
                <input
                  type="text"
                  value={question.sentenceWritingMetadata?.referenceAnswer || ""}
                  onChange={(e) =>
                    handleSentenceWritingChange("referenceAnswer", e.target.value)
                  }
                  className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                  placeholder="Example correct answer"
                />
              </div>
            </div>
          );

        case "ERROR_CORRECTION":
          return (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
                Error Correction Settings
              </label>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">
                  Incorrect Sentence
                </label>
                <input
                  type="text"
                  value={question.errorCorrectionMetadata?.incorrectText || ""}
                  onChange={(e) =>
                    handleErrorCorrectionChange("incorrectText", e.target.value)
                  }
                  className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                  placeholder="The sentence with error"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">
                  Corrected Sentence
                </label>
                <input
                  type="text"
                  value={question.errorCorrectionMetadata?.correctedText || ""}
                  onChange={(e) =>
                    handleErrorCorrectionChange("correctedText", e.target.value)
                  }
                  className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                  placeholder="The corrected sentence"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Explanation</label>
                <textarea
                  value={question.errorCorrectionMetadata?.explanation || ""}
                  onChange={(e) =>
                    handleErrorCorrectionChange("explanation", e.target.value)
                  }
                  rows={2}
                  className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                  placeholder="Brief explanation of the error"
                />
              </div>
            </div>
          );

        case "MATCHING":
          const metadata = question.matchingMetadata;
          return (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
                Matching Pairs
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Left Items</label>
                  {(metadata?.leftItems || ["", ""]).map((item, i) => (
                    <input
                      key={`left-${i}`}
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newLeftItems = [...(metadata?.leftItems || ["", ""])];
                        newLeftItems[i] = e.target.value;
                        handleMatchingChange("leftItems", newLeftItems);
                      }}
                      className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs mb-1"
                      placeholder={`Left ${i + 1}`}
                    />
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const items = metadata?.leftItems || [""];
                      handleMatchingChange("leftItems", [...items, ""]);
                    }}
                    className="w-full text-xs"
                  >
                    + Add Left Item
                  </Button>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Right Items</label>
                  {(metadata?.rightItems || ["", ""]).map((item, i) => (
                    <input
                      key={`right-${i}`}
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newRightItems = [...(metadata?.rightItems || ["", ""])];
                        newRightItems[i] = e.target.value;
                        handleMatchingChange("rightItems", newRightItems);
                      }}
                      className="w-full px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs mb-1"
                      placeholder={`Right ${i + 1}`}
                    />
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const items = metadata?.rightItems || [""];
                      handleMatchingChange("rightItems", [...items, ""]);
                    }}
                    className="w-full text-xs"
                  >
                    + Add Right Item
                  </Button>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <label className="text-[10px] text-muted-foreground">Correct Pairs</label>
                {(metadata?.correctPairs || []).map((pair, i) => (
                  <div key={`pair-${i}`} className="flex items-center gap-2 mb-1">
                    <select
                      value={pair.leftIndex}
                      onChange={(e) =>
                        updateMatchingPair(i, "leftIndex", parseInt(e.target.value))
                      }
                      className="flex-1 px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                    >
                      {(metadata?.leftItems || []).map((_, idx) => (
                        <option key={idx} value={idx}>
                          L{idx + 1}: {metadata?.leftItems?.[idx] || ""}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs">→</span>
                    <select
                      value={pair.rightIndex}
                      onChange={(e) =>
                        updateMatchingPair(i, "rightIndex", parseInt(e.target.value))
                      }
                      className="flex-1 px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs"
                    >
                      {(metadata?.rightItems || []).map((_, idx) => (
                        <option key={idx} value={idx}>
                          R{idx + 1}: {metadata?.rightItems?.[idx] || ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMatchingPair(i)}
                      className="text-red-500 text-xs px-1"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addMatchingPair}
                  className="w-full text-xs"
                >
                  + Add Pair
                </Button>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="card-base p-5 space-y-4 border border-[var(--border)] hover:border-primary/20 transition relative bg-card rounded-2xl shadow-sm">
        {/* Header toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {index + 1}
            </span>
            <span className="text-xs font-semibold text-muted-col">Format:</span>
            <select
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              className="px-2 py-1 rounded bg-[var(--accent)] border border-[var(--border)] text-xs text-primary-col cursor-pointer focus:outline-none"
            >
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="FILL_BLANK">Fill in Blank</option>
              <option value="SHORT_ANSWER">Short Answer</option>
              <option value="MATCHING">Matching</option>
              <option value="TRANSLATION">Translation</option>
              <option value="SENTENCE_WRITING">Sentence Writing</option>
              <option value="ERROR_CORRECTION">Error Correction</option>
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

        {/* Options for Multiple Choice / Short Answer / Translation */}
        {correctIndex === -1 && question.type === "MULTIPLE_CHOICE" && (
          <div className="text-red-500 text-xs font-semibold my-2">
            Warning: Please select a correct answer.
          </div>
        )}

        {question.type !== "TRUE_FALSE" &&
        question.type !== "FILL_BLANK" &&
        question.type !== "MATCHING" &&
        question.type !== "SENTENCE_WRITING" &&
        question.type !== "ERROR_CORRECTION" ? (
          <OptionEditor
            options={question.answers.map((a) => a.content)}
            correctIndex={correctIndex >= 0 ? correctIndex : 0}
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
        ) : question.type === "FILL_BLANK" ? (
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
        ) : null}

        {/* Format-specific metadata editor */}
        {renderFormatMetadataEditor()}

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
              <option value="Writing">Writing</option>
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
