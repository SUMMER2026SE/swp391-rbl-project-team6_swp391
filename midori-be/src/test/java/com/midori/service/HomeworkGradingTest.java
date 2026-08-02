package com.midori.service;

import com.midori.dto.request.StudentAnswerRequest;
import com.midori.entity.TeacherQuestion;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.lang.reflect.Method;
import static org.junit.jupiter.api.Assertions.*;

public class HomeworkGradingTest {

    private HomeworkServiceImpl getService() {
        return new HomeworkServiceImpl(null, null, null, null, null);
    }

    private boolean invokeIsAnswerCorrect(HomeworkServiceImpl service, TeacherQuestion q, StudentAnswerRequest ta, Integer legacy) throws Exception {
        Method m = HomeworkServiceImpl.class.getDeclaredMethod("isAnswerCorrect", TeacherQuestion.class, StudentAnswerRequest.class, Integer.class);
        m.setAccessible(true);
        return (boolean) m.invoke(service, q, ta, legacy);
    }

    private String invokeNormalizeText(HomeworkServiceImpl service, String text) throws Exception {
        Method m = HomeworkServiceImpl.class.getDeclaredMethod("normalizeText", String.class);
        m.setAccessible(true);
        return (String) m.invoke(service, text);
    }

    @Test
    public void testFillBlankGradingExactMatch() throws Exception {
        HomeworkServiceImpl service = getService();
        TeacherQuestion q = new TeacherQuestion();
        q.setQuestionType("FILL_BLANK");
        q.setOptions(List.of("い"));
        q.setCorrectAnswerIndex(0);

        StudentAnswerRequest ta = new StudentAnswerRequest();
        ta.setTextAnswer("い");

        assertTrue(invokeIsAnswerCorrect(service, q, ta, null), "FILL_BLANK exact match 'い' should be correct");
    }

    @Test
    public void testFillBlankGradingExactMatchTenki() throws Exception {
        HomeworkServiceImpl service = getService();
        TeacherQuestion q = new TeacherQuestion();
        q.setQuestionType("FILL_BLANK");
        q.setOptions(List.of("てんき"));
        q.setCorrectAnswerIndex(0);

        StudentAnswerRequest ta = new StudentAnswerRequest();
        ta.setTextAnswer("てんき");

        assertTrue(invokeIsAnswerCorrect(service, q, ta, null), "FILL_BLANK exact match 'てんき' should be correct");
    }

    @Test
    public void testNormalizePreservesChoonpu() throws Exception {
        HomeworkServiceImpl service = getService();
        String out = invokeNormalizeText(service, "コーヒー");
        assertEquals("コーヒー", out, "Katakana prolonged sound mark (ー) must be preserved during normalization");
    }

    @Test
    public void testWhitespaceNormalization() throws Exception {
        HomeworkServiceImpl service = getService();
        TeacherQuestion q = new TeacherQuestion();
        q.setQuestionType("FILL_BLANK");
        q.setOptions(List.of("てんき"));
        q.setCorrectAnswerIndex(0);

        StudentAnswerRequest ta = new StudentAnswerRequest();
        ta.setTextAnswer("  てんき  ");

        assertTrue(invokeIsAnswerCorrect(service, q, ta, null), "Whitespace padded answer should be correct");
    }

    @Test
    public void testWrongAnswerRemainsIncorrect() throws Exception {
        HomeworkServiceImpl service = getService();
        TeacherQuestion q = new TeacherQuestion();
        q.setQuestionType("FILL_BLANK");
        q.setOptions(List.of("てんき"));
        q.setCorrectAnswerIndex(0);

        StudentAnswerRequest ta = new StudentAnswerRequest();
        ta.setTextAnswer("あめ");

        assertFalse(invokeIsAnswerCorrect(service, q, ta, null), "Wrong answer 'あめ' must remain incorrect");
    }

    @Test
    public void testMcqGradingUnchanged() throws Exception {
        HomeworkServiceImpl service = getService();
        TeacherQuestion q = new TeacherQuestion();
        q.setQuestionType("MULTIPLE_CHOICE");
        q.setCorrectAnswerIndex(2);

        // Correct MCQ using legacyAnswer
        assertTrue(invokeIsAnswerCorrect(service, q, null, 2), "MCQ correct index should grade correct");
        // Incorrect MCQ using legacyAnswer
        assertFalse(invokeIsAnswerCorrect(service, q, null, 1), "MCQ incorrect index should grade incorrect");
    }

    @Test
    public void testTrueFalseGradingUnchanged() throws Exception {
        HomeworkServiceImpl service = getService();
        TeacherQuestion q = new TeacherQuestion();
        q.setQuestionType("TRUE_FALSE");
        q.setCorrectAnswerIndex(1); // false

        assertTrue(invokeIsAnswerCorrect(service, q, null, 1), "TRUE_FALSE correct index should grade correct");
        assertFalse(invokeIsAnswerCorrect(service, q, null, 0), "TRUE_FALSE incorrect index should grade incorrect");
    }
}
