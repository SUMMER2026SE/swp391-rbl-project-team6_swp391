package com.midori.service;

import com.midori.entity.Homework;
import com.midori.entity.HomeworkSubmission;
import com.midori.entity.User;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.HomeworkRepository;
import com.midori.repository.HomeworkSubmissionRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import com.midori.repository.TeacherQuestionRepository;
import com.midori.entity.TeacherQuestion;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeworkServiceImpl implements HomeworkService {

    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final UserRepository userRepository;
    private final TeacherQuestionRepository teacherQuestionRepository;
    private final com.midori.repository.ClassRepository classRepository;

    @Override
    @Transactional
    public Homework createHomework(Homework homework, List<UUID> questionIds) {
        if (homework.getAssignedClass() != null) {
            com.midori.entity.ClassEntity classEntity = classRepository.findById(homework.getAssignedClass().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
            if (classEntity.getStatus() == com.midori.entity.ClassEntity.ClassStatus.ARCHIVED) {
                throw new com.midori.exception.BadRequestException("Class is archived and cannot receive new homework assignments");
            }
        }
        if (questionIds != null && !questionIds.isEmpty()) {
            List<TeacherQuestion> questions = teacherQuestionRepository.findAllById(questionIds);
            homework.setQuestions(questions);
        }
        return homeworkRepository.save(homework);
    }

    @Override
    @Transactional
    public Homework updateHomework(UUID id, Homework homeworkDetails, List<UUID> questionIds) {
        Homework homework = homeworkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Homework", "id", id));
        homework.setTitle(homeworkDetails.getTitle());
        homework.setInstructions(homeworkDetails.getInstructions());
        homework.setDueDate(homeworkDetails.getDueDate());
        homework.setMaxScore(homeworkDetails.getMaxScore());
        homework.setAttempts(homeworkDetails.getAttempts());
        homework.setTimeLimit(homeworkDetails.getTimeLimit());
        homework.setStatus(homeworkDetails.getStatus());
        
        if (questionIds != null) {
            List<TeacherQuestion> questions = teacherQuestionRepository.findAllById(questionIds);
            homework.setQuestions(questions);
        }
        
        return homeworkRepository.save(homework);
    }

    @Override
    @Transactional
    public void deleteHomework(UUID id) {
        Homework homework = homeworkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Homework", "id", id));
        homeworkRepository.delete(homework);
    }

    @Override
    public Homework findHomeworkById(UUID id) {
        return homeworkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Homework", "id", id));
    }

    @Override
    public List<Homework> findHomeworkByClass(UUID classId) {
        return homeworkRepository.findByAssignedClassId(classId);
    }

    @Override
    @Transactional
    public HomeworkSubmission submitHomework(HomeworkSubmission submission, java.util.Map<java.util.UUID, Integer> answers) {
        int score = 0;
        Homework homework = homeworkRepository.findById(submission.getHomework().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Homework", "id", submission.getHomework().getId()));
        
        List<TeacherQuestion> questions = homework.getQuestions();
        if (questions != null && answers != null) {
            for (TeacherQuestion question : questions) {
                Integer selectedOption = answers.get(question.getId());
                if (selectedOption != null && selectedOption.equals(question.getCorrectAnswerIndex())) {
                    score += question.getPoints();
                }
            }
        }
        
        if (questions != null && !questions.isEmpty()) {
            submission.setScore(score);
            submission.setStatus(HomeworkSubmission.SubmissionStatus.GRADED);
        } else {
            submission.setScore(null);
            submission.setStatus(HomeworkSubmission.SubmissionStatus.SUBMITTED);
        }
        
        if (answers != null) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String answersJson = mapper.writeValueAsString(answers);
                submission.setSubmissionText(answersJson);
            } catch (Exception e) {
                submission.setSubmissionText("{}");
            }
        }
        
        return homeworkSubmissionRepository.save(submission);
    }

    @Override
    public HomeworkSubmission findSubmission(UUID homeworkId, UUID studentId) {
        return homeworkSubmissionRepository.findByHomeworkIdAndStudentId(homeworkId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("HomeworkSubmission", "homeworkId/studentId", homeworkId + "/" + studentId));
    }

    @Override
    public List<Homework> findHomeworksByTeacher(UUID teacherId) {
        return homeworkRepository.findByAssignedClassTeacherId(teacherId);
    }

    @Override
    public List<HomeworkSubmission> findSubmissionsByHomework(UUID homeworkId) {
        return homeworkSubmissionRepository.findByHomeworkId(homeworkId);
    }

    @Override
    @Transactional
    public HomeworkSubmission gradeSubmission(UUID submissionId, Integer score, String feedback, UUID teacherId) {
        HomeworkSubmission submission = homeworkSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("HomeworkSubmission", "id", submissionId));

        if (!submission.getHomework().getAssignedClass().getTeacher().getId().equals(teacherId)) {
            throw new com.midori.exception.AccessDeniedException("You do not have permission to grade this submission");
        }

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));

        submission.setScore(score);
        submission.setFeedback(feedback);
        submission.setStatus(HomeworkSubmission.SubmissionStatus.GRADED);
        submission.setGradedAt(java.time.Instant.now());
        submission.setGradedBy(teacher);

        return homeworkSubmissionRepository.save(submission);
    }

    @Override
    public List<Homework> findHomeworksByClassForTeacher(UUID classId, UUID teacherId) {
        com.midori.entity.ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));
        if (!classEntity.getTeacher().getId().equals(teacherId)) {
            throw new com.midori.exception.AccessDeniedException("You do not own this class");
        }
        return homeworkRepository.findByAssignedClassIdOrderByCreatedAtDesc(classId);
    }

    @Override
    public List<Homework> findHomeworksByClassForStudent(UUID classId, UUID studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));
        if (student.getAssignedClass() == null || !student.getAssignedClass().getId().equals(classId)) {
            throw new com.midori.exception.AccessDeniedException("You are not enrolled in this class");
        }
        return homeworkRepository.findByAssignedClassIdOrderByCreatedAtDesc(classId);
    }
}

