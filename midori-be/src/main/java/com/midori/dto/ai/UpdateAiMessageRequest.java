package com.midori.dto.ai;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateAiMessageRequest {

    @NotBlank(message = "Content must not be blank")
    @Size(max = 4000, message = "Content must not exceed 4000 characters")
    private String content;

    private ChatRequest.MaterialInfo selectedMaterial;
}
