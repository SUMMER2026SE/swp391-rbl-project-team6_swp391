-- V50__fix_all_missing_cascades.sql

-- Dynamically fix all nested cascades that might have been overwritten by Hibernate ddl-auto

DO $$ 
DECLARE
    rec RECORD;
BEGIN
    -- Fix foreign keys that depend on student_exams
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
          AND ccu.table_name = 'student_exams'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || ' DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(rec.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(rec.column_name) || ') ' ||
                ' REFERENCES student_exams(id) ON DELETE CASCADE';
    END LOOP;

    -- Fix foreign keys that depend on student_exam_questions
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
          AND ccu.table_name = 'student_exam_questions'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || ' DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(rec.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(rec.column_name) || ') ' ||
                ' REFERENCES student_exam_questions(id) ON DELETE CASCADE';
    END LOOP;

    -- Fix foreign keys that depend on exam_questions
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
          AND ccu.table_name = 'exam_questions'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || ' DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(rec.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(rec.column_name) || ') ' ||
                ' REFERENCES exam_questions(id) ON DELETE CASCADE';
    END LOOP;

    -- Fix foreign keys that depend on classes directly just in case (class_students, class_invites)
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
          AND ccu.table_name = 'classes'
          AND tc.table_name IN ('class_students', 'class_invites')
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || ' DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(rec.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(rec.column_name) || ') ' ||
                ' REFERENCES classes(id) ON DELETE CASCADE';
    END LOOP;
END $$;
