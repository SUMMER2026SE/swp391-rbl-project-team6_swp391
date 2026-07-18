package com.midori.dto.grammar;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrammarExampleRequest {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("exampleOrder")
    @NotNull(message = "Example order is required")
    @Min(value = 1, message = "Example order must be at least 1")
    @Max(value = 999, message = "Example order must not exceed 999")
    private Integer exampleOrder;

    @JsonProperty("japanese")
    @NotBlank(message = "Japanese example is required")
    private String japanese;

    @JsonProperty("vietnameseMeaning")
    private String vietnameseMeaning;
}