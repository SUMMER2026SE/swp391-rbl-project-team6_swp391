package com.midori.repository;

import com.midori.entity.ClassStatusEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassStatusEventRepository extends JpaRepository<ClassStatusEvent, UUID> {

    @Query("SELECT e FROM ClassStatusEvent e LEFT JOIN FETCH e.classEntity LEFT JOIN FETCH e.performedBy ORDER BY e.createdAt DESC")
    List<ClassStatusEvent> findRecentEvents(Pageable pageable);

    @Query("SELECT e FROM ClassStatusEvent e LEFT JOIN FETCH e.classEntity LEFT JOIN FETCH e.performedBy WHERE e.classEntity.id = :classId ORDER BY e.createdAt DESC")
    List<ClassStatusEvent> findByClassId(@Param("classId") UUID classId);
}
