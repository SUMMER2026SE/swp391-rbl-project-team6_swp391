package com.midori.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PdfTextExtractor {

    private static final int MAX_PAGES_FOR_OCR = 5;

    public record ExtractionResult(
            String fullText,
            List<String> pageTexts,
            boolean likelyScanned,
            int pageCount
    ) {}

    public ExtractionResult extract(MultipartFile file) throws IOException {
        validateFile(file);

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            int pageCount = document.getNumberOfPages();
            log.info("PDF loaded: {} pages, size={}", pageCount, file.getSize());

            List<String> pageTexts = new ArrayList<>();
            StringBuilder fullText = new StringBuilder();
            boolean likelyScanned = false;

            for (int i = 0; i < pageCount; i++) {
                PDPage page = document.getPage(i);
                String pageText = extractPageText(document, i);

                if (pageText == null || pageText.trim().isEmpty()) {
                    pageText = "[SCANNED_PAGE_" + i + "]";
                    likelyScanned = true;
                } else {
                    pageText = pageText.trim();
                }

                pageTexts.add(pageText);
                if (!pageText.startsWith("[SCANNED_PAGE")) {
                    fullText.append(pageText).append("\n");
                }
            }

            String rawText = fullText.toString();
            boolean textBasedScan = isLikelyScanned(rawText, pageCount);

            log.info("Extraction complete: {} chars, {} pages, scanned={}",
                    rawText.length(), pageCount, likelyScanned || textBasedScan);

            return new ExtractionResult(
                    rawText,
                    pageTexts,
                    likelyScanned || textBasedScan,
                    pageCount
            );
        }
    }

    public String extractTextFromPage(MultipartFile file, int pageIndex) throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            return extractPageText(document, pageIndex);
        }
    }

    public byte[] renderPageToImage(MultipartFile file, int pageIndex, float dpi)
            throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage image = renderer.renderImageWithDPI(pageIndex, dpi);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();
        }
    }

    private String extractPageText(PDDocument document, int pageIndex) throws IOException {
        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setStartPage(pageIndex + 1);
        stripper.setEndPage(pageIndex + 1);
        return stripper.getText(document);
    }

    private boolean isLikelyScanned(String text, int pageCount) {
        if (pageCount == 0) return true;

        double charsPerPage = (double) text.length() / pageCount;

        if (charsPerPage < 100) {
            log.warn("Very low text density: {} chars/page — likely scanned", charsPerPage);
            return true;
        }

        String lowerText = text.toLowerCase();
        int questionIndicators = 0;
        String[] markers = {
                "question", "answer", "option", "true", "false",
                "a)", "b)", "c)", "d)", "1.", "2.", "3.", "4.",
                "(a)", "(b)", "(c)", "(d)"
        };
        for (String marker : markers) {
            questionIndicators += countOccurrences(lowerText, marker);
        }

        if (questionIndicators < 2 && pageCount > 2) {
            log.warn("Low question density: {} markers found across {} pages — likely scanned",
                    questionIndicators, pageCount);
            return true;
        }

        return false;
    }

    private int countOccurrences(String text, String substring) {
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(substring, idx)) != -1) {
            count++;
            idx += substring.length();
        }
        return count;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("PDF file is empty");
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.contains("pdf")
                && !file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("File is not a PDF: " + file.getOriginalFilename());
        }
        long maxSize = 50 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("PDF file exceeds maximum size of 50MB");
        }
        byte[] header = new byte[4];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(header);
            if (read < 4) {
                throw new IllegalArgumentException("PDF file is corrupted or too small");
            }
            if (header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) {
                throw new IllegalArgumentException("File does not have PDF magic bytes: " + file.getOriginalFilename());
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Cannot read PDF file: " + e.getMessage());
        }
    }
}
