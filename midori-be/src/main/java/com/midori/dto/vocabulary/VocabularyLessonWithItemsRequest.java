package com.midori.dto.vocabulary;

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
public class VocabularyLessonWithItemsRequest {

    @NotNull(message = "Lesson data is required")
    @Valid
    private VocabularyLessonRequest lesson;

    @Valid
    private List<VocabularyItemRequest> items;
}