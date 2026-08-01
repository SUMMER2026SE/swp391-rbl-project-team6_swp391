package com.midori.ai.prompt;

import com.midori.ai.dto.WritingMode;

/**
 * Dedicated prompt builder exclusively for isolated WRITING skill question generation.
 * Produces text-response questions using SHORT_ANSWER as the persistent question type.
 */
public final class AiWritingPromptBuilder {

    private AiWritingPromptBuilder() {}

    /**
     * Build prompt for WRITING question generation.
     *
     * @param extractedContent extracted PDF learning content or source text
     * @param requestedCount number of questions to generate
     * @param jlptLevel target JLPT level (e.g. N5, N4)
     * @param difficultyDistribution difficulty distribution instructions or line
     * @param writingMode selected WritingMode (MIXED_WRITING, JA_TO_VI_TRANSLATION, etc.)
     * @return prompt string to be sent to AI provider
     */
    public static String buildWritingPrompt(String extractedContent,
                                            int requestedCount,
                                            String jlptLevel,
                                            String difficultyDistribution,
                                            WritingMode writingMode) {
        WritingMode mode = writingMode != null ? writingMode : WritingMode.MIXED_WRITING;
        String levelInfo = (jlptLevel != null && !jlptLevel.isBlank()) ? jlptLevel : "Any Level";
        String distInfo = (difficultyDistribution != null && !difficultyDistribution.isBlank()) ? difficultyDistribution : "Medium difficulty default";
        String contentInfo = (extractedContent != null && !extractedContent.isBlank()) ? extractedContent : "Generate general Japanese writing exercises for Vietnamese learners.";

        StringBuilder sb = new StringBuilder();
        sb.append("You are AI Sensei of MIDORI, an expert Japanese tutor for Vietnamese learners.\n");
        sb.append("Your task is to generate exactly ").append(requestedCount)
          .append(" WRITING exercises based on the provided learning content.\n\n");

        sb.append("## TARGET CONFIGURATION\n");
        sb.append("- Target Skill: WRITING\n");
        sb.append("- Requested Count: ").append(requestedCount).append(" questions\n");
        sb.append("- JLPT Level: ").append(levelInfo).append("\n");
        sb.append("- Difficulty Distribution: ").append(distInfo).append("\n");
        sb.append("- Writing Mode: ").append(mode.name()).append("\n\n");

        sb.append("## WRITING MODES & EXAMPLES\n");
        switch (mode) {
            case JA_TO_VI_TRANSLATION:
                sb.append("Generate only Japanese → Vietnamese translation questions.\n");
                sb.append("Example format:\n");
                sb.append("Question content:\n");
                sb.append("Dịch câu sau sang tiếng Việt:\n私は毎日日本語を勉強します。\n");
                sb.append("Expected answer:\n");
                sb.append("Tôi học tiếng Nhật mỗi ngày.\n\n");
                break;
            case VI_TO_JA_TRANSLATION:
                sb.append("Generate only Vietnamese → Japanese translation questions.\n");
                sb.append("Example format:\n");
                sb.append("Question content:\n");
                sb.append("Dịch câu sau sang tiếng Nhật:\nTôi sẽ đi thư viện vào ngày mai。\n");
                sb.append("Expected answer:\n");
                sb.append("私は明日図書館へ行きます。\n\n");
                break;
            case SENTENCE_REORDER:
                sb.append("Generate only Sentence Reordering exercises.\n");
                sb.append("Split a complete Japanese sentence into logical tokens separated by / delimiter.\n");
                sb.append("Example format:\n");
                sb.append("Question content:\n");
                sb.append("Sắp xếp các từ sau thành một câu đúng:\n毎日 / 私は / 日本語を / 勉強します\n");
                sb.append("Expected answer (the complete ordered Japanese sentence):\n");
                sb.append("私は毎日日本語を勉強します。\n\n");
                break;
            case MIXED_WRITING:
            default:
                sb.append("Generate a mix of all three writing formats as evenly as possible across the ").append(requestedCount).append(" questions.\n");
                sb.append("For example, for 10 questions generate: 3 JA_TO_VI_TRANSLATION, 3 VI_TO_JA_TRANSLATION, and 4 SENTENCE_REORDER.\n");
                sb.append("Preserve the requested difficulty distribution across all formats.\n\n");
                sb.append("1. JA_TO_VI_TRANSLATION Example:\n");
                sb.append("Question: Dịch câu sau sang tiếng Việt:\n私は毎日日本語を勉強します。\n");
                sb.append("Answer: Tôi học tiếng Nhật mỗi ngày.\n\n");
                sb.append("2. VI_TO_JA_TRANSLATION Example:\n");
                sb.append("Question: Dịch câu sau sang tiếng Nhật:\nTôi sẽ đi thư viện vào ngày mai。\n");
                sb.append("Answer: 私は明日図書館へ行きます。\n\n");
                sb.append("3. SENTENCE_REORDER Example:\n");
                sb.append("Question: Sắp xếp các từ sau thành một câu đúng:\n毎日 / 私は / 日本語を / 勉強します\n");
                sb.append("Answer: 私は毎日日本語を勉強します。\n\n");
                break;
        }

        sb.append("## CRITICAL PROMPT RULES & PROHIBITED ANSWERS\n");
        sb.append("1. Produce questions compatible with the text-answer model. Set \"type\" to \"SHORT_ANSWER\" and \"category\" to \"Writing\" for every question.\n");
        sb.append("2. DO NOT generate generic FILL_BLANK placeholders or conversion styles (do NOT use \"___\", \"Write one sentence using ___\", \"Correct the sentence: ___\", \"Include ___ and ___\").\n");
        sb.append("3. DO NOT output vague or descriptive expected answers. The expected answer MUST be the exact complete translation or complete reordered sentence.\n");
        sb.append("4. Explicitly PROHIBITED answer strings (do NOT output any of these or similar phrasing):\n");
        sb.append("   - Corrected sentence\n");
        sb.append("   - Present continuous form\n");
        sb.append("   - Future tense/intent\n");
        sb.append("   - A specific grammar pattern\n");
        sb.append("   - Two specific grammar points/words\n");
        sb.append("   - Sample answer\n");
        sb.append("   - Student answer may vary\n\n");
        sb.append("5. For SENTENCE_REORDER, the tokens in the question must be separated by \" / \" and every source token must appear in the completed ordered Japanese sentence.\n\n");

        sb.append("## STRICT CONTENT FIDELITY (GENERATE FROM CONTENT)\n");
        sb.append("- Use only sentences and information found in the uploaded PDF / learning content.\n");
        sb.append("- Do not invent new source sentences.\n");
        sb.append("- Do not replace vocabulary with unrelated examples.\n");
        sb.append("- Do not paraphrase unless necessary for punctuation or spacing normalization.\n");
        sb.append("- For translation questions, preserve the exact source sentence from the PDF.\n");
        sb.append("- For sentence reordering, use the exact words or phrases from the PDF and only change their order.\n\n");

        sb.append("## OUTPUT JSON FORMAT\n");
        sb.append("Return ONLY a valid JSON object matching this structure without markdown fences or commentary:\n");
        sb.append("{\n");
        sb.append("  \"questions\": [\n");
        sb.append("    {\n");
        sb.append("      \"type\": \"SHORT_ANSWER\",\n");
        sb.append("      \"category\": \"Writing\",\n");
        sb.append("      \"difficulty\": \"EASY\",\n");
        sb.append("      \"content\": \"Question text here...\",\n");
        sb.append("      \"explanation\": \"Brief grammatical or vocabulary notes\",\n");
        sb.append("      \"answers\": [\n");
        sb.append("        { \"content\": \"Exact complete expected answer text\", \"isCorrect\": true }\n");
        sb.append("      ]\n");
        sb.append("    }\n");
        sb.append("  ]\n");
        sb.append("}\n\n");

        sb.append("## LEARNING CONTENT / SOURCE TEXT\n");
        sb.append(contentInfo);

        return sb.toString();
    }
}
