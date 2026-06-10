package com.midori.service;

import com.midori.dto.flashcard.*;

import java.util.List;
import java.util.UUID;

public interface FlashcardService {

    // ===== Teacher / Admin =====

    FlashcardSetResponse createFlashcardSet(FlashcardSetCreateRequest request, UUID teacherId);

    FlashcardSetResponse updateFlashcardSet(UUID setId, FlashcardSetUpdateRequest request, UUID currentUserId);

    void deleteFlashcardSet(UUID setId, UUID currentUserId);

    List<FlashcardSetResponse> listFlashcardSetsForManagement(UUID currentUserId, String level, String search);

    FlashcardSetDetailResponse getFlashcardSetForManagement(UUID setId, UUID currentUserId);

    FlashcardSetResponse submitFlashcardSet(UUID setId, UUID currentUserId);

    FlashcardCardResponse addCard(UUID setId, FlashcardCardCreateRequest request, UUID currentUserId);

    FlashcardCardResponse updateCard(UUID cardId, FlashcardCardUpdateRequest request, UUID currentUserId);

    void deleteCard(UUID cardId, UUID currentUserId);

    // ===== Student =====

    List<FlashcardSetResponse> listApprovedFlashcardSets(String level, String search);

    FlashcardSetDetailResponse getApprovedFlashcardSet(UUID setId);
}
