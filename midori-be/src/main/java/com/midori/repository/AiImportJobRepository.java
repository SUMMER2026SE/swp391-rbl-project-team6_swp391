package com.midori.repository;

import com.midori.entity.AiImportJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiImportJobRepository extends JpaRepository<AiImportJob, UUID> {

    List<AiImportJob> findByCreatedByIdOrderByCreatedAtDesc(UUID createdById);

    @Query("SELECT j FROM AiImportJob j WHERE j.id = :id AND j.createdById = :userId")
    Optional<AiImportJob> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    List<AiImportJob> findByStatusOrderByCreatedAtDesc(AiImportJob.JobStatus status);

    long countByStatus(AiImportJob.JobStatus status);
}
