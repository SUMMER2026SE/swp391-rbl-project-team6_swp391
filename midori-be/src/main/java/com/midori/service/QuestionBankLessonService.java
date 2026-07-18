package com.midori.service;

import com.midori.entity.QuestionBankLesson;

import java.util.List;

public interface QuestionBankLessonService {
    List<QuestionBankLesson> findLessonsByLevel(String level);
    QuestionBankLesson createLesson(QuestionBankLesson lesson);
    QuestionBankLesson updateLesson(Integer id, String lessonName, Integer lessonNumber, String status);
    void deleteLesson(Integer id);
    QuestionBankLesson findLessonById(Integer id);
}
