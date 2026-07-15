package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "dictionary_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DictionaryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String surface;

    @Column(length = 255)
    private String lemma;

    @Column(length = 255)
    private String reading;

    @Column(length = 255)
    private String romaji;

    @Column(name = "jlpt_level", length = 50)
    private String jlptLevel;

    @Column(name = "part_of_speech", length = 255)
    private String partOfSpeech;

    private Integer frequency;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "jmdict_seq")
    private Long jmdictSeq;

    @Column(name = "jmdict_pri")
    private String jmdictPri;

    @Column(name = "jmdict_ke_pri")
    private String[] jmdictKePri;

    @Column(name = "jmdict_re_pri")
    private String[] jmdictRePri;

    @Column(name = "jmdict_raw_xml", columnDefinition = "TEXT")
    private String jmdictRawXml;

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DictionaryMeaning> meanings = new ArrayList<>();

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DictionaryExample> examples = new ArrayList<>();
}
