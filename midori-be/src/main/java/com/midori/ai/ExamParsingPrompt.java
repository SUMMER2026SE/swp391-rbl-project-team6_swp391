package com.midori.ai;

public final class ExamParsingPrompt {

    private ExamParsingPrompt() {}

    public static String buildPrompt(String extractedText, String filename) {
        return """
                You are an expert exam parser. Your task is to analyze exam content extracted from a PDF
                and convert it into a structured JSON format.

                ## INSTRUCTIONS

                1. Parse ALL questions found in the provided text. Be thorough — do not skip questions.
                2. Identify the EXAM TITLE from the document (e.g., "N3 Midterm Grammar Exam", "JLPT Practice Test").
                   If no title is found, generate a descriptive one based on the content.
                3. Identify question types: MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, SHORT_ANSWER.
                4. For MULTIPLE_CHOICE questions: extract all options (A, B, C, D or more) and identify the correct answer.
                5. For TRUE_FALSE questions: set type="TRUE_FALSE" and include exactly 2 options: "True" and "False".
                6. For FILL_IN_BLANK: set type="FILL_IN_BLANK", put the answer in the first option slot.
                7. Detect difficulty if indicated (Easy/Medium/Hard), otherwise default to MEDIUM.
                8. Extract explanations if present in the document.
                9. Return ONLY valid JSON. No markdown, no code fences, no explanations.
                10. The JSON must be parseable by a standard JSON parser.

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

                ## IMPORTANT RULES

                - NEVER return anything other than valid JSON.
                - Do NOT wrap the JSON in markdown code fences.
                - Each answer must have exactly one "isCorrect": true.
                - All MULTIPLE_CHOICE questions must have at least 2 options.
                - If an answer key is found at the end of the document, use it to match answers to questions.
                - For ambiguous questions, default to MULTIPLE_CHOICE with MEDIUM difficulty.
                - Questions about Japanese language (kanji, grammar, vocabulary) are common — handle Japanese text properly.
                - The content field should contain the full question text.

                ## SOURCE DOCUMENT

                Filename: %s

                Extracted text below (may contain OCR artifacts, page markers, or scan artifacts — infer meaning from context):
                """.formatted(filename) + "\n\n" + extractedText;
    }
}
