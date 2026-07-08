package com.midori.service;

import com.midori.dto.request.CreateExamRequest;
import com.midori.dto.request.UpdateExamQuestionsRequest;
import com.midori.dto.request.UpdateExamRequest;
import com.midori.dto.response.ExamResponse;
import com.midori.dto.response.StudentExamResponse;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.UUID;

public interface ExamGenerationService {

    ExamResponse createExam(CreateExamRequest request, UserDetails userDetails);

    ExamResponse getExamById(UUID examId);

    List<ExamResponse> getAllExams();

    List<ExamResponse> getExamsByTeacher(UUID teacherId);

    ExamResponse publishExam(UUID examId);

    void deleteExam(UUID examId);

    StudentExamResponse startStudentExam(UUID examId, UUID studentId);

    StudentExamResponse getStudentExam(UUID studentExamId);

    List<StudentExamResponse> getStudentExams(UUID studentId);

    StudentExamResponse submitStudentExam(UUID studentExamId, List<Integer> answers);

    ExamResponse assignExamToClass(UUID examId, UUID classId);

    List<ExamResponse> getExamsByClass(UUID classId);

    List<StudentExamResponse> getStudentExamResultsByClass(UUID classId);

    ExamResponse updateExam(UUID examId, UpdateExamRequest request);

    ExamResponse updateExamQuestions(UUID examId, UpdateExamQuestionsRequest request);
}
