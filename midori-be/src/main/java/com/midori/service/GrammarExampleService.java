package com.midori.service;

import com.midori.dto.grammar.GrammarExampleRequest;
import com.midori.dto.grammar.GrammarExampleResponse;

import java.util.List;
import java.util.UUID;

public interface GrammarExampleService {

    GrammarExampleResponse createExample(UUID grammarContentId, GrammarExampleRequest request);

    GrammarExampleResponse updateExample(UUID exampleId, GrammarExampleRequest request);

    void deleteExample(UUID exampleId);

    GrammarExampleResponse getExample(UUID exampleId);

    List<GrammarExampleResponse> getExamplesByGrammarContent(UUID grammarContentId);

    void deleteExamplesByGrammarContent(UUID grammarContentId);
}