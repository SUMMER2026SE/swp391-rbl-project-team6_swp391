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

    @Query("SELECT DISTINCT u FROM User u JOIN u.assignedClasses c WHERE c.id = :classId")
    List<User> findByAssignedClassId(@Param("classId") UUID classId);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.profile JOIN u.assignedClasses c WHERE c.id = :classId")
    List<User> findByAssignedClassIdWithProfile(@Param("classId") UUID classId);

    @Query("SELECT DISTINCT u FROM User u JOIN u.assignedClasses c WHERE c.id = :classId AND u.status = :status")
    List<User> findByAssignedClassIdAndStatus(@Param("classId") UUID classId, @Param("status") UserStatus status);

    @Query("SELECT DISTINCT u FROM User u JOIN u.assignedClasses c WHERE c.id = :classId AND u.role = :role AND u.status = :status")
    List<User> findByAssignedClassIdAndRoleAndStatus(@Param("classId") UUID classId, @Param("role") Role role, @Param("status") UserStatus status);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN u.assignedClasses c WHERE (c.id = :classId OR u.id IN (SELECT cl.teacher.id FROM ClassEntity cl WHERE cl.id = :classId)) AND u.status = :status")
    List<User> findAllMembersByClassIdAndStatus(@Param("classId") UUID classId, @Param("status") UserStatus status);

    long countByRole(Role role);

    long countByRoleAndStatus(Role role, UserStatus status);

    long countByStatus(UserStatus status);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.assignedClasses c WHERE c.id = :classId AND u.status = :status")
    long countByAssignedClassIdAndStatus(@Param("classId") UUID classId, @Param("status") UserStatus status);

    List<User> findAllByStatus(UserStatus status);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.profile WHERE u.role = :role AND u.status = :status ORDER BY u.createdAt DESC")
    List<User> findByRoleAndStatusWithProfile(@Param("role") Role role, @Param("status") UserStatus status);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.profile WHERE u.role = :role ORDER BY u.createdAt DESC")
    List<User> findByRoleWithProfile(@Param("role") Role role);

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

    @Query(value = "SELECT u FROM User u LEFT JOIN FETCH u.profile " +
            "WHERE (:#{#role} IS NULL OR u.role = :role) " +
            "AND u.status IN :statuses " +
            "AND (:#{#keyword} IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR (u.profile IS NOT NULL AND LOWER(u.profile.displayName) LIKE LOWER(CONCAT('%', :keyword, '%'))))",
            countQuery = "SELECT COUNT(u) FROM User u " +
                    "WHERE (:#{#role} IS NULL OR u.role = :role) " +
                    "AND u.status IN :statuses " +
                    "AND (:#{#keyword} IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "OR (u.profile IS NOT NULL AND LOWER(u.profile.displayName) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Page<User> findAllWithInactiveStatuses(@Param("role") Role role,
                                           @Param("statuses") List<UserStatus> statuses,
                                           @Param("keyword") String keyword,
                                           Pageable pageable);

    @Query("SELECT c.id, COUNT(u) FROM User u JOIN u.assignedClasses c GROUP BY c.id")
    List<Object[]> countStudentsPerClass();

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.role = :role ORDER BY u.createdAt DESC")
    List<User> findRecentUsersByRole(@Param("role") Role role, Pageable pageable);

    @Query("SELECT COUNT(u), " +
           "SUM(CASE WHEN u.role = 'TEACHER' THEN 1L ELSE 0L END), " +
           "SUM(CASE WHEN u.role = 'STUDENT' THEN 1L ELSE 0L END), " +
           "SUM(CASE WHEN u.status = 'ACTIVE' THEN 1L ELSE 0L END), " +
           "SUM(CASE WHEN u.role = 'TEACHER' AND u.status = 'PENDING_APPROVAL' THEN 1L ELSE 0L END) " +
           "FROM User u")
    List<Object[]> getDashboardStats();
}
