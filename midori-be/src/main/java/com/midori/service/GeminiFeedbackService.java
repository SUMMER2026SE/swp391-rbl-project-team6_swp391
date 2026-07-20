package com.midori.service;

import com.midori.ai.core.AiCoreService;
import com.midori.dto.shadowing.PronunciationFeedback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiFeedbackService {

    private final AiCoreService aiCoreService;

    public PronunciationFeedback generateFeedback(String reference, String studentTranscript) {
        long start = System.currentTimeMillis();

        String prompt = """
                You are an experienced Japanese pronunciation teacher.

                Reference sentence:
                %s

                Student transcript:
                %s

                The transcript differs from the reference.
                Explain:
                - pronunciation mistakes
                - missing words
                - incorrect words
                - how to improve

                Return ONLY JSON in this exact format:
                {
                  "feedback":[
                     "...",
                     "..."
                  ],
                  "tips":[
                     "...",
                     "..."
                  ]
                }
                """.formatted(reference, studentTranscript);

        try {
            String response = aiCoreService.chat(
                    "You are an experienced Japanese pronunciation teacher. Respond ONLY with JSON.",
                    prompt,
                    java.util.Collections.emptyList()
            );

            String cleaned = cleanJson(response);
            PronunciationFeedback feedback = parseFeedback(cleaned);
            log.info("[GeminiFeedbackService] duration={}ms", System.currentTimeMillis() - start);
            return feedback;
        } catch (Exception ex) {
            log.warn("[GeminiFeedbackService] fallback to local feedback: {}", ex.getMessage());
            return localFeedback(reference, studentTranscript);
        }
    }

    private String cleanJson(String value) {
        if (value == null) return "{}";
        int start = value.indexOf('{');
        int end = value.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return value.substring(start, end + 1);
        }
        return value;
    }

    private PronunciationFeedback parseFeedback(String json) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(json);
            java.util.List<String> feedback = new java.util.ArrayList<>();
            java.util.List<String> tips = new java.util.ArrayList<>();

            com.fasterxml.jackson.databind.JsonNode feedbackNode = node.get("feedback");
            if (feedbackNode != null && feedbackNode.isArray()) {
                feedbackNode.forEach(item -> {
                    if (item.isTextual()) feedback.add(item.asText());
                });
            }

            com.fasterxml.jackson.databind.JsonNode tipsNode = node.get("tips");
            if (tipsNode != null && tipsNode.isArray()) {
                tipsNode.forEach(item -> {
                    if (item.isTextual()) tips.add(item.asText());
                });
            }

            if (feedback.isEmpty()) {
                feedback.add("Compare the student transcript with the reference sentence and focus on missing or wrong words.");
            }
            if (tips.isEmpty()) {
                tips.add("Repeat the reference sentence slowly and match each word.");
            }

            return PronunciationFeedback.builder()
                    .feedback(feedback)
                    .tips(tips)
                    .build();
        } catch (Exception ex) {
            return localFeedback("", "");
        }
    }

    private PronunciationFeedback localFeedback(String reference, String studentTranscript) {
        return PronunciationFeedback.builder()
                .feedback(java.util.List.of(
                        "Transcript differs from the reference.",
                        "Review missing and incorrect words carefully."
                ))
                .tips(java.util.List.of(
                        "Listen to the reference audio and shadow it sentence by sentence.",
                        "Record again and focus on the marked differences."
                ))
                .build();
    }
}
