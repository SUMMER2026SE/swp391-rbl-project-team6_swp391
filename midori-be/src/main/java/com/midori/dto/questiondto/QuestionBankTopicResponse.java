package com.midori.dto.questiondto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionBankTopicResponse {
    private String id;
    private String name;
    private String jpName;
    private String level;
    private String skill;
    private Integer easy;
    private Integer medium;
    private Integer hard;
    private Integer totalQuestions;
}
