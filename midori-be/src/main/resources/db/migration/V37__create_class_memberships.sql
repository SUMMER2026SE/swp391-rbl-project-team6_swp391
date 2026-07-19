-- Create class_memberships table to track when students join classes
CREATE TABLE class_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_class_memberships_student_class UNIQUE (student_id, class_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_class_memberships_student ON class_memberships(student_id);
CREATE INDEX idx_class_memberships_class ON class_memberships(class_id);

-- Migrate existing data from class_students join table
INSERT INTO class_memberships (student_id, class_id, joined_at)
SELECT cs.student_id, cs.class_id, c.created_at
FROM class_students cs
JOIN classes c ON cs.class_id = c.id
ON CONFLICT (student_id, class_id) DO NOTHING;
