package com.midori.service;

import com.midori.entity.ClassEntity;
import com.midori.entity.ClassMembership;
import com.midori.entity.ClassStatusEvent;
import com.midori.entity.User;
import com.midori.dto.classdto.ClassResponse;
import com.midori.dto.classdto.CreateClassRequest;
import com.midori.dto.classdto.UpdateClassRequest;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.dto.homeworkdto.HomeworkResponse;
import com.midori.dto.response.ExamResponse;
import com.midori.entity.Homework;
import com.midori.entity.Exam;
import com.midori.entity.StudentExam;
import com.midori.entity.HomeworkSubmission;
import com.midori.entity.GrammarLevel;
import java.time.Instant;
import com.midori.repository.StudentExamRepository;
import com.midori.exception.ResourceNotFoundException;
import com.midori.exception.BadRequestException;
import com.midori.exception.DataConflictException;
import com.midori.repository.ClassRepository;
import com.midori.repository.UserRepository;
import com.midori.repository.HomeworkRepository;
import com.midori.repository.ExamRepository;
import com.midori.repository.ClassStatusEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.Set;

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
    private final ListeningLessonService listeningLessonService;
    private final GrammarService grammarService;
    private final com.midori.repository.HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final StudentExamRepository studentExamRepository;
    private final com.midori.repository.ClassMembershipRepository classMembershipRepository;
    private final ClassStatusEventRepository classStatusEventRepository;
    private final LearningAccessService learningAccessService;

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

        java.util.Set<ClassEntity> assignedClasses = student.getAssignedClasses();
        if (assignedClasses == null || assignedClasses.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        List<ClassResponse> list = new ArrayList<>();
        for (ClassEntity classEntity : assignedClasses) {
            boolean match = false;
            if (status == null || status.trim().isEmpty()) {
                match = true;
            } else if ("ACTIVE".equalsIgnoreCase(status)) {
                match = classEntity.getStatus() == ClassEntity.ClassStatus.ACTIVE;
            } else if ("ARCHIVED".equalsIgnoreCase(status)) {
                match = classEntity.getStatus() == ClassEntity.ClassStatus.ARCHIVED;
            } else {
                match = true; // "ALL"
            }
            if (match) {
                list.add(mapToClassResponse(classEntity));
            }
        }
        return list;
    }

    @Override
    public ClassResponse getStudentClassDetail(UUID studentId, UUID classId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));

        java.util.Set<ClassEntity> assignedClasses = student.getAssignedClasses();
        ClassEntity assignedClass = null;
        if (assignedClasses != null) {
            for (ClassEntity c : assignedClasses) {
                if (c.getId().equals(classId)) {
                    assignedClass = c;
                    break;
                }
            }
        }

        if (assignedClass == null) {
            // Verify class exists to return 404 instead of 403 if it is a non-existent class
            classRepository.findById(classId)
                    .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
            throw new com.midori.exception.AccessDeniedException("Student is not enrolled in this class");
        }

        // Get join date from ClassMembership
        Instant joinDate = classMembershipRepository.findByStudentIdAndClassId(studentId, classId)
                .map(ClassMembership::getJoinedAt)
                .orElse(assignedClass.getCreatedAt());

        ClassResponse response = mapToClassResponse(assignedClass);
        response.setJoinDate(joinDate);
        return response;
    }

    @Override
    @Transactional
    public ClassResponse createClass(CreateClassRequest request, UUID teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));

        String classCode = generateClassCode(request.getLevel());

        ClassEntity classEntity = ClassEntity.builder()
                .name(request.getName())
                .level(request.getLevel())
                .maxStudents(request.getMaxStudents())
                .description(request.getDescription())
                .teacher(teacher)
                .status(ClassEntity.ClassStatus.ACTIVE)
                .classCode(classCode)
                .build();

        ClassEntity savedClass = classRepository.save(classEntity);

        ClassStatusEvent event = ClassStatusEvent.builder()
                .classEntity(savedClass)
                .eventType(ClassStatusEvent.ClassEventType.CREATED)
                .performedBy(teacher)
                .build();
        classStatusEventRepository.save(event);

        return mapToClassResponse(savedClass);
    }

    private String generateClassCode(GrammarLevel level) {
        int year = java.time.Year.now().getValue();
        String yy = String.format("%02d", year % 100);
        String prefix = "JP" + yy + level.name();

        String maxCode = classRepository.findMaxClassCodeByPrefix(prefix);

        int nextSeq;
        if (maxCode == null) {
            nextSeq = 1;
        } else {
            String seqStr = maxCode.substring(prefix.length());
            nextSeq = Integer.parseInt(seqStr) + 1;
        }

        return prefix + String.format("%04d", nextSeq);
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
    public void deleteClass(UUID classId, UUID teacherId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));

        User user = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));
        boolean isAdmin = user.getRole() == com.midori.entity.Role.ADMIN;
        if (!classEntity.getTeacher().getId().equals(teacherId) && !isAdmin) {
            throw new com.midori.exception.AccessDeniedException("You are not allowed to manage this class");
        }

        // Delete child records first to avoid foreign key constraints and rely on JPA cascades
        List<com.midori.entity.Exam> exams = examRepository.findByAssignedClassId(classId);
        if (!exams.isEmpty()) {
            examRepository.deleteAll(exams);
        }

        List<com.midori.entity.Homework> homeworks = homeworkRepository.findByAssignedClassId(classId);
        if (!homeworks.isEmpty()) {
            homeworkRepository.deleteAll(homeworks);
        }

        // Manually break the relationship with users (students) in Hibernate context
        // to prevent constraint violations if the User entity tries to save cascade operations.
        List<com.midori.entity.User> students = new java.util.ArrayList<>(classEntity.getStudents());
        for (com.midori.entity.User student : students) {
            student.getAssignedClasses().remove(classEntity);
            userRepository.save(student);
        }
        classEntity.getStudents().clear();

        // Finally, delete the class
        classRepository.delete(classEntity);
    }

    @Override
    public List<StudentClassResponse> getClassStudents(UUID classId, UUID teacherId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));

        if (!classEntity.getTeacher().getId().equals(teacherId)) {
            throw new com.midori.exception.AccessDeniedException("You do not have permission to view students of this class");
        }

        // Query through the owning side of the @ManyToMany (User.assignedClasses)
        // to avoid relying on the inverse side (ClassEntity.students) lazy load,
        // which can return stale or empty data when the join table has rows
        // added through addStudentToClass.
        List<User> students = userRepository.findByAssignedClassIdWithProfile(classId);

        List<StudentClassResponse> list = new ArrayList<>();
        for (User student : students) {
            list.add(mapToStudentClassResponse(student, classEntity));
        }

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

        boolean enrolled = false;
        if (student.getAssignedClasses() != null) {
            enrolled = student.getAssignedClasses().removeIf(c -> c.getId().equals(classId));
        }

        if (!enrolled) {
            throw new BadRequestException("Student is not in this class");
        }

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

        if (student.getAssignedClasses() != null) {
            for (ClassEntity c : student.getAssignedClasses()) {
                if (c.getId().equals(classId)) {
                    throw new BadRequestException("Student is already in this class");
                }
            }
        }

        if (classMembershipRepository.findByStudentIdAndClassId(student.getId(), classId).isPresent()) {
            throw new BadRequestException("Student is already in this class");
        }


        if (classEntity.getStudents().size() >= classEntity.getMaxStudents()) {
            throw new BadRequestException("Class is already full");
        }

        if (student.getAssignedClasses() == null) {
            student.setAssignedClasses(new java.util.HashSet<>());
        }
        student.getAssignedClasses().add(classEntity);
        userRepository.save(student);

        // Create ClassMembership to track join date
        ClassMembership membership = ClassMembership.builder()
                .student(student)
                .classEntity(classEntity)
                .build();
        classMembershipRepository.save(membership);
        
        // Grant or extend 1-year Learning Journey access
        learningAccessService.grantOrExtendAccess(student, classEntity);

        return mapToStudentClassResponse(student, classEntity);
    }


    private ClassResponse mapToClassResponse(ClassEntity classEntity) {
        if (classEntity == null) return null;

        int studentCount = classEntity.getStudents() != null ? classEntity.getStudents().size() : 0;

        long homeworkCount = homeworkRepository.countByAssignedClassId(classEntity.getId());

        List<Object[]> upcomingExams = examRepository.countUpcomingExamsPerClass();
        int upcomingExamCount = upcomingExams.stream()
                .filter(arr -> classEntity.getId().equals(arr[0]))
                .map(arr -> ((Long) arr[1]).intValue())
                .findFirst().orElse(0);

        List<com.midori.entity.Exam> allExams = examRepository.findByAssignedClassId(classEntity.getId());
        int examCount = allExams.size();

        // Get teacher name from profile or use email as fallback
        String teacherName = null;
        if (classEntity.getTeacher() != null) {
            if (classEntity.getTeacher().getProfile() != null
                    && classEntity.getTeacher().getProfile().getDisplayName() != null) {
                teacherName = classEntity.getTeacher().getProfile().getDisplayName();
            } else {
                teacherName = classEntity.getTeacher().getEmail();
            }
        }

        return ClassResponse.builder()
                .id(classEntity.getId())
                .name(classEntity.getName())
                .level(classEntity.getLevel())
                .maxStudents(classEntity.getMaxStudents())
                .description(classEntity.getDescription())
                .classCode(classEntity.getClassCode())
                .status(classEntity.getStatus())
                .teacherId(classEntity.getTeacher() != null ? classEntity.getTeacher().getId() : null)
                .teacherName(teacherName)
                .studentCount(studentCount)
                .homeworkCount((int) homeworkCount)
                .examCount(examCount)
                .upcomingExamCount(upcomingExamCount)
                .createdAt(classEntity.getCreatedAt())
                .updatedAt(classEntity.getUpdatedAt())
                .build();
    }


    private StudentClassResponse mapToStudentClassResponse(User student, ClassEntity classEntity) {
        if (student == null) return null;

        // Calculate progress data for this student in this class
        int totalHomework = (int) homeworkRepository.countByAssignedClassId(classEntity.getId());
        List<HomeworkSubmission> submissions = homeworkSubmissionRepository.findByStudentId(student.getId()).stream()
                .filter(sub -> sub.getHomework() != null && sub.getHomework().getAssignedClass() != null && sub.getHomework().getAssignedClass().getId().equals(classEntity.getId()))
                .collect(Collectors.toList());

        // Count submitted homework (submitted, not just created)
        int submittedHomework = (int) submissions.stream()
                .filter(sub -> sub.getSubmittedAt() != null)
                .count();

        // Count exams completed for this class
        List<Exam> classExams = examRepository.findByAssignedClassId(classEntity.getId());
        Set<UUID> classExamIds = classExams.stream().map(Exam::getId).collect(Collectors.toSet());
        List<StudentExam> studentExams = studentExamRepository.findByStudentId(student.getId()).stream()
                .filter(e -> e.getExam() != null && classExamIds.contains(e.getExam().getId()))
                .collect(Collectors.toList());
        int completedExams = (int) studentExams.stream()
                .filter(e -> e.getSubmittedAt() != null)
                .count();

        // Calculate average score (in %) from all graded submissions and exams.
        // Homework and exam scores live on different scales, so we normalize
        // each item to a 0-100 percentage before averaging.
        double totalPercent = 0;
        int scoreCount = 0;

        // Homework scores → percentage of max score
        for (HomeworkSubmission sub : submissions) {
            if (sub.getStatus() == HomeworkSubmission.SubmissionStatus.GRADED
                    && sub.getScore() != null
                    && sub.getHomework() != null
                    && sub.getHomework().getMaxScore() != null
                    && sub.getHomework().getMaxScore() > 0) {
                double itemPercent = (sub.getScore() * 100.0) / sub.getHomework().getMaxScore();
                totalPercent += itemPercent;
                scoreCount++;
            }
        }

        // Exam scores → use percentage if available, else compute from score / totalPoints
        for (StudentExam exam : studentExams) {
            Double itemPercent = null;
            if (exam.getPercentage() != null) {
                itemPercent = exam.getPercentage();
            } else if (exam.getScore() != null && exam.getTotalPoints() != null && exam.getTotalPoints() > 0) {
                itemPercent = (exam.getScore() * 100.0) / exam.getTotalPoints();
            }
            if (itemPercent != null) {
                totalPercent += itemPercent;
                scoreCount++;
            }
        }

        double averageScore = scoreCount > 0 ? (totalPercent / scoreCount) : 0;

        // Calculate overall progress percentage (homework + exams)
        int totalItems = totalHomework + classExams.size();
        int completedItems = submittedHomework + completedExams;
        int progressPercent = totalItems > 0 ? (int) ((completedItems * 100) / totalItems) : 0;

        // Find last activity
        Instant lastActivityAt = null;
        for (HomeworkSubmission sub : submissions) {
            if (sub.getSubmittedAt() != null) {
                if (lastActivityAt == null || sub.getSubmittedAt().isAfter(lastActivityAt)) {
                    lastActivityAt = sub.getSubmittedAt();
                }
            }
        }
        for (StudentExam exam : studentExams) {
            if (exam.getSubmittedAt() != null) {
                if (lastActivityAt == null || exam.getSubmittedAt().isAfter(lastActivityAt)) {
                    lastActivityAt = exam.getSubmittedAt();
                }
            }
        }

        // Get join date from ClassMembership
        Instant joinedAt = classMembershipRepository.findByStudentIdAndClassId(student.getId(), classEntity.getId())
                .map(ClassMembership::getJoinedAt)
                .orElse(student.getCreatedAt());

        return StudentClassResponse.builder()
                .studentId(student.getId())
                .fullName(student.getProfile() != null ? student.getProfile().getDisplayName() : null)
                .email(student.getEmail())
                .avatar(student.getProfile() != null ? student.getProfile().getAvatarUrl() : null)
                .status(student.getStatus())
                .progressPercent(progressPercent)
                .submittedHomework(Math.min(submittedHomework, totalHomework))
                .totalHomework(totalHomework)
                .completedExams(completedExams)
                .totalExams(classExams.size())
                .averageScore(Math.round(averageScore * 10.0) / 10.0)
                .lastActivityAt(lastActivityAt)
                .joinedAt(joinedAt)
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
        
        listeningLessonService.getActiveListeningLessonsByLevel(levelStr).forEach(listening -> {
            Map<String, Object> map = new HashMap<>();
            map.put("type", "LISTENING");
            map.put("id", listening.getId());
            map.put("title", listening.getTitle());
            map.put("level", listening.getJlptLevel());
            map.put("topic", listening.getDescription());
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

            java.util.Optional<HomeworkSubmission> subOpt = homeworkSubmissionRepository.findFirstByHomeworkIdAndStudentIdOrderBySubmittedAtDesc(homework.getId(), studentId);
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

    @Override
    public boolean isStudentEnrolledInLevel(UUID studentId, String level) {
        if (level == null || level.trim().isEmpty()) {
            return false;
        }
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null) {
            return false;
        }
        java.util.Set<ClassEntity> assignedClasses = student.getAssignedClasses();
        if (assignedClasses == null) {
            return false;
        }
        for (ClassEntity classEntity : assignedClasses) {
            if (classEntity.getStatus() == ClassEntity.ClassStatus.ACTIVE
                    && classEntity.getLevel() != null
                    && classEntity.getLevel().name().equalsIgnoreCase(level.trim())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public java.util.Set<String> getStudentActiveLevels(UUID studentId) {
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null) {
            return java.util.Collections.emptySet();
        }
        java.util.Set<ClassEntity> assignedClasses = student.getAssignedClasses();
        if (assignedClasses == null) {
            return java.util.Collections.emptySet();
        }
        java.util.Set<String> levels = new java.util.HashSet<>();
        for (ClassEntity classEntity : assignedClasses) {
            if (classEntity.getStatus() == ClassEntity.ClassStatus.ACTIVE && classEntity.getLevel() != null) {
                levels.add(classEntity.getLevel().name());
            }
        }
        return levels;
    }
}




