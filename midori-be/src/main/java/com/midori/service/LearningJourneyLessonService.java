package com.midori.service;

import java.util.UUID;

/**
 * Centralised cleanup for shared {@code Lesson} records in the Learning Journey.
 *
 * <p>A {@code Lesson} only exists while at least one of the four skills
 * (Vocabulary, Grammar, Reading, Listening) still references it. When the last
 * skill is deleted, the {@code Lesson} itself must be removed as well so the
 * journey list stays in sync with reality.
 */
public interface LearningJourneyLessonService {

    /**
     * Checks whether the shared {@code Lesson} with the given id is still
     * referenced by at least one skill. When no skill remains, the
     * {@code Lesson} is deleted inside the current transaction.
     *
     * <p>The method is safe to call from any of the four skill
     * {@code deleteLesson(...)} operations: it relies on COUNT/EXISTS queries
     * (no entity hydration) and commits alongside the caller because it joins
     * the active transaction.
     *
     * @param lessonId the shared {@code Lesson} id (may be {@code null})
     * @return {@code true} when the lesson was removed, {@code false} otherwise
     */
    boolean checkAndDeleteEmptyLesson(UUID lessonId);
}
