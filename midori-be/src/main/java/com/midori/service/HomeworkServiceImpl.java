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

import com.midori.entity.ClassEntity;
import com.midori.entity.TeacherQuestion;
import com.midori.repository.TeacherQuestionRepository;
import com.midori.dto.request.StudentAnswerRequest;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeworkServiceImpl implements HomeworkService {

    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final UserRepository userRepository;
    private final TeacherQuestionRepository teacherQuestionRepository;
    private final com.midori.repository.ClassRepository classRepository;

    private List<TeacherQuestion> validateAndGetQuestions(List<UUID> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        List<TeacherQuestion> questions = teacherQuestionRepository.findAllById(questionIds);
        
        // Filter active questions only
        java.util.Map<UUID, TeacherQuestion> questionMap = new java.util.HashMap<>();
        for (TeacherQuestion q : questions) {
            if ("ACTIVE".equals(q.getStatus())) {
                questionMap.put(q.getId(), q);
            }
        }

        List<TeacherQuestion> orderedQuestions = new java.util.ArrayList<>();
        for (UUID qId : questionIds) {
            TeacherQuestion q = questionMap.get(qId);
            if (q == null) {
                throw new com.midori.exception.BadRequestException(
                    "One or more questions in the preview are no longer available. Please click \"Generate Again\" to create a new homework preview."
                );
            }
            orderedQuestions.add(q);
        }
        return orderedQuestions;
    }

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
        if (questionIds != null) {
            List<TeacherQuestion> orderedQuestions = validateAndGetQuestions(questionIds);
            homework.setQuestions(orderedQuestions);
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
            List<TeacherQuestion> orderedQuestions = validateAndGetQuestions(questionIds);
            homework.setQuestions(orderedQuestions);
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
        return homeworkRepository.findByAssignedClassIdAndStatusNot(classId, Homework.HomeworkStatus.DRAFT);
    }

    @Override
    @Transactional
    public HomeworkSubmission submitHomework(HomeworkSubmission submission, java.util.Map<java.util.UUID, Integer> answers, List<com.midori.dto.request.StudentAnswerRequest> textAnswers, Integer focusViolationCount) {
        int score = 0;
        Homework homework = homeworkRepository.findById(submission.getHomework().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Homework", "id", submission.getHomework().getId()));

        List<TeacherQuestion> questions = homework.getQuestions();
        java.util.Map<java.util.UUID, com.midori.dto.request.StudentAnswerRequest> textAnswersMap = new java.util.HashMap<>();
        if (textAnswers != null) {
            for (com.midori.dto.request.StudentAnswerRequest ta : textAnswers) {
                if (ta.getQuestionId() != null) {
                    textAnswersMap.put(ta.getQuestionId(), ta);
                }
            }
        }

        if (questions != null) {
            for (TeacherQuestion question : questions) {
                com.midori.dto.request.StudentAnswerRequest ta = textAnswersMap.get(question.getId());
                Integer legacyAns = (answers != null) ? answers.get(question.getId()) : null;
                if (isAnswerCorrect(question, ta, legacyAns)) {
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

        submission.setFocusViolationCount(focusViolationCount == null ? 0 : Math.max(0, focusViolationCount));

        // Save student answers to submissionText JSON
        java.util.Map<String, Object> submissionAnswersMap = new java.util.HashMap<>();
        if (textAnswers != null && !textAnswers.isEmpty()) {
            for (com.midori.dto.request.StudentAnswerRequest ta : textAnswers) {
                if (ta.getQuestionId() == null) continue;
                String qid = ta.getQuestionId().toString();
                TeacherQuestion question = questions != null ? questions.stream()
                        .filter(q -> q.getId().equals(ta.getQuestionId()))
                        .findFirst()
                        .orElse(null) : null;
                
                Object answerVal = "";
                if (ta.getSelectedOptionIndex() != null) {
                    answerVal = ta.getSelectedOptionIndex();
                } else if (ta.getOrderedTokens() != null) {
                    answerVal = ta.getOrderedTokens();
                } else if (ta.getMatchingAnswers() != null) {
                    answerVal = ta.getMatchingAnswers();
                } else {
                    answerVal = ta.getTextAnswer() != null ? ta.getTextAnswer() : "";
                }
                submissionAnswersMap.put(qid, answerVal);

                if (question != null) {
                    boolean correct = isAnswerCorrect(question, ta, null);
                    submissionAnswersMap.put("isCorrect_" + qid, correct);
                }
            }
        } else if (answers != null) {
            for (java.util.Map.Entry<java.util.UUID, Integer> entry : answers.entrySet()) {
                if (entry.getKey() == null) continue;
                String qid = entry.getKey().toString();
                submissionAnswersMap.put(qid, entry.getValue());
                
                TeacherQuestion question = questions != null ? questions.stream()
                        .filter(q -> q.getId().equals(entry.getKey()))
                        .findFirst()
                        .orElse(null) : null;
                if (question != null) {
                    boolean correct = isAnswerCorrect(question, null, entry.getValue());
                    submissionAnswersMap.put("isCorrect_" + qid, correct);
                }
            }
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String answersJson = mapper.writeValueAsString(submissionAnswersMap);
            submission.setSubmissionText(answersJson);
        } catch (Exception e) {
            submission.setSubmissionText("{}");
        }

        return homeworkSubmissionRepository.save(submission);
    }

    private boolean isAnswerCorrect(TeacherQuestion question, com.midori.dto.request.StudentAnswerRequest textAnswer, Integer legacyAnswer) {
        String type = question.getQuestionType();
        if (type == null) {
            type = "MULTIPLE_CHOICE";
        }
        type = type.toUpperCase();

        if (type.equals("MULTIPLE_CHOICE") || type.equals("TRUE_FALSE")) {
            Integer ansIdx = null;
            if (textAnswer != null) {
                ansIdx = textAnswer.getSelectedOptionIndex();
            } else {
                ansIdx = legacyAnswer;
            }
            return ansIdx != null && ansIdx.equals(question.getCorrectAnswerIndex());
        } else if (type.equals("FILL_BLANK")) {
            String studentText = "";
            if (textAnswer != null) {
                studentText = textAnswer.getTextAnswer();
            }
            if (studentText == null) studentText = "";
            
            String correctText = "";
            if (question.getOptions() != null && !question.getOptions().isEmpty() && question.getCorrectAnswerIndex() != null && question.getCorrectAnswerIndex() < question.getOptions().size()) {
                correctText = question.getOptions().get(question.getCorrectAnswerIndex());
            } else if (question.getOptions() != null && !question.getOptions().isEmpty()) {
                correctText = question.getOptions().get(0);
            } else {
                correctText = question.getExplanation();
            }
            if (correctText == null) correctText = "";

            return normalizeText(studentText).equals(normalizeText(correctText));
        } else if (type.equals("SENTENCE_REORDER")) {
            String studentText = "";
            if (textAnswer != null) {
                if (textAnswer.getOrderedTokens() != null) {
                    studentText = String.join("", textAnswer.getOrderedTokens());
                } else {
                    studentText = textAnswer.getTextAnswer();
                }
            }
            if (studentText == null) studentText = "";

            String correctText = "";
            if (question.getOptions() != null && !question.getOptions().isEmpty() && question.getCorrectAnswerIndex() != null && question.getCorrectAnswerIndex() < question.getOptions().size()) {
                correctText = question.getOptions().get(question.getCorrectAnswerIndex());
            } else if (question.getOptions() != null && !question.getOptions().isEmpty()) {
                correctText = question.getOptions().get(0);
            } else {
                correctText = question.getExplanation();
            }
            if (correctText == null) correctText = "";

            return normalizeText(studentText).equals(normalizeText(correctText));
        } else if (type.equals("SHORT_ANSWER") || type.equals("TRANSLATION") || type.equals("SENTENCE_WRITING") || type.equals("ERROR_CORRECTION")) {
            String studentText = (textAnswer != null) ? textAnswer.getTextAnswer() : "";
            if (studentText == null) studentText = "";

            String correctText = "";
            if (question.getOptions() != null && !question.getOptions().isEmpty()) {
                correctText = question.getOptions().get(0);
            } else {
                correctText = question.getExplanation();
            }
            if (correctText == null) correctText = "";

            List<String> accepted = new java.util.ArrayList<>();
            if (question.getFormatMetadata() != null && !question.getFormatMetadata().isEmpty()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(question.getFormatMetadata());
                    if (root.has("referenceAnswer")) {
                        correctText = root.get("referenceAnswer").asText();
                    } else if (root.has("correctedText")) {
                        correctText = root.get("correctedText").asText();
                    }
                    if (root.has("acceptedAnswers") && root.get("acceptedAnswers").isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode n : root.get("acceptedAnswers")) {
                            accepted.add(n.asText());
                        }
                    }
                } catch (Exception ignored) {}
            }

            if (normalizeText(studentText).equals(normalizeText(correctText))) {
                return true;
            }
            for (String acc : accepted) {
                if (normalizeText(studentText).equals(normalizeText(acc))) {
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String norm = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFKC);
        return norm.replaceAll("[\\s\\p{Punct}　、。！？「」『』〜]+", "").trim().toLowerCase();
    }

    @Override
    public boolean isLegacyAnswerCorrect(TeacherQuestion question, Object rawAnswer) {
        if (rawAnswer == null) return false;
        StudentAnswerRequest ta = new StudentAnswerRequest();
        ta.setQuestionId(question.getId());
        Integer legacyAns = null;
        if (rawAnswer instanceof Integer) {
            legacyAns = (Integer) rawAnswer;
            ta.setSelectedOptionIndex(legacyAns);
        } else if (rawAnswer instanceof String) {
            ta.setTextAnswer((String) rawAnswer);
        } else if (rawAnswer instanceof List) {
            try {
                @SuppressWarnings("unchecked")
                List<String> list = (List<String>) rawAnswer;
                ta.setOrderedTokens(list);
            } catch (Exception e) {
                ta.setTextAnswer(rawAnswer.toString());
            }
        } else if (rawAnswer instanceof java.util.Map) {
            try {
                @SuppressWarnings("unchecked")
                java.util.Map<String, String> map = (java.util.Map<String, String>) rawAnswer;
                ta.setMatchingAnswers(map);
            } catch (Exception e) {}
        }
        return isAnswerCorrect(question, ta, legacyAns);
    }

    @Override
    public HomeworkSubmission findSubmission(UUID homeworkId, UUID studentId) {
        return homeworkSubmissionRepository.findFirstByHomeworkIdAndStudentIdOrderBySubmittedAtDesc(homeworkId, studentId)
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
        
        java.util.Set<ClassEntity> assignedClasses = student.getAssignedClasses();
        boolean isEnrolled = false;
        if (assignedClasses != null) {
            for (ClassEntity c : assignedClasses) {
                if (c.getId().equals(classId)) {
                    isEnrolled = true;
                    break;
                }
            }
        }
        if (!isEnrolled) {
            throw new com.midori.exception.AccessDeniedException("You are not enrolled in this class");
        }
        return homeworkRepository.findByAssignedClassIdAndStatusNotOrderByCreatedAtDesc(classId, Homework.HomeworkStatus.DRAFT);
    }
}

