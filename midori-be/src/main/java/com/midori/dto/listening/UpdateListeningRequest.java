package com.midori.dto.listening;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateListeningRequest {

    @NotNull(message = "Level ID is required")
    private UUID levelId;

    @NotBlank(message = "Title is required")
    private String title;

    private String audioUrl;

    private String audioFileName;

    private String audioType;

    private String answerKey;

    private String transcript;

    private String status;
}
