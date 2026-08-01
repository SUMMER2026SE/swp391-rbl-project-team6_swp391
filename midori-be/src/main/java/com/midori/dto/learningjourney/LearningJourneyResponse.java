package com.midori.dto.learningjourney;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningJourneyResponse {
    private String level;
    private List<LearningJourneyLessonDto> lessons;
}