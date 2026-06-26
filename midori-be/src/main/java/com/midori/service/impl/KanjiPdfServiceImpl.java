package com.midori.service.impl;

import com.midori.dto.kanji.KanjiDTO;
import com.midori.service.KanjiPdfService;
import com.lowagie.text.pdf.BaseFont;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.List;

@Service
public class KanjiPdfServiceImpl implements KanjiPdfService {

    private final TemplateEngine templateEngine;

    public KanjiPdfServiceImpl(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    @Override
    public byte[] generateWorksheetPdf(List<KanjiDTO> kanjiList) throws Exception {
        Context context = new Context();
        context.setVariable("kanjiList", kanjiList);

        String htmlContent = templateEngine.process("kanji-worksheet", context);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            
            // Register a Unicode font to support Vietnamese accents and Japanese Kanji characters in PDF
            File fontFile = new File("C:/Windows/Fonts/arial.ttf");
            if (fontFile.exists()) {
                renderer.getFontResolver().addFont(fontFile.getAbsolutePath(), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            }
            File gothicFile = new File("C:/Windows/Fonts/msgothic.ttc");
            if (gothicFile.exists()) {
                renderer.getFontResolver().addFont(gothicFile.getAbsolutePath() + ",0", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            }
            
            renderer.setDocumentFromString(htmlContent);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        }
    }
}
