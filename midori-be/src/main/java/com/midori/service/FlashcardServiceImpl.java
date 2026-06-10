package com.midori.service;

import com.midori.dto.flashcard.*;
import com.midori.entity.*;
import com.midori.exception.AccessDeniedException;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FlashcardServiceImpl implements FlashcardService {

    private final FlashcardSetRepository flashcardSetRepository;
    private final FlashcardCardRepository flashcardCardRepository;
    private final UserRepository userRepository;

    // ============================================================
    // Ownership Check Helper
    // ============================================================

    private boolean isOwner(FlashcardSet set, UUID currentUserId) {
        if (set == null || currentUserId == null) {
            return false;
        }
        return set.getTeacher() != null && set.getTeacher().getId().equals(currentUserId);
    }

    private void checkSetOwnership(FlashcardSet set, UUID currentUserId) {
        if (!isOwner(set, currentUserId)) {
            throw new AccessDeniedException("You can only modify your own flashcard sets");
        }
    }

    private void checkCardOwnership(FlashcardCard card, UUID currentUserId) {
        if (card == null || card.getFlashcardSet() == null) {
            throw new AccessDeniedException("Card not found or has no associated set");
        }
        FlashcardSet set = card.getFlashcardSet();
        if (!isOwner(set, currentUserId)) {
            throw new AccessDeniedException("You can only modify cards in your own flashcard sets");
        }
    }

    // ============================================================
    // Teacher / Admin Methods
    // ============================================================

    @Override
    public FlashcardSetResponse createFlashcardSet(FlashcardSetCreateRequest request, UUID teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));

        FlashcardSet set = FlashcardSet.builder()
                .title(trimToNull(request.getTitle()))
                .description(trimToNull(request.getDescription()))
                .level(parseLevel(request.getLevel()))
                .status(FlashcardSetStatus.DRAFT)
                .teacher(teacher)
                .build();

        set = flashcardSetRepository.save(set);
        return toFlashcardSetResponse(set, teacherId);
    }

    @Override
    public FlashcardSetResponse updateFlashcardSet(UUID setId, FlashcardSetUpdateRequest request, UUID currentUserId) {
        FlashcardSet set = flashcardSetRepository.findByIdWithTeacher(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));

        checkSetOwnership(set, currentUserId);

        if (set.getStatus() == FlashcardSetStatus.PENDING ||
            set.getStatus() == FlashcardSetStatus.APPROVED) {
            throw new BadRequestException("Cannot edit flashcard set with status " + set.getStatus() + ". Only DRAFT or REJECTED sets can be edited.");
        }

        applySetUpdate(set, request);
        set = flashcardSetRepository.save(set);
        return toFlashcardSetResponse(set, currentUserId);
    }

    @Override
    public void deleteFlashcardSet(UUID setId, UUID currentUserId) {
        FlashcardSet set = flashcardSetRepository.findByIdWithTeacher(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));

        checkSetOwnership(set, currentUserId);

        flashcardSetRepository.deleteById(setId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardSetResponse> listFlashcardSetsForManagement(UUID currentUserId, String level, String search) {
        List<FlashcardSet> sets;

        if (search != null && !search.isBlank()) {
            sets = flashcardSetRepository.searchByTeacherIdWithTeacher(currentUserId, search.trim());
        } else if (level != null && !level.isBlank()) {
            GrammarLevel parsedLevel = parseLevel(level);
            sets = flashcardSetRepository.findAllByTeacherIdAndLevelWithTeacher(currentUserId, parsedLevel);
        } else {
            sets = flashcardSetRepository.findAllByTeacherIdWithTeacher(currentUserId);
        }

        return sets.stream()
                .map(s -> toFlashcardSetResponse(s, currentUserId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public FlashcardSetDetailResponse getFlashcardSetForManagement(UUID setId, UUID currentUserId) {
        FlashcardSet set = flashcardSetRepository.findByIdWithTeacher(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));

        if (!isOwner(set, currentUserId)) {
            throw new AccessDeniedException("You can only view your own flashcard sets");
        }

        return toFlashcardSetDetailResponse(set, currentUserId);
    }

    @Override
    public FlashcardSetResponse submitFlashcardSet(UUID setId, UUID currentUserId) {
        FlashcardSet set = flashcardSetRepository.findByIdWithTeacher(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));

        checkSetOwnership(set, currentUserId);

        if (set.getStatus() != FlashcardSetStatus.DRAFT &&
            set.getStatus() != FlashcardSetStatus.REJECTED) {
            throw new BadRequestException("Only DRAFT or REJECTED flashcard sets can be submitted for review");
        }

        set.setStatus(FlashcardSetStatus.PENDING);
        set.setRejectReason(null);
        set = flashcardSetRepository.save(set);
        return toFlashcardSetResponse(set, currentUserId);
    }

    @Override
    public FlashcardCardResponse addCard(UUID setId, FlashcardCardCreateRequest request, UUID currentUserId) {
        FlashcardSet set = flashcardSetRepository.findByIdWithTeacher(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));

        checkSetOwnership(set, currentUserId);

        Integer nextOrderIndex = request.getOrderIndex();
        if (nextOrderIndex == null) {
            long count = flashcardCardRepository.countByFlashcardSetId(setId);
            nextOrderIndex = (int) count;
        }

        FlashcardCard card = FlashcardCard.builder()
                .flashcardSet(set)
                .frontText(trimToNull(request.getFrontText()))
                .backText(trimToNull(request.getBackText()))
                .example(trimToNull(request.getExample()))
                .hint(trimToNull(request.getHint()))
                .orderIndex(nextOrderIndex)
                .build();

        card = flashcardCardRepository.save(card);
        return toFlashcardCardResponse(card);
    }

    @Override
    public FlashcardCardResponse updateCard(UUID cardId, FlashcardCardUpdateRequest request, UUID currentUserId) {
        FlashcardCard card = flashcardCardRepository.findByIdWithSetAndTeacher(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardCard", "id", cardId));

        checkCardOwnership(card, currentUserId);

        applyCardUpdate(card, request);
        card = flashcardCardRepository.save(card);
        return toFlashcardCardResponse(card);
    }

    @Override
    public void deleteCard(UUID cardId, UUID currentUserId) {
        FlashcardCard card = flashcardCardRepository.findByIdWithSetAndTeacher(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardCard", "id", cardId));

        checkCardOwnership(card, currentUserId);

        flashcardCardRepository.deleteById(cardId);
    }

    // ============================================================
    // Student Methods
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardSetResponse> listApprovedFlashcardSets(String level, String search) {
        List<FlashcardSet> sets;

        if (search != null && !search.isBlank()) {
            sets = flashcardSetRepository.searchByStatusWithTeacher(FlashcardSetStatus.APPROVED, search.trim());
        } else if (level != null && !level.isBlank()) {
            GrammarLevel parsedLevel = parseLevel(level);
            sets = flashcardSetRepository.findAllByStatusAndLevelWithTeacher(FlashcardSetStatus.APPROVED, parsedLevel);
        } else {
            sets = flashcardSetRepository.findAllByStatusWithTeacher(FlashcardSetStatus.APPROVED);
        }

        return sets.stream()
                .map(s -> toFlashcardSetResponse(s, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public FlashcardSetDetailResponse getApprovedFlashcardSet(UUID setId) {
        FlashcardSet set = flashcardSetRepository.findByIdWithTeacher(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));

        if (set.getStatus() != FlashcardSetStatus.APPROVED) {
            throw new ResourceNotFoundException("FlashcardSet", "id", setId);
        }

        return toFlashcardSetDetailResponse(set, null);
    }

    // ============================================================
    // Mapper Methods
    // ============================================================

    private FlashcardSetResponse toFlashcardSetResponse(FlashcardSet set, UUID currentUserId) {
        long cardCount = flashcardCardRepository.countByFlashcardSetId(set.getId());
        boolean ownedByMe = isOwner(set, currentUserId);
        return FlashcardSetResponse.builder()
                .id(set.getId())
                .title(set.getTitle())
                .description(set.getDescription())
                .level(set.getLevel() != null ? set.getLevel().name() : null)
                .status(set.getStatus().name())
                .rejectReason(set.getRejectReason())
                .teacherId(set.getTeacher() != null ? set.getTeacher().getId() : null)
                .teacherName(resolveTeacherName(set.getTeacher()))
                .ownedByMe(ownedByMe)
                .cardCount(cardCount)
                .createdAt(set.getCreatedAt())
                .updatedAt(set.getUpdatedAt())
                .build();
    }

    private FlashcardSetDetailResponse toFlashcardSetDetailResponse(FlashcardSet set, UUID currentUserId) {
        boolean ownedByMe = isOwner(set, currentUserId);
        List<FlashcardCardResponse> cards = set.getCards().stream()
                .map(this::toFlashcardCardResponse)
                .collect(Collectors.toList());
        return FlashcardSetDetailResponse.builder()
                .id(set.getId())
                .title(set.getTitle())
                .description(set.getDescription())
                .level(set.getLevel() != null ? set.getLevel().name() : null)
                .status(set.getStatus().name())
                .rejectReason(set.getRejectReason())
                .teacherId(set.getTeacher() != null ? set.getTeacher().getId() : null)
                .teacherName(resolveTeacherName(set.getTeacher()))
                .ownedByMe(ownedByMe)
                .cardCount((long) cards.size())
                .cards(cards)
                .createdAt(set.getCreatedAt())
                .updatedAt(set.getUpdatedAt())
                .build();
    }

    private FlashcardCardResponse toFlashcardCardResponse(FlashcardCard card) {
        return FlashcardCardResponse.builder()
                .id(card.getId())
                .frontText(card.getFrontText())
                .backText(card.getBackText())
                .example(card.getExample())
                .hint(card.getHint())
                .orderIndex(card.getOrderIndex())
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .build();
    }

    private String resolveTeacherName(User teacher) {
        if (teacher == null) {
            return "MIDORI";
        }
        if (teacher.getProfile() != null && teacher.getProfile().getDisplayName() != null) {
            return teacher.getProfile().getDisplayName();
        }
        if (teacher.getEmail() != null) {
            return teacher.getEmail();
        }
        return "System";
    }

    private void applySetUpdate(FlashcardSet set, FlashcardSetUpdateRequest request) {
        if (request.getTitle() != null) {
            set.setTitle(trimToNull(request.getTitle()));
        }
        if (request.getDescription() != null) {
            set.setDescription(trimToNull(request.getDescription()));
        }
        if (request.getLevel() != null) {
            set.setLevel(parseLevel(request.getLevel()));
        }
    }

    private void applyCardUpdate(FlashcardCard card, FlashcardCardUpdateRequest request) {
        if (request.getFrontText() != null) {
            card.setFrontText(trimToNull(request.getFrontText()));
        }
        if (request.getBackText() != null) {
            card.setBackText(trimToNull(request.getBackText()));
        }
        if (request.getExample() != null) {
            card.setExample(trimToNull(request.getExample()));
        }
        if (request.getHint() != null) {
            card.setHint(trimToNull(request.getHint()));
        }
        if (request.getOrderIndex() != null) {
            card.setOrderIndex(request.getOrderIndex());
        }
    }

    private GrammarLevel parseLevel(String level) {
        if (level == null || level.isBlank()) {
            return null;
        }
        try {
            return GrammarLevel.valueOf(level.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Level must be one of: N5, N4, N3, N2, N1");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
