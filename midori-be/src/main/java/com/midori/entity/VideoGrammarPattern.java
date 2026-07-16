package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Join table entity: which grammar patterns were detected in each shadowing video.
 * One grammar pattern can belong to many videos.
 * One video can contain many grammar patterns.
 */
@Entity
@Table(name = "video_grammar_patterns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoGrammarPattern {

    @EmbeddedId
    private VideoGrammarPatternId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("videoId")
    @JoinColumn(name = "video_id")
    private ShadowingVideo video;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("grammarPatternId")
    @JoinColumn(name = "grammar_pattern_id")
    private GrammarPattern grammarPattern;

    /** The exact transcript sentence that triggered the grammar match. */
    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;
}
