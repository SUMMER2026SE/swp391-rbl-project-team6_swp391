package com.midori.service;

import com.midori.dto.vocabulary.*;
import com.midori.entity.User;
import com.midori.entity.VocabularyLesson;
import com.midori.entity.VocabularyWord;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserRepository;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.repository.VocabularyWordRepository;
import jakarta.persistence.EntityManager;
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
    private final EntityManager entityManager;

    // ============================================================
    // Teacher / Admin Methods
    // ============================================================

    @Override
    public VocabularyLessonResponse createLesson(VocabularyLessonCreateRequest request, UUID createdBy) {
        System.out.println("[createLesson] title=" + request.getTitle() + ", words=" + (request.getWords() == null ? 0 : request.getWords().size()));
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
        int savedWordCount = saveLessonWords(lesson, request.getWords());
        syncLessonWordCountFromInt(lesson, savedWordCount);
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
        VocabularyLesson lesson = lessonRepository.findByIdWithCreator(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));
        return toLessonDetailResponse(lesson);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyLessonResponse> listLessonsForManagement(String level, String topic, String search) {
        List<VocabularyLesson> lessons = lessonRepository.findAllOrderedWithCreator();

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
        System.out.println("[addWord service] lessonId=" + lessonId);
        System.out.println("[addWord service] request.getJapanese()=" + request.getJapanese());
        System.out.println("[addWord service] request.getVietnamese()=" + request.getVietnamese());
        System.out.println("[addWord service] isValidForCreate=" + request.isValidForCreate());
        VocabularyLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        VocabularyWord word = buildVocabularyWord(lesson, request, request.getDisplayOrder());
        System.out.println("[addWord service] word.word=" + word.getWord() + ", word.meaning=" + word.getMeaning());
        word = wordRepository.save(word);
        System.out.println("[addWord service] SAVED wordId=" + word.getId());
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
        VocabularyLesson lesson = lessonRepository.findByIdWithCreator(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        lesson.setIsPublished(true);
        lesson = lessonRepository.save(lesson);
        syncLessonWordCount(lesson);
        return toLessonResponse(lesson);
    }

    @Override
    public VocabularyLessonResponse unpublishLesson(UUID lessonId) {
        VocabularyLesson lesson = lessonRepository.findByIdWithCreator(lessonId)
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
            lessons = lessonRepository.findAllPublishedWithCreator();
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
        VocabularyLesson lesson = lessonRepository.findByIdWithCreator(lessonId)
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
                .teacherName(resolveTeacherName(lesson.getCreatedBy()))
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private VocabularyLessonDetailResponse toLessonDetailResponse(VocabularyLesson lesson) {
        System.out.println("[toLessonDetailResponse] lessonId=" + lesson.getId());
        List<VocabularyWord> wordEntities = wordRepository.findByLessonIdOrderByDisplayOrderAsc(lesson.getId());
        List<VocabularyWordResponse> words = wordEntities
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
                .teacherName(resolveTeacherName(lesson.getCreatedBy()))
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .words(words)
                .build();
    }

    private String resolveTeacherName(User createdBy) {
        if (createdBy == null) {
            return "MIDORI";
        }
        if (createdBy.getProfile() != null && createdBy.getProfile().getDisplayName() != null) {
            return createdBy.getProfile().getDisplayName();
        }
        if (createdBy.getEmail() != null) {
            return createdBy.getEmail();
        }
        return "System";
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

    private int saveLessonWords(VocabularyLesson lesson, List<VocabularyWordCreateRequest> words) {
        System.out.println("=== [saveLessonWords] lessonId=" + lesson.getId() + ", words=" + (words == null ? "null" : words.size()));
        if (words == null || words.isEmpty()) {
            return 0;
        }

        int savedWordCount = 0;
        for (int index = 0; index < words.size(); index++) {
            VocabularyWordCreateRequest wordRequest = words.get(index);
            String j = wordRequest.getJapanese();
            String v = wordRequest.getVietnamese();
            System.out.println("  word[" + index + "] j=\"" + j + "\" v=\"" + v + "\" valid=" + wordRequest.isValidForCreate());
            if (!wordRequest.isValidForCreate()) {
                continue;
            }

            VocabularyWord word = buildVocabularyWord(lesson, wordRequest, index);
            wordRepository.save(word);
            savedWordCount++;
        }
        // Flush pending inserts so countByLessonId sees them
        entityManager.flush();
        entityManager.clear();
        System.out.println("=== [saveLessonWords] done, saved=" + savedWordCount);
        return savedWordCount;
    }

    private VocabularyWord buildVocabularyWord(VocabularyLesson lesson, VocabularyWordCreateRequest request, int fallbackDisplayOrder) {
        String japanese = trimToNull(request.getJapanese());
        String vietnamese = trimToNull(request.getVietnamese());
        String romaji = trimToNull(request.getRomaji());
        String wordValue = japanese;
        String meaningValue = vietnamese;
        if (wordValue == null && vietnamese != null) {
            wordValue = vietnamese;
        }
        if (wordValue == null && romaji != null) {
            wordValue = romaji;
        }
        if (meaningValue == null && wordValue != null) {
            meaningValue = wordValue;
        }
        if (meaningValue == null && vietnamese != null) {
            meaningValue = vietnamese;
        }
        return VocabularyWord.builder()
                .lesson(lesson)
                .word(wordValue)
                .furigana(trimToNull(request.getReading()))
                .romaji(romaji)
                .meaning(meaningValue)
                .exampleJapanese(trimToNull(request.getExampleJapanese()))
                .exampleMeaning(trimToNull(request.getExampleVietnamese()))
                .audioUrl(trimToNull(request.getAudioUrl()))
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : fallbackDisplayOrder)
                .build();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int resolveWordCount(VocabularyLesson lesson) {
        return Math.toIntExact(wordRepository.countByLessonId(lesson.getId()));
    }

    private void syncLessonWordCount(VocabularyLesson lesson) {
        int wordCount = resolveWordCount(lesson);
        lesson.setWordCount(wordCount);
        lessonRepository.save(lesson);
    }

    private void syncLessonWordCountFromInt(VocabularyLesson lesson, int wordCount) {
        lesson.setWordCount(wordCount);
        lessonRepository.save(lesson);
    }
}
