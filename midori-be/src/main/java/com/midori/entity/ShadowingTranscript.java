package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "shadowing_transcripts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShadowingTranscript {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private ShadowingVideo shadowingVideo;

    @Column(name = "sentence_order", nullable = false)
    private Integer sentenceOrder;

    @Column(name = "start_time", nullable = false)
    private Integer startTime;

    @Column(name = "end_time", nullable = false)
    private Integer endTime;

    @Column(name = "jp_text", nullable = false, columnDefinition = "TEXT")
    private String jpText;

    @Column(name = "vn_text", columnDefinition = "TEXT")
    private String vnText;
}
