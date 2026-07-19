package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "grammar_contents",
        uniqueConstraints = @UniqueConstraint(columnNames = {"grammar_lesson_id", "content_order"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrammarContent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grammar_lesson_id", nullable = false)
    private GrammarLesson grammarLesson;

    @Column(name = "content_order", nullable = false)
    private Integer contentOrder;

    @Column(columnDefinition = "TEXT")
    private String pattern;

    @Column(columnDefinition = "TEXT")
    private String meaning;

    @Column(columnDefinition = "TEXT")
    private String structure;

    @Column(columnDefinition = "TEXT")
    private String usage;

    @OneToMany(mappedBy = "grammarContent", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("exampleOrder ASC")
    @Builder.Default
    private List<GrammarExample> examples = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}