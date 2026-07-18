package com.midori.repository;

import com.midori.entity.ManualHomeworkQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ManualHomeworkQuestionRepository extends JpaRepository<ManualHomeworkQuestion, UUID> {
}
