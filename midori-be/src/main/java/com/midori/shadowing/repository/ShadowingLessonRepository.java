package com.midori.shadowing.repository;

import com.midori.shadowing.entities.ShadowingLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ShadowingLessonRepository extends JpaRepository<ShadowingLesson, UUID> {
}
