package com.midori.repository;

import com.midori.entity.TeacherCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherCertificateRepository extends JpaRepository<TeacherCertificate, UUID> {

    @Query("SELECT tc FROM TeacherCertificate tc LEFT JOIN FETCH tc.teacher t LEFT JOIN FETCH t.profile WHERE tc.teacher.id = :teacherId ORDER BY tc.createdAt DESC")
    List<TeacherCertificate> findAllByTeacherIdWithTeacher(@Param("teacherId") UUID teacherId);

    @Query("SELECT tc FROM TeacherCertificate tc LEFT JOIN FETCH tc.teacher t LEFT JOIN FETCH t.profile WHERE tc.id = :id")
    Optional<TeacherCertificate> findByIdWithTeacher(@Param("id") UUID id);
}
