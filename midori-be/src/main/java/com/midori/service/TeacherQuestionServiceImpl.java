package com.midori.service;

import com.midori.entity.TeacherQuestion;
import com.midori.exception.ResourceNotFoundException;
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

    @Override
    @Transactional
    public TeacherQuestion createQuestion(TeacherQuestion question) {
        return teacherQuestionRepository.save(question);
    }

    @Override
    @Transactional
    public TeacherQuestion updateQuestion(UUID id, TeacherQuestion questionDetails, UUID teacherId) {
        TeacherQuestion question = teacherQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TeacherQuestion", "id", id));
        if (!question.getTeacher().getId().equals(teacherId)) {
            throw new com.midori.exception.AccessDeniedException("You do not own this question");
        }
        question.setTopicId(questionDetails.getTopicId());
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
        return teacherQuestionRepository.save(question);
    }

    @Override
    @Transactional
    public void deleteQuestion(UUID id, UUID teacherId) {
        TeacherQuestion question = teacherQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TeacherQuestion", "id", id));
        if (!question.getTeacher().getId().equals(teacherId)) {
            throw new com.midori.exception.AccessDeniedException("You do not own this question");
        }
        teacherQuestionRepository.delete(question);
    }

    @Override
    public TeacherQuestion findQuestionById(UUID id, UUID teacherId) {
        TeacherQuestion question = teacherQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TeacherQuestion", "id", id));
        if (!question.getTeacher().getId().equals(teacherId)) {
            throw new com.midori.exception.AccessDeniedException("You do not own this question");
        }
        return question;
    }

    @Override
    public List<TeacherQuestion> findQuestionsByTeacher(UUID teacherId) {
        return teacherQuestionRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
    }
}
