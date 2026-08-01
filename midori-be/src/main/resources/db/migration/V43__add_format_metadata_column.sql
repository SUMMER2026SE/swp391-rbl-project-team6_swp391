-- Add format metadata column for storing structured format-specific data
-- This column stores JSON with format-specific metadata like:
-- - TranslationMetadata: direction, sourceText, referenceAnswer, acceptedAnswers, sourceLanguage, targetLanguage
-- - SentenceWritingMetadata: requiredVocabulary, requiredGrammar, referenceAnswer, acceptedAnswers, rubric, prompt
-- - ErrorCorrectionMetadata: incorrectText, correctedText, explanation, errorType
-- - MatchingMetadata: leftItems, rightItems, correctPairs

ALTER TABLE teacher_questions ADD COLUMN IF NOT EXISTS format_metadata TEXT;

-- Backward compatibility: existing questions will have NULL metadata, which is acceptable
-- New questions with format-specific data will have JSON stored here
