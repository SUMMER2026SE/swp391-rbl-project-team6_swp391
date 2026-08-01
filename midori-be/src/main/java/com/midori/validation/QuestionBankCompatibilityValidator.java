package com.midori.validation;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Shared validator for Question Bank skill-format compatibility.
 * Contains the single authoritative compatibility matrix.
 */
@Component
public class QuestionBankCompatibilityValidator {

    /**
     * Authoritative compatibility matrix for Question Bank.
     * Maps each skill to its compatible question formats.
     */
    private static final Map<String, Set<String>> SKILL_FORMAT_COMPATIBILITY = Map.of(
            "VOCABULARY", Set.of("MULTIPLE_CHOICE", "FILL_BLANK", "SHORT_ANSWER", "MATCHING", "TRANSLATION", "SENTENCE_WRITING"),
            "GRAMMAR", Set.of("MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER", "SENTENCE_WRITING", "ERROR_CORRECTION", "TRANSLATION"),
            "READING", Set.of("MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "FILL_BLANK", "TRANSLATION"),
            "WRITING", Set.of("TRANSLATION", "SENTENCE_WRITING", "SHORT_ANSWER", "ERROR_CORRECTION")
    );

    /**
     * Valid question formats in Question Bank.
     */
    private static final Set<String> VALID_FORMATS = Set.of(
            "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER",
            "MATCHING", "TRANSLATION", "SENTENCE_WRITING", "ERROR_CORRECTION"
    );

    /**
     * Valid skills in Question Bank.
     */
    private static final Set<String> VALID_SKILLS = Set.of(
            "VOCABULARY", "GRAMMAR", "READING", "WRITING"
    );

    /**
     * Get all valid Question Bank skills.
     */
    public Set<String> getValidSkills() {
        return VALID_SKILLS;
    }

    /**
     * Get all valid Question Bank formats.
     */
    public Set<String> getValidFormats() {
        return VALID_FORMATS;
    }

    /**
     * Get compatible formats for a given skill.
     */
    public Set<String> getCompatibleFormats(String skill) {
        if (skill == null) {
            return Collections.emptySet();
        }
        String normalizedSkill = skill.toUpperCase().trim();
        return SKILL_FORMAT_COMPATIBILITY.getOrDefault(normalizedSkill, Collections.emptySet());
    }

    /**
     * Get the union of compatible formats for multiple skills.
     */
    public Set<String> getCompatibleFormatsForSkills(Collection<String> skills) {
        if (skills == null || skills.isEmpty()) {
            return Collections.emptySet();
        }
        
        Set<String> result = new HashSet<>();
        for (String skill : skills) {
            result.addAll(getCompatibleFormats(skill));
        }
        return result;
    }

    /**
     * Check if a skill-format combination is valid.
     */
    public boolean isCompatible(String skill, String format) {
        if (skill == null || format == null) {
            return false;
        }
        String normalizedSkill = skill.toUpperCase().trim();
        String normalizedFormat = format.toUpperCase().trim();
        Set<String> compatibleFormats = SKILL_FORMAT_COMPATIBILITY.get(normalizedSkill);
        return compatibleFormats != null && compatibleFormats.contains(normalizedFormat);
    }

    /**
     * Validate that all skill-format combinations are compatible.
     * Returns an error message if invalid, null if valid.
     */
    public String validateSkillsAndFormats(Collection<String> skills, String format) {
        if (skills == null || skills.isEmpty()) {
            return "At least one skill must be selected";
        }
        
        if (format == null || format.isBlank()) {
            return "Question format is required";
        }

        String normalizedFormat = format.toUpperCase().trim();
        
        if (!VALID_FORMATS.contains(normalizedFormat)) {
            return "Invalid question format: " + format;
        }

        // Check if at least one skill is compatible with the format
        boolean hasCompatibleSkill = false;
        for (String skill : skills) {
            if (isCompatible(skill, format)) {
                hasCompatibleSkill = true;
                break;
            }
        }

        if (!hasCompatibleSkill) {
            return "Selected format '" + format + "' is not compatible with any of the selected skills. " +
                   "Compatible formats for selected skills: " + getCompatibleFormatsForSkills(skills);
        }

        return null; // Valid
    }

    /**
     * Validate multiple formats against skills.
     * Returns an error message if invalid, null if valid.
     */
    public String validateSkillsAndFormats(Collection<String> skills, Collection<String> formats) {
        if (skills == null || skills.isEmpty()) {
            return "At least one skill must be selected";
        }
        
        if (formats == null || formats.isEmpty()) {
            return "At least one question format must be selected";
        }

        // Check each format is valid
        for (String format : formats) {
            if (format == null || format.isBlank()) {
                continue;
            }
            String normalizedFormat = format.toUpperCase().trim();
            if (!VALID_FORMATS.contains(normalizedFormat)) {
                return "Invalid question format: " + format;
            }
        }

        // Check if at least one format is compatible with at least one skill
        Set<String> compatibleFormats = getCompatibleFormatsForSkills(skills);
        for (String format : formats) {
            if (format != null && !format.isBlank()) {
                String normalizedFormat = format.toUpperCase().trim();
                if (compatibleFormats.contains(normalizedFormat)) {
                    return null; // Valid - at least one compatible format
                }
            }
        }

        Set<String> skillSet = new HashSet<>();
        skills.forEach(s -> skillSet.add(s.toUpperCase().trim()));
        
        return "None of the selected formats are compatible with the selected skills. " +
               "Compatible formats for selected skills: " + compatibleFormats;
    }

    /**
     * Filter formats to only those compatible with the given skills.
     */
    public Set<String> filterCompatibleFormats(Collection<String> skills, Collection<String> formats) {
        if (formats == null) {
            return Collections.emptySet();
        }
        
        Set<String> compatibleFormats = getCompatibleFormatsForSkills(skills);
        Set<String> result = new HashSet<>();
        
        for (String format : formats) {
            if (format != null && !format.isBlank()) {
                String normalizedFormat = format.toUpperCase().trim();
                if (compatibleFormats.contains(normalizedFormat)) {
                    result.add(normalizedFormat);
                }
            }
        }
        
        return result;
    }
}
