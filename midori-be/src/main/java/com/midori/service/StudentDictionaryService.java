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
     * Check if a word is saved by the current user in a specific lesson.
     * 
     * @param word Japanese word
     * @param lessonId Optional lesson/video ID
     * @return true if saved, false otherwise
     */
    boolean isWordSaved(String word, String lessonId);

    /**
     * Check if a word is saved by the current user.
     * 
     * @param word Japanese word
     * @return true if saved, false otherwise
     */
    boolean isWordSaved(String word);

    /**
     * Get all saved words for the current user, optionally filtered by lesson ID.
     * 
     * @param lessonId Optional lesson/video ID
     * @return List of saved words
     */
    java.util.List<com.midori.entity.StudentSavedWord> getSavedWords(String lessonId);

    /**
     * Unsave/delete a saved word.
     * 
     * @param word Japanese word to unsave
     * @param lessonId Optional lesson/video ID
     */
    void unsaveWord(String word, String lessonId);
}
