package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "dictionary_examples")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DictionaryExample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private DictionaryEntry entry;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String japanese;

    @Column(length = 255)
    private String reading;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String translation;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
