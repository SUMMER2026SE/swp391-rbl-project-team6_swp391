package com.midori.service;

import com.midori.dto.classdto.AdminClassResponse;
import com.midori.dto.classdto.ClassResponse;
import com.midori.dto.classdto.CreateClassRequest;
import com.midori.dto.classdto.UpdateClassRequest;
import java.util.List;
import java.util.UUID;

public interface AdminClassService {
    List<AdminClassResponse> getAdminClasses();
    List<AdminClassResponse> getAdminClassesByTeacher(UUID teacherId);
    AdminClassResponse getAdminClassById(UUID id);
    AdminClassResponse createClass(CreateClassRequest request, UUID teacherId);
    AdminClassResponse updateClass(UUID classId, UpdateClassRequest request, UUID teacherId);
    AdminClassResponse archiveClass(UUID classId, UUID teacherId);
    AdminClassResponse restoreClass(UUID classId, UUID teacherId);
    List<com.midori.dto.classdto.StudentClassResponse> getClassStudents(UUID classId);
}
