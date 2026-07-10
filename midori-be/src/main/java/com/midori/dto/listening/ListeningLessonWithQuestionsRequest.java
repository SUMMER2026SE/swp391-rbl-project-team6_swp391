package com.midori.dto.listening;

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
public class ListeningLessonWithQuestionsRequest {

    @NotNull(message = "Lesson data is required")
    @Valid
    private ListeningLessonRequest lesson;

    @Valid
    private List<ListeningQuestionRequest> questions;
}
