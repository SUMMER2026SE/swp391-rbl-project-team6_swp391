package com.midori.ai.util;

import com.midori.ai.dto.AiExamParseResponse.AiQuestionDto;
import com.midori.ai.dto.AiExamParseResponse.AiAnswerDto;
import com.midori.entity.DictionaryEntry;
import com.midori.entity.QuestionType;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.service.AiLearningContentService.SourceRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuestionSemanticValidator {

    private final DictionaryEntryRepository dictionaryEntryRepository;

    public static class ValidationResult {
        public final boolean isValid;
        public final String reason;
        public ValidationResult(boolean isValid, String reason) {
            this.isValid = isValid;
            this.reason = reason;
        }
        public static ValidationResult valid() { return new ValidationResult(true, ""); }
        public static ValidationResult invalid(String reason) { return new ValidationResult(false, reason); }
    }

    public ValidationResult validate(AiQuestionDto q, Map<String, SourceRecord> sourceRecordsMap) {
        if (q == null) return ValidationResult.invalid("Null question");
        
        String content = q.getContent();
        if (content == null || content.isBlank()) {
            return ValidationResult.invalid("Empty question content");
        }

        // 1. Language Policy Validation
        if (hasProhibitedVietnamese(q)) {
            return ValidationResult.invalid("Vietnamese prose in prohibited fields");
        }

        // 2. Options and Correct Answer Count Validation (Basic Question Type validation)
        String rawType = q.getType();
        QuestionType type = QuestionTypeValidator.normalize(rawType);
        if (type == null) {
            return ValidationResult.invalid("Unsupported/unknown question type: " + rawType);
        }

        // 3. Question-type specific checks
        if (type == QuestionType.MULTIPLE_CHOICE) {
            if (q.getAnswers() == null || q.getAnswers().size() < 2) {
                return ValidationResult.invalid("MULTIPLE_CHOICE needs at least 2 options");
            }
            long correct = q.getAnswers().stream().filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect())).count();
            if (correct != 1) {
                return ValidationResult.invalid("MULTIPLE_CHOICE needs exactly 1 correct answer (found: " + correct + ")");
            }
        } else if (type == QuestionType.TRUE_FALSE) {
            if (q.getAnswers() == null || q.getAnswers().size() != 2) {
                return ValidationResult.invalid("TRUE_FALSE needs exactly 2 options");
            }
            // Normalize in-place
            var a0 = q.getAnswers().get(0);
            var a1 = q.getAnswers().get(1);
            if (a0 != null && a1 != null) {
                boolean wasTrueCorrect = false;
                if (Boolean.TRUE.equals(a0.getIsCorrect())) {
                    wasTrueCorrect = a0.getContent() != null && QuestionTypeValidator.isTrue(a0.getContent());
                } else if (Boolean.TRUE.equals(a1.getIsCorrect())) {
                    wasTrueCorrect = a1.getContent() != null && QuestionTypeValidator.isTrue(a1.getContent());
                } else {
                    wasTrueCorrect = a0.getContent() != null && QuestionTypeValidator.isTrue(a0.getContent());
                }
                a0.setContent("True");
                a0.setIsCorrect(wasTrueCorrect);
                a1.setContent("False");
                a1.setIsCorrect(!wasTrueCorrect);
            }
            long correct = q.getAnswers().stream().filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect())).count();
            if (correct != 1) {
                return ValidationResult.invalid("TRUE_FALSE needs exactly 1 correct answer");
            }
            // Enforce statement format
            String text = q.getContent() == null ? "" : q.getContent().trim();
            if (isInterrogative(text)) {
                return ValidationResult.invalid("TRUE_FALSE question text must be a statement, not an interrogative question");
            }
        } else if (type == QuestionType.FILL_BLANK) {
            long correct = q.getAnswers() == null ? 0 : q.getAnswers().stream().filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect())).count();
            if (correct == 0) {
                return ValidationResult.invalid("FILL_BLANK needs at least 1 correct answer");
            }
        }

        // 4. Source Record Verification (Prevent Mixing answers between records)
        String recId = q.getSourceRecordId();
        SourceRecord rec = null;
        if (recId != null && sourceRecordsMap != null) {
            rec = sourceRecordsMap.get(recId);
        }

        String correctAnswer = getCorrectAnswerText(q);

        if (rec != null) {
            String kanji = rec.getKanji();
            String reading = rec.getReading();
            String meaning = rec.getMeaning();

            if (type == QuestionType.TRUE_FALSE) {
                // Perform TRUE_FALSE statement-against-record validation
                String qText = q.getContent();
                boolean isReadingQ = qText.contains("読み方") || qText.contains("よみかた") || qText.contains("cách đọc") || qText.contains("đọc là");
                boolean isMeaningQ = qText.contains("意味") || qText.contains("nghĩa là") || qText.contains("meaning");

                // Get all quotes
                List<String> quotes = extractAllQuoted(qText);
                String testedValue = null;
                if (quotes.size() >= 2) {
                    testedValue = quotes.get(1);
                } else {
                    // Try to find if any other record's reading/meaning is present in the text
                    String remaining = qText;
                    if (quotes.size() == 1) {
                        remaining = qText.replace("「" + quotes.get(0) + "」", "")
                                            .replace("『" + quotes.get(0) + "』", "")
                                            .replace("\"" + quotes.get(0) + "\"", "")
                                            .trim();
                    }
                    if (sourceRecordsMap != null) {
                        for (SourceRecord other : sourceRecordsMap.values()) {
                            if (other.getReading() != null && !other.getReading().isBlank() && remaining.contains(other.getReading())) {
                                testedValue = other.getReading();
                                break;
                            }
                            if (other.getMeaning() != null && !other.getMeaning().isBlank() && remaining.contains(other.getMeaning())) {
                                testedValue = other.getMeaning();
                                break;
                            }
                        }
                    }
                    if (testedValue == null) {
                        if (reading != null && !reading.isBlank() && remaining.contains(reading)) {
                            testedValue = reading;
                        } else if (meaning != null && !meaning.isBlank() && remaining.contains(meaning)) {
                            testedValue = meaning;
                        }
                    }
                }

                if (testedValue == null) {
                    return ValidationResult.invalid("TRUE_FALSE statement does not specify the reading or meaning to be tested against the source record");
                }

                String normCorrect = getCorrectAnswerText(q);
                boolean isCorrectTrue = normCorrect != null && QuestionTypeValidator.isTrue(normCorrect.toLowerCase());

                if (isReadingQ) {
                    boolean isCorrectReading = testedValue.equalsIgnoreCase(reading);
                    if (isCorrectReading && !isCorrectTrue) {
                        return ValidationResult.invalid("Statement has correct reading but correctAnswer is False");
                    }
                    if (!isCorrectReading && isCorrectTrue) {
                        return ValidationResult.invalid("Statement has incorrect reading but correctAnswer is True");
                    }
                    
                    // Validate that the incorrect value is a valid reading (not nonsense)
                    if (!isCorrectReading) {
                        boolean isValidWord = false;
                        if (sourceRecordsMap != null) {
                            for (SourceRecord other : sourceRecordsMap.values()) {
                                if (testedValue.equalsIgnoreCase(other.getReading()) || testedValue.equalsIgnoreCase(other.getKanji())) {
                                    isValidWord = true;
                                    break;
                                }
                            }
                        }
                        if (!isValidWord) {
                            List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurface(testedValue);
                            if (entries.isEmpty()) {
                                entries = dictionaryEntryRepository.findByReading(testedValue);
                            }
                            isValidWord = !entries.isEmpty();
                        }
                        if (!isValidWord) {
                            // Require at least a valid Japanese kana sequence
                            boolean isKana = testedValue.matches("[\\u3040-\\u309F\\u30A0-\\u30FF]+");
                            if (!isKana) {
                                return ValidationResult.invalid("False statement uses an invalid/malformed Japanese reading: " + testedValue);
                            }
                        }
                    }
                } else if (isMeaningQ) {
                    boolean isCorrectMeaning = testedValue.equalsIgnoreCase(meaning);
                    if (isCorrectMeaning && !isCorrectTrue) {
                        return ValidationResult.invalid("Statement has correct meaning but correctAnswer is False");
                    }
                    if (!isCorrectMeaning && isCorrectTrue) {
                        return ValidationResult.invalid("Statement has incorrect meaning but correctAnswer is True");
                    }

                    // Validate that the incorrect value is not random nonsense/garbage
                    if (!isCorrectMeaning) {
                        boolean isOtherRecordMeaning = false;
                        if (sourceRecordsMap != null) {
                            for (SourceRecord other : sourceRecordsMap.values()) {
                                if (testedValue.equalsIgnoreCase(other.getMeaning())) {
                                    isOtherRecordMeaning = true;
                                    break;
                                }
                            }
                        }
                        boolean isNormalWord = testedValue.matches("[a-zA-Z\\s\\-đĐđáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]+");
                        if (!isNormalWord && !isOtherRecordMeaning) {
                            return ValidationResult.invalid("False statement uses an invalid/malformed meaning: " + testedValue);
                        }
                    }
                } else {
                    return ValidationResult.invalid("TRUE_FALSE question must explicitly test either reading or meaning");
                }
            } else {
                boolean matched = false;
                if (correctAnswer != null) {
                    String normCorrect = correctAnswer.trim().toLowerCase();
                    if (normCorrect.equals(reading.toLowerCase()) || normCorrect.equals(meaning.toLowerCase()) || normCorrect.equals(kanji.toLowerCase())) {
                        matched = true;
                    }
                }
                if (!matched) {
                    return ValidationResult.invalid("Correct answer does not match the source record properties (Kanji/Reading/Meaning)");
                }
            }

            if (q.getExplanation() != null && !q.getExplanation().isBlank()) {
                String explLower = q.getExplanation().toLowerCase();
                boolean hasThisRecRef = explLower.contains(kanji.toLowerCase()) 
                        || explLower.contains(reading.toLowerCase()) 
                        || (!meaning.isBlank() && explLower.contains(meaning.toLowerCase()));
                
                if (sourceRecordsMap != null) {
                    for (var entry : sourceRecordsMap.entrySet()) {
                        if (entry.getKey().equals(recId)) continue;
                        SourceRecord other = entry.getValue();
                        if (explLower.contains(other.getKanji().toLowerCase()) && !hasThisRecRef) {
                            return ValidationResult.invalid("Explanation contradicts answer (describes another record: " + other.getKanji() + ")");
                        }
                    }
                }
            }
        }

        // 5. Dictionary Reading / Kanji Match Validation (JMDict lookup)
        String quotedWord = extractWordInQuotes(content);
        if (quotedWord != null && correctAnswer != null && (content.contains("読み方") || content.contains("よみかた") || content.contains("どう読みますか") || content.contains("cách đọc") || content.contains("đọc là"))) {
            List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurface(quotedWord);
            if (!entries.isEmpty()) {
                boolean readingOk = false;
                for (var entry : entries) {
                    if (entry.getReading() != null && entry.getReading().trim().equalsIgnoreCase(correctAnswer.trim())) {
                        readingOk = true;
                        break;
                    }
                }
                if (!readingOk) {
                    return ValidationResult.invalid("Correct answer '" + correctAnswer + "' does not match dictionary reading for '" + quotedWord + "'");
                }
            }
        }

        // 6. Explanation Contradiction validation
        if (q.getExplanation() != null && !q.getExplanation().isBlank() && q.getAnswers() != null) {
            String explLower = q.getExplanation().toLowerCase();
            for (var ans : q.getAnswers()) {
                if (ans == null || Boolean.TRUE.equals(ans.getIsCorrect())) continue;
                String optContent = ans.getContent();
                if (optContent != null && !optContent.isBlank()) {
                    if (explLower.contains("đáp án đúng là " + optContent.toLowerCase())
                            || explLower.contains("câu trả lời đúng là " + optContent.toLowerCase())
                            || explLower.contains("correct answer is " + optContent.toLowerCase())) {
                        return ValidationResult.invalid("Explanation contradicts answer (explicitly says incorrect option is correct)");
                    }
                }
            }
        }

        // Explanation match truth value check for TRUE_FALSE
        if (type == QuestionType.TRUE_FALSE && q.getExplanation() != null && !q.getExplanation().isBlank()) {
            String explLower = q.getExplanation().toLowerCase();
            String correctAns = getCorrectAnswerText(q);
            if (correctAns != null) {
                boolean isTrueAns = QuestionTypeValidator.isTrue(correctAns.toLowerCase());
                if (isTrueAns) {
                    if (explLower.contains("đáp án đúng là sai") || explLower.contains("câu trả lời đúng là sai") 
                            || explLower.contains("đáp án là sai") || explLower.contains("correct answer is false")
                            || explLower.contains("chọn sai")) {
                        return ValidationResult.invalid("Explanation contradicts True answer by claiming False");
                    }
                } else {
                    if (explLower.contains("đáp án đúng là đúng") || explLower.contains("câu trả lời đúng là đúng")
                            || explLower.contains("đáp án là đúng") || explLower.contains("correct answer is true")
                            || explLower.contains("chọn đúng")) {
                        return ValidationResult.invalid("Explanation contradicts False answer by claiming True");
                    }
                }
            }
        }

        return ValidationResult.valid();
    }

    public boolean needsAiValidation(AiQuestionDto q) {
        if (q == null) return false;
        String type = q.getType();
        QuestionType qt = QuestionTypeValidator.normalize(type);
        if (qt == null) return false;
        
        String category = q.getCategory();
        if (category != null && category.equalsIgnoreCase("Reading")) {
            return true;
        }
        
        return false;
    }

    private String getCorrectAnswerText(AiQuestionDto q) {
        if (q.getAnswers() == null) return null;
        for (var a : q.getAnswers()) {
            if (a != null && Boolean.TRUE.equals(a.getIsCorrect())) {
                return a.getContent();
            }
        }
        return null;
    }

    private String extractWordInQuotes(String text) {
        if (text == null) return null;
        int start = text.indexOf('「');
        int close = text.indexOf('力'); 
        int close2 = text.indexOf('」');
        if (close2 != -1) {
            close = close2;
        }
        if (start != -1 && close > start) {
            return text.substring(start + 1, close).trim();
        }
        start = text.indexOf('『');
        close = text.indexOf('』');
        if (start != -1 && close > start) {
            return text.substring(start + 1, close).trim();
        }
        start = text.indexOf('"');
        close = text.indexOf('"', start + 1);
        if (start != -1 && close > start) {
            return text.substring(start + 1, close).trim();
        }
        return null;
    }

    private boolean hasProhibitedVietnamese(AiQuestionDto q) {
        if (q == null) return false;
        String type = q.getType();
        QuestionType qt = QuestionTypeValidator.normalize(type);
        
        if (qt != QuestionType.TRANSLATION) {
            if (AiExistingQuestionParser.containsVietnameseProse(q.getContent())) {
                return true;
            }
            if (q.getAnswers() != null) {
                for (var ans : q.getAnswers()) {
                    if (ans != null && AiExistingQuestionParser.containsVietnameseProse(ans.getContent())) {
                        if (qt == QuestionType.TRUE_FALSE) {
                            String lower = ans.getContent().trim().toLowerCase();
                            if (lower.equals("true") || lower.equals("false") || lower.equals("đúng") || lower.equals("sai")) {
                                continue;
                            }
                        }
                        return true;
                    }
                }
            }
        } else {
            var meta = q.getTranslationMetadata();
            if (meta != null) {
                String dir = meta.getDirection();
                if ("JA_TO_VI".equalsIgnoreCase(dir)) {
                    if (AiExistingQuestionParser.containsVietnameseProse(meta.getSourceText())) {
                        return true;
                    }
                } else if ("VI_TO_JA".equalsIgnoreCase(dir)) {
                    if (AiExistingQuestionParser.containsVietnameseProse(meta.getReferenceAnswer())) {
                        return true;
                    }
                    if (meta.getAcceptedAnswers() != null) {
                        for (String acc : meta.getAcceptedAnswers()) {
                            if (AiExistingQuestionParser.containsVietnameseProse(acc)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        if (qt == QuestionType.SENTENCE_WRITING) {
            var meta = q.getSentenceWritingMetadata();
            if (meta != null) {
                if (AiExistingQuestionParser.containsVietnameseProse(meta.getPrompt())) {
                    return true;
                }
                if (AiExistingQuestionParser.containsVietnameseProse(meta.getReferenceAnswer())) {
                    return true;
                }
                if (meta.getAcceptedAnswers() != null) {
                    for (String acc : meta.getAcceptedAnswers()) {
                        if (AiExistingQuestionParser.containsVietnameseProse(acc)) {
                            return true;
                        }
                    }
                }
            }
        }
        
        if (qt == QuestionType.ERROR_CORRECTION) {
            var meta = q.getErrorCorrectionMetadata();
            if (meta != null) {
                if (AiExistingQuestionParser.containsVietnameseProse(meta.getIncorrectText())) {
                    return true;
                }
                if (AiExistingQuestionParser.containsVietnameseProse(meta.getCorrectedText())) {
                    return true;
                }
            }
        }
        
        return false;
    }

    private boolean isInterrogative(String text) {
        if (text == null || text.isBlank()) return false;
        String trimmed = text.trim();
        
        // 1. Question mark punctuation
        if (trimmed.endsWith("?") || trimmed.endsWith("？")) {
            return true;
        }
        
        // 2. Question words/expressions
        String lower = trimmed.toLowerCase();
        
        // Japanese interrogative endings
        if (trimmed.contains("ですか") || trimmed.contains("ますか") || trimmed.contains("でしょうか")) {
            return true;
        }
        
        // If the sentence ends with か or か。 or か？, check if it contains any of the question words
        if (trimmed.endsWith("か") || trimmed.endsWith("か。")) {
            if (trimmed.contains("どれ") || trimmed.contains("何") || trimmed.contains("どう")
                    || trimmed.contains("どこ") || trimmed.contains("いつ") || trimmed.contains("だれ")
                    || trimmed.contains("誰") || trimmed.contains("どちら")) {
                return true;
            }
        }
        
        // Prominent question structures
        if (trimmed.contains("どう読みます") || trimmed.contains("何と読みます") 
                || trimmed.contains("意味は何") || trimmed.contains("意味はどれ")) {
            return true;
        }
        
        // Vietnamese / English question markers if any
        if (lower.contains("what is") || lower.contains("which is") || lower.contains("how to") 
                || lower.contains("where is") || lower.contains("who is")) {
            return true;
        }
        if (lower.contains("là gì") || lower.contains("nào") || lower.contains("phải không") 
                || lower.contains("đúng không")) {
            if (trimmed.endsWith("?") || trimmed.endsWith("？") || lower.contains("hỏi") || lower.contains("chọn")) {
                return true;
            }
        }
        
        return false;
    }

    private List<String> extractAllQuoted(String text) {
        List<String> quoted = new ArrayList<>();
        if (text == null) return quoted;
        
        // Extract all substrings between 「 and 」
        int idx = 0;
        while (true) {
            int start = text.indexOf('「', idx);
            if (start == -1) break;
            int end = text.indexOf('」', start + 1);
            if (end == -1) break;
            quoted.add(text.substring(start + 1, end).trim());
            idx = end + 1;
        }
        
        // Also extract 『 and 』
        idx = 0;
        while (true) {
            int start = text.indexOf('『', idx);
            if (start == -1) break;
            int end = text.indexOf('』', start + 1);
            if (end == -1) break;
            quoted.add(text.substring(start + 1, end).trim());
            idx = end + 1;
        }
        
        // Also double quotes
        idx = 0;
        while (true) {
            int start = text.indexOf('"', idx);
            if (start == -1) break;
            int end = text.indexOf('"', start + 1);
            if (end == -1) break;
            quoted.add(text.substring(start + 1, end).trim());
            idx = end + 1;
        }
        
        return quoted;
    }
}
