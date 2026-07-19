-- Backfill skill for homework/seeded questions using question_type
UPDATE teacher_questions
SET skill = question_type
WHERE skill IS NULL AND question_type IN ('Vocabulary', 'Grammar', 'Reading');

-- Backfill level for exam questions using the linked exam's level
UPDATE teacher_questions tq
SET level = (
    SELECT e.level
    FROM exam_questions eq
    JOIN exams e ON e.id = eq.exam_id
    WHERE eq.source_teacher_question_id = tq.id
    LIMIT 1
)
WHERE tq.level IS NULL;

-- Backfill skill for exam questions using the linked exam_question category or exam category
UPDATE teacher_questions tq
SET skill = COALESCE(
    (SELECT eq.category FROM exam_questions eq WHERE eq.source_teacher_question_id = tq.id LIMIT 1),
    (SELECT e.category FROM exam_questions eq JOIN exams e ON e.id = eq.exam_id WHERE eq.source_teacher_question_id = tq.id LIMIT 1)
)
WHERE tq.skill IS NULL;

-- Fallback defaults for remaining orphaned/development rows
UPDATE teacher_questions SET level = 'N5' WHERE level IS NULL;
UPDATE teacher_questions SET skill = 'Grammar' WHERE skill IS NULL;
