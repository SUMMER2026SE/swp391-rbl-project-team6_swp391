package com.midori.dto.reading;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingPassageRequest {

    private String id;

    @NotNull(message = "Passage order is required")
    @Min(value = 1, message = "Passage order must be at least 1")
    @Max(value = 999, message = "Passage order must not exceed 999")
    private Integer passageOrder;

    @NotBlank(message = "Passage content is required")
    private String passage;

    private String vietnameseTranslation;

    @Valid
    private List<ReadingQuestionRequest> questions;
}
