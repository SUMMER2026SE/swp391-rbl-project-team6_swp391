package com.midori.repository;

import com.midori.entity.Grammar;
import com.midori.entity.GrammarLevel;
import com.midori.entity.GrammarStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrammarRepository extends JpaRepository<Grammar, UUID> {

    Optional<Grammar> findById(UUID id);

    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile WHERE g.id = :id")
    Optional<Grammar> findByIdWithCreator(@Param("id") UUID id);

    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile ORDER BY g.createdAt DESC")
    List<Grammar> findAllOrderedWithCreator();

    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile WHERE g.createdBy.id = :userId ORDER BY g.createdAt DESC")
    List<Grammar> findAllByCreatorIdWithCreator(@Param("userId") UUID userId);

    // For admin to see all grammars (separate admin endpoint, not teacher)
    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile WHERE g.status = :status ORDER BY g.createdAt DESC")
    List<Grammar> findAllByStatusWithCreator(@Param("status") GrammarStatus status);

    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile WHERE g.status = :status AND g.level = :level ORDER BY g.createdAt DESC")
    List<Grammar> findAllByStatusAndLevelWithCreator(@Param("status") GrammarStatus status, @Param("level") GrammarLevel level);

    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile WHERE g.status = :status AND " +
           "(LOWER(g.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Grammar> searchByStatusWithCreator(@Param("status") GrammarStatus status, @Param("search") String search);

    // For teacher's own grammars with search
    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile " +
           "WHERE g.createdBy.id = :userId AND (LOWER(g.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY g.createdAt DESC")
    List<Grammar> searchByCreatorWithCreator(@Param("userId") UUID userId, @Param("search") String search);

    // For teacher's own grammars filtered by level
    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile " +
           "WHERE g.createdBy.id = :userId AND g.level = :level ORDER BY g.createdAt DESC")
    List<Grammar> findAllByCreatorIdAndLevelWithCreator(@Param("userId") UUID userId, @Param("level") GrammarLevel level);

    // For teacher's own grammars filtered by status
    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile " +
           "WHERE g.createdBy.id = :userId AND g.status = :status ORDER BY g.createdAt DESC")
    List<Grammar> findAllByCreatorIdAndStatusWithCreator(@Param("userId") UUID userId, @Param("status") GrammarStatus status);

    // For teacher's own grammars filtered by status and level
    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile " +
           "WHERE g.createdBy.id = :userId AND g.status = :status AND g.level = :level ORDER BY g.createdAt DESC")
    List<Grammar> findAllByCreatorIdAndStatusAndLevelWithCreator(@Param("userId") UUID userId, @Param("status") GrammarStatus status, @Param("level") GrammarLevel level);

    // For teacher's own grammars filtered by status and search
    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile " +
           "WHERE g.createdBy.id = :userId AND g.status = :status AND " +
           "(LOWER(g.title) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY g.createdAt DESC")
    List<Grammar> searchByCreatorAndStatusWithCreator(@Param("userId") UUID userId, @Param("status") GrammarStatus status, @Param("search") String search);

    // Count queries for stats
    long countByStatus(GrammarStatus status);
    long count();

    // For admin to see grammars with pending updates
    @Query("SELECT g FROM Grammar g LEFT JOIN FETCH g.createdBy u LEFT JOIN FETCH u.profile WHERE g.status = 'APPROVED' AND g.hasPendingUpdate = true ORDER BY g.updatedAt DESC")
    List<Grammar> findAllApprovedWithPendingUpdate();
}
