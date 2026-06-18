package com.midori.service;

import com.midori.dto.request.CreateExamRequest;
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

    private static final Random RANDOM = new Random();

    @Override
    @Transactional
    public ExamResponse createExam(CreateExamRequest request, UserDetails userDetails) {
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

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
                .status(ExamStatus.DRAFT)
                .build();

        exam = examRepository.save(exam);

        List<ExamQuestion> questions = generateQuestionsFromBank(exam, request);
        exam.setQuestions(questions);
        exam = examRepository.save(exam);

        return mapToExamResponse(exam);
    }

    private List<ExamQuestion> generateQuestionsFromBank(Exam exam, CreateExamRequest request) {
        List<ExamQuestion> allQuestions = new ArrayList<>();

        GrammarLevel level = GrammarLevel.valueOf(request.getLevel());

        List<Grammar> grammars = grammarRepository.findAllByStatusWithCreator(GrammarStatus.APPROVED);
        grammars = grammars.stream()
                .filter(g -> g.getLevel() == level)
                .filter(g -> request.getLessonIds() == null || request.getLessonIds().isEmpty() || true)
                .collect(Collectors.toList());

        int easyCount = request.getDifficultyEasy() != null ? request.getDifficultyEasy() : 0;
        int mediumCount = request.getDifficultyMedium() != null ? request.getDifficultyMedium() : 0;
        int hardCount = request.getDifficultyHard() != null ? request.getDifficultyHard() : 0;

        for (Grammar grammar : grammars) {
            if (allQuestions.size() >= request.getTotalQuestions()) break;

            List<String> options = generateOptions(grammar);
            int correctIndex = RANDOM.nextInt(options.size());

            ExamQuestion question = ExamQuestion.builder()
                    .exam(exam)
                    .sourceGrammarId(grammar.getId())
                    .questionText(grammar.getTitle())
                    .options(options)
                    .correctAnswerIndex(correctIndex)
                    .explanation(grammar.getMeaning())
                    .difficulty(selectDifficulty(easyCount, mediumCount, hardCount, allQuestions))
                    .displayOrder(allQuestions.size() + 1)
                    .points(1)
                    .build();

            allQuestions.add(question);
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

        if (studentExam.getStatus() == StudentExamStatus.SUBMITTED) {
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

        studentExam.setStatus(StudentExamStatus.SUBMITTED);
        studentExam.setSubmittedAt(java.time.Instant.now());
        studentExam.setScore(score);
        studentExam.setTotalPoints(totalPoints);
        studentExam.setPercentage(totalPoints > 0 ? (double) score / totalPoints * 100 : 0);

        studentExam = studentExamRepository.save(studentExam);

        return mapToStudentExamResponse(studentExam, false);
    }

    @Override
    public ExamResponse getExamById(UUID examId) {
        Exam exam = examRepository.findByIdWithQuestions(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        return mapToExamResponse(exam);
    }

    @Override
    public List<ExamResponse> getAllExams() {
        return examRepository.findAll().stream()
                .map(this::mapToExamResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ExamResponse> getExamsByTeacher(UUID teacherId) {
        return examRepository.findByCreatedById(teacherId).stream()
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
        exam = examRepository.save(exam);

        List<User> students = classEntity.getStudents();
        for (User student : students) {
            startStudentExam(examId, student.getId());
        }

        return mapToExamResponse(exam);
    }

    private ExamResponse mapToExamResponse(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .level(exam.getLevel().name())
                .totalQuestions(exam.getTotalQuestions())
                .timeLimit(exam.getTimeLimit())
                .examMode(exam.getExamMode().name())
                .questionReuse(exam.getQuestionReuse().name())
                .randomizeAnswers(exam.getRandomizeAnswers())
                .category(exam.getCategory())
                .difficultyEasy(exam.getDifficultyEasy())
                .difficultyMedium(exam.getDifficultyMedium())
                .difficultyHard(exam.getDifficultyHard())
                .status(exam.getStatus().name())
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
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
                .questions(questions)
                .createdAt(se.getCreatedAt())
                .build();
    }
}
