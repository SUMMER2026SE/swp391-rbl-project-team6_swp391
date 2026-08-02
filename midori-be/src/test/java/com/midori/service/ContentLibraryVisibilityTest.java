package com.midori.service;

import com.midori.entity.GrammarLesson;
import com.midori.entity.VocabularyLesson;
import com.midori.repository.GrammarContentRepository;
import com.midori.repository.GrammarExampleRepository;
import com.midori.repository.GrammarLessonRepository;
import com.midori.repository.VocabularyItemRepository;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.service.impl.GrammarLessonServiceImpl;
import com.midori.service.impl.VocabularyLessonServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentLibraryVisibilityTest {

    @Mock
    private VocabularyLessonRepository vocabularyLessonRepository;

    @Mock
    private VocabularyItemRepository vocabularyItemRepository;

    @Mock
    private LessonService lessonService;

    @Mock
    private LearningJourneyLessonService learningJourneyLessonService;

    @Mock
    private GrammarLessonRepository grammarLessonRepository;

    @Mock
    private GrammarContentRepository grammarContentRepository;

    @Mock
    private GrammarExampleRepository grammarExampleRepository;

    private VocabularyLessonServiceImpl vocabularyService;
    private GrammarLessonServiceImpl grammarService;

    @BeforeEach
    void setUp() {
        vocabularyService = new VocabularyLessonServiceImpl(
                vocabularyLessonRepository,
                vocabularyItemRepository,
                lessonService,
                learningJourneyLessonService
        );

        grammarService = new GrammarLessonServiceImpl(
                grammarLessonRepository,
                grammarContentRepository,
                grammarExampleRepository,
                lessonService,
                learningJourneyLessonService
        );
    }

    @Test
    void vocabularyPublishSetsBothFlagsTrue() {
        UUID lessonId = UUID.randomUUID();
        VocabularyLesson lesson = new VocabularyLesson();
        lesson.setId(lessonId);
        lesson.setIsActive(false);
        lesson.setIsPublished(false);

        when(vocabularyLessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
        when(vocabularyLessonRepository.save(any(VocabularyLesson.class))).thenAnswer(i -> i.getArgument(0));

        vocabularyService.publishLesson(lessonId);

        assertThat(lesson.getIsActive()).isTrue();
        assertThat(lesson.getIsPublished()).isTrue();
        verify(vocabularyLessonRepository).save(lesson);
    }

    @Test
    void vocabularyUnpublishSetsBothFlagsFalse() {
        UUID lessonId = UUID.randomUUID();
        VocabularyLesson lesson = new VocabularyLesson();
        lesson.setId(lessonId);
        lesson.setIsActive(true);
        lesson.setIsPublished(true);

        when(vocabularyLessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
        when(vocabularyLessonRepository.save(any(VocabularyLesson.class))).thenAnswer(i -> i.getArgument(0));

        vocabularyService.unpublishLesson(lessonId);

        assertThat(lesson.getIsActive()).isFalse();
        assertThat(lesson.getIsPublished()).isFalse();
        verify(vocabularyLessonRepository).save(lesson);
    }

    @Test
    void grammarPublishSetsIsActiveTrue() {
        UUID lessonId = UUID.randomUUID();
        GrammarLesson lesson = new GrammarLesson();
        lesson.setId(lessonId);
        lesson.setIsActive(false);

        when(grammarLessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
        when(grammarLessonRepository.save(any(GrammarLesson.class))).thenAnswer(i -> i.getArgument(0));

        grammarService.publishLesson(lessonId);

        assertThat(lesson.getIsActive()).isTrue();
        verify(grammarLessonRepository).save(lesson);
    }

    @Test
    void grammarUnpublishSetsIsActiveFalse() {
        UUID lessonId = UUID.randomUUID();
        GrammarLesson lesson = new GrammarLesson();
        lesson.setId(lessonId);
        lesson.setIsActive(true);

        when(grammarLessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
        when(grammarLessonRepository.save(any(GrammarLesson.class))).thenAnswer(i -> i.getArgument(0));

        grammarService.unpublishLesson(lessonId);

        assertThat(lesson.getIsActive()).isFalse();
        verify(grammarLessonRepository).save(lesson);
    }
}
