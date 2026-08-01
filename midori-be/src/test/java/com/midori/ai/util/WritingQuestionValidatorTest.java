package com.midori.ai.util;

import com.midori.ai.dto.AiExamParseResponse.AiQuestionDto;
import com.midori.ai.dto.AiExamParseResponse.AiAnswerDto;
import com.midori.ai.dto.WritingMode;
import com.midori.entity.Difficulty;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class WritingQuestionValidatorTest {

    private AiQuestionDto createQuestion(String content, String answerText, String explanation) {
        AiQuestionDto q = new AiQuestionDto();
        q.setContent(content);
        q.setExplanation(explanation);
        q.setDifficulty("MEDIUM");
        AiAnswerDto ans = new AiAnswerDto();
        ans.setContent(answerText);
        ans.setIsCorrect(true);
        q.setAnswers(List.of(ans));
        return q;
    }

    @Test
    void testJaToViTranslationAccepted() {
        AiQuestionDto q = createQuestion("Dịch sang tiếng Việt: 私は毎朝七時に起きます。", "Tôi thức dậy vào 7 giờ mỗi sáng.", "Dịch câu trần thuật thói quen hàng ngày.");
        AiExistingQuestionParser.GenerateSanitizeResult res = WritingQuestionValidator.sanitizeWritingQuestions(
                List.of(q), WritingMode.JA_TO_VI_TRANSLATION, null, Map.of(Difficulty.MEDIUM, 1));
        assertEquals(1, res.finalCount);
        assertEquals("SHORT_ANSWER", res.questions.get(0).getType());
    }

    @Test
    void testViToJaTranslationAccepted() {
        AiQuestionDto q = createQuestion("Dịch sang tiếng Nhật: Hôm nay trần là một ngày rất đẹp trời.", "今日はとてもいい天気ですね。", "Dịch dùng thể lịch sự.");
        AiExistingQuestionParser.GenerateSanitizeResult res = WritingQuestionValidator.sanitizeWritingQuestions(
                List.of(q), WritingMode.VI_TO_JA_TRANSLATION, null, Map.of(Difficulty.MEDIUM, 1));
        assertEquals(1, res.finalCount);
        assertEquals("SHORT_ANSWER", res.questions.get(0).getType());
    }

    @Test
    void testSentenceReorderAccepted() {
        AiQuestionDto q = createQuestion("Sắp xếp các từ thành câu đúng: [食べます] / [を] / [朝ごはん] / [私] / [は]", "私は朝ごはんを食べます。", "Cấu trúc Chủ ngữ + は + Bổ ngữ + を + Động từ.");
        AiExistingQuestionParser.GenerateSanitizeResult res = WritingQuestionValidator.sanitizeWritingQuestions(
                List.of(q), WritingMode.SENTENCE_REORDER, null, Map.of(Difficulty.MEDIUM, 1));
        assertEquals(1, res.finalCount);
        assertEquals("SHORT_ANSWER", res.questions.get(0).getType());
    }

    @Test
    void testPlaceholderAnswerRejected() {
        AiQuestionDto q1 = createQuestion("Dịch câu sau: 私は学生です。", "Corrected sentence", "Giải thích");
        AiQuestionDto q2 = createQuestion("Dịch câu sau: 私は学生です。", "Present continuous form", "Giải thích");
        AiExistingQuestionParser.GenerateSanitizeResult res = WritingQuestionValidator.sanitizeWritingQuestions(
                List.of(q1, q2), WritingMode.JA_TO_VI_TRANSLATION, null, Map.of(Difficulty.MEDIUM, 2));
        assertEquals(0, res.finalCount);
        assertTrue(res.droppedByReason.containsKey("placeholder_answer") || res.droppedByReason.containsValue(res.droppedByReason.get("placeholder_answer")));
        assertEquals(2, res.droppedByReason.getOrDefault("placeholder_answer", 0));
    }

    @Test
    void testConvertedToFillBlankOrMcqRejected() {
        AiQuestionDto q1 = createQuestion("Điền từ vào chỗ trống: 私は___へ行きます。", "学校", "Giải thích");
        AiQuestionDto q2 = createQuestion("Dịch câu: Tôi đi học. A. 行く B. 食べる C. 飲む", "A", "Giải thích");
        AiExistingQuestionParser.GenerateSanitizeResult res = WritingQuestionValidator.sanitizeWritingQuestions(
                List.of(q1, q2), WritingMode.MIXED_WRITING, null, Map.of(Difficulty.MEDIUM, 2));
        assertEquals(0, res.finalCount);
        assertEquals(2, res.droppedByReason.getOrDefault("converted_to_fill_blank_or_mcq", 0));
    }

    @Test
    void testRomajiContentRejected() {
        // Japanese output should not be in Romaji
        AiQuestionDto q = createQuestion("Dịch sang tiếng Nhật: Tôi ăn cơm.", "watashi wa gohan o tabemasu.", "Giải thích");
        AiExistingQuestionParser.GenerateSanitizeResult res = WritingQuestionValidator.sanitizeWritingQuestions(
                List.of(q), WritingMode.VI_TO_JA_TRANSLATION, null, Map.of(Difficulty.MEDIUM, 1));
        assertEquals(0, res.finalCount);
        assertEquals(1, res.droppedByReason.getOrDefault("romaji_content", 0));
    }

    @Test
    void testMissingAnswerRejected() {
        AiQuestionDto q = createQuestion("Dịch sang tiếng Việt: 私は毎朝七時に起きます。", "", "Giải thích");
        AiExistingQuestionParser.GenerateSanitizeResult res = WritingQuestionValidator.sanitizeWritingQuestions(
                List.of(q), WritingMode.JA_TO_VI_TRANSLATION, null, Map.of(Difficulty.MEDIUM, 1));
        assertEquals(0, res.finalCount);
        assertEquals(1, res.droppedByReason.getOrDefault("missing_answer", 0));
    }

    @Test
    void testStrictContentFidelityInWritingPrompt() {
        String prompt = com.midori.ai.prompt.AiWritingPromptBuilder.buildWritingPrompt(
                "Sample PDF content", 5, "N3", "Easy: 30%, Medium: 50%, Hard: 20%", WritingMode.JA_TO_VI_TRANSLATION);
        assertTrue(prompt.contains("Use only sentences and information found in the uploaded PDF / learning content."));
        assertTrue(prompt.contains("Do not invent new source sentences."));
        assertTrue(prompt.contains("Do not replace vocabulary with unrelated examples."));
        assertTrue(prompt.contains("Do not paraphrase unless necessary for punctuation or spacing normalization."));
        assertTrue(prompt.contains("For translation questions, preserve the exact source sentence from the PDF."));
        assertTrue(prompt.contains("For sentence reordering, use the exact words or phrases from the PDF and only change their order."));
    }
}
