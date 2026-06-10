package com.midori.service;

import com.midori.dto.grammar.GrammarCreateRequest;
import com.midori.dto.grammar.GrammarResponse;
import com.midori.dto.grammar.GrammarUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface GrammarService {

    // ===== Teacher / Admin =====

    GrammarResponse createGrammar(GrammarCreateRequest request, UUID createdBy);

    GrammarResponse updateGrammar(UUID grammarId, GrammarUpdateRequest request, UUID currentUserId);

    void deleteGrammar(UUID grammarId, UUID currentUserId);

    List<GrammarResponse> listGrammarsForManagement(UUID currentUserId, String level, String search);

    GrammarResponse getGrammarForManagement(UUID grammarId, UUID currentUserId);

    GrammarResponse submitGrammar(UUID grammarId, UUID currentUserId);

    // ===== Student =====

    List<GrammarResponse> listApprovedGrammars(String level, String search);

    GrammarResponse getApprovedGrammar(UUID grammarId);
}
