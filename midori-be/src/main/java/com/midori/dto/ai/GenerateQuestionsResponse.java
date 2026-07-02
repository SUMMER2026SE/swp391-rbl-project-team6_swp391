package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class GenerateQuestionsResponse {

    private List<GeneratedQuestionDto> questions;
}
