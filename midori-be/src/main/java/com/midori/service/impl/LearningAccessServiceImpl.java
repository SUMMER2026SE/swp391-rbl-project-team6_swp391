package com.midori.service.impl;

import com.midori.entity.ClassEntity;
import com.midori.entity.StudentLearningAccess;
import com.midori.entity.User;
import com.midori.repository.StudentLearningAccessRepository;
import com.midori.service.LearningAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningAccessServiceImpl implements LearningAccessService {

    private final StudentLearningAccessRepository accessRepository;

    @Override
    @Transactional
    public void grantOrExtendAccess(User student, ClassEntity classEntity) {
        if (classEntity.getLevel() == null) {
            return;
        }
        
        String level = classEntity.getLevel().name();
        Instant now = Instant.now();
        Instant proposedExpiration = now.atZone(ZoneOffset.UTC).plusYears(1).toInstant();

        Optional<StudentLearningAccess> existingOpt = accessRepository.findByStudentIdAndLevel(student.getId(), level);
        
        if (existingOpt.isPresent()) {
            StudentLearningAccess access = existingOpt.get();
            // Extend if new expiration is later
            if (access.getAccessExpireAt().isBefore(proposedExpiration)) {
                access.setAccessExpireAt(proposedExpiration);
            }
            // If it was expired, we reactive it with the new start time as now
            if (access.getStatus() == StudentLearningAccess.AccessStatus.EXPIRED || 
                access.getAccessExpireAt().isBefore(now)) {
                access.setStatus(StudentLearningAccess.AccessStatus.ACTIVE);
                access.setAccessStartAt(now);
                access.setAccessExpireAt(proposedExpiration);
            }
            access.setSourceClass(classEntity);
            accessRepository.save(access);
        } else {
            StudentLearningAccess access = StudentLearningAccess.builder()
                    .student(student)
                    .level(level)
                    .sourceClass(classEntity)
                    .accessStartAt(now)
                    .accessExpireAt(proposedExpiration)
                    .status(StudentLearningAccess.AccessStatus.ACTIVE)
                    .build();
            accessRepository.save(access);
        }
    }

    @Override
    public void checkAccess(UUID studentId, String level) {
        if (level == null || level.trim().isEmpty()) {
            throw new com.midori.exception.LearningJourneyAccessDeniedException("You are not enrolled in a class for level " + level);
        }
        Optional<StudentLearningAccess> accessOpt = accessRepository.findByStudentIdAndLevel(studentId, level);
        if (accessOpt.isEmpty()) {
            throw new com.midori.exception.LearningJourneyAccessDeniedException("You do not have access to the Learning Journey for level " + level);
        }
        
        StudentLearningAccess access = accessOpt.get();
        if (access.getStatus() == StudentLearningAccess.AccessStatus.EXPIRED || access.getAccessExpireAt().isBefore(Instant.now())) {
            throw new com.midori.exception.LearningJourneyAccessExpiredException("Your access to the " + level + " Learning Journey expired on " + access.getAccessExpireAt().toString().substring(0, 10) + ".");
        }
        if (access.getStatus() == StudentLearningAccess.AccessStatus.REVOKED) {
            throw new com.midori.exception.LearningJourneyAccessDeniedException("Your access to the Learning Journey for level " + level + " has been revoked.");
        }
    }

    @Override
    public Map<String, Object> getAccessMetadata(UUID studentId, String level) {
        Optional<StudentLearningAccess> accessOpt = accessRepository.findByStudentIdAndLevel(studentId, level);
        if (accessOpt.isEmpty()) {
            return null;
        }
        
        StudentLearningAccess access = accessOpt.get();
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("level", access.getLevel());
        metadata.put("accessStartAt", access.getAccessStartAt().toString());
        metadata.put("accessExpireAt", access.getAccessExpireAt().toString());
        
        Instant now = Instant.now();
        long remainingDays = 0;
        if (access.getStatus() == StudentLearningAccess.AccessStatus.ACTIVE && access.getAccessExpireAt().isAfter(now)) {
            remainingDays = ChronoUnit.DAYS.between(now, access.getAccessExpireAt());
        }
        metadata.put("remainingDays", Math.max(0, remainingDays));
        
        return metadata;
    }

    @Override
    public java.util.Set<String> getStudentActiveLevels(UUID studentId) {
        java.util.List<String> levels = accessRepository.findActiveLevelsByStudentId(
                studentId, StudentLearningAccess.AccessStatus.ACTIVE, Instant.now());
        return new java.util.HashSet<>(levels);
    }
}
