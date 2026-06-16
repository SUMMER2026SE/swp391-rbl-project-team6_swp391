package com.midori.service.impl;

import com.midori.entity.GrammarStatus;
import com.midori.entity.Role;
import com.midori.entity.UserStatus;
import com.midori.repository.FlashcardSetRepository;
import com.midori.repository.GrammarRepository;
import com.midori.repository.ListeningLessonRepository;
import com.midori.repository.UserLearningProgressRepository;
import com.midori.repository.UserRepository;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.service.DashboardService;
import com.midori.dto.response.AdminDashboardSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final GrammarRepository grammarRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final ListeningLessonRepository listeningLessonRepository;
    private final VocabularyLessonRepository vocabularyLessonRepository;
    private final UserLearningProgressRepository userLearningProgressRepository;

    @Override
    public AdminDashboardSummaryResponse getSummary() {
        long totalUsers = userRepository.count();
        long totalTeachers = userRepository.countByRole(Role.TEACHER);
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalActiveUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long pendingTeachers = userRepository.countByRoleAndStatus(Role.TEACHER, UserStatus.PENDING_APPROVAL);

        long totalGrammar = grammarRepository.count();
        long pendingGrammar = grammarRepository.countByStatus(GrammarStatus.PENDING);
        long approvedGrammar = grammarRepository.countByStatus(GrammarStatus.APPROVED);

        long totalFlashcardSets = flashcardSetRepository.count();
        long pendingFlashcardSets = flashcardSetRepository.countByStatus(com.midori.entity.FlashcardSetStatus.PENDING);
        long approvedFlashcardSets = flashcardSetRepository.countByStatus(com.midori.entity.FlashcardSetStatus.APPROVED);

        long totalListeningLessons = listeningLessonRepository.count();
        long pendingListeningLessons = listeningLessonRepository.countByStatus("PENDING");
        long approvedListeningLessons = listeningLessonRepository.countByStatus("APPROVED");

        long totalVocabularyLessons = vocabularyLessonRepository.count();
        long publishedVocabularyLessons = vocabularyLessonRepository.countByIsPublished(true);

        long pendingContent = pendingGrammar + pendingFlashcardSets + pendingListeningLessons;
        long totalProgressRecords = userLearningProgressRepository.count();

        return AdminDashboardSummaryResponse.builder()
                .totalUsers(totalUsers)
                .totalStudents(totalStudents)
                .totalTeachers(totalTeachers)
                .totalActiveUsers(totalActiveUsers)
                .pendingTeachers(pendingTeachers)
                .pendingContent(pendingContent)
                .totalVocabularyLessons(totalVocabularyLessons)
                .totalGrammar(totalGrammar)
                .pendingGrammar(pendingGrammar)
                .approvedGrammar(approvedGrammar)
                .totalFlashcardSets(totalFlashcardSets)
                .totalListeningLessons(totalListeningLessons)
                .pendingFlashcardSets(pendingFlashcardSets)
                .approvedFlashcardSets(approvedFlashcardSets)
                .pendingListeningLessons(pendingListeningLessons)
                .approvedListeningLessons(approvedListeningLessons)
                .publishedVocabularyLessons(publishedVocabularyLessons)
                .totalProgressRecords(totalProgressRecords)
                .build();
    }
}
