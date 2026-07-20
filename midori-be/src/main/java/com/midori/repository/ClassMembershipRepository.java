package com.midori.repository;

import com.midori.entity.ClassMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassMembershipRepository extends JpaRepository<ClassMembership, UUID> {

    @Query("SELECT cm FROM ClassMembership cm WHERE cm.student.id = :studentId AND cm.classEntity.id = :classId")
    Optional<ClassMembership> findByStudentIdAndClassId(@Param("studentId") UUID studentId, @Param("classId") UUID classId);

    @Query("SELECT cm FROM ClassMembership cm WHERE cm.student.id = :studentId")
    java.util.List<ClassMembership> findByStudentId(@Param("studentId") UUID studentId);

    @Query("SELECT cm FROM ClassMembership cm ORDER BY cm.joinedAt DESC")
    java.util.List<ClassMembership> findRecentEnrollments(org.springframework.data.domain.Pageable pageable);
}
