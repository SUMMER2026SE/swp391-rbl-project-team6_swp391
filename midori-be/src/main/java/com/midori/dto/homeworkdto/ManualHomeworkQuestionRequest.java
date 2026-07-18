package com.midori.dto.homeworkdto;

import com.midori.entity.Difficulty;
import com.midori.entity.QuestionType;
import com.midori.entity.SkillType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ManualHomeworkQuestionRequest {
    private UUID id;

    @NotNull
    private Integer questionOrder;

    @NotNull
    private QuestionType questionType;

    @NotBlank
    private String content;

    private List<String> options;

    @NotBlank
    private String correctAnswer;

    private String explanation;

    @NotNull
    private Difficulty difficulty;

    @NotNull
    private Integer points;

    private SkillType skill;

    private String imageUrl;
}
