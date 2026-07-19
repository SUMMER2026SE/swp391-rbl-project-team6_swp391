package com.midori.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ExplainRequest {

    @NotBlank(message = "sentence must not be blank")
    @Size(max = 500, message = "sentence must be at most 500 characters")
    private String sentence;

    @NotBlank(message = "word must not be blank")
    @Size(max = 100, message = "word must be at most 100 characters")
    private String word;
}
