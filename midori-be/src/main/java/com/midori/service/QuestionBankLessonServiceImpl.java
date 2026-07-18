package com.midori.service;

import com.midori.entity.QuestionBankLesson;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.QuestionBankLessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionBankLessonServiceImpl implements QuestionBankLessonService {

    private final QuestionBankLessonRepository lessonRepository;

    @Override
    public List<QuestionBankLesson> findLessonsByLevel(String level) {
        return lessonRepository.findByLevelOrderByLessonNumberAsc(level.toUpperCase());
    }

    @Override
    @Transactional
    public QuestionBankLesson createLesson(QuestionBankLesson lesson) {
        if (lessonRepository.existsByLevelAndLessonNumber(lesson.getLevel(), lesson.getLessonNumber())) {
            throw new IllegalArgumentException("Lesson number already exists for this level");
        }
        return lessonRepository.save(lesson);
    }

    @Override
    @Transactional
    public QuestionBankLesson updateLesson(Integer id, String lessonName, Integer lessonNumber, String status) {
        QuestionBankLesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuestionBankLesson", "id", id));
        if (lessonName != null) {
            lesson.setLessonName(lessonName);
        }
        if (status != null) {
            lesson.setStatus(status.toUpperCase());
        }
        if (lessonNumber != null && !lesson.getLessonNumber().equals(lessonNumber)) {
            if (lessonRepository.existsByLevelAndLessonNumber(lesson.getLevel(), lessonNumber)) {
                throw new IllegalArgumentException("Lesson number already exists for this level");
            }
            lesson.setLessonNumber(lessonNumber);
        }
        return lessonRepository.save(lesson);
    }

    @Override
    @Transactional
    public void deleteLesson(Integer id) {
        QuestionBankLesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuestionBankLesson", "id", id));
        lessonRepository.delete(lesson);
    }

    @Override
    public QuestionBankLesson findLessonById(Integer id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuestionBankLesson", "id", id));
    }
}
