package com.midori.service;

import com.midori.dto.questiondto.AssignExamFromBankRequest;
import com.midori.dto.questiondto.AssignHomeworkFromBankRequest;
import com.midori.entity.*;
import com.midori.exception.AccessDeniedException;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionBankAssignService {

    private final TeacherQuestionRepository teacherQuestionRepository;
    private final HomeworkRepository homeworkRepository;
    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final ClassRepository classRepository;

    @Transactional
    public int assignHomeworkFromBank(String topicId,
                                      AssignHomeworkFromBankRequest request,
                                      UUID teacherId) {
        validateDueDate(request.getDueDate());

        List<TeacherQuestion> questions = lookupQuestionsByTopicId(topicId);
        if (questions.isEmpty()) {
            throw new BadRequestException("No active questions found for this topic");
        }

        int created = 0;
        for (UUID classId : request.getClassIds()) {
            ClassEntity classEntity = loadAndAuthorizeClass(classId, teacherId);

            String resolvedLessonId = null;
            String[] parts = topicId.split("_");
            if (parts.length >= 2) {
                resolvedLessonId = parts[1];
            }

            Homework homework = Homework.builder()
                    .assignedClass(classEntity)
                    .lessonId(resolvedLessonId)
                    .title(request.getTitle())
                    .instructions(request.getInstructions())
                    .dueDate(request.getDueDate())
                    .maxScore(request.getMaxScore())
                    .attempts(2)
                    .timeLimit(0)
                    .status(Homework.HomeworkStatus.ASSIGNED)
                    .build();
            homework.setQuestions(new ArrayList<>(questions));

            homeworkRepository.save(homework);
            created++;
        }

        log.info("Teacher {} assigned homework from topic {} to {} classes", teacherId, topicId, created);
        return created;
    }

    @Transactional
    public int assignExamFromBank(String topicId,
                                  AssignExamFromBankRequest request,
                                  UUID teacherId) {
        validateDueDate(request.getDueDate());

        List<TeacherQuestion> currentQuestions = lookupQuestionsByTopicId(topicId);
        if (currentQuestions.isEmpty()) {
            throw new BadRequestException("No active questions found for this topic");
        }

        Set<UUID> seenIds = new LinkedHashSet<>();
        List<TeacherQuestion> merged = new ArrayList<>();
        for (TeacherQuestion q : currentQuestions) {
            if (seenIds.add(q.getId())) {
                merged.add(q);
            }
        }

        if (request.getAdditionalTopicIds() != null) {
            for (String extraTopicId : request.getAdditionalTopicIds()) {
                if (extraTopicId == null || extraTopicId.isBlank() || extraTopicId.equals(topicId)) {
                    continue;
                }
                List<TeacherQuestion> extras = lookupQuestionsByTopicId(extraTopicId);
                for (TeacherQuestion q : extras) {
                    if (seenIds.add(q.getId())) {
                        merged.add(q);
                    }
                }
            }
        }

        String level = currentQuestions.get(0).getLevel();
        if (level == null || level.isBlank()) {
            throw new BadRequestException("Topic does not have a level, cannot create exam");
        }

        int created = 0;
        for (UUID classId : request.getClassIds()) {
            ClassEntity classEntity = loadAndAuthorizeClass(classId, teacherId);

            Exam exam = Exam.builder()
                    .title(request.getTitle())
                    .level(GrammarLevel.valueOf(level))
                    .totalQuestions(merged.size())
                    .timeLimit(request.getDurationMinutes())
                    .examMode(ExamMode.SAME_FOR_ALL)
                    .questionReuse(QuestionReuse.ALLOW_REUSE)
                    .randomizeAnswers(false)
                    .lessonIds(new ArrayList<>())
                    .category("question-bank")
                    .assignedClass(classEntity)
                    .status(ExamStatus.PUBLISHED)
                    .build();
            exam = examRepository.save(exam);

            List<ExamQuestion> examQuestions = new ArrayList<>();
            int order = 1;
            for (TeacherQuestion tq : merged) {
                Difficulty diff;
                try {
                    diff = Difficulty.valueOf(tq.getDifficulty().toUpperCase());
                } catch (Exception e) {
                    diff = Difficulty.MEDIUM;
                }

                ExamQuestion question = ExamQuestion.builder()
                        .exam(exam)
                        .sourceTeacherQuestionId(tq.getId())
                        .questionText(tq.getPrompt())
                        .options(new ArrayList<>(tq.getOptions() != null ? tq.getOptions() : new ArrayList<>()))
                        .correctAnswerIndex(tq.getCorrectAnswerIndex())
                        .explanation(tq.getExplanation())
                        .difficulty(diff)
                        .lessonId(tq.getLesson() != null ? String.valueOf(tq.getLesson().getId()) : null)
                        .category("question-bank")
                        .displayOrder(order++)
                        .points(tq.getPoints() != null ? tq.getPoints() : 1)
                        .build();
                examQuestions.add(question);
            }
            examQuestionRepository.saveAll(examQuestions);
            exam.setQuestions(examQuestions);
            examRepository.save(exam);

            created++;
        }

        log.info("Teacher {} assigned exam from topic {} (+ {} additional) to {} classes with {} questions each",
                teacherId, topicId,
                request.getAdditionalTopicIds() == null ? 0 : request.getAdditionalTopicIds().size(),
                created, merged.size());
        return created;
    }

    /**
     * Resolve the active questions associated with a topic id coming from the frontend.
     * Tries several lookup strategies because the legacy `TeacherQuestion.topicId` field
     * is not guaranteed to match the `${level}_${lesson}_${skill}` key the UI sends.
     */
    private List<TeacherQuestion> lookupQuestionsByTopicId(String topicId) {
        if (topicId == null || topicId.isBlank()) {
            return Collections.emptyList();
        }

        // 1. Direct match on stored topicId
        List<TeacherQuestion> byTopicId = teacherQuestionRepository.findActiveByTopicId(topicId);
        if (!byTopicId.isEmpty()) {
            log.debug("Topic {} matched by direct topicId ({} questions)", topicId, byTopicId.size());
            return byTopicId;
        }

        // 2. Parse the composite key: e.g. "N5_3_grammar"
        String[] parts = topicId.split("_");
        if (parts.length >= 3) {
            String level = parts[0];
            String lessonPart = parts[1];
            String skill = parts[2];
            try {
                Integer lessonId = Integer.parseInt(lessonPart);
                List<TeacherQuestion> byComposite = teacherQuestionRepository
                        .findActiveByLevelSkillAndLesson(level, skill, lessonId);
                if (!byComposite.isEmpty()) {
                    log.debug("Topic {} matched by level={} skill={} lesson={} ({} questions)",
                            topicId, level, skill, lessonId, byComposite.size());
                    return byComposite;
                }
                // 2b. Skill can be stored upper-case; try that too
                List<TeacherQuestion> byCompositeUpper = teacherQuestionRepository
                        .findActiveByLevelSkillAndLesson(level, skill.toUpperCase(), lessonId);
                if (!byCompositeUpper.isEmpty()) {
                    return byCompositeUpper;
                }
            } catch (NumberFormatException ignored) {
                // lesson part is not numeric — composite lookup does not apply
            }
        }

        // 3. Last resort: any question referencing this topicId regardless of status
        List<TeacherQuestion> anyStatus = teacherQuestionRepository.findByTopicIdAndStatus(topicId, "");
        if (!anyStatus.isEmpty()) {
            log.warn("Topic {} only has questions with non-ACTIVE status ({} found). Accepting them.",
                    topicId, anyStatus.size());
            return anyStatus;
        }

        log.warn("Topic {} returned no questions from any lookup strategy", topicId);
        return Collections.emptyList();
    }

    private ClassEntity loadAndAuthorizeClass(UUID classId, UUID teacherId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));
        if (classEntity.getStatus() == ClassEntity.ClassStatus.ARCHIVED) {
            throw new BadRequestException("Class is archived and cannot receive new assignments");
        }
        if (classEntity.getTeacher() == null || !classEntity.getTeacher().getId().equals(teacherId)) {
            throw new AccessDeniedException("You do not own this class");
        }
        return classEntity;
    }

    private void validateDueDate(Instant dueDate) {
        if (dueDate == null || !dueDate.isAfter(Instant.now())) {
            throw new BadRequestException("Due date must be in the future");
        }
    }
}
