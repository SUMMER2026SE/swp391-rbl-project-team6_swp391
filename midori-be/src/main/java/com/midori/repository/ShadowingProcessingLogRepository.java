package com.midori.repository;

import com.midori.entity.ProcessingStep;
import com.midori.entity.ProcessingStatus;
import com.midori.entity.ShadowingProcessingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShadowingProcessingLogRepository extends JpaRepository<ShadowingProcessingLog, UUID> {

    List<ShadowingProcessingLog> findByShadowingVideoIdOrderByCreatedAtAsc(UUID videoId);

    Optional<ShadowingProcessingLog> findTopByShadowingVideoIdAndStepOrderByCreatedAtDesc(
            UUID videoId, ProcessingStep step);

    List<ShadowingProcessingLog> findByShadowingVideoIdAndStatus(UUID videoId, ProcessingStatus status);
}
