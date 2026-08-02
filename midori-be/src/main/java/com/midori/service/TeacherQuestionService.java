package com.midori.service;

import com.midori.entity.TeacherQuestion;

import java.util.List;
import java.util.UUID;

public interface TeacherQuestionService {
    TeacherQuestion createQuestion(TeacherQuestion question);
    List<TeacherQuestion> createQuestions(List<TeacherQuestion> questions);
    TeacherQuestion updateQuestion(UUID id, TeacherQuestion questionDetails, UUID teacherId);
    void deleteQuestion(UUID id, UUID teacherId);
    TeacherQuestion findQuestionById(UUID id, UUID teacherId);
    List<TeacherQuestion> findQuestionsByTeacher(UUID teacherId);
    List<TeacherQuestion> findQuestionsForTeacherView(UUID teacherId);
    List<TeacherQuestion> findCentralizedQuestions();
}
