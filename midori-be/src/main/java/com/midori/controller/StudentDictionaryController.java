package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.dictionary.DictionaryLookupRequest;
import com.midori.dto.dictionary.DictionaryLookupResponse;
import com.midori.dto.dictionary.SaveFlashcardRequest;
import com.midori.dto.dictionary.StudentDictionaryResponse;
import com.midori.dto.dictionary.StudentSentenceResponse;
import com.midori.service.StudentDictionaryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Student-facing dictionary API for transcript popup.
 * Provides comprehensive word lookup with grammar forms, context meaning, and audio.
 */
@Slf4j
@RestController
@RequestMapping("/api/student/dictionary")
@RequiredArgsConstructor
@Validated
public class StudentDictionaryController {

    private final StudentDictionaryService studentDictionaryService;

    /**
     * Comprehensive word lookup with grammar forms and context.
     * 
     * @param word Japanese word to look up
     * @param reading Optional kana reading
     * @param sentence Optional sentence context for contextual meaning
     * @param lessonId Optional lesson ID
     * @param surface Optional surface form
     * @return Full dictionary information
     */
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<DictionaryLookupResponse>> lookupWord(
            @RequestParam("word") @NotBlank @Size(max = 100) String word,
            @RequestParam(value = "reading", required = false) String reading,
            @RequestParam(value = "sentence", required = false) String sentence,
            @RequestParam(value = "lessonId", required = false) String lessonId,
            @RequestParam(value = "surface", required = false) String surface) {
        
        log.debug("[Dictionary] Lookup: word='{}', reading='{}', sentence='{}', lessonId='{}'",
                word, reading, sentence, lessonId);
        
        DictionaryLookupRequest request = DictionaryLookupRequest.builder()
                .word(word)
                .reading(reading)
                .sentence(sentence)
                .lessonId(lessonId)
                .surface(surface)
                .build();
        
        DictionaryLookupResponse response = studentDictionaryService.lookupWordFull(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Legacy word lookup for backward compatibility.
     * 
     * @param text Japanese word to look up
     * @param contextSentence Optional sentence context for better AI responses
     * @return Word dictionary information
     */
    @GetMapping("/word")
    public ResponseEntity<ApiResponse<StudentDictionaryResponse>> lookupWordLegacy(
            @RequestParam("text") @NotBlank @Size(max = 100) String text,
            @RequestParam(value = "context", required = false) String contextSentence) {
        
        log.debug("[StudentDict] Word lookup legacy: '{}', context: '{}'", text, contextSentence);
        
        StudentDictionaryResponse response = studentDictionaryService.lookupWord(text, contextSentence);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Analyze a Japanese sentence for grammar and vocabulary.
     * 
     * @param text Japanese sentence to analyze
     * @return Sentence analysis with translation and breakdown
     */
    @GetMapping("/sentence")
    public ResponseEntity<ApiResponse<StudentSentenceResponse>> analyzeSentence(
            @RequestParam("text") @NotBlank @Size(max = 500) String text) {
        
        log.debug("[StudentDict] Sentence analysis: '{}'", text);
        
        StudentSentenceResponse response = studentDictionaryService.analyzeSentence(text);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Save a word to user's flashcards.
     * 
     * @param request Flashcard save request
     * @return Saved flashcard info
     */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<DictionaryLookupResponse>> saveToFlashcard(
            @RequestBody @Valid SaveFlashcardRequest request) {
        
        log.debug("[Dictionary] Save to flashcard: word='{}'", request.getWord());
        
        DictionaryLookupResponse response = studentDictionaryService.saveToFlashcard(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Check if a word is saved by current user.
     * 
     * @param word Japanese word
     * @param lessonId Optional lesson/video ID
     * @return Whether the word is saved
     */
    @GetMapping("/saved")
    public ResponseEntity<ApiResponse<Boolean>> isWordSaved(
            @RequestParam("word") @NotBlank String word,
            @RequestParam(value = "lessonId", required = false) String lessonId) {
        
        boolean saved = studentDictionaryService.isWordSaved(word, lessonId);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    /**
     * Get list of saved words for current user.
     * 
     * @param lessonId Optional lesson/video ID
     * @return List of saved words
     */
    @GetMapping("/saved/list")
    public ResponseEntity<ApiResponse<java.util.List<com.midori.entity.StudentSavedWord>>> getSavedWords(
            @RequestParam(value = "lessonId", required = false) String lessonId) {
        
        java.util.List<com.midori.entity.StudentSavedWord> list = studentDictionaryService.getSavedWords(lessonId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Unsave a word.
     * 
     * @param word Japanese word to unsave
     * @param lessonId Optional lesson/video ID
     * @return Success message
     */
    @DeleteMapping("/unsave")
    public ResponseEntity<ApiResponse<Void>> unsaveWord(
            @RequestParam("word") @NotBlank String word,
            @RequestParam(value = "lessonId", required = false) String lessonId) {
        
        studentDictionaryService.unsaveWord(word, lessonId);
        return ResponseEntity.ok(ApiResponse.success("Word unsaved successfully", null));
    }
}
