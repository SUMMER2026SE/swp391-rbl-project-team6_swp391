-- Index to optimize role and status checks for users
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- Index to optimize is_published check for vocabulary lessons
CREATE INDEX IF NOT EXISTS idx_vocabulary_lessons_v2_published ON vocabulary_lessons_v2(is_published);

-- Index to optimize is_active check for listening lessons
CREATE INDEX IF NOT EXISTS idx_listening_lessons_active ON listening_lessons(is_active);

-- Index to optimize status checks for grammars
CREATE INDEX IF NOT EXISTS idx_grammars_status ON grammars(status);

-- Index to optimize status checks for flashcard sets
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_status ON flashcard_sets(status);
