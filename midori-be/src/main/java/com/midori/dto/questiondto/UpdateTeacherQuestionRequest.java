package com.midori.dto.questiondto;

import com.midori.dto.ai.ErrorCorrectionMetadata;
import com.midori.dto.ai.MatchingMetadata;
import com.midori.dto.ai.SentenceWritingMetadata;
import com.midori.dto.ai.TranslationMetadata;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class UpdateTeacherQuestionRequest {
    private String topicId;
    private String level;
    private String skill;
    private Integer lessonId;
    @NotBlank
    private String prompt;
    private String jpPrompt;
    @NotBlank
    private String questionType;
    private String difficulty;
    @NotNull
    private Integer correctAnswerIndex;
    private String explanation;
    private String tags;
    private Integer points;
    private String status;
    private List<String> options;
    private String audioUrl;
    private String audioFileName;
    private Integer audioDuration;
    // Format-specific metadata
    private TranslationMetadata translationMetadata;
    private SentenceWritingMetadata sentenceWritingMetadata;
    private ErrorCorrectionMetadata errorCorrectionMetadata;
    private MatchingMetadata matchingMetadata;
    private String formatMetadata;
}
