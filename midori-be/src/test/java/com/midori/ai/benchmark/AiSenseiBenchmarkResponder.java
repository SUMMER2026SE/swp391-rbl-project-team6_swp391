package com.midori.ai.benchmark;

import com.midori.ai.AiProvider;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.impl.OpenRouterBenchmarkObservation;
import com.midori.ai.impl.OpenRouterProvider;
import com.midori.ai.prompt.AiPromptBuilder;

import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Real benchmark responder that reuses the existing AI Sensei chat path.
 *
 * <p>This responder intentionally does NOT:
 *
 * <ul>
 *   <li>duplicate provider configuration, API keys, retry logic, or
 *       model-call logic. It goes straight through {@link AiCoreService}
 *       which already wraps the configured provider with the project's
 *       fallback and key-rotation policy.</li>
 *   <li>touch quiz generation. Only the chat path is exercised.</li>
 *   <li>persist benchmark conversations to the database. The benchmark
 *       evaluates the model output directly and discards it.</li>
 * </ul>
 *
 * <p>The system prompt used is exactly
 * {@link AiPromptBuilder#getChatSystemPrompt()} — the same prompt that
 * {@code AiServiceImpl.chat(...)} uses when no material is selected
 * (production line: {@code buildSystemPrompt(resolution)} →
 * {@code AiPromptBuilder.getChatSystemPrompt()}). This guarantees the
 * benchmark evaluates the no-material full Japanese assistant behavior.
 *
 * <p>Because the production chat path returns responses already cleaned by
 * {@code AiServiceImpl.sanitizeAiContent} (think-tag stripping + HTML
 * entity decoding), the responder applies the same cleaning here so the
 * evaluator sees the same text the user would see in production.
 */
public final class AiSenseiBenchmarkResponder {

    /**
     * Pattern used to strip the same XML / plain think tags that
     * {@code AiServiceImpl.sanitizeAiContent} strips. Mirrored here so
     * the benchmark does not depend on private internals of the service.
     */
    private static final Pattern THINK_TAG_PATTERN = Pattern.compile(
            "<think>|</think>|<think>.*?</think>|<think>.*?</think>",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern HTML_ENTITY_PATTERN = Pattern.compile(
            "&(?:amp|lt|gt|quot|apos|#39|#x27);");

    private final AiCoreService aiCoreService;

    public AiSenseiBenchmarkResponder(AiCoreService aiCoreService) {
        this.aiCoreService = aiCoreService;
    }

    /**
     * Run one case and retain the provider text before and after the production-
     * equivalent sanitizer. No benchmark conversation is persisted.
     */
    public AiSenseiBenchmarkDiagnostic respondWithDiagnostics(String caseId, String prompt) {
        AiProvider provider = aiCoreService.getCurrentProvider();
        String requestedModel = provider.getModels().isEmpty() ? null : provider.getModels().get(0);
        if (prompt == null || prompt.isBlank()) {
            return diagnostic(caseId, provider, requestedModel, "", "", 0L,
                    "Blank benchmark prompt", null);
        }

        String systemPrompt = AiPromptBuilder.getChatSystemPrompt();
        List<String[]> history = Collections.emptyList();
        long started = System.nanoTime();
        String raw = "";
        String error = null;
        OpenRouterProvider observedProvider = provider instanceof OpenRouterProvider openRouter ? openRouter : null;
        OpenRouterBenchmarkObservation.Snapshot snapshot = null;
        if (observedProvider != null) OpenRouterBenchmarkObservation.enable(observedProvider);
        try {
            raw = aiCoreService.chat(systemPrompt, prompt, history);
        } catch (RuntimeException re) {
            error = re.getClass().getSimpleName() + ": " + re.getMessage();
        } finally {
            if (observedProvider != null) {
                snapshot = OpenRouterBenchmarkObservation.snapshot(observedProvider);
                OpenRouterBenchmarkObservation.disable(observedProvider);
            }
        }
        long elapsedMs = (System.nanoTime() - started) / 1_000_000L;
        String sanitized = sanitize(raw);
        return diagnostic(caseId, provider, requestedModel, raw, sanitized, elapsedMs, error, snapshot);
    }

    private static AiSenseiBenchmarkDiagnostic diagnostic(
            String caseId,
            AiProvider provider,
            String requestedModel,
            String raw,
            String sanitized,
            long elapsedMs,
            String responderError,
            OpenRouterBenchmarkObservation.Snapshot suppliedSnapshot) {
        OpenRouterBenchmarkObservation.Snapshot snapshot = suppliedSnapshot;
        if (snapshot == null && provider instanceof OpenRouterProvider openRouter) {
            snapshot = OpenRouterBenchmarkObservation.snapshot(openRouter);
        }

        String providerName = provider == null || provider.getType() == null
                ? "UNKNOWN"
                : provider.getType().name();
        String actualModel = provider == null ? null : provider.getLastModelUsed();
        String fallbackModel = null;
        boolean fallback = false;
        String finishReason = null;
        int retryCount = responderError == null ? 0 : 1;
        Long promptTokens = null;
        Long completionTokens = null;
        Long totalTokens = null;
        String rawHttpResponse = null;
        String rawHttpResponseBase64 = null;
        String providerError = responderError;
        long latencyMs = elapsedMs;

        if (snapshot != null) {
            providerName = snapshot.provider();
            requestedModel = snapshot.requestedModel();
            actualModel = snapshot.actualResolvedModel();
            fallbackModel = snapshot.fallbackModelUsed();
            fallback = snapshot.fallbackOccurred();
            finishReason = snapshot.finishReason();
            latencyMs = snapshot.latencyMs();
            retryCount = snapshot.errorOrRetryCount();
            promptTokens = snapshot.promptTokens();
            completionTokens = snapshot.completionTokens();
            totalTokens = snapshot.totalTokens();
            rawHttpResponse = snapshot.rawHttpResponse();
            rawHttpResponseBase64 = snapshot.rawHttpResponseBase64();
            if (providerError == null) providerError = snapshot.error();
        }

        return new AiSenseiBenchmarkDiagnostic(
                caseId,
                providerName,
                requestedModel,
                actualModel,
                fallbackModel,
                fallback,
                finishReason,
                latencyMs,
                retryCount,
                promptTokens,
                completionTokens,
                totalTokens,
                rawHttpResponse,
                rawHttpResponseBase64,
                raw,
                sanitized,
                AiSenseiBenchmarkDiagnostic.suspiciousCodePoints(raw),
                AiSenseiBenchmarkDiagnostic.suspiciousCodePoints(sanitized),
                providerError);
    }

    /** Backwards-compatible helper used by existing offline checks. */
    public String respond(String prompt) {
        return respondWithDiagnostics(null, prompt).sanitizedResponse();
    }

    /**
     * Mirror of {@code AiServiceImpl.sanitizeAiContent} + HTML entity
     * decode. Keeps the benchmark evaluator working on the same text the
     * end user would see.
     */
    static String sanitize(String content) {
        if (content == null) return "";
        String cleaned = THINK_TAG_PATTERN.matcher(content).replaceAll("").trim();
        return decodeHtmlEntities(cleaned);
    }

    static String decodeHtmlEntities(String value) {
        if (value == null || value.isEmpty()) return value;
        return HTML_ENTITY_PATTERN.matcher(value).replaceAll(m -> {
            String s = m.group();
            return switch (s) {
                case "&amp;" -> "&";
                case "&lt;" -> "<";
                case "&gt;" -> ">";
                case "&quot;" -> "\"";
                case "&apos;", "&#39;", "&#x27;" -> "'";
                default -> s;
            };
        });
    }
}