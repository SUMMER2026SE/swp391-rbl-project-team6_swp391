package com.midori.service;

import com.midori.dto.questiondto.QuestionBankGeneratorLessonResponse;
import com.midori.dto.questiondto.RandomizeQuestionsRequest;
import com.midori.dto.questiondto.GeneratePreviewRequest;
import com.midori.dto.questiondto.TeacherQuestionPreviewDto;
import com.midori.entity.QuestionBankLesson;
import java.util.List;

public interface QuestionBankService {
    List<String> getLevels();
    List<String> getSkills();
    List<QuestionBankGeneratorLessonResponse> getLessons(String level, List<String> skills);
    List<QuestionBankLesson> getLessonsByLevel(String level);
    List<TeacherQuestionPreviewDto> randomizeQuestions(RandomizeQuestionsRequest request);
    List<TeacherQuestionPreviewDto> generatePreview(GeneratePreviewRequest request);
}
