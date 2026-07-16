package com.midori.dto.homeworkdto;

import com.midori.entity.Difficulty;
import com.midori.entity.QuestionType;
import com.midori.entity.SkillType;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ManualHomeworkQuestionResponse {
    private UUID id;
    private Integer questionOrder;
    private QuestionType questionType;
    private String content;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
    private Difficulty difficulty;
    private Integer points;
    private SkillType skill;
    private String imageUrl;
}
