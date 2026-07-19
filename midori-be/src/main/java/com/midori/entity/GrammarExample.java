package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "grammar_examples",
        uniqueConstraints = @UniqueConstraint(columnNames = {"grammar_content_id", "example_order"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrammarExample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grammar_content_id", nullable = false)
    private GrammarContent grammarContent;

    @Column(name = "example_order", nullable = false)
    private Integer exampleOrder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String japanese;

    @Column(name = "vietnamese_meaning", columnDefinition = "TEXT")
    private String vietnameseMeaning;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}