-- V48__fix_class_deletion_cascades.sql

-- Dynamically fix missing cascades that prevent class deletion

DO $$ 
DECLARE
    rec RECORD;
BEGIN
    -- 1. Fix student_exams.exam_id to ON DELETE CASCADE
    -- If a class is deleted, its exams are cascade-deleted. 
    -- If an exam is deleted, its student_exams should be cascade-deleted.
    FOR rec IN (
        SELECT tc.table_name, tc.constraint_name, kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'student_exams'
          AND ccu.table_name = 'exams'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || ' DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(rec.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(rec.column_name) || ') ' ||
                ' REFERENCES exams(id) ON DELETE CASCADE';
    END LOOP;

    -- 2. Fix users.class_id to ON DELETE SET NULL
    -- This is a legacy column from V21 but might still have values and foreign key constraints blocking class deletion.
    FOR rec IN (
        SELECT tc.table_name, tc.constraint_name, kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'users'
          AND ccu.table_name = 'classes'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || ' DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(rec.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(rec.column_name) || ') ' ||
                ' REFERENCES classes(id) ON DELETE SET NULL';
    END LOOP;

END $$;
