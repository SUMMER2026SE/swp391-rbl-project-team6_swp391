package com.midori.repository;

import com.midori.entity.QuestionBankLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionBankLessonRepository extends JpaRepository<QuestionBankLesson, Integer> {
    List<QuestionBankLesson> findByLevelOrderByLessonNumberAsc(String level);
    boolean existsByLevelAndLessonNumber(String level, Integer lessonNumber);
}
