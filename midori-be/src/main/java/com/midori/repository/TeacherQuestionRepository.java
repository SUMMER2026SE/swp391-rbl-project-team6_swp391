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

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT q FROM TeacherQuestion q LEFT JOIN FETCH q.teacher LEFT JOIN FETCH q.lesson LEFT JOIN FETCH q.options ORDER BY q.createdAt DESC")
    List<TeacherQuestion> findAllWithTeacherAndLesson();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT q FROM TeacherQuestion q LEFT JOIN FETCH q.teacher LEFT JOIN FETCH q.lesson LEFT JOIN FETCH q.options WHERE (q.teacher.id = :teacherId OR q.status = 'ACTIVE') AND (q.lesson IS NULL OR q.lesson.status = 'ACTIVE') ORDER BY q.createdAt DESC")
    List<TeacherQuestion> findQuestionsForTeacherViewWithTeacherAndLesson(@org.springframework.data.repository.query.Param("teacherId") UUID teacherId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT q FROM TeacherQuestion q LEFT JOIN FETCH q.teacher LEFT JOIN FETCH q.lesson LEFT JOIN FETCH q.options WHERE q.level = :level ORDER BY q.createdAt DESC")
    List<TeacherQuestion> findByLevelWithTeacherAndLesson(@org.springframework.data.repository.query.Param("level") String level);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT q FROM TeacherQuestion q LEFT JOIN FETCH q.teacher LEFT JOIN FETCH q.lesson LEFT JOIN FETCH q.options WHERE (q.teacher.id = :teacherId OR q.status = 'ACTIVE') AND (q.lesson IS NULL OR q.lesson.status = 'ACTIVE') AND q.level = :level ORDER BY q.createdAt DESC")
    List<TeacherQuestion> findQuestionsForTeacherViewAndLevelWithTeacherAndLesson(
        @org.springframework.data.repository.query.Param("teacherId") UUID teacherId,
        @org.springframework.data.repository.query.Param("level") String level
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

    @org.springframework.data.jpa.repository.Query("SELECT new com.midori.dto.questiondto.QuestionBankGeneratorLessonResponse(" +
            "q.lesson.id, " +
            "CONCAT('Lesson ', CAST(q.lesson.lessonNumber AS string), ': ', q.lesson.lessonName), " +
            "q.level, " +
            "CAST(SUM(CASE WHEN q.difficulty = 'EASY' THEN 1 ELSE 0 END) AS int), " +
            "CAST(SUM(CASE WHEN q.difficulty = 'MEDIUM' THEN 1 ELSE 0 END) AS int), " +
            "CAST(SUM(CASE WHEN q.difficulty = 'HARD' THEN 1 ELSE 0 END) AS int), " +
            "CAST(COUNT(q) AS int)) " +
            "FROM TeacherQuestion q " +
            "WHERE q.level = :level " +
            "AND (UPPER(q.skill) IN :skills OR UPPER(q.questionType) IN :skills) " +
            "AND q.status = 'ACTIVE' " +
            "AND q.lesson IS NOT NULL AND q.lesson.status = 'ACTIVE' " +
            "GROUP BY q.lesson.id, q.lesson.lessonNumber, q.lesson.lessonName, q.level " +
            "ORDER BY q.lesson.id")
    List<com.midori.dto.questiondto.QuestionBankGeneratorLessonResponse> findLessonSummaries(
        @org.springframework.data.repository.query.Param("level") String level,
        @org.springframework.data.repository.query.Param("skills") List<String> skills
    );

    @org.springframework.data.jpa.repository.Query("SELECT q.id as id, q.difficulty as difficulty FROM TeacherQuestion q " +
            "WHERE q.level = :level " +
            "AND (UPPER(q.skill) IN :skills OR UPPER(q.questionType) IN :skills) " +
            "AND q.status = 'ACTIVE' " +
            "AND q.lesson IS NOT NULL AND q.lesson.id IN :lessonIds " +
            "AND q.lesson.status = 'ACTIVE'")
    List<com.midori.dto.questiondto.QuestionIdDifficulty> findCandidateProjections(
        @org.springframework.data.repository.query.Param("level") String level,
        @org.springframework.data.repository.query.Param("skills") List<String> skills,
        @org.springframework.data.repository.query.Param("lessonIds") List<Integer> lessonIds
    );

    List<TeacherQuestion> findByIdIn(List<UUID> ids);

    @org.springframework.data.jpa.repository.Query(
        value = "SELECT q FROM TeacherQuestion q LEFT JOIN FETCH q.teacher LEFT JOIN FETCH q.lesson " +
                "WHERE q.lesson.id = :lessonId " +
                "AND (:search IS NULL OR :search = '' OR LOWER(q.prompt) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                "AND (:type IS NULL OR :type = '' OR UPPER(q.questionType) = UPPER(:type)) " +
                "AND (:difficulty IS NULL OR :difficulty = '' OR UPPER(q.difficulty) = UPPER(:difficulty))",
        countQuery = "SELECT count(q) FROM TeacherQuestion q WHERE q.lesson.id = :lessonId " +
                "AND (:search IS NULL OR :search = '' OR LOWER(q.prompt) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                "AND (:type IS NULL OR :type = '' OR UPPER(q.questionType) = UPPER(:type)) " +
                "AND (:difficulty IS NULL OR :difficulty = '' OR UPPER(q.difficulty) = UPPER(:difficulty))"
    )
    org.springframework.data.domain.Page<TeacherQuestion> findByLessonIdWithFilters(
        @org.springframework.data.repository.query.Param("lessonId") Integer lessonId,
        @org.springframework.data.repository.query.Param("search") String search,
        @org.springframework.data.repository.query.Param("type") String type,
        @org.springframework.data.repository.query.Param("difficulty") String difficulty,
        org.springframework.data.domain.Pageable pageable
    );

    @org.springframework.data.jpa.repository.Query("SELECT new map(" +
            "COUNT(q) as total, " +
            "SUM(CASE WHEN UPPER(q.questionType) = 'VOCABULARY' THEN 1 ELSE 0 END) as vocabulary, " +
            "SUM(CASE WHEN UPPER(q.questionType) = 'GRAMMAR' THEN 1 ELSE 0 END) as grammar, " +
            "SUM(CASE WHEN UPPER(q.questionType) = 'READING' THEN 1 ELSE 0 END) as reading, " +
            "SUM(CASE WHEN UPPER(q.questionType) = 'LISTENING' THEN 1 ELSE 0 END) as listening) " +
            "FROM TeacherQuestion q WHERE q.lesson.id = :lessonId")
    java.util.Map<String, Long> getLessonStatistics(@org.springframework.data.repository.query.Param("lessonId") Integer lessonId);
}
