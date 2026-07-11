package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_import_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiImportJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private JobStatus status = JobStatus.PENDING;

    @Column(name = "original_filename", length = 500)
    private String originalFilename;

    @Column(name = "input_file_size")
    private Long inputFileSize;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(name = "ai_provider", length = 50)
    private String aiProvider;

    @Column(name = "ai_raw_response", columnDefinition = "TEXT")
    private String aiRawResponse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "exam_id")
    private UUID examId;

    @Column(name = "exam_title", length = 500)
    private String examTitle;

    @Column(name = "question_count")
    private Integer questionCount;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(name = "likely_scanned")
    private Boolean likelyScanned;

    @Column(name = "processing_started_at")
    private Instant processingStartedAt;

    @Column(name = "processing_completed_at")
    private Instant processingCompletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum JobStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }
}
