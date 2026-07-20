package com.midori.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class VideoGrammarPatternId implements Serializable {

    @Column(name = "video_id")
    private UUID videoId;

    @Column(name = "grammar_pattern_id")
    private UUID grammarPatternId;
}
