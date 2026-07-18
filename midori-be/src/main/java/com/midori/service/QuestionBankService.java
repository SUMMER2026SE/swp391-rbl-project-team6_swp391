package com.midori.service;

import com.midori.dto.questiondto.QuestionBankGeneratorLessonResponse;
import com.midori.dto.questiondto.RandomizeQuestionsRequest;
import com.midori.dto.questiondto.GeneratePreviewRequest;
import com.midori.dto.questiondto.TeacherQuestionResponse;
import java.util.List;

public interface QuestionBankService {
    List<String> getLevels();
    List<String> getSkills();
    List<QuestionBankGeneratorLessonResponse> getLessons(String level, List<String> skills);
    List<com.midori.entity.QuestionBankLesson> getLessonsByLevel(String level);
    List<TeacherQuestionResponse> randomizeQuestions(RandomizeQuestionsRequest request);
    List<TeacherQuestionResponse> generatePreview(GeneratePreviewRequest request);
}
