package com.midori.service;

import com.midori.repository.GrammarLessonRepository;
import com.midori.repository.LessonRepository;
import com.midori.repository.ListeningLessonRepository;
import com.midori.repository.ReadingLessonRepository;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.service.impl.LearningJourneyLessonServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Regression tests for the {@code Lesson} cleanup business rule:
 *
 * <p>A shared {@code Lesson} in the Learning Journey must exist only while at
 * least one of the four skills (Vocabulary, Grammar, Reading, Listening) still
 * references it. The cleanup service must remove the {@code Lesson} only when
 * all four skills are gone, and never otherwise.
 */
@ExtendWith(MockitoExtension.class)
class LearningJourneyLessonServiceTest {

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private VocabularyLessonRepository vocabularyLessonRepository;

    @Mock
    private GrammarLessonRepository grammarLessonRepository;

    @Mock
    private ReadingLessonRepository readingLessonRepository;

    @Mock
    private ListeningLessonRepository listeningLessonRepository;

    private LearningJourneyLessonServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new LearningJourneyLessonServiceImpl(
                lessonRepository,
                vocabularyLessonRepository,
                grammarLessonRepository,
                readingLessonRepository,
                listeningLessonRepository);
    }

    private boolean invokeWithActiveTransaction(UUID lessonId) {
        // The service uses Propagation.MANDATORY, so we simulate an active
        // transaction by binding an empty synchronization scope and invoking
        // directly (no TransactionTemplate needed in unit tests).
        try {
            TransactionSynchronizationManager.initSynchronization();
            return service.checkAndDeleteEmptyLesson(lessonId);
        } finally {
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.clear();
            }
        }
    }

    @Nested
    @DisplayName("checkAndDeleteEmptyLesson")
    class CheckAndDeleteEmptyLesson {

        @Test
        @DisplayName("null lessonId is a no-op")
        void nullLessonId_doesNothing() {
            assertThat(invokeWithActiveTransaction(null)).isFalse();
            verifyNoInteractions(lessonRepository, vocabularyLessonRepository,
                    grammarLessonRepository, readingLessonRepository, listeningLessonRepository);
        }

        @Test
        @DisplayName("Test 1 — only Vocabulary present, then deleted: Lesson is removed")
        void onlyVocabularyRemaining_lessonDeleted() {
            UUID lessonId = UUID.randomUUID();
            when(lessonRepository.existsById(lessonId)).thenReturn(true);
            when(vocabularyLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(grammarLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(readingLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(listeningLessonRepository.countByLessonId(lessonId)).thenReturn(0L);

            assertThat(invokeWithActiveTransaction(lessonId)).isTrue();
            verify(lessonRepository).deleteById(lessonId);
        }

        @Test
        @DisplayName("Test 2 — Vocabulary + Reading; deleting Vocabulary keeps the Lesson")
        void vocabularyAndReading_keepsLesson() {
            UUID lessonId = UUID.randomUUID();
            when(lessonRepository.existsById(lessonId)).thenReturn(true);
            when(vocabularyLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(grammarLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(readingLessonRepository.countByLessonId(lessonId)).thenReturn(1L);
            when(listeningLessonRepository.countByLessonId(lessonId)).thenReturn(0L);

            assertThat(invokeWithActiveTransaction(lessonId)).isFalse();
            verify(lessonRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Test 3a — Grammar + Listening; deleting Grammar keeps the Lesson")
        void grammarAndListening_keepsLesson() {
            UUID lessonId = UUID.randomUUID();
            when(lessonRepository.existsById(lessonId)).thenReturn(true);
            when(vocabularyLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(grammarLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(readingLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(listeningLessonRepository.countByLessonId(lessonId)).thenReturn(1L);

            assertThat(invokeWithActiveTransaction(lessonId)).isFalse();
            verify(lessonRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Test 3b — after Grammar then Listening are removed, Lesson is deleted")
        void grammarAndListening_sequentialDeletes_lessonDeleted() {
            UUID lessonId = UUID.randomUUID();
            when(lessonRepository.existsById(lessonId)).thenReturn(true);
            when(vocabularyLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(grammarLessonRepository.countByLessonId(lessonId)).thenReturn(1L);
            when(readingLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(listeningLessonRepository.countByLessonId(lessonId)).thenReturn(0L);

            assertThat(invokeWithActiveTransaction(lessonId)).isFalse();
            verify(lessonRepository, never()).deleteById(any());

            // After the second skill deletion, both counts become 0.
            when(grammarLessonRepository.countByLessonId(lessonId)).thenReturn(0L);

            assertThat(invokeWithActiveTransaction(lessonId)).isTrue();
            verify(lessonRepository).deleteById(lessonId);
        }

        @Test
        @DisplayName("Test 4 — only the last skill is gone, the Lesson is removed")
        void onlyLastSkillRemaining_lessonDeleted() {
            UUID lessonId = UUID.randomUUID();
            when(lessonRepository.existsById(lessonId)).thenReturn(true);
            when(vocabularyLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(grammarLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(readingLessonRepository.countByLessonId(lessonId)).thenReturn(0L);
            when(listeningLessonRepository.countByLessonId(lessonId)).thenReturn(1L);

            assertThat(invokeWithActiveTransaction(lessonId)).isFalse();
            verify(lessonRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Lesson already gone (idempotent) returns false without deleting again")
        void lessonAlreadyRemoved_isNoop() {
            UUID lessonId = UUID.randomUUID();
            when(lessonRepository.existsById(lessonId)).thenReturn(false);

            assertThat(invokeWithActiveTransaction(lessonId)).isFalse();
            verify(lessonRepository, never()).deleteById(any());
            verify(vocabularyLessonRepository, never()).countByLessonId(any());
        }
    }
}
