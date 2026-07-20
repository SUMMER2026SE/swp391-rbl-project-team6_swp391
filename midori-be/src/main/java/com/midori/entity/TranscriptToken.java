package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "transcript_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sentence_id", nullable = false)
    private ShadowingTranscript sentence;

    @Column(name = "surface", nullable = false)
    private String surface;

    @Column(name = "lemma")
    private String lemma;

    @Column(name = "reading")
    private String reading;

    @Column(name = "position", nullable = false)
    private Integer position;
}
