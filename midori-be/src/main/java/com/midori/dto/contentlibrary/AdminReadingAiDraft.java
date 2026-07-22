package com.midori.dto.contentlibrary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReadingAiDraft {

    private String title;
    private String description;
    private List<PassageDraft> passages;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassageDraft {
        private String title;
        private String content;
        private Integer passageOrder;
        private List<QuestionDraft> questions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDraft {
        private String questionText;
        private String questionType;
        private String explanation;
        private List<OptionDraft> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionDraft {
        private String optionText;
        private Boolean isCorrect;
    }
}
