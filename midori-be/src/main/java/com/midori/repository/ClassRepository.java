package com.midori.repository;

import com.midori.entity.ClassEntity;
import com.midori.entity.GrammarLevel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, UUID> {

    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.teacher WHERE c.teacher.id = :teacherId")
    List<ClassEntity> findByTeacherId(@Param("teacherId") UUID teacherId);

    List<ClassEntity> findByLevel(GrammarLevel level);

    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.teacher LEFT JOIN FETCH c.students WHERE c.id = :id")
    ClassEntity findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.teacher LEFT JOIN FETCH c.students WHERE c.teacher.id = :teacherId AND c.status = 'ACTIVE'")
    List<ClassEntity> findActiveByTeacherId(@Param("teacherId") UUID teacherId);

    List<ClassEntity> findByStatus(ClassEntity.ClassStatus status);

    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.teacher WHERE c.teacher.id = :teacherId AND c.status = :status")
    List<ClassEntity> findByTeacherIdAndStatus(@Param("teacherId") UUID teacherId, @Param("status") ClassEntity.ClassStatus status);

    @Query("SELECT COUNT(DISTINCT s.id) FROM ClassEntity c JOIN c.students s")
    long countDistinctStudentsAcrossAllClasses();

    /**
     * Aggregate class counts per teacher. Each row is { teacherId, classCount }.
     * Only teachers that own at least one class are returned.
     */
    @Query("SELECT c.teacher.id, COUNT(c) FROM ClassEntity c GROUP BY c.teacher.id")
    List<Object[]> countClassesPerTeacher();

    /**
     * Aggregate distinct student counts per teacher. Each row is
     * { teacherId, studentCount }. Only teachers that own at least one class
     * with students are returned.
     */
    @Query("SELECT c.teacher.id, COUNT(DISTINCT s.id) FROM ClassEntity c JOIN c.students s GROUP BY c.teacher.id")
    List<Object[]> countStudentsPerTeacher();

    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.teacher t LEFT JOIN FETCH t.profile ORDER BY c.createdAt DESC")
    List<ClassEntity> findRecent(Pageable pageable);
}
