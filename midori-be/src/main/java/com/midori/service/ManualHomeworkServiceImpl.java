package com.midori.service;

import com.midori.dto.homeworkdto.ManualHomeworkQuestionRequest;
import com.midori.dto.homeworkdto.ManualHomeworkRequest;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ManualHomeworkServiceImpl implements ManualHomeworkService {

    private final ManualHomeworkRepository manualHomeworkRepository;
    private final ManualHomeworkQuestionRepository manualHomeworkQuestionRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final TeacherQuestionRepository teacherQuestionRepository;
    private final HomeworkRepository homeworkRepository;

    @Override
    @Transactional
    public ManualHomework createManualHomework(UUID teacherId, ManualHomeworkRequest request) {
        log.info("Creating manual homework. teacherId: {}, title: {}", teacherId, request.getTitle());
        validateHomework(request);

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));

        ManualHomework homework = ManualHomework.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .level(request.getLevel())
                .type(request.getType())
                .status(request.getStatus() != null ? request.getStatus() : HomeworkStatus.DRAFT)
                .duration(request.getDuration())
                .teacher(teacher)
                .isDeleted(false)
                .version(1)
                .build();

        List<ManualHomeworkQuestion> questions = new ArrayList<>();
        if (request.getQuestions() != null) {
            for (ManualHomeworkQuestionRequest qr : request.getQuestions()) {
                questions.add(ManualHomeworkQuestion.builder()
                        .manualHomework(homework)
                        .questionOrder(qr.getQuestionOrder())
                        .questionType(qr.getQuestionType())
                        .content(qr.getContent())
                        .options(qr.getOptions())
                        .correctAnswer(qr.getCorrectAnswer())
                        .explanation(qr.getExplanation())
                        .difficulty(qr.getDifficulty())
                        .points(qr.getPoints())
                        .skill(qr.getSkill())
                        .imageUrl(qr.getImageUrl())
                        .build());
            }
        }

        homework.setQuestions(questions);
        homework.setQuestionCount(questions.size());

        ManualHomework saved = manualHomeworkRepository.save(homework);
        log.info("Successfully created manual homework template. homeworkId: {}, teacherId: {}", saved.getId(), teacherId);

        if (saved.getStatus() == HomeworkStatus.PUBLISHED && request.getClassId() != null && request.getDueDate() != null) {
            java.time.Instant instantDueDate = request.getDueDate().toInstant(java.time.ZoneOffset.UTC);
            copyToHomework(saved.getId(), request.getClassId(), instantDueDate, teacherId);
        }

        return saved;
    }

    @Override
    @Transactional
    public ManualHomework updateManualHomework(UUID teacherId, UUID id, ManualHomeworkRequest request) {
        log.info("Updating manual homework template. homeworkId: {}, teacherId: {}", id, teacherId);
        validateHomework(request);

        ManualHomework homework = manualHomeworkRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ManualHomework", "id", id));

        if (!homework.getTeacher().getId().equals(teacherId)) {
            log.warn("Access denied updating homework template. homeworkId: {}, teacherId: {}", id, teacherId);
            throw new AccessDeniedException("You do not own this homework template");
        }

        homework.setTitle(request.getTitle());
        homework.setDescription(request.getDescription());
        homework.setLevel(request.getLevel());
        homework.setType(request.getType());
        if (request.getStatus() != null) {
            homework.setStatus(request.getStatus());
        }
        homework.setDuration(request.getDuration());

        // Clear existing questions and save new ones to ensure order and orphan removal
        homework.getQuestions().clear();

        List<ManualHomeworkQuestion> newQuestions = new ArrayList<>();
        if (request.getQuestions() != null) {
            for (ManualHomeworkQuestionRequest qr : request.getQuestions()) {
                newQuestions.add(ManualHomeworkQuestion.builder()
                        .manualHomework(homework)
                        .questionOrder(qr.getQuestionOrder())
                        .questionType(qr.getQuestionType())
                        .content(qr.getContent())
                        .options(qr.getOptions())
                        .correctAnswer(qr.getCorrectAnswer())
                        .explanation(qr.getExplanation())
                        .difficulty(qr.getDifficulty())
                        .points(qr.getPoints())
                        .skill(qr.getSkill())
                        .imageUrl(qr.getImageUrl())
                        .build());
            }
        }

        homework.getQuestions().addAll(newQuestions);
        homework.setQuestionCount(newQuestions.size());

        ManualHomework updated = manualHomeworkRepository.save(homework);
        log.info("Successfully updated manual homework template. homeworkId: {}, teacherId: {}", updated.getId(), teacherId);

        if (updated.getStatus() == HomeworkStatus.PUBLISHED && request.getClassId() != null && request.getDueDate() != null) {
            java.time.Instant instantDueDate = request.getDueDate().toInstant(java.time.ZoneOffset.UTC);
            copyToHomework(updated.getId(), request.getClassId(), instantDueDate, teacherId);
        }

        return updated;
    }

    @Override
    public ManualHomework getManualHomework(UUID teacherId, UUID id) {
        ManualHomework homework = manualHomeworkRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ManualHomework", "id", id));

        if (!homework.getTeacher().getId().equals(teacherId)) {
            throw new AccessDeniedException("You do not own this homework template");
        }
        return homework;
    }

    @Override
    public List<ManualHomework> getManualHomeworksByTeacher(UUID teacherId) {
        return manualHomeworkRepository.findByTeacherIdAndIsDeletedFalse(teacherId);
    }

    @Override
    @Transactional
    public void deleteManualHomework(UUID teacherId, UUID id) {
        log.info("Soft deleting manual homework template. homeworkId: {}, teacherId: {}", id, teacherId);
        ManualHomework homework = manualHomeworkRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ManualHomework", "id", id));

        if (!homework.getTeacher().getId().equals(teacherId)) {
            log.warn("Access denied deleting homework template. homeworkId: {}, teacherId: {}", id, teacherId);
            throw new AccessDeniedException("You do not own this homework template");
        }

        homework.setIsDeleted(true);
        homework.setDeletedAt(Instant.now());
        manualHomeworkRepository.save(homework);
        log.info("Successfully soft deleted manual homework template. homeworkId: {}, teacherId: {}", id, teacherId);
    }

    @Override
    @Transactional
    public ManualHomework publishManualHomework(UUID teacherId, UUID id) {
        log.info("Publishing manual homework template. homeworkId: {}, teacherId: {}", id, teacherId);
        ManualHomework homework = manualHomeworkRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ManualHomework", "id", id));

        if (!homework.getTeacher().getId().equals(teacherId)) {
            throw new AccessDeniedException("You do not own this homework template");
        }

        homework.setStatus(HomeworkStatus.PUBLISHED);
        ManualHomework saved = manualHomeworkRepository.save(homework);
        log.info("Successfully published homework template. homeworkId: {}, teacherId: {}", id, teacherId);
        return saved;
    }

    @Override
    @Transactional
    public ManualHomework publishManualHomework(UUID teacherId, UUID id, UUID classId, Instant dueDate) {
        log.info("Publishing and assigning manual homework template. homeworkId: {}, classId: {}, teacherId: {}", id, classId, teacherId);
        ManualHomework homework = publishManualHomework(teacherId, id);
        if (classId != null && dueDate != null) {
            copyToHomework(homework.getId(), classId, dueDate, teacherId);
        }
        return homework;
    }

    @Override
    @Transactional
    public ManualHomework draftManualHomework(UUID teacherId, UUID id) {
        log.info("Moving manual homework template to draft. homeworkId: {}, teacherId: {}", id, teacherId);
        ManualHomework homework = manualHomeworkRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ManualHomework", "id", id));

        if (!homework.getTeacher().getId().equals(teacherId)) {
            throw new AccessDeniedException("You do not own this homework template");
        }

        homework.setStatus(HomeworkStatus.DRAFT);
        ManualHomework saved = manualHomeworkRepository.save(homework);
        log.info("Successfully set homework template status to DRAFT. homeworkId: {}, teacherId: {}", id, teacherId);
        return saved;
    }

    @Override
    @Transactional
    public ManualHomework duplicateManualHomework(UUID teacherId, UUID id) {
        log.info("Duplicating manual homework template. originalHomeworkId: {}, teacherId: {}", id, teacherId);
        ManualHomework original = manualHomeworkRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ManualHomework", "id", id));

        if (!original.getTeacher().getId().equals(teacherId)) {
            log.warn("Access denied duplicating homework template. originalHomeworkId: {}, teacherId: {}", id, teacherId);
            throw new AccessDeniedException("You do not own this homework template");
        }

        ManualHomework copy = ManualHomework.builder()
                .title(original.getTitle() + " (Copy)")
                .description(original.getDescription())
                .level(original.getLevel())
                .type(original.getType())
                .status(HomeworkStatus.DRAFT)
                .duration(original.getDuration())
                .teacher(original.getTeacher())
                .isDeleted(false)
                .version(1)
                .build();

        List<ManualHomeworkQuestion> copyQuestions = original.getQuestions().stream()
                .map(q -> ManualHomeworkQuestion.builder()
                        .manualHomework(copy)
                        .questionOrder(q.getQuestionOrder())
                        .questionType(q.getQuestionType())
                        .content(q.getContent())
                        .options(q.getOptions() != null ? new ArrayList<>(q.getOptions()) : null)
                        .correctAnswer(q.getCorrectAnswer())
                        .explanation(q.getExplanation())
                        .difficulty(q.getDifficulty())
                        .points(q.getPoints())
                        .skill(q.getSkill())
                        .imageUrl(q.getImageUrl())
                        .build())
                .collect(Collectors.toList());

        copy.setQuestions(copyQuestions);
        copy.setQuestionCount(copyQuestions.size());

        ManualHomework saved = manualHomeworkRepository.save(copy);
        log.info("Successfully duplicated homework template. newHomeworkId: {}, originalHomeworkId: {}, teacherId: {}", saved.getId(), id, teacherId);
        return saved;
    }

    @Override
    @Transactional
    public Homework copyToHomework(UUID manualHomeworkId, UUID classId, Instant dueDate, UUID teacherId) {
        log.info("Copying ManualHomework template to ClassHomework assignment. manualHomeworkId: {}, classId: {}, teacherId: {}", manualHomeworkId, classId, teacherId);
        ManualHomework template = manualHomeworkRepository.findByIdAndIsDeletedFalse(manualHomeworkId)
                .orElseThrow(() -> new ResourceNotFoundException("ManualHomework", "id", manualHomeworkId));

        if (!template.getTeacher().getId().equals(teacherId)) {
            throw new AccessDeniedException("You do not own this homework template");
        }

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassEntity", "id", classId));

        if (!classEntity.getTeacher().getId().equals(teacherId)) {
            throw new AccessDeniedException("You do not own this class");
        }

        // 1. Create class-assigned Homework entity
        Homework homework = Homework.builder()
                .assignedClass(classEntity)
                .title(template.getTitle())
                .instructions(template.getDescription())
                .dueDate(dueDate)
                .maxScore(template.getQuestions().stream().mapToInt(ManualHomeworkQuestion::getPoints).sum())
                .attempts(2) // Default attempts
                .timeLimit(template.getDuration())
                .status(Homework.HomeworkStatus.ASSIGNED)
                .build();

        // 2. Instantiate and save each question as a TeacherQuestion
        List<TeacherQuestion> teacherQuestions = new ArrayList<>();
        for (ManualHomeworkQuestion mq : template.getQuestions()) {
            int correctIndex = 0;
            if (mq.getOptions() != null) {
                for (int i = 0; i < mq.getOptions().size(); i++) {
                    if (mq.getOptions().get(i).equalsIgnoreCase(mq.getCorrectAnswer())) {
                        correctIndex = i;
                        break;
                    }
                }
            }

            TeacherQuestion tq = TeacherQuestion.builder()
                    .teacher(template.getTeacher())
                    .prompt(mq.getContent())
                    .questionType(mq.getQuestionType().name())
                    .difficulty(mq.getDifficulty().name())
                    .correctAnswerIndex(correctIndex)
                    .explanation(mq.getExplanation())
                    .points(mq.getPoints())
                    .options(mq.getOptions() != null ? new ArrayList<>(mq.getOptions()) : new ArrayList<>())
                    .status("ACTIVE")
                    .build();

            teacherQuestions.add(teacherQuestionRepository.save(tq));
        }

        homework.setQuestions(teacherQuestions);
        Homework savedHomework = homeworkRepository.save(homework);
        log.info("Successfully created class homework assignment. classHomeworkId: {}, manualHomeworkId: {}", savedHomework.getId(), manualHomeworkId);
        return savedHomework;
    }

    private void validateHomework(ManualHomeworkRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("Title is required");
        }
        if (request.getLevel() == null || request.getLevel().isBlank()) {
            throw new BadRequestException("Level is required");
        }
        if (request.getType() == null) {
            throw new BadRequestException("Homework type is required");
        }
        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            throw new BadRequestException("At least one question is required");
        }

        java.util.Set<Integer> orders = new java.util.HashSet<>();
        for (ManualHomeworkQuestionRequest q : request.getQuestions()) {
            if (q.getContent() == null || q.getContent().isBlank()) {
                throw new BadRequestException("Question content cannot be empty");
            }
            if (q.getQuestionOrder() == null) {
                throw new BadRequestException("Question order is required");
            }
            if (!orders.add(q.getQuestionOrder())) {
                throw new BadRequestException("Question order must be unique");
            }
            if (q.getPoints() == null || q.getPoints() < 0) {
                throw new BadRequestException("Question points must be greater than or equal to 0");
            }

            switch (q.getQuestionType()) {
                case MULTIPLE_CHOICE:
                    if (q.getOptions() == null || q.getOptions().size() < 2) {
                        throw new BadRequestException("Multiple choice question must have at least 2 options");
                    }
                    if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank()) {
                        throw new BadRequestException("Multiple choice question must have a correct answer");
                    }
                    boolean found = q.getOptions().stream().anyMatch(opt -> opt.equalsIgnoreCase(q.getCorrectAnswer()));
                    if (!found) {
                        try {
                            int idx = Integer.parseInt(q.getCorrectAnswer());
                            if (idx < 0 || idx >= q.getOptions().size()) {
                                throw new BadRequestException("Correct answer index out of bounds");
                            }
                        } catch (NumberFormatException e) {
                            throw new BadRequestException("Correct answer must match one of the options");
                        }
                    }
                    break;
                case TRUE_FALSE:
                    if (q.getCorrectAnswer() == null || (!q.getCorrectAnswer().equalsIgnoreCase("True") && !q.getCorrectAnswer().equalsIgnoreCase("False"))) {
                        throw new BadRequestException("True/False question correct answer must be 'True' or 'False'");
                    }
                    break;
                case FILL_BLANK:
                    if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank()) {
                        throw new BadRequestException("Fill in the blank question must have a correct answer");
                    }
                    break;
                case MATCHING:
                    if (q.getOptions() == null || q.getOptions().isEmpty()) {
                        throw new BadRequestException("Matching question must have matching pairs");
                    }
                    if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank()) {
                        throw new BadRequestException("Matching question must have a correct answer");
                    }
                    break;
            }
        }
    }
}
