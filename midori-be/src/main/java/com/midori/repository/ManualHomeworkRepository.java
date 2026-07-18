package com.midori.repository;

import com.midori.entity.ManualHomework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ManualHomeworkRepository extends JpaRepository<ManualHomework, UUID> {

    List<ManualHomework> findByTeacherIdAndIsDeletedFalse(UUID teacherId);

    Optional<ManualHomework> findByIdAndIsDeletedFalse(UUID id);
}
