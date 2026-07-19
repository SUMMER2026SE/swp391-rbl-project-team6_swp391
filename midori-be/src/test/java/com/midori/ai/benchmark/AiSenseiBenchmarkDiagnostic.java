package com.midori.ai.benchmark;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Per-case live-call evidence retained only by the benchmark test suite. */
public record AiSenseiBenchmarkDiagnostic(
        String caseId,
        String provider,
        String requestedModel,
        String actualResolvedModel,
        String fallbackModelUsed,
        boolean fallbackOccurred,
        String finishReason,
        long latencyMs,
        int errorOrRetryCount,
        Long promptTokens,
        Long completionTokens,
        Long totalTokens,
        String rawHttpResponse,
        String rawHttpResponseBase64,
        String rawProviderResponse,
        String sanitizedResponse,
        List<String> rawSuspiciousCodePoints,
        List<String> sanitizedSuspiciousCodePoints,
        String error) {

    public AiSenseiBenchmarkDiagnostic {
        rawSuspiciousCodePoints = List.copyOf(rawSuspiciousCodePoints == null ? List.of() : rawSuspiciousCodePoints);
        sanitizedSuspiciousCodePoints = List.copyOf(
                sanitizedSuspiciousCodePoints == null ? List.of() : sanitizedSuspiciousCodePoints);
    }

    public static List<String> suspiciousCodePoints(String text) {
        if (text == null || text.isEmpty()) return List.of();
        List<String> suspicious = new ArrayList<>();
        int index = 0;
        while (index < text.length()) {
            int cp = text.codePointAt(index);
            if (isSuspicious(text, index, cp)) {
                suspicious.add(String.format(
                        Locale.ROOT,
                        "index=%d U+%04X '%s' (%s)",
                        index,
                        cp,
                        printable(cp),
                        Character.getName(cp)));
            }
            index += Character.charCount(cp);
        }
        return suspicious;
    }

    static int suspiciousCount(String text) {
        return suspiciousCodePoints(text).size();
    }

    private static boolean isSuspicious(String text, int index, int cp) {
        if (cp == 0xFFFD || cp == 0xFEFF || cp == 0x0000) return true;
        if (Character.isSurrogate(text.charAt(index))) {
            return !(Character.isHighSurrogate(text.charAt(index))
                    && index + 1 < text.length()
                    && Character.isLowSurrogate(text.charAt(index + 1)));
        }
        if (cp < 0x20 && cp != '\n' && cp != '\r' && cp != '\t') return true;

        String tail = text.substring(index, Math.min(text.length(), index + 8));
        return tail.startsWith("ã�")
                || tail.startsWith("ã‚")
                || tail.startsWith("ãƒ")
                || tail.startsWith("æ—")
                || tail.startsWith("æœ")
                || tail.startsWith("ï¿½")
                || tail.startsWith("Â")
                || tail.startsWith("Ã");
    }

    private static String printable(int cp) {
        if (Character.isISOControl(cp)) return "\\u" + String.format(Locale.ROOT, "%04X", cp);
        return new String(Character.toChars(cp));
    }
}
