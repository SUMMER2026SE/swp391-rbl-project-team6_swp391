package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "listening_lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListeningLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "level", nullable = false, length = 10)
    private String level;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "audio_file_name", length = 255)
    private String audioFileName;

    @Column(name = "audio_type", length = 50)
    private String audioType;

    @Column(name = "answer_key", columnDefinition = "TEXT")
    private String answerKey;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "topic", length = 100)
    private String topic;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
