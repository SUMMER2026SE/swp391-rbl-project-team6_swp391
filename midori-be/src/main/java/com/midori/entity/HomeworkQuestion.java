package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "homework_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeworkQuestion {

    @EmbeddedId
    private HomeworkQuestionId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("homeworkId")
    @JoinColumn(name = "homework_id", nullable = false)
    private Homework homework;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("questionId")
    @JoinColumn(name = "question_id", nullable = false)
    private TeacherQuestion question;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;
}
