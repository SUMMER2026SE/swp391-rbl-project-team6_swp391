package com.midori.repository;

import com.midori.entity.StudentLearningAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentLearningAccessRepository extends JpaRepository<StudentLearningAccess, UUID> {

    Optional<StudentLearningAccess> findByStudentIdAndLevel(UUID studentId, String level);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM StudentLearningAccess a " +
           "WHERE a.student.id = :studentId " +
           "AND a.level = :level " +
           "AND a.status = :status " +
           "AND a.accessExpireAt > :currentTime")
    boolean existsByStudentIdAndLevelAndStatusAndAccessExpireAtAfter(
            @Param("studentId") UUID studentId,
            @Param("level") String level,
            @Param("status") StudentLearningAccess.AccessStatus status,
            @Param("currentTime") Instant currentTime);

    @Query("SELECT a.level FROM StudentLearningAccess a " +
           "WHERE a.student.id = :studentId " +
           "AND a.status = :status " +
           "AND a.accessExpireAt > :currentTime")
    java.util.List<String> findActiveLevelsByStudentId(
            @Param("studentId") UUID studentId,
            @Param("status") StudentLearningAccess.AccessStatus status,
            @Param("currentTime") Instant currentTime);
}
