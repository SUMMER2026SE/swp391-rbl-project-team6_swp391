package com.midori.service;

import com.midori.dto.dictionary.DictionaryDetailResponse;

public interface DictionaryDetailService {
    DictionaryDetailResponse getDetail(String word);
}
