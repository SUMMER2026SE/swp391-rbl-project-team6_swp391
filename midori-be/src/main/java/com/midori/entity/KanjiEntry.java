package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "kanji_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KanjiEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "character", nullable = false, unique = true, length = 10)
    private String character;

    @Column(name = "onyomi", columnDefinition = "TEXT")
    private String onyomi;

    @Column(name = "kunyomi", columnDefinition = "TEXT")
    private String kunyomi;

    @Column(name = "stroke_count")
    private Integer strokeCount;

    @Column(name = "radical", length = 50)
    private String radical;

    @Column(name = "jlpt", length = 50)
    private String jlpt;

    @Column(name = "meaning", columnDefinition = "TEXT")
    private String meaning;

    @Column(name = "svg_file", length = 50)
    private String svgFile;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
