package com.midori.service;

import com.midori.dto.grammar.GrammarCreateRequest;
import com.midori.dto.grammar.GrammarResponse;
import com.midori.dto.grammar.GrammarStatsResponse;
import com.midori.dto.grammar.GrammarUpdateRequest;
import com.midori.entity.ContentType;
import com.midori.entity.Grammar;
import com.midori.entity.GrammarLevel;
import com.midori.entity.GrammarStatus;
import com.midori.entity.User;
import com.midori.exception.AccessDeniedException;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.GrammarRepository;
import com.midori.repository.UserLearningProgressRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GrammarServiceImpl implements GrammarService {

    private final GrammarRepository grammarRepository;
    private final UserRepository userRepository;
    private final UserLearningProgressRepository progressRepository;

    // ============================================================
    // Ownership Check Helper
    // ============================================================

    private boolean isOwner(Grammar grammar, UUID currentUserId) {
        if (grammar == null || currentUserId == null) {
            return false;
        }
        return grammar.getCreatedBy() != null &&
               grammar.getCreatedBy().getId().equals(currentUserId);
    }

    private void checkGrammarOwnership(Grammar grammar, UUID currentUserId) {
        if (!isOwner(grammar, currentUserId)) {
            throw new AccessDeniedException("You can only modify your own grammar entries");
        }
    }

    // ============================================================
    // Teacher / Admin Methods
    // ============================================================

    @Override
    public GrammarResponse createGrammar(GrammarCreateRequest request, UUID createdBy) {
        User creator = userRepository.findById(createdBy)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", createdBy));

        Grammar grammar = Grammar.builder()
                .title(trimToNull(request.getTitle()))
                .pattern(trimToNull(request.getPattern()))
                .meaning(trimToNull(request.getMeaning()))
                .structure(trimToNull(request.getStructure()))
                .usage(trimToNull(request.getUsage()))
                .examples(request.getExamples())
                .level(parseLevel(request.getLevel()))
                .status(GrammarStatus.DRAFT)
                .createdBy(creator)
                .build();

        grammar = grammarRepository.save(grammar);
        return toGrammarResponse(grammar, createdBy);
    }

    @Override
    public GrammarResponse updateGrammar(UUID grammarId, GrammarUpdateRequest request, UUID currentUserId) {
        Grammar grammar = grammarRepository.findByIdWithCreator(grammarId)
                .orElseThrow(() -> new ResourceNotFoundException("Grammar", "id", grammarId));

        checkGrammarOwnership(grammar, currentUserId);

        if (grammar.getStatus() == GrammarStatus.PENDING ||
            grammar.getStatus() == GrammarStatus.APPROVED) {
            throw new BadRequestException("Cannot edit grammar with status " + grammar.getStatus() + ". Only DRAFT or REJECTED grammar can be edited.");
        }

        applyGrammarUpdate(grammar, request);
        grammar = grammarRepository.save(grammar);
        return toGrammarResponse(grammar, currentUserId);
    }

    @Override
    public void deleteGrammar(UUID grammarId, UUID currentUserId) {
        Grammar grammar = grammarRepository.findByIdWithCreator(grammarId)
                .orElseThrow(() -> new ResourceNotFoundException("Grammar", "id", grammarId));

        checkGrammarOwnership(grammar, currentUserId);

        grammarRepository.deleteById(grammarId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarResponse> listGrammarsForManagement(UUID currentUserId, String level, String search, String status) {
        List<Grammar> grammars;

        boolean hasSearch = search != null && !search.isBlank();
        boolean hasLevel = level != null && !level.isBlank();
        boolean hasStatus = status != null && !status.isBlank();

        if (hasSearch && hasStatus) {
            GrammarStatus parsedStatus = parseStatus(status);
            grammars = grammarRepository.searchByCreatorAndStatusWithCreator(currentUserId, parsedStatus, search.trim());
        } else if (hasSearch && hasLevel) {
            GrammarLevel parsedLevel = parseLevel(level);
            grammars = grammarRepository.searchByCreatorWithCreator(currentUserId, search.trim());
            grammars = grammars.stream().filter(g -> g.getLevel() == parsedLevel).collect(Collectors.toList());
        } else if (hasSearch) {
            grammars = grammarRepository.searchByCreatorWithCreator(currentUserId, search.trim());
        } else if (hasStatus && hasLevel) {
            GrammarStatus parsedStatus = parseStatus(status);
            GrammarLevel parsedLevel = parseLevel(level);
            grammars = grammarRepository.findAllByCreatorIdAndStatusAndLevelWithCreator(currentUserId, parsedStatus, parsedLevel);
        } else if (hasStatus) {
            GrammarStatus parsedStatus = parseStatus(status);
            grammars = grammarRepository.findAllByCreatorIdAndStatusWithCreator(currentUserId, parsedStatus);
        } else if (hasLevel) {
            GrammarLevel parsedLevel = parseLevel(level);
            grammars = grammarRepository.findAllByCreatorIdAndLevelWithCreator(currentUserId, parsedLevel);
        } else {
            grammars = grammarRepository.findAllByCreatorIdWithCreator(currentUserId);
        }

        return grammars.stream()
                .map(g -> toGrammarResponse(g, currentUserId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarResponse getGrammarForManagement(UUID grammarId, UUID currentUserId) {
        Grammar grammar = grammarRepository.findByIdWithCreator(grammarId)
                .orElseThrow(() -> new ResourceNotFoundException("Grammar", "id", grammarId));

        if (!isOwner(grammar, currentUserId)) {
            throw new AccessDeniedException("You can only view your own grammar entries");
        }

        return toGrammarResponse(grammar, currentUserId);
    }

    @Override
    public GrammarResponse submitGrammar(UUID grammarId, UUID currentUserId) {
        Grammar grammar = grammarRepository.findByIdWithCreator(grammarId)
                .orElseThrow(() -> new ResourceNotFoundException("Grammar", "id", grammarId));

        checkGrammarOwnership(grammar, currentUserId);

        if (grammar.getStatus() != GrammarStatus.DRAFT &&
            grammar.getStatus() != GrammarStatus.REJECTED) {
            throw new BadRequestException("Only DRAFT or REJECTED grammar can be submitted for review");
        }

        grammar.setStatus(GrammarStatus.PENDING);
        grammar.setRejectReason(null);
        grammar = grammarRepository.save(grammar);
        return toGrammarResponse(grammar, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarStatsResponse getGrammarStats(UUID grammarId, UUID currentUserId) {
        Grammar grammar = grammarRepository.findByIdWithCreator(grammarId)
                .orElseThrow(() -> new ResourceNotFoundException("Grammar", "id", grammarId));

        if (!isOwner(grammar, currentUserId)) {
            throw new AccessDeniedException("You can only view stats for your own grammar entries");
        }

        long completions = progressRepository.countByContentIdAndContentType(grammarId.toString(), ContentType.GRAMMAR);
        long learned = progressRepository.countLearnedByGrammarId(grammarId.toString(), ContentType.GRAMMAR);
        long views = learned; // views are tracked as 'learned' interactions

        return GrammarStatsResponse.builder()
                .views(views)
                .completions(completions)
                .learned(learned)
                .build();
    }

    // ============================================================
    // Student Methods
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<GrammarResponse> listApprovedGrammars(String level, String search) {
        List<Grammar> grammars;

        if (search != null && !search.isBlank()) {
            grammars = grammarRepository.searchByStatusWithCreator(GrammarStatus.APPROVED, search.trim());
        } else if (level != null && !level.isBlank()) {
            GrammarLevel parsedLevel = parseLevel(level);
            grammars = grammarRepository.findAllByStatusAndLevelWithCreator(GrammarStatus.APPROVED, parsedLevel);
        } else {
            grammars = grammarRepository.findAllByStatusWithCreator(GrammarStatus.APPROVED);
        }

        return grammars.stream()
                .map(g -> toGrammarResponse(g, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarResponse getApprovedGrammar(UUID grammarId) {
        Grammar grammar = grammarRepository.findByIdWithCreator(grammarId)
                .orElseThrow(() -> new ResourceNotFoundException("Grammar", "id", grammarId));

        if (grammar.getStatus() != GrammarStatus.APPROVED) {
            throw new ResourceNotFoundException("Grammar", "id", grammarId);
        }

        return toGrammarResponse(grammar, null);
    }

    // ============================================================
    // Mapper Methods
    // ============================================================

    private GrammarResponse toGrammarResponse(Grammar grammar, UUID currentUserId) {
        boolean ownedByMe = isOwner(grammar, currentUserId);
        return GrammarResponse.builder()
                .id(grammar.getId())
                .title(grammar.getTitle())
                .pattern(grammar.getPattern())
                .meaning(grammar.getMeaning())
                .structure(grammar.getStructure())
                .usage(grammar.getUsage())
                .examples(grammar.getExamples())
                .level(grammar.getLevel() != null ? grammar.getLevel().name() : null)
                .status(grammar.getStatus().name())
                .rejectReason(grammar.getRejectReason())
                .createdBy(grammar.getCreatedBy() != null ? grammar.getCreatedBy().getId() : null)
                .teacherName(resolveTeacherName(grammar.getCreatedBy()))
                .ownedByMe(ownedByMe)
                .createdAt(grammar.getCreatedAt())
                .updatedAt(grammar.getUpdatedAt())
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

    private void applyGrammarUpdate(Grammar grammar, GrammarUpdateRequest request) {
        if (request.getTitle() != null) {
            grammar.setTitle(trimToNull(request.getTitle()));
        }
        if (request.getPattern() != null) {
            grammar.setPattern(trimToNull(request.getPattern()));
        }
        if (request.getMeaning() != null) {
            grammar.setMeaning(trimToNull(request.getMeaning()));
        }
        if (request.getStructure() != null) {
            grammar.setStructure(trimToNull(request.getStructure()));
        }
        if (request.getUsage() != null) {
            grammar.setUsage(trimToNull(request.getUsage()));
        }
        if (request.getExamples() != null) {
            grammar.setExamples(request.getExamples());
        }
        if (request.getLevel() != null) {
            grammar.setLevel(parseLevel(request.getLevel()));
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

    private GrammarStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return GrammarStatus.valueOf(status.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Status must be one of: DRAFT, PENDING, APPROVED, REJECTED");
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
