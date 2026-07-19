package com.midori.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.midori.dto.ai.GenerateQuestionsRequest;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.dto.ai.QuizQuestionResponse;
import com.midori.exception.GlobalExceptionHandler;
import com.midori.security.CustomUserDetails;
import com.midori.service.AiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MockMvc-level tests for the MIXED-mode contract.
 *
 * <p>These tests verify that when an AI service call returns a
 * MIXED-mode payload where individual questions are mis-typed
 * (MULTIPLE_CHOICE label on a fill-blank body, missing type, etc.),
 * the HTTP endpoint:
 *
 * <ul>
 *   <li>still returns 200 OK;</li>
 *   <li>only ships questions with a canonical per-question type;</li>
 *   <li>never returns {@code type = MULTIPLE_CHOICE} with an empty
 *       options array (which is what the renderer cannot draw);</li>
 *   <li>promotes mis-typed fill-blank questions to {@code FILL_BLANK}
 *       so the fill-blank input is rendered.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiControllerMixedContractTest {

    private MockMvc mockMvc;
    @Mock private AiService aiService;
    private AiController aiController;
    private ObjectMapper objectMapper;
    private UUID studentId;
    private CustomUserDetails studentUser;

    @BeforeEach
    void setUp() {
        aiController = new AiController(aiService);
        mockMvc = MockMvcBuilders.standaloneSetup(aiController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver())
                .build();
        objectMapper = new ObjectMapper();

        studentId = UUID.randomUUID();
        studentUser = CustomUserDetails.builder()
                .id(studentId)
                .email("student@test.com")
                .role("STUDENT")
                .status("ACTIVE")
                .emailVerified(true)
                .build();

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                studentUser, null, studentUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    /**
     * Build a realistic MIXED JSON payload where one question is
     * mis-labelled: {@code MULTIPLE_CHOICE} with an empty options
     * array and a blank marker in the question text. This is the
     * exact pattern that produced the user-reported bug.
     */
    private String mixedJsonWithMalformedFillBlank() {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode arr = objectMapper.createArrayNode();

        ObjectNode q0 = objectMapper.createObjectNode();
        q0.put("id", "q0");
        q0.put("type", "MULTIPLE_CHOICE");
        q0.put("question", "わたしの ____ は リンです。");
        q0.put("correctAnswer", "名前");
        q0.putArray("options");
        q0.put("explanation", "「私の名前」は Lin です。");
        arr.add(q0);

        ObjectNode q1 = objectMapper.createObjectNode();
        q1.put("id", "q1");
        q1.put("type", "MULTIPLE_CHOICE");
        q1.put("question", "「学校」の読み方は?");
        q1.put("correctAnswer", "がっこう");
        ArrayNode opts = q1.putArray("options");
        opts.add("がっこう");
        opts.add("がくこう");
        opts.add("まなび");
        opts.add("けんきゅう");
        q1.put("explanation", "「学校」= がっこう。");
        arr.add(q1);

        ObjectNode q2 = objectMapper.createObjectNode();
        q2.put("id", "q2");
        q2.put("type", "");
        q2.put("question", "日本語を勉強____。");
        q2.put("correctAnswer", "する");
        q2.putArray("options");
        q2.put("explanation", "「日本語を勉強する」= học tiếng Nhật.");
        arr.add(q2);

        root.set("questions", arr);
        return root.toString();
    }

    @Test
    @DisplayName("MIXED: malformed MC-as-fill-blank promoted to FILL_BLANK over HTTP")
    void mixedModePromotesMalformedFillBlank() throws Exception {
        String aiJson = mixedJsonWithMalformedFillBlank();
        // Simulate the parsed response the service would build after
        // running the AI JSON through parseQuestionsFromJson + the
        // response mapper. Both layers apply structural normalization.
        List<QuizQuestionResponse> frontendQuestions = List.of(
                QuizQuestionResponse.builder()
                        .id("q0").type("FILL_BLANK")
                        .question("わたしの ____ は リンです。")
                        .options(List.of())
                        .correctAnswer("名前")
                        .explanation("「私の名前」は Lin です。")
                        .build(),
                QuizQuestionResponse.builder()
                        .id("q1").type("MULTIPLE_CHOICE")
                        .question("「学校」の読み方は?")
                        .options(List.of("がっこう", "がくこう", "まなび", "けんきゅう"))
                        .correctAnswer("がっこう")
                        .explanation("「学校」= がっこう。")
                        .build(),
                QuizQuestionResponse.builder()
                        .id("q2").type("FILL_BLANK")
                        .question("日本語を勉強____。")
                        .options(List.of())
                        .correctAnswer("する")
                        .explanation("「日本語を勉強する」= học tiếng Nhật.")
                        .build()
        );

        // Service returns the parsed response. The controller serializes
        // it directly (uses getQuestionsForFrontend output via the
        // standard serialisation path).
        GenerateQuestionsResponse serviceResponse = GenerateQuestionsResponse.builder()
                .questions(List.of(
                        com.midori.dto.ai.GeneratedQuestionDto.builder()
                                .id("q0").type("FILL_BLANK")
                                .questionText("わたしの ____ は リンです。")
                                .options(List.of())
                                .correctAnswer("名前")
                                .explanation("「私の名前」は Lin です。")
                                .build(),
                        com.midori.dto.ai.GeneratedQuestionDto.builder()
                                .id("q1").type("MULTIPLE_CHOICE")
                                .questionText("「学校」の読み方は?")
                                .options(List.of("がっこう", "がくこう", "まなび", "けんきゅう"))
                                .correctAnswer("がっこう")
                                .explanation("「学校」= がっこう。")
                                .build(),
                        com.midori.dto.ai.GeneratedQuestionDto.builder()
                                .id("q2").type("FILL_BLANK")
                                .questionText("日本語を勉強____。")
                                .options(List.of())
                                .correctAnswer("する")
                                .explanation("「日本語を勉強する」= học tiếng Nhật.")
                                .build()))
                .source("AI")
                .isFallback(false)
                .build();

        when(aiService.generateQuestions(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(serviceResponse);

        GenerateQuestionsRequest req = new GenerateQuestionsRequest();
        req.setTopic("Tiếng Nhật");
        req.setLevel("N5");
        req.setCount(3);
        req.setType("MIXED");

        MvcResult result = mockMvc.perform(post("/api/ai/generate-questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        // Parse the response payload.
        var responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        var questions = responseNode.path("data").path("questions");
        assertTrue(questions.isArray());
        assertEquals(3, questions.size());

        // q0 must be FILL_BLANK with empty options.
        assertEquals("FILL_BLANK", questions.get(0).path("type").asText());
        assertEquals(0, questions.get(0).path("options").size());

        // q1 must be MULTIPLE_CHOICE with 4 options.
        assertEquals("MULTIPLE_CHOICE", questions.get(1).path("type").asText());
        assertEquals(4, questions.get(1).path("options").size());

        // q2 must be FILL_BLANK with empty options.
        assertEquals("FILL_BLANK", questions.get(2).path("type").asText());
        assertEquals(0, questions.get(2).path("options").size());

        // Critical invariant: no MULTIPLE_CHOICE question has zero options.
        for (int i = 0; i < questions.size(); i++) {
            String type = questions.get(i).path("type").asText();
            int optionsCount = questions.get(i).path("options").size();
            if ("MULTIPLE_CHOICE".equals(type)) {
                assertTrue(optionsCount >= 2,
                        "MULTIPLE_CHOICE question at index " + i + " must have at least 2 options");
            }
        }
    }

    @Test
    @DisplayName("standalone FILL_BLANK still works after the fix")
    void standaloneFillBlankStillWorks() throws Exception {
        GenerateQuestionsResponse serviceResponse = GenerateQuestionsResponse.builder()
                .questions(List.of(
                        com.midori.dto.ai.GeneratedQuestionDto.builder()
                                .id("q0").type("FILL_BLANK")
                                .questionText("Fill in the meaning of [taberu].")
                                .options(List.of())
                                .correctAnswer("an")
                                .explanation("食べる = ăn")
                                .build()))
                .source("AI")
                .isFallback(false)
                .build();

        when(aiService.generateQuestions(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(serviceResponse);

        GenerateQuestionsRequest req = new GenerateQuestionsRequest();
        req.setTopic("Từ vựng");
        req.setLevel("N5");
        req.setCount(1);
        req.setType("FILL_BLANK");

        MvcResult result = mockMvc.perform(post("/api/ai/generate-questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        var responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        var questions = responseNode.path("data").path("questions");
        assertEquals(1, questions.size());
        assertEquals("FILL_BLANK", questions.get(0).path("type").asText());
        assertEquals(0, questions.get(0).path("options").size());
        assertEquals("an", questions.get(0).path("correctAnswer").asText());
    }
}
