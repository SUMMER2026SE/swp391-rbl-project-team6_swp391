package com.midori.service.impl;

import com.midori.dto.questiondto.QuestionBankGeneratorLessonResponse;
import com.midori.dto.questiondto.RandomizeQuestionsRequest;
import com.midori.dto.questiondto.TeacherQuestionResponse;
import com.midori.entity.QuestionBankLesson;
import com.midori.entity.TeacherQuestion;
import com.midori.exception.BadRequestException;
import com.midori.repository.TeacherQuestionRepository;
import com.midori.service.QuestionBankService;
import com.midori.service.QuestionBankLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionBankServiceImpl implements QuestionBankService {

    private final TeacherQuestionRepository teacherQuestionRepository;
    private final QuestionBankLessonService questionBankLessonService;

    @Override
    public List<String> getLevels() {
        return List.of("N5", "N4", "N3", "N2", "N1");
    }

    @Override
    public List<String> getSkills() {
        return List.of("VOCABULARY", "GRAMMAR", "READING");
    }

    @Override
    public List<com.midori.entity.QuestionBankLesson> getLessonsByLevel(String level) {
        // Only return lessons that are ACTIVE so teachers cannot see Draft lessons.
        return questionBankLessonService.findActiveLessonsByLevel(level);
    }

    @Override
    public List<QuestionBankGeneratorLessonResponse> getLessons(String level, List<String> skills) {
        if (skills == null || skills.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> upperSkills = skills.stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList());

        // Query active questions for the level and selected skills
        List<TeacherQuestion> questions = teacherQuestionRepository.findByLevelAndSkillInAndStatusActive(
                level, upperSkills
        );

        // Group questions by lesson - only include lessons with ACTIVE status
        // This ensures only properly published lessons are available for homework/exam generation
        Map<QuestionBankLesson, List<TeacherQuestion>> grouped = questions.stream()
                .filter(q -> q.getLesson() != null && "ACTIVE".equals(q.getLesson().getStatus()))
                .collect(Collectors.groupingBy(TeacherQuestion::getLesson));

        List<QuestionBankGeneratorLessonResponse> lessonResponses = new ArrayList<>();

        for (Map.Entry<QuestionBankLesson, List<TeacherQuestion>> entry : grouped.entrySet()) {
            QuestionBankLesson lesson = entry.getKey();
            List<TeacherQuestion> qList = entry.getValue();

            int easy = 0;
            int medium = 0;
            int hard = 0;

            for (TeacherQuestion q : qList) {
                String diff = q.getDifficulty() != null ? q.getDifficulty().toUpperCase() : "MEDIUM";
                if ("EASY".equals(diff)) {
                    easy++;
                } else if ("HARD".equals(diff)) {
                    hard++;
                } else {
                    medium++;
                }
            }

            lessonResponses.add(QuestionBankGeneratorLessonResponse.builder()
                    .id(lesson.getId())
                    .name("Lesson " + lesson.getLessonNumber() + ": " + lesson.getLessonName())
                    .level(level)
                    .easy(easy)
                    .medium(medium)
                    .hard(hard)
                    .questionCount(qList.size())
                    .build());
        }

        // Sort by lesson ID or number
        lessonResponses.sort(Comparator.comparing(QuestionBankGeneratorLessonResponse::getId));

        return lessonResponses;
    }

    @Override
    public List<TeacherQuestionResponse> randomizeQuestions(RandomizeQuestionsRequest request) {
        if (request.getDifficulty().getEasy() + request.getDifficulty().getMedium() + request.getDifficulty().getHard() != 100) {
            throw new BadRequestException("Difficulty percentages must equal 100%.");
        }
        if (request.getQuestionCount() <= 0) {
            throw new BadRequestException("Total questions must be greater than zero.");
        }
        if (request.getSkills() == null || request.getSkills().isEmpty()) {
            throw new BadRequestException("At least one skill must be selected.");
        }
        if (request.getLessonIds() == null || request.getLessonIds().isEmpty()) {
            throw new BadRequestException("At least one lesson must be selected.");
        }

        // Calculate exact target counts
        int total = request.getQuestionCount();
        int easyCount = Math.round((request.getDifficulty().getEasy() * total) / 100.0f);
        int mediumCount = Math.round((request.getDifficulty().getMedium() * total) / 100.0f);
        int hardCount = Math.round((request.getDifficulty().getHard() * total) / 100.0f);

        int diff = total - (easyCount + mediumCount + hardCount);
        if (diff != 0) {
            // Adjust remainder to the category with highest ratio
            int maxRatio = Math.max(request.getDifficulty().getEasy(),
                    Math.max(request.getDifficulty().getMedium(), request.getDifficulty().getHard()));
            if (maxRatio == request.getDifficulty().getEasy()) {
                easyCount += diff;
            } else if (maxRatio == request.getDifficulty().getMedium()) {
                mediumCount += diff;
            } else {
                hardCount += diff;
            }
        }

        // Fetch candidate questions
        List<String> upperSkills = request.getSkills().stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList());

        List<Integer> lessonIds = request.getLessonIds();

        List<TeacherQuestion> easyList = new ArrayList<>(teacherQuestionRepository.findCandidates(request.getLevel(), upperSkills, "EASY", lessonIds));
        List<TeacherQuestion> mediumList = new ArrayList<>(teacherQuestionRepository.findCandidates(request.getLevel(), upperSkills, "MEDIUM", lessonIds));
        List<TeacherQuestion> hardList = new ArrayList<>(teacherQuestionRepository.findCandidates(request.getLevel(), upperSkills, "HARD", lessonIds));

        // Validate availability
        if (easyList.size() < easyCount || mediumList.size() < mediumCount || hardList.size() < hardCount) {
            String validationMsg = String.format(
                "Not enough questions available.\nNeed:\nEasy %d\nMedium %d\nHard %d\nAvailable:\nEasy %d\nMedium %d\nHard %d",
                easyCount, mediumCount, hardCount,
                easyList.size(), mediumList.size(), hardList.size()
            );
            throw new BadRequestException(validationMsg);
        }

        // Randomize
        Random random = new Random();
        Collections.shuffle(easyList, random);
        Collections.shuffle(mediumList, random);
        Collections.shuffle(hardList, random);

        List<TeacherQuestion> selected = new ArrayList<>();
        selected.addAll(easyList.subList(0, easyCount));
        selected.addAll(mediumList.subList(0, mediumCount));
        selected.addAll(hardList.subList(0, hardCount));

        // Shuffle the combined list so questions are mixed up
        Collections.shuffle(selected, random);

        return selected.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TeacherQuestionResponse> generatePreview(com.midori.dto.questiondto.GeneratePreviewRequest request) {
        if (request.getSkills() == null || request.getSkills().isEmpty()) {
            throw new BadRequestException("At least one skill must be selected.");
        }
        if (request.getLessonIds() == null || request.getLessonIds().isEmpty()) {
            throw new BadRequestException("At least one lesson must be selected.");
        }

        int easyCount = request.getDifficulty().getEasy();
        int mediumCount = request.getDifficulty().getMedium();
        int hardCount = request.getDifficulty().getHard();

        if (easyCount < 0 || mediumCount < 0 || hardCount < 0) {
            throw new BadRequestException("Question counts must be non-negative.");
        }
        if (easyCount + mediumCount + hardCount <= 0) {
            throw new BadRequestException("Total question count must be greater than zero.");
        }

        // Fetch candidate questions
        List<String> upperSkills = request.getSkills().stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList());

        List<Integer> lessonIds = request.getLessonIds();

        List<TeacherQuestion> easyList = new ArrayList<>(teacherQuestionRepository.findCandidates(request.getLevel(), upperSkills, "EASY", lessonIds));
        List<TeacherQuestion> mediumList = new ArrayList<>(teacherQuestionRepository.findCandidates(request.getLevel(), upperSkills, "MEDIUM", lessonIds));
        List<TeacherQuestion> hardList = new ArrayList<>(teacherQuestionRepository.findCandidates(request.getLevel(), upperSkills, "HARD", lessonIds));

        // Validate availability
        if (easyList.size() < easyCount) {
            throw new BadRequestException(String.format("Only %d Easy questions are available.", easyList.size()));
        }
        if (mediumList.size() < mediumCount) {
            throw new BadRequestException(String.format("Only %d Medium questions are available.", mediumList.size()));
        }
        if (hardList.size() < hardCount) {
            throw new BadRequestException(String.format("Only %d Hard questions are available.", hardList.size()));
        }

        // Randomize
        Random random = new Random();
        Collections.shuffle(easyList, random);
        Collections.shuffle(mediumList, random);
        Collections.shuffle(hardList, random);

        List<TeacherQuestion> selected = new ArrayList<>();
        selected.addAll(easyList.subList(0, easyCount));
        selected.addAll(mediumList.subList(0, mediumCount));
        selected.addAll(hardList.subList(0, hardCount));

        // Shuffle the combined list so questions are mixed up
        Collections.shuffle(selected, random);

        return selected.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TeacherQuestionResponse mapToResponse(TeacherQuestion question) {
        if (question == null) return null;
        return TeacherQuestionResponse.builder()
                .id(question.getId())
                .teacherId(question.getTeacher().getId())
                .topicId(question.getTopicId())
                .level(question.getLevel())
                .skill(question.getSkill())
                .lessonId(question.getLesson() != null ? question.getLesson().getId() : null)
                .prompt(question.getPrompt())
                .jpPrompt(question.getJpPrompt())
                .questionType(question.getQuestionType())
                .difficulty(question.getDifficulty())
                .correctAnswerIndex(question.getCorrectAnswerIndex())
                .explanation(question.getExplanation())
                .tags(question.getTags())
                .status(question.getStatus())
                .points(question.getPoints())
                .options(question.getOptions())
                .audioUrl(question.getAudioUrl())
                .audioFileName(question.getAudioFileName())
                .audioDuration(question.getAudioDuration())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }
}
