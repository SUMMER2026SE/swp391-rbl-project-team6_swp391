package com.midori.repository;

import com.midori.entity.FlashcardSet;
import com.midori.entity.FlashcardSetStatus;
import com.midori.entity.GrammarLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FlashcardSetRepository extends JpaRepository<FlashcardSet, UUID> {

    Optional<FlashcardSet> findById(UUID id);

    long countByStatus(FlashcardSetStatus status);

    @Query("SELECT DISTINCT fs FROM FlashcardSet fs LEFT JOIN FETCH fs.teacher t LEFT JOIN FETCH t.profile LEFT JOIN FETCH fs.cards WHERE fs.id = :id")
    Optional<FlashcardSet> findByIdWithTeacher(@Param("id") UUID id);

    @Query("SELECT fs FROM FlashcardSet fs LEFT JOIN FETCH fs.teacher t LEFT JOIN FETCH t.profile WHERE fs.teacher.id = :teacherId ORDER BY fs.createdAt DESC")
    List<FlashcardSet> findAllByTeacherIdWithTeacher(@Param("teacherId") UUID teacherId);

    @Query("SELECT fs FROM FlashcardSet fs LEFT JOIN FETCH fs.teacher t LEFT JOIN FETCH t.profile WHERE fs.status = :status ORDER BY fs.createdAt DESC")
    List<FlashcardSet> findAllByStatusWithTeacher(@Param("status") FlashcardSetStatus status);

    @Query("SELECT fs FROM FlashcardSet fs LEFT JOIN FETCH fs.teacher t LEFT JOIN FETCH t.profile WHERE fs.status = :status AND fs.level = :level ORDER BY fs.createdAt DESC")
    List<FlashcardSet> findAllByStatusAndLevelWithTeacher(@Param("status") FlashcardSetStatus status, @Param("level") GrammarLevel level);

    @Query("SELECT fs FROM FlashcardSet fs LEFT JOIN FETCH fs.teacher t LEFT JOIN FETCH t.profile WHERE fs.teacher.id = :teacherId AND fs.level = :level ORDER BY fs.createdAt DESC")
    List<FlashcardSet> findAllByTeacherIdAndLevelWithTeacher(@Param("teacherId") UUID teacherId, @Param("level") GrammarLevel level);

    @Query("SELECT fs FROM FlashcardSet fs LEFT JOIN FETCH fs.teacher t LEFT JOIN FETCH t.profile WHERE fs.teacher.id = :teacherId AND LOWER(fs.title) LIKE LOWER(CONCAT('%',:search,'%')) ORDER BY fs.createdAt DESC")
    List<FlashcardSet> searchByTeacherIdWithTeacher(@Param("teacherId") UUID teacherId, @Param("search") String search);

    @Query("SELECT fs FROM FlashcardSet fs LEFT JOIN FETCH fs.teacher t LEFT JOIN FETCH t.profile WHERE fs.status = :status AND LOWER(fs.title) LIKE LOWER(CONCAT('%',:search,'%')) ORDER BY fs.createdAt DESC")
    List<FlashcardSet> searchByStatusWithTeacher(@Param("status") FlashcardSetStatus status, @Param("search") String search);

    @Query("SELECT fs FROM FlashcardSet fs LEFT JOIN FETCH fs.teacher t LEFT JOIN FETCH t.profile WHERE fs.status = :status AND fs.level = :level AND LOWER(fs.title) LIKE LOWER(CONCAT('%',:search,'%')) ORDER BY fs.createdAt DESC")
    List<FlashcardSet> searchByStatusAndLevelWithTeacher(@Param("status") FlashcardSetStatus status, @Param("level") GrammarLevel level, @Param("search") String search);
}
