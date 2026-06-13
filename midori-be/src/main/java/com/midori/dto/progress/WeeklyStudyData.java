package com.midori.dto.progress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyStudyData {

    private String day;
    private Integer count;
    private Integer vocabCount;
    private Integer grammarCount;
}
