package com.midori.service;

import com.midori.dto.approval.ContentApprovalDetailResponse;
import com.midori.dto.approval.ContentApprovalSummaryResponse;
import com.midori.dto.approval.ContentRejectRequest;
import com.midori.dto.approval.GrammarApprovalStatsResponse;
import com.midori.dto.flashcard.FlashcardCardResponse;
import com.midori.entity.*;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ContentApprovalServiceImpl implements ContentApprovalService {

    private final GrammarRepository grammarRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final FlashcardCardRepository flashcardCardRepository;
    private final NotificationHelperService notificationHelper;

    private void validateContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            throw new BadRequestException("Content type is required");
        }
        String upper = contentType.toUpperCase().trim();
        if (!upper.equals("GRAMMAR") && !upper.equals("FLASHCARD")) {
            throw new BadRequestException("Content type must be GRAMMAR or FLASHCARD.");
        }
    }

    private String normalizeContentType(String contentType) {
        return contentType.toUpperCase().trim();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContentApprovalSummaryResponse> listPendingContent(String contentType) {
        if (contentType != null && !contentType.isBlank()) {
            validateContentType(contentType);
            String normalized = normalizeContentType(contentType);
            if ("GRAMMAR".equals(normalized)) {
                return listPendingGrammars();
            } else if ("FLASHCARD".equals(normalized)) {
                return listPendingFlashcardSets();
            }
        }
        List<ContentApprovalSummaryResponse> result = new ArrayList<>();
        result.addAll(listPendingGrammars());
        result.addAll(listPendingFlashcardSets());
        return result;
    }

    private List<ContentApprovalSummaryResponse> listPendingGrammars() {
        // Get both PENDING (new submissions) and APPROVED with pending updates
        List<ContentApprovalSummaryResponse> result = new ArrayList<>();
        result.addAll(grammarRepository.findAllByStatusWithCreator(GrammarStatus.PENDING).stream()
                .map(this::toGrammarSummary)
                .collect(Collectors.toList()));
        result.addAll(grammarRepository.findAllApprovedWithPendingUpdate().stream()
                .map(this::toGrammarSummary)
                .collect(Collectors.toList()));
        return result;
    }

    private List<ContentApprovalSummaryResponse> listPendingFlashcardSets() {
        return flashcardSetRepository.findAllByStatusWithTeacher(FlashcardSetStatus.PENDING).stream()
                .map(this::toFlashcardSetSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContentApprovalSummaryResponse> listApprovedContent(String contentType) {
        if (contentType != null && !contentType.isBlank()) {
            validateContentType(contentType);
            String normalized = normalizeContentType(contentType);
            if ("GRAMMAR".equals(normalized)) {
                return listApprovedGrammars();
            } else if ("FLASHCARD".equals(normalized)) {
                return listApprovedFlashcardSets();
            }
        }
        List<ContentApprovalSummaryResponse> result = new ArrayList<>();
        result.addAll(listApprovedGrammars());
        result.addAll(listApprovedFlashcardSets());
        return result;
    }

    private List<ContentApprovalSummaryResponse> listApprovedGrammars() {
        return grammarRepository.findAllByStatusWithCreator(GrammarStatus.APPROVED).stream()
                .map(this::toGrammarSummary)
                .collect(Collectors.toList());
    }

    private List<ContentApprovalSummaryResponse> listApprovedFlashcardSets() {
        return flashcardSetRepository.findAllByStatusWithTeacher(FlashcardSetStatus.APPROVED).stream()
                .map(this::toFlashcardSetSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContentApprovalSummaryResponse> listRejectedContent(String contentType) {
        if (contentType != null && !contentType.isBlank()) {
            validateContentType(contentType);
            String normalized = normalizeContentType(contentType);
            if ("GRAMMAR".equals(normalized)) {
                return listRejectedGrammars();
            } else if ("FLASHCARD".equals(normalized)) {
                return listRejectedFlashcardSets();
            }
        }
        List<ContentApprovalSummaryResponse> result = new ArrayList<>();
        result.addAll(listRejectedGrammars());
        result.addAll(listRejectedFlashcardSets());
        return result;
    }

    private List<ContentApprovalSummaryResponse> listRejectedGrammars() {
        return grammarRepository.findAllByStatusWithCreator(GrammarStatus.REJECTED).stream()
                .map(this::toGrammarSummary)
                .collect(Collectors.toList());
    }

    private List<ContentApprovalSummaryResponse> listRejectedFlashcardSets() {
        return flashcardSetRepository.findAllByStatusWithTeacher(FlashcardSetStatus.REJECTED).stream()
                .map(this::toFlashcardSetSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ContentApprovalDetailResponse getPendingContentDetail(String contentType, UUID contentId) {
        validateContentType(contentType);
        String normalized = normalizeContentType(contentType);
        if ("GRAMMAR".equals(normalized)) {
            return getGrammarDetail(contentId);
        } else {
            return getFlashcardSetDetail(contentId);
        }
    }

    private ContentApprovalDetailResponse getGrammarDetail(UUID contentId) {
        Grammar grammar = grammarRepository.findByIdWithCreator(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Grammar", "id", contentId));

        // Allow viewing grammar details for any status (PENDING, APPROVED, REJECTED, DRAFT)
        // Admin needs to see details regardless of current status
        // (e.g., to review approved content or understand rejection reasons)

        return ContentApprovalDetailResponse.builder()
                .contentType("GRAMMAR")
                .contentId(grammar.getId())
                .grammar(toGrammarDetailContent(grammar))
                .build();
    }

    private ContentApprovalDetailResponse getFlashcardSetDetail(UUID contentId) {
        FlashcardSet set = flashcardSetRepository.findByIdWithTeacher(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", contentId));

        // Allow viewing flashcard details for any status (PENDING, APPROVED, REJECTED, DRAFT)
        // Admin needs to see details regardless of current status

        return ContentApprovalDetailResponse.builder()
                .contentType("FLASHCARD")
                .contentId(set.getId())
                .flashcard(toFlashcardDetailContent(set))
                .build();
    }

    @Override
    public ContentApprovalSummaryResponse approveContent(String contentType, UUID contentId) {
        validateContentType(contentType);
        String normalized = normalizeContentType(contentType);
        if ("GRAMMAR".equals(normalized)) {
            return approveGrammar(contentId);
        } else {
            return approveFlashcardSet(contentId);
        }
    }

    private ContentApprovalSummaryResponse approveGrammar(UUID contentId) {
        Grammar grammar = grammarRepository.findByIdWithCreator(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Grammar", "id", contentId));

        // Case 1: New grammar submission (PENDING) - standard workflow
        if (grammar.getStatus() == GrammarStatus.PENDING) {
            grammar.setStatus(GrammarStatus.APPROVED);
            grammar.setRejectReason(null);
            grammar = grammarRepository.save(grammar);

            notificationHelper.createNotification(
                    grammar.getCreatedBy(),
                    "Content Approved",
                    "Your grammar submission has been approved.",
                    NotificationType.CONTENT_APPROVED
            );

            return toGrammarSummary(grammar);
        }

        // Case 2: APPROVED grammar with pending update - apply the update
        if (grammar.getStatus() == GrammarStatus.APPROVED && Boolean.TRUE.equals(grammar.getHasPendingUpdate())) {
            // Copy pending fields to main fields
            grammar.setTitle(grammar.getPendingTitle() != null ? grammar.getPendingTitle() : grammar.getTitle());
            grammar.setPattern(grammar.getPendingPattern() != null ? grammar.getPendingPattern() : grammar.getPattern());
            grammar.setMeaning(grammar.getPendingMeaning() != null ? grammar.getPendingMeaning() : grammar.getMeaning());
            grammar.setStructure(grammar.getPendingStructure() != null ? grammar.getPendingStructure() : grammar.getStructure());
            grammar.setUsage(grammar.getPendingUsage() != null ? grammar.getPendingUsage() : grammar.getUsage());
            grammar.setExamples(grammar.getPendingExamples() != null && !grammar.getPendingExamples().isEmpty() ? grammar.getPendingExamples() : grammar.getExamples());
            grammar.setExampleMeanings(grammar.getPendingExampleMeanings() != null && !grammar.getPendingExampleMeanings().isEmpty() ? grammar.getPendingExampleMeanings() : grammar.getExampleMeanings());
            grammar.setLevel(grammar.getPendingLevel() != null ? grammar.getPendingLevel() : grammar.getLevel());

            // Clear pending fields
            clearPendingFields(grammar);

            grammar = grammarRepository.save(grammar);

            notificationHelper.createNotification(
                    grammar.getCreatedBy(),
                    "Content Update Approved",
                    "Your grammar update has been approved and is now live for students.",
                    NotificationType.CONTENT_APPROVED
            );

            return toGrammarSummary(grammar);
        }

        throw new BadRequestException("Grammar cannot be approved. Current status: " + grammar.getStatus());
    }

    private ContentApprovalSummaryResponse approveFlashcardSet(UUID contentId) {
        FlashcardSet set = flashcardSetRepository.findByIdWithTeacher(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", contentId));

        if (set.getStatus() != FlashcardSetStatus.PENDING) {
            throw new BadRequestException("Only PENDING flashcard sets can be approved. Current status: " + set.getStatus());
        }

        set.setStatus(FlashcardSetStatus.APPROVED);
        set.setRejectReason(null);
        set = flashcardSetRepository.save(set);

        // Notify teacher about content approval
        notificationHelper.createNotification(
                set.getTeacher(),
                "Content Approved",
                "Your content has been approved.",
                NotificationType.CONTENT_APPROVED
        );

        return toFlashcardSetSummary(set);
    }

    @Override
    public ContentApprovalSummaryResponse rejectContent(String contentType, UUID contentId, ContentRejectRequest request) {
        validateContentType(contentType);
        String normalized = normalizeContentType(contentType);
        if ("GRAMMAR".equals(normalized)) {
            return rejectGrammar(contentId, request);
        } else {
            return rejectFlashcardSet(contentId, request);
        }
    }

    private ContentApprovalSummaryResponse rejectGrammar(UUID contentId, ContentRejectRequest request) {
        Grammar grammar = grammarRepository.findByIdWithCreator(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Grammar", "id", contentId));

        // Case 1: New grammar submission (PENDING) - standard workflow
        if (grammar.getStatus() == GrammarStatus.PENDING) {
            grammar.setStatus(GrammarStatus.REJECTED);
            grammar.setRejectReason(trimToNull(request.getReason()));
            grammar = grammarRepository.save(grammar);

            String content = request.getReason() != null && !request.getReason().isBlank()
                    ? "Your grammar submission was rejected. Reason: " + request.getReason().trim()
                    : "Your grammar submission was rejected.";
            notificationHelper.createNotification(
                    grammar.getCreatedBy(),
                    "Content Rejected",
                    content,
                    NotificationType.CONTENT_REJECTED
            );

            return toGrammarSummary(grammar);
        }

        // Case 2: APPROVED grammar with pending update - reject only the update
        if (grammar.getStatus() == GrammarStatus.APPROVED && Boolean.TRUE.equals(grammar.getHasPendingUpdate())) {
            // Keep main fields, just clear pending
            grammar.setPendingUpdateRejectReason(trimToNull(request.getReason()));
            clearPendingFields(grammar);
            grammar = grammarRepository.save(grammar);

            String content = request.getReason() != null && !request.getReason().isBlank()
                    ? "Your grammar update was rejected. Reason: " + request.getReason().trim()
                    : "Your grammar update was rejected. The previous approved version is still visible to students.";
            notificationHelper.createNotification(
                    grammar.getCreatedBy(),
                    "Update Rejected",
                    content,
                    NotificationType.CONTENT_REJECTED
            );

            return toGrammarSummary(grammar);
        }

        throw new BadRequestException("Grammar cannot be rejected. Current status: " + grammar.getStatus());
    }

    private ContentApprovalSummaryResponse rejectFlashcardSet(UUID contentId, ContentRejectRequest request) {
        FlashcardSet set = flashcardSetRepository.findByIdWithTeacher(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", contentId));

        if (set.getStatus() != FlashcardSetStatus.PENDING) {
            throw new BadRequestException("Only PENDING flashcard sets can be rejected. Current status: " + set.getStatus());
        }

        set.setStatus(FlashcardSetStatus.REJECTED);
        set.setRejectReason(trimToNull(request.getReason()));
        set = flashcardSetRepository.save(set);

        // Notify teacher about content rejection (include the reason)
        String content = request.getReason() != null && !request.getReason().isBlank()
                ? "Your content was rejected. Reason: " + request.getReason().trim()
                : "Your content was rejected.";
        notificationHelper.createNotification(
                set.getTeacher(),
                "Content Rejected",
                content,
                NotificationType.CONTENT_REJECTED
        );

        return toFlashcardSetSummary(set);
    }

    private ContentApprovalSummaryResponse toGrammarSummary(Grammar grammar) {
        return ContentApprovalSummaryResponse.builder()
                .contentType("GRAMMAR")
                .contentId(grammar.getId())
                .title(grammar.getTitle())
                .level(grammar.getLevel() != null ? grammar.getLevel().name() : null)
                .status(grammar.getStatus().name())
                .teacherId(grammar.getCreatedBy() != null ? grammar.getCreatedBy().getId() : null)
                .teacherName(resolveTeacherName(grammar.getCreatedBy()))
                .rejectReason(grammar.getRejectReason())
                .submittedAt(grammar.getUpdatedAt())
                .updatedAt(grammar.getUpdatedAt())
                .hasPendingUpdate(Boolean.TRUE.equals(grammar.getHasPendingUpdate()))
                .build();
    }

    private ContentApprovalSummaryResponse toFlashcardSetSummary(FlashcardSet set) {
        long cardCount = flashcardCardRepository.countByFlashcardSetId(set.getId());
        return ContentApprovalSummaryResponse.builder()
                .contentType("FLASHCARD")
                .contentId(set.getId())
                .title(set.getTitle())
                .level(set.getLevel() != null ? set.getLevel().name() : null)
                .status(set.getStatus().name())
                .teacherId(set.getTeacher() != null ? set.getTeacher().getId() : null)
                .teacherName(resolveTeacherName(set.getTeacher()))
                .rejectReason(set.getRejectReason())
                .submittedAt(set.getUpdatedAt())
                .updatedAt(set.getUpdatedAt())
                .build();
    }

    private ContentApprovalDetailResponse.GrammarDetailContent toGrammarDetailContent(Grammar grammar) {
        return ContentApprovalDetailResponse.GrammarDetailContent.builder()
                .id(grammar.getId())
                .title(grammar.getTitle())
                .pattern(grammar.getPattern())
                .meaning(grammar.getMeaning())
                .structure(grammar.getStructure())
                .usage(grammar.getUsage())
                .examples(grammar.getExamples())
                .exampleMeanings(grammar.getExampleMeanings())
                .level(grammar.getLevel() != null ? grammar.getLevel().name() : null)
                .status(grammar.getStatus().name())
                .rejectReason(grammar.getRejectReason())
                .createdBy(grammar.getCreatedBy() != null ? grammar.getCreatedBy().getId() : null)
                .teacherName(resolveTeacherName(grammar.getCreatedBy()))
                .createdAt(grammar.getCreatedAt())
                .updatedAt(grammar.getUpdatedAt())
                .hasPendingUpdate(grammar.getHasPendingUpdate())
                .pendingTitle(grammar.getPendingTitle())
                .pendingPattern(grammar.getPendingPattern())
                .pendingMeaning(grammar.getPendingMeaning())
                .pendingStructure(grammar.getPendingStructure())
                .pendingUsage(grammar.getPendingUsage())
                .pendingExamples(grammar.getPendingExamples())
                .pendingExampleMeanings(grammar.getPendingExampleMeanings())
                .pendingLevel(grammar.getPendingLevel() != null ? grammar.getPendingLevel().name() : null)
                .pendingUpdateRejectReason(grammar.getPendingUpdateRejectReason())
                .build();
    }

    private ContentApprovalDetailResponse.FlashcardDetailContent toFlashcardDetailContent(FlashcardSet set) {
        List<FlashcardCardResponse> cards = set.getCards().stream()
                .map(this::toFlashcardCardResponse)
                .collect(Collectors.toList());
        return ContentApprovalDetailResponse.FlashcardDetailContent.builder()
                .id(set.getId())
                .title(set.getTitle())
                .description(set.getDescription())
                .level(set.getLevel() != null ? set.getLevel().name() : null)
                .status(set.getStatus().name())
                .rejectReason(set.getRejectReason())
                .teacherId(set.getTeacher() != null ? set.getTeacher().getId() : null)
                .teacherName(resolveTeacherName(set.getTeacher()))
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
            return "System";
        }
        if (teacher.getProfile() != null && teacher.getProfile().getDisplayName() != null) {
            return teacher.getProfile().getDisplayName();
        }
        if (teacher.getEmail() != null) {
            return teacher.getEmail();
        }
        return "System";
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void clearPendingFields(Grammar grammar) {
        grammar.setHasPendingUpdate(false);
        grammar.setPendingTitle(null);
        grammar.setPendingPattern(null);
        grammar.setPendingMeaning(null);
        grammar.setPendingStructure(null);
        grammar.setPendingUsage(null);
        grammar.setPendingExamples(null);
        grammar.setPendingExampleMeanings(null);
        grammar.setPendingLevel(null);
        grammar.setPendingUpdateRejectReason(null);
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarApprovalStatsResponse getGrammarApprovalStats() {
        long pendingCount = grammarRepository.countByStatus(GrammarStatus.PENDING);
        long approvedCount = grammarRepository.countByStatus(GrammarStatus.APPROVED);
        long rejectedCount = grammarRepository.countByStatus(GrammarStatus.REJECTED);
        long draftCount = grammarRepository.countByStatus(GrammarStatus.DRAFT);
        long totalCount = pendingCount + approvedCount;

        return GrammarApprovalStatsResponse.builder()
                .pendingReview(pendingCount)
                .approved(approvedCount)
                .rejected(rejectedCount)
                .draft(draftCount)
                .totalGrammar(totalCount)
                .build();
    }
}
