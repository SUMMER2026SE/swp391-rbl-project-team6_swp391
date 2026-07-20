package com.midori.service;

import com.midori.dto.dictionary.DictionaryHoverResponse;

public interface DictionaryHoverService {
    DictionaryHoverResponse getHoverInfo(String word);
}
