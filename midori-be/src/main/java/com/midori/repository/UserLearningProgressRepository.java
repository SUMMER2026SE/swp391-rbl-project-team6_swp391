package com.midori.repository;

import com.midori.entity.ContentType;
import com.midori.entity.UserLearningProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserLearningProgressRepository extends JpaRepository<UserLearningProgress, UUID> {

    Optional<UserLearningProgress> findById(UUID id);

    @Query("SELECT p FROM UserLearningProgress p WHERE p.user.id = :userId ORDER BY p.lastStudiedAt DESC NULLS LAST, p.updatedAt DESC")
    List<UserLearningProgress> findAllByUserIdOrdered(@Param("userId") UUID userId);

    @Query("SELECT p FROM UserLearningProgress p WHERE p.user.id = :userId AND p.contentType = :contentType ORDER BY p.updatedAt DESC")
    List<UserLearningProgress> findAllByUserIdAndContentType(
            @Param("userId") UUID userId,
            @Param("contentType") ContentType contentType);

    @Query("SELECT p FROM UserLearningProgress p WHERE p.user.id = :userId AND p.contentType = :contentType AND p.contentId = :contentId")
    Optional<UserLearningProgress> findByUserIdAndContentTypeAndContentId(
            @Param("userId") UUID userId,
            @Param("contentType") ContentType contentType,
            @Param("contentId") String contentId);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.user.id = :userId AND p.completed = true AND p.contentType = :contentType")
    long countCompletedByUserIdAndContentType(@Param("userId") UUID userId, @Param("contentType") ContentType contentType);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.user.id = :userId AND p.learned = true AND p.contentType = :contentType")
    long countLearnedByUserIdAndContentType(@Param("userId") UUID userId, @Param("contentType") ContentType contentType);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.user.id = :userId AND p.mastered = true AND p.contentType = :contentType")
    long countMasteredByUserIdAndContentType(@Param("userId") UUID userId, @Param("contentType") ContentType contentType);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.user.id = :userId AND p.favorite = true AND p.contentType = :contentType")
    long countFavoriteByUserIdAndContentType(@Param("userId") UUID userId, @Param("contentType") ContentType contentType);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.user.id = :userId AND p.learned = true")
    long countLearnedByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.user.id = :userId AND p.mastered = true")
    long countMasteredByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.user.id = :userId AND p.favorite = true")
    long countFavoriteByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.user.id = :userId AND p.completed = true")
    long countCompletedByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.user.id = :userId AND p.contentType = :contentType")
    long countByUserIdAndContentType(@Param("userId") UUID userId, @Param("contentType") ContentType contentType);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.contentId = :contentId AND p.contentType = :contentType")
    long countByContentIdAndContentType(@Param("contentId") String contentId, @Param("contentType") ContentType contentType);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.contentId = :grammarId AND p.contentType = :contentType AND p.learned = true")
    long countLearnedByGrammarId(@Param("grammarId") String grammarId, @Param("contentType") ContentType contentType);

    @Query("SELECT COALESCE(SUM(p.viewCount), 0) FROM UserLearningProgress p WHERE p.contentId = :contentId AND p.contentType = :contentType")
    long sumViewCountByContentIdAndContentType(@Param("contentId") String contentId, @Param("contentType") ContentType contentType);

    @Query("SELECT COUNT(p) FROM UserLearningProgress p WHERE p.completed = true")
    long countByCompletedTrueJpql();
}
