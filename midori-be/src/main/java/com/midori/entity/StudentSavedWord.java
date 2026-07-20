package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity for storing words saved by students from the dictionary popup.
 * These are individual words saved for later review.
 */
@Entity
@Table(name = "student_saved_words", 
       indexes = {
           @Index(name = "idx_saved_words_user_surface", columnList = "user_id, surface"),
           @Index(name = "idx_saved_words_created", columnList = "created_at")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_saved_word_user_surface", 
                          columnNames = {"user_id", "surface"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSavedWord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Column(name = "surface", nullable = false, length = 255)
    private String surface;

    @Column(name = "reading", length = 255)
    private String reading;

    @Column(name = "dictionary_form", length = 255)
    private String dictionaryForm;

    @Column(name = "meaning", nullable = false, length = 1000)
    private String meaning;

    @Column(name = "context", columnDefinition = "TEXT")
    private String context;

    @Column(name = "word_type", length = 100)
    private String wordType;

    @Column(name = "jlpt_level", length = 10)
    private String jlptLevel;

    @Column(name = "lesson_id", length = 100)
    private String lessonId;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
