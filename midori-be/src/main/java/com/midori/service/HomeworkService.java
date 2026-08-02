package com.midori.service;

import com.midori.entity.Homework;
import com.midori.entity.HomeworkSubmission;

import com.midori.dto.request.StudentAnswerRequest;

import java.util.List;
import java.util.UUID;

public interface HomeworkService {
    Homework createHomework(Homework homework, List<UUID> questionIds);
    Homework updateHomework(UUID id, Homework homeworkDetails, List<UUID> questionIds);
    void deleteHomework(UUID id);
    Homework findHomeworkById(UUID id);
    List<Homework> findHomeworkByClass(UUID classId);
    HomeworkSubmission submitHomework(HomeworkSubmission submission, java.util.Map<java.util.UUID, Integer> answers, List<StudentAnswerRequest> textAnswers, Integer focusViolationCount);
    HomeworkSubmission findSubmission(UUID homeworkId, UUID studentId);
    List<Homework> findHomeworksByTeacher(UUID teacherId);
    List<HomeworkSubmission> findSubmissionsByHomework(UUID homeworkId);
    HomeworkSubmission gradeSubmission(UUID submissionId, Integer score, String feedback, UUID teacherId);
    List<Homework> findHomeworksByClassForTeacher(UUID classId, UUID teacherId);
    List<Homework> findHomeworksByClassForStudent(UUID classId, UUID studentId);
    boolean isLegacyAnswerCorrect(com.midori.entity.TeacherQuestion question, Object rawAnswer);
}

