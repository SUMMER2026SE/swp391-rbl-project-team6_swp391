package com.midori.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.dto.ai.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Round-trip tests for format metadata serialization/deserialization.
 * Verifies that format-specific metadata can be serialized to JSON
 * and deserialized back correctly for all new question formats.
 */
class TeacherQuestionFormatMetadataTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("TRANSLATION metadata round-trip: full metadata")
    void translationMetadata_roundTrip() throws Exception {
        TranslationMetadata original = new TranslationMetadata();
        original.setSourceLanguage("JA_TO_VI");
        original.setTargetLanguage("VI_TO_JA");
        original.setDirection("JA_TO_VI");
        original.setReferenceAnswer("学校 meaning is \"school\"");
        original.setAcceptedAnswers(List.of("Trường học", "Trường"));

        String json = objectMapper.writeValueAsString(original);
        TranslationMetadata deserialized = objectMapper.readValue(json, TranslationMetadata.class);

        assertEquals("JA_TO_VI", deserialized.getSourceLanguage());
        assertEquals("VI_TO_JA", deserialized.getTargetLanguage());
        assertEquals("JA_TO_VI", deserialized.getDirection());
        assertEquals("学校 meaning is \"school\"", deserialized.getReferenceAnswer());
        assertEquals(2, deserialized.getAcceptedAnswers().size());
        assertTrue(deserialized.getAcceptedAnswers().contains("Trường học"));
    }

    @Test
    @DisplayName("TRANSLATION metadata round-trip: minimal metadata")
    void translationMetadata_roundTrip_minimal() throws Exception {
        TranslationMetadata original = new TranslationMetadata();
        original.setDirection("VI_TO_JA");
        original.setReferenceAnswer("Test");

        String json = objectMapper.writeValueAsString(original);
        TranslationMetadata deserialized = objectMapper.readValue(json, TranslationMetadata.class);

        assertEquals("VI_TO_JA", deserialized.getDirection());
        assertEquals("Test", deserialized.getReferenceAnswer());
    }

    @Test
    @DisplayName("SENTENCE_WRITING metadata round-trip: full metadata")
    void sentenceWritingMetadata_roundTrip() throws Exception {
        SentenceWritingMetadata original = new SentenceWritingMetadata();
        original.setRequiredVocabulary(List.of("学校", "行く"));
        original.setRequiredGrammar(List.of("〜に行く"));
        original.setReferenceAnswer("私は学校に行きます。");
        original.setRubric("Uses correct grammar pattern and vocabulary");
        original.setAcceptedAnswers(List.of(
            "私は学校に行きます。",
            "私はがっこうに行きます。"
        ));

        String json = objectMapper.writeValueAsString(original);
        SentenceWritingMetadata deserialized = objectMapper.readValue(json, SentenceWritingMetadata.class);

        assertEquals(2, deserialized.getRequiredVocabulary().size());
        assertTrue(deserialized.getRequiredVocabulary().contains("学校"));
        assertEquals(1, deserialized.getRequiredGrammar().size());
        assertTrue(deserialized.getRequiredGrammar().contains("〜に行く"));
        assertEquals("私は学校に行きます。", deserialized.getReferenceAnswer());
        assertEquals("Uses correct grammar pattern and vocabulary", deserialized.getRubric());
        assertEquals(2, deserialized.getAcceptedAnswers().size());
    }

    @Test
    @DisplayName("ERROR_CORRECTION metadata round-trip: full metadata")
    void errorCorrectionMetadata_roundTrip() throws Exception {
        ErrorCorrectionMetadata original = new ErrorCorrectionMetadata();
        original.setIncorrectText("私は 学校に 行きます。");
        original.setCorrectedText("私は学校に行きます。");
        original.setExplanation("No space needed within a word");
        original.setErrorType("Spacing");

        String json = objectMapper.writeValueAsString(original);
        ErrorCorrectionMetadata deserialized = objectMapper.readValue(json, ErrorCorrectionMetadata.class);

        assertEquals("私は 学校に 行きます。", deserialized.getIncorrectText());
        assertEquals("私は学校に行きます。", deserialized.getCorrectedText());
        assertEquals("No space needed within a word", deserialized.getExplanation());
        assertEquals("Spacing", deserialized.getErrorType());
    }

    @Test
    @DisplayName("MATCHING metadata round-trip: full metadata")
    void matchingMetadata_roundTrip() throws Exception {
        MatchingMetadata original = new MatchingMetadata();
        original.setLeftItems(List.of("学校", "先生", "学生"));
        original.setRightItems(List.of("School", "Teacher", "Student"));
        original.setCorrectPairs(List.of(
            MatchingPair.builder().leftIndex(0).rightIndex(0).build(),
            MatchingPair.builder().leftIndex(1).rightIndex(1).build(),
            MatchingPair.builder().leftIndex(2).rightIndex(2).build()
        ));

        String json = objectMapper.writeValueAsString(original);
        MatchingMetadata deserialized = objectMapper.readValue(json, MatchingMetadata.class);

        assertEquals(3, deserialized.getLeftItems().size());
        assertEquals(3, deserialized.getRightItems().size());
        assertEquals(3, deserialized.getCorrectPairs().size());
        assertEquals(0, deserialized.getCorrectPairs().get(0).getLeftIndex());
        assertEquals(0, deserialized.getCorrectPairs().get(0).getRightIndex());
    }

    @Test
    @DisplayName("MATCHING metadata round-trip: empty pairs")
    void matchingMetadata_roundTrip_empty() throws Exception {
        MatchingMetadata original = new MatchingMetadata();
        original.setLeftItems(List.of("学校"));
        original.setRightItems(List.of("School"));

        String json = objectMapper.writeValueAsString(original);
        MatchingMetadata deserialized = objectMapper.readValue(json, MatchingMetadata.class);

        assertEquals(1, deserialized.getLeftItems().size());
        assertEquals(1, deserialized.getRightItems().size());
        assertTrue(deserialized.getCorrectPairs() == null || deserialized.getCorrectPairs().isEmpty());
    }

    @Test
    @DisplayName("Backward compatibility: null format_metadata should deserialize gracefully")
    void nullFormatMetadata_handledGracefully() throws Exception {
        // Simulating a question with no format metadata
        String json = "{}";
        
        TranslationMetadata deserialized = objectMapper.readValue(json, TranslationMetadata.class);
        
        assertNull(deserialized.getDirection());
        assertNull(deserialized.getReferenceAnswer());
        assertNull(deserialized.getAcceptedAnswers());
    }

    // Note: GeneratedQuestionDto uses @AllArgsConstructor but not @NoArgsConstructor,
    // so it cannot be deserialized directly. This is a DTO design limitation.
    // In practice, questions are deserialized via the TeacherQuestionController's
    // ObjectMapper configuration which handles the format_metadata JSON string separately.

    @Test
    @DisplayName("Format metadata as JSON string round-trip")
    void formatMetadata_asJsonString_roundTrip() throws Exception {
        // This simulates how format_metadata is stored in TeacherQuestion
        TranslationMetadata original = new TranslationMetadata();
        original.setDirection("JA_TO_VI");
        original.setReferenceAnswer("Answer");
        original.setAcceptedAnswers(List.of("Valid1", "Valid2"));

        // Serialize as JSON string (like in format_metadata column)
        String jsonString = objectMapper.writeValueAsString(original);
        assertTrue(jsonString.contains("JA_TO_VI"));
        assertTrue(jsonString.contains("Answer"));

        // Deserialize back
        TranslationMetadata deserialized = objectMapper.readValue(jsonString, TranslationMetadata.class);
        assertEquals("JA_TO_VI", deserialized.getDirection());
        assertEquals("Answer", deserialized.getReferenceAnswer());
        assertEquals(2, deserialized.getAcceptedAnswers().size());
    }

    @Test
    @DisplayName("Multiple format metadata types as separate JSON strings")
    void multipleFormatMetadata_asSeparateJsonStrings() throws Exception {
        // Test all metadata types can be serialized and deserialized independently
        TranslationMetadata tm = new TranslationMetadata();
        tm.setDirection("JA_TO_VI");
        String tmJson = objectMapper.writeValueAsString(tm);
        TranslationMetadata tmDeser = objectMapper.readValue(tmJson, TranslationMetadata.class);
        assertEquals("JA_TO_VI", tmDeser.getDirection());

        SentenceWritingMetadata swm = new SentenceWritingMetadata();
        swm.setRubric("Check grammar");
        String swmJson = objectMapper.writeValueAsString(swm);
        SentenceWritingMetadata swmDeser = objectMapper.readValue(swmJson, SentenceWritingMetadata.class);
        assertEquals("Check grammar", swmDeser.getRubric());

        ErrorCorrectionMetadata ecm = new ErrorCorrectionMetadata();
        ecm.setExplanation("Fix spacing");
        String ecmJson = objectMapper.writeValueAsString(ecm);
        ErrorCorrectionMetadata ecmDeser = objectMapper.readValue(ecmJson, ErrorCorrectionMetadata.class);
        assertEquals("Fix spacing", ecmDeser.getExplanation());

        MatchingMetadata mm = new MatchingMetadata();
        mm.setLeftItems(List.of("A", "B"));
        mm.setRightItems(List.of("X", "Y"));
        mm.setCorrectPairs(List.of(
            MatchingPair.builder().leftIndex(0).rightIndex(0).build()
        ));
        String mmJson = objectMapper.writeValueAsString(mm);
        MatchingMetadata mmDeser = objectMapper.readValue(mmJson, MatchingMetadata.class);
        assertEquals(2, mmDeser.getLeftItems().size());
        assertEquals(1, mmDeser.getCorrectPairs().size());
    }
}
