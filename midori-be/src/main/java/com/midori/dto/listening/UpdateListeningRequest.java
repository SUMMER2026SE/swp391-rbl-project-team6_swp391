package com.midori.dto.listening;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateListeningRequest {

    /**
     * JLPT level name (e.g. "N5", "N4", "N3", "N2", "N1").
     * The service resolves this to the corresponding UUID from the levels table.
     */
    @NotBlank(message = "Level is required")
    private String level;

    @NotBlank(message = "Title is required")
    private String title;

    private MultipartFile audioFile;

    private String audioUrl;

    private String audioFileName;

    private String audioType;

    private String meaning;

    private String transcript;

    private String status;

    private String topic;

    private String exerciseType;
}
