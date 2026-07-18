package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.listening.ListeningDetailResponse;
import com.midori.dto.listening.ListeningItemRequest;
import com.midori.dto.listening.ListeningItemResponse;
import com.midori.dto.listening.ListeningLessonResponse;
import com.midori.dto.listening.ListeningLessonWithItemsRequest;
import com.midori.service.ListeningItemService;
import com.midori.service.ListeningLessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/listening")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ListeningAdminController {

    private final ListeningLessonService listeningLessonService;
    private final ListeningItemService listeningItemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ListeningLessonResponse>>> getAllLessons(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Boolean isActive) {
        List<ListeningLessonResponse> lessons;

        if (level != null && !level.isBlank()) {
            lessons = listeningLessonService.getListeningLessonsByLevel(level);
        } else {
            lessons = listeningLessonService.getAllListeningLessons();
        }

        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> getLessonDetail(@PathVariable UUID id) {
        ListeningDetailResponse detail = listeningLessonService.getListeningLessonDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> createLesson(
            @Valid @RequestBody ListeningLessonWithItemsRequest request) {
        ListeningDetailResponse lesson = listeningLessonService.createListeningLessonWithItems(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Listening lesson created successfully", lesson));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> updateLesson(
            @PathVariable UUID id,
            @Valid @RequestBody ListeningLessonWithItemsRequest request) {
        ListeningDetailResponse lesson = listeningLessonService.updateListeningLessonWithItems(id, request);
        return ResponseEntity.ok(ApiResponse.success("Listening lesson updated successfully", lesson));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable UUID id) {
        listeningLessonService.deleteListeningLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Listening lesson deleted successfully", null));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<ListeningLessonResponse>> publishLesson(@PathVariable UUID id) {
        ListeningLessonResponse lesson = listeningLessonService.publishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Listening lesson published successfully", lesson));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<ListeningLessonResponse>> unpublishLesson(@PathVariable UUID id) {
        ListeningLessonResponse lesson = listeningLessonService.unpublishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Listening lesson unpublished successfully", lesson));
    }

    // ─── Listening Item CRUD ───────────────────────────────────────────────

    @GetMapping("/{id}/items")
    public ResponseEntity<ApiResponse<List<ListeningItemResponse>>> getItems(@PathVariable UUID id) {
        List<ListeningItemResponse> items = listeningItemService.getItemsByListeningLesson(id);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ApiResponse<ListeningItemResponse>> createItem(
            @PathVariable UUID id,
            @Valid @RequestBody ListeningItemRequest request) {
        ListeningItemResponse created = listeningItemService.createItem(id, request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Listening item created successfully", created));
    }

    @PutMapping("/{id}/items/{itemId}")
    public ResponseEntity<ApiResponse<ListeningItemResponse>> updateItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId,
            @Valid @RequestBody ListeningItemRequest request) {
        ListeningItemResponse updated = listeningItemService.updateItem(itemId, request);
        return ResponseEntity.ok(ApiResponse.success("Listening item updated successfully", updated));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId) {
        listeningItemService.deleteItem(itemId);
        return ResponseEntity.ok(ApiResponse.success("Listening item deleted successfully", null));
    }
}