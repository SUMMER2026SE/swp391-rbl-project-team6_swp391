package com.midori.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class AiExamParseResponse {

    private String title;
    private String description;
    private List<AiQuestionDto> questions;
    private String errorMessage;
    private boolean success = true;
    private boolean partial = false;
    private String code;
    private int requestedCount;
    private int generatedCount;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public boolean isPartial() { return partial; }
    public void setPartial(boolean partial) { this.partial = partial; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public int getRequestedCount() { return requestedCount; }
    public void setRequestedCount(int requestedCount) { this.requestedCount = requestedCount; }
    public int getGeneratedCount() { return generatedCount; }
    public void setGeneratedCount(int generatedCount) { this.generatedCount = generatedCount; }

    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public List<AiQuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<AiQuestionDto> v) { this.questions = v; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String v) { this.errorMessage = v; }

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

        // Format-specific metadata for new question types
        @JsonProperty("translationMetadata")
        private TranslationMetadataDto translationMetadata;

        @JsonProperty("sentenceWritingMetadata")
        private SentenceWritingMetadataDto sentenceWritingMetadata;

        @JsonProperty("errorCorrectionMetadata")
        private ErrorCorrectionMetadataDto errorCorrectionMetadata;

        @JsonProperty("matchingMetadata")
        private MatchingMetadataDto matchingMetadata;

        @JsonProperty("sourceRecordId")
        private String sourceRecordId;

        @JsonProperty("readingPassage")
        private String readingPassage;

        @JsonProperty("sourcePassage")
        private String sourcePassage;

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
        public TranslationMetadataDto getTranslationMetadata() { return translationMetadata; }
        public void setTranslationMetadata(TranslationMetadataDto v) { this.translationMetadata = v; }
        public SentenceWritingMetadataDto getSentenceWritingMetadata() { return sentenceWritingMetadata; }
        public void setSentenceWritingMetadata(SentenceWritingMetadataDto v) { this.sentenceWritingMetadata = v; }
        public ErrorCorrectionMetadataDto getErrorCorrectionMetadata() { return errorCorrectionMetadata; }
        public void setErrorCorrectionMetadata(ErrorCorrectionMetadataDto v) { this.errorCorrectionMetadata = v; }
        public MatchingMetadataDto getMatchingMetadata() { return matchingMetadata; }
        public void setMatchingMetadata(MatchingMetadataDto v) { this.matchingMetadata = v; }
        public String getSourceRecordId() { return sourceRecordId; }
        public void setSourceRecordId(String v) { this.sourceRecordId = v; }
        public String getReadingPassage() { return readingPassage; }
        public void setReadingPassage(String v) { this.readingPassage = v; }
        public String getSourcePassage() { return sourcePassage; }
        public void setSourcePassage(String v) { this.sourcePassage = v; }
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

    // Nested DTOs for format-specific metadata
    public static class TranslationMetadataDto {
        @JsonProperty("direction")
        private String direction;
        @JsonProperty("sourceText")
        private String sourceText;
        @JsonProperty("referenceAnswer")
        private String referenceAnswer;
        @JsonProperty("acceptedAnswers")
        private List<String> acceptedAnswers;
        @JsonProperty("sourceLanguage")
        private String sourceLanguage;
        @JsonProperty("targetLanguage")
        private String targetLanguage;

        public String getDirection() { return direction; }
        public void setDirection(String v) { this.direction = v; }
        public String getSourceText() { return sourceText; }
        public void setSourceText(String v) { this.sourceText = v; }
        public String getReferenceAnswer() { return referenceAnswer; }
        public void setReferenceAnswer(String v) { this.referenceAnswer = v; }
        public List<String> getAcceptedAnswers() { return acceptedAnswers; }
        public void setAcceptedAnswers(List<String> v) { this.acceptedAnswers = v; }
        public String getSourceLanguage() { return sourceLanguage; }
        public void setSourceLanguage(String v) { this.sourceLanguage = v; }
        public String getTargetLanguage() { return targetLanguage; }
        public void setTargetLanguage(String v) { this.targetLanguage = v; }
    }

    public static class SentenceWritingMetadataDto {
        @JsonProperty("requiredVocabulary")
        private List<String> requiredVocabulary;
        @JsonProperty("requiredGrammar")
        private List<String> requiredGrammar;
        @JsonProperty("referenceAnswer")
        private String referenceAnswer;
        @JsonProperty("acceptedAnswers")
        private List<String> acceptedAnswers;
        @JsonProperty("rubric")
        private String rubric;
        @JsonProperty("prompt")
        private String prompt;

        public List<String> getRequiredVocabulary() { return requiredVocabulary; }
        public void setRequiredVocabulary(List<String> v) { this.requiredVocabulary = v; }
        public List<String> getRequiredGrammar() { return requiredGrammar; }
        public void setRequiredGrammar(List<String> v) { this.requiredGrammar = v; }
        public String getReferenceAnswer() { return referenceAnswer; }
        public void setReferenceAnswer(String v) { this.referenceAnswer = v; }
        public List<String> getAcceptedAnswers() { return acceptedAnswers; }
        public void setAcceptedAnswers(List<String> v) { this.acceptedAnswers = v; }
        public String getRubric() { return rubric; }
        public void setRubric(String v) { this.rubric = v; }
        public String getPrompt() { return prompt; }
        public void setPrompt(String v) { this.prompt = v; }
    }

    public static class ErrorCorrectionMetadataDto {
        @JsonProperty("incorrectText")
        private String incorrectText;
        @JsonProperty("correctedText")
        private String correctedText;
        @JsonProperty("explanation")
        private String explanation;
        @JsonProperty("errorType")
        private String errorType;

        public String getIncorrectText() { return incorrectText; }
        public void setIncorrectText(String v) { this.incorrectText = v; }
        public String getCorrectedText() { return correctedText; }
        public void setCorrectedText(String v) { this.correctedText = v; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String v) { this.explanation = v; }
        public String getErrorType() { return errorType; }
        public void setErrorType(String v) { this.errorType = v; }
    }

    public static class MatchingMetadataDto {
        @JsonProperty("leftItems")
        private List<String> leftItems;
        @JsonProperty("rightItems")
        private List<String> rightItems;
        @JsonProperty("correctPairs")
        private List<MatchingPairDto> correctPairs;

        public List<String> getLeftItems() { return leftItems; }
        public void setLeftItems(List<String> v) { this.leftItems = v; }
        public List<String> getRightItems() { return rightItems; }
        public void setRightItems(List<String> v) { this.rightItems = v; }
        public List<MatchingPairDto> getCorrectPairs() { return correctPairs; }
        public void setCorrectPairs(List<MatchingPairDto> v) { this.correctPairs = v; }
    }

    public static class MatchingPairDto {
        @JsonProperty("leftIndex")
        private int leftIndex;
        @JsonProperty("rightIndex")
        private int rightIndex;

        public int getLeftIndex() { return leftIndex; }
        public void setLeftIndex(int v) { this.leftIndex = v; }
        public int getRightIndex() { return rightIndex; }
        public void setRightIndex(int v) { this.rightIndex = v; }
    }
}
