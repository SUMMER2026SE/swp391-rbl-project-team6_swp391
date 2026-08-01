package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Format-specific metadata for ERROR_CORRECTION questions.
 * Contains the incorrect sentence, corrected version, and explanation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorCorrectionMetadata {
    /** The incorrect sentence containing the error */
    private String incorrectText;
    /** The corrected sentence */
    private String correctedText;
    /** Brief explanation of the error and correction */
    private String explanation;
    /** Location/type of error (optional, e.g., "particle", "conjugation") */
    private String errorType;
}
