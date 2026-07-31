package com.midori.service.impl;

import com.midori.dto.questiondto.QuestionBankGeneratorLessonResponse;
import com.midori.dto.questiondto.QuestionIdDifficulty;
import com.midori.dto.questiondto.RandomizeQuestionsRequest;
import com.midori.dto.questiondto.TeacherQuestionPreviewDto;
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
    public List<QuestionBankLesson> getLessonsByLevel(String level) {
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

        return teacherQuestionRepository.findLessonSummaries(level, upperSkills);
    }

    @Override
    public List<TeacherQuestionPreviewDto> randomizeQuestions(RandomizeQuestionsRequest request) {
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

        int total = request.getQuestionCount();
        int easyCount = Math.round((request.getDifficulty().getEasy() * total) / 100.0f);
        int mediumCount = Math.round((request.getDifficulty().getMedium() * total) / 100.0f);
        int hardCount = Math.round((request.getDifficulty().getHard() * total) / 100.0f);

        int diff = total - (easyCount + mediumCount + hardCount);
        if (diff != 0) {
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

        return generateSelection(request.getLevel(), request.getSkills(), request.getLessonIds(), easyCount, mediumCount, hardCount);
    }

    @Override
    public List<TeacherQuestionPreviewDto> generatePreview(com.midori.dto.questiondto.GeneratePreviewRequest request) {
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

        return generateSelection(request.getLevel(), request.getSkills(), request.getLessonIds(), easyCount, mediumCount, hardCount);
    }

    private List<TeacherQuestionPreviewDto> generateSelection(String level, List<String> skills, List<Integer> lessonIds, int easyCount, int mediumCount, int hardCount) {
        List<String> upperSkills = skills.stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList());

        List<QuestionIdDifficulty> projections = teacherQuestionRepository.findCandidateProjections(level, upperSkills, lessonIds);

        List<UUID> easyIds = new ArrayList<>();
        List<UUID> mediumIds = new ArrayList<>();
        List<UUID> hardIds = new ArrayList<>();

        // Define an upper bound for candidate pool size to ensure randomness but avoid reading millions of rows.
        // E.g., we only need up to 10x the required count per difficulty to have a good shuffle pool.
        int easyLimit = easyCount * 10;
        int mediumLimit = mediumCount * 10;
        int hardLimit = hardCount * 10;

        for (QuestionIdDifficulty p : projections) {
            if ("EASY".equalsIgnoreCase(p.getDifficulty()) && easyIds.size() < easyLimit) {
                easyIds.add(p.getId());
            } else if ("MEDIUM".equalsIgnoreCase(p.getDifficulty()) && mediumIds.size() < mediumLimit) {
                mediumIds.add(p.getId());
            } else if ("HARD".equalsIgnoreCase(p.getDifficulty()) && hardIds.size() < hardLimit) {
                hardIds.add(p.getId());
            }
            
            if (easyIds.size() >= easyLimit && mediumIds.size() >= mediumLimit && hardIds.size() >= hardLimit) {
                break;
            }
        }

        if (easyIds.size() < easyCount) {
            throw new BadRequestException(String.format("Only %d Easy questions are available.", easyIds.size()));
        }
        if (mediumIds.size() < mediumCount) {
            throw new BadRequestException(String.format("Only %d Medium questions are available.", mediumIds.size()));
        }
        if (hardIds.size() < hardCount) {
            throw new BadRequestException(String.format("Only %d Hard questions are available.", hardIds.size()));
        }

        Random random = new Random();
        Collections.shuffle(easyIds, random);
        Collections.shuffle(mediumIds, random);
        Collections.shuffle(hardIds, random);

        List<UUID> selectedIds = new ArrayList<>();
        selectedIds.addAll(easyIds.subList(0, easyCount));
        selectedIds.addAll(mediumIds.subList(0, mediumCount));
        selectedIds.addAll(hardIds.subList(0, hardCount));

        if (selectedIds.isEmpty()) return Collections.emptyList();

        // Mix the difficulties
        Collections.shuffle(selectedIds, random);

        List<TeacherQuestion> selectedEntities = teacherQuestionRepository.findByIdIn(selectedIds);
        Map<UUID, TeacherQuestion> entityMap = selectedEntities.stream()
                .collect(Collectors.toMap(TeacherQuestion::getId, q -> q));

        // Preserve the original ordering (from selectedIds) after fetching
        return selectedIds.stream()
                .map(entityMap::get)
                .filter(Objects::nonNull)
                .map(this::mapToPreviewDto)
                .collect(Collectors.toList());
    }

    private TeacherQuestionPreviewDto mapToPreviewDto(TeacherQuestion question) {
        if (question == null) return null;
        return TeacherQuestionPreviewDto.builder()
                .id(question.getId())
                .skill(question.getSkill())
                .difficulty(question.getDifficulty())
                .points(question.getPoints())
                .prompt(question.getPrompt())
                .options(question.getOptions())
                .correctAnswerIndex(question.getCorrectAnswerIndex())
                .build();
    }
}
