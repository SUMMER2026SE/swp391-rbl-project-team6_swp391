package com.midori.service;

import com.midori.dto.dictionary.DictionaryAutocompleteResponse;
import com.midori.dto.dictionary.DictionaryEntryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DictionarySearchService {
    Page<DictionaryEntryResponse> search(String query, Pageable pageable);
    List<DictionaryAutocompleteResponse> autocomplete(String query);
}
