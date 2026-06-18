package com.midori.repository;

import com.midori.entity.StudentExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentExamQuestionRepository extends JpaRepository<StudentExamQuestion, UUID> {

    List<StudentExamQuestion> findByStudentExamIdOrderByDisplayOrder(UUID studentExamId);

    void deleteByStudentExamId(UUID studentExamId);
}
