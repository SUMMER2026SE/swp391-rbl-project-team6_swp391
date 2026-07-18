package com.midori.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.FileInputStream;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

class PdfTextExtractorTest {

    private final PdfTextExtractor extractor = new PdfTextExtractor();

    @Test
    void extractsReadableTextFromSamplePdf() throws Exception {
        String path = "src/test/resources/midori_ai_pdf_existing_questions_test.pdf";
        java.io.File f = new java.io.File(path);
        // If the file isn't there (developer hasn't generated it), skip — the
        // AiExistingQuestionParserTest is the principal contract test for this fix.
        org.junit.jupiter.api.Assumptions.assumeTrue(f.exists(), "PDF fixture missing: " + path);

        try (FileInputStream fis = new FileInputStream(f)) {
            MockMultipartFile mm = new MockMultipartFile(
                    "file", "midori_ai_pdf_existing_questions_test.pdf",
                    "application/pdf", fis);

            PdfTextExtractor.ExtractionResult r = extractor.extract(mm);

            assertNotNull(r.fullText());
            assertFalse(r.fullText().trim().isEmpty(), "Extracted text must not be blank");
            assertTrue(r.fullText().contains("happy"), "Expected question 'happy' to be in extracted text");
            assertTrue(r.fullText().contains("Correct answer"), "Expected 'Correct answer' markers in extracted text");
            assertFalse(r.likelyScanned(), "Sample PDF is text-based, not scanned");
        }
    }
}
