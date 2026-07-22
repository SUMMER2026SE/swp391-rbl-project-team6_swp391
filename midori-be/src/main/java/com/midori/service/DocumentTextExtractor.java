package com.midori.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for extracting text from various document formats (PDF, DOCX, TXT).
 * Used by the AI Content Library generation workflow to process reference documents.
 * 
 * NOTE: This service is used ONLY during AI generation for text extraction.
 * No documents are persisted to the database.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentTextExtractor {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Pattern PDF_MAGIC = Pattern.compile("^%PDF-");
    private static final Pattern DOCX_MAGIC = Pattern.compile("^PK\\x03\\x04"); // ZIP-based format

    public record ExtractionResult(
            String fullText,
            String fileName,
            String fileType,
            int pageCount
    ) {}

    /**
     * Extract text from a document file (PDF, DOCX, or TXT).
     * 
     * @param file the multipart file to extract text from
     * @return ExtractionResult containing the extracted text and metadata
     * @throws IllegalArgumentException if the file is invalid or unsupported
     */
    public ExtractionResult extract(MultipartFile file) {
        validateFile(file);
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "document";
        }
        
        String lowerName = originalFilename.toLowerCase();
        
        try {
            if (lowerName.endsWith(".pdf")) {
                return extractFromPdf(file, originalFilename);
            } else if (lowerName.endsWith(".docx")) {
                return extractFromDocx(file, originalFilename);
            } else if (lowerName.endsWith(".txt")) {
                return extractFromTxt(file, originalFilename);
            } else {
                throw new IllegalArgumentException(
                    "Unsupported file type: " + getExtension(originalFilename) + 
                    ". Supported types: PDF, DOCX, TXT");
            }
        } catch (IOException e) {
            log.error("Failed to extract text from file {}: {}", originalFilename, e.getMessage());
            throw new IllegalArgumentException("Failed to read file: " + e.getMessage(), e);
        }
    }

    /**
     * Validates the uploaded file.
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("File name is missing");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                "File size exceeds maximum allowed size of " + (MAX_FILE_SIZE / 1024 / 1024) + "MB");
        }
        
        String lowerName = filename.toLowerCase();
        if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx") && !lowerName.endsWith(".txt")) {
            throw new IllegalArgumentException(
                "Invalid file type. Only PDF, DOCX, and TXT files are supported");
        }
    }

    /**
     * Extract text from a PDF file using Apache PDFBox.
     */
    private ExtractionResult extractFromPdf(MultipartFile file, String filename) throws IOException {
        log.info("Extracting text from PDF: {}", filename);
        
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            int pageCount = document.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();
            
            StringBuilder fullText = new StringBuilder();
            
            for (int i = 1; i <= pageCount; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String pageText = stripper.getText(document);
                
                if (pageText != null && !pageText.trim().isEmpty()) {
                    fullText.append(pageText.trim()).append("\n\n");
                }
            }
            
            String text = fullText.toString().trim();
            log.info("PDF extraction complete: {} chars from {} pages", text.length(), pageCount);
            
            return new ExtractionResult(text, filename, "PDF", pageCount);
        }
    }

    /**
     * Extract text from a DOCX file by reading the underlying XML.
     * DOCX files are ZIP archives containing document.xml with the content.
     */
    private ExtractionResult extractFromDocx(MultipartFile file, String filename) throws IOException {
        log.info("Extracting text from DOCX: {}", filename);
        
        try (var zipStream = file.getInputStream()) {
            var zip = new java.util.zip.ZipInputStream(zipStream);
            StringBuilder fullText = new StringBuilder();
            java.util.zip.ZipEntry entry;
            boolean foundDocumentXml = false;
            
            while ((entry = zip.getNextEntry()) != null) {
                if ("word/document.xml".equals(entry.getName())) {
                    foundDocumentXml = true;
                    String xmlContent = new String(zip.readAllBytes(), StandardCharsets.UTF_8);
                    fullText.append(extractTextFromDocxXml(xmlContent));
                    zip.closeEntry();
                    break;
                }
                zip.closeEntry();
            }
            
            if (!foundDocumentXml) {
                log.warn("DOCX file does not contain word/document.xml: {}", filename);
                return new ExtractionResult("", filename, "DOCX", 0);
            }
            
            String text = fullText.toString().trim();
            log.info("DOCX extraction complete: {} chars", text.length());
            
            return new ExtractionResult(text, filename, "DOCX", 1);
        }
    }

    /**
     * Extract plain text from DOCX XML content.
     * Parses the w:t elements which contain the actual text.
     */
    private String extractTextFromDocxXml(String xmlContent) {
        StringBuilder text = new StringBuilder();
        
        // Pattern to match <w:t> elements with their content
        Pattern wtp = Pattern.compile("<w:t[^>]*>([^<]*)</w:t>");
        Matcher m = wtp.matcher(xmlContent);
        
        while (m.find()) {
            String content = m.group(1);
            if (content != null && !content.isBlank()) {
                text.append(content);
            }
        }
        
        // Also extract text from other elements
        Pattern otherText = Pattern.compile("<w:p[^>]*>|</w:p>|<w:br[^/]*/>");
        String normalized = otherText.matcher(text.toString()).replaceAll("\n");
        
        // Clean up extra whitespace
        normalized = normalized.replaceAll("\\s+", " ").trim();
        
        return normalized;
    }

    /**
     * Extract text from a plain TXT file.
     */
    private ExtractionResult extractFromTxt(MultipartFile file, String filename) throws IOException {
        log.info("Extracting text from TXT: {}", filename);
        
        StringBuilder fullText = new StringBuilder();
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                fullText.append(line).append("\n");
            }
        }
        
        String text = fullText.toString().trim();
        log.info("TXT extraction complete: {} chars", text.length());
        
        // Count lines as a rough "page" equivalent
        int lineCount = text.split("\n").length;
        
        return new ExtractionResult(text, filename, "TXT", Math.max(1, lineCount / 50));
    }

    /**
     * Get file extension from filename.
     */
    private String getExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0) {
            return filename.substring(lastDot);
        }
        return "";
    }
}
