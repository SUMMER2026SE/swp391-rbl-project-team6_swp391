package com.midori.repository;

import com.midori.entity.TeacherStatusEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeacherStatusEventRepository extends JpaRepository<TeacherStatusEvent, UUID> {

    @Query("SELECT e FROM TeacherStatusEvent e LEFT JOIN FETCH e.teacher t LEFT JOIN FETCH t.profile LEFT JOIN FETCH e.performedBy pb LEFT JOIN FETCH pb.profile ORDER BY e.createdAt DESC")
    List<TeacherStatusEvent> findRecentEvents(Pageable pageable);

    @Query("SELECT e FROM TeacherStatusEvent e LEFT JOIN FETCH e.teacher LEFT JOIN FETCH e.performedBy WHERE e.teacher.id = :teacherId ORDER BY e.createdAt DESC")
    List<TeacherStatusEvent> findByTeacherId(@Param("teacherId") UUID teacherId);
}
