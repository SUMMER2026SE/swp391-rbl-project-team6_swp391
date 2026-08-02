package com.midori.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class QuestionBankCompatibilityValidatorTest {

    private QuestionBankCompatibilityValidator validator;

    @BeforeEach
    void setUp() {
        validator = new QuestionBankCompatibilityValidator();
    }

    @Test
    @DisplayName("getValidSkills returns correct skills")
    void getValidSkills_returnsCorrectSkills() {
        Set<String> validSkills = validator.getValidSkills();
        assertEquals(4, validSkills.size());
        assertTrue(validSkills.contains("VOCABULARY"));
        assertTrue(validSkills.contains("GRAMMAR"));
        assertTrue(validSkills.contains("READING"));
        assertTrue(validSkills.contains("WRITING"));
        assertFalse(validSkills.contains("LISTENING"));
        assertFalse(validSkills.contains("KANJI"));
    }

    @Test
    @DisplayName("getValidFormats returns correct formats")
    void getValidFormats_returnsCorrectFormats() {
        Set<String> validFormats = validator.getValidFormats();
        assertEquals(8, validFormats.size());
        assertTrue(validFormats.contains("MULTIPLE_CHOICE"));
        assertTrue(validFormats.contains("TRUE_FALSE"));
        assertTrue(validFormats.contains("FILL_BLANK"));
        assertTrue(validFormats.contains("SHORT_ANSWER"));
        assertTrue(validFormats.contains("MATCHING"));
        assertTrue(validFormats.contains("TRANSLATION"));
        assertTrue(validFormats.contains("SENTENCE_WRITING"));
        assertTrue(validFormats.contains("ERROR_CORRECTION"));
    }

    @ParameterizedTest
    @DisplayName("VOCABULARY compatible with expected formats")
    @CsvSource({
            "MULTIPLE_CHOICE, true",
            "FILL_BLANK, true",
            "SHORT_ANSWER, true",
            "MATCHING, true",
            "TRANSLATION, true",
            "SENTENCE_WRITING, true",
            "TRUE_FALSE, false",
            "ERROR_CORRECTION, false"
    })
    void vocabulary_compatibility(String format, boolean expected) {
        assertEquals(expected, validator.isCompatible("VOCABULARY", format));
    }

    @ParameterizedTest
    @DisplayName("GRAMMAR compatible with expected formats")
    @CsvSource({
            "MULTIPLE_CHOICE, true",
            "TRUE_FALSE, true",
            "FILL_BLANK, true",
            "SHORT_ANSWER, true",
            "SENTENCE_WRITING, true",
            "ERROR_CORRECTION, true",
            "TRANSLATION, true",
            "MATCHING, false"
    })
    void grammar_compatibility(String format, boolean expected) {
        assertEquals(expected, validator.isCompatible("GRAMMAR", format));
    }

    @ParameterizedTest
    @DisplayName("READING compatible with expected formats")
    @CsvSource({
            "MULTIPLE_CHOICE, true",
            "TRUE_FALSE, true",
            "SHORT_ANSWER, true",
            "FILL_BLANK, true",
            "TRANSLATION, true",
            "MATCHING, false",
            "SENTENCE_WRITING, false",
            "ERROR_CORRECTION, false"
    })
    void reading_compatibility(String format, boolean expected) {
        assertEquals(expected, validator.isCompatible("READING", format));
    }

    @ParameterizedTest
    @DisplayName("WRITING compatible with expected formats")
    @CsvSource({
            "TRANSLATION, true",
            "SENTENCE_WRITING, true",
            "SHORT_ANSWER, true",
            "ERROR_CORRECTION, true",
            "MULTIPLE_CHOICE, false",
            "TRUE_FALSE, false",
            "FILL_BLANK, false",
            "MATCHING, false"
    })
    void writing_compatibility(String format, boolean expected) {
        assertEquals(expected, validator.isCompatible("WRITING", format));
    }

    @Test
    @DisplayName("isCompatible handles null values")
    void isCompatible_handlesNullValues() {
        assertFalse(validator.isCompatible(null, "MULTIPLE_CHOICE"));
        assertFalse(validator.isCompatible("VOCABULARY", null));
        assertFalse(validator.isCompatible(null, null));
    }

    @Test
    @DisplayName("isCompatible is case insensitive")
    void isCompatible_isCaseInsensitive() {
        assertTrue(validator.isCompatible("vocabulary", "multiple_choice"));
        assertTrue(validator.isCompatible("VOCABULARY", "Multiple_Choice"));
        assertTrue(validator.isCompatible("  vocabulary  ", "  multiple_choice  "));
    }

    @Test
    @DisplayName("getCompatibleFormatsForSkills returns union of formats")
    void getCompatibleFormatsForSkills_returnsUnion() {
        Set<String> formats = validator.getCompatibleFormatsForSkills(
                List.of("VOCABULARY", "GRAMMAR"));
        
        assertTrue(formats.contains("MULTIPLE_CHOICE")); // Both
        assertTrue(formats.contains("TRUE_FALSE")); // Grammar only
        assertTrue(formats.contains("MATCHING")); // Vocabulary only
        assertTrue(formats.contains("TRANSLATION")); // Both
    }

    @Test
    @DisplayName("getCompatibleFormatsForSkills handles empty input")
    void getCompatibleFormatsForSkills_handlesEmptyInput() {
        assertTrue(validator.getCompatibleFormatsForSkills(null).isEmpty());
        assertTrue(validator.getCompatibleFormatsForSkills(List.of()).isEmpty());
    }

    @Test
    @DisplayName("validateSkillsAndFormats returns null for valid combination")
    void validateSkillsAndFormats_validCombination() {
        String result = validator.validateSkillsAndFormats(
                List.of("VOCABULARY"), "MULTIPLE_CHOICE");
        assertNull(result);
    }

    @Test
    @DisplayName("validateSkillsAndFormats returns error for empty skills")
    void validateSkillsAndFormats_emptySkills() {
        String result = validator.validateSkillsAndFormats(List.of(), "MULTIPLE_CHOICE");
        assertNotNull(result);
        assertTrue(result.contains("At least one skill"));
    }

    @Test
    @DisplayName("validateSkillsAndFormats returns error for empty format")
    void validateSkillsAndFormats_emptyFormat() {
        String result = validator.validateSkillsAndFormats(List.of("VOCABULARY"), "");
        assertNotNull(result);
        assertTrue(result.contains("required"));
    }

    @Test
    @DisplayName("validateSkillsAndFormats returns error for invalid format")
    void validateSkillsAndFormats_invalidFormat() {
        String result = validator.validateSkillsAndFormats(List.of("VOCABULARY"), "INVALID_FORMAT");
        assertNotNull(result);
        assertTrue(result.contains("Invalid question format"));
    }

    @Test
    @DisplayName("validateSkillsAndFormats returns error for incompatible skill-format")
    void validateSkillsAndFormats_incompatibleCombination() {
        String result = validator.validateSkillsAndFormats(
                List.of("VOCABULARY"), "TRUE_FALSE");
        assertNotNull(result);
        assertTrue(result.contains("not compatible"));
    }

    @Test
    @DisplayName("validateSkillsAndFormats accepts incompatible formats when at least one skill is compatible")
    void validateSkillsAndFormats_acceptsPartialCompatibility() {
        // When multiple skills selected and at least one skill is compatible with the format
        String result = validator.validateSkillsAndFormats(
                List.of("VOCABULARY", "GRAMMAR"), "TRUE_FALSE");
        // Grammar supports TRUE_FALSE, so this should be valid
        assertNull(result);
    }

    @Test
    @DisplayName("filterCompatibleFormats filters correctly")
    void filterCompatibleFormats_filtersCorrectly() {
        Set<String> filtered = validator.filterCompatibleFormats(
                List.of("VOCABULARY"),
                List.of("MULTIPLE_CHOICE", "TRUE_FALSE", "ERROR_CORRECTION"));
        
        assertEquals(1, filtered.size());
        assertTrue(filtered.contains("MULTIPLE_CHOICE"));
        assertFalse(filtered.contains("TRUE_FALSE"));
        assertFalse(filtered.contains("ERROR_CORRECTION"));
    }

    @Test
    @DisplayName("validateSkillsAndFormats with multiple formats - all valid")
    void validateSkillsAndFormats_multipleFormatsAllValid() {
        String result = validator.validateSkillsAndFormats(
                List.of("VOCABULARY"),
                List.of("MULTIPLE_CHOICE", "FILL_BLANK"));
        assertNull(result);
    }

    @Test
    @DisplayName("validateSkillsAndFormats with multiple formats - none compatible")
    void validateSkillsAndFormats_multipleFormatsNoneCompatible() {
        String result = validator.validateSkillsAndFormats(
                List.of("VOCABULARY"),
                List.of("TRUE_FALSE", "ERROR_CORRECTION"));
        assertNotNull(result);
        // Check for any error message since format is incompatible
        assertFalse(result.isEmpty());
    }
}
