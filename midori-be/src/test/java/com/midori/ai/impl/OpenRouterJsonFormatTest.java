package com.midori.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiTaskType;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.core.AiCoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.mock.http.client.MockClientHttpResponse;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OpenRouterJsonFormatTest {

    private ObjectMapper objectMapper;
    private AiConfigProperties config;
    private List<String> capturedRequests;
    private OpenRouterProvider provider;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        config = new AiConfigProperties();
        config.getOpenrouter().setApiKeys("sk-mock-key-1234567890abcdef");
        config.getOpenrouter().setModels("openrouter/mock-model");

        capturedRequests = new ArrayList<>();

        SimpleClientHttpRequestFactory mockFactory = new SimpleClientHttpRequestFactory() {
            @Override
            public ClientHttpRequest createRequest(URI uri, HttpMethod httpMethod) throws IOException {
                return new MockClientHttpRequest(httpMethod, uri) {
                    @Override
                    protected ClientHttpResponse executeInternal() throws IOException {
                        capturedRequests.add(getBodyAsString());
                        String responseJson = "{\"choices\":[{\"message\":{\"content\":\"mocked-response\"}}],\"model\":\"openrouter/mock-model\",\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":15,\"total_tokens\":25}}";
                        return new MockClientHttpResponse(responseJson.getBytes(StandardCharsets.UTF_8), HttpStatus.OK);
                    }
                };
            }
        };

        provider = new OpenRouterProvider(config, objectMapper) {
            @Override
            protected SimpleClientHttpRequestFactory createFactory(int readTimeoutMs) {
                return mockFactory;
            }
        };

        AiCoreService.resetProviderCallCount();
        AiCoreService.clearAttemptTraces();
    }

    @Test
    @DisplayName("COMPLEX_REASONING task type includes response_format=json_object in OpenRouter request")
    void testComplexReasoningIncludesJsonObjectFormat() throws Exception {
        provider.chat("system prompt", "user message", Collections.emptyList(), AiTaskType.COMPLEX_REASONING);

        assertEquals(1, capturedRequests.size());
        JsonNode requestJson = objectMapper.readTree(capturedRequests.get(0));

        assertTrue(requestJson.has("response_format"), "Request JSON should contain 'response_format'");
        JsonNode formatNode = requestJson.get("response_format");
        assertEquals("json_object", formatNode.path("type").asText());
    }

    @Test
    @DisplayName("ADMIN_CONTENT_LIBRARY_GENERATION task type includes response_format=json_object in OpenRouter request")
    void testAdminContentLibraryGenerationIncludesJsonObjectFormat() throws Exception {
        provider.chat("system prompt", "user message", Collections.emptyList(), AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION);

        assertEquals(1, capturedRequests.size());
        JsonNode requestJson = objectMapper.readTree(capturedRequests.get(0));

        assertTrue(requestJson.has("response_format"), "Request JSON should contain 'response_format'");
        JsonNode formatNode = requestJson.get("response_format");
        assertEquals("json_object", formatNode.path("type").asText());
    }

    @Test
    @DisplayName("Non-JSON task types (e.g. SIMPLE_TRANSLATION, SHORT_ANSWER, DEFAULT) do NOT include response_format=json_object")
    void testNonJsonTaskTypesRemainUnchanged() throws Exception {
        provider.chat("system prompt", "user message 1", Collections.emptyList(), AiTaskType.SIMPLE_TRANSLATION);
        provider.chat("system prompt", "user message 2", Collections.emptyList(), AiTaskType.SHORT_ANSWER);
        provider.chat("system prompt", "user message 3", Collections.emptyList(), AiTaskType.DEFAULT);
        provider.chat("system prompt", "user message 4", Collections.emptyList(), null);

        assertEquals(4, capturedRequests.size());
        for (String body : capturedRequests) {
            JsonNode requestJson = objectMapper.readTree(body);
            assertFalse(requestJson.has("response_format"), "Non-JSON task types should not contain 'response_format'");
        }
    }
}
