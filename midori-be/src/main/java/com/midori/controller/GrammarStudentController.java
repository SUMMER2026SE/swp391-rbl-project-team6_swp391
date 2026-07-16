package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.grammar.GrammarResponse;
import com.midori.service.GrammarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/grammar")
@RequiredArgsConstructor
public class GrammarStudentController {

    private final GrammarService grammarService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GrammarResponse>>> listGrammars(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search) {
        List<GrammarResponse> grammars = grammarService.listApprovedGrammars(level, search);
        return ResponseEntity.ok(ApiResponse.success(grammars));
    }

}
