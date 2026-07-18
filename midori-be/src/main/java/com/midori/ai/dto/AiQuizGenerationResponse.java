package com.midori.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * DTO for quiz generation response from AI.
 * This matches the JSON format returned by buildQuizGenerationPrompt.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiQuizGenerationResponse {

    private List<QuizQuestion> questions;

    public List<QuizQuestion> getQuestions() { return questions; }
    public void setQuestions(List<QuizQuestion> v) { this.questions = v; }

    /**
     * A single quiz question returned by the AI. The AI may emit extra fields
     * (e.g. difficulty, skill, level, answerIndex, metadata) that this DTO
     * does not declare — they are silently ignored thanks to
     * {@code @JsonIgnoreProperties(ignoreUnknown = true)}.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QuizQuestion {

        @JsonProperty("id")
        private String id;

        @JsonProperty("type")
        private String type;

        @JsonProperty("question")
        private String question;

        @JsonProperty("options")
        private List<String> options;

        @JsonProperty("correctAnswer")
        private String correctAnswer;

        @JsonProperty("explanation")
        private String explanation;

        /**
         * Skill/category for this question. The AI is instructed to fill this
         * with one of the user-selected skills (VOCABULARY / GRAMMAR /
         * READING). The backend re-infers category from content as defense
         * in depth; this field is only a hint.
         */
        @JsonProperty("category")
        private String category;

        /**
         * Optional difficulty hint returned by the AI (e.g. "Easy", "Medium",
         * "Hard"). If present and non-blank the backend uses it; otherwise
         * the caller-supplied default difficulty is used.
         */
        @JsonProperty("difficulty")
        private String difficulty;

        public String getId() { return id; }
        public void setId(String v) { this.id = v; }
        public String getType() { return type; }
        public void setType(String v) { this.type = v; }
        public String getQuestion() { return question; }
        public void setQuestion(String v) { this.question = v; }
        public List<String> getOptions() { return options; }
        public void setOptions(List<String> v) { this.options = v; }
        public String getCorrectAnswer() { return correctAnswer; }
        public void setCorrectAnswer(String v) { this.correctAnswer = v; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String v) { this.explanation = v; }
        public String getCategory() { return category; }
        public void setCategory(String v) { this.category = v; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String v) { this.difficulty = v; }
    }
}
