package com.midori.repository;

import com.midori.entity.HomeworkQuestion;
import com.midori.entity.HomeworkQuestionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HomeworkQuestionRepository extends JpaRepository<HomeworkQuestion, HomeworkQuestionId> {

    @Modifying
    @Query("DELETE FROM HomeworkQuestion hq WHERE hq.question.id = :questionId")
    void deleteByQuestionId(@Param("questionId") UUID questionId);

    @Modifying
    @Query("DELETE FROM HomeworkQuestion hq WHERE hq.question.id IN :questionIds")
    void deleteByQuestionIdIn(@Param("questionIds") List<UUID> questionIds);
}
