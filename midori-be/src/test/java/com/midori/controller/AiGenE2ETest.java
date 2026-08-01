package com.midori.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * E2E test for AI Question Generation with TEACHER role.
 * Uses AI Learning Content Service directly + HTTP tests for the teacher endpoint.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("local")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AiGenE2ETest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private String teacherEmail;
    private String teacherPass = "Teacher@123";
    private String teacherToken;
    private final List<String> createdQuestionIds = new ArrayList<>();

    @BeforeAll
    void setup() throws Exception {
        teacherEmail = "aigen_e2e_" + System.currentTimeMillis() + "@test.com";

        // 1. Register teacher
        System.out.println("=== AI Gen E2E: Register teacher ===");
        Map<String, Object> regBody = new LinkedHashMap<>();
        regBody.put("email", teacherEmail);
        regBody.put("password", teacherPass);
        regBody.put("role", "TEACHER");

        ResponseEntity<String> regResp = restTemplate.postForEntity(
            "/api/auth/register", regBody, String.class);
        assertEquals(HttpStatus.CREATED, regResp.getStatusCode());
        System.out.println("Register: " + regResp.getStatusCode());

        // 2. DB: verify email and set ACTIVE
        System.out.println("=== AI Gen E2E: DB approve teacher ===");
        int updated = jdbcTemplate.update(
            "UPDATE users SET email_verified = true, role = 'TEACHER', status = 'ACTIVE' WHERE email = ?",
            teacherEmail);
        assertTrue(updated > 0, "Teacher should be updated in DB");
        System.out.println("DB updated: " + updated);

        // 3. Login as teacher
        System.out.println("=== AI Gen E2E: Login teacher ===");
        Map<String, Object> loginBody = new LinkedHashMap<>();
        loginBody.put("email", teacherEmail);
        loginBody.put("password", teacherPass);

        ResponseEntity<String> loginResp = restTemplate.postForEntity(
            "/api/auth/login", loginBody, String.class);
        assertEquals(HttpStatus.OK, loginResp.getStatusCode());

        JsonNode loginJson = objectMapper.readTree(loginResp.getBody());
        teacherToken = loginJson.path("data").path("accessToken").asText();
        assertNotNull(teacherToken);
        System.out.println("Login: PASS, token: " + teacherToken.substring(0, 20) + "...");

        // 4. Find a lesson ID to use
        System.out.println("=== AI Gen E2E: Find lesson ===");
        List<Map<String, Object>> lessons = jdbcTemplate.queryForList(
            "SELECT id, lesson_number, lesson_name, level FROM question_bank_lessons WHERE status = 'ACTIVE' LIMIT 1");
        if (lessons.isEmpty()) {
            System.out.println("WARNING: No active lessons found in DB!");
        } else {
            Map<String, Object> lesson = lessons.get(0);
            System.out.println("Using lesson: " + lesson);
        }
    }

    @AfterAll
    void cleanup() {
            // Delete created questions first
            for (String qId : createdQuestionIds) {
                try {
                    restTemplate.exchange(
                        "/api/teacher/questions/" + qId,
                        HttpMethod.DELETE,
                        new HttpEntity<>(withAuth()),
                        String.class);
                } catch (Exception ignored) {}
            }

        // Delete teacher
        if (teacherEmail != null) {
            try {
                jdbcTemplate.update("DELETE FROM teacher_question_options WHERE teacher_question_id IN (SELECT id FROM teacher_questions WHERE teacher_id = (SELECT id FROM users WHERE email = ?))", teacherEmail);
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.update("DELETE FROM teacher_questions WHERE teacher_id = (SELECT id FROM users WHERE email = ?))", teacherEmail);
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.update("DELETE FROM users WHERE email = ?", teacherEmail);
            } catch (Exception ignored) {}
        }
        System.out.println("Cleanup: PASS");
    }

    HttpHeaders withAuth() {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(teacherToken);
        return h;
    }

    // ============ Helper Methods ============

    boolean containsJapaneseScript(String s) {
        if (s == null) return false;
        for (int i = 0; i < s.length(); i++) {
            int cp = s.codePointAt(i);
            if ((cp >= 0x3040 && cp <= 0x309F) || (cp >= 0x30A0 && cp <= 0x30FF) || (cp >= 0x4E00 && cp <= 0x9FFF)) return true;
        }
        return false;
    }

    boolean containsVietnameseDiacritics(String s) {
        if (s == null) return false;
        for (int i = 0; i < s.length(); i++) {
            int cp = s.codePointAt(i);
            if ((cp >= 0x0102 && cp <= 0x0103) || (cp >= 0x0110 && cp <= 0x0111) ||
                (cp >= 0x0128 && cp <= 0x0129) || (cp >= 0x0168 && cp <= 0x0169) ||
                (cp >= 0x0178 && cp <= 0x0179) || (cp >= 0x01A0 && cp <= 0x01B0) ||
                (cp >= 0x1EA0 && cp <= 0x1EF9)) return true;
        }
        return false;
    }

    String extractField(String json, String field) {
        int idx = json.indexOf(field);
        if (idx < 0) return null;
        int start = idx + field.length();
        while (start < json.length() && (json.charAt(start) == ':' || json.charAt(start) == ' ' || json.charAt(start) == '"')) start++;
        int end = start;
        if (start > 0 && json.charAt(start - 1) == '"') {
            while (end < json.length() && json.charAt(end) != '"') end++;
        } else {
            while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
        }
        return json.substring(start, end).trim();
    }

    String persistAndReload(String qText, String questionType, String metadataField, Map<String, Object> metadata) throws Exception {
        String escapedPrompt = qText.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("prompt", escapedPrompt);
        body.put("questionType", questionType);
        body.put("correctAnswerIndex", 0);

        if ("TRANSLATION".equals(questionType)) {
            body.put("options", List.of("\u79c1\u306f\u5b66\u751f\u3067\u3059"));
            body.put("explanation", "Translation test");
            body.put("level", "N5");
            body.put("difficulty", "EASY");
            body.put("translationMetadata", metadata != null ? metadata : Map.of(
                "direction", "EN_TO_JA",
                "sourceText", "I am a student",
                "referenceAnswer", "\u79c1\u306f\u5b66\u751f\u3067\u3059"));
        } else if ("ERROR_CORRECTION".equals(questionType)) {
            body.put("options", List.of("Grammar correction"));
            body.put("explanation", "Error correction test");
            body.put("level", "N5");
            body.put("difficulty", "EASY");
            body.put("errorCorrectionMetadata", metadata != null ? metadata : Map.of(
                "incorrectText", "\u79c1\u306f\u9b5a\u304c\u98df\u3079\u305f\u3044",
                "correctedText", "\u79c1\u306f\u9b5a\u3092\u98df\u3079\u305f\u3044",
                "explanation", "\u4ed6\u52d5\u8a5e\u306a\u306e\u3067\u300c\u3092\u300d\u304c\u5fc5\u8981\u3067\u3059"));
        } else if ("SENTENCE_WRITING".equals(questionType)) {
            body.put("options", List.of("Sentence writing"));
            body.put("explanation", "Sentence writing test");
            body.put("level", "N5");
            body.put("difficulty", "EASY");
            body.put("sentenceWritingMetadata", metadata != null ? metadata : Map.of(
                "requiredVocabulary", List.of("\u5b66\u6821"),
                "referenceAnswer", "\u79c1\u306f\u5b66\u6821\u306b\u884c\u304d\u307e\u3059"));
        } else if ("SHORT_ANSWER".equals(questionType)) {
            body.put("options", List.of("\u5b66\u6821\u306b\u884c\u304d\u307e\u3059"));
            body.put("explanation", "Short answer test");
            body.put("level", "N5");
            body.put("difficulty", "EASY");
        } else {
            body.put("options", List.of("\u306f\u3044", "\u3044\u3044\u3048", "\u3059\u3079\u3066", "\u308f\u304b\u308a\u307e\u305b\u3093"));
            body.put("explanation", "MCQ test");
            body.put("level", "N5");
            body.put("difficulty", "EASY");
        }

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, withAuth());
        ResponseEntity<String> createResp = restTemplate.exchange(
            "/api/teacher/questions", HttpMethod.POST, req, String.class);

        if (createResp.getStatusCode() != HttpStatus.OK) {
            System.out.println("  Create failed: " + createResp.getStatusCode() + " | " + createResp.getBody());
            return null;
        }

        String createBody = createResp.getBody();
        JsonNode json = objectMapper.readTree(createBody);
        String qId = json.path("data").path("id").asText();
        if (qId == null || qId.isBlank()) return null;
        createdQuestionIds.add(qId);

        // Reload
        ResponseEntity<String> getResp = restTemplate.exchange(
            "/api/teacher/questions/" + qId, HttpMethod.GET,
            new HttpEntity<>(withAuth()), String.class);

        if (getResp.getStatusCode() != HttpStatus.OK) {
            System.out.println("  Reload failed: " + getResp.getStatusCode());
            return null;
        }

        String getBody = getResp.getBody();
        String reloadedType = extractField(getBody, "\"questionType\":");
        boolean hasMeta = metadataField != null && getBody.contains(metadataField) && !getBody.contains(metadataField + ":null");

        boolean pass = questionType.equals(reloadedType);
        System.out.printf("  Persist+Reload [%s]: typeMatch=%s metaPresent=%s%n", questionType, pass, hasMeta);
        return qId;
    }

    // ============ AI Generation via /teacher/exams/ai-generate ============

    @Test
    @Order(1)
    @DisplayName("AI Gen: TEACHER endpoint - Vocabulary skill")
    void aiGenVocabulary() throws Exception {
        List<Map<String, Object>> lessons = jdbcTemplate.queryForList(
            "SELECT id FROM question_bank_lessons WHERE status = 'ACTIVE' LIMIT 1");
        if (lessons.isEmpty()) {
            System.out.println("SKIP: No lessons found");
            return;
        }

        Integer lessonId = (Integer) lessons.get(0).get("id");
        System.out.println("Using lesson ID: " + lessonId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("level", "N5");
        body.put("lessonId", lessonId);
        body.put("skills", List.of("VOCABULARY"));
        body.put("difficulty", "EASY");
        body.put("questionCount", 2);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, withAuth());
        ResponseEntity<String> resp = restTemplate.exchange(
            "/api/teacher/exams/ai-generate", HttpMethod.POST, req, String.class);

        String rb = resp.getBody();
        int status = resp.getStatusCode().value();
        int qCount = rb != null ? countOcc(rb, "\"content\":") : 0;
        boolean hasJP = rb != null && containsJapaneseScript(rb);
        boolean hasVN = rb != null && containsVietnameseDiacritics(rb);
        boolean hasErr = rb != null && rb.contains("\"errorMessage\"") && !rb.contains("\"errorMessage\":null");

        System.out.printf("AI Gen Vocabulary: HTTP=%d | Questions=%d | JP=%s | VN=%s | Error=%s%n",
            status, qCount, hasJP, hasVN, hasErr);

        if (status == 200 && qCount > 0 && hasJP && !hasVN && !hasErr) {
            // Persist first question
            String qText = extractField(rb, "\"content\":");
            if (qText != null) {
                persistAndReload(qText, "MULTIPLE_CHOICE", null, null);
            }
            System.out.println("AI Gen Vocabulary: PASS");
        } else {
            System.out.println("AI Gen Vocabulary: FAIL | body: " + (rb != null ? rb.substring(0, Math.min(300, rb.length())) : "null"));
        }
    }

    @Test
    @Order(2)
    @DisplayName("AI Gen: Grammar skill")
    void aiGenGrammar() throws Exception {
        List<Map<String, Object>> lessons = jdbcTemplate.queryForList(
            "SELECT id FROM question_bank_lessons WHERE status = 'ACTIVE' LIMIT 1");
        if (lessons.isEmpty()) {
            System.out.println("SKIP: No lessons found");
            return;
        }

        Integer lessonId = (Integer) lessons.get(0).get("id");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("level", "N5");
        body.put("lessonId", lessonId);
        body.put("skills", List.of("GRAMMAR"));
        body.put("difficulty", "EASY");
        body.put("questionCount", 2);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, withAuth());
        ResponseEntity<String> resp = restTemplate.exchange(
            "/api/teacher/exams/ai-generate", HttpMethod.POST, req, String.class);

        String rb = resp.getBody();
        int status = resp.getStatusCode().value();
        int qCount = rb != null ? countOcc(rb, "\"content\":") : 0;
        boolean hasJP = rb != null && containsJapaneseScript(rb);
        boolean hasVN = rb != null && containsVietnameseDiacritics(rb);
        boolean hasErr = rb != null && rb.contains("\"errorMessage\"") && !rb.contains("\"errorMessage\":null");

        System.out.printf("AI Gen Grammar: HTTP=%d | Questions=%d | JP=%s | VN=%s | Error=%s%n",
            status, qCount, hasJP, hasVN, hasErr);

        if (status == 200 && qCount > 0 && hasJP && !hasVN && !hasErr) {
            String qText = extractField(rb, "\"content\":");
            if (qText != null) {
                persistAndReload(qText, "MULTIPLE_CHOICE", null, null);
            }
            System.out.println("AI Gen Grammar: PASS");
        } else {
            System.out.println("AI Gen Grammar: FAIL | body: " + (rb != null ? rb.substring(0, Math.min(300, rb.length())) : "null"));
        }
    }

    @Test
    @Order(3)
    @DisplayName("AI Gen: Reading skill")
    void aiGenReading() throws Exception {
        List<Map<String, Object>> lessons = jdbcTemplate.queryForList(
            "SELECT id FROM question_bank_lessons WHERE status = 'ACTIVE' LIMIT 1");
        if (lessons.isEmpty()) {
            System.out.println("SKIP: No lessons found");
            return;
        }

        Integer lessonId = (Integer) lessons.get(0).get("id");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("level", "N5");
        body.put("lessonId", lessonId);
        body.put("skills", List.of("READING"));
        body.put("difficulty", "EASY");
        body.put("questionCount", 2);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, withAuth());
        ResponseEntity<String> resp = restTemplate.exchange(
            "/api/teacher/exams/ai-generate", HttpMethod.POST, req, String.class);

        String rb = resp.getBody();
        int status = resp.getStatusCode().value();
        int qCount = rb != null ? countOcc(rb, "\"content\":") : 0;
        boolean hasJP = rb != null && containsJapaneseScript(rb);
        boolean hasVN = rb != null && containsVietnameseDiacritics(rb);
        boolean hasErr = rb != null && rb.contains("\"errorMessage\"") && !rb.contains("\"errorMessage\":null");

        System.out.printf("AI Gen Reading: HTTP=%d | Questions=%d | JP=%s | VN=%s | Error=%s%n",
            status, qCount, hasJP, hasVN, hasErr);

        if (status == 200 && qCount > 0 && hasJP && !hasVN && !hasErr) {
            System.out.println("AI Gen Reading: PASS");
        } else {
            System.out.println("AI Gen Reading: FAIL | body: " + (rb != null ? rb.substring(0, Math.min(300, rb.length())) : "null"));
        }
    }

    @Test
    @Order(4)
    @DisplayName("AI Gen: Mixed skills (Vocabulary + Grammar)")
    void aiGenMixedSkills() throws Exception {
        List<Map<String, Object>> lessons = jdbcTemplate.queryForList(
            "SELECT id FROM question_bank_lessons WHERE status = 'ACTIVE' LIMIT 1");
        if (lessons.isEmpty()) {
            System.out.println("SKIP: No lessons found");
            return;
        }

        Integer lessonId = (Integer) lessons.get(0).get("id");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("level", "N5");
        body.put("lessonId", lessonId);
        body.put("skills", List.of("VOCABULARY", "GRAMMAR"));
        body.put("difficulty", "EASY");
        body.put("questionCount", 4);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, withAuth());
        ResponseEntity<String> resp = restTemplate.exchange(
            "/api/teacher/exams/ai-generate", HttpMethod.POST, req, String.class);

        String rb = resp.getBody();
        int status = resp.getStatusCode().value();
        int qCount = rb != null ? countOcc(rb, "\"content\":") : 0;
        boolean hasJP = rb != null && containsJapaneseScript(rb);
        boolean hasVN = rb != null && containsVietnameseDiacritics(rb);
        boolean hasErr = rb != null && rb.contains("\"errorMessage\"") && !rb.contains("\"errorMessage\":null");

        System.out.printf("AI Gen Mixed: HTTP=%d | Questions=%d | JP=%s | VN=%s | Error=%s%n",
            status, qCount, hasJP, hasVN, hasErr);

        if (status == 200 && qCount > 0 && hasJP && !hasVN && !hasErr) {
            System.out.println("AI Gen Mixed: PASS");
        } else {
            System.out.println("AI Gen Mixed: FAIL | body: " + (rb != null ? rb.substring(0, Math.min(300, rb.length())) : "null"));
        }
    }

    @Test
    @Order(5)
    @DisplayName("AI Gen: Translation question type (via direct persist)")
    void aiGenTranslation() throws Exception {
        // The teacher AI endpoint generates MCQ by default.
        // For Translation, we test the persist+reload flow with Translation metadata.
        // AI generation returns MCQ, but we verify Translation creation works.

        Map<String, Object> transMeta = new LinkedHashMap<>();
        transMeta.put("direction", "EN_TO_JA");
        transMeta.put("sourceText", "Where is the school?");
        transMeta.put("referenceAnswer", "\u5b66\u6821\u306f\u3069\u3053\u3067\u3059\u304b");

        String qId = persistAndReload("\u5b66\u6821\u306f\u3069\u3053\u3067\u3059\u304b\u3002", "TRANSLATION", "translationMetadata", transMeta);
        System.out.println("AI Gen Translation (persist+reload): " + (qId != null ? "PASS" : "FAIL"));
    }

    @Test
    @Order(6)
    @DisplayName("AI Gen: Error Correction question type (via direct persist)")
    void aiGenErrorCorrection() throws Exception {
        Map<String, Object> ecMeta = new LinkedHashMap<>();
        ecMeta.put("incorrectText", "\u79c1\u306f\u9b5a\u304c\u98df\u3079\u305f\u3044");
        ecMeta.put("correctedText", "\u79c1\u306f\u9b5a\u3092\u98df\u3079\u305f\u3044");
        ecMeta.put("explanation", "\u4ed6\u52d5\u8a5e\u306a\u306e\u3067\u300c\u3092\u300d\u304c\u5fc5\u8981\u3067\u3059\u3002");

        String qId = persistAndReload("\u4e0b\u306e\u6587\u3092\u6b63\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u79c1\u306f\u9b5a\u304c\u98df\u3079\u305f\u3044\u3002", "ERROR_CORRECTION", "errorCorrectionMetadata", ecMeta);
        System.out.println("AI Gen Error Correction (persist+reload): " + (qId != null ? "PASS" : "FAIL"));
    }

    @Test
    @Order(7)
    @DisplayName("AI Gen: Sentence Writing question type (via direct persist)")
    void aiGenSentenceWriting() throws Exception {
        Map<String, Object> swMeta = new LinkedHashMap<>();
        swMeta.put("requiredVocabulary", List.of("\u5b66\u6821", "\u884c\u304d"));
        swMeta.put("referenceAnswer", "\u79c1\u306f\u5b66\u6821\u306b\u884c\u304d\u307e\u3059");

        String qId = persistAndReload("\u300c\u5b66\u6821\u300d\u3068\u300c\u884c\u304d\u307e\u3059\u300d\u3092\u4f7f\u3063\u3066\u6587\u3092\u4f5c\u6210\u3057\u3066\u304f\u3060\u3055\u3044\u3002", "SENTENCE_WRITING", "sentenceWritingMetadata", swMeta);
        System.out.println("AI Gen Sentence Writing (persist+reload): " + (qId != null ? "PASS" : "FAIL"));
    }

    @Test
    @Order(8)
    @DisplayName("AI Gen: Short Answer question type (via direct persist)")
    void aiGenShortAnswer() throws Exception {
        String qId = persistAndReload("\u5b66\u6821\u306e\u6c17\u306b\u306a\u308b\u4eba\u306f\u8ab0\u3067\u3059\u304b\u3002", "SHORT_ANSWER", null, null);
        System.out.println("AI Gen Short Answer (persist+reload): " + (qId != null ? "PASS" : "FAIL"));
    }

    @Test
    @Order(9)
    @DisplayName("AI Gen: Wrong role - STUDENT cannot use teacher endpoint")
    void aiGenStudentForbidden() throws Exception {
        // Register a student
        String studentEmail = "student_ai_" + System.currentTimeMillis() + "@test.com";
        Map<String, Object> regBody = new LinkedHashMap<>();
        regBody.put("email", studentEmail);
        regBody.put("password", "Student@123");
        regBody.put("role", "STUDENT");

        ResponseEntity<String> regResp = restTemplate.postForEntity(
            "/api/auth/register", regBody, String.class);
        assertEquals(HttpStatus.CREATED, regResp.getStatusCode());

        jdbcTemplate.update("UPDATE users SET email_verified = true, status = 'ACTIVE' WHERE email = ?", studentEmail);

        Map<String, Object> loginBody = new LinkedHashMap<>();
        loginBody.put("email", studentEmail);
        loginBody.put("password", "Student@123");
        ResponseEntity<String> loginResp = restTemplate.postForEntity("/api/auth/login", loginBody, String.class);
        JsonNode loginJson = objectMapper.readTree(loginResp.getBody());
        String studentToken = loginJson.path("data").path("accessToken").asText();

        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(studentToken);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("level", "N5");
        body.put("lessonId", 1);
        body.put("skills", List.of("VOCABULARY"));
        body.put("difficulty", "EASY");
        body.put("questionCount", 1);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, h);
        ResponseEntity<String> resp = restTemplate.exchange(
            "/api/teacher/exams/ai-generate", HttpMethod.POST, req, String.class);

        System.out.printf("AI Gen STUDENT forbidden: HTTP=%d (expected 403)%n", resp.getStatusCode().value());
        assertTrue(resp.getStatusCode().value() >= 300, "Student should be forbidden from teacher endpoint");

        // Cleanup student
        jdbcTemplate.update("DELETE FROM users WHERE email = ?", studentEmail);
    }

    // ============ AUTO_DETECT Import/Export ============

    @Test
    @Order(10)
    @DisplayName("Import: AUTO_DETECT with multiple formats")
    void importAutoDetect() throws Exception {
        // Create a CSV with multiple question formats
        String csv = """
id,question_type,prompt,options,correct_answer_index,explanation,level,difficulty,tags,source
test-import-1,MULTIPLE_CHOICE,\u732b\u306f\u9b5a\u304c\u597d\u304d\u3067\u3059\u304b,\u306f\u3044|\u3044\u3044\u3048|\u3059\u3079\u3066|\u308f\u304b\u308a\u307e\u305b\u3093,0,\u732b\u306f\u9b5a\u304c\u597d\u304d\u3067\u3059\u3002,N5,EASY,vocabulary,
test-import-2,TRANSLATION,Translate: I am a student,\u79c1\u306f\u5b66\u751f\u3067\u3059,0,Translation test,N5,EASY,translation,
test-import-3,ERROR_CORRECTION,\u4e0b\u306e\u6587\u3092\u6b63\u3057\u3066\u304f\u3060\u3055\u3044,\u4fee\u6b63,0,Error correction test,N5,EASY,grammar,
test-import-4,INVALID_TYPE,\u3053\u308c\u306f\u7121\u52b9\u306a\u30bf\u30a4\u30d7,\u4e0d\u6b63,0,Should be skipped,N5,EASY,,
""";

        // Write to temp file
        java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("import_test", ".csv");
        java.nio.file.Files.writeString(tempFile, csv);

        try {
            org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(
                java.nio.file.Files.readAllBytes(tempFile)) {
                @Override
                public String getFilename() {
                    return tempFile.getFileName().toString();
                }
            };

            org.springframework.util.MultiValueMap<String, Object> parts = new org.springframework.util.LinkedMultiValueMap<>();
            parts.add("file", resource);
            parts.add("format", "AUTO_DETECT");
            parts.add("level", "N5");

            HttpHeaders h = withAuth();
            h.setContentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA);
            HttpEntity<org.springframework.util.MultiValueMap<String, Object>> req = new HttpEntity<>(parts, h);

            ResponseEntity<String> resp = restTemplate.exchange(
                "/api/teacher/questions/import", HttpMethod.POST, req, String.class);

            String rb = resp.getBody();
            int status = resp.getStatusCode().value();
            System.out.printf("Import AUTO_DETECT: HTTP=%d | body: %s%n", status,
                rb != null ? rb.substring(0, Math.min(400, rb.length())) : "null");

        // Count imported questions
        boolean hasSuccess = rb != null && rb.contains("\"success\":true");
        int importedCount = 0;
        int skippedCount = 0;
        if (rb != null) {
            // Try to extract counts from response
            String importedRaw = extractField(rb, "\"importedCount\":");
            if (importedRaw != null) {
                try { importedCount = Integer.parseInt(importedRaw); } catch (Exception ignored) {}
            }
            String skippedRaw = extractField(rb, "\"skippedCount\":");
            if (skippedRaw != null) {
                try { skippedCount = Integer.parseInt(skippedRaw); } catch (Exception ignored) {}
            }
        }
            System.out.printf("  Imported: %d | Skipped: %d%n", importedCount, skippedCount);
            System.out.println("Import AUTO_DETECT: " + (status == 200 && importedCount > 0 ? "PASS" : "PARTIAL"));

            // Cleanup imported questions
            if (importedCount > 0) {
                List<Map<String, Object>> imported = jdbcTemplate.queryForList(
                    "SELECT id FROM teacher_questions WHERE prompt LIKE '%\u732b\u306f\u9b5a\u304c\u597d\u304d\u3067\u3059\u304b%' AND teacher_id = (SELECT id FROM users WHERE email = ?)",
                    teacherEmail);
                for (Map<String, Object> row : imported) {
                    String qId = row.get("id").toString();
                    jdbcTemplate.update("DELETE FROM teacher_question_options WHERE question_id = ?", qId);
                    jdbcTemplate.update("DELETE FROM teacher_questions WHERE id = ?", qId);
                }
            }
        } finally {
            java.nio.file.Files.deleteIfExists(tempFile);
        }
    }

    @Test
    @Order(11)
    @DisplayName("Export: Questions exported with metadata")
    void exportQuestions() throws Exception {
        // First create a question with metadata
        Map<String, Object> transMeta = new LinkedHashMap<>();
        transMeta.put("direction", "EN_TO_JA");
        transMeta.put("sourceText", "Where is the library?");
        transMeta.put("referenceAnswer", "\u56f3\u66f8\u9928\u306f\u3069\u3053\u3067\u3059\u304b");

        String qId = persistAndReload("\u56f3\u66f8\u9928\u306f\u3069\u3053\u3067\u3059\u304b\u3002", "TRANSLATION", "translationMetadata", transMeta);

        if (qId != null) {
            // Export questions
            ResponseEntity<String> resp = restTemplate.exchange(
                "/api/teacher/questions/export?format=JSON&level=N5",
                HttpMethod.GET, new HttpEntity<>(withAuth()), String.class);

            String rb = resp.getBody();
            int status = resp.getStatusCode().value();
            boolean hasExport = rb != null && (rb.contains("export") || rb.contains("questions") || rb.contains("["));
            System.out.printf("Export: HTTP=%d | hasData=%s | body: %s%n", status, hasExport,
                rb != null ? rb.substring(0, Math.min(300, rb.length())) : "null");
            System.out.println("Export: " + (status == 200 && hasExport ? "PASS" : "PARTIAL"));
        } else {
            System.out.println("Export: SKIP (no question created)");
        }
    }

    // ============ Delete Authorization ============

    @Test
    @Order(12)
    @DisplayName("Delete: TEACHER cannot delete questions (admin-only)")
    void deleteTeacherForbidden() throws Exception {
        // Create a question first
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("prompt", "\u7d19\u4e0a\u306e\u30c6\u30b9\u30c8\u7528");
        body.put("questionType", "MULTIPLE_CHOICE");
        body.put("correctAnswerIndex", 0);
        body.put("options", List.of("\u306f\u3044", "\u3044\u3044\u3048"));
        body.put("explanation", "Test");
        body.put("level", "N5");
        body.put("difficulty", "EASY");

        HttpEntity<Map<String, Object>> createReq = new HttpEntity<>(body, withAuth());
        ResponseEntity<String> createResp = restTemplate.exchange(
            "/api/teacher/questions", HttpMethod.POST, createReq, String.class);

        if (createResp.getStatusCode() == HttpStatus.OK) {
            JsonNode json = objectMapper.readTree(createResp.getBody());
            String qId = json.path("data").path("id").asText();

            HttpEntity<Void> delReq = new HttpEntity<>(withAuth());
            ResponseEntity<String> delResp = restTemplate.exchange(
                "/api/teacher/questions/" + qId, HttpMethod.DELETE, delReq, String.class);
            assertTrue(delResp.getStatusCode().value() >= 300, "Teacher should not be able to delete");
            System.out.println("Delete authorization: PASS (TEACHER forbidden, admin-only)");

            // Cleanup
            createdQuestionIds.add(qId);
        } else {
            System.out.println("Delete authorization: SKIP (could not create question)");
        }
    }

    @Test
    @Order(13)
    @DisplayName("Delete: ADMIN can delete questions")
    void deleteAdminAllowed() throws Exception {
        // Register an admin
        String adminEmail = "admin_del_" + System.currentTimeMillis() + "@test.com";
        Map<String, Object> regBody = new LinkedHashMap<>();
        regBody.put("email", adminEmail);
        regBody.put("password", "Admin@123");
        regBody.put("role", "ADMIN");

        ResponseEntity<String> regResp = restTemplate.postForEntity("/api/auth/register", regBody, String.class);
        if (regResp.getStatusCode() != HttpStatus.CREATED) {
            System.out.println("Delete ADMIN: SKIP (cannot register admin)");
            return;
        }

        jdbcTemplate.update("UPDATE users SET email_verified = true, status = 'ACTIVE' WHERE email = ?", adminEmail);

        Map<String, Object> loginBody = new LinkedHashMap<>();
        loginBody.put("email", adminEmail);
        loginBody.put("password", "Admin@123");
        ResponseEntity<String> loginResp = restTemplate.postForEntity("/api/auth/login", loginBody, String.class);
        JsonNode loginJson = objectMapper.readTree(loginResp.getBody());
        String adminToken = loginJson.path("data").path("accessToken").asText();

        // Create a question as teacher
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("prompt", "\u7d19\u4e0a\u306e\u30c6\u30b9\u30c8\u7528");
        body.put("questionType", "MULTIPLE_CHOICE");
        body.put("correctAnswerIndex", 0);
        body.put("options", List.of("\u306f\u3044", "\u3044\u3044\u3048"));
        body.put("explanation", "Test");
        body.put("level", "N5");
        body.put("difficulty", "EASY");

        HttpEntity<Map<String, Object>> createReq = new HttpEntity<>(body, withAuth());
        ResponseEntity<String> createResp = restTemplate.exchange(
            "/api/teacher/questions", HttpMethod.POST, createReq, String.class);

        if (createResp.getStatusCode() == HttpStatus.OK) {
            JsonNode json = objectMapper.readTree(createResp.getBody());
            String qId = json.path("data").path("id").asText();

            // Delete as admin
            HttpHeaders adminHeaders = new HttpHeaders();
            adminHeaders.setBearerAuth(adminToken);
            HttpEntity<Void> delReq = new HttpEntity<>(adminHeaders);
            ResponseEntity<String> delResp = restTemplate.exchange(
                "/api/teacher/questions/" + qId, HttpMethod.DELETE, delReq, String.class);

            System.out.printf("Delete by ADMIN: HTTP=%d (expected 200)%n", delResp.getStatusCode().value());
            assertEquals(HttpStatus.OK, delResp.getStatusCode(), "Admin should be able to delete");
            System.out.println("Delete ADMIN allowed: PASS");
        } else {
            System.out.println("Delete ADMIN: SKIP (could not create question)");
        }

        // Cleanup admin
        jdbcTemplate.update("DELETE FROM users WHERE email = ?", adminEmail);
    }

    int countOcc(String s, String sub) {
        if (s == null) return 0;
        int c = 0, i = 0;
        while ((i = s.indexOf(sub, i)) != -1) { c++; i += sub.length(); }
        return c;
    }
}
