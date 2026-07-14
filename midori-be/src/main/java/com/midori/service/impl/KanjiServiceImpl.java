package com.midori.service.impl;

import com.midori.dto.kanji.KanjiResponse;
import com.midori.entity.KanjiEntry;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.KanjiEntryRepository;
import com.midori.service.KanjiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class KanjiServiceImpl implements KanjiService {

    private final KanjiEntryRepository kanjiEntryRepository;

    @Override
    @Transactional(readOnly = true)
    public KanjiResponse getKanjiInfo(String character) {
        if (character == null || character.trim().isEmpty()) {
            throw new IllegalArgumentException("Character must not be empty");
        }

        String target = character.trim();
        KanjiEntry entry = kanjiEntryRepository.findByCharacter(target)
                .orElseThrow(() -> new ResourceNotFoundException("KanjiEntry", "character", target));

        return KanjiResponse.builder()
                .character(entry.getCharacter())
                .onyomi(entry.getOnyomi())
                .kunyomi(entry.getKunyomi())
                .strokeCount(entry.getStrokeCount())
                .radical(entry.getRadical())
                .jlpt(entry.getJlpt())
                .meaning(entry.getMeaning())
                .build();
    }
}
