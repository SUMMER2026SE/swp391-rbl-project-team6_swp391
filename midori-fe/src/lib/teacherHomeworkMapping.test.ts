/**
 * Unit tests for teacherHomeworkMapping.ts
 * Run with: npx tsx teacherHomeworkMapping.test.ts
 */
import {
  mapTeacherQuestionResponsesToBuilderQuestions,
  mapBuilderQuestionToRequest,
} from "./teacherHomeworkMapping";
import type { TeacherQuestionResponse } from "@/lib/api/teacherQuestions";

const mockTeacherQuestionResponse = (overrides: Partial<TeacherQuestionResponse> = {}): TeacherQuestionResponse => ({
  id: "550e8400-e29b-41d4-a716-446655440000",
  teacherId: "teacher-1",
  topicId: "topic-1",
  level: "N5",
  skill: "VOCABULARY",
  lessonId: 1,
  prompt: "What is the meaning of 学校?",
  source: "HOMEWORK",
  jpPrompt: "",
  questionType: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  correctAnswerIndex: 0,
  explanation: "School in Japanese",
  tags: "school,vocabulary",
  status: "ACTIVE",
  points: 2,
  options: ["School", "Hospital", "Library", "Park"],
  audioUrl: undefined,
  audioFileName: undefined,
  audioDuration: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // No metadata by default (flat structure)
  translationMetadata: undefined,
  sentenceWritingMetadata: undefined,
  errorCorrectionMetadata: undefined,
  matchingMetadata: undefined,
  ...overrides,
});

describe("mapTeacherQuestionResponsesToBuilderQuestions", () => {
  describe("basic fields", () => {
    it("maps basic MCQ fields correctly", () => {
      const res = mockTeacherQuestionResponse({
        questionType: "MULTIPLE_CHOICE",
        difficulty: "HARD",
        skill: "GRAMMAR",
      });
      const [bq] = mapTeacherQuestionResponsesToBuilderQuestions([res]);

      expect(bq.id).toBe("bank-q-550e8400-e29b-41d4-a716-446655440000");
      expect(bq.type).toBe("MULTIPLE_CHOICE");
      expect(bq.content).toBe("What is the meaning of 学校?");
      expect(bq.difficulty).toBe("HARD");
      expect(bq.skill).toBe("Grammar");
      expect(bq.explanation).toBe("School in Japanese");
      expect(bq.needsReview).toBe(false);
    });

    it("defaults difficulty to MEDIUM when missing", () => {
      const res = mockTeacherQuestionResponse({ difficulty: undefined });
      const [bq] = mapTeacherQuestionResponsesToBuilderQuestions([res]);
      expect(bq.difficulty).toBe("MEDIUM");
    });

    it("defaults skill to Vocabulary when missing", () => {
      const res = mockTeacherQuestionResponse({ skill: undefined });
      const [bq] = mapTeacherQuestionResponsesToBuilderQuestions([res]);
      expect(bq.skill).toBe("Vocabulary");
    });

    it("builds answers with correct isCorrect flag", () => {
      const res = mockTeacherQuestionResponse({
        options: ["猫", "犬", "鳥"],
        correctAnswerIndex: 1,
      });
      const [bq] = mapTeacherQuestionResponsesToBuilderQuestions([res]);
      expect(bq.answers).toEqual([
        { content: "猫", isCorrect: false },
        { content: "犬", isCorrect: true },
        { content: "鳥", isCorrect: false },
      ]);
    });
  });

  describe("translationMetadata round-trip", () => {
    it("restores translationMetadata from response", () => {
      const res = mockTeacherQuestionResponse({
        questionType: "TRANSLATION",
        skill: "VOCABULARY",
        translationMetadata: {
          direction: "JA_TO_VI",
          sourceText: "学校",
          referenceAnswer: "Trường học",
          acceptedAnswers: ["Trường học", "Trường"],
          sourceLanguage: "Japanese",
          targetLanguage: "Vietnamese",
        } as any,
      });
      const [bq] = mapTeacherQuestionResponsesToBuilderQuestions([res]);

      expect(bq.translationMetadata).toBeDefined();
      expect(bq.translationMetadata?.direction).toBe("JA_TO_VI");
      expect(bq.translationMetadata?.sourceText).toBe("学校");
      expect(bq.translationMetadata?.referenceAnswer).toBe("Trường học");
      expect(bq.translationMetadata?.acceptedAnswers).toEqual(["Trường học", "Trường"]);
      expect(bq.translationMetadata?.sourceLanguage).toBe("Japanese");
      expect(bq.translationMetadata?.targetLanguage).toBe("Vietnamese");
    });

    it("does not set translationMetadata when undefined", () => {
      const res = mockTeacherQuestionResponse({ translationMetadata: undefined });
      const [bq] = mapTeacherQuestionResponsesToBuilderQuestions([res]);
      expect(bq.translationMetadata).toBeUndefined();
    });
  });

  describe("sentenceWritingMetadata round-trip", () => {
    it("restores sentenceWritingMetadata from response", () => {
      const res = mockTeacherQuestionResponse({
        questionType: "SENTENCE_WRITING",
        skill: "WRITING",
        sentenceWritingMetadata: {
          requiredVocabulary: ["学校", "行く"],
          requiredGrammar: ["〜に行く"],
          referenceAnswer: "私は学校に行きます。",
          acceptedAnswers: ["私は学校に行きます。"],
          rubric: "Correct grammar and vocabulary usage",
          prompt: "Write a sentence about going to school",
        } as any,
      });
      const [bq] = mapTeacherQuestionResponsesToBuilderQuestions([res]);

      expect(bq.sentenceWritingMetadata).toBeDefined();
      expect(bq.sentenceWritingMetadata?.requiredVocabulary).toEqual(["学校", "行く"]);
      expect(bq.sentenceWritingMetadata?.requiredGrammar).toEqual(["〜に行く"]);
      expect(bq.sentenceWritingMetadata?.referenceAnswer).toBe("私は学校に行きます。");
      expect(bq.sentenceWritingMetadata?.rubric).toBe("Correct grammar and vocabulary usage");
      expect(bq.sentenceWritingMetadata?.prompt).toBe("Write a sentence about going to school");
    });
  });

  describe("errorCorrectionMetadata round-trip", () => {
    it("restores errorCorrectionMetadata from response", () => {
      const res = mockTeacherQuestionResponse({
        questionType: "ERROR_CORRECTION",
        skill: "WRITING",
        errorCorrectionMetadata: {
          incorrectText: "私は 学校に 行きます。",
          correctedText: "私は学校に行きます。",
          explanation: "No spaces needed within a word",
          errorType: "Spacing",
        } as any,
      });
      const [bq] = mapTeacherQuestionResponsesToBuilderQuestions([res]);

      expect(bq.errorCorrectionMetadata).toBeDefined();
      expect(bq.errorCorrectionMetadata?.incorrectText).toBe("私は 学校に 行きます。");
      expect(bq.errorCorrectionMetadata?.correctedText).toBe("私は学校に行きます。");
      expect(bq.errorCorrectionMetadata?.explanation).toBe("No spaces needed within a word");
      expect(bq.errorCorrectionMetadata?.errorType).toBe("Spacing");
    });
  });

  describe("matchingMetadata round-trip", () => {
    it("restores matchingMetadata from response", () => {
      const res = mockTeacherQuestionResponse({
        questionType: "MATCHING",
        matchingMetadata: {
          leftItems: ["学校", "先生", "学生"],
          rightItems: ["School", "Teacher", "Student"],
          correctPairs: [
            { leftIndex: 0, rightIndex: 0 },
            { leftIndex: 1, rightIndex: 1 },
            { leftIndex: 2, rightIndex: 2 },
          ],
        } as any,
      });
      const [bq] = mapTeacherQuestionResponsesToBuilderQuestions([res]);

      expect(bq.matchingMetadata).toBeDefined();
      expect(bq.matchingMetadata?.leftItems).toEqual(["学校", "先生", "学生"]);
      expect(bq.matchingMetadata?.rightItems).toEqual(["School", "Teacher", "Student"]);
      expect(bq.matchingMetadata?.correctPairs).toEqual([
        { leftIndex: 0, rightIndex: 0 },
        { leftIndex: 1, rightIndex: 1 },
        { leftIndex: 2, rightIndex: 2 },
      ]);
    });
  });

  describe("multiple questions", () => {
    it("maps multiple questions with different metadata", () => {
      const q1 = mockTeacherQuestionResponse({ id: "q1", questionType: "MULTIPLE_CHOICE" });
      const q2 = mockTeacherQuestionResponse({
        id: "q2",
        questionType: "TRANSLATION",
        translationMetadata: {
          direction: "JA_TO_VI",
          sourceText: "猫",
          referenceAnswer: "Con mèo",
          acceptedAnswers: ["Con mèo"],
          sourceLanguage: "Japanese",
          targetLanguage: "Vietnamese",
        } as any,
      });
      const q3 = mockTeacherQuestionResponse({
        id: "q3",
        questionType: "ERROR_CORRECTION",
        errorCorrectionMetadata: {
          incorrectText: "错误的句子",
          correctedText: "正确的句子",
          explanation: "Fix the error",
        } as any,
      });

      const results = mapTeacherQuestionResponsesToBuilderQuestions([q1, q2, q3]);

      expect(results).toHaveLength(3);
      expect(results[0].translationMetadata).toBeUndefined();
      expect(results[1].translationMetadata?.direction).toBe("JA_TO_VI");
      expect(results[2].errorCorrectionMetadata?.incorrectText).toBe("错误的句子");
    });
  });
});

describe("mapBuilderQuestionToRequest", () => {
  it("uppercases skill and difficulty in the request", () => {
    const result = mapBuilderQuestionToRequest(
      {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        content: "Test?",
        difficulty: "easy",
        answers: [{ content: "A", isCorrect: true }],
        skill: "Vocabulary",
      } as any,
      "N5",
      "EXAM"
    );

    expect(result.skill).toBe("VOCABULARY");
    expect(result.difficulty).toBe("EASY");
    expect(result.source).toBe("EXAM");
    expect(result.level).toBe("N5");
  });

  it("passes format metadata through as-is", () => {
    const result = mapBuilderQuestionToRequest(
      {
        id: "q1",
        type: "TRANSLATION",
        content: "Translate",
        difficulty: "MEDIUM",
        answers: [{ content: "Answer", isCorrect: true }],
        translationMetadata: {
          direction: "JA_TO_VI",
          sourceText: "学校",
          referenceAnswer: "School",
          sourceLanguage: "Japanese",
          targetLanguage: "Vietnamese",
        },
      } as any,
      "N5",
      "HOMEWORK"
    );

    expect(result.translationMetadata).toBeDefined();
    expect((result.translationMetadata as any).direction).toBe("JA_TO_VI");
  });
});
