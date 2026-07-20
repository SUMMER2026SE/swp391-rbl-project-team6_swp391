package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.repository.AiConversationRepository;
import com.midori.repository.AiMessageRepository;
import com.midori.service.impl.AiServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.lang.reflect.Method;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Final verification test — runs the exact user-reported payload through
 * {@code AiServiceImpl.generateQuestions(...)} and prints the
 * per-question normalized type. This is what the running JVM produces.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiMixedFinalVerificationTest {

    @Mock AiConversationRepository conversationRepository;
    @Mock AiMessageRepository messageRepository;
    @Mock AiCoreService aiCoreService;
    @Mock AiRateLimitService rateLimitService;
    @Mock AiMaterialService aiMaterialService;

    @Test
    void verify_user_reported_question_is_now_FILL_BLANK() throws Exception {
        // Exactly what the user reported in the browser:
        //   Displayed type: MULTIPLE_CHOICE
        //   Question: わたしの ____ は リンです。
        //   Options: missing
        //   Fill-blank input: missing
        //   Question cannot be answered
        String aiJson = "{" +
                "\"questions\":[" +
                "{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\"," +
                "\"question\":\"わたしの ____ は リンです。\"," +
                "\"options\":[]," +
                "\"correctAnswer\":\"名前\"}," +
                "{\"id\":\"q1\",\"type\":\"MULTIPLE_CHOICE\"," +
                "\"question\":\"「学校」の読み方は?\"," +
                "\"options\":[\"がっこう\",\"がくこう\",\"まなび\",\"けんきゅう\"]," +
                "\"correctAnswer\":\"がっこう\"}," +
                "{\"id\":\"q2\",\"type\":\"\"," +
                "\"question\":\"日本語を勉強____。\"," +
                "\"options\":[]," +
                "\"correctAnswer\":\"する\"}" +
                "]}";

        AiServiceImpl impl = new AiServiceImpl(
                conversationRepository, messageRepository, aiCoreService,
                rateLimitService, aiMaterialService, new ObjectMapper(), false);

        when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                .thenReturn(aiJson);

        var response = impl.generateQuestions(
                UUID.randomUUID(), "Tieng Nhat N5", "N5", 3, "MIXED",
                null, null, null, null);

        // Print summary.
        StringBuilder sb = new StringBuilder();
        sb.append("\n=== FINAL VERIFICATION ===\n");
        sb.append("[USER-REPORTED QUESTION]: わたしの ____ は リンです。\n");
        sb.append("[BEFORE FIX]: type=MULTIPLE_CHOICE, options=[] -> renderer shows nothing\n");
        sb.append("[AFTER FIX]:  \n");
        List<com.midori.dto.ai.GeneratedQuestionDto> raw = response.getQuestions();
        for (int i = 0; i < raw.size(); i++) {
            var q = raw.get(i);
            sb.append("  q").append(i).append(": id=").append(q.getId())
                    .append(" type=").append(q.getType())
                    .append(" options=").append(q.getOptions())
                    .append(" correctAnswer=").append(q.getCorrectAnswer())
                    .append(" question=").append(q.getQuestionText())
                    .append("\n");
        }
        var frontend = response.getQuestionsForFrontend();
        sb.append("[FRONTEND SHAPE]: ").append(frontend.size()).append(" questions\n");
        for (var fq : frontend) {
            sb.append("  - ").append(fq.getId()).append(": ").append(fq.getType())
                    .append(" options=").append(fq.getOptions())
                    .append(" hasAnswer=").append(fq.getCorrectAnswer() != null && !fq.getCorrectAnswer().isBlank())
                    .append("\n");
        }
        sb.append("=== END FINAL VERIFICATION ===\n");
        System.out.println(sb.toString());

        // Assertions: the user-reported question must be FILL_BLANK
        // (so the renderer shows the input), and no MC question has zero
        // options.
        var q0 = raw.stream().filter(q -> "q0".equals(q.getId())).findFirst().orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("FILL_BLANK", q0.getType());
        org.junit.jupiter.api.Assertions.assertTrue(q0.getOptions() == null || q0.getOptions().isEmpty());

        var q1 = raw.stream().filter(q -> "q1".equals(q.getId())).findFirst().orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("MULTIPLE_CHOICE", q1.getType());
        org.junit.jupiter.api.Assertions.assertEquals(4, q1.getOptions().size());

        var q2 = raw.stream().filter(q -> "q2".equals(q.getId())).findFirst().orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("FILL_BLANK", q2.getType());

        for (var fq : frontend) {
            if ("MULTIPLE_CHOICE".equals(fq.getType())) {
                org.junit.jupiter.api.Assertions.assertTrue(fq.getOptions().size() >= 2);
            }
        }
    }
}
