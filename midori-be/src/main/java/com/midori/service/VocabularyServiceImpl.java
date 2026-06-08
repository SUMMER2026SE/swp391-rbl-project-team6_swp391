package com.midori.service;

import com.midori.dto.vocabulary.*;
import com.midori.entity.User;
import com.midori.entity.VocabularyLesson;
import com.midori.entity.VocabularyWord;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserRepository;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.repository.VocabularyWordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VocabularyServiceImpl implements VocabularyService {

    private final VocabularyLessonRepository lessonRepository;
    private final VocabularyWordRepository wordRepository;
    private final UserRepository userRepository;

    // ============================================================
    // Teacher / Admin Methods
    // ============================================================

    @Override
    public VocabularyLessonResponse createLesson(VocabularyLessonCreateRequest request, UUID createdBy) {
        System.out.println("[TeacherVocabularyService] request words size = " + (request.getWords() == null ? "null" : request.getWords().size()));
        User creator = userRepository.findById(createdBy)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", createdBy));

        VocabularyLesson lesson = VocabularyLesson.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .level(request.getLevel())
                .topic(request.getTopic())
                .estimatedMinutes(request.getEstimatedMinutes())
                .wordCount(0)
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : false)
                .createdBy(creator)
                .build();

        lesson = lessonRepository.save(lesson);
        saveLessonWords(lesson, request.getWords());
        syncLessonWordCount(lesson);
        return toLessonResponse(lesson);
    }

    @Override
    public VocabularyLessonResponse updateLesson(UUID lessonId, VocabularyLessonUpdateRequest request) {
        VocabularyLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        applyLessonUpdate(lesson, request);
        lesson = lessonRepository.save(lesson);
        syncLessonWordCount(lesson);
        return toLessonResponse(lesson);
    }

    @Override
    public void deleteLesson(UUID lessonId) {
        if (!lessonRepository.existsById(lessonId)) {
            throw new ResourceNotFoundException("VocabularyLesson", "id", lessonId);
        }
        lessonRepository.deleteById(lessonId);
    }

    @Override
    @Transactional(readOnly = true)
    public VocabularyLessonDetailResponse getLessonDetailForManagement(UUID lessonId) {
        VocabularyLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));
        return toLessonDetailResponse(lesson);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyLessonResponse> listLessonsForManagement(String level, String topic, String search) {
        List<VocabularyLesson> lessons = lessonRepository.findAllOrdered();

        if (level != null && !level.isBlank()) {
            lessons = lessons.stream()
                    .filter(l -> level.equalsIgnoreCase(l.getLevel()))
                    .collect(Collectors.toList());
        }
        if (topic != null && !topic.isBlank()) {
            lessons = lessons.stream()
                    .filter(l -> topic.equalsIgnoreCase(l.getTopic()))
                    .collect(Collectors.toList());
        }
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            lessons = lessons.stream()
                    .filter(l -> (l.getTitle() != null && l.getTitle().toLowerCase().contains(q))
                            || (l.getDescription() != null && l.getDescription().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        return lessons.stream()
                .map(this::toLessonResponse)
                .collect(Collectors.toList());
    }

    @Override
    public VocabularyWordResponse addWord(UUID lessonId, VocabularyWordCreateRequest request) {
        VocabularyLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        VocabularyWord word = buildVocabularyWord(lesson, request, request.getDisplayOrder());
        word = wordRepository.save(word);
        syncLessonWordCount(lesson);
        return toWordResponse(word);
    }

    @Override
    public VocabularyWordResponse updateWord(UUID wordId, VocabularyWordUpdateRequest request) {
        VocabularyWord word = wordRepository.findById(wordId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyWord", "id", wordId));

        applyWordUpdate(word, request);
        word = wordRepository.save(word);
        syncLessonWordCount(word.getLesson());
        return toWordResponse(word);
    }

    @Override
    public void deleteWord(UUID wordId) {
        VocabularyWord word = wordRepository.findById(wordId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyWord", "id", wordId));

        VocabularyLesson lesson = word.getLesson();
        wordRepository.delete(word);
        syncLessonWordCount(lesson);
    }

    @Override
    public VocabularyLessonResponse publishLesson(UUID lessonId) {
        VocabularyLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        lesson.setIsPublished(true);
        lesson = lessonRepository.save(lesson);
        syncLessonWordCount(lesson);
        return toLessonResponse(lesson);
    }

    @Override
    public VocabularyLessonResponse unpublishLesson(UUID lessonId) {
        VocabularyLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        lesson.setIsPublished(false);
        lesson = lessonRepository.save(lesson);
        syncLessonWordCount(lesson);
        return toLessonResponse(lesson);
    }

    // ============================================================
    // Student Methods
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyLessonResponse> listPublishedLessons(String level, String topic, String search) {
        List<VocabularyLesson> lessons;

        boolean hasLevel = level != null && !level.isBlank();
        boolean hasTopic = topic != null && !topic.isBlank();
        boolean hasSearch = search != null && !search.isBlank();

        if (hasSearch) {
            lessons = wordRepository.findAll().stream()
                    .map(VocabularyWord::getLesson)
                    .filter(l -> l.getIsPublished())
                    .distinct()
                    .filter(l -> l.getTitle().toLowerCase().contains(search.toLowerCase())
                            || (l.getDescription() != null && l.getDescription().toLowerCase().contains(search.toLowerCase())))
                    .collect(Collectors.toList());
        } else if (hasLevel && hasTopic) {
            lessons = lessonRepository.findAllPublishedByLevelAndTopic(level, topic);
        } else if (hasLevel) {
            lessons = lessonRepository.findAllPublishedByLevel(level);
        } else if (hasTopic) {
            lessons = lessonRepository.findAllPublishedByTopic(topic);
        } else {
            lessons = lessonRepository.findAllPublished();
        }

        if (hasLevel && !hasSearch) {
            lessons = lessons.stream()
                    .filter(l -> level.equalsIgnoreCase(l.getLevel()))
                    .collect(Collectors.toList());
        }
        if (hasTopic && !hasSearch) {
            lessons = lessons.stream()
                    .filter(l -> topic.equalsIgnoreCase(l.getTopic()))
                    .collect(Collectors.toList());
        }

        return lessons.stream()
                .map(this::toLessonResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VocabularyLessonDetailResponse getPublishedLessonDetail(UUID lessonId) {
        VocabularyLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        if (!Boolean.TRUE.equals(lesson.getIsPublished())) {
            throw new ResourceNotFoundException("VocabularyLesson", "id", lessonId);
        }

        return toLessonDetailResponse(lesson);
    }

    // ============================================================
    // Mapper Methods
    // ============================================================

    private VocabularyLessonResponse toLessonResponse(VocabularyLesson lesson) {
        int wordCount = resolveWordCount(lesson);
        return VocabularyLessonResponse.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .level(lesson.getLevel())
                .topic(lesson.getTopic())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .wordCount(wordCount)
                .isPublished(lesson.getIsPublished())
                .createdBy(lesson.getCreatedBy() != null ? lesson.getCreatedBy().getId() : null)
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private VocabularyLessonDetailResponse toLessonDetailResponse(VocabularyLesson lesson) {
        List<VocabularyWordResponse> words = wordRepository
                .findByLessonIdOrderByDisplayOrderAsc(lesson.getId())
                .stream()
                .map(this::toWordResponse)
                .collect(Collectors.toList());

        return VocabularyLessonDetailResponse.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .level(lesson.getLevel())
                .topic(lesson.getTopic())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .wordCount(words.size())
                .isPublished(lesson.getIsPublished())
                .createdBy(lesson.getCreatedBy() != null ? lesson.getCreatedBy().getId() : null)
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .words(words)
                .build();
    }

    private VocabularyWordResponse toWordResponse(VocabularyWord word) {
        return VocabularyWordResponse.builder()
                .id(word.getId())
                .lessonId(word.getLesson().getId())
                .word(word.getWord())
                .furigana(word.getFurigana())
                .romaji(word.getRomaji())
                .meaning(word.getMeaning())
                .exampleJapanese(word.getExampleJapanese())
                .exampleMeaning(word.getExampleMeaning())
                .audioUrl(word.getAudioUrl())
                .displayOrder(word.getDisplayOrder())
                .createdAt(word.getCreatedAt())
                .updatedAt(word.getUpdatedAt())
                .build();
    }

    private void applyLessonUpdate(VocabularyLesson lesson, VocabularyLessonUpdateRequest request) {
        if (request.getTitle() != null) {
            lesson.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            lesson.setDescription(request.getDescription());
        }
        if (request.getLevel() != null) {
            lesson.setLevel(request.getLevel());
        }
        if (request.getTopic() != null) {
            lesson.setTopic(request.getTopic());
        }
        if (request.getEstimatedMinutes() != null) {
            lesson.setEstimatedMinutes(request.getEstimatedMinutes());
        }
        if (request.getIsPublished() != null) {
            lesson.setIsPublished(request.getIsPublished());
        }
    }

    private void applyWordUpdate(VocabularyWord word, VocabularyWordUpdateRequest request) {
        if (request.getWord() != null) {
            word.setWord(request.getWord());
        }
        if (request.getFurigana() != null) {
            word.setFurigana(request.getFurigana());
        }
        if (request.getRomaji() != null) {
            word.setRomaji(request.getRomaji());
        }
        if (request.getMeaning() != null) {
            word.setMeaning(request.getMeaning());
        }
        if (request.getExampleJapanese() != null) {
            word.setExampleJapanese(request.getExampleJapanese());
        }
        if (request.getExampleMeaning() != null) {
            word.setExampleMeaning(request.getExampleMeaning());
        }
        if (request.getAudioUrl() != null) {
            word.setAudioUrl(request.getAudioUrl());
        }
        if (request.getDisplayOrder() != null) {
            word.setDisplayOrder(request.getDisplayOrder());
        }
    }

    private void saveLessonWords(VocabularyLesson lesson, List<VocabularyWordCreateRequest> words) {
        if (words == null || words.isEmpty()) {
            return;
        }

        for (int index = 0; index < words.size(); index++) {
            VocabularyWordCreateRequest wordRequest = words.get(index);
            VocabularyWord word = buildVocabularyWord(lesson, wordRequest, index);
            VocabularyWord savedWord = wordRepository.save(word);
            System.out.println("[TeacherVocabularyService] saved word: " + savedWord.getId() + " lessonId=" + lesson.getId());
        }
    }

    private VocabularyWord buildVocabularyWord(VocabularyLesson lesson, VocabularyWordCreateRequest request, int fallbackDisplayOrder) {
        return VocabularyWord.builder()
                .lesson(lesson)
                .word(request.getWord())
                .furigana(request.getFurigana())
                .romaji(request.getRomaji())
                .meaning(request.getMeaning())
                .exampleJapanese(request.getExampleJapanese())
                .exampleMeaning(request.getExampleMeaning())
                .audioUrl(request.getAudioUrl())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : fallbackDisplayOrder)
                .build();
    }

    private int resolveWordCount(VocabularyLesson lesson) {
        return Math.toIntExact(wordRepository.countByLessonId(lesson.getId()));
    }

    private void syncLessonWordCount(VocabularyLesson lesson) {
        int wordCount = resolveWordCount(lesson);
        lesson.setWordCount(wordCount);
        lessonRepository.save(lesson);
        System.out.println("[TeacherVocabularyService] final wordCount = " + lesson.getWordCount());
    }
}
