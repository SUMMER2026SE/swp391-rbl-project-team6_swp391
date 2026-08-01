package com.midori.service;

import com.midori.entity.TeacherQuestion;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.HomeworkQuestionRepository;
import com.midori.repository.TeacherQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherQuestionServiceImpl implements TeacherQuestionService {

    private final TeacherQuestionRepository teacherQuestionRepository;
    private final com.midori.repository.UserRepository userRepository;
    private final HomeworkQuestionRepository homeworkQuestionRepository;

    @Override
    @Transactional
    public TeacherQuestion createQuestion(TeacherQuestion question) {
        return teacherQuestionRepository.save(question);
    }

    @Override
    @Transactional
    public List<TeacherQuestion> createQuestions(List<TeacherQuestion> questions) {
        return teacherQuestionRepository.saveAll(questions);
    }

    @Override
    @Transactional
    public TeacherQuestion updateQuestion(UUID id, TeacherQuestion questionDetails, UUID teacherId) {
        TeacherQuestion question = teacherQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TeacherQuestion", "id", id));
        
        // Allow if user is creator or an ADMIN
        boolean isAdmin = userRepository.findById(teacherId)
                .map(u -> u.getRole() == com.midori.entity.Role.ADMIN)
                .orElse(false);
        if (!question.getTeacher().getId().equals(teacherId) && !isAdmin) {
            throw new com.midori.exception.AccessDeniedException("You do not own this question");
        }

        question.setTopicId(questionDetails.getTopicId());
        question.setLevel(questionDetails.getLevel());
        question.setSkill(questionDetails.getSkill());
        question.setLesson(questionDetails.getLesson());
        question.setPrompt(questionDetails.getPrompt());
        question.setJpPrompt(questionDetails.getJpPrompt());
        question.setQuestionType(questionDetails.getQuestionType());
        question.setDifficulty(questionDetails.getDifficulty());
        question.setCorrectAnswerIndex(questionDetails.getCorrectAnswerIndex());
        question.setExplanation(questionDetails.getExplanation());
        question.setTags(questionDetails.getTags());
        question.setStatus(questionDetails.getStatus());
        question.setPoints(questionDetails.getPoints());
        question.setOptions(questionDetails.getOptions());
        question.setFormatMetadata(questionDetails.getFormatMetadata());
        question.setAudioUrl(questionDetails.getAudioUrl());
        question.setAudioFileName(questionDetails.getAudioFileName());
        question.setAudioDuration(questionDetails.getAudioDuration());

        return teacherQuestionRepository.save(question);
    }

    @Override
    @Transactional
    public void deleteQuestion(UUID id, UUID teacherId) {
        TeacherQuestion question = teacherQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TeacherQuestion", "id", id));
        
        boolean isAdmin = userRepository.findById(teacherId)
                .map(u -> u.getRole() == com.midori.entity.Role.ADMIN)
                .orElse(false);
        if (!question.getTeacher().getId().equals(teacherId) && !isAdmin) {
            throw new com.midori.exception.AccessDeniedException("You do not own this question");
        }
        // Remove references from homework_questions before deleting the question
        homeworkQuestionRepository.deleteByQuestionId(id);
        teacherQuestionRepository.delete(question);
    }

    @Override
    public TeacherQuestion findQuestionById(UUID id, UUID teacherId) {
        TeacherQuestion question = teacherQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TeacherQuestion", "id", id));
        
        boolean isAdmin = userRepository.findById(teacherId)
                .map(u -> u.getRole() == com.midori.entity.Role.ADMIN)
                .orElse(false);
        boolean isTeacher = userRepository.findById(teacherId)
                .map(u -> u.getRole() == com.midori.entity.Role.TEACHER)
                .orElse(false);
        boolean isCreator = question.getTeacher().getId().equals(teacherId);
        boolean isActive = question.getStatus().equals(com.midori.entity.UserStatus.ACTIVE.name());

        if (!isCreator && !isAdmin && !(isTeacher && isActive)) {
            throw new com.midori.exception.AccessDeniedException("You do not have access to this question");
        }
        return question;
    }

    @Override
    public List<TeacherQuestion> findQuestionsByTeacher(UUID teacherId) {
        return teacherQuestionRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
    }

    @Override
    public List<TeacherQuestion> findQuestionsForTeacherView(UUID teacherId) {
        return teacherQuestionRepository.findByTeacherIdOrStatusActiveOrderByCreatedAtDesc(teacherId);
    }

    @Override
    public List<TeacherQuestion> findCentralizedQuestions() {
        return teacherQuestionRepository.findByStatusOrderByCreatedAtDesc(com.midori.entity.UserStatus.ACTIVE.name());
    }
}
