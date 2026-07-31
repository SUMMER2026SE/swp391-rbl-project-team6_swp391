-- Dynamically add ON DELETE CASCADE to all foreign keys pointing to classes table
DO $$ 
DECLARE
    rec RECORD;
BEGIN
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
          -- student_learning_access intentionally left out as it already has ON DELETE SET NULL
          AND tc.table_name IN ('homework', 'exams', 'class_memberships', 'class_status_events')
    ) LOOP
        -- Drop the existing constraint
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || ' DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
        
        -- Re-add the constraint with ON DELETE CASCADE
        EXECUTE 'ALTER TABLE ' || quote_ident(rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(rec.constraint_name) || 
                ' FOREIGN KEY (' || quote_ident(rec.column_name) || ') ' ||
                ' REFERENCES classes(id) ON DELETE CASCADE';
    END LOOP;
END $$;
