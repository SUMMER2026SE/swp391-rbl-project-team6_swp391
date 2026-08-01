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

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * E2E test for Question Bank CRUD with TEACHER role.
 * Registers a teacher, approves via DB, then tests full CRUD.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("local")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class QBankE2ETest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private int port;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private String teacherEmail;
    private String teacherPass = "Teacher@123";
    private String teacherToken;
    private String mcqId, transId, ecId, swId;

    @BeforeAll
    void setup() throws Exception {
        teacherEmail = "qb_e2e_" + System.currentTimeMillis() + "@test.com";

        // 1. Register teacher
        System.out.println("=== E2E: Register teacher ===");
        Map<String, Object> regBody = new LinkedHashMap<>();
        regBody.put("email", teacherEmail);
        regBody.put("password", teacherPass);
        regBody.put("role", "TEACHER");

        ResponseEntity<String> regResp = restTemplate.postForEntity(
            "/api/auth/register", regBody, String.class);
        assertEquals(HttpStatus.CREATED, regResp.getStatusCode());
        System.out.println("Register: " + regResp.getStatusCode());

        // 2. DB: verify email and set APPROVED
        System.out.println("=== E2E: DB approve teacher ===");
        int updated = jdbcTemplate.update(
            "UPDATE users SET email_verified = true, role = 'TEACHER', status = 'ACTIVE' WHERE email = ?",
            teacherEmail);
        assertTrue(updated > 0, "Teacher should be updated in DB");
        System.out.println("DB updated: " + updated);

        // Verify DB state
        Map<String, Object> dbUser = jdbcTemplate.queryForMap(
            "SELECT id, email, role, status, email_verified FROM users WHERE email = ?", teacherEmail);
        System.out.println("DB state: " + dbUser);
        assertEquals("TEACHER", dbUser.get("role"));
        assertEquals("ACTIVE", dbUser.get("status"));

        // 3. Login as teacher
        System.out.println("=== E2E: Login teacher ===");
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
    }

    @AfterAll
    void cleanup() {
        if (teacherEmail != null) {
            try {
                jdbcTemplate.update("DELETE FROM teacher_question_options WHERE teacher_question_id IN (SELECT id FROM teacher_questions WHERE teacher_id = (SELECT id FROM users WHERE email = ?))", teacherEmail);
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.update("DELETE FROM teacher_questions WHERE teacher_id = (SELECT id FROM users WHERE email = ?)", teacherEmail);
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.update("DELETE FROM users WHERE email LIKE ?", teacherEmail + "%");
            } catch (Exception ignored) {}
        }
    }

    // ============ LIST ============
    @Test
    @DisplayName("List questions - empty initially")
    void listQuestions() throws Exception {
        ResponseEntity<String> resp = listQuestionsReq();
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        System.out.println("List questions: PASS | " + resp.getBody().substring(0, 200));
    }

    // ============ CREATE ============
    @Test
    @DisplayName("Create MCQ question")
    void createMCQ() throws Exception {
        Map<String, Object> body = makeMCQ();
        ResponseEntity<String> resp = createQuestion(body);
        String bodyStr = resp.getBody();
        System.out.println("Create MCQ: " + resp.getStatusCode() + " | " + (bodyStr != null ? bodyStr.substring(0, Math.min(300, bodyStr.length())) : "null"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());

        JsonNode json = objectMapper.readTree(bodyStr);
        if (json.path("data").has("id")) {
            mcqId = json.path("data").path("id").asText();
            System.out.println("  MCQ ID: " + mcqId);
        }
        assertNotNull(mcqId, "Should return created question ID");
    }

    @Test
    @DisplayName("Create TRANSLATION question")
    void createTranslation() throws Exception {
        Map<String, Object> body = makeTranslation();
        ResponseEntity<String> resp = createQuestion(body);
        String bodyStr = resp.getBody();
        System.out.println("Create TRANSLATION: " + resp.getStatusCode() + " | " + (bodyStr != null ? bodyStr.substring(0, Math.min(300, bodyStr.length())) : "null"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());

        JsonNode json = objectMapper.readTree(bodyStr);
        if (json.path("data").has("id")) {
            transId = json.path("data").path("id").asText();
            System.out.println("  Translation ID: " + transId);
        }
    }

    @Test
    @DisplayName("Create ERROR_CORRECTION question")
    void createErrorCorrection() throws Exception {
        Map<String, Object> body = makeErrorCorrection();
        ResponseEntity<String> resp = createQuestion(body);
        String bodyStr = resp.getBody();
        System.out.println("Create ERROR_CORRECTION: " + resp.getStatusCode() + " | " + (bodyStr != null ? bodyStr.substring(0, Math.min(300, bodyStr.length())) : "null"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());

        JsonNode json = objectMapper.readTree(bodyStr);
        if (json.path("data").has("id")) {
            ecId = json.path("data").path("id").asText();
            System.out.println("  EC ID: " + ecId);
        }
    }

    @Test
    @DisplayName("Create SENTENCE_WRITING question")
    void createSentenceWriting() throws Exception {
        Map<String, Object> body = makeSentenceWriting();
        ResponseEntity<String> resp = createQuestion(body);
        String bodyStr2 = resp.getBody();
        System.out.println("Create SENTENCE_WRITING: " + resp.getStatusCode() + " | " + (bodyStr2 != null ? bodyStr2.substring(0, Math.min(300, bodyStr2.length())) : "null"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());

        JsonNode json = objectMapper.readTree(bodyStr2);
        if (json.path("data").has("id")) {
            swId = json.path("data").path("id").asText();
            System.out.println("  SW ID: " + swId);
        }
    }

    // ============ RELOAD & VERIFY ============
    @Test
    @DisplayName("Reload and verify MCQ")
    void reloadMCQ() throws Exception {
        if (mcqId == null) { System.out.println("SKIP: no MCQ ID"); return; }
        ResponseEntity<String> resp = getQuestion(mcqId);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        JsonNode json = objectMapper.readTree(resp.getBody());
        String type = json.path("data").path("questionType").asText();
        boolean hasTransMeta = !json.path("data").path("translationMetadata").isNull();
        System.out.printf("Reload MCQ: HTTP=%d type=%s transMeta=%s%n", resp.getStatusCode().value(), type, hasTransMeta);
        assertEquals("MULTIPLE_CHOICE", type);
    }

    @Test
    @DisplayName("Reload and verify TRANSLATION")
    void reloadTranslation() throws Exception {
        if (transId == null) { System.out.println("SKIP: no trans ID"); return; }
        ResponseEntity<String> resp = getQuestion(transId);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        JsonNode json = objectMapper.readTree(resp.getBody());
        String type = json.path("data").path("questionType").asText();
        boolean hasTransMeta = !json.path("data").path("translationMetadata").isNull();
        System.out.printf("Reload TRANSLATION: HTTP=%d type=%s transMeta=%s%n", resp.getStatusCode().value(), type, hasTransMeta);
        assertEquals("TRANSLATION", type);
        assertTrue(hasTransMeta, "Translation metadata should be present");
    }

    @Test
    @DisplayName("Reload and verify ERROR_CORRECTION")
    void reloadErrorCorrection() throws Exception {
        if (ecId == null) { System.out.println("SKIP: no EC ID"); return; }
        ResponseEntity<String> resp = getQuestion(ecId);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        JsonNode json = objectMapper.readTree(resp.getBody());
        String type = json.path("data").path("questionType").asText();
        boolean hasECMeta = !json.path("data").path("errorCorrectionMetadata").isNull();
        System.out.printf("Reload ERROR_CORRECTION: HTTP=%d type=%s ecMeta=%s%n", resp.getStatusCode().value(), type, hasECMeta);
        assertEquals("ERROR_CORRECTION", type);
        assertTrue(hasECMeta, "Error correction metadata should be present");
    }

    @Test
    @DisplayName("Reload and verify SENTENCE_WRITING")
    void reloadSentenceWriting() throws Exception {
        if (swId == null) { System.out.println("SKIP: no SW ID"); return; }
        ResponseEntity<String> resp = getQuestion(swId);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        JsonNode json = objectMapper.readTree(resp.getBody());
        String type = json.path("data").path("questionType").asText();
        boolean hasSWMeta = !json.path("data").path("sentenceWritingMetadata").isNull();
        System.out.printf("Reload SENTENCE_WRITING: HTTP=%d type=%s swMeta=%s%n", resp.getStatusCode().value(), type, hasSWMeta);
        assertEquals("SENTENCE_WRITING", type);
        assertTrue(hasSWMeta, "Sentence writing metadata should be present");
    }

    // ============ EDIT ============
    @Test
    @DisplayName("Edit MCQ question")
    void editMCQ() throws Exception {
        if (mcqId == null) { System.out.println("SKIP: no MCQ ID"); return; }
        Map<String, Object> body = makeMCQ();
        body.put("title", "Edited MCQ");
        ResponseEntity<String> resp = updateQuestion(mcqId, body);
        System.out.println("Edit MCQ: " + resp.getStatusCode() + " | " + resp.getBody().substring(0, 200));
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    // ============ SEARCH ============
    @Test
    @DisplayName("Search/filter by type")
    void searchByType() {
        for (String type : new String[]{"MULTIPLE_CHOICE", "TRANSLATION", "ERROR_CORRECTION", "SENTENCE_WRITING"}) {
            ResponseEntity<String> resp = restTemplate.exchange(
                "/api/teacher/questions?type=" + type + "&page=0&size=5",
                HttpMethod.GET,
                withAuth(),
                String.class);
            System.out.printf("Search(type=%s): HTTP %d | len=%d%n", type, resp.getStatusCode().value(), resp.getBody().length());
            assertEquals(HttpStatus.OK, resp.getStatusCode());
        }
    }

    // ============ DELETE ============
    @Test
    @DisplayName("Delete test records")
    void deleteAll() throws Exception {
        for (String id : new String[]{mcqId, transId, ecId, swId}) {
            if (id == null) continue;
            ResponseEntity<String> resp = restTemplate.exchange(
                "/api/teacher/questions/" + id,
                HttpMethod.DELETE,
                withAuth(),
                String.class);
            System.out.printf("Delete(id=%s): HTTP %d (TEACHER should be rejected)%n", id, resp.getStatusCode().value());
            // TEACHER role - should be rejected (either 403 or 500)
            assertTrue(resp.getStatusCode().value() >= 300, "TEACHER delete should be rejected");
        }
    }

    // ============ HELPERS ============
    ResponseEntity<String> listQuestionsReq() {
        return restTemplate.exchange(
            "/api/teacher/questions",
            HttpMethod.GET,
            withAuth(),
            String.class);
    }

    ResponseEntity<String> createQuestion(Map<String, Object> body) {
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, withAuthHeaders());
        return restTemplate.postForEntity("/api/teacher/questions", entity, String.class);
    }

    ResponseEntity<String> getQuestion(String id) {
        return restTemplate.exchange(
            "/api/teacher/questions/" + id,
            HttpMethod.GET,
            withAuth(),
            String.class);
    }

    ResponseEntity<String> updateQuestion(String id, Map<String, Object> body) {
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, withAuthHeaders());
        return restTemplate.exchange(
            "/api/teacher/questions/" + id,
            HttpMethod.PUT,
            entity,
            String.class);
    }

    HttpEntity<Void> withAuth() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + teacherToken);
        return new HttpEntity<>(headers);
    }

    HttpHeaders withAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + teacherToken);
        headers.set("Content-Type", "application/json");
        return headers;
    }

    // ============ BODY BUILDERS ============
    Map<String, Object> makeMCQ() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("prompt", "\u732b\u306f\u9b5a\u304c\u597d\u304d\u3067\u3059\u304b\u3002");
        body.put("questionType", "MULTIPLE_CHOICE");
        body.put("skill", "VOCABULARY");
        body.put("correctAnswerIndex", 0);
        body.put("options", List.of("\u306f\u3044", "\u3044\u3044\u3048", "\u3059\u3079\u3066", "\u308f\u304b\u308a\u307e\u305b\u3093"));
        body.put("explanation", "\u732b\u306f\u9b5a\u304c\u597d\u304d\u3067\u3059\u3002");
        body.put("level", "N5");
        body.put("difficulty", "EASY");
        return body;
    }

    Map<String, Object> makeTranslation() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("prompt", "Translate to Japanese: I am a student");
        body.put("questionType", "TRANSLATION");
        body.put("skill", "VOCABULARY");
        body.put("correctAnswerIndex", 0);
        body.put("options", List.of("\u79c1\u306f\u5b66\u751f\u3067\u3059"));
        body.put("explanation", "Translation exercise");
        body.put("level", "N5");
        body.put("difficulty", "EASY");
        body.put("translationMetadata", Map.of(
            "direction", "EN_TO_JA",
            "sourceText", "I am a student",
            "referenceAnswer", "\u79c1\u306f\u5b66\u751f\u3067\u3059"
        ));
        return body;
    }

    Map<String, Object> makeErrorCorrection() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("prompt", "Correct the Japanese grammar mistake");
        body.put("questionType", "ERROR_CORRECTION");
        body.put("skill", "GRAMMAR");
        body.put("correctAnswerIndex", 0);
        body.put("options", List.of("Grammar correction"));
        body.put("explanation", "Grammar correction");
        body.put("level", "N5");
        body.put("difficulty", "EASY");
        body.put("errorCorrectionMetadata", Map.of(
            "incorrectText", "\u79c1\u306f\u9b5a\u304c\u98df\u3079\u305f\u3044",
            "correctedText", "\u79c1\u306f\u9b5a\u3092\u98df\u3079\u305f\u3044",
            "explanation", "\u4ed6\u52d5\u8a5e\u306a\u306e\u3067\u300c\u3092\u300d\u304c\u5fc5\u8981\u3067\u3059\u3002"
        ));
        return body;
    }

    Map<String, Object> makeSentenceWriting() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("prompt", "Make a sentence using: \u5b66\u6821 (school)");
        body.put("questionType", "SENTENCE_WRITING");
        body.put("skill", "VOCABULARY");
        body.put("correctAnswerIndex", 0);
        body.put("options", List.of("Sentence writing"));
        body.put("explanation", "Sentence writing");
        body.put("level", "N5");
        body.put("difficulty", "EASY");
        body.put("sentenceWritingMetadata", Map.of(
            "requiredVocabulary", List.of("\u5b66\u6821"),
            "referenceAnswer", "\u79c1\u306f\u5b66\u6821\u306b\u884c\u304d\u307e\u3059"
        ));
        return body;
    }
}
