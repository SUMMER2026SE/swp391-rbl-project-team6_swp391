package com.midori.repository;

import com.midori.entity.TeacherQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeacherQuestionRepository extends JpaRepository<TeacherQuestion, UUID> {
    List<TeacherQuestion> findByTeacherId(UUID teacherId);
    List<TeacherQuestion> findByTeacherIdAndStatus(UUID teacherId, String status);
    List<TeacherQuestion> findByTeacherIdOrderByCreatedAtDesc(UUID teacherId);
    boolean existsByTeacherIdAndPrompt(UUID teacherId, String prompt);
}
