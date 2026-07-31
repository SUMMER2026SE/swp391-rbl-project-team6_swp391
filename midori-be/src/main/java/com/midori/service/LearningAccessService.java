package com.midori.service;

import com.midori.entity.ClassEntity;
import com.midori.entity.User;

import java.util.Map;
import java.util.UUID;

public interface LearningAccessService {
    void grantOrExtendAccess(User student, ClassEntity classEntity);
    void checkAccess(UUID studentId, String level);
    Map<String, Object> getAccessMetadata(UUID studentId, String level);
    java.util.Set<String> getStudentActiveLevels(UUID studentId);
}
