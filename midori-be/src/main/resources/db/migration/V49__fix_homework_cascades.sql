-- V49__fix_homework_cascades.sql

-- Dynamically fix missing cascades that prevent homework deletion

DO $$ 
DECLARE
    rec RECORD;
BEGIN
    -- Fix foreign keys that depend on homework
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
          AND ccu.table_name = 'homework'
          AND tc.table_name IN ('homework_questions', 'homework_submissions', 'manual_homework', 'manual_homework_questions')
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || ' DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(rec.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(rec.column_name) || ') ' ||
                ' REFERENCES homework(id) ON DELETE CASCADE';
    END LOOP;

    -- Fix foreign keys that depend on exams (exam_questions if missing)
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
          AND ccu.table_name = 'exams'
          AND tc.table_name IN ('exam_questions')
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || ' DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(rec.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(rec.column_name) || ') ' ||
                ' REFERENCES exams(id) ON DELETE CASCADE';
    END LOOP;

END $$;
