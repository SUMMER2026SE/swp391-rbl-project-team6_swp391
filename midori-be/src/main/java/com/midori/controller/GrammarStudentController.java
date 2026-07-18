package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.grammar.GrammarDetailResponse;
import com.midori.dto.grammar.GrammarLessonResponse;
import com.midori.service.GrammarLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/grammar")
@RequiredArgsConstructor
public class GrammarStudentController {

    private final GrammarLessonService grammarLessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GrammarLessonResponse>>> getGrammarList(
            @RequestParam(required = false) String level) {
        List<GrammarLessonResponse> grammars;
        if (level != null && !level.isBlank()) {
            grammars = grammarLessonService.getActiveGrammarLessonsByLevel(level);
        } else {
            grammars = grammarLessonService.getActiveGrammarLessons();
        }
        return ResponseEntity.ok(ApiResponse.success(grammars));
    }

}
