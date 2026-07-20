import os

missing_content = '''package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.entity.*;
import com.midori.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiLearningContentService {

    private final VocabularyLessonRepository vocabularyLessonRepository;
    private final GrammarLessonRepository grammarLessonRepository;
    private final ReadingLessonRepository readingLessonRepository;
    private final ListeningLessonRepository listeningLessonRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final GrammarContentRepository grammarContentRepository;
    private final GrammarExampleRepository grammarExampleRepository;
    private final AiCoreService aiCoreService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public String buildLearningContent(String level, Integer lessonNumber, List<String> skills) {
        StringBuilder sb = new StringBuilder();

        // Vocabulary
        if (skillsContains(skills, "VOCABULARY")) {
            vocabularyLessonRepository.findByJlptLevelAndLessonNumber(level, lessonNumber)
                    .ifPresent(vocab -> {
                        sb.append("========================================\\n");
                        sb.append("VOCABULARY\\n");
                        sb.append("========================================\\n");
                        sb.append("Lesson: ").append(vocab.getTitle()).append("\\n\\n");
                        List<VocabularyItem> items = vocabularyItemRepository
                                .findByVocabularyLessonIdOrderByItemOrderAsc(vocab.getId());
                        for (VocabularyItem item : items) {
                            if (item.getWord() != null && !item.getWord().strip().isEmpty()) {
                                sb.append(item.getWord());
                                if (item.getKanji() != null && !item.getKanji().strip().isEmpty()) {
                                    sb.append(" (").append(item.getKanji()).append(")");
                                }
                                if (item.getMeaning() != null && !item.getMeaning().strip().isEmpty()) {
                                    sb.append(": ").append(item.getMeaning());
                                }
                                sb.append("\\n");
                            }
                        }
                        sb.append("\\n");
                    });
        }

        // Grammar
        if (skillsContains(skills, "GRAMMAR")) {
            grammarLessonRepository.findByJlptLevelAndLessonNumber(level, lessonNumber)
                    .ifPresent(grammar -> {
                        sb.append("========================================\\n");
                        sb.append("GRAMMAR\\n");
                        sb.append("========================================\\n");
                        sb.append("Lesson: ").append(grammar.getTitle()).append("\\n\\n");
                        List<GrammarContent> contents = grammarContentRepository
                                .findByGrammarLessonIdOrderByGrammarOrderAsc(grammar.getId());
                        for (GrammarContent content : contents) {
                            if (content.getGrammarPoint() != null && !content.getGrammarPoint().strip().isEmpty()) {
                                sb.append("Point: ").append(content.getGrammarPoint());
                                if (content.getMeaning() != null && !content.getMeaning().strip().isEmpty()) {
                                    sb.append(" - ").append(content.getMeaning());
                                }
                                sb.append("\\n");
                            }
'''

path = 'midori-be/src/main/java/com/midori/service/AiLearningContentService.java'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Filter out the MISSING LINE comments
good_lines = [line for line in lines if not line.strip().startswith('// MISSING LINE')]

with open(path, 'w', encoding='utf-8') as f:
    f.write(missing_content)
    for line in good_lines:
        f.write(line)

print('Successfully patched AiLearningContentService.java')
