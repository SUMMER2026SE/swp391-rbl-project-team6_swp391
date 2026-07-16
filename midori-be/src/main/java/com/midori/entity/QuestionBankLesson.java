package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "question_bank_lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionBankLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 10)
    private String level;

    @Column(name = "lesson_number", nullable = false)
    private Integer lessonNumber;

    @Column(name = "lesson_name", nullable = false, length = 255)
    private String lessonName;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "DRAFT";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
