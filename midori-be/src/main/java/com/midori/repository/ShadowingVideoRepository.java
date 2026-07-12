package com.midori.repository;

import com.midori.entity.ShadowingStatus;
import com.midori.entity.ShadowingVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShadowingVideoRepository extends JpaRepository<ShadowingVideo, UUID> {

    List<ShadowingVideo> findByStatus(ShadowingStatus status);

    List<ShadowingVideo> findByStatusOrderByCreatedAtDesc(ShadowingStatus status);

    List<ShadowingVideo> findAllByOrderByCreatedAtDesc();

    boolean existsByTitle(String title);
}
