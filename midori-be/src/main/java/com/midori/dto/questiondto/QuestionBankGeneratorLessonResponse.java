package com.midori.dto.questiondto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionBankGeneratorLessonResponse {
    private Integer id;
    private String name;
    private String level;
    private Integer easy;
    private Integer medium;
    private Integer hard;
    private Integer questionCount;
}
