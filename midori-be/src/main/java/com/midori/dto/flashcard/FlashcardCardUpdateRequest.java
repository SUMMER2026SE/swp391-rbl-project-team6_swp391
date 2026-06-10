package com.midori.dto.flashcard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardCardUpdateRequest {

    @NotBlank(message = "Front text is required")
    @Size(max = 1000, message = "Front text must not exceed 1000 characters")
    private String frontText;

    @NotBlank(message = "Back text is required")
    @Size(max = 2000, message = "Back text must not exceed 2000 characters")
    private String backText;

    private String example;

    @Size(max = 500, message = "Hint must not exceed 500 characters")
    private String hint;

    private Integer orderIndex;
}
