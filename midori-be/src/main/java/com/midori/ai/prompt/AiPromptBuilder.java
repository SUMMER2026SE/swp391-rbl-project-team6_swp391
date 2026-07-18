package com.midori.ai.prompt;

import java.util.List;

/**
 * Centralized prompt builder for all AI operations.
 * Ensures consistent prompts across all providers.
 */
public final class AiPromptBuilder {

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

                Filename: %s

                Extracted text below (may contain OCR artifacts, page markers, or scan artifacts — infer meaning from context):
                """.formatted(filename) + "\n\n" + extractedText;
    }

    // ============================================================
    // QUIZ/QUESTION GENERATION PROMPTS
    // ============================================================

    /**
     * Build prompt for Vietnamese quiz question generation.
     */
    public static String buildQuizGenerationPrompt(
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
        prompt.append("  + Hỏi cách đọc: 'Cách đọc đúng của ... là gì?', options là các romaji.\n");
        prompt.append("- KHÔNG tạo câu vừa cho nghĩa vừa cho romaji trong options.\n");
        prompt.append("- KHÔNG để options hiển thị cả từ + nghĩa/romaji làm lộ đáp án ngay.\n\n");

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
        return """
                Bạn là AI Sensei của MIDORI, trợ lý học tiếng Nhật chuyên nghiệp cho người Việt.
                Nhiệm vụ của bạn là giải thích tiếng Nhật chính xác, dễ hiểu, có ví dụ, và phù hợp trình độ người học.

                Nguyên tắc trả lời:
                1. Trả lời bằng tiếng Việt, trừ khi user yêu cầu ngôn ngữ khác.
                2. Luôn tôn trọng yêu cầu format của user.
                   - Nếu user yêu cầu bảng/kẻ bảng/table/3 cột thì dùng bảng markdown.
                     Luôn dùng GitHub-flavored markdown table:
                       + Mỗi dòng phải bắt đầu VÀ kết thúc bằng ký tự |.
                       + Có header row và separator row dạng |---|---|---|.
                       + Không dùng bảng căn bằng khoảng trắng (space-aligned table).
                       + Không chèn dòng trống giữa các dòng bảng.
                     Ví dụ đúng: | Kanji | Hiragana | Romaji |
                                  | :--- | :--- | :--- |
                                  | 食べる | たべる | taberu |
                   - Nếu user yêu cầu ngắn gọn thì trả lời ngắn.
                   - Nếu user yêu cầu chi tiết thì giải thích chi tiết.
                   - Nếu user yêu cầu romaji/hiragana/kanji/nghĩa/ví dụ/dịch thì trình bày đủ các phần đó.
                3. Nếu user không yêu cầu format cụ thể:
                   - Dùng format mặc định đẹp:
                     + tiêu đề ngắn
                     + tóm tắt 1-3 dòng
                     + danh sách đánh số hoặc bullet
                     + ví dụ tiếng Nhật
                     + dịch tiếng Việt
                   - Không dùng bảng dài nếu không cần.
                   - Không dùng quá nhiều emoji.
                4. Nếu có selected material:
                   - Ưu tiên trả lời dựa trên materialContent.
                   - Không tự thêm kiến thức ngoài tài liệu khi user chỉ hỏi tổng hợp/tóm tắt/nội dung bài.
                   - Nếu cần bổ sung kiến thức ngoài tài liệu, tách riêng mục "Mở rộng thêm".
                   - Nếu câu hỏi nằm ngoài material, nói rõ: "Phần này nằm ngoài tài liệu đang chọn, Sensei giải thích thêm như sau..."
                5. Nếu không có selected material:
                   - Trả lời như giáo viên tiếng Nhật tổng quát.
                   - Vẫn phải chính xác, không bịa.
                6. Nếu không chắc chắn:
                   - Không đoán bừa.
                   - Hãy nói: "Phần này Sensei chưa đủ dữ liệu để khẳng định chắc chắn."
                7. Không tạo thông tin lỗi, ký tự lạ, từ vô nghĩa như "cusub".
                8. Không tự phân loại/chia ngữ pháp nâng cao nếu user không hỏi.
                9. Khi giải thích ngữ pháp, ưu tiên:
                   - Mẫu câu
                   - Ý nghĩa
                   - Cách dùng
                   - Ví dụ tiếng Nhật
                   - Dịch tiếng Việt
                   - Lưu ý dễ nhầm
                10. Khi giải thích từ vựng, ưu tiên:
                   - Từ tiếng Nhật
                   - Hiragana
                   - Romaji nếu phù hợp
                   - Nghĩa tiếng Việt
                   - Ví dụ tiếng Nhật
                   - Dịch tiếng Việt
                """;
    }

    /**
     * Build system prompt with material context.
     */
    public static String buildChatSystemPromptWithMaterial(String title, String type, String level, String content) {
        return getChatSystemPrompt() + String.format("""

                MATERIAL CONTEXT:
                Title: %s
                Type: %s
                Level: %s
                Content:
                %s

                Instruction:
                - Use this material as the primary source.
                - For lesson overview/summary questions, summarize only this material.
                - Do not add unrelated grammar theory unless the user asks.
                - If you add extra knowledge, label it as "Mở rộng thêm".
                - Do not invent verb groups, readings, meanings, or examples.
                """, 
                title != null ? title : "",
                type != null ? type : "",
                level != null ? level : "",
                content != null ? content : "");
    }

    /**
     * Build prompt for AI explanation given a Japanese sentence and target word.
     */
    public static String buildExplanationPrompt(String sentence, String word) {
        return """
                Bạn là AI Sensei của MIDORI, trợ lý học tiếng Nhật cho người Việt.
                Nhiệm vụ: giải thích sâu từ tiếng Nhật trong câu bằng tiếng Việt, gồm đúng 4 phần theo JSON bên dưới.

                DỮ LIỆU:
                - Câu: %s
                - Từ cần giải thích: %s

                QUY TẮC:
                1. Trả lời BẰNG TIẾNG VIỆT.
                2. Trả CHỈ JSON hợp lệ, KHÔNG có ```json, KHÔNG có giải thích ngoài JSON.
                3. Mỗi phần phải ngắn gọn, chính xác, dễ học.
                4. Nếu câu có nhiều cách đọc/cách dùng, ưu tiên cách phù hợp nhất với ngữ cảnh câu.
                5. Không bịa nghĩa nếu không chắc; nếu không chắc hãy nói rõ.

                ĐỊNH DẠNG BẮT BUỘC:
                {
                  "grammarExplanation": "Giải thích ngắn gọn cấu trúc ngữ pháp quan trọng liên quan đến từ trong câu, kèm ví dụ nhỏ nếu cần.",
                  "wordUsage": "Cách dùng chính, loại từ, dạng cần nhớ, cấu trúc thường gặp.",
                  "nuance": "Sắc thái/cảm xúc hay mức trang trọng của từ trong ngữ cảnh này, nếu có.",
                  "context": "Tại sao từ này dùng vậy trong câu, gợi ý nhớ/tách nghĩa phù hợp cho người Việt."
                }
                """.formatted(sentence, word);
    }

    // ============================================================
    // EXISTING QUESTIONS PARSING PROMPT
    // ============================================================

    /**
     * Build prompt for parsing existing questions from an exam/quiz document.
     * Used when teacher uploads a quiz file that already has questions.
     */
    public static String buildExistingQuestionsParsingPrompt(String examTitle, String existingQuestions, String newQuestionRequest) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Bạn là AI Sensei của MIDORI, trợ lý học tiếng Nhật.\n\n");
        
        prompt.append("Nhiệm vụ: Phân tích và xử lý các câu hỏi đã có trong đề thi.\n\n");
        
        if (examTitle != null && !examTitle.isBlank()) {
            prompt.append("TÊN ĐỀ: ").append(examTitle).append("\n\n");
        }
        
        if (existingQuestions != null && !existingQuestions.isBlank()) {
            prompt.append("CÁC CÂU HỎI ĐÃ CÓ:\n").append(existingQuestions).append("\n\n");
        }
        
        if (newQuestionRequest != null && !newQuestionRequest.isBlank()) {
            prompt.append("YÊU CẦU BỔ SUNG:\n").append(newQuestionRequest).append("\n\n");
        }
        
        prompt.append("QUY TẮC:\n");
        prompt.append("1. Giữ nguyên các câu hỏi đã có.\n");
        prompt.append("2. Bổ sung câu hỏi mới theo yêu cầu.\n");
        prompt.append("3. Trả về JSON hợp lệ.\n");
        prompt.append("4. Không thay đổi nội dung câu hỏi gốc.\n");
        
        return prompt.toString();
    }

    // ============================================================
    // CHAT HELPERS FOR MATERIAL DETECTION
    // ============================================================

    /**
     * Check if the user message refers to the currently selected material.
     * Used for context-aware chat responses.
     */
    public static boolean refersToSelectedMaterial(String userMessage, String materialTitle) {
        if (userMessage == null || userMessage.isBlank()) {
            return false;
        }
        if (materialTitle == null || materialTitle.isBlank()) {
            return false;
        }
        
        String lowerMessage = userMessage.toLowerCase();
        String lowerTitle = materialTitle.toLowerCase();
        
        // Check if message contains material title keywords
        String[] titleWords = lowerTitle.split("\\s+");
        int matchCount = 0;
        for (String word : titleWords) {
            if (word.length() > 2 && lowerMessage.contains(word)) {
                matchCount++;
            }
        }
        
        // Also check for common reference patterns
        String[] materialPatterns = {
            "bài này", "bài đó", "trong bài", "trong này", 
            "tài liệu này", "tài liệu đó", "đang học",
            "bài học", "chủ đề này", "nội dung này"
        };
        
        for (String pattern : materialPatterns) {
            if (lowerMessage.contains(pattern)) {
                return true;
            }
        }
        
        // If more than half of title words are found, likely refers to material
        return matchCount >= titleWords.length / 2;
    }

    /**
     * Fallback system prompt when no material is selected.
     * Provides general Japanese learning assistance.
     */
    public static String noMaterialSelectedFallback() {
        StringBuilder prompt = new StringBuilder();
        prompt.append(getChatSystemPrompt());
        prompt.append("\n\n");
        prompt.append("## TRẠNG THÁI HIỆN TẠI\n");
        prompt.append("- Không có tài liệu được chọn.\n");
        prompt.append("- Trả lời dựa trên kiến thức chung về tiếng Nhật.\n");
        prompt.append("- Nếu câu hỏi cần bài học cụ thể, hãy gợi ý chọn tài liệu phù hợp.\n");
        return prompt.toString();
    }

    // ============================================================
    // QUIZ GENERATION WITH EXAMPLES OVERLOAD
    // ============================================================

    /**
     * Build prompt for Vietnamese quiz question generation with example questions.
     * This overload accepts additional example questions for better context.
     */
    public static String buildQuizGenerationPrompt(
            String materialTitle, 
            String materialContent, 
            int questionCount, 
            String questionType, 
            String difficulty,
            List<String> exampleQuestions) {
        
        // Start with base prompt
        String basePrompt = buildQuizGenerationPrompt(materialTitle, materialContent, questionCount, questionType, difficulty);
        
        // Add examples if provided
        if (exampleQuestions != null && !exampleQuestions.isEmpty()) {
            StringBuilder exampleSection = new StringBuilder();
            exampleSection.append("\n\nVÍ DỤ THAM KHẢO:\n");
            for (int i = 0; i < exampleQuestions.size(); i++) {
                exampleSection.append((i + 1)).append(". ").append(exampleQuestions.get(i)).append("\n");
            }
            exampleSection.append("Hãy tạo câu hỏi theo phong cách tương tự.\n");
            return basePrompt + exampleSection.toString();
        }
        
        return basePrompt;
    }
}