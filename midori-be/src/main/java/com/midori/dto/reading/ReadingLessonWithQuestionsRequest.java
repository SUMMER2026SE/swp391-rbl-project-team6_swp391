package com.midori.dto.reading;

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
public class ReadingLessonWithQuestionsRequest {

    @NotNull(message = "Lesson data is required")
    @Valid
    private ReadingLessonRequest lesson;

    @Valid
    private List<ReadingQuestionRequest> questions;
}
