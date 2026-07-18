package com.midori.service;

import com.midori.dto.vocabulary.*;
import com.midori.entity.NotificationType;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.entity.VocabularyLessonV2;
import com.midori.entity.VocabularyWord;
import com.midori.exception.AccessDeniedException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserRepository;
import com.midori.repository.VocabularyLessonV2Repository;
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

    private final VocabularyLessonV2Repository lessonRepository;
    private final VocabularyWordRepository wordRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;
    private final NotificationHelperService notificationHelper;

    private boolean isOwner(VocabularyLessonV2 lesson, UUID currentUserId) {
        if (lesson == null || currentUserId == null) {
            return false;
        }
        return lesson.getCreatedBy() != null &&
               lesson.getCreatedBy().getId().equals(currentUserId);
    }

    private void checkLessonOwnership(VocabularyLessonV2 lesson, UUID currentUserId) {
        if (!isOwner(lesson, currentUserId)) {
            throw new AccessDeniedException("You can only modify your own lessons");
        }
    }

    @Override
    public VocabularyLessonResponseV2 createLesson(VocabularyLessonCreateRequestV2 request, UUID createdBy) {
        User creator = userRepository.findById(createdBy)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", createdBy));

        VocabularyLessonV2 lesson = VocabularyLessonV2.builder()
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
        return toLessonResponse(lesson, createdBy);
    }

    @Override
    public VocabularyLessonResponseV2 updateLesson(UUID lessonId, VocabularyLessonUpdateRequestV2 request, UUID currentUserId) {
        VocabularyLessonV2 lesson = lessonRepository.findByIdWithCreator(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        checkLessonOwnership(lesson, currentUserId);

        applyLessonUpdate(lesson, request);
        lesson = lessonRepository.save(lesson);
        syncLessonWordCount(lesson);
        return toLessonResponse(lesson, currentUserId);
    }

    @Override
    public void deleteLesson(UUID lessonId, UUID currentUserId) {
        VocabularyLessonV2 lesson = lessonRepository.findByIdWithCreator(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        checkLessonOwnership(lesson, currentUserId);

        lessonRepository.deleteById(lessonId);
    }

    @Override
    @Transactional(readOnly = true)
    public VocabularyLessonDetailResponseV2 getLessonDetailForManagement(UUID lessonId, UUID currentUserId) {
        VocabularyLessonV2 lesson = lessonRepository.findByIdWithCreator(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));
        return toLessonDetailResponse(lesson, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyLessonResponseV2> listLessonsForManagement(String level, String topic, String search, UUID currentUserId) {
        List<VocabularyLessonV2> lessons = lessonRepository.findAllOrderedWithCreator();

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
                .map(lesson -> toLessonResponse(lesson, currentUserId))
                .collect(Collectors.toList());
    }

    @Override
    public VocabularyWordResponseV2 addWord(UUID lessonId, VocabularyWordCreateRequestV2 request, UUID currentUserId) {
        VocabularyLessonV2 lesson = lessonRepository.findByIdWithCreator(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        checkLessonOwnership(lesson, currentUserId);

        VocabularyWord word = buildVocabularyWord(lesson, request, request.getDisplayOrder());
        word = wordRepository.save(word);
        syncLessonWordCount(lesson);
        return toWordResponse(word);
    }

    @Override
    public VocabularyWordResponseV2 updateWord(UUID wordId, VocabularyWordUpdateRequestV2 request, UUID currentUserId) {
        VocabularyWord word = wordRepository.findByLessonIdWithLesson(wordId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyWord", "id", wordId));

        checkLessonOwnership(word.getLesson(), currentUserId);

        applyWordUpdate(word, request);
        word = wordRepository.save(word);
        syncLessonWordCount(word.getLesson());
        return toWordResponse(word);
    }

    @Override
    public void deleteWord(UUID wordId, UUID currentUserId) {
        VocabularyWord word = wordRepository.findByLessonIdWithLesson(wordId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyWord", "id", wordId));

        VocabularyLessonV2 lesson = word.getLesson();
        checkLessonOwnership(lesson, currentUserId);

        wordRepository.delete(word);
        syncLessonWordCount(lesson);
    }

    @Override
    public VocabularyLessonResponseV2 publishLesson(UUID lessonId, UUID currentUserId) {
        VocabularyLessonV2 lesson = lessonRepository.findByIdWithCreator(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        checkLessonOwnership(lesson, currentUserId);

        lesson.setIsPublished(true);
        lesson = lessonRepository.save(lesson);
        syncLessonWordCount(lesson);

        notificationHelper.notifyAllByRole(
                Role.STUDENT,
                UserStatus.ACTIVE,
                "New Lesson",
                "A new lesson has been published.",
                NotificationType.LESSON
        );

        return toLessonResponse(lesson, currentUserId);
    }

    @Override
    public VocabularyLessonResponseV2 unpublishLesson(UUID lessonId, UUID currentUserId) {
        VocabularyLessonV2 lesson = lessonRepository.findByIdWithCreator(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        checkLessonOwnership(lesson, currentUserId);

        lesson.setIsPublished(false);
        lesson = lessonRepository.save(lesson);
        syncLessonWordCount(lesson);
        return toLessonResponse(lesson, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyLessonResponseV2> listPublishedLessons(String level, String topic, String search) {
        List<VocabularyLessonV2> lessons;

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
                .map(lesson -> toLessonResponse(lesson, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VocabularyLessonDetailResponseV2 getPublishedLessonDetail(UUID lessonId) {
        VocabularyLessonV2 lesson = lessonRepository.findByIdWithCreator(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        if (!Boolean.TRUE.equals(lesson.getIsPublished())) {
            throw new ResourceNotFoundException("VocabularyLesson", "id", lessonId);
        }

        return toLessonDetailResponse(lesson, null);
    }

    private VocabularyLessonResponseV2 toLessonResponse(VocabularyLessonV2 lesson, UUID currentUserId) {
        int wordCount = resolveWordCount(lesson);
        boolean ownedByMe = isOwner(lesson, currentUserId);
        return VocabularyLessonResponseV2.builder()
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
                .ownedByMe(ownedByMe)
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private VocabularyLessonDetailResponseV2 toLessonDetailResponse(VocabularyLessonV2 lesson, UUID currentUserId) {
        List<VocabularyWord> wordEntities = wordRepository.findByLessonIdOrderByDisplayOrderAsc(lesson.getId());
        List<VocabularyWordResponseV2> words = wordEntities
                .stream()
                .map(this::toWordResponse)
                .collect(Collectors.toList());

        boolean ownedByMe = isOwner(lesson, currentUserId);
        return VocabularyLessonDetailResponseV2.builder()
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
                .ownedByMe(ownedByMe)
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

    private VocabularyWordResponseV2 toWordResponse(VocabularyWord word) {
        return VocabularyWordResponseV2.builder()
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

    private void applyLessonUpdate(VocabularyLessonV2 lesson, VocabularyLessonUpdateRequestV2 request) {
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

    private void applyWordUpdate(VocabularyWord word, VocabularyWordUpdateRequestV2 request) {
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

    private int saveLessonWords(VocabularyLessonV2 lesson, List<VocabularyWordCreateRequestV2> words) {
        if (words == null || words.isEmpty()) {
            return 0;
        }

        int savedWordCount = 0;
        for (int index = 0; index < words.size(); index++) {
            VocabularyWordCreateRequestV2 wordRequest = words.get(index);
            if (!wordRequest.isValidForCreate()) {
                continue;
            }

            VocabularyWord word = buildVocabularyWord(lesson, wordRequest, index);
            wordRepository.save(word);
            savedWordCount++;
        }
        entityManager.flush();
        entityManager.clear();
        return savedWordCount;
    }

    private VocabularyWord buildVocabularyWord(VocabularyLessonV2 lesson, VocabularyWordCreateRequestV2 request, int fallbackDisplayOrder) {
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

    private int resolveWordCount(VocabularyLessonV2 lesson) {
        return Math.toIntExact(wordRepository.countByLessonId(lesson.getId()));
    }

    private void syncLessonWordCount(VocabularyLessonV2 lesson) {
        int wordCount = resolveWordCount(lesson);
        lesson.setWordCount(wordCount);
        lessonRepository.save(lesson);
    }

    private void syncLessonWordCountFromInt(VocabularyLessonV2 lesson, int wordCount) {
        lesson.setWordCount(wordCount);
        lessonRepository.save(lesson);
    }
}
