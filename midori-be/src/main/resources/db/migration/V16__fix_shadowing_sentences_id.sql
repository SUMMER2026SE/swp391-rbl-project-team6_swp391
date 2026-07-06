-- Fix shadowing_sentences: add DEFAULT for UUID generation
-- This is required because @GeneratedValue(strategy = GenerationType.UUID)
-- in Hibernate 6 needs a database-side DEFAULT on PostgreSQL.

ALTER TABLE shadowing_sentences
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE shadowing_sentences
ALTER COLUMN id DROP NOT NULL;
