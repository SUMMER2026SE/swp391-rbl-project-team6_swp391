package com.midori.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class HomeworkQuestionId implements Serializable {

    @Column(name = "homework_id")
    private UUID homeworkId;

    @Column(name = "question_id")
    private UUID questionId;

    public HomeworkQuestionId() {}

    public HomeworkQuestionId(UUID homeworkId, UUID questionId) {
        this.homeworkId = homeworkId;
        this.questionId = questionId;
    }

    public UUID getHomeworkId() {
        return homeworkId;
    }

    public void setHomeworkId(UUID homeworkId) {
        this.homeworkId = homeworkId;
    }

    public UUID getQuestionId() {
        return questionId;
    }

    public void setQuestionId(UUID questionId) {
        this.questionId = questionId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HomeworkQuestionId that = (HomeworkQuestionId) o;
        return Objects.equals(homeworkId, that.homeworkId) &&
               Objects.equals(questionId, that.questionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(homeworkId, questionId);
    }
}
