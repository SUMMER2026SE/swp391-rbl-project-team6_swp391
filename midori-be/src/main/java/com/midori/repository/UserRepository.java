package com.midori.repository;

import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
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

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.profile WHERE u.role = :role AND u.status = :status ORDER BY u.createdAt DESC")
    List<User> findByRoleAndStatusWithProfile(@Param("role") Role role, @Param("status") UserStatus status);
}
