-- Flyway migration to create manual homework and manual homework questions tables
CREATE TABLE IF NOT EXISTS manual_homeworks (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    duration INT NOT NULL DEFAULT 0,
    teacher_id UUID NOT NULL,
    question_count INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_manual_homeworks_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS manual_homework_questions (
    id UUID PRIMARY KEY,
    manual_homework_id UUID NOT NULL,
    question_order INT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    points INT NOT NULL DEFAULT 1,
    skill VARCHAR(50),
    image_url VARCHAR(255),
    CONSTRAINT fk_manual_homework_questions_homework FOREIGN KEY (manual_homework_id) REFERENCES manual_homeworks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_manual_homeworks_teacher_id ON manual_homeworks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_manual_homeworks_status ON manual_homeworks(status);
CREATE INDEX IF NOT EXISTS idx_manual_homeworks_level ON manual_homeworks(level);
CREATE INDEX IF NOT EXISTS idx_manual_homeworks_type ON manual_homeworks(type);
CREATE INDEX IF NOT EXISTS idx_manual_homeworks_deleted_at ON manual_homeworks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_manual_homeworks_teacher_deleted ON manual_homeworks(teacher_id, deleted_at);

