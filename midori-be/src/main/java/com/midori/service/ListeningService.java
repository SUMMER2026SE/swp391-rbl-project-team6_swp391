package com.midori.service;

import com.midori.dto.listening.*;

import java.util.List;
import java.util.UUID;

public interface ListeningService {

    ListeningDetailResponse createListening(CreateListeningRequest request, UUID teacherId);

    List<ListeningResponse> getAllListenings(UUID levelId, String status);

    ListeningDetailResponse getListeningById(UUID id);

    ListeningDetailResponse updateListening(UUID id, UpdateListeningRequest request, UUID currentUserId);

    void deleteListening(UUID id, UUID currentUserId);

    List<ListeningResponse> getListeningListForStudent(UUID levelId);

    ListeningDetailResponse getListeningDetailForStudent(UUID id);
}
