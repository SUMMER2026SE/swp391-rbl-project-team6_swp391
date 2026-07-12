package com.midori.dto.shadowing;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShadowingVideoRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private String videoUrl;

    private String storagePath;

    private String thumbnailUrl;

    private Integer duration;
}
