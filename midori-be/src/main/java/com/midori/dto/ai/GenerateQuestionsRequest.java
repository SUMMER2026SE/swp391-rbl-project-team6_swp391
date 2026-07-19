package com.midori.dto.ai;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class GenerateQuestionsRequest {

    /**
     * Free-text topic for legacy / no-material quiz generation. When a
     * database material reference (materialId + materialType) is present,
     * the backend still uses this field as the user-visible topic label
     * but the authoritative content comes from the database.
     */
    @NotBlank(message = "Topic is required")
    @Size(max = 255, message = "Topic must be at most 255 characters")
    private String topic;

    /**
     * Optional lesson UUID. When paired with {@link #materialType}, the
     * backend resolves the material through {@code AiMaterialService} and
     * ignores {@link #materialContent}.
     */
    private UUID materialId;

    /**
     * Optional material type discriminator (VOCABULARY | GRAMMAR | READING | LISTENING).
     * Required when {@link #materialId} is present.
     */
    private String materialType;

    /**
     * Legacy / display-only field. NOT trusted as authoritative lesson
     * content when a database reference (materialId + materialType) is
     * supplied.
     */
    @Size(max = 12000, message = "Material title must be at most 255 characters")
    private String materialTitle;

    /**
     * Legacy / client-supplied body. NOT trusted when a database reference
     * is present. May be useful for manual topic-based generation when
     * no material id is supplied.
     */
    @Size(max = 12000, message = "Material content must be at most 12000 characters")
    private String materialContent;

    @NotBlank(message = "Level is required")
    @Size(max = 20, message = "Level must be at most 20 characters")
    private String level;

    @NotNull(message = "Count is required")
    @Min(value = 1, message = "Count must be at least 1")
    @Max(value = 20, message = "Count must be at most 20")
    private Integer count;

    @NotBlank(message = "Question type is required")
    @Pattern(regexp = "^(MULTIPLE_CHOICE|TRUE_FALSE|FILL_BLANK|MIXED)$", message = "Invalid question type")
    private String type;

    public String getNormalizedType() {
        String raw = type;
        if (raw == null) return "MULTIPLE_CHOICE";
        return switch (raw.trim().toUpperCase()) {
            case "TRUE_FALSE", "FILL_BLANK", "MIXED" -> raw.trim().toUpperCase();
            default -> "MULTIPLE_CHOICE";
        };
    }

    /**
     * Cross-field rule mirroring {@code ChatRequest.MaterialInfo}: a database
     * material reference must include BOTH materialId AND materialType.
     */
    @AssertTrue(message = "Material reference must include both 'materialId' and 'materialType', or neither. Partial references are rejected.")
    public boolean isValidMaterialReference() {
        boolean hasId = materialId != null;
        boolean hasType = materialType != null && !materialType.isBlank();
        return (hasId && hasType) || (!hasId && !hasType);
    }

    /**
     * True iff this payload carries a real database material reference.
     */
    public boolean hasDatabaseReference() {
        return materialId != null && materialType != null && !materialType.isBlank();
    }
}
