package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vocabulary_items",
        uniqueConstraints = @UniqueConstraint(columnNames = {"vocabulary_lesson_id", "item_order"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabularyItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocabulary_lesson_id", nullable = false)
    private VocabularyLesson vocabularyLesson;

    @Column(name = "item_order", nullable = false)
    private Integer itemOrder;

    @Column(nullable = false, length = 255)
    private String japanese;

    @Column(length = 255)
    private String furigana;

    @Column(length = 255)
    private String romaji;

    @Column(nullable = false, length = 500)
    private String meaning;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(name = "example_translation", columnDefinition = "TEXT")
    private String exampleTranslation;

    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}