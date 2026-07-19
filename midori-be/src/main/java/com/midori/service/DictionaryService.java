package com.midori.service;

import com.midori.dto.dictionary.DictionaryEntryResponse;

import java.util.List;
import java.util.UUID;

public interface DictionaryService {
    DictionaryEntryResponse getEntryById(UUID id);
    List<DictionaryEntryResponse> searchEntries(String query);
}
