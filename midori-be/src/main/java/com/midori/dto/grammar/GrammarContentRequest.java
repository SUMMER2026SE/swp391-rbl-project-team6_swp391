package com.midori.dto.grammar;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrammarContentRequest {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("contentOrder")
    @NotNull(message = "Content order is required")
    @Min(value = 1, message = "Content order must be at least 1")
    @Max(value = 999, message = "Content order must not exceed 999")
    private Integer contentOrder;

    @JsonProperty("pattern")
    private String pattern;

    @JsonProperty("meaning")
    private String meaning;

    @JsonProperty("structure")
    private String structure;

    @JsonProperty("usage")
    private String usage;

    @JsonProperty("examples")
    @Valid
    private List<GrammarExampleRequest> examples;
}