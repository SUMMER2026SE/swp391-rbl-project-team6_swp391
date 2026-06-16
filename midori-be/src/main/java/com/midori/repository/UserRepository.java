package com.midori.repository;

import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRoleAndStatus(Role role, UserStatus status);

    long countByRole(Role role);

    long countByRoleAndStatus(Role role, UserStatus status);

    long countByStatus(UserStatus status);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.profile WHERE u.role = :role AND u.status = :status ORDER BY u.createdAt DESC")
    List<User> findByRoleAndStatusWithProfile(@Param("role") Role role, @Param("status") UserStatus status);

    @Query(value = "SELECT u FROM User u LEFT JOIN FETCH u.profile " +
            "WHERE (:#{#role} IS NULL OR u.role = :role) " +
            "AND (:#{#status} IS NULL OR u.status = :status) " +
            "AND (:#{#keyword} IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR (u.profile IS NOT NULL AND LOWER(u.profile.displayName) LIKE LOWER(CONCAT('%', :keyword, '%'))))",
            countQuery = "SELECT COUNT(u) FROM User u " +
                    "WHERE (:#{#role} IS NULL OR u.role = :role) " +
                    "AND (:#{#status} IS NULL OR u.status = :status) " +
                    "AND (:#{#keyword} IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "OR (u.profile IS NOT NULL AND LOWER(u.profile.displayName) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Page<User> findAllWithFilters(@Param("role") Role role,
                                   @Param("status") UserStatus status,
                                   @Param("keyword") String keyword,
                                   Pageable pageable);
}
