package com.midori.repository;

import com.midori.entity.Exam;
import com.midori.entity.ExamStatus;
import com.midori.entity.GrammarLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID> {

    List<Exam> findByStatus(ExamStatus status);

    List<Exam> findByLevel(GrammarLevel level);

    List<Exam> findByCreatedById(UUID userId);

    @Query("SELECT DISTINCT e FROM Exam e LEFT JOIN FETCH e.questions LEFT JOIN FETCH e.assignedClass WHERE e.id = :id")
    Optional<Exam> findByIdWithQuestions(@Param("id") UUID id);

    @Query("SELECT DISTINCT e FROM Exam e LEFT JOIN FETCH e.questions LEFT JOIN FETCH e.assignedClass WHERE e.createdBy.id = :userId ORDER BY e.createdAt DESC")
    List<Exam> findAllByCreatorWithQuestions(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT e FROM Exam e LEFT JOIN FETCH e.questions LEFT JOIN FETCH e.assignedClass WHERE e.status = :status ORDER BY e.createdAt DESC")
    List<Exam> findAllByStatusWithQuestions(@Param("status") ExamStatus status);

    @Query("SELECT DISTINCT e FROM Exam e LEFT JOIN FETCH e.questions LEFT JOIN FETCH e.assignedClass ORDER BY e.createdAt DESC")
    List<Exam> findAllWithQuestions();

    @Query("SELECT DISTINCT e FROM Exam e LEFT JOIN FETCH e.questions LEFT JOIN FETCH e.assignedClass WHERE e.assignedClass.id = :classId ORDER BY e.createdAt DESC")
    List<Exam> findByAssignedClassIdWithQuestions(@Param("classId") UUID classId);

    long countByStatus(ExamStatus status);

    List<Exam> findByAssignedClassId(UUID classId);

    @Query("SELECT e.assignedClass.id, COUNT(e) FROM Exam e WHERE e.status = com.midori.entity.ExamStatus.PUBLISHED AND e.assignedClass.id IS NOT NULL GROUP BY e.assignedClass.id")
    List<Object[]> countUpcomingExamsPerClass();
}
