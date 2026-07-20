package com.midori.service;

import com.midori.dto.classdto.AdminClassResponse;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.dto.homeworkdto.HomeworkResponse;
import com.midori.dto.response.ExamResponse;
import java.util.List;
import java.util.UUID;

public interface AdminClassService {
    List<AdminClassResponse> getAdminClasses();
    AdminClassResponse getAdminClassById(UUID id);
    List<StudentClassResponse> getClassStudents(UUID classId);
    List<HomeworkResponse> getClassHomeworks(UUID classId);
    List<ExamResponse> getClassExams(UUID classId);
}
