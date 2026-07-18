import { BuilderQuestion, QuestionType, QuestionDifficulty, QuestionSkill } from "../types/question";

export const mapToBuilderQuestion = (q: any): BuilderQuestion => {
  const typeMap: Record<string, QuestionType> = {
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    TRUE_FALSE: "TRUE_FALSE",
    FILL_BLANK: "FILL_BLANK",
    MATCHING: "MATCHING",
  };

  const difficultyMap: Record<string, QuestionDifficulty> = {
    EASY: "EASY",
    MEDIUM: "MEDIUM",
    HARD: "HARD",
  };

  const skillMap: Record<string, QuestionSkill> = {
    Vocabulary: "Vocabulary",
    Grammar: "Grammar",
    Reading: "Reading",
    Listening: "Listening",
    Kanji: "Kanji",
  };

  // Convert answers list from options list if options exists
  let answers = q.answers || [];
  if (q.options && q.options.length > 0 && (!q.answers || q.answers.length === 0)) {
    answers = q.options.map((opt: string, index: number) => ({
      content: opt,
      isCorrect: q.correctAnswer === opt || String(index) === q.correctAnswer,
    }));
  }

  // If True/False and no answers
  if (q.questionType === "TRUE_FALSE" && answers.length === 0) {
    answers = [
      { content: "True", isCorrect: q.correctAnswer === "True" },
      { content: "False", isCorrect: q.correctAnswer === "False" },
    ];
  }

  return {
    id: q.id || `q-${crypto.randomUUID()}`,
    type: typeMap[q.questionType || q.type] || "MULTIPLE_CHOICE",
    content: q.content || q.prompt || "",
    difficulty: difficultyMap[q.difficulty] || "MEDIUM",
    explanation: q.explanation || "",
    answers: answers.map((a: any) => ({
      content: a.content || a.optionText || "",
      isCorrect: !!a.isCorrect,
    })),
    skill: skillMap[q.skill || q.category] || "Vocabulary",
    points: q.points || 1,
    imageUrl: q.imageUrl || "",
    needsReview: !!q.needsReview,
  };
};

export const mapToBackendQuestion = (q: BuilderQuestion, order: number) => {
  // Find correct answer content or index
  let correctAnswer = "";
  if (q.type === "TRUE_FALSE") {
    const correctAns = q.answers.find((a) => a.isCorrect);
    correctAnswer = correctAns ? correctAns.content : "True";
  } else if (q.type === "MULTIPLE_CHOICE") {
    const correctAns = q.answers.find((a) => a.isCorrect);
    correctAnswer = correctAns ? correctAns.content : (q.answers[0]?.content || "");
  } else if (q.type === "FILL_BLANK") {
    correctAnswer = q.answers[0]?.content || "";
  } else if (q.type === "MATCHING") {
    correctAnswer = q.answers.map((a) => a.content).join(" | "); // Match pairs joined
  }

  return {
    id: q.id.startsWith("extracted-") || q.id.startsWith("temp_") ? null : q.id,
    questionOrder: order,
    questionType: q.type,
    content: q.content,
    options: q.answers.map((a) => a.content),
    correctAnswer: correctAnswer,
    explanation: q.explanation || "",
    difficulty: q.difficulty,
    points: q.points || 1,
    skill: q.skill ? (q.skill.toUpperCase() as any) : "VOCABULARY",
    imageUrl: q.imageUrl || "",
  };
};
