package com.midori.dto.progress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressUpdateRequest {

    private Boolean learned;
    private Boolean mastered;
    private Boolean favorite;
    private Boolean completed;
    private Integer progressPercent;
}
