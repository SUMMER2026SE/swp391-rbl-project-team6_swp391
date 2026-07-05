package com.midori.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAiMessageRequest {

    @NotBlank(message = "Content must not be blank")
    @Size(max = 4000, message = "Content must not exceed 4000 characters")
    private String content;
}
