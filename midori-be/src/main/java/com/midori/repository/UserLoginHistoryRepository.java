package com.midori.repository;

import com.midori.entity.UserLoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserLoginHistoryRepository extends JpaRepository<UserLoginHistory, UUID> {

    @Query("SELECT l.loginDate FROM UserLoginHistory l WHERE l.user.id = :userId ORDER BY l.loginDate DESC")
    List<LocalDate> findLoginDatesByUserId(@Param("userId") UUID userId);

    Optional<UserLoginHistory> findByUserIdAndLoginDate(UUID userId, LocalDate loginDate);

    @Query("SELECT COUNT(DISTINCT l.loginDate) FROM UserLoginHistory l WHERE l.user.id = :userId")
    long countDistinctLoginDaysByUserId(@Param("userId") UUID userId);

    boolean existsByUserIdAndLoginDate(UUID userId, LocalDate loginDate);
}
