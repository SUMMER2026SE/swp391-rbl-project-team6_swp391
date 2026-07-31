package com.midori.repository;

import com.midori.entity.QuestionBankLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionBankLessonRepository extends JpaRepository<QuestionBankLesson, Integer> {
    List<QuestionBankLesson> findByLevelOrderByLessonNumberAsc(String level);
    List<QuestionBankLesson> findByLevelAndStatusOrderByLessonNumberAsc(String level, String status);
    List<QuestionBankLesson> findAllByOrderByLessonNumberAsc();
    List<QuestionBankLesson> findAllByStatusOrderByLessonNumberAsc(String status);
    boolean existsByLevelAndLessonNumber(String level, Integer lessonNumber);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT q.lesson FROM TeacherQuestion q " +
            "WHERE q.level = :level AND q.status = 'ACTIVE' " +
            "AND q.lesson IS NOT NULL AND q.lesson.status = 'ACTIVE' " +
            "ORDER BY q.lesson.lessonNumber ASC")
    List<QuestionBankLesson> findLessonsWithActiveQuestions(@org.springframework.data.repository.query.Param("level") String level);

}
