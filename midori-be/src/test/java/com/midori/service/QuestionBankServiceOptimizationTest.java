package com.midori.service;

import com.midori.dto.questiondto.GeneratePreviewRequest;
import com.midori.dto.questiondto.QuestionBankGeneratorLessonResponse;
import com.midori.dto.questiondto.TeacherQuestionPreviewDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Arrays;

@SpringBootTest
public class QuestionBankServiceOptimizationTest {

    @Autowired
    private QuestionBankService questionBankService;

    @Test
    public void testPerformance() {
        System.out.println("--- WARMUP ---");
        try {
            questionBankService.getLessons("N5", Arrays.asList("VOCABULARY", "GRAMMAR"));
        } catch (Exception e) {}

        System.out.println("--- TESTING LESSONS API ---");
        long start = System.currentTimeMillis();
        List<QuestionBankGeneratorLessonResponse> lessons = questionBankService.getLessons("N5", Arrays.asList("VOCABULARY", "GRAMMAR"));
        long end = System.currentTimeMillis();
        System.out.println("Lessons API Time: " + (end - start) + "ms");
        
        System.out.println("--- TESTING PREVIEW API ---");
        GeneratePreviewRequest req = new GeneratePreviewRequest();
        req.setLevel("N5");
        req.setSkills(Arrays.asList("VOCABULARY", "GRAMMAR"));
        req.setLessonIds(Arrays.asList(1, 2, 3, 4, 5));
        
        GeneratePreviewRequest.DifficultyDistribution diff = new GeneratePreviewRequest.DifficultyDistribution();
        diff.setEasy(10);
        diff.setMedium(10);
        diff.setHard(10);
        req.setDifficulty(diff);

        start = System.currentTimeMillis();
        List<TeacherQuestionPreviewDto> preview = questionBankService.generatePreview(req);
        end = System.currentTimeMillis();
        System.out.println("Generate Preview Time: " + (end - start) + "ms");
        System.out.println("Generated Questions: " + preview.size());
    }
}
