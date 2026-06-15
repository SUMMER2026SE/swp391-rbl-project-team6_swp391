package com.midori.service;

import com.midori.dto.listening.*;
import com.midori.entity.ListeningLesson;
import com.midori.entity.User;
import com.midori.exception.AccessDeniedException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ListeningLessonRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ListeningServiceImpl implements ListeningService {

    private final ListeningLessonRepository listeningLessonRepository;
    private final UserRepository userRepository;

    @Override
    public ListeningDetailResponse createListening(CreateListeningRequest request, UUID teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));

        ListeningLesson lesson = ListeningLesson.builder()
                .levelId(request.getLevelId())
                .teacherId(teacherId)
                .title(request.getTitle())
                .audioUrl(request.getAudioUrl())
                .audioFileName(request.getAudioFileName())
                .audioType(request.getAudioType())
                .answerKey(request.getAnswerKey())
                .transcript(request.getTranscript())
                .status("PENDING")
                .build();

        lesson = listeningLessonRepository.save(lesson);
        return toDetailResponse(lesson, teacher);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningResponse> getAllListenings(UUID levelId, String status) {
        List<ListeningLesson> lessons;
        if (levelId != null && status != null) {
            lessons = listeningLessonRepository.findByLevelIdAndStatus(levelId, status);
        } else if (levelId != null) {
            lessons = listeningLessonRepository.findByLevelId(levelId);
        } else if (status != null) {
            lessons = listeningLessonRepository.findByStatus(status);
        } else {
            lessons = listeningLessonRepository.findAll();
        }

        return lessons.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ListeningDetailResponse getListeningById(UUID id) {
        ListeningLesson lesson = listeningLessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", id));
        User teacher = userRepository.findById(lesson.getTeacherId()).orElse(null);
        return toDetailResponse(lesson, teacher);
    }

    @Override
    public ListeningDetailResponse updateListening(UUID id, UpdateListeningRequest request, UUID currentUserId) {
        ListeningLesson lesson = listeningLessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", id));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (!currentUser.getRole().name().equals("ADMIN") && !lesson.getTeacherId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to update this listening lesson");
        }

        lesson.setLevelId(request.getLevelId());
        lesson.setTitle(request.getTitle());
        lesson.setAudioUrl(request.getAudioUrl());
        lesson.setAudioFileName(request.getAudioFileName());
        lesson.setAudioType(request.getAudioType());
        lesson.setAnswerKey(request.getAnswerKey());
        lesson.setTranscript(request.getTranscript());

        if (request.getStatus() != null) {
            if ("APPROVED".equalsIgnoreCase(request.getStatus()) && !"APPROVED".equalsIgnoreCase(lesson.getStatus())) {
                lesson.setApprovedBy(currentUserId);
                lesson.setApprovedAt(Instant.now());
            }
            lesson.setStatus(request.getStatus().toUpperCase());
        }

        lesson = listeningLessonRepository.save(lesson);
        User teacher = userRepository.findById(lesson.getTeacherId()).orElse(null);
        return toDetailResponse(lesson, teacher);
    }

    @Override
    public void deleteListening(UUID id, UUID currentUserId) {
        ListeningLesson lesson = listeningLessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", id));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (!currentUser.getRole().name().equals("ADMIN") && !lesson.getTeacherId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to delete this listening lesson");
        }

        listeningLessonRepository.delete(lesson);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningResponse> getListeningListForStudent(UUID levelId) {
        List<ListeningLesson> lessons;
        if (levelId != null) {
            lessons = listeningLessonRepository.findByLevelIdAndStatus(levelId, "APPROVED");
        } else {
            lessons = listeningLessonRepository.findByStatus("APPROVED");
        }

        return lessons.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ListeningDetailResponse getListeningDetailForStudent(UUID id) {
        ListeningLesson lesson = listeningLessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", id));

        if (!"APPROVED".equalsIgnoreCase(lesson.getStatus())) {
            throw new ResourceNotFoundException("ListeningLesson", "id", id);
        }

        User teacher = userRepository.findById(lesson.getTeacherId()).orElse(null);
        return toDetailResponse(lesson, teacher);
    }

    private ListeningResponse toResponse(ListeningLesson lesson) {
        User teacher = userRepository.findById(lesson.getTeacherId()).orElse(null);
        return ListeningResponse.builder()
                .id(lesson.getId())
                .levelId(lesson.getLevelId())
                .teacherId(lesson.getTeacherId())
                .teacherName(resolveTeacherName(teacher))
                .title(lesson.getTitle())
                .audioUrl(lesson.getAudioUrl())
                .audioFileName(lesson.getAudioFileName())
                .audioType(lesson.getAudioType())
                .status(lesson.getStatus())
                .approvedBy(lesson.getApprovedBy())
                .approvedAt(lesson.getApprovedAt())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private ListeningDetailResponse toDetailResponse(ListeningLesson lesson, User teacher) {
        return ListeningDetailResponse.builder()
                .id(lesson.getId())
                .levelId(lesson.getLevelId())
                .teacherId(lesson.getTeacherId())
                .teacherName(resolveTeacherName(teacher))
                .title(lesson.getTitle())
                .audioUrl(lesson.getAudioUrl())
                .audioFileName(lesson.getAudioFileName())
                .audioType(lesson.getAudioType())
                .answerKey(lesson.getAnswerKey())
                .transcript(lesson.getTranscript())
                .status(lesson.getStatus())
                .approvedBy(lesson.getApprovedBy())
                .approvedAt(lesson.getApprovedAt())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private String resolveTeacherName(User teacher) {
        if (teacher == null) {
            return "MIDORI";
        }
        if (teacher.getProfile() != null && teacher.getProfile().getDisplayName() != null) {
            return teacher.getProfile().getDisplayName();
        }
        if (teacher.getEmail() != null) {
            return teacher.getEmail();
        }
        return "Teacher";
    }
}
