package com.midori.repository;

import com.midori.entity.QuestionBankLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AdminQuestionBankLessonRepository extends JpaRepository<QuestionBankLesson, Integer> {

    public interface AdminLessonSummaryProjection {
        Integer getId();
        String getLevel();
        Integer getLessonNumber();
        String getLessonName();
        String getStatus();
        Instant getCreatedAt();
        Long getQuestionCount();
    }

    @Query(
        "SELECT l.id as id, l.level as level, l.lessonNumber as lessonNumber, l.lessonName as lessonName, " +
        "l.status as status, l.createdAt as createdAt, COUNT(q.id) as questionCount " +
        "FROM QuestionBankLesson l " +
        "LEFT JOIN TeacherQuestion q ON q.lesson.id = l.id " +
        "WHERE l.level = :level " +
        "GROUP BY l.id, l.level, l.lessonNumber, l.lessonName, l.status, l.createdAt " +
        "ORDER BY l.lessonNumber ASC"
    )
    List<AdminLessonSummaryProjection> findLessonSummariesByLevel(@Param("level") String level);
}
