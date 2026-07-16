package com.midori.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "manual_homework_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualHomeworkQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manual_homework_id", nullable = false)
    @JsonIgnore
    private ManualHomework manualHomework;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 50)
    private QuestionType questionType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "options", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> options;

    @Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Column(nullable = false)
    @Builder.Default
    private Integer points = 1;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private SkillType skill;

    @Column(name = "image_url", length = 255)
    private String imageUrl;
}
