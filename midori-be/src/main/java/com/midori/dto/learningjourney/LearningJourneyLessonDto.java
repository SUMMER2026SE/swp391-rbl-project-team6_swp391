package com.midori.dto.learningjourney;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningJourneyLessonDto {
    private UUID id;
    private Integer lessonNumber;
    private String title;
    private String level;
    private Integer displayOrder;
    private boolean hasVocabulary;
    private boolean hasGrammar;
    private boolean hasReading;
    private boolean hasListening;
}