package com.midori.service.impl;

import com.midori.repository.GrammarLessonRepository;
import com.midori.repository.LessonRepository;
import com.midori.repository.ListeningLessonRepository;
import com.midori.repository.ReadingLessonRepository;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.service.LearningJourneyLessonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Default implementation of {@link LearningJourneyLessonService}. The cleanup
 * is intentionally exposed as a service (rather than wired into the four
 * controllers) so the "delete skill then maybe delete lesson" sequence always
 * happens in a single transaction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LearningJourneyLessonServiceImpl implements LearningJourneyLessonService {

    private final LessonRepository lessonRepository;
    private final VocabularyLessonRepository vocabularyLessonRepository;
    private final GrammarLessonRepository grammarLessonRepository;
    private final ReadingLessonRepository readingLessonRepository;
    private final ListeningLessonRepository listeningLessonRepository;

    /**
     * Runs in the caller's transaction so the skill deletion and the lesson
     * deletion either both succeed or both roll back. We never start a new
     * transaction here: that would leave a window where the skill is gone but
     * the empty lesson is still visible.
     */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean checkAndDeleteEmptyLesson(UUID lessonId) {
        if (lessonId == null) {
            return false;
        }

        // Guard: lesson may already be gone (e.g. deleted earlier in a batch
        // when more than one skill of the same lesson was removed).
        if (!lessonRepository.existsById(lessonId)) {
            log.debug("Lesson {} no longer exists, nothing to clean up", lessonId);
            return false;
        }

        // COUNT-based checks are short-circuited by the EXISTS in the
        // repositories and leverage the existing idx_*_lesson_id indexes, so
        // we do not load any rows just to know whether anything is still there.
        long vocabularyCount = vocabularyLessonRepository.countByLessonId(lessonId);
        long grammarCount = grammarLessonRepository.countByLessonId(lessonId);
        long readingCount = readingLessonRepository.countByLessonId(lessonId);
        long listeningCount = listeningLessonRepository.countByLessonId(lessonId);

        long total = vocabularyCount + grammarCount + readingCount + listeningCount;
        if (total > 0) {
            log.debug(
                    "Lesson {} still has skills (vocab={}, grammar={}, reading={}, listening={}); keeping lesson",
                    lessonId, vocabularyCount, grammarCount, readingCount, listeningCount);
            return false;
        }

        lessonRepository.deleteById(lessonId);
        log.info("Lesson {} had no remaining skills; deleted shared lesson", lessonId);
        return true;
    }
}
