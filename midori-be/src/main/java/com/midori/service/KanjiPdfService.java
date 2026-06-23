package com.midori.service;

import com.midori.dto.kanji.KanjiDTO;
import java.util.List;

public interface KanjiPdfService {
    byte[] generateWorksheetPdf(List<KanjiDTO> kanjiList) throws Exception;
}
