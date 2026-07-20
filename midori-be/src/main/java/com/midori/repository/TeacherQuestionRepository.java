package com.midori.repository;

import com.midori.entity.TeacherQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeacherQuestionRepository extends JpaRepository<TeacherQuestion, UUID> {
    List<TeacherQuestion> findByTeacherId(UUID teacherId);
    List<TeacherQuestion> findByTeacherIdAndStatus(UUID teacherId, String status);
    List<TeacherQuestion> findByTeacherIdOrderByCreatedAtDesc(UUID teacherId);
    boolean existsByTeacherIdAndPrompt(UUID teacherId, String prompt);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT q FROM TeacherQuestion q LEFT JOIN FETCH q.options WHERE (q.teacher.id = :teacherId OR q.status = 'ACTIVE') AND (q.lesson IS NULL OR q.lesson.status = 'ACTIVE') ORDER BY q.createdAt DESC")
    List<TeacherQuestion> findByTeacherIdOrStatusActiveOrderByCreatedAtDesc(
        @org.springframework.data.repository.query.Param("teacherId") UUID teacherId
    );
    
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT q FROM TeacherQuestion q LEFT JOIN FETCH q.options WHERE q.status = :status ORDER BY q.createdAt DESC")
    List<TeacherQuestion> findByStatusOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("status") String status);

    @org.springframework.data.jpa.repository.Query("SELECT q FROM TeacherQuestion q " +
            "WHERE q.level = :level " +
            "AND (UPPER(q.skill) IN :skills OR UPPER(q.questionType) IN :skills) " +
            "AND q.status = 'ACTIVE'")
    List<TeacherQuestion> findByLevelAndSkillInAndStatusActive(
        @org.springframework.data.repository.query.Param("level") String level,
        @org.springframework.data.repository.query.Param("skills") List<String> skills
    );

    @org.springframework.data.jpa.repository.Query("SELECT q FROM TeacherQuestion q WHERE q.level = :level " +
            "AND (UPPER(q.skill) IN :skills OR UPPER(q.questionType) IN :skills) " +
            "AND q.difficulty = :difficulty " +
            "AND q.status = 'ACTIVE' " +
            "AND q.lesson IS NOT NULL AND q.lesson.id IN :lessonIds " +
            "AND q.lesson.status = 'ACTIVE'")
    List<TeacherQuestion> findCandidates(
        @org.springframework.data.repository.query.Param("level") String level,
        @org.springframework.data.repository.query.Param("skills") List<String> skills,
        @org.springframework.data.repository.query.Param("difficulty") String difficulty,
        @org.springframework.data.repository.query.Param("lessonIds") List<Integer> lessonIds
    );

    List<TeacherQuestion> findByTopicIdAndStatus(String topicId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT q FROM TeacherQuestion q " +
            "WHERE q.level = :level " +
            "AND (LOWER(q.skill) = LOWER(:skill) OR LOWER(q.questionType) = LOWER(:skill)) " +
            "AND q.lesson.id = :lessonId " +
            "AND q.status = 'ACTIVE' " +
            "ORDER BY q.createdAt DESC")
    List<TeacherQuestion> findActiveByLevelSkillAndLesson(
        @org.springframework.data.repository.query.Param("level") String level,
        @org.springframework.data.repository.query.Param("skill") String skill,
        @org.springframework.data.repository.query.Param("lessonId") Integer lessonId
    );

    @org.springframework.data.jpa.repository.Query("SELECT q FROM TeacherQuestion q " +
            "WHERE q.topicId = :topicId AND q.status = 'ACTIVE' ORDER BY q.createdAt DESC")
    List<TeacherQuestion> findActiveByTopicId(
        @org.springframework.data.repository.query.Param("topicId") String topicId
    );
    List<TeacherQuestion> findByLessonId(Integer lessonId);
}
