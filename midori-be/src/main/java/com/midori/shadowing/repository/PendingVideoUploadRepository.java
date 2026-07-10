package com.midori.shadowing.repository;

import com.midori.shadowing.entities.PendingVideoUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PendingVideoUploadRepository extends JpaRepository<PendingVideoUpload, UUID> {
    Optional<PendingVideoUpload> findByVideoId(String videoId);
}
