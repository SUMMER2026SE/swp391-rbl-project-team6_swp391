package com.midori.dto.listening;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListeningItemResponse {

    private String id;

    @JsonProperty("listeningLessonId")
    private String listeningLessonId;

    @JsonProperty("questionOrder")
    private Integer questionOrder;

    @JsonProperty("audioUrl")
    private String audioUrl;

    @JsonProperty("question")
    private String question;

    @JsonProperty("optionA")
    private String optionA;

    @JsonProperty("optionB")
    private String optionB;

    @JsonProperty("optionC")
    private String optionC;

    @JsonProperty("optionD")
    private String optionD;

    @JsonProperty("correctAnswer")
    private String correctAnswer;

    @JsonProperty("explanation")
    private String explanation;

    @JsonProperty("createdAt")
    private Instant createdAt;

    @JsonProperty("updatedAt")
    private Instant updatedAt;
}