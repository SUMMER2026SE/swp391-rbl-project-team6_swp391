package com.midori.service;

import com.midori.dto.request.CreateExamRequest;
import com.midori.dto.request.UpdateExamQuestionsRequest;
import com.midori.dto.request.UpdateExamRequest;
import com.midori.dto.response.ExamQuestionResponse;
import com.midori.dto.response.ExamResponse;
import com.midori.dto.response.StudentExamResponse;
import com.midori.entity.*;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamGenerationServiceImpl implements ExamGenerationService {

    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final StudentExamRepository studentExamRepository;
    private final StudentExamQuestionRepository studentExamQuestionRepository;
    private final GrammarRepository grammarRepository;
    private final VocabularyWordRepository vocabularyWordRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final TeacherQuestionRepository teacherQuestionRepository;

    private static final Random RANDOM = new Random();

    @Override
    @Transactional
    public ExamResponse createExam(CreateExamRequest request, UserDetails userDetails) {
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ExamStatus initialStatus = ExamStatus.DRAFT;
        if (request.getStatus() != null) {
            try {
                initialStatus = ExamStatus.valueOf(request.getStatus().toUpperCase());
            } catch (Exception e) {
                // Keep default
            }
        }

        Exam exam = Exam.builder()
                .title(request.getTitle())
                .level(GrammarLevel.valueOf(request.getLevel()))
                .totalQuestions(request.getTotalQuestions())
                .timeLimit(request.getTimeLimit())
                .examMode(request.getExamMode() != null ? ExamMode.valueOf(request.getExamMode()) : ExamMode.SAME_FOR_ALL)
                .questionReuse(request.getQuestionReuse() != null ? QuestionReuse.valueOf(request.getQuestionReuse()) : QuestionReuse.ALLOW_REUSE)
                .randomizeAnswers(request.getRandomizeAnswers() != null ? request.getRandomizeAnswers() : false)
                .lessonIds(request.getLessonIds() != null ? request.getLessonIds() : new ArrayList<>())
                .category(request.getCategory())
                .difficultyEasy(request.getDifficultyEasy() != null ? request.getDifficultyEasy() : 0)
                .difficultyMedium(request.getDifficultyMedium() != null ? request.getDifficultyMedium() : 0)
                .difficultyHard(request.getDifficultyHard() != null ? request.getDifficultyHard() : 0)
                .createdBy(teacher)
                .status(initialStatus)
                .build();

        if (request.getClassIds() != null && !request.getClassIds().isEmpty()) {
            String classIdStr = request.getClassIds().get(0);
            if (classIdStr != null && !classIdStr.trim().isEmpty()) {
                ClassEntity classEntity = classRepository.findById(UUID.fromString(classIdStr))
                        .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
                if (classEntity.getStatus() == ClassEntity.ClassStatus.ARCHIVED) {
                    throw new com.midori.exception.BadRequestException("Class is archived and cannot receive new exams");
                }
                exam.setAssignedClass(classEntity);
            }
        }

        exam = examRepository.save(exam);

        List<ExamQuestion> questions = generateQuestionsFromBank(exam, request);
        exam.setQuestions(questions);
        exam = examRepository.save(exam);

        if (exam.getAssignedClass() != null && exam.getStatus() == ExamStatus.PUBLISHED) {
            List<User> students = exam.getAssignedClass().getStudents();
            if (students != null) {
                for (User student : students) {
                    try {
                        startStudentExam(exam.getId(), student.getId());
                    } catch (Exception e) {
                        // Log or ignore if student exam already exists
                    }
                }
            }
        }

        return mapToExamResponse(exam);
    }

    private List<ExamQuestion> generateQuestionsFromBank(Exam exam, CreateExamRequest request) {
        List<ExamQuestion> allQuestions = new ArrayList<>();

        if (request.getQuestionIds() != null && !request.getQuestionIds().isEmpty()) {
            List<TeacherQuestion> tqs = teacherQuestionRepository.findAllById(request.getQuestionIds());
            for (int i = 0; i < tqs.size(); i++) {
                TeacherQuestion tq = tqs.get(i);
                
                Difficulty diff;
                try {
                    diff = Difficulty.valueOf(tq.getDifficulty().toUpperCase());
                } catch (Exception e) {
                    diff = Difficulty.MEDIUM;
                }

                ExamQuestion question = ExamQuestion.builder()
                        .exam(exam)
                        .questionText(tq.getPrompt())
                        .options(new ArrayList<>(tq.getOptions()))
                        .correctAnswerIndex(tq.getCorrectAnswerIndex())
                        .explanation(tq.getExplanation())
                        .difficulty(diff)
                        .displayOrder(i + 1)
                        .points(tq.getPoints() != null ? tq.getPoints() : 1)
                        .build();
                allQuestions.add(question);
            }
            return examQuestionRepository.saveAll(allQuestions);
        }

        GrammarLevel level = GrammarLevel.valueOf(request.getLevel());

        List<Grammar> grammars = grammarRepository.findAllByStatusWithCreator(GrammarStatus.APPROVED);
        grammars = grammars.stream()
                .filter(g -> g.getLevel() == level)
                .filter(g -> request.getLessonIds() == null || request.getLessonIds().isEmpty() || true)
                .collect(Collectors.toList());

        int easyCount = request.getDifficultyEasy() != null ? request.getDifficultyEasy() : 0;
        int mediumCount = request.getDifficultyMedium() != null ? request.getDifficultyMedium() : 0;
        int hardCount = request.getDifficultyHard() != null ? request.getDifficultyHard() : 0;

        Set<String> savedPrompts = new HashSet<>();

        for (Grammar grammar : grammars) {
            if (allQuestions.size() >= request.getTotalQuestions()) break;

            List<String> options = generateOptions(grammar);
            int correctIndex = RANDOM.nextInt(options.size());
            Difficulty diff = selectDifficulty(easyCount, mediumCount, hardCount, allQuestions);

            ExamQuestion question = ExamQuestion.builder()
                    .exam(exam)
                    .sourceGrammarId(grammar.getId())
                    .questionText(grammar.getTitle())
                    .options(options)
                    .correctAnswerIndex(correctIndex)
                    .explanation(grammar.getMeaning())
                    .difficulty(diff)
                    .displayOrder(allQuestions.size() + 1)
                    .points(1)
                    .build();

            allQuestions.add(question);

            try {
                String promptText = grammar.getTitle() != null ? grammar.getTitle().trim() : "";
                if (!promptText.isEmpty() && !savedPrompts.contains(promptText) &&
                        !teacherQuestionRepository.existsByTeacherIdAndPrompt(exam.getCreatedBy().getId(), promptText)) {
                    
                    savedPrompts.add(promptText);
                    TeacherQuestion tq = TeacherQuestion.builder()
                            .teacher(exam.getCreatedBy())
                            .prompt(promptText)
                            .questionType("Multiple Choice")
                            .difficulty(diff.name())
                            .correctAnswerIndex(correctIndex)
                            .explanation(grammar.getMeaning())
                            .tags(level.name() + ", Grammar")
                            .status("ACTIVE")
                            .points(1)
                            .options(new ArrayList<>(options))
                            .level(exam.getLevel().name())
                            .skill("Grammar")
                            .source("EXAM")
                            .build();
                    teacherQuestionRepository.saveAndFlush(tq);
                }
            } catch (Exception e) {
                log.error("Failed to save generated exam question to bank", e);
            }
        }

        Collections.shuffle(allQuestions, RANDOM);

        for (int i = 0; i < allQuestions.size(); i++) {
            allQuestions.get(i).setDisplayOrder(i + 1);
        }

        return examQuestionRepository.saveAll(allQuestions);
    }

    private List<String> generateOptions(Grammar grammar) {
        List<String> options = new ArrayList<>();
        options.add(grammar.getMeaning());

        List<Grammar> otherGrammars = grammarRepository.findAll();
        Collections.shuffle(otherGrammars, RANDOM);

        int added = 0;
        for (Grammar other : otherGrammars) {
            if (added >= 3 && !other.getMeaning().equals(grammar.getMeaning())) break;
            if (!other.getId().equals(grammar.getId()) && other.getMeaning() != null) {
                options.add(other.getMeaning());
                added++;
            }
        }

        while (options.size() < 4) {
            options.add("Option " + (options.size() + 1));
        }

        Collections.shuffle(options, RANDOM);
        return options;
    }

    private Difficulty selectDifficulty(int easyCount, int mediumCount, int hardCount, List<ExamQuestion> current) {
        long currentEasy = current.stream().filter(q -> q.getDifficulty() == Difficulty.EASY).count();
        long currentMedium = current.stream().filter(q -> q.getDifficulty() == Difficulty.MEDIUM).count();
        long currentHard = current.stream().filter(q -> q.getDifficulty() == Difficulty.HARD).count();

        double rand = RANDOM.nextDouble();
        double total = easyCount + mediumCount + hardCount;

        if (total == 0) return Difficulty.MEDIUM;

        double easyRatio = (double) easyCount / total;
        double mediumRatio = (double) mediumCount / total;

        if (rand < easyRatio && currentEasy < easyCount) return Difficulty.EASY;
        if (rand < easyRatio + mediumRatio && currentMedium < mediumCount) return Difficulty.MEDIUM;
        return Difficulty.HARD;
    }

    @Override
    @Transactional
    public StudentExamResponse startStudentExam(UUID examId, UUID studentId) {
        Exam exam = examRepository.findByIdWithQuestions(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));

        if (exam.getStatus() != ExamStatus.PUBLISHED) {
            throw new BadRequestException("Exam is not published");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Optional<StudentExam> existingExam = studentExamRepository.findByExamIdAndStudentId(examId, studentId);
        if (existingExam.isPresent()) {
            return mapToStudentExamResponse(existingExam.get(), exam.getExamMode() == ExamMode.RANDOM_PER_STUDENT);
        }

        StudentExam studentExam = StudentExam.builder()
                .exam(exam)
                .student(student)
                .examVersion(generateVersionCode())
                .status(StudentExamStatus.IN_PROGRESS)
                .startedAt(java.time.Instant.now())
                .totalPoints(exam.getTotalQuestions())
                .build();

        studentExam = studentExamRepository.save(studentExam);

        List<StudentExamQuestion> studentQuestions;

        if (exam.getExamMode() == ExamMode.RANDOM_PER_STUDENT) {
            studentQuestions = generateRandomizedQuestions(exam, studentExam);
        } else {
            studentQuestions = generateFixedQuestions(exam, studentExam);
        }

        studentExam.setQuestions(studentQuestions);
        studentExam = studentExamRepository.save(studentExam);

        return mapToStudentExamResponse(studentExam, exam.getExamMode() == ExamMode.RANDOM_PER_STUDENT);
    }

    private List<StudentExamQuestion> generateFixedQuestions(Exam exam, StudentExam studentExam) {
        List<StudentExamQuestion> questions = new ArrayList<>();

        for (ExamQuestion eq : exam.getQuestions()) {
            List<String> options = new ArrayList<>(eq.getOptions());
            int correctIndex = eq.getCorrectAnswerIndex();

            if (Boolean.TRUE.equals(exam.getRandomizeAnswers())) {
                String correctAnswer = options.get(correctIndex);
                Collections.shuffle(options, RANDOM);
                correctIndex = options.indexOf(correctAnswer);
            }

            StudentExamQuestion seq = StudentExamQuestion.builder()
                    .studentExam(studentExam)
                    .originalQuestionId(eq.getId())
                    .questionText(eq.getQuestionText())
                    .options(options)
                    .correctAnswerIndex(correctIndex)
                    .displayOrder(eq.getDisplayOrder())
                    .points(eq.getPoints())
                    .build();

            questions.add(seq);
        }

        return studentExamQuestionRepository.saveAll(questions);
    }

    private List<StudentExamQuestion> generateRandomizedQuestions(Exam exam, StudentExam studentExam) {
        List<ExamQuestion> pool = new ArrayList<>(exam.getQuestions());
        Collections.shuffle(pool, RANDOM);

        int totalNeeded = exam.getTotalQuestions();
        List<StudentExamQuestion> questions = new ArrayList<>();

        int easyNeeded = exam.getDifficultyEasy();
        int mediumNeeded = exam.getDifficultyMedium();
        int hardNeeded = exam.getDifficultyHard();

        Map<Difficulty, List<ExamQuestion>> byDifficulty = pool.stream()
                .collect(Collectors.groupingBy(q -> q.getDifficulty() != null ? q.getDifficulty() : Difficulty.MEDIUM));

        List<ExamQuestion> easyPool = new ArrayList<>(byDifficulty.getOrDefault(Difficulty.EASY, new ArrayList<>()));
        List<ExamQuestion> mediumPool = new ArrayList<>(byDifficulty.getOrDefault(Difficulty.MEDIUM, new ArrayList<>()));
        List<ExamQuestion> hardPool = new ArrayList<>(byDifficulty.getOrDefault(Difficulty.HARD, new ArrayList<>()));

        Collections.shuffle(easyPool, RANDOM);
        Collections.shuffle(mediumPool, RANDOM);
        Collections.shuffle(hardPool, RANDOM);

        List<ExamQuestion> selected = new ArrayList<>();

        int selectedEasy = 0, selectedMedium = 0, selectedHard = 0;
        for (ExamQuestion q : easyPool) {
            if (selectedEasy >= easyNeeded) break;
            selected.add(q);
            selectedEasy++;
        }
        for (ExamQuestion q : mediumPool) {
            if (selectedMedium >= mediumNeeded) break;
            selected.add(q);
            selectedMedium++;
        }
        for (ExamQuestion q : hardPool) {
            if (selectedHard >= hardNeeded) break;
            selected.add(q);
            selectedHard++;
        }

        while (selected.size() < totalNeeded) {
            for (List<ExamQuestion> p : Arrays.asList(easyPool, mediumPool, hardPool)) {
                for (ExamQuestion q : p) {
                    if (selected.size() >= totalNeeded) break;
                    if (!selected.contains(q)) {
                        selected.add(q);
                        break;
                    }
                }
                if (selected.size() >= totalNeeded) break;
            }
        }

        Collections.shuffle(selected, RANDOM);

        for (int i = 0; i < selected.size(); i++) {
            ExamQuestion eq = selected.get(i);

            List<String> options = new ArrayList<>(eq.getOptions());
            int correctIndex = eq.getCorrectAnswerIndex();

            if (Boolean.TRUE.equals(exam.getRandomizeAnswers())) {
                String correctAnswer = options.get(correctIndex);
                Collections.shuffle(options, RANDOM);
                correctIndex = options.indexOf(correctAnswer);
            }

            StudentExamQuestion seq = StudentExamQuestion.builder()
                    .studentExam(studentExam)
                    .originalQuestionId(eq.getId())
                    .questionText(eq.getQuestionText())
                    .options(options)
                    .correctAnswerIndex(correctIndex)
                    .displayOrder(i + 1)
                    .points(eq.getPoints())
                    .build();

            questions.add(seq);
        }

        return studentExamQuestionRepository.saveAll(questions);
    }

    private String generateVersionCode() {
        return "V" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @Override
    @Transactional
    public StudentExamResponse submitStudentExam(UUID studentExamId, List<Integer> answers) {
        StudentExam studentExam = studentExamRepository.findByIdWithQuestions(studentExamId)
                .orElseThrow(() -> new ResourceNotFoundException("Student exam not found"));

        if (studentExam.getStatus() == StudentExamStatus.GRADED || studentExam.getStatus() == StudentExamStatus.SUBMITTED) {
            throw new BadRequestException("Exam already submitted");
        }

        List<StudentExamQuestion> questions = studentExamQuestionRepository
                .findByStudentExamIdOrderByDisplayOrder(studentExamId);

        int score = 0;
        int totalPoints = 0;

        for (int i = 0; i < questions.size(); i++) {
            StudentExamQuestion q = questions.get(i);
            q.setSelectedAnswerIndex(answers.size() > i ? answers.get(i) : null);
            q.setIsCorrect(q.getSelectedAnswerIndex() != null &&
                          q.getSelectedAnswerIndex().equals(q.getCorrectAnswerIndex()));
            if (Boolean.TRUE.equals(q.getIsCorrect())) {
                score += q.getPoints();
            }
            totalPoints += q.getPoints();
        }

        studentExamQuestionRepository.saveAll(questions);

        studentExam.setStatus(StudentExamStatus.GRADED);
        studentExam.setSubmittedAt(java.time.Instant.now());
        studentExam.setScore(score);
        studentExam.setTotalPoints(totalPoints);
        studentExam.setPercentage(totalPoints > 0 ? (double) score / totalPoints * 100 : 0);

        studentExam = studentExamRepository.save(studentExam);

        return mapToStudentExamResponse(studentExam, false);
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResponse getExamById(UUID examId) {
        Exam exam = examRepository.findByIdWithQuestions(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        return mapToExamResponse(exam);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getAllExams() {
        return examRepository.findAllWithQuestions().stream()
                .map(this::mapToExamResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getExamsByTeacher(UUID teacherId) {
        return examRepository.findAllByCreatorWithQuestions(teacherId).stream()
                .map(this::mapToExamResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExamResponse publishExam(UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        exam.setStatus(ExamStatus.PUBLISHED);
        exam = examRepository.save(exam);

        if (exam.getAssignedClass() != null) {
            List<User> students = exam.getAssignedClass().getStudents();
            if (students != null) {
                for (User student : students) {
                    try {
                        startStudentExam(exam.getId(), student.getId());
                    } catch (Exception e) {
                        // ignore/skip
                    }
                }
            }
        }

        return mapToExamResponse(exam);
    }

    @Override
    @Transactional
    public void deleteExam(UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        examRepository.delete(exam);
    }

    @Override
    @Transactional
    public ExamResponse updateExam(UUID examId, UpdateExamRequest request) {
        Exam exam = examRepository.findByIdWithQuestions(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            exam.setTitle(request.getTitle().trim());
        }
        if (request.getLevel() != null && !request.getLevel().isBlank()) {
            try {
                exam.setLevel(GrammarLevel.valueOf(request.getLevel().toUpperCase()));
            } catch (Exception e) {
                throw new BadRequestException("Invalid level: " + request.getLevel());
            }
        }
        if (request.getTimeLimit() != null) {
            exam.setTimeLimit(request.getTimeLimit());
        }
        if (request.getTotalQuestions() != null) {
            exam.setTotalQuestions(request.getTotalQuestions());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                ExamStatus newStatus = ExamStatus.valueOf(request.getStatus().toUpperCase());
                exam.setStatus(newStatus);

                if (newStatus == ExamStatus.PUBLISHED && exam.getAssignedClass() != null) {
                    List<User> students = exam.getAssignedClass().getStudents();
                    if (students != null) {
                        for (User student : students) {
                            try {
                                startStudentExam(exam.getId(), student.getId());
                            } catch (Exception e) {
                                // ignore duplicate student exam
                            }
                        }
                    }
                }
            } catch (Exception e) {
                throw new BadRequestException("Invalid status: " + request.getStatus());
            }
        }
        if (request.getCategory() != null) {
            exam.setCategory(request.getCategory());
        }
        if (request.getClassIds() != null && !request.getClassIds().isEmpty()) {
            String classIdStr = request.getClassIds().get(0);
            if (classIdStr != null && !classIdStr.trim().isEmpty()) {
                ClassEntity classEntity = classRepository.findById(UUID.fromString(classIdStr))
                        .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
                exam.setAssignedClass(classEntity);
            }
        }

        exam = examRepository.save(exam);
        return mapToExamResponse(exam);
    }

    @Override
    @Transactional
    public ExamResponse updateExamQuestions(UUID examId, UpdateExamQuestionsRequest request) {
        Exam exam = examRepository.findByIdWithQuestions(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));

        if (request.getQuestions() == null) {
            throw new BadRequestException("Questions payload is required");
        }

        // Index existing questions by id for diff (update vs create vs delete)
        Map<UUID, ExamQuestion> existing = new HashMap<>();
        if (exam.getQuestions() != null) {
            for (ExamQuestion q : exam.getQuestions()) {
                existing.put(q.getId(), q);
            }
        }

        List<ExamQuestion> incoming = new ArrayList<>();
        Set<UUID> keepIds = new HashSet<>();

        for (int i = 0; i < request.getQuestions().size(); i++) {
            var payload = request.getQuestions().get(i);
            ExamQuestion q;
            Integer points = payload.getPoints() != null ? payload.getPoints() : 1;
            Integer order = payload.getDisplayOrder() != null ? payload.getDisplayOrder() : (i + 1);
            Integer correct = payload.getCorrectAnswerIndex() != null ? payload.getCorrectAnswerIndex() : 0;
            List<String> options = payload.getOptions() != null ? new ArrayList<>(payload.getOptions()) : new ArrayList<>();

            if (payload.getId() != null && !payload.getId().isBlank()) {
                try {
                    UUID existingId = UUID.fromString(payload.getId());
                    if (existing.containsKey(existingId)) {
                        q = existing.get(existingId);
                        q.setQuestionText(payload.getPrompt());
                        q.setOptions(options);
                        q.setCorrectAnswerIndex(correct);
                        q.setPoints(points);
                        q.setDisplayOrder(order);
                        keepIds.add(existingId);
                        incoming.add(q);
                        continue;
                    }
                } catch (IllegalArgumentException ignored) {
                    // not a valid UUID → treat as new
                }
            }

            q = ExamQuestion.builder()
                    .exam(exam)
                    .questionText(payload.getPrompt())
                    .options(options)
                    .correctAnswerIndex(correct)
                    .displayOrder(order)
                    .points(points)
                    .difficulty(Difficulty.MEDIUM)
                    .build();
            incoming.add(q);
        }

        // Replace the whole collection — orphanRemoval=true takes care of deletes,
        // and Hibernate persists any entity instances we add (kept ones are still
        // attached because we reused the same managed objects, new ones are transient).
        exam.setQuestions(new ArrayList<>(incoming));

        if (exam.getTotalQuestions() == null || exam.getTotalQuestions() != incoming.size()) {
            exam.setTotalQuestions(incoming.size());
        }

        Set<String> savedPrompts = new HashSet<>();
        for (ExamQuestion eq : incoming) {
            try {
                String promptText = eq.getQuestionText() != null ? eq.getQuestionText().trim() : "";
                if (!promptText.isEmpty() && !savedPrompts.contains(promptText) &&
                        !teacherQuestionRepository.existsByTeacherIdAndPrompt(exam.getCreatedBy().getId(), promptText)) {
                    
                    savedPrompts.add(promptText);
                    TeacherQuestion tq = TeacherQuestion.builder()
                            .teacher(exam.getCreatedBy())
                            .prompt(promptText)
                            .questionType("Multiple Choice")
                            .difficulty(eq.getDifficulty() != null ? eq.getDifficulty().name() : "MEDIUM")
                            .correctAnswerIndex(eq.getCorrectAnswerIndex())
                            .explanation(eq.getExplanation() != null ? eq.getExplanation() : "")
                            .tags(exam.getLevel().name() + ", Grammar")
                            .status("ACTIVE")
                            .points(eq.getPoints() != null ? eq.getPoints() : 1)
                            .options(new ArrayList<>(eq.getOptions()))
                            .level(exam.getLevel().name())
                            .skill(eq.getCategory() != null ? eq.getCategory() : "Grammar")
                            .source("EXAM")
                            .build();
                    teacherQuestionRepository.saveAndFlush(tq);
                }
            } catch (Exception e) {
                log.error("Failed to save updated exam question to bank", e);
            }
        }

        exam = examRepository.save(exam);
        return mapToExamResponse(exam);
    }

    @Override
    public StudentExamResponse getStudentExam(UUID studentExamId) {
        StudentExam studentExam = studentExamRepository.findByIdWithQuestions(studentExamId)
                .orElseThrow(() -> new ResourceNotFoundException("Student exam not found"));
        return mapToStudentExamResponse(studentExam, studentExam.getExam().getExamMode() == ExamMode.RANDOM_PER_STUDENT);
    }

    @Override
    public List<StudentExamResponse> getStudentExams(UUID studentId) {
        return studentExamRepository.findByStudentId(studentId).stream()
                .map(se -> mapToStudentExamResponse(se, se.getExam().getExamMode() == ExamMode.RANDOM_PER_STUDENT))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExamResponse assignExamToClass(UUID examId, UUID classId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));

        exam.setAssignedClass(classEntity);
        exam.setStatus(ExamStatus.PUBLISHED);
        exam = examRepository.save(exam);

        List<User> students = classEntity.getStudents();
        for (User student : students) {
            startStudentExam(examId, student.getId());
        }

        return mapToExamResponse(exam);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getExamsByClass(UUID classId) {
        return examRepository.findByAssignedClassIdWithQuestions(classId).stream()
                .map(this::mapToExamResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudentExamResponse> getStudentExamResultsByClass(UUID classId) {
        return studentExamRepository.findByExamAssignedClassId(classId).stream()
                .map(se -> mapToStudentExamResponse(se, false))
                .collect(Collectors.toList());
    }

    private ExamResponse mapToExamResponse(Exam exam) {
        List<ExamQuestionResponse> questionDtos = null;
        if (exam.getQuestions() != null) {
            questionDtos = exam.getQuestions().stream()
                    .sorted((a, b) -> {
                        Integer oa = a.getDisplayOrder() != null ? a.getDisplayOrder() : 0;
                        Integer ob = b.getDisplayOrder() != null ? b.getDisplayOrder() : 0;
                        return oa.compareTo(ob);
                    })
                    .map(q -> ExamQuestionResponse.builder()
                            .id(q.getId())
                            .prompt(q.getQuestionText())
                            .options(q.getOptions() != null ? new ArrayList<>(q.getOptions()) : new ArrayList<>())
                            .correctAnswerIndex(q.getCorrectAnswerIndex())
                            .points(q.getPoints() != null ? q.getPoints() : 1)
                            .displayOrder(q.getDisplayOrder())
                            .build())
                    .collect(Collectors.toList());
        }

        return ExamResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .level(exam.getLevel() != null ? exam.getLevel().name() : null)
                .totalQuestions(exam.getTotalQuestions())
                .timeLimit(exam.getTimeLimit())
                .examMode(exam.getExamMode() != null ? exam.getExamMode().name() : null)
                .questionReuse(exam.getQuestionReuse() != null ? exam.getQuestionReuse().name() : null)
                .randomizeAnswers(exam.getRandomizeAnswers())
                .category(exam.getCategory())
                .difficultyEasy(exam.getDifficultyEasy())
                .difficultyMedium(exam.getDifficultyMedium())
                .difficultyHard(exam.getDifficultyHard())
                .status(exam.getStatus() != null ? exam.getStatus().name() : null)
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .assignedClassId(exam.getAssignedClass() != null ? exam.getAssignedClass().getId() : null)
                .questions(questionDtos != null ? questionDtos : new ArrayList<>())
                .build();
    }

    private StudentExamResponse mapToStudentExamResponse(StudentExam se, boolean hideCorrectAnswers) {
        List<StudentExamResponse.QuestionResponse> questions = se.getQuestions().stream()
                .map(q -> StudentExamResponse.QuestionResponse.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .options(hideCorrectAnswers ? q.getOptions() : q.getOptions())
                        .displayOrder(q.getDisplayOrder())
                        .points(q.getPoints())
                        .selectedAnswerIndex(q.getSelectedAnswerIndex())
                        .correctAnswerIndex(hideCorrectAnswers ? null : q.getCorrectAnswerIndex())
                        .isCorrect(q.getIsCorrect())
                        .build())
                .collect(Collectors.toList());

        return StudentExamResponse.builder()
                .id(se.getId())
                .examId(se.getExam().getId())
                .examTitle(se.getExam().getTitle())
                .studentId(se.getStudent().getId())
                .examVersion(se.getExamVersion())
                .status(se.getStatus().name())
                .startedAt(se.getStartedAt())
                .submittedAt(se.getSubmittedAt())
                .score(se.getScore())
                .totalPoints(se.getTotalPoints())
                .percentage(se.getPercentage())
                .feedback(se.getFeedback())
                .gradedAt(se.getGradedAt())
                .questions(questions)
                .createdAt(se.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public ExamResponse generateExamFromQuestionBank(com.midori.dto.request.GenerateExamFromQuestionBankRequest request, UserDetails userDetails) {
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<TeacherQuestion> matchingQuestions = teacherQuestionRepository.findByLevelAndSkillInAndStatusActive(
                request.getJlptLevel(), request.getSkills());

        List<TeacherQuestion> easyQuestions = new ArrayList<>();
        List<TeacherQuestion> mediumQuestions = new ArrayList<>();
        List<TeacherQuestion> hardQuestions = new ArrayList<>();

        for (TeacherQuestion q : matchingQuestions) {
            String diff = q.getDifficulty() != null ? q.getDifficulty().toUpperCase() : "MEDIUM";
            if (diff.equals("EASY")) {
                easyQuestions.add(q);
            } else if (diff.equals("HARD")) {
                hardQuestions.add(q);
            } else {
                mediumQuestions.add(q);
            }
        }

        if (easyQuestions.size() < request.getEasyCount() ||
                mediumQuestions.size() < request.getMediumCount() ||
                hardQuestions.size() < request.getHardCount()) {
            throw new com.midori.exception.BadRequestException(
                    "Not enough questions in the Question Bank for the selected criteria.");
        }

        Collections.shuffle(easyQuestions, RANDOM);
        Collections.shuffle(mediumQuestions, RANDOM);
        Collections.shuffle(hardQuestions, RANDOM);

        List<TeacherQuestion> selectedTqs = new ArrayList<>();
        for (int i = 0; i < request.getEasyCount(); i++) {
            selectedTqs.add(easyQuestions.get(i));
        }
        for (int i = 0; i < request.getMediumCount(); i++) {
            selectedTqs.add(mediumQuestions.get(i));
        }
        for (int i = 0; i < request.getHardCount(); i++) {
            selectedTqs.add(hardQuestions.get(i));
        }

        int totalQuestions = request.getEasyCount() + request.getMediumCount() + request.getHardCount();
        Exam exam = Exam.builder()
                .title(request.getExamTitle())
                .level(GrammarLevel.valueOf(request.getJlptLevel()))
                .totalQuestions(totalQuestions)
                .timeLimit(totalQuestions > 0 ? totalQuestions * 2 : 45)
                .examMode(ExamMode.SAME_FOR_ALL)
                .questionReuse(QuestionReuse.ALLOW_REUSE)
                .randomizeAnswers(false)
                .lessonIds(new ArrayList<>())
                .category(request.getDescription())
                .difficultyEasy(request.getEasyCount())
                .difficultyMedium(request.getMediumCount())
                .difficultyHard(request.getHardCount())
                .createdBy(teacher)
                .status(ExamStatus.DRAFT)
                .build();

        exam = examRepository.save(exam);

        List<ExamQuestion> examQuestions = new ArrayList<>();
        for (int i = 0; i < selectedTqs.size(); i++) {
            TeacherQuestion tq = selectedTqs.get(i);
            Difficulty diff;
            try {
                diff = Difficulty.valueOf(tq.getDifficulty().toUpperCase());
            } catch (Exception e) {
                diff = Difficulty.MEDIUM;
            }

            ExamQuestion eq = ExamQuestion.builder()
                    .exam(exam)
                    .questionText(tq.getPrompt())
                    .options(new ArrayList<>(tq.getOptions()))
                    .correctAnswerIndex(tq.getCorrectAnswerIndex())
                    .explanation(tq.getExplanation())
                    .difficulty(diff)
                    .displayOrder(i + 1)
                    .points(tq.getPoints() != null ? tq.getPoints() : 1)
                    .sourceTeacherQuestionId(tq.getId())
                    .build();
            examQuestions.add(eq);
        }

        examQuestionRepository.saveAll(examQuestions);
        exam.setQuestions(examQuestions);
        exam = examRepository.save(exam);

        return mapToExamResponse(exam);
    }

    private List<TeacherQuestion> getFilteredQuestions(String level, String source, UUID teacherId) {
        List<TeacherQuestion> allActive = teacherQuestionRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        
        List<TeacherQuestion> filtered = new ArrayList<>();
        for (TeacherQuestion q : allActive) {
            if (q.getLevel() == null || !q.getLevel().equalsIgnoreCase(level)) {
                continue;
            }
            
            boolean matchesSource = false;
            if (source.equalsIgnoreCase("MY_QUESTIONS")) {
                matchesSource = q.getTeacher().getId().equals(teacherId);
            } else if (source.equalsIgnoreCase("ORGANIZATION")) {
                matchesSource = !q.getTeacher().getId().equals(teacherId);
            } else {
                matchesSource = true;
            }
            
            if (matchesSource) {
                filtered.add(q);
            }
        }
        return filtered;
    }

    @Override
    public java.util.Map<String, java.util.Map<String, Integer>> getQuestionStats(String level, String source, UserDetails userDetails) {
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<TeacherQuestion> filtered = getFilteredQuestions(level, source, teacher.getId());

        java.util.Map<String, java.util.Map<String, Integer>> stats = new java.util.LinkedHashMap<>();
        
        for (SkillType sk : SkillType.values()) {
            String skillName = sk.name().charAt(0) + sk.name().substring(1).toLowerCase();
            java.util.Map<String, Integer> diffMap = new java.util.LinkedHashMap<>();
            diffMap.put("EASY", 0);
            diffMap.put("MEDIUM", 0);
            diffMap.put("HARD", 0);
            stats.put(skillName, diffMap);
        }

        for (TeacherQuestion q : filtered) {
            String skill = q.getSkill();
            if (skill == null) continue;
            String normSkill = skill.substring(0, 1).toUpperCase() + skill.substring(1).toLowerCase();
            
            if (!stats.containsKey(normSkill)) {
                java.util.Map<String, Integer> diffMap = new java.util.LinkedHashMap<>();
                diffMap.put("EASY", 0);
                diffMap.put("MEDIUM", 0);
                diffMap.put("HARD", 0);
                stats.put(normSkill, diffMap);
            }
            
            String diff = q.getDifficulty() != null ? q.getDifficulty().toUpperCase() : "MEDIUM";
            java.util.Map<String, Integer> diffMap = stats.get(normSkill);
            diffMap.put(diff, diffMap.getOrDefault(diff, 0) + 1);
        }

        return stats;
    }

    @Override
    public java.util.List<com.midori.dto.questiondto.TeacherQuestionResponse> previewGeneration(
            com.midori.dto.request.PreviewGenerationRequest request, UserDetails userDetails) {
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<TeacherQuestion> filtered = getFilteredQuestions(request.getJlptLevel(), request.getQuestionSource(), teacher.getId());

        List<TeacherQuestion> skillMatched = new ArrayList<>();
        List<String> upperSkills = request.getSkills().stream().map(String::toUpperCase).collect(Collectors.toList());
        for (TeacherQuestion q : filtered) {
            if (q.getSkill() != null && upperSkills.contains(q.getSkill().toUpperCase())) {
                skillMatched.add(q);
            }
        }

        List<TeacherQuestion> easyQuestions = new ArrayList<>();
        List<TeacherQuestion> mediumQuestions = new ArrayList<>();
        List<TeacherQuestion> hardQuestions = new ArrayList<>();

        for (TeacherQuestion q : skillMatched) {
            String diff = q.getDifficulty() != null ? q.getDifficulty().toUpperCase() : "MEDIUM";
            if (diff.equals("EASY")) {
                easyQuestions.add(q);
            } else if (diff.equals("HARD")) {
                hardQuestions.add(q);
            } else {
                mediumQuestions.add(q);
            }
        }

        if (easyQuestions.size() < request.getEasyCount() ||
                mediumQuestions.size() < request.getMediumCount() ||
                hardQuestions.size() < request.getHardCount()) {
            throw new com.midori.exception.BadRequestException(
                    "Not enough questions in the Question Bank for the selected criteria.");
        }

        Collections.shuffle(easyQuestions, RANDOM);
        Collections.shuffle(mediumQuestions, RANDOM);
        Collections.shuffle(hardQuestions, RANDOM);

        List<TeacherQuestion> selected = new ArrayList<>();
        for (int i = 0; i < request.getEasyCount(); i++) {
            selected.add(easyQuestions.get(i));
        }
        for (int i = 0; i < request.getMediumCount(); i++) {
            selected.add(mediumQuestions.get(i));
        }
        for (int i = 0; i < request.getHardCount(); i++) {
            selected.add(hardQuestions.get(i));
        }

        List<com.midori.dto.questiondto.TeacherQuestionResponse> response = new ArrayList<>();
        for (TeacherQuestion q : selected) {
            response.add(com.midori.dto.questiondto.TeacherQuestionResponse.builder()
                    .id(q.getId())
                    .teacherId(q.getTeacher().getId())
                    .topicId(q.getTopicId())
                    .level(q.getLevel())
                    .skill(q.getSkill())
                    .lessonId(q.getLesson() != null ? q.getLesson().getId() : null)
                    .prompt(q.getPrompt())
                    .jpPrompt(q.getJpPrompt())
                    .questionType(q.getQuestionType())
                    .difficulty(q.getDifficulty())
                    .correctAnswerIndex(q.getCorrectAnswerIndex())
                    .explanation(q.getExplanation())
                    .tags(q.getTags())
                    .status(q.getStatus())
                    .points(q.getPoints())
                    .options(q.getOptions())
                    .audioUrl(q.getAudioUrl())
                    .audioFileName(q.getAudioFileName())
                    .audioDuration(q.getAudioDuration())
                    .createdAt(q.getCreatedAt())
                    .updatedAt(q.getUpdatedAt())
                    .build());
        }

        return response;
    }
}
