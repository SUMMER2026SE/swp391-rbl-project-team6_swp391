package com.midori.repository;

import com.midori.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, UUID> {

    List<ExamQuestion> findByExamId(UUID examId);

    @Query("SELECT q FROM ExamQuestion q WHERE q.exam.id = :examId ORDER BY q.displayOrder")
    List<ExamQuestion> findByExamIdOrdered(@Param("examId") UUID examId);

    @Query("SELECT q FROM ExamQuestion q WHERE q.sourceGrammarId = :grammarId")
    List<ExamQuestion> findBySourceGrammarId(@Param("grammarId") UUID grammarId);

    void deleteByExamId(UUID examId);
}
