package com.midori.dto.listening;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListeningItemRequest {

    /**
     * Optional id used by the admin UI to identify items that already exist
     * so they can be updated instead of re-created.
     * New items get a temp- prefix or null and the backend treats them as new.
     */
    @JsonProperty("id")
    private String id;

    @JsonProperty("questionOrder")
    @NotNull(message = "Question order is required")
    @Min(value = 1, message = "Question order must be at least 1")
    private Integer questionOrder;

    @JsonProperty("audioUrl")
    @NotBlank(message = "Audio URL is required")
    private String audioUrl;

    @JsonProperty("question")
    @NotBlank(message = "Question text is required")
    private String question;

    @JsonProperty("optionA")
    @NotBlank(message = "Option A is required")
    private String optionA;

    @JsonProperty("optionB")
    @NotBlank(message = "Option B is required")
    private String optionB;

    @JsonProperty("optionC")
    @NotBlank(message = "Option C is required")
    private String optionC;

    @JsonProperty("optionD")
    @NotBlank(message = "Option D is required")
    private String optionD;

    @JsonProperty("correctAnswer")
    @NotBlank(message = "Correct answer is required")
    @Pattern(regexp = "^[A-D]$", message = "Correct answer must be A, B, C, or D")
    private String correctAnswer;

    @JsonProperty("explanation")
    private String explanation;
}