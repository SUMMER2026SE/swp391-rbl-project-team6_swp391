package com.midori.repository;

import com.midori.entity.AIUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AIUsageLogRepository extends JpaRepository<AIUsageLog, UUID> {

    List<AIUsageLog> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<AIUsageLog> findByLessonIdOrderByCreatedAtDesc(UUID lessonId);

    @Query("SELECT l.feature, COUNT(l), SUM(l.totalTokens), AVG(l.processingTime) " +
           "FROM AIUsageLog l GROUP BY l.feature")
    List<Object[]> getUsageByFeature();

    @Query("SELECT l.model, COUNT(l), SUM(l.totalTokens) FROM AIUsageLog l GROUP BY l.model")
    List<Object[]> getUsageByModel();

    @Query("SELECT FUNCTION('DATE', l.createdAt) as date, COUNT(l), SUM(l.totalTokens) " +
           "FROM AIUsageLog l GROUP BY FUNCTION('DATE', l.createdAt) ORDER BY date")
    List<Object[]> getUsageByDay();

    @Query("SELECT l.status, COUNT(l) FROM AIUsageLog l GROUP BY l.status")
    List<Object[]> getUsageByStatus();

    @Query("SELECT COUNT(DISTINCT l.userId) FROM AIUsageLog l")
    Long countDistinctUsers();

    @Query("SELECT SUM(l.totalTokens) FROM AIUsageLog l")
    Long sumTotalTokens();

    @Query("SELECT AVG(l.processingTime) FROM AIUsageLog l")
    Double avgProcessingTime();

    @Query("SELECT l FROM AIUsageLog l WHERE l.createdAt BETWEEN :start AND :end")
    List<AIUsageLog> findByDateRange(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT l.provider, l.model, COUNT(l) as cnt, SUM(l.totalTokens) as tokens " +
           "FROM AIUsageLog l GROUP BY l.provider, l.model ORDER BY cnt DESC")
    List<Object[]> getTopModels();

    @Query("SELECT l.feature, COUNT(l) as cnt FROM AIUsageLog l GROUP BY l.feature ORDER BY cnt DESC")
    List<Object[]> getTopFeatures();
}
