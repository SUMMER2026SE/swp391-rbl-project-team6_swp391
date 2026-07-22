package com.midori.service;

import com.midori.dto.dictionary.DictionaryLookupRequest;
import com.midori.dto.dictionary.DictionaryLookupResponse;
import com.midori.dto.dictionary.SaveFlashcardRequest;
import com.midori.dto.dictionary.StudentDictionaryResponse;
import com.midori.dto.dictionary.StudentSentenceResponse;

/**
 * Service for student-facing dictionary lookups with AI fallback.
 */
public interface StudentDictionaryService {
    
    /**
     * Look up a single word for student popup with full information.
     * Priority: Database → AI fallback
     * 
     * @param request Lookup request with word, reading, and context
     * @return Full dictionary response with grammar forms, context meaning, audio
     */
    DictionaryLookupResponse lookupWordFull(DictionaryLookupRequest request);
    
    /**
     * Look up a single word for student popup (legacy method).
     * Priority: Database → AI fallback
     * 
     * @param word Japanese word to look up
     * @param contextSentence Optional sentence context for better AI responses
     * @return Dictionary response with word info
     */
    StudentDictionaryResponse lookupWord(String word, String contextSentence);
    
    /**
     * Analyze a sentence for grammar and vocabulary breakdown.
     * 
     * @param sentence Japanese sentence
     * @return Sentence analysis with translation and breakdown
     */
    StudentSentenceResponse analyzeSentence(String sentence);
    
    /**
     * Save a word to user's flashcards.
     * 
     * @param request Save request with word details
     * @return Dictionary lookup response with save status
     */
    DictionaryLookupResponse saveToFlashcard(SaveFlashcardRequest request);
    
    /**
     * Check if a word is saved by the current user.
     * 
     * @param word Japanese word
     * @return true if saved, false otherwise
     */
    boolean isWordSaved(String word);

    /**
     * Get saved words for the current student with optional filters.
     */
    java.util.List<com.midori.dto.dictionary.SavedWordResponse> getSavedWords(
            String sourceVideoId, String status, Boolean difficult, String sort);

    /**
     * Update spaced repetition learning progress for a saved word.
     */
    com.midori.dto.dictionary.SavedWordResponse updateProgress(
            java.util.UUID savedWordId, com.midori.dto.dictionary.SavedWordProgressRequest request);

    /**
     * Unsave a word for the current student.
     */
    void unsaveWord(String word);
}
