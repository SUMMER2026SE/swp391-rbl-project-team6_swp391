-- Add class_code column to classes table
ALTER TABLE classes ADD COLUMN class_code VARCHAR(20);

-- Add unique constraint for class_code
ALTER TABLE classes ADD CONSTRAINT uk_classes_class_code UNIQUE (class_code);

-- Add index for faster lookups
CREATE INDEX idx_classes_class_code ON classes(class_code);
