package com.midori.service.impl;

import com.midori.dto.grammar.GrammarPatternDetailResponse;
import com.midori.dto.grammar.GrammarPatternSummaryResponse;
import com.midori.entity.GrammarPattern;
import com.midori.entity.VideoGrammarPattern;
import com.midori.repository.VideoGrammarPatternRepository;
import com.midori.service.GrammarPatternService;
import com.midori.service.GrammarTranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GrammarPatternServiceImpl implements GrammarPatternService {

    private final VideoGrammarPatternRepository videoGrammarPatternRepository;
    private final GrammarTranslationService grammarTranslationService;

    @Override
    @Transactional(readOnly = true)
    public List<GrammarPatternSummaryResponse> getForVideo(UUID videoId) {
        List<VideoGrammarPattern> matches = videoGrammarPatternRepository.findByVideoIdWithPattern(videoId);

        return matches.stream()
                .map(vgp -> {
                    GrammarPattern gp = vgp.getGrammarPattern();
                    return GrammarPatternSummaryResponse.builder()
                            .id(gp.getId())
                            .pattern(gp.getPattern())
                            .jlptLevel(gp.getJlptLevel())
                            .meaningEn(gp.getMeaningEn())
                            .meaningVi(gp.getMeaningVi())
                            .meaningViAvailable(gp.getMeaningVi() != null && !gp.getMeaningVi().isBlank())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GrammarPatternDetailResponse getDetailWithTranslation(UUID grammarPatternId, UUID videoId) {
        return grammarTranslationService.translateIfNeeded(grammarPatternId, videoId);
    }
}
