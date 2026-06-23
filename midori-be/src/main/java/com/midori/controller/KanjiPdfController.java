package com.midori.controller;

import com.midori.dto.kanji.KanjiDTO;
import com.midori.service.KanjiPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kanji")
@RequiredArgsConstructor
public class KanjiPdfController {

    private final KanjiPdfService kanjiPdfService;

    @PostMapping("/pdf")
    public ResponseEntity<byte[]> generateWorksheet(@RequestBody List<KanjiDTO> kanjiList) {
        try {
            byte[] pdfBytes = kanjiPdfService.generateWorksheetPdf(kanjiList);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "kanji-worksheet.pdf");
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
