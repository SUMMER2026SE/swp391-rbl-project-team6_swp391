package com.midori.service;

import com.midori.entity.ClassEntity;
import com.midori.entity.User;
import com.midori.dto.classdto.ClassResponse;
import com.midori.dto.classdto.CreateClassRequest;
import com.midori.dto.classdto.UpdateClassRequest;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.dto.homeworkdto.HomeworkResponse;
import com.midori.dto.response.ExamResponse;
import com.midori.entity.Homework;
import com.midori.entity.StudentExam;
import com.midori.entity.HomeworkSubmission;
import java.time.Instant;
import com.midori.repository.StudentExamRepository;
import com.midori.exception.ResourceNotFoundException;
import com.midori.exception.BadRequestException;
import com.midori.repository.ClassRepository;
import com.midori.repository.UserRepository;
import com.midori.repository.HomeworkRepository;
import com.midori.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassServiceImpl implements ClassService {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final HomeworkRepository homeworkRepository;
    private final ExamRepository examRepository;
    private final HomeworkService homeworkService;
    private final ExamGenerationService examGenerationService;
    private final VocabularyService vocabularyService;
    private final ListeningService listeningService;
    private final GrammarService grammarService;
    private final com.midori.repository.HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final StudentExamRepository studentExamRepository;

    @Override
    public List<ClassEntity> getAllClasses(String status) {
        if (status == null || status.trim().isEmpty()) {
            return classRepository.findByStatus(ClassEntity.ClassStatus.ACTIVE);
        } else if ("ACTIVE".equalsIgnoreCase(status)) {
            return classRepository.findByStatus(ClassEntity.ClassStatus.ACTIVE);
        } else if ("ARCHIVED".equalsIgnoreCase(status)) {
            return classRepository.findByStatus(ClassEntity.ClassStatus.ARCHIVED);
        } else {
            return classRepository.findAll();
        }
    }

    @Override
    public Optional<ClassEntity> getClassById(UUID id) {
        return classRepository.findById(id);
    }

    @Override
    public List<ClassResponse> getStudentClasses(UUID studentId, String status) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));

        ClassEntity assignedClass = student.getAssignedClass();
        if (assignedClass == null) {
            return java.util.Collections.emptyList();
        }

        boolean match = false;
        if (status == null || status.trim().isEmpty()) {
            match = assignedClass.getStatus() == ClassEntity.ClassStatus.ACTIVE;
        } else if ("ACTIVE".equalsIgnoreCase(status)) {
            match = assignedClass.getStatus() == ClassEntity.ClassStatus.ACTIVE;
        } else if ("ARCHIVED".equalsIgnoreCase(status)) {
            match = assignedClass.getStatus() == ClassEntity.ClassStatus.ARCHIVED;
        } else {
            match = true; // "ALL"
        }

        if (match) {
            return java.util.Collections.singletonList(mapToClassResponse(assignedClass));
        }
        return java.util.Collections.emptyList();
    }

    @Override
    public ClassResponse getStudentClassDetail(UUID studentId, UUID classId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));

        ClassEntity assignedClass = student.getAssignedClass();
        if (assignedClass == null || !assignedClass.getId().equals(classId)) {
            // Verify class exists to return 404 instead of 403 if it is a non-existent class
            classRepository.findById(classId)
                    .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
            throw new com.midori.exception.AccessDeniedException("Student is not enrolled in this class");
        }

        return mapToClassResponse(assignedClass);
    }

    @Override
    @Transactional
    public ClassResponse createClass(CreateClassRequest request, UUID teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));

        ClassEntity classEntity = ClassEntity.builder()
                .name(request.getName())
                .level(request.getLevel())
                .maxStudents(request.getMaxStudents())
                .description(request.getDescription())
                .teacher(teacher)
                .status(ClassEntity.ClassStatus.ACTIVE)
                .build();

        ClassEntity savedClass = classRepository.save(classEntity);
        return mapToClassResponse(savedClass);
    }

    @Override
    @Transactional
    public ClassResponse updateClass(UUID classId, UpdateClassRequest request, UUID teacherId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));

        User user = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));
        boolean isAdmin = user.getRole() == com.midori.entity.Role.ADMIN;
        if (!classEntity.getTeacher().getId().equals(teacherId) && !isAdmin) {
            throw new com.midori.exception.AccessDeniedException("You are not allowed to manage this class");
        }

        if (classEntity.getStatus() == ClassEntity.ClassStatus.ARCHIVED) {
            throw new BadRequestException("Class is archived and cannot be edited");
        }

        classEntity.setName(request.getName());
        classEntity.setLevel(request.getLevel());
        classEntity.setMaxStudents(request.getMaxStudents());
        classEntity.setDescription(request.getDescription());

        ClassEntity updatedClass = classRepository.save(classEntity);
        return mapToClassResponse(updatedClass);
    }

    @Override
    @Transactional
    public ClassResponse archiveClass(UUID classId, UUID teacherId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));

        User user = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));
        boolean isAdmin = user.getRole() == com.midori.entity.Role.ADMIN;
        if (!classEntity.getTeacher().getId().equals(teacherId) && !isAdmin) {
            throw new com.midori.exception.AccessDeniedException("You are not allowed to manage this class");
        }

        if (classEntity.getStatus() == ClassEntity.ClassStatus.ARCHIVED) {
            throw new BadRequestException("Class is already archived");
        }

        classEntity.setStatus(ClassEntity.ClassStatus.ARCHIVED);
        ClassEntity updatedClass = classRepository.save(classEntity);
        return mapToClassResponse(updatedClass);
    }

    @Override
    @Transactional
    public ClassResponse restoreClass(UUID classId, UUID teacherId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));

        User user = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));
        boolean isAdmin = user.getRole() == com.midori.entity.Role.ADMIN;
        if (!classEntity.getTeacher().getId().equals(teacherId) && !isAdmin) {
            throw new com.midori.exception.AccessDeniedException("You are not allowed to manage this class");
        }

        if (classEntity.getStatus() == ClassEntity.ClassStatus.ACTIVE) {
            throw new BadRequestException("Class is already active");
        }

        classEntity.setStatus(ClassEntity.ClassStatus.ACTIVE);
        ClassEntity updatedClass = classRepository.save(classEntity);
        return mapToClassResponse(updatedClass);
    }

    @Override
    public List<StudentClassResponse> getClassStudents(UUID classId, UUID teacherId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));

        if (!classEntity.getTeacher().getId().equals(teacherId)) {
            throw new com.midori.exception.AccessDeniedException("You do not have permission to view students of this class");
        }

        List<StudentClassResponse> list = new ArrayList<>();
        classEntity.getStudents().forEach(student -> {
            list.add(mapToStudentClassResponse(student));
        });

        return list;
    }

    @Override
    @Transactional
    public void removeStudentFromClass(UUID classId, UUID studentId, UUID teacherId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));

        if (!classEntity.getTeacher().getId().equals(teacherId)) {
            throw new com.midori.exception.AccessDeniedException("You do not have permission to manage this class");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));

        if (student.getAssignedClass() == null || !student.getAssignedClass().getId().equals(classId)) {
            throw new BadRequestException("Student is not in this class");
        }

        student.setAssignedClass(null);
        userRepository.save(student);
    }

    @Override
    @Transactional
    public StudentClassResponse addStudentToClass(UUID classId, String email, UUID teacherId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));

        if (!classEntity.getTeacher().getId().equals(teacherId)) {
            throw new com.midori.exception.AccessDeniedException("You do not have permission to manage this class");
        }

        if (classEntity.getStatus() != ClassEntity.ClassStatus.ACTIVE) {
            throw new BadRequestException("Class is archived and cannot accept new students");
        }

        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (student.getRole() != com.midori.entity.Role.STUDENT) {
            throw new BadRequestException("Only students can be added to a class");
        }

        if (student.getAssignedClass() != null) {
            if (student.getAssignedClass().getId().equals(classId)) {
                throw new BadRequestException("Student is already in this class");
            }
            throw new BadRequestException("Student is already assigned to another class");
        }

        if (classEntity.getStudents().size() >= classEntity.getMaxStudents()) {
            throw new BadRequestException("Class is already full");
        }

        student.setAssignedClass(classEntity);
        userRepository.save(student);

        return mapToStudentClassResponse(student);
    }


    private ClassResponse mapToClassResponse(ClassEntity classEntity) {
        if (classEntity == null) return null;
        
        int studentCount = classEntity.getStudents() != null ? classEntity.getStudents().size() : 0;
        
        long homeworkCount = homeworkRepository.countByAssignedClassId(classEntity.getId());

        int examCount = examRepository.countUpcomingExamsPerClass().stream()
                .filter(arr -> classEntity.getId().equals(arr[0]))
                .map(arr -> ((Long) arr[1]).intValue())
                .findFirst().orElse(0);

        return ClassResponse.builder()
                .id(classEntity.getId())
                .name(classEntity.getName())
                .level(classEntity.getLevel())
                .maxStudents(classEntity.getMaxStudents())
                .description(classEntity.getDescription())
                .status(classEntity.getStatus())
                .teacherId(classEntity.getTeacher() != null ? classEntity.getTeacher().getId() : null)
                .studentCount(studentCount)
                .homeworkCount((int) homeworkCount)
                .upcomingExamCount(examCount)
                .createdAt(classEntity.getCreatedAt())
                .updatedAt(classEntity.getUpdatedAt())
                .build();
    }


    private StudentClassResponse mapToStudentClassResponse(User student) {
        if (student == null) return null;
        return StudentClassResponse.builder()
                .studentId(student.getId())
                .fullName(student.getProfile() != null ? student.getProfile().getDisplayName() : null)
                .email(student.getEmail())
                .avatar(student.getProfile() != null ? student.getProfile().getAvatarUrl() : null)
                .status(student.getStatus())
                .build();
    }

    @Override
    public List<Object> getClassLessons(UUID studentId, UUID classId) {
        getStudentClassDetail(studentId, classId);
        
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));
        
        String levelStr = classEntity.getLevel().name();
        List<Object> combinedLessons = new ArrayList<>();
        
        vocabularyService.listPublishedLessons(levelStr, null, null).forEach(vocab -> {
            Map<String, Object> map = new HashMap<>();
            map.put("type", "VOCABULARY");
            map.put("id", vocab.getId());
            map.put("title", vocab.getTitle());
            map.put("level", vocab.getLevel());
            map.put("topic", vocab.getTopic());
            map.put("wordCount", vocab.getWordCount());
            combinedLessons.add(map);
        });
        
        grammarService.listApprovedGrammars(levelStr, null).forEach(grammar -> {
            Map<String, Object> map = new HashMap<>();
            map.put("type", "GRAMMAR");
            map.put("id", grammar.getId());
            map.put("title", grammar.getTitle());
            map.put("level", grammar.getLevel());
            map.put("meaning", grammar.getMeaning());
            combinedLessons.add(map);
        });
        
        listeningService.getListeningListForStudent(levelStr).forEach(listening -> {
            Map<String, Object> map = new HashMap<>();
            map.put("type", "LISTENING");
            map.put("id", listening.getId());
            map.put("title", listening.getTitle());
            map.put("level", listening.getLevel());
            map.put("topic", listening.getTopic());
            combinedLessons.add(map);
        });

        return combinedLessons;
    }

    @Override
    public List<HomeworkResponse> getClassHomework(UUID studentId, UUID classId) {
        getStudentClassDetail(studentId, classId);
        
        List<Homework> homeworks = homeworkService.findHomeworkByClass(classId);
        return homeworks.stream()
                .map(hw -> mapToHomeworkResponse(hw, studentId))
                .toList();
    }

    @Override
    public List<ExamResponse> getClassExams(UUID studentId, UUID classId) {
        getStudentClassDetail(studentId, classId);
        
        List<ExamResponse> exams = examGenerationService.getExamsByClass(classId).stream()
                .filter(e -> "PUBLISHED".equals(e.getStatus()) || "CLOSED".equals(e.getStatus()))
                .collect(Collectors.toList());
                
        for (ExamResponse er : exams) {
            Optional<StudentExam> seOpt = studentExamRepository.findByExamIdAndStudentId(er.getId(), studentId);
            if (seOpt.isPresent()) {
                StudentExam se = seOpt.get();
                er.setStatus(se.getStatus().name());
                er.setScore(se.getScore());
                er.setPercentage(se.getPercentage());
                er.setSubmittedAt(se.getSubmittedAt());
                er.setFeedback(se.getFeedback());
                er.setGradedAt(se.getGradedAt());
            } else {
                er.setStatus("NOT_STARTED");
            }
        }
        return exams;
    }

    private HomeworkResponse mapToHomeworkResponse(Homework homework, UUID studentId) {
        if (homework == null) return null;
        
        String teacherName = "";
        if (homework.getAssignedClass() != null && homework.getAssignedClass().getTeacher() != null) {
            User teacher = homework.getAssignedClass().getTeacher();
            if (teacher.getProfile() != null && teacher.getProfile().getDisplayName() != null) {
                teacherName = teacher.getProfile().getDisplayName();
            } else {
                teacherName = teacher.getEmail();
            }
        }

        Integer remainingAttempts = homework.getAttempts();
        String submissionStatus = "NOT_STARTED";
        Integer score = null;
        String feedback = null;
        Instant gradedAt = null;
        Instant submittedAt = null;

        if (studentId != null) {
            long count = homeworkSubmissionRepository.countByHomeworkIdAndStudentId(homework.getId(), studentId);
            remainingAttempts = Math.max(0, homework.getAttempts() - (int) count);

            java.util.Optional<HomeworkSubmission> subOpt = homeworkSubmissionRepository.findByHomeworkIdAndStudentId(homework.getId(), studentId);
            if (subOpt.isPresent()) {
                HomeworkSubmission sub = subOpt.get();
                submissionStatus = sub.getStatus().name();
                score = sub.getScore();
                feedback = sub.getFeedback();
                gradedAt = sub.getGradedAt();
                submittedAt = sub.getSubmittedAt();
            }
        }

        return HomeworkResponse.builder()
                .id(homework.getId())
                .classId(homework.getAssignedClass().getId())
                .lessonId(homework.getLessonId())
                .title(homework.getTitle())
                .instructions(homework.getInstructions())
                .dueDate(homework.getDueDate())
                .maxScore(homework.getMaxScore())
                .attempts(homework.getAttempts())
                .status(homework.getStatus())
                .createdAt(homework.getCreatedAt())
                .updatedAt(homework.getUpdatedAt())
                .timeLimit(homework.getTimeLimit())
                .teacherName(teacherName)
                .remainingAttempts(remainingAttempts)
                .submissionStatus(submissionStatus)
                .score(score)
                .feedback(feedback)
                .gradedAt(gradedAt)
                .submittedAt(submittedAt)
                .build();
    }

    @Override
    public List<ClassResponse> getSelectableClasses(UUID teacherId) {
        List<ClassEntity> classes = classRepository.findActiveByTeacherId(teacherId);
        return classes.stream().map(this::mapToClassResponse).toList();
    }
}




