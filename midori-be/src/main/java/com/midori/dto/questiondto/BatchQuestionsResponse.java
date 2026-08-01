package com.midori.dto.questiondto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BatchQuestionsResponse {
    private int requestedCount;
    private int savedCount;
    private List<TeacherQuestionResponse> savedQuestions;
}
