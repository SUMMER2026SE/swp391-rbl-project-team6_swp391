package com.midori.service;

import com.midori.entity.ClassEntity;
import com.midori.dto.classdto.ClassResponse;
import com.midori.dto.classdto.CreateClassRequest;
import com.midori.dto.classdto.UpdateClassRequest;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.dto.homeworkdto.HomeworkResponse;
import com.midori.dto.response.ExamResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassService {
    List<ClassEntity> getAllClasses(String status);
    Optional<ClassEntity> getClassById(UUID id);
    List<ClassResponse> getStudentClasses(UUID studentId, String status);
    ClassResponse getStudentClassDetail(UUID studentId, UUID classId);
    ClassResponse createClass(CreateClassRequest request, UUID teacherId);
    ClassResponse updateClass(UUID classId, UpdateClassRequest request, UUID teacherId);
    ClassResponse archiveClass(UUID classId, UUID teacherId);
    ClassResponse restoreClass(UUID classId, UUID teacherId);
    List<StudentClassResponse> getClassStudents(UUID classId, UUID teacherId);
    void removeStudentFromClass(UUID classId, UUID studentId, UUID teacherId);
    StudentClassResponse addStudentToClass(UUID classId, String email, UUID teacherId);
    List<Object> getClassLessons(UUID studentId, UUID classId);
    List<HomeworkResponse> getClassHomework(UUID studentId, UUID classId);
    List<ExamResponse> getClassExams(UUID studentId, UUID classId);
    List<ClassResponse> getSelectableClasses(UUID teacherId);
    boolean isStudentEnrolledInLevel(UUID studentId, String level);
    java.util.Set<String> getStudentActiveLevels(UUID studentId);
}




