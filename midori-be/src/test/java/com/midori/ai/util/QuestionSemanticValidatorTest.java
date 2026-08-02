package com.midori.ai.util;

import com.midori.ai.dto.AiExamParseResponse.AiQuestionDto;
import com.midori.ai.dto.AiExamParseResponse.AiAnswerDto;
import com.midori.entity.DictionaryEntry;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.service.AiLearningContentService.SourceRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class QuestionSemanticValidatorTest {

    private DictionaryEntryRepository dictionaryEntryRepository;
    private QuestionSemanticValidator validator;

    @BeforeEach
    void setUp() {
        dictionaryEntryRepository = Mockito.mock(DictionaryEntryRepository.class);
        validator = new QuestionSemanticValidator(dictionaryEntryRepository);
    }

    @Test
    void validatesCorrectReadingUsingDictionary() {
        // Mock DictionaryEntry for 家族 (かぞく)
        DictionaryEntry entry = new DictionaryEntry();
        entry.setSurface("家族");
        entry.setReading("かぞく");
        when(dictionaryEntryRepository.findBySurface("家族")).thenReturn(List.of(entry));

        // Test question with correct reading
        AiQuestionDto qValid = new AiQuestionDto();
        qValid.setType("MULTIPLE_CHOICE");
        qValid.setContent("「家族」の読み方は何ですか。");
        List<AiAnswerDto> answers = new ArrayList<>();
        answers.add(createAnswer("かぞく", true));
        answers.add(createAnswer("がくせい", false));
        qValid.setAnswers(answers);

        QuestionSemanticValidator.ValidationResult resValid = validator.validate(qValid, null);
        assertTrue(resValid.isValid, "Should be valid because correct answer matches the dictionary reading");

        // Test question with incorrect reading (がくせい)
        AiQuestionDto qInvalid = new AiQuestionDto();
        qInvalid.setType("MULTIPLE_CHOICE");
        qInvalid.setContent("「家族」の読み方は何ですか。");
        List<AiAnswerDto> answersInvalid = new ArrayList<>();
        answersInvalid.add(createAnswer("がくせい", true));
        answersInvalid.add(createAnswer("かぞく", false));
        qInvalid.setAnswers(answersInvalid);

        QuestionSemanticValidator.ValidationResult resInvalid = validator.validate(qInvalid, null);
        assertFalse(resInvalid.isValid, "Should be invalid because correct answer does not match the dictionary reading");
        assertTrue(resInvalid.reason.contains("does not match dictionary reading"), "Reason should specify dictionary mismatch");
    }

    @Test
    void rejectsVietnameseProseInQuestionContent() {
        AiQuestionDto q = new AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent("Chọn đáp án đúng: 「家族」の読み方は何ですか。");
        List<AiAnswerDto> answers = new ArrayList<>();
        answers.add(createAnswer("かぞく", true));
        answers.add(createAnswer("がくせい", false));
        q.setAnswers(answers);

        QuestionSemanticValidator.ValidationResult res = validator.validate(q, null);
        assertFalse(res.isValid, "Should reject question containing Vietnamese instructions");
        assertTrue(res.reason.contains("Vietnamese prose in prohibited fields"));
    }

    @Test
    void allowsVietnameseProseInExplanation() {
        AiQuestionDto q = new AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent("「家族」の読み方は何ですか。");
        q.setExplanation("Từ này nghĩa là gia đình, đọc là かぞく.");
        List<AiAnswerDto> answers = new ArrayList<>();
        answers.add(createAnswer("かぞく", true));
        answers.add(createAnswer("がくせい", false));
        q.setAnswers(answers);

        QuestionSemanticValidator.ValidationResult res = validator.validate(q, null);
        assertTrue(res.isValid, "Should allow Vietnamese in explanation field");
    }

    @Test
    void acceptsFillBlankWithoutRequiresOptions() {
        AiQuestionDto q = new AiQuestionDto();
        q.setType("FILL_BLANK");
        q.setContent("病気ですから、___へ行きます。");
        List<AiAnswerDto> answers = new ArrayList<>();
        answers.add(createAnswer("病院", true));
        q.setAnswers(answers);

        QuestionSemanticValidator.ValidationResult res = validator.validate(q, null);
        assertTrue(res.isValid, "FILL_BLANK should be valid with only 1 correct option");
    }

    @Test
    void validatesSourceRecordsReferencing() {
        SourceRecord rec1 = new SourceRecord();
        rec1.setId("rec_1");
        rec1.setKanji("家族");
        rec1.setReading("かぞく");
        rec1.setMeaning("family");

        SourceRecord rec2 = new SourceRecord();
        rec2.setId("rec_2");
        rec2.setKanji("学生");
        rec2.setReading("がくせい");
        rec2.setMeaning("student");

        Map<String, SourceRecord> sourceMap = new HashMap<>();
        sourceMap.put(rec1.getId(), rec1);
        sourceMap.put(rec2.getId(), rec2);

        // Valid: correct answer matches rec1 properties
        AiQuestionDto qValid = new AiQuestionDto();
        qValid.setType("MULTIPLE_CHOICE");
        qValid.setSourceRecordId("rec_1");
        qValid.setContent("「家族」の読み方は何ですか。");
        List<AiAnswerDto> answers1 = new ArrayList<>();
        answers1.add(createAnswer("かぞく", true));
        answers1.add(createAnswer("がくせい", false));
        qValid.setAnswers(answers1);

        QuestionSemanticValidator.ValidationResult resValid = validator.validate(qValid, sourceMap);
        assertTrue(resValid.isValid, "Should be valid when correctAnswer aligns with target record");

        // Invalid: correct answer matches rec2 reading instead of rec1
        AiQuestionDto qInvalid = new AiQuestionDto();
        qInvalid.setType("MULTIPLE_CHOICE");
        qInvalid.setSourceRecordId("rec_1");
        qInvalid.setContent("「家族」の読み方は何ですか。");
        List<AiAnswerDto> answers2 = new ArrayList<>();
        answers2.add(createAnswer("がくせい", true)); // matches rec2, not rec1
        answers2.add(createAnswer("かぞく", false));
        qInvalid.setAnswers(answers2);

        QuestionSemanticValidator.ValidationResult resInvalid = validator.validate(qInvalid, sourceMap);
        assertFalse(resInvalid.isValid, "Should be invalid when correctAnswer matches a different source record");
        assertTrue(resInvalid.reason.contains("does not match the source record properties"));
    }

    @Test
    void rejectsExplanationContradictingCorrectAnswer() {
        AiQuestionDto q = new AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent("いすの上に猫がいます。");
        q.setExplanation("Đáp án đúng là 下."); // contradicts correctAnswer "上"
        List<AiAnswerDto> answers = new ArrayList<>();
        answers.add(createAnswer("上", true));
        answers.add(createAnswer("下", false));
        q.setAnswers(answers);
 
        QuestionSemanticValidator.ValidationResult res = validator.validate(q, null);
        assertFalse(res.isValid, "Should reject when explanation says correct answer is an incorrect option");
        assertTrue(res.reason.contains("Explanation contradicts answer"));
    }

    @Test
    void validatesTrueFalseCanonicalNormalizationAndValidation() {
        AiQuestionDto qTrue = new AiQuestionDto();
        qTrue.setType("TRUE_FALSE");
        qTrue.setContent("「学校」の読み方は「がっこう」です。");
        qTrue.setExplanation("Nhận định này là đúng.");
        List<AiAnswerDto> answers = new ArrayList<>();
        answers.add(createAnswer("đúng", true));
        answers.add(createAnswer("sai", false));
        qTrue.setAnswers(answers);

        SourceRecord rec = new SourceRecord();
        rec.setId("rec_1");
        rec.setKanji("学校");
        rec.setReading("がっこう");
        rec.setMeaning("school");
        Map<String, SourceRecord> sourceMap = Map.of("rec_1", rec);
        qTrue.setSourceRecordId("rec_1");

        QuestionSemanticValidator.ValidationResult resTrue = validator.validate(qTrue, sourceMap);
        assertTrue(resTrue.isValid, "Valid True statement with normalized answers should pass: " + resTrue.reason);
        assertEquals("True", qTrue.getAnswers().get(0).getContent());
        assertEquals("False", qTrue.getAnswers().get(1).getContent());

        // Test valid False statement (testedValue doesn't match reading, so correctAnswer must be False)
        AiQuestionDto qFalse = new AiQuestionDto();
        qFalse.setType("TRUE_FALSE");
        qFalse.setContent("「学校」の読み方は「びょういん」です。");
        qFalse.setExplanation("Nhận định này là sai vì 学校 đọc là がっこう.");
        List<AiAnswerDto> answersFalse = new ArrayList<>();
        answersFalse.add(createAnswer("False", true)); // false is correct
        answersFalse.add(createAnswer("True", false));
        qFalse.setAnswers(answersFalse);
        qFalse.setSourceRecordId("rec_1");

        // Mock other record for 'びょういん' to make it a valid distractor
        SourceRecord other = new SourceRecord();
        other.setId("rec_2");
        other.setKanji("病院");
        other.setReading("びょういん");
        other.setMeaning("hospital");
        Map<String, SourceRecord> sourceMap2 = Map.of("rec_1", rec, "rec_2", other);

        QuestionSemanticValidator.ValidationResult resFalse = validator.validate(qFalse, sourceMap2);
        assertTrue(resFalse.isValid, "Valid False statement with incorrect reading from other record should pass: " + resFalse.reason);

        // Test explanation contradicts True answer
        AiQuestionDto qContradictTrue = new AiQuestionDto();
        qContradictTrue.setType("TRUE_FALSE");
        qContradictTrue.setContent("「学校」の読み方は「がっこう」です。");
        qContradictTrue.setExplanation("đáp án là sai"); // contradicts True answer
        List<AiAnswerDto> answersContradict = new ArrayList<>();
        answersContradict.add(createAnswer("True", true));
        answersContradict.add(createAnswer("False", false));
        qContradictTrue.setAnswers(answersContradict);
        qContradictTrue.setSourceRecordId("rec_1");

        QuestionSemanticValidator.ValidationResult resContradictTrue = validator.validate(qContradictTrue, sourceMap);
        assertFalse(resContradictTrue.isValid, "Should fail when explanation contradicts True answer");

        // Test explanation contradicts False answer
        AiQuestionDto qContradictFalse = new AiQuestionDto();
        qContradictFalse.setType("TRUE_FALSE");
        qContradictFalse.setContent("「学校」の読み方は「びょういん」です。");
        qContradictFalse.setExplanation("đáp án là đúng"); // contradicts False answer
        List<AiAnswerDto> answersContradictF = new ArrayList<>();
        answersContradictF.add(createAnswer("False", true));
        answersContradictF.add(createAnswer("True", false));
        qContradictFalse.setAnswers(answersContradictF);
        qContradictFalse.setSourceRecordId("rec_1");

        QuestionSemanticValidator.ValidationResult resContradictFalse = validator.validate(qContradictFalse, sourceMap2);
        assertFalse(resContradictFalse.isValid, "Should fail when explanation contradicts False answer");

        // Test interrogative question rejected
        AiQuestionDto qInterrogative = new AiQuestionDto();
        qInterrogative.setType("TRUE_FALSE");
        qInterrogative.setContent("「学校」の読み方はどれですか。");
        List<AiAnswerDto> answersInt = new ArrayList<>();
        answersInt.add(createAnswer("True", true));
        answersInt.add(createAnswer("False", false));
        qInterrogative.setAnswers(answersInt);
        qInterrogative.setSourceRecordId("rec_1");

        QuestionSemanticValidator.ValidationResult resInterrogative = validator.validate(qInterrogative, sourceMap);
        assertFalse(resInterrogative.isValid, "Should reject interrogative question ending with ですか。");

        // Test source-record mismatch rejected (True statement with wrong correctAnswer choice)
        AiQuestionDto qMismatch = new AiQuestionDto();
        qMismatch.setType("TRUE_FALSE");
        qMismatch.setContent("「学校」の読み方は「がっこう」です。");
        List<AiAnswerDto> answersMismatch = new ArrayList<>();
        answersMismatch.add(createAnswer("False", true)); // statement is correct, so correct answer must be True, not False
        answersMismatch.add(createAnswer("True", false));
        qMismatch.setAnswers(answersMismatch);
        qMismatch.setSourceRecordId("rec_1");

        QuestionSemanticValidator.ValidationResult resMismatch = validator.validate(qMismatch, sourceMap);
        assertFalse(resMismatch.isValid, "Should fail when statement is correct but correctAnswer is False");

        // Test no regression to Fill In Blank and Multiple Choice
        AiQuestionDto qFib = new AiQuestionDto();
        qFib.setType("FILL_BLANK");
        qFib.setContent("病気ですから、___へ行きます。");
        List<AiAnswerDto> answersFib = new ArrayList<>();
        answersFib.add(createAnswer("病院", true));
        qFib.setAnswers(answersFib);

        QuestionSemanticValidator.ValidationResult resFib = validator.validate(qFib, null);
        assertTrue(resFib.isValid, "FILL_BLANK should pass without issues");

        AiQuestionDto qMcq = new AiQuestionDto();
        qMcq.setType("MULTIPLE_CHOICE");
        qMcq.setContent("「家族」の読み方は何ですか。");
        List<AiAnswerDto> answersMcq = new ArrayList<>();
        answersMcq.add(createAnswer("かぞく", true));
        answersMcq.add(createAnswer("がくせい", false));
        qMcq.setAnswers(answersMcq);
        
        // Mock DictionaryEntry for 家族 (かぞく)
        DictionaryEntry entry = new DictionaryEntry();
        entry.setSurface("家族");
        entry.setReading("かぞく");
        when(dictionaryEntryRepository.findBySurface("家族")).thenReturn(List.of(entry));

        QuestionSemanticValidator.ValidationResult resMcq = validator.validate(qMcq, null);
        assertTrue(resMcq.isValid, "MULTIPLE_CHOICE should pass without issues");
    }

    private AiAnswerDto createAnswer(String content, boolean isCorrect) {
        AiAnswerDto a = new AiAnswerDto();
        a.setContent(content);
        a.setIsCorrect(isCorrect);
        return a;
    }
}
