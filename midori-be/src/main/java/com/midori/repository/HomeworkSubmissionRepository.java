package com.midori.repository;

import com.midori.entity.HomeworkSubmission;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, UUID> {
    List<HomeworkSubmission> findByHomeworkId(UUID homeworkId);
    List<HomeworkSubmission> findByStudentId(UUID studentId);
    Optional<HomeworkSubmission> findByHomeworkIdAndStudentId(UUID homeworkId, UUID studentId);
    long countByHomeworkIdAndStudentId(UUID homeworkId, UUID studentId);
    List<HomeworkSubmission> findAllByHomeworkIdAndStudentId(UUID homeworkId, UUID studentId);
    long countByHomeworkId(UUID homeworkId);
    long countByHomeworkIdAndStatus(UUID homeworkId, HomeworkSubmission.SubmissionStatus status);

    @Query("SELECT hs FROM HomeworkSubmission hs ORDER BY hs.submittedAt DESC")
    List<HomeworkSubmission> findRecentSubmissions(Pageable pageable);
}
