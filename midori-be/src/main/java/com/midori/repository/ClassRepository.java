package com.midori.repository;

import com.midori.entity.ClassEntity;
import com.midori.entity.GrammarLevel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, UUID> {

    List<ClassEntity> findByTeacherId(UUID teacherId);

    List<ClassEntity> findByLevel(GrammarLevel level);

    Optional<ClassEntity> findByClassCode(String classCode);

    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.teacher LEFT JOIN FETCH c.students WHERE c.id = :id")
    ClassEntity findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.teacher LEFT JOIN FETCH c.students WHERE c.teacher.id = :teacherId AND c.status = 'ACTIVE'")
    List<ClassEntity> findActiveByTeacherId(@Param("teacherId") UUID teacherId);

    List<ClassEntity> findByStatus(ClassEntity.ClassStatus status);

    List<ClassEntity> findByTeacherIdAndStatus(UUID teacherId, ClassEntity.ClassStatus status);

    @Query(value = "SELECT c.classCode FROM ClassEntity c WHERE c.classCode LIKE :prefix% ORDER BY c.classCode DESC LIMIT 1")
    String findMaxClassCodeByPrefix(@Param("prefix") String prefix);

    @Query("SELECT c FROM ClassEntity c LEFT JOIN FETCH c.teacher ORDER BY c.createdAt DESC")
    List<ClassEntity> findRecentClasses(Pageable pageable);

    @Query("SELECT c, SIZE(c.students) FROM ClassEntity c LEFT JOIN FETCH c.teacher t LEFT JOIN FETCH t.profile ORDER BY c.createdAt DESC")
    List<Object[]> findAllWithStudentCount();
}
