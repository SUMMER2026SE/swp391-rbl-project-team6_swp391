package com.midori.dto.grammar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrammarExampleResponse {

    private UUID id;
    private UUID grammarContentId;
    private Integer exampleOrder;
    private String japanese;
    private String vietnameseMeaning;
    private Instant createdAt;
    private Instant updatedAt;
}