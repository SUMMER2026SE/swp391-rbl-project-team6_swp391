package com.midori.dto.grammar;

import jakarta.validation.Valid;
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
public class GrammarLessonWithContentsRequest {

    @NotNull(message = "Lesson data is required")
    @Valid
    private GrammarLessonRequest lesson;

    @Valid
    private List<GrammarContentRequest> contents;
}