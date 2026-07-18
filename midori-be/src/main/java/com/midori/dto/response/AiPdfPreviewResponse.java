package com.midori.dto.response;

import java.util.List;

public class AiPdfPreviewResponse {

    private String mode;
    private String title;
    private String description;
    private int pageCount;
    private int extractedTextLength;
    private boolean likelyScanned;
    private String warning;
    private String errorMessage;
    private List<QuestionPreview> questions;

    public String getMode() { return mode; }
    public void setMode(String v) { this.mode = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public int getPageCount() { return pageCount; }
    public void setPageCount(int v) { this.pageCount = v; }
    public int getExtractedTextLength() { return extractedTextLength; }
    public void setExtractedTextLength(int v) { this.extractedTextLength = v; }
    public boolean isLikelyScanned() { return likelyScanned; }
    public void setLikelyScanned(boolean v) { this.likelyScanned = v; }
    public String getWarning() { return warning; }
    public void setWarning(String v) { this.warning = v; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String v) { this.errorMessage = v; }
    public List<QuestionPreview> getQuestions() { return questions; }
    public void setQuestions(List<QuestionPreview> v) { this.questions = v; }

    public static class QuestionPreview {
        private String type;
        private String content;
        private String difficulty;
        private String explanation;
        private List<AnswerPreview> answers;
        private String category;

        public String getType() { return type; }
        public void setType(String v) { this.type = v; }
        public String getContent() { return content; }
        public void setContent(String v) { this.content = v; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String v) { this.difficulty = v; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String v) { this.explanation = v; }
        public List<AnswerPreview> getAnswers() { return answers; }
        public void setAnswers(List<AnswerPreview> v) { this.answers = v; }
        public String getCategory() { return category; }
        public void setCategory(String v) { this.category = v; }
    }

    public static class AnswerPreview {
        private String content;
        private Boolean isCorrect;

        public String getContent() { return content; }
        public void setContent(String v) { this.content = v; }
        public Boolean getIsCorrect() { return isCorrect; }
        public void setIsCorrect(Boolean v) { this.isCorrect = v; }
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final AiPdfPreviewResponse r = new AiPdfPreviewResponse();
        public Builder mode(String v) { r.mode = v; return this; }
        public Builder title(String v) { r.title = v; return this; }
        public Builder description(String v) { r.description = v; return this; }
        public Builder pageCount(int v) { r.pageCount = v; return this; }
        public Builder extractedTextLength(int v) { r.extractedTextLength = v; return this; }
        public Builder likelyScanned(boolean v) { r.likelyScanned = v; return this; }
        public Builder warning(String v) { r.warning = v; return this; }
        public Builder errorMessage(String v) { r.errorMessage = v; return this; }
        public Builder questions(List<QuestionPreview> v) { r.questions = v; return this; }
        public AiPdfPreviewResponse build() { return r; }
    }
}
