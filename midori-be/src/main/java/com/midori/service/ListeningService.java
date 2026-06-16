package com.midori.service;

import com.midori.dto.listening.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ListeningService {

    ListeningDetailResponse createListening(CreateListeningRequest request, UUID teacherId);

    List<ListeningResponse> getAllListenings(String level, String status, UUID teacherId);

    ListeningDetailResponse getListeningById(UUID id);

    ListeningDetailResponse updateListening(UUID id, UpdateListeningRequest request, UUID currentUserId);

    void deleteListening(UUID id, UUID currentUserId);

    List<ListeningResponse> getListeningListForStudent(String level);

    ListeningDetailResponse getListeningDetailForStudent(UUID id);
}
