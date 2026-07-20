package com.midori.service;

import com.midori.entity.QuestionBankLesson;
import com.midori.entity.TeacherQuestion;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.HomeworkQuestionRepository;
import com.midori.repository.QuestionBankLessonRepository;
import com.midori.repository.TeacherQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionBankLessonServiceImpl implements QuestionBankLessonService {

    private final QuestionBankLessonRepository lessonRepository;
    private final TeacherQuestionRepository teacherQuestionRepository;
    private final HomeworkQuestionRepository homeworkQuestionRepository;

    @Override
    public List<QuestionBankLesson> findLessonsByLevel(String level) {
        return lessonRepository.findByLevelOrderByLessonNumberAsc(level.toUpperCase());
    }

    @Override
    public List<QuestionBankLesson> findActiveLessonsByLevel(String level) {
        return lessonRepository.findByLevelAndStatusOrderByLessonNumberAsc(
                level.toUpperCase(),
                com.midori.entity.UserStatus.ACTIVE.name()
        );
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
        // Remove homework_questions referencing this lesson's questions, then remove the questions
        List<TeacherQuestion> questions = teacherQuestionRepository.findByLessonId(id);
        if (!questions.isEmpty()) {
            List<UUID> questionIds = questions.stream()
                    .map(TeacherQuestion::getId)
                    .collect(Collectors.toList());
            homeworkQuestionRepository.deleteByQuestionIdIn(questionIds);
            teacherQuestionRepository.deleteAll(questions);
        }
        lessonRepository.delete(lesson);
    }

    @Override
    public QuestionBankLesson findLessonById(Integer id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuestionBankLesson", "id", id));
    }
}
