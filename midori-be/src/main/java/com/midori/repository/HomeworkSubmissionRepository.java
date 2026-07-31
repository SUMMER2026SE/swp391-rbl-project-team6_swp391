package com.midori.repository;

import com.midori.entity.HomeworkSubmission;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, UUID> {
    List<HomeworkSubmission> findByHomeworkId(UUID homeworkId);
    List<HomeworkSubmission> findByStudentId(UUID studentId);
    Optional<HomeworkSubmission> findByHomeworkIdAndStudentId(UUID homeworkId, UUID studentId);
    Optional<HomeworkSubmission> findFirstByHomeworkIdAndStudentIdOrderBySubmittedAtDesc(UUID homeworkId, UUID studentId);
    long countByHomeworkIdAndStudentId(UUID homeworkId, UUID studentId);
    List<HomeworkSubmission> findAllByHomeworkIdAndStudentId(UUID homeworkId, UUID studentId);
    long countByHomeworkId(UUID homeworkId);
    long countByHomeworkIdAndStatus(UUID homeworkId, HomeworkSubmission.SubmissionStatus status);

    @Query("SELECT hs FROM HomeworkSubmission hs ORDER BY hs.submittedAt DESC")
    List<HomeworkSubmission> findRecentSubmissions(Pageable pageable);

    /**
     * Count distinct homeworks of a given class that the student has at least
     * one submission on. Used by the admin class-detail view to populate the
     * "submitted homework" counter per student. Using COUNT(DISTINCT) guards
     * against double-counting when a student has multiple submissions for
     * the same homework (e.g. multiple attempts within the attempts limit).
     */
    @Query("SELECT COUNT(DISTINCT hs.homework.id) FROM HomeworkSubmission hs " +
            "WHERE hs.student.id = :studentId AND hs.homework.assignedClass.id = :classId")
    long countDistinctSubmittedHomeworksByStudentAndClass(@Param("studentId") UUID studentId,
                                                          @Param("classId") UUID classId);

    /**
     * Average score across every submission the student has inside the given
     * class. Only submissions with a non-null score are considered so
     * ungraded drafts do not skew the average. Returns null when there are
     * no graded submissions — the caller must translate that to "—" / "N/A".
     */
    @Query("SELECT AVG(hs.score) FROM HomeworkSubmission hs " +
            "WHERE hs.student.id = :studentId " +
            "AND hs.homework.assignedClass.id = :classId " +
            "AND hs.score IS NOT NULL")
    Double averageScoreByStudentAndClass(@Param("studentId") UUID studentId,
                                         @Param("classId") UUID classId);

    /**
     * Average score for one homework. Same rules as above: null when there
     * are no graded submissions.
     */
    @Query("SELECT AVG(hs.score) FROM HomeworkSubmission hs " +
            "WHERE hs.homework.id = :homeworkId AND hs.score IS NOT NULL")
    Double averageScoreByHomework(@Param("homeworkId") UUID homeworkId);

    /**
     * Last submission timestamp for the student across the whole class. Used
     * to compute "last activity" for a student inside a class. Null when
     * the student has never submitted anything.
     */
    @Query("SELECT MAX(hs.submittedAt) FROM HomeworkSubmission hs " +
            "WHERE hs.student.id = :studentId " +
            "AND hs.homework.assignedClass.id = :classId")
    Instant latestSubmissionAtByStudentAndClass(@Param("studentId") UUID studentId,
                                                @Param("classId") UUID classId);

    @Query("SELECT hs FROM HomeworkSubmission hs WHERE hs.homework.assignedClass.id = :classId")
    List<HomeworkSubmission> findByHomeworkAssignedClassId(@Param("classId") UUID classId);

    List<HomeworkSubmission> findByHomeworkIdIn(List<UUID> homeworkIds);
}
