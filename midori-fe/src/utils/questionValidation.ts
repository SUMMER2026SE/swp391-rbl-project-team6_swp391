import {
  BuilderQuestion,
  QuestionType,
} from "../types/question";

export const validateBuilderQuestion = (q: BuilderQuestion): string[] => {
  const errors: string[] = [];

  if (!q.content.trim()) {
    errors.push("Question content text is empty");
  }

  if (q.points !== undefined && q.points < 0) {
    errors.push("Points must be greater than or equal to 0");
  }

  switch (q.type) {
    case "MULTIPLE_CHOICE":
      if (q.answers.length < 2) {
        errors.push("Multiple choice question needs at least 2 options");
      }
      const correctCount = q.answers.filter((a) => a.isCorrect).length;
      if (correctCount !== 1) {
        errors.push(
          `Multiple choice question requires exactly 1 correct answer (currently selected: ${correctCount})`,
        );
      }
      if (q.answers.some((a) => !a.content.trim())) {
        errors.push("All options must have content");
      }
      break;

    case "TRUE_FALSE":
      if (q.answers.length !== 2) {
        errors.push("True/False question must have exactly 2 options (True and False)");
      }
      const tfCorrect = q.answers.filter((a) => a.isCorrect).length;
      if (tfCorrect !== 1) {
        errors.push("True/False question must select either True or False as correct");
      }
      break;

    case "FILL_BLANK":
      const correctBlank = q.answers.find((a) => a.isCorrect);
      if (!correctBlank || !correctBlank.content.trim()) {
        errors.push("Fill blank question correct answer is required");
      }
      break;

    case "SHORT_ANSWER":
      // Short answer requires question text but no specific options structure
      if (!q.content.trim()) {
        errors.push("Short answer question requires question text");
      }
      break;

    case "MATCHING":
      const metadata = q.matchingMetadata;
      if (!metadata) {
        errors.push("Matching question requires matching metadata");
      } else {
        if (!metadata.leftItems || metadata.leftItems.length < 2) {
          errors.push("Matching question requires at least 2 left items");
        }
        if (!metadata.rightItems || metadata.rightItems.length < 2) {
          errors.push("Matching question requires at least 2 right items");
        }
        if (!metadata.correctPairs || metadata.correctPairs.length === 0) {
          errors.push("Matching question requires at least 1 correct pair");
        }
        // Validate all pairs reference valid indices
        if (metadata.leftItems && metadata.correctPairs) {
          for (const pair of metadata.correctPairs) {
            if (pair.leftIndex < 0 || pair.leftIndex >= metadata.leftItems.length) {
              errors.push(`Invalid left index ${pair.leftIndex} in matching pair`);
            }
            if (pair.rightIndex < 0 && metadata.rightItems && pair.rightIndex >= metadata.rightItems.length) {
              errors.push(`Invalid right index ${pair.rightIndex} in matching pair`);
            }
          }
        }
      }
      break;

    case "TRANSLATION":
      const transMeta = q.translationMetadata;
      if (!transMeta) {
        errors.push("Translation question requires translation metadata");
      } else {
        if (!transMeta.direction) {
          errors.push("Translation direction (JA_TO_VI or VI_TO_JA) is required");
        }
        if (!transMeta.referenceAnswer || !transMeta.referenceAnswer.trim()) {
          errors.push("Translation reference answer is required");
        }
        if (!transMeta.sourceText || !transMeta.sourceText.trim()) {
          errors.push("Translation source text is required");
        }
      }
      break;

    case "SENTENCE_WRITING":
      const swMeta = q.sentenceWritingMetadata;
      if (!swMeta) {
        errors.push("Sentence writing question requires sentence writing metadata");
      } else {
        // At least one of: required vocabulary, required grammar, or reference answer
        const hasConstraint =
          (swMeta.requiredVocabulary && swMeta.requiredVocabulary.length > 0) ||
          (swMeta.requiredGrammar && swMeta.requiredGrammar.length > 0) ||
          (swMeta.referenceAnswer && swMeta.referenceAnswer.trim());
        if (!hasConstraint) {
          errors.push(
            "Sentence writing requires at least one constraint: required vocabulary, required grammar, or reference answer",
          );
        }
      }
      break;

    case "ERROR_CORRECTION":
      const ecMeta = q.errorCorrectionMetadata;
      if (!ecMeta) {
        errors.push("Error correction question requires error correction metadata");
      } else {
        if (!ecMeta.incorrectText || !ecMeta.incorrectText.trim()) {
          errors.push("Incorrect sentence text is required");
        }
        if (!ecMeta.correctedText || !ecMeta.correctedText.trim()) {
          errors.push("Corrected sentence text is required");
        }
        if (!ecMeta.explanation || !ecMeta.explanation.trim()) {
          errors.push("Error explanation is required");
        }
        // Ensure the corrected text is actually different from the incorrect text
        if (
          ecMeta.incorrectText &&
          ecMeta.correctedText &&
          ecMeta.incorrectText.trim() === ecMeta.correctedText.trim()
        ) {
          errors.push("Corrected text must be different from the incorrect text");
        }
      }
      break;
  }

  return errors;
};
