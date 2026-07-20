package com.midori.service;

import com.midori.dto.tokenizer.JapaneseTokenResponse;

import java.util.List;

public interface JapaneseTokenizerService {
    List<JapaneseTokenResponse> tokenize(String sentence);
}
