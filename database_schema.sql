-- ============================================================
-- MIDORI SENSEI - Japanese Learning Platform
-- Database Schema (Tables Only - No Seed Data)
-- For SQL Server
-- ============================================================

-- ============================================================
-- SECTION 1: USERS & AUTHENTICATION
-- ============================================================

-- Users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    role NVARCHAR(20) NOT NULL DEFAULT 'student', -- student, teacher, admin
    status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- active, pending, suspended, banned
    email_verified BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    last_login_at DATETIME
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Teacher profiles
CREATE TABLE teacher_profiles (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    bio NVARCHAR(MAX),
    specialties NVARCHAR(MAX), -- JSON: ["JLPT N1", "Conversation"]
    hourly_rate DECIMAL(10, 2),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    certifications NVARCHAR(MAX), -- JSON
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Student profiles
CREATE TABLE student_profiles (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    native_language VARCHAR(50),
    current_level NVARCHAR(10) DEFAULT 'N5', -- N5, N4, N3, N2, N1, native
    target_level NVARCHAR(10),
    study_goal NVARCHAR(MAX),
    daily_goal_minutes INT DEFAULT 30,
    streak_days INT DEFAULT 0,
    total_xp INT DEFAULT 0,
    time_studied_minutes INT DEFAULT 0,
    joined_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions for authentication
CREATE TABLE sessions (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);

-- ============================================================
-- SECTION 2: VOCABULARY
-- ============================================================

-- Vocabulary lessons
CREATE TABLE vocabulary_lessons (
    id VARCHAR(50) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    level NVARCHAR(10) NOT NULL, -- N5, N4, N3, N2, N1
    lesson_order INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_vocab_level ON vocabulary_lessons(level);

-- Vocabulary words
CREATE TABLE vocabulary_words (
    id VARCHAR(50) PRIMARY KEY,
    lesson_id VARCHAR(50) NOT NULL,
    japanese NVARCHAR(255) NOT NULL,
    kana NVARCHAR(255) NOT NULL,
    romaji NVARCHAR(255) NOT NULL,
    english NVARCHAR(255) NOT NULL,
    vietnamese NVARCHAR(255),
    audio_url VARCHAR(500),
    image_url VARCHAR(500),
    word_order INT,
    examples NVARCHAR(MAX), -- JSON
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (lesson_id) REFERENCES vocabulary_lessons(id) ON DELETE CASCADE
);

CREATE INDEX idx_words_lesson ON vocabulary_words(lesson_id);

-- ============================================================
-- SECTION 3: GRAMMAR
-- ============================================================

-- Grammar categories
CREATE TABLE grammar_categories (
    id VARCHAR(50) PRIMARY KEY,
    level NVARCHAR(10) NOT NULL, -- N5, N4, N3, N2, N1
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    icon VARCHAR(50),
    sort_order INT,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_grammar_level_cat ON grammar_categories(level);

-- Grammar structures
CREATE TABLE grammar_structures (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL,
    pattern NVARCHAR(255) NOT NULL,
    meaning NVARCHAR(255) NOT NULL,
    usage NVARCHAR(MAX) NOT NULL,
    explanation NVARCHAR(MAX),
    level NVARCHAR(10) NOT NULL,
    examples NVARCHAR(MAX), -- JSON
    caution_notes NVARCHAR(MAX),
    related_grammars NVARCHAR(MAX), -- JSON
    sort_order INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES grammar_categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_grammar_category ON grammar_structures(category_id);
CREATE INDEX idx_grammar_level ON grammar_structures(level);

-- ============================================================
-- SECTION 4: LISTENING
-- ============================================================

-- Listening exercises
CREATE TABLE listening_exercises (
    id VARCHAR(50) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    level NVARCHAR(10) NOT NULL,
    transcript NVARCHAR(MAX) NOT NULL,
    audio_url VARCHAR(500),
    duration_seconds INT,
    transcript_translation NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_listening_level ON listening_exercises(level);

-- Listening user progress
CREATE TABLE listening_progress (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL,
    exercise_id VARCHAR(50) NOT NULL,
    is_completed BIT DEFAULT 0,
    times_practiced INT DEFAULT 0,
    last_practiced_at DATETIME,
    score DECIMAL(5, 2),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES listening_exercises(id) ON DELETE CASCADE,
    UNIQUE (user_id, exercise_id)
);

-- ============================================================
-- SECTION 5: SHADOWING
-- ============================================================

-- Shadowing topics
CREATE TABLE shadowing_topics (
    id VARCHAR(50) PRIMARY KEY,
    level NVARCHAR(10) NOT NULL,
    label NVARCHAR(100) NOT NULL,
    emoji VARCHAR(50),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_shadowing_level ON shadowing_topics(level);

-- Shadowing conversations
CREATE TABLE shadowing_conversations (
    id VARCHAR(50) PRIMARY KEY,
    topic_id VARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    sort_order INT,
    FOREIGN KEY (topic_id) REFERENCES shadowing_topics(id) ON DELETE CASCADE
);

CREATE INDEX idx_conversation_topic ON shadowing_conversations(topic_id);

-- Shadowing sentences
CREATE TABLE shadowing_sentences (
    id VARCHAR(50) PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL,
    japanese NVARCHAR(500) NOT NULL,
    romaji NVARCHAR(500) NOT NULL,
    english NVARCHAR(500) NOT NULL,
    audio_url VARCHAR(500),
    sort_order INT,
    FOREIGN KEY (conversation_id) REFERENCES shadowing_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_sentence_conversation ON shadowing_sentences(conversation_id);

-- Shadowing user progress
CREATE TABLE shadowing_progress (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL,
    sentence_id VARCHAR(50) NOT NULL,
    times_practiced INT DEFAULT 0,
    accuracy_score DECIMAL(5, 2),
    pronunciation_score DECIMAL(5, 2),
    last_practiced_at DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sentence_id) REFERENCES shadowing_sentences(id) ON DELETE CASCADE,
    UNIQUE (user_id, sentence_id)
);

-- ============================================================
-- SECTION 6: FLASHCARDS
-- ============================================================

-- Flashcard decks
CREATE TABLE flashcard_decks (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    card_count INT DEFAULT 0,
    is_public BIT DEFAULT 0,
    source_type NVARCHAR(20) DEFAULT 'custom', -- vocabulary, grammar, custom
    source_id VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_deck_user ON flashcard_decks(user_id);

-- Flashcards
CREATE TABLE flashcards (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    deck_id VARCHAR(50) NOT NULL,
    front NVARCHAR(500) NOT NULL,
    back NVARCHAR(1000) NOT NULL,
    front_type NVARCHAR(20) DEFAULT 'japanese', -- japanese, kana, romaji, image
    back_type NVARCHAR(20) DEFAULT 'english', -- english, vietnamese, example, image
    audio_url VARCHAR(500),
    image_url VARCHAR(500),
    hints NVARCHAR(MAX), -- JSON
    tags NVARCHAR(MAX), -- JSON
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
);

CREATE INDEX idx_card_deck ON flashcards(deck_id);

-- Flashcard study sessions
CREATE TABLE flashcard_sessions (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL,
    deck_id VARCHAR(50) NOT NULL,
    cards_studied INT DEFAULT 0,
    cards_correct INT DEFAULT 0,
    duration_seconds INT,
    started_at DATETIME DEFAULT GETDATE(),
    ended_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
);

-- ============================================================
-- SECTION 7: EXAMS & TESTS
-- ============================================================

-- JLPT Exams
CREATE TABLE exams (
    id VARCHAR(50) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    level NVARCHAR(10) NOT NULL,
    description NVARCHAR(MAX),
    total_questions INT NOT NULL,
    duration_minutes INT NOT NULL,
    passing_score DECIMAL(5, 2) DEFAULT 60.00,
    is_published BIT DEFAULT 0,
    created_by VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_exam_level ON exams(level);
CREATE INDEX idx_exam_published ON exams(is_published);

-- Exam questions
CREATE TABLE exam_questions (
    id VARCHAR(50) PRIMARY KEY,
    exam_id VARCHAR(50) NOT NULL,
    question_type NVARCHAR(20) NOT NULL, -- multiple_choice, fill_blank, listening, reading
    question_text NVARCHAR(MAX) NOT NULL,
    question_image VARCHAR(500),
    audio_url VARCHAR(500),
    options NVARCHAR(MAX), -- JSON
    correct_answer NVARCHAR(255) NOT NULL,
    explanation NVARCHAR(MAX),
    points INT DEFAULT 1,
    sort_order INT,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE INDEX idx_question_exam ON exam_questions(exam_id);

-- User exam attempts
CREATE TABLE exam_attempts (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL,
    exam_id VARCHAR(50) NOT NULL,
    score DECIMAL(5, 2),
    passed BIT,
    answers NVARCHAR(MAX), -- JSON
    started_at DATETIME DEFAULT GETDATE(),
    submitted_at DATETIME,
    time_taken_seconds INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE INDEX idx_attempt_user ON exam_attempts(user_id);
CREATE INDEX idx_attempt_exam ON exam_attempts(exam_id);

-- ============================================================
-- SECTION 8: PROGRESS & LEADERBOARD
-- ============================================================

-- User XP and progress tracking
CREATE TABLE user_progress (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    total_xp INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    lessons_completed INT DEFAULT 0,
    words_learned INT DEFAULT 0,
    grammar_mastered INT DEFAULT 0,
    exams_passed INT DEFAULT 0,
    total_study_time_minutes INT DEFAULT 0,
    last_study_date DATE,
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily XP records
CREATE TABLE daily_xp (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    xp_earned INT DEFAULT 0,
    activities NVARCHAR(MAX), -- JSON
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_xp_user ON daily_xp(user_id);
CREATE INDEX idx_daily_xp_date ON daily_xp(date);

-- Skill scores for radar chart
CREATE TABLE skill_scores (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL,
    skill_type NVARCHAR(20) NOT NULL, -- vocabulary, grammar, listening, reading, speaking, kanji
    score DECIMAL(5, 2) DEFAULT 0,
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, skill_type)
);

-- ============================================================
-- SECTION 9: AI SENSEI CHAT
-- ============================================================

-- AI Sensei conversations
CREATE TABLE ai_conversations (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL,
    title NVARCHAR(255),
    context NVARCHAR(MAX), -- JSON
    last_message_at DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_convo_user ON ai_conversations(user_id);

-- AI Sensei messages
CREATE TABLE ai_messages (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    conversation_id VARCHAR(50) NOT NULL,
    sender NVARCHAR(10) NOT NULL, -- user, ai
    message NVARCHAR(MAX) NOT NULL,
    attachments NVARCHAR(MAX), -- JSON
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_message_convo ON ai_messages(conversation_id);

-- ============================================================
-- SECTION 10: NOTIFICATIONS
-- ============================================================

-- Notifications
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL,
    type NVARCHAR(20) NOT NULL, -- achievement, streak, exam, system, message, reminder
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    data NVARCHAR(MAX), -- JSON
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_read ON notifications(user_id, is_read);

-- ============================================================
-- SECTION 11: ADMIN & MODERATION
-- ============================================================

-- Moderation reports
CREATE TABLE reports (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    reporter_id VARCHAR(50) NOT NULL,
    reported_user_id VARCHAR(50),
    reported_content_type NVARCHAR(20) NOT NULL, -- user, flashcard, message, comment
    reported_content_id VARCHAR(50),
    reason NVARCHAR(20) NOT NULL, -- spam, harassment, inappropriate, copyright, other
    description NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    reviewed_by VARCHAR(50),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_report_status ON reports(status);

-- Teacher-student relationships
CREATE TABLE teacher_students (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    teacher_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending', -- active, inactive, pending
    assigned_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (teacher_id, student_id)
);

-- ============================================================
-- SECTION 12: ANALYTICS
-- ============================================================

-- Analytics events
CREATE TABLE analytics_events (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50),
    event_type VARCHAR(100) NOT NULL,
    event_data NVARCHAR(MAX), -- JSON
    ip_address VARCHAR(45),
    user_agent NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

-- ============================================================
-- SECTION 13: SETTINGS
-- ============================================================

-- User settings
CREATE TABLE user_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT (LOWER(CONVERT(VARCHAR(32), NEWID()))),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    theme NVARCHAR(10) DEFAULT 'auto', -- light, dark, auto
    language VARCHAR(10) DEFAULT 'en',
    notifications_enabled BIT DEFAULT 1,
    email_notifications BIT DEFAULT 1,
    daily_reminder BIT DEFAULT 1,
    reminder_time TIME,
    display_name NVARCHAR(100),
    bio NVARCHAR(MAX),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SECTION 14: VIEWS FOR REPORTING
-- ============================================================

-- Leaderboard view
CREATE VIEW v_leaderboard AS
SELECT 
    u.id,
    u.name,
    u.avatar,
    up.total_xp,
    up.current_streak,
    ROW_NUMBER() OVER (ORDER BY up.total_xp DESC) as rank
FROM users u
INNER JOIN user_progress up ON u.id = up.user_id
WHERE u.status = 'active';

-- Student statistics view
CREATE VIEW v_student_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    sp.current_level,
    up.total_xp,
    up.current_streak,
    up.lessons_completed,
    up.words_learned,
    up.grammar_mastered,
    up.total_study_time_minutes
FROM users u
INNER JOIN student_profiles sp ON u.id = sp.user_id
INNER JOIN user_progress up ON u.id = up.user_id
WHERE u.role = 'student';

-- ============================================================
-- END OF SCHEMA
-- ============================================================
