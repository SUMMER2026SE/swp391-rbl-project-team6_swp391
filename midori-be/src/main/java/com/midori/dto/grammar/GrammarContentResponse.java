package com.midori.dto.grammar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrammarContentResponse {

    private UUID id;
    private UUID grammarLessonId;
    private Integer contentOrder;
    private String pattern;
    private String meaning;
    private String structure;
    private String usage;
    private List<GrammarExampleResponse> examples;
    private Instant createdAt;
    private Instant updatedAt;
}