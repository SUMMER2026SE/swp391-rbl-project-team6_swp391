package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vocabulary_words")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabularyWord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private VocabularyLesson lesson;

    @Column(nullable = false, length = 255)
    private String word;

    @Column(length = 255)
    private String furigana;

    @Column(length = 255)
    private String romaji;

    @Column(nullable = false, length = 500)
    private String meaning;

    @Column(name = "example_japanese", columnDefinition = "TEXT")
    private String exampleJapanese;

    @Column(name = "example_meaning", columnDefinition = "TEXT")
    private String exampleMeaning;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
