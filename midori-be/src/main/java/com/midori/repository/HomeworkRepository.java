package com.midori.repository;

import com.midori.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, UUID> {
    List<Homework> findByAssignedClassId(UUID classId);
    List<Homework> findByAssignedClassIdOrderByCreatedAtDesc(UUID classId);
    long countByAssignedClassId(UUID classId);
    List<Homework> findByAssignedClassTeacherId(UUID teacherId);

    @org.springframework.data.jpa.repository.Query("SELECT h.assignedClass.id, COUNT(h) FROM Homework h WHERE h.status <> com.midori.entity.Homework.HomeworkStatus.CLOSED AND h.assignedClass.id IS NOT NULL GROUP BY h.assignedClass.id")
    List<Object[]> countActiveHomeworkPerClass();
}

