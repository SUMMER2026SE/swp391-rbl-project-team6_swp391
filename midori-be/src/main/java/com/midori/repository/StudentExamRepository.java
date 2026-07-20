package com.midori.repository;

import com.midori.entity.StudentExam;
import com.midori.entity.StudentExamStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentExamRepository extends JpaRepository<StudentExam, UUID> {

    List<StudentExam> findByExamId(UUID examId);

    List<StudentExam> findByStudentId(UUID studentId);

    Optional<StudentExam> findByExamIdAndStudentId(UUID examId, UUID studentId);

    List<StudentExam> findByStatus(StudentExamStatus status);

    @Query("SELECT se FROM StudentExam se LEFT JOIN FETCH se.questions WHERE se.id = :id")
    Optional<StudentExam> findByIdWithQuestions(@Param("id") UUID id);

    @Query("SELECT se FROM StudentExam se LEFT JOIN FETCH se.questions WHERE se.exam.id = :examId AND se.student.id = :studentId")
    Optional<StudentExam> findByExamIdAndStudentIdWithQuestions(@Param("examId") UUID examId, @Param("studentId") UUID studentId);

    @Query("SELECT se FROM StudentExam se LEFT JOIN FETCH se.questions WHERE se.exam.id = :examId ORDER BY se.createdAt")
    List<StudentExam> findAllByExamIdWithQuestions(@Param("examId") UUID examId);

    long countByExamId(UUID examId);

    long countByStatus(StudentExamStatus status);

    List<StudentExam> findByExamAssignedClassId(UUID classId);

    @Query("SELECT se FROM StudentExam se WHERE se.submittedAt IS NOT NULL ORDER BY se.submittedAt DESC")
    List<StudentExam> findRecentCompletedExams(Pageable pageable);
}
