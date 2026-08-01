package com.midori.ai.dto;

/**
 * Supported Writing Modes for isolated WRITING skill question generation.
 * These are modes used during generation and do not replace persistent Question Bank types.
 */
public enum WritingMode {
    MIXED_WRITING,
    JA_TO_VI_TRANSLATION,
    VI_TO_JA_TRANSLATION,
    SENTENCE_REORDER;

    /**
     * Safely parse a writing mode from a request string.
     * Defaults to MIXED_WRITING if input is null or blank.
     *
     * @param raw the request string
     * @return the corresponding WritingMode or null if invalid
     */
    public static WritingMode parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return MIXED_WRITING;
        }
        String norm = raw.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        for (WritingMode mode : values()) {
            if (mode.name().equals(norm)) {
                return mode;
            }
        }
        return null;
    }
}
