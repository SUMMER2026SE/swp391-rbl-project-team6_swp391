package com.midori.service;

import com.midori.dto.kanji.KanjiResponse;

public interface KanjiService {
    KanjiResponse getKanjiInfo(String character);
}
