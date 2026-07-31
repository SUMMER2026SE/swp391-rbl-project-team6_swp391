package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student_learning_access", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_id", "level"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentLearningAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false, length = 10)
    private String level;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_class_id")
    private ClassEntity sourceClass;

    @Column(name = "access_start_at", nullable = false)
    private Instant accessStartAt;

    @Column(name = "access_expire_at", nullable = false)
    private Instant accessExpireAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AccessStatus status = AccessStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum AccessStatus {
        ACTIVE,
        EXPIRED,
        REVOKED
    }
}
