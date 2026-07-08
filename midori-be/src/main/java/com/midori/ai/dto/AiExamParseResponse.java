package com.midori.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiExamParseResponse {

    private String title;
    private String description;
    private List<AiQuestionDto> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiQuestionDto {

        @JsonProperty("type")
        private String type;

        @JsonProperty("content")
        private String content;

        @JsonProperty("difficulty")
        private String difficulty;

        @JsonProperty("explanation")
        private String explanation;

        @JsonProperty("answers")
        private List<AiAnswerDto> answers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiAnswerDto {

        @JsonProperty("content")
        private String content;

        @JsonProperty("isCorrect")
        private Boolean isCorrect;
    }
}
