-- Add mnemonic column to kanji_entries for memory tips/tricks
ALTER TABLE kanji_entries
    ADD COLUMN IF NOT EXISTS mnemonic TEXT;
