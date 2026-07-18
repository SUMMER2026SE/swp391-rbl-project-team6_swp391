package com.midori.service.impl;

import com.midori.dto.vocabulary.VocabularyFavoriteResponse;
import com.midori.entity.StudentVocabularyFavorite;
import com.midori.entity.User;
import com.midori.entity.VocabularyItem;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.StudentVocabularyFavoriteRepository;
import com.midori.repository.UserRepository;
import com.midori.repository.VocabularyItemRepository;
import com.midori.service.StudentVocabularyFavoriteService;
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
public class StudentVocabularyFavoriteServiceImpl implements StudentVocabularyFavoriteService {

    private final StudentVocabularyFavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final VocabularyItemRepository vocabularyItemRepository;

    @Override
    @Transactional
    public VocabularyFavoriteResponse addFavorite(UUID studentId, UUID vocabularyItemId) {
        log.info("Adding favorite: studentId={}, vocabularyItemId={}", studentId, vocabularyItemId);

        // Check if already favorited
        if (favoriteRepository.existsByStudentIdAndVocabularyItemId(studentId, vocabularyItemId)) {
            throw new BadRequestException("This vocabulary item is already in favorites");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        VocabularyItem vocabularyItem = vocabularyItemRepository.findById(vocabularyItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Vocabulary item not found with id: " + vocabularyItemId));

        StudentVocabularyFavorite favorite = StudentVocabularyFavorite.builder()
                .student(student)
                .vocabularyItem(vocabularyItem)
                .build();

        StudentVocabularyFavorite saved = favoriteRepository.save(favorite);
        log.info("Favorite added successfully: id={}", saved.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void removeFavorite(UUID studentId, UUID vocabularyItemId) {
        log.info("Removing favorite: studentId={}, vocabularyItemId={}", studentId, vocabularyItemId);

        if (!favoriteRepository.existsByStudentIdAndVocabularyItemId(studentId, vocabularyItemId)) {
            throw new ResourceNotFoundException("Favorite not found");
        }

        favoriteRepository.deleteByStudentIdAndVocabularyItemId(studentId, vocabularyItemId);
        log.info("Favorite removed successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavorite(UUID studentId, UUID vocabularyItemId) {
        return favoriteRepository.existsByStudentIdAndVocabularyItemId(studentId, vocabularyItemId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> getFavoriteVocabularyItemIds(UUID studentId) {
        return favoriteRepository.findVocabularyItemIdsByStudentId(studentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> getFavoriteVocabularyItemIdsByLesson(UUID studentId, UUID lessonId) {
        return favoriteRepository.findVocabularyItemIdsByStudentIdAndLessonId(studentId, lessonId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyFavoriteResponse> getFavorites(UUID studentId) {
        List<StudentVocabularyFavorite> favorites = favoriteRepository.findByStudentId(studentId);
        return favorites.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyFavoriteResponse> getFavoritesByLesson(UUID studentId, UUID lessonId) {
        List<StudentVocabularyFavorite> favorites = favoriteRepository.findByStudentIdAndLessonId(studentId, lessonId);
        return favorites.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VocabularyFavoriteResponse toggleFavorite(UUID studentId, UUID vocabularyItemId) {
        log.info("Toggling favorite: studentId={}, vocabularyItemId={}", studentId, vocabularyItemId);

        if (favoriteRepository.existsByStudentIdAndVocabularyItemId(studentId, vocabularyItemId)) {
            removeFavorite(studentId, vocabularyItemId);
            return null; // Return null to indicate removed
        } else {
            return addFavorite(studentId, vocabularyItemId);
        }
    }

    private VocabularyFavoriteResponse toResponse(StudentVocabularyFavorite favorite) {
        VocabularyItem item = favorite.getVocabularyItem();
        return VocabularyFavoriteResponse.builder()
                .id(favorite.getId())
                .vocabularyItemId(item.getId())
                .japanese(item.getJapanese())
                .furigana(item.getFurigana())
                .romaji(item.getRomaji())
                .meaning(item.getMeaning())
                .exampleSentence(item.getExampleSentence())
                .exampleTranslation(item.getExampleTranslation())
                .partOfSpeech(item.getPartOfSpeech())
                .itemOrder(item.getItemOrder())
                .lessonId(item.getVocabularyLesson().getId())
                .lessonTitle(item.getVocabularyLesson().getTitle())
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
