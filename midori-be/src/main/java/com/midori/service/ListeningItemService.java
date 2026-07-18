package com.midori.service;

import com.midori.dto.listening.ListeningItemRequest;
import com.midori.dto.listening.ListeningItemResponse;

import java.util.List;
import java.util.UUID;

public interface ListeningItemService {

    ListeningItemResponse createItem(UUID listeningLessonId, ListeningItemRequest request);

    ListeningItemResponse updateItem(UUID itemId, ListeningItemRequest request);

    void deleteItem(UUID itemId);

    ListeningItemResponse getItem(UUID itemId);

    List<ListeningItemResponse> getItemsByListeningLesson(UUID listeningLessonId);

    void deleteItemsByListeningLesson(UUID listeningLessonId);
}