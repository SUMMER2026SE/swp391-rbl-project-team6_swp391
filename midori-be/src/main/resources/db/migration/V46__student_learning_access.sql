CREATE TABLE student_learning_access (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    level VARCHAR(10) NOT NULL,
    source_class_id UUID,
    access_start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    access_expire_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_sla_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_sla_source_class FOREIGN KEY (source_class_id) REFERENCES classes (id) ON DELETE SET NULL,
    CONSTRAINT uq_sla_student_level UNIQUE (student_id, level)
);

CREATE INDEX idx_sla_student_level ON student_learning_access(student_id, level);
CREATE INDEX idx_sla_status_expire ON student_learning_access(status, access_expire_at);

-- Backfill from class_memberships
-- We only want one active/latest record per student/level. So we take the latest joined class for each student-level combination.
INSERT INTO student_learning_access (
    id,
    student_id,
    level,
    source_class_id,
    access_start_at,
    access_expire_at,
    status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    cm.student_id,
    c.level,
    cm.class_id,
    cm.joined_at,
    cm.joined_at + INTERVAL '1 year',
    CASE 
        WHEN cm.joined_at + INTERVAL '1 year' > CURRENT_TIMESTAMP THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM class_memberships cm
JOIN classes c ON cm.class_id = c.id
WHERE cm.joined_at = (
    -- Get latest join date for this student and level
    SELECT MAX(cm2.joined_at)
    FROM class_memberships cm2
    JOIN classes c2 ON cm2.class_id = c2.id
    WHERE cm2.student_id = cm.student_id AND c2.level = c.level
);
