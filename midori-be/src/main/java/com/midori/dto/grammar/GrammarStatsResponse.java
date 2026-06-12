package com.midori.dto.grammar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrammarStatsResponse {

    private long views;
    private long completions;
    private long learned;
}
