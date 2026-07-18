package com.midori.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class AiExamParseResponse {

    private String title;
    private String description;
    private List<AiQuestionDto> questions;

    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public List<AiQuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<AiQuestionDto> v) { this.questions = v; }

    /**
     * Build an empty response — used when the LLM returns a body that could
     * not be parsed as JSON, so the controller can still render a clean preview
     * without crashing.
     */
    public static AiExamParseResponse empty() {
        AiExamParseResponse r = new AiExamParseResponse();
        r.setTitle("");
        r.setDescription("");
        r.setQuestions(new ArrayList<>());
        return r;
    }

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

        @JsonProperty("category")
        private String category;

        public String getType() { return type; }
        public void setType(String v) { this.type = v; }
        public String getContent() { return content; }
        public void setContent(String v) { this.content = v; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String v) { this.difficulty = v; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String v) { this.explanation = v; }
        public List<AiAnswerDto> getAnswers() { return answers; }
        public void setAnswers(List<AiAnswerDto> v) { this.answers = v; }
        public String getCategory() { return category; }
        public void setCategory(String v) { this.category = v; }
    }

    public static class AiAnswerDto {

        @JsonProperty("content")
        private String content;

        @JsonProperty("isCorrect")
        private Boolean isCorrect;

        public String getContent() { return content; }
        public void setContent(String v) { this.content = v; }
        public Boolean getIsCorrect() { return isCorrect; }
        public void setIsCorrect(Boolean v) { this.isCorrect = v; }
    }
}
