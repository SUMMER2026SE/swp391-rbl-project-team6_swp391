package com.midori.ai.prompt;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Centralized prompt builder for all AI operations.
 * Ensures consistent prompts across all providers.
 */
public final class AiPromptBuilder {

    /**
     * Pattern that flags a user message as referring to a selected material.
     * Used by the chat layer to refuse to fabricate material content when
     * no material is actually selected.
     */
    private static final Pattern MATERIAL_REFERENCE_PATTERN = Pattern.compile(
            "(?i)" +
                    "(?:trong|\\bcua\\b|theo|n\\u00e0y|tai\\s*li\\u1ec7u|bai\\s*hoc|b\\u00e0i\\s*h\\u1ecdc|material|lesson|b\\u1ea3ng|t\\u00e0i\\s*li\\u1ec7u)" +
                    ".*?(?:tai\\s*li\\u1ec7u|bai\\s*hoc|b\\u00e0i\\s*h\\u1ecdc|material|lesson|t\\u00e0i\\s*li\\u1ec7u|n\\u00e0y)"
    );

    private AiPromptBuilder() {}

    // ============================================================
    // EXAM PARSING PROMPT
    // ============================================================

    /**
     * Build prompt for PDF exam parsing (used by Gemini/OpenAI/DeepSeek).
     */
    public static String buildExamParsingPrompt(String extractedText, String filename) {
        return """
                You are an expert exam parser. Your primary task is to digitize and parse the exam questions
                and options EXACTLY as they are written in the provided PDF text. Do not rewrite, simplify,
                or generate new questions. Your goal is to save the teacher from typing the exam questions manually.

                ## INSTRUCTIONS

                1. Extract ALL questions and options EXACTLY as they appear in the PDF text. Preserve the original phrasing, kanji, grammar, and vocabulary.
                2. Do not skip questions. Be very thorough.
                3. Identify the EXAM TITLE from the document. If none is found, generate a title using the filename.
                4. For MULTIPLE_CHOICE questions: extract all options (A, B, C, D, etc.) exactly as written.
                5. For each question, identify the correct answer choice from the context or the answer key in the document.
                6. If the PDF text contains an answer key at the end, use it to select the correct answer index.
                7. Return ONLY valid JSON matching the format below. Do not wrap in markdown code fences or add conversational text.

                ## OUTPUT FORMAT

                ```json
                {
                  "title": "Exam Title Here",
                  "description": "Brief description of the exam",
                  "questions": [
                    {
                      "type": "MULTIPLE_CHOICE",
                      "content": "Question text here?",
                      "difficulty": "MEDIUM",
                      "explanation": "Explanation if available",
                      "answers": [
                        { "content": "Option A text", "isCorrect": false },
                        { "content": "Option B text (correct)", "isCorrect": true },
                        { "content": "Option C text", "isCorrect": false },
                        { "content": "Option D text", "isCorrect": false }
                      ]
                    }
                  ]
                }
                ```

                ## CRITICAL RULES

                - DO NOT rewrite or modify the question text or options. Keep them 100% identical to the source text.
                - Support Japanese characters properly. Do not translate them to English.
                - Ensure every question has options corresponding to the choices in the PDF.
                - If the document does not specify a correct answer, make your best educational guess for which option is correct.
                - Output raw valid JSON. Do not include ```json ... ``` markdown formatting in your response.

                ## SOURCE DOCUMENT

                Filename: {filename}

                Extracted text below (may contain OCR artifacts, page markers, or scan artifacts — infer meaning from context):
                """.replace("{filename}", filename) + "\n\n" + extractedText;
    }

    // ============================================================
    // EXISTING-QUESTIONS PARSING PROMPT (IMPORT_EXISTING_QUESTIONS)
    // ============================================================

    /**
     * Build a strict, language-neutral prompt used by the
     * "Import Existing Questions" PDF workflow.
     *
     * <p>The original {@link #buildExamParsingPrompt(String, String)} overfits
     * to a JLPT Japanese exam shape (mentions kanji/grammar/vocabulary, demands
     * a single "EXAM TITLE", biases on Japanese characters). When a teacher
     * uploads a plain English/generic MCQ PDF, models often return an empty
     * {@code questions} array, which the providers' strict {@code validateResult}
     * then converts into an exception — surfacing as
     * "AI could not extract questions…".
     *
     * <p>This prompt is intentionally:
     * <ul>
     *   <li>language-neutral: works for English, Vietnamese, Japanese, mixed content;</li>
     *   <li>strict on JSON shape: one explicit schema with field-level examples;</li>
     *   <li>tolerant of an answer key section at the end of the document;</li>
     *   <li>tolerant of inline "Correct answer: X" / "Answer: X" lines per question.</li>
     * </ul>
     *
     * <p>The output JSON still maps to {@code AiExamParseResponse} so callers
     * can reuse the same mapping logic.
     *
     * @param extractedText the PDF text content
     * @param filename the original filename
     * @param selectedSkills comma-separated list of selected skills to filter
     */
    public static String buildExistingQuestionsParsingPrompt(String extractedText, String filename, String selectedSkills) {
        String safeFilename = filename != null ? filename : "document.pdf";
        String skillsInstruction = buildSkillsInstruction(selectedSkills);
        return """
                You are an expert exam-digitization assistant. Your job is to read
                the text below and convert every question, option, and answer into
                structured JSON.

                The document may be in any language (English, Vietnamese, Japanese,
                mixed). Treat it as a flat list of multiple-choice questions.
                Common shapes you will see:
                  1. Question text
                  A. Option A
                  B. Option B
                  C. Option C
                  D. Option D
                  Correct answer: B
                  Explanation: ...

                Or with an answer key at the end:
                  1. Question text
                  A. Option A
                  B. Option B
                  ...
                  Answer Key
                  1. B   2. A   3. D   ...

                """ + skillsInstruction + """

                ## CRITICAL RULES — DO NOT GENERATE

                EXTRACT ONLY. Do not create, infer, translate, rewrite, or generate
                any question, option, passage, dialogue, or example.
                If no matching existing question exists in the document, return an
                empty questions array. NEVER invent content from outside the source.

                A question only counts as "existing in the PDF" when ALL of these
                hold for that question:
                  - The question text (or a large part of it) appears literally in
                    the source text below.
                  - At least 2 of its answer options appear literally in the source.
                  - The correct answer is either labeled inline ("Correct answer: X",
                    "Answer: X", "Đáp án: X") or appears in a trailing answer-key
                    section that is also part of the source.

                Reading questions additionally require the actual passage/dialogue
                text to be present in the source. If a Reading passage is not in
                the source, do NOT create one — return zero Reading questions.

                """ + """

                ## RULES

                1. Extract EVERY question. Do not skip any.
                2. Preserve the EXACT spelling, capitalization, and punctuation of the
                   question text and the options as written in the document. Do NOT
                   translate between languages.
                3. For every question, capture all answer options (A/B/C/D/...).
                   Use the order they appear in the document for the options array.
                4. The correct answer is determined by, in order:
                   a) an inline "Correct answer: X" or "Answer: X" line right after the question;
                   b) the matching entry in a trailing answer-key block ("1. B  2. A …");
                   c) ONLY when (a) and (b) are both unavailable in the source — never
                      guess based on common sense. If you cannot find an explicit
                      correct-answer marker in the source, omit the question from
                      the output instead of guessing.
                   Mark EXACTLY ONE option as isCorrect=true. The rest are false.
                5. If an explanation is provided, copy it as-is. Otherwise use an
                   empty string.
                6. Set "type" to "MULTIPLE_CHOICE" for standard A/B/C/D questions.
                   Use "TRUE_FALSE" only if the document explicitly says so.
                7. Set "difficulty" to one of "EASY", "MEDIUM", "HARD". Default to "MEDIUM".
                8. Set "title" to the document title if present; otherwise use the filename
                   without the .pdf extension.
                9. Set "description" to a short one-line summary if visible; otherwise "".

                ## OUTPUT FORMAT — STRICT JSON

                Output ONLY a single JSON object. No markdown fences. No commentary.
                Use this exact shape, with the canonical field names shown:

                {
                  "title": "string",
                  "description": "string",
                  "questions": [
                    {
                      "type": "MULTIPLE_CHOICE",
                      "content": "Question text exactly as in the document",
                      "category": "Vocabulary",
                      "difficulty": "MEDIUM",
                      "explanation": "Explanation text or empty string",
                      "answers": [
                        { "content": "Option A text", "isCorrect": false },
                        { "content": "Option B text", "isCorrect": true },
                        { "content": "Option C text", "isCorrect": false },
                        { "content": "Option D text", "isCorrect": false }
                      ]
                    }
                  ]
                }

                Acceptable aliases (the parser understands them, but prefer the canonical
                shape above when possible):
                  - question / questionText / text / prompt   → "content"
                  - section / category / categoryName / questionCategory → "category"
                  - options / choices                          → "answers"
                  - "correct": true / false, "correctAnswer":
                    "Option B text", "answer": "B", "correctOption": 1 → "isCorrect"

                If the document contains zero questions, return
                {"title":"","description":"","questions":[]} and nothing else.

                ## SOURCE

                Filename: """ + safeFilename + """

                Extracted text below. Each page may be on its own block. Use the order
                of appearance as the question order. If you see "Correct answer: X"
                next to a question, prefer that over the trailing answer key.

                """ + "\n\n" + extractedText;
    }

    /**
     * Build instruction text for skills based on selectedSkills parameter.
     */
    private static String buildSkillsInstruction(String selectedSkills) {
        StringBuilder sb = new StringBuilder();
        sb.append("## SKILL RULE - CRITICAL\n");
        sb.append("For each question, determine the SKILL based on the EDUCATIONAL INTENT of the question,\n");
        sb.append("NOT on fixed keywords. Choose ONE of: \"Vocabulary\" | \"Grammar\" | \"Reading\"\n\n");

        if (selectedSkills != null && !selectedSkills.isBlank()) {
            sb.append("### SELECTED SKILLS: ").append(selectedSkills).append("\n");
            sb.append("IMPORTANT: You MUST only extract questions that match the selected skills.\n");
            sb.append("- Skip questions that do not belong to the selected skills.\n");
            sb.append("- Do NOT convert questions from other skills into selected skills.\n");
            sb.append("- Every returned question MUST have category equal to one of: ").append(selectedSkills).append("\n\n");
        } else {
            sb.append("### SKILL DEFINITIONS\n");
        }

        sb.append("Vocabulary questions ask about:\n");
        sb.append("  - Word meaning / translation (nghĩa là gì, nghĩa tiếng Việt)\n");
        sb.append("  - Reading / pronunciation (cách đọc, romaji, hiragana, katakana)\n");
        sb.append("  - Kanji reading\n");
        sb.append("  - \"What does [word] mean\", \"Choose the correct reading for [kanji]\", \"Meaning of [word]\"\n");
        sb.append("  - Translation between Japanese and Vietnamese\n");
        sb.append("  - \"dịch\", \"translate\", \"có nghĩa là\", \"nghĩa\"\n\n");

        sb.append("Grammar questions ask about:\n");
        sb.append("  - Sentence patterns / structures (mẫu câu, cấu trúc, pattern, sentence pattern)\n");
        sb.append("  - Particle / particle function (trợ từ, で, に, を, が, は, から, まで, と, や, へ, のに, ので, ば, たら, なら, ために, ように, そうだ, らしい, だろう, ようだ)\n");
        sb.append("  - Sentence endings (ません, ました, だろう, ようだ, そうだ, らしい, べき, つもり, たい, ない, ている, てある, てみる, ておく, てしまう, ば, たら, ない)\n");
        sb.append("  - Conjugation rules, verb forms\n");
        sb.append("  - How a grammar pattern is used\n");
        sb.append("  - What a particle indicates/means in context\n");
        sb.append("  - \"Mẫu [pattern]\", \"Cấu trúc [structure]\", \"Cách dùng\", \"dùng để\"\n");
        sb.append("  - \"How to use\", \"used to express\", \"what does the particle\", \"what does the sentence ending\"\n\n");

        sb.append("Reading questions ask about:\n");
        sb.append("  - Passage/dialogue/text comprehension\n");
        sb.append("  - Questions based on a reading text or paragraph\n");
        sb.append("  - \"Read the passage\", \"Read the dialogue\", \"According to the passage\", \"Based on the text\"\n");
        sb.append("  - \"What is the main idea of the passage\", \"What can be inferred from the passage\"\n");
        sb.append("  - \"Ý chính của đoạn văn\", \"Đọc đoạn văn\", \"đọc hiểu\"\n");
        sb.append("  - \"Theo bài đọc\", \"Theo đoạn văn\", \"Dựa vào bài đọc\"\n");
        sb.append("  - Questions about characters, events, or details from a given passage/dialogue\n");
        sb.append("  - Passage + multiple-choice questions about that passage's content\n\n");

        sb.append("IMPORTANT EXAMPLES:\n");
        sb.append("  - \"What does 「こんにちは」 mean?\" → Vocabulary\n");
        sb.append("  - \"Mẫu 「N は N です」 dùng để nói gì?\" → Grammar\n");
        sb.append("  - \"Trong câu 学校で勉強します, trợ từ で biểu thị gì?\" → Grammar\n");
        sb.append("  - \"What does the particle 「で」 indicate?\" → Grammar\n");
        sb.append("  - \"Choose the correct reading for 「学生」\" → Vocabulary\n");
        sb.append("  - \"「ありがとう」 nghĩa là gì?\" → Vocabulary\n");
        sb.append("  - \"What does the sentence ending 「ませんか」 usually express?\" → Grammar\n");
        sb.append("  - \"Cấu trúc 「A は B です」 dùng như thế nào?\" → Grammar\n");
        sb.append("  - \"Read the passage and answer the question: ...\" → Reading\n");
        sb.append("  - \"According to the passage, why did Tanaka go to school?\" → Reading\n");
        sb.append("  - \"Đọc đoạn văn sau và chọn đáp án đúng.\" → Reading\n");
        sb.append("  - \"Theo bài đọc, ai đã đi thư viện?\" → Reading\n");

        return sb.toString();
    }

    // ============================================================
    // QUIZ/QUESTION GENERATION PROMPTS
    // ============================================================

    /**
     * Build prompt for Japanese quiz question generation.
     *
     * <p>Variants:
     * <ul>
     *   <li>With {@code selectedSkills} (Generate from Learning Content flow):
     *       every question's {@code category} MUST be exactly one of the
     *       selected skills. The AI is told to forbid romaji in Japanese
     *       readings, forbid duplicate options, and always return 4 distinct
     *       options with exactly one correct answer. If the requested skill
     *       is Reading, the AI is also told to base questions on the
     *       provided material passage.</li>
     *   <li>Without {@code selectedSkills} (legacy chat flow): falls back to
     *       the original Vietnamese prompt format.</li>
     * </ul>
     */
    public static String buildQuizGenerationPrompt(
            String materialTitle,
            String materialContent,
            int questionCount,
            String questionType,
            String difficulty,
            List<String> selectedSkills) {

        if (selectedSkills != null && !selectedSkills.isEmpty()) {
            return buildQuizGenerationPromptWithSkills(
                    materialTitle, materialContent, questionCount,
                    questionType, difficulty, selectedSkills);
        }
        return buildQuizGenerationPromptLegacy(
                materialTitle, materialContent, questionCount, questionType, difficulty);
    }

    /**
     * Backwards-compatible overload for callers that don't yet pass
     * {@code selectedSkills}.
     */
    public static String buildQuizGenerationPrompt(
            String materialTitle,
            String materialContent,
            int questionCount,
            String questionType,
            String difficulty) {
        return buildQuizGenerationPromptLegacy(
                materialTitle, materialContent, questionCount, questionType, difficulty);
    }

    private static String buildQuizGenerationPromptWithSkills(
            String materialTitle,
            String materialContent,
            int questionCount,
            String questionType,
            String difficulty,
            List<String> selectedSkills) {

        String skillsLine = String.join(", ", selectedSkills);
        boolean hasReading = selectedSkills.stream()
                .anyMatch(s -> "READING".equalsIgnoreCase(s));
        boolean hasVocabulary = selectedSkills.stream()
                .anyMatch(s -> "VOCABULARY".equalsIgnoreCase(s));

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are AI Sensei of MIDORI, a Japanese tutor for Vietnamese learners.\n\n");
        prompt.append("Generate EXACTLY ").append(questionCount).append(" multiple-choice quiz questions from the learning material below.\n\n");
        prompt.append("MATERIAL TITLE: ").append(materialTitle == null ? "" : materialTitle).append("\n\n");

        if (materialContent != null && !materialContent.isBlank()) {
            prompt.append("MATERIAL CONTENT:\n").append(materialContent).append("\n\n");
        }

        prompt.append("USER-SELECTED SKILLS (every question MUST belong to exactly ONE of these): ")
                .append(skillsLine).append("\n\n");

        prompt.append("STRICT RULES — every one of these is mandatory:\n");
        prompt.append("1. Output ONLY a single raw JSON object. NO ```json fences. NO markdown. NO prose.\n");
        prompt.append("1a. The response MUST start with '{' and end with '}'. Do NOT write anything before or after the JSON.\n");
        prompt.append("2. Each question object MUST have: id, type, question, options, correctAnswer, explanation, category, difficulty.\n");
        prompt.append("3. category MUST be exactly one of: ").append(skillsLine)
                .append(". Use the canonical capitalized form (Vocabulary / Grammar / Reading).\n");
        prompt.append("4. options MUST be exactly 4 strings. ALL 4 options MUST be DISTINCT — no duplicates, no whitespace-only differences, no case-only differences.\n");
        prompt.append("5. correctAnswer MUST equal EXACTLY one of the 4 options (string equality, not substring).\n");
        prompt.append("6. explanation MUST mention why the correct answer is right.\n");
        prompt.append("7. type MUST be \"").append(questionType).append("\" for every question.\n");
        prompt.append("8. difficulty MUST be one of \"Easy\" / \"Medium\" / \"Hard\".\n");

        prompt.append("\nLANGUAGE RULES — Japanese content must use real kana/kanji, NOT romaji or Latin renderings:\n");
        prompt.append("- For Japanese words, write the kanji/hiragana/katakana form (e.g. 図書館, 田中さん, がくせい).\n");
        prompt.append("- Do NOT use romaji like 'Toshokan', 'Tanaka', 'Tanaka-san', 'shukudai', 'gakusei' anywhere — question, options, explanation, or correctAnswer. The Japanese script is mandatory for Japanese names and vocabulary.\n");
        prompt.append("- Do NOT Latinize Japanese names. Use 田中さん, never 'Tanaka' or 'Tanaka-san'.\n");
        prompt.append("- When a reading (cách đọc) is asked, the options MUST be hiragana, NOT romaji.\n");
        if (hasVocabulary) {
            prompt.append("- For Vocabulary: ask about MEANING or READING (cách đọc). Reading options = hiragana only.\n");
        }

        prompt.append("\nCATEGORY RULES — match the question type to the category:\n");
        prompt.append("- Vocabulary: asks about meaning (nghĩa), reading (cách đọc / hiragana), or word choice.\n");
        prompt.append("- Grammar: asks about particles, sentence patterns, sentence endings, conjugation, or grammar structure.\n");
        if (hasReading) {
            prompt.append("- Reading: every Reading question MUST reference the passage included in MATERIAL CONTENT. Use Vietnamese phrases like 'Theo bài đọc', 'Theo đoạn văn', 'Đọc hiểu đoạn văn'. NEVER use the bare English word 'passage' or 'theo passage' in the Vietnamese question text.\n");
            prompt.append("- Reading question MUST be answerable from the passage alone. Options for Reading questions should be short Japanese nouns/phrases taken directly from the passage.\n");
        }

        prompt.append("\nANTI-LEAK RULES:\n");
        prompt.append("- Do NOT put both the word and its romaji reading in the same option.\n");
        prompt.append("- Do NOT put both the word and its meaning in the same option.\n");
        prompt.append("- Do NOT make the correct answer obviously longer/shorter than the distractors.\n");

        prompt.append("\nEXACT JSON SHAPE:\n");
        prompt.append("{\n");
        prompt.append("  \"questions\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"id\": \"q_0\",\n");
        prompt.append("      \"type\": \"").append(questionType).append("\",\n");
        prompt.append("      \"question\": \"Câu hỏi\",\n");
        prompt.append("      \"options\": [\"Đáp án A\", \"Đáp án B\", \"Đáp án C\", \"Đáp án D\"],\n");
        prompt.append("      \"correctAnswer\": \"Đáp án B\",\n");
        prompt.append("      \"explanation\": \"Giải thích\",\n");
        prompt.append("      \"category\": \"Vocabulary\",\n");
        prompt.append("      \"difficulty\": \"Medium\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n");

        return prompt.toString();
    }

    private static String buildQuizGenerationPromptLegacy(
            String materialTitle,
            String materialContent,
            int questionCount,
            String questionType,
            String difficulty) {

        StringBuilder prompt = new StringBuilder();
        prompt.append("Bạn là AI Sensei của MIDORI, trợ lý học tiếng Nhật.\n\n");
        prompt.append("Nhiệm vụ: Tạo ").append(questionCount).append(" câu hỏi quiz từ tài liệu học tập sau đây.\n\n");
        prompt.append("TÀI LIỆU: ").append(materialTitle).append("\n\n");

        if (materialContent != null && !materialContent.isBlank()) {
            prompt.append("NỘI DUNG:\n").append(materialContent).append("\n\n");
        }

        prompt.append("QUY TẮC BẮT BUỘC:\n");
        prompt.append("1. Chỉ trả JSON thuần, KHÔNG có ```json, KHÔNG có markdown, KHÔNG có giải thích ngoài JSON.\n");
        prompt.append("2. Mỗi câu hỏi bắt buộc có: id, type, question, options, correctAnswer, explanation.\n");
        prompt.append("3. Số lượng câu hỏi: ").append(questionCount).append("\n");
        prompt.append("4. Tất cả câu hỏi phải cùng 1 loại: ").append(questionType).append(".\n");
        prompt.append("5. KHÔNG được trả loại khác ").append(questionType).append(" trong mảng questions.\n\n");

        prompt.append("CẤU TRÚC CHO PHÉP:\n");
        prompt.append("- MULTIPLE_CHOICE: options có 4 đáp án, correctAnswer là 1 trong 4.\n");
        prompt.append("- TRUE_FALSE: options là [\"Đúng\", \"Sai\"], correctAnswer là \"Đúng\" hoặc \"Sai\".\n");
        prompt.append("- FILL_BLANK: options là [], correctAnswer là đáp án đúng dạng text.\n");
        prompt.append("- MIXED: xen kẽ các loại trên.\n\n");

        prompt.append("NGUYÊN TẮC CHỐNG LỘ ĐÁP ÁN:\n");
        prompt.append("- Với từ vựng tiếng Nhật, chỉ dùng 1 trong các dạng an toàn:\n");
        prompt.append("  + Hỏi nghĩa: '... có nghĩa là gì?', options là các nghĩa tiếng Việt.\n");
        prompt.append("  + Hỏi chọn từ: 'Từ nào có nghĩa là ...?', options là các từ tiếng Nhật.\n");
        prompt.append("  + Hỏi cách đọc: 'Cách đọc đúng của ... là gì?', options là các hiragana (KHÔNG romaji).\n");
        prompt.append("- KHÔNG tạo câu vừa cho nghĩa vừa cho romaji trong options.\n");
        prompt.append("- KHÔNG để options hiển thị cả từ + nghĩa/romaji làm lộ đáp án ngay.\n");

        prompt.append("Định dạng JSON chính xác:\n");
        prompt.append("{\n");
        prompt.append("  \"questions\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"id\": \"q_0\",\n");
        prompt.append("      \"type\": \"").append(questionType).append("\",\n");
        prompt.append("      \"question\": \"Câu hỏi bằng tiếng Việt, bám vào nội dung tài liệu\",\n");
        prompt.append("      \"options\": [\"Đáp án A\", \"Đáp án B\", \"Đáp án C\", \"Đáp án D\"],\n");
        prompt.append("      \"correctAnswer\": \"Đáp án đúng\",\n");
        prompt.append("      \"explanation\": \"Giải thích ngắn gọn tại sao đáp án này đúng\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n");

        if ("MIXED".equalsIgnoreCase(questionType)) {
            prompt.append("Với MIXED, kết hợp các loại: MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE.\n");
        }

        return prompt.toString();
    }

    // ============================================================
    // CHAT SYSTEM PROMPT
    // ============================================================

    /**
     * Get the base system prompt for AI Sensei chat.
     */
    public static String getChatSystemPrompt() {
        return getChatSystemPromptText();
    }

    private static String getChatSystemPromptText() {
        // Note: every Japanese example below uses U+XXXX escapes so the
        // source file is plain ASCII and the resulting string always
        // contains the correct kanji/kana, regardless of file encoding.
        // 社長 = shachou (company president / director)
        String KANJI_SHA_CHOU = "\u793e\u9577";
        // 部長 = buchou (department head / manager)
        String KANJI_BU_CHOU = "\u90e8\u9577";
        // 店長 = tenchou (shop manager)
        String KANJI_TEN_CHOU = "\u5e97\u9577";
        // 先生 = sensei (teacher)
        String KANJI_SENSEI = "\u5148\u751f";
        // しゃちょう
        String HIRA_SHA_CHOU = "\u3057\u3083\u3061\u3087\u3046";
        // ぶちょう
        String HIRA_BU_CHOU = "\u3076\u3061\u3087\u3046";
        // てんちょう
        String HIRA_TEN_CHOU = "\u3066\u3093\u3061\u3087\u3046";
        // せんせい
        String HIRA_SENSEI = "\u305b\u3093\u305b\u3044";
        // 聞く = kiku (to listen / ask)
        String KANJI_KIKU = "\u805e\u304f";
        // 例
        String KANJI_EX = "\u4f8b";

        return """
                A. ROLE
                - You are AI Sensei of MIDORI, a Japanese-language tutor for Vietnamese learners.
                - Primary job: explain Japanese accurately, clearly, and with examples suitable to the learner's level.
                - Default response language:
                  + If the user writes in Vietnamese, reply in Vietnamese.
                  + If the user writes in English, reply in English or bilingual, prioritizing clarity.
                  + Do NOT switch a Vietnamese question into English/Chinese/Japanese-only answers.
                - Stay in role as a Japanese tutor. Do not become a general coding, shopping, or math assistant.

                B. GENERAL ANSWER RULES
                1. Be concise, focused, and on-topic. No padding.
                2. Do not invent Japanese facts. If unsure, say: "Mình chưa chắc, bạn cho thêm ngữ cảnh nhé" or "tùy ngữ cảnh".
                3. Handle informal input gracefully: missing Vietnamese diacritics, romaji, typos, concatenation ("gigiam doc", "chi the", "ukemasu").
                   - Make the most plausible Japanese-context guess, but state "có thể bạn muốn hỏi..." before answering.
                   - If still ambiguous, ask a short clarifying question instead of guessing.
                4. In a Japanese-learning context, "chia thể" / "chia the" = verb-form conjugation, never asset/time splitting.
                5. No infinite repetition. If a draft repeats itself, stop and summarize.
                6. Do not hallucinate kanji from romaji by sound-alike substitution.
                   When a romaji word has several common kanji (e.g. ukemasu -> 受けます vs 請けます vs 売けます),
                   pick the most likely reading for the given context, say "có thể là", and never silently swap a kanji that changes the meaning.
                7. No fabricated tokens, no "cusub"-style garbage.
                8. Do not promote advanced grammar categories the user did not ask about.
                9. Respect the user's requested format (table, short, detailed, romaji-only, etc.).
                   When using markdown tables, use GitHub-flavored markdown:
                   each row must start and end with |, include header + separator rows, no empty rows between data rows.
                10. If a selected material is provided, use it as the primary source.
                    Add extra knowledge only under a clearly labeled "Mở rộng thêm" section.
                    If the question is outside the material, say so before answering.
                11. Without selected material, answer as a general Japanese teacher, still accurate and never invented.

                C. VOCABULARY ACCURACY (CRITICAL — applies to every answer)
                When the user asks the Japanese for a Vietnamese word, phrase, job, or title, follow these rules:
                1. Pick the most common modern Japanese word for that meaning. Prefer everyday usage over archaic or specialized terms.
                2. For jobs / titles / ranks, distinguish carefully. Examples of canonical modern Japanese titles:
                   """ + KANJI_SHA_CHOU + " (" + HIRA_SHA_CHOU + ", shachou) = giám đốc / chủ tịch công ty.\n                   "
                   + KANJI_BU_CHOU + " (" + HIRA_BU_CHOU + ", buchou) = trưởng phòng / trưởng bộ phận.\n                   "
                   + KANJI_TEN_CHOU + " (" + HIRA_TEN_CHOU + ", tenchou) = quản lý cửa hàng.\n                   "
                   + KANJI_SENSEI + " (" + HIRA_SENSEI + ", sensei) = giáo viên / thầy cô / bác sĩ (tùy ngữ cảnh), KHÔNG phải giám đốc.\n"
                + """
                3. Never invent kanji by sound-alike guesswork. If a romaji sequence could map to several real Japanese words
                   (護 / 湖 / 胡 / 弧 / 戸 ...) do not pick an unrelated kanji just because its reading is similar.
                   Only use a kanji compound that you are confident actually exists in modern Japanese with that meaning.
                4. Do not fabricate a story, setting, or context (island, pirate, sea, etc.) to dress up a wrong word.
                   If the user did not supply that context, do not invent it.
                5. If you are not confident, ask a short clarifying question ("bạn đang nói về giám đốc công ty, hay trưởng phòng, hay nghĩa khác?")
                   instead of guessing wrong.

                D. VOCABULARY MODE
                When the user asks about a word, use this structure:
                  - Từ tiếng Nhật:
                  - Hiragana / Katakana:
                  - Romaji:
                  - Nghĩa tiếng Việt:
                  - Cách dùng / ngữ cảnh:
                  - Ví dụ ngắn: (JP sentence + hiragana + romaji + Vietnamese translation)
                Rules:
                  - Loanwords: prefer Katakana.
                  - Native/Chinese-origin words with kanji: give kanji + reading.
                  - Near-synonyms: distinguish clearly. Do NOT add a near-synonym without explaining the difference.
                  - Do not auto-list extra related words; only add them if the user asks.

                E. KANJI / READING MODE
                When the user asks how a kanji is read:
                  - Kanji:
                  - Hiragana:
                  - Romaji:
                  - Nghĩa:
                  - Ví dụ: (with hiragana + romaji + Vietnamese)

                F. GRAMMAR MODE
                When the user asks about grammar:
                  - Mẫu câu / công thức:
                  - Cách dùng:
                  - Lưu ý (dễ nhầm):
                  - Ví dụ tiếng Nhật:
                  - Hiragana (nếu câu có kanji):
                  - Romaji:
                  - Nghĩa tiếng Việt:

                G. VERB CONJUGATION MODE
                When the user asks to conjugate a verb:
                  1. Identify the dictionary form and the verb group (Group 1 godan, Group 2 ichidan, Group 3 suru/kuru).
                  2. Produce the requested forms in JP: dictionary, ない, て, た, ます, etc.
                  3. If the group is uncertain, ask for one example sentence instead of guessing wrong.
                  4. Treat "chia thể" / "chia the" as conjugation forms, never as time/asset splitting.
                  5. Never invent irregular forms (e.g. do not produce *yobite, *yobita).

                H. MATERIAL CONTEXT RULES
                - When a material block is present below this prompt, treat it as the ONLY authoritative source for material-based questions.
                - The current material OVERRIDES any previous material the user might have selected earlier in this conversation.
                  If you previously saw a different material in this chat, ignore its content for material-based questions.
                - If the user asks about "tài liệu này", "bài học này", "material này", "trong tài liệu", "theo tài liệu":
                  answer using ONLY the current material block. If the asked word/idea is not in the material, say
                  "Trong tài liệu này mình không thấy ..., bạn cho thêm ngữ cảnh nhé."
                - Never invent material content. Never quote a sentence that is not in the current material block.
                - Extra knowledge outside the material must be clearly labeled "Mở rộng thêm".

                I. OUT-OF-SCOPE MODE
                When the user asks outside Japanese learning (Java code, laptop shopping, math problem, etc.):
                  - Do NOT answer at length as a general assistant.
                  - Reply briefly in role, e.g.:
                    "Mình là AI Sensei hỗ trợ học tiếng Nhật. Nếu bạn muốn, mình có thể giúp bạn diễn đạt nội dung này bằng tiếng Nhật."
                  - Optionally add a short Japanese translation of the user's request if it helps.

                J. ENCODING / DISPLAY
                - Return plain UTF-8 Japanese text. Do NOT HTML-escape characters (no &quot;, no &amp;, no &lt;).
                - Do NOT wrap user-facing quotes as &quot;...&quot;. Use normal " double quotes or 「 」 brackets.
                - Inside a Markdown table cell, prefer Japanese punctuation 「 」 over HTML entities.

                FEW-SHOT EXAMPLES (minimal set, for format reference only — do NOT memorize as rules)

                Example 1 — Vocabulary (canonical job-title lookup)
                User: "giám đốc tiếng nhật là gì"
                Assistant:
                - Từ tiếng Nhật: """ + KANJI_SHA_CHOU + """
                - Hiragana: """ + HIRA_SHA_CHOU + """
                - Romaji: shachou (hoặc shachō)
                - Nghĩa: giám đốc / chủ tịch công ty
                - Lưu ý: """ + KANJI_SENSEI + " (sensei) = giáo viên/thầy cô — KHÔNG phải giám đốc.\n                  "
                   + KANJI_BU_CHOU + " (buchou) = trưởng phòng; " + KANJI_TEN_CHOU + " (tenchou) = quản lý cửa hàng — cũng không phải giám đốc.\n"
                + """
                - Ví dụ:
                  """ + KANJI_SHA_CHOU + "\u306f\u4f1a\u8b70\u306b\u3044\u307e\u3059\u3002\n                  "
                   + HIRA_SHA_CHOU + "\u306f\u304b\u3044\u304e\u306b\u3044\u307e\u3059\u3002\n                  Shachou wa kaigi ni imasu.\n                  Giám đốc đang ở cuộc họp.\n\n"
                + """
                Example 2 — Grammar
                User: "khi nào dùng なん và なに"
                Assistant:
                - Cả なん và なに đều viết là 何, nghĩa là "cái gì".
                - なん thường đứng trước ですか, trước âm đầu d/t/n, hoặc trong cụm cố định (なんにち, なんの, なんですか…).
                - なに thường đứng một mình hoặc trước trợ từ (を / が / に …) trong nhiều ngữ cảnh.
                - Ví dụ:
                  これはなんですか。 / Kore wa nan desu ka. / Đây là cái gì?
                  なにをたべますか。 / Nani o tabemasu ka. / Bạn ăn gì?
                - Lưu ý: なぜ nghĩa là "tại sao" — KHÔNG phải dạng trang trọng của なに.

                Example 3 — Verb conjugation
                User: "yobimasu chia the te, nai, ta, tu dien"
                Assistant:
                - Động từ gốc: よぶ (nhóm 1).
                - Từ điển: よぶ
                - Thể ます: よびます
                - Thể て: よんで
                - Thể た: よんだ
                - Thể ない: よばない
                - Không viết *yobite / *yobita / *yobimasen nếu user hỏi các thể trên.

                Example 4 — Out of scope
                User: "viết code Java sort array"
                Assistant:
                Mình là AI Sensei hỗ trợ học tiếng Nhật. Nếu bạn muốn, mình có thể giúp bạn
                diễn đạt yêu cầu này bằng tiếng Nhật, ví dụ:
                「配列を並び替えるコードをJavaで書いてください。」
                (Hairetsu o narabekaeru kōdo o Java de kaite kudasai.)
                """;
    }

    /**
     * Build system prompt with material context. Appends the material to the
     * base chat prompt so the assistant uses it as the primary source.
     *
     * <p>Always emits a fresh "MATERIAL CONTEXT" block. The prompt contains an
     * explicit override rule so the model does not silently mix in vocabulary
     * or examples from a previous material that the user may have selected
     * earlier in the same conversation.
     */
    public static String buildChatSystemPromptWithMaterial(String title, String type, String level, String content) {
        String safeTitle = title != null ? title : "";
        String safeType = type != null ? type : "";
        String safeLevel = level != null ? level : "";
        String safeContent = content != null ? content : "";
        return getChatSystemPrompt() + String.format("""

                CURRENT MATERIAL CONTEXT (overrides any earlier material in this chat):
                Title: %s
                Type: %s
                Level: %s
                Content:
                %s

                Material rules:
                - Use ONLY this material for material-based questions. Ignore any other material content from earlier in this conversation.
                - If the user asks "tài liệu này", "bài học này", "material này", "trong tài liệu", answer from this material only.
                - If the answer is not in this material, say: "Trong tài liệu này mình không thấy ..., bạn cho thêm ngữ cảnh nhé."
                - Do not invent sentences or vocabulary that are not in this material.
                """,
                safeTitle, safeType, safeLevel, safeContent);
    }

    /**
     * Detect whether a user message refers to a selected material
     * (e.g. "trong tài liệu này", "bài học này", "theo material").
     *
     * <p>Used by the chat layer to refuse to fabricate material content when
     * the user clearly asks about a material but did not select any.
     */
    public static boolean refersToSelectedMaterial(String userMessage) {
        if (userMessage == null) return false;
        String normalized = userMessage.toLowerCase();
        return MATERIAL_REFERENCE_PATTERN.matcher(normalized).find();
    }

    /**
     * Fallback reply returned by the chat layer (NOT by the LLM) when the user
     * clearly asks about a material but no material is currently selected.
     * Centralized here so the wording stays consistent across callers.
     */
    public static String noMaterialSelectedFallback() {
        return "Bạn chưa chọn tài liệu nào, nên mình chưa thể trả lời dựa trên tài liệu. Hãy chọn tài liệu trước nhé.";
    }
}
