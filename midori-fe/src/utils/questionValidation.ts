import { BuilderQuestion } from "../types/question";

export const validateBuilderQuestion = (q: BuilderQuestion): string[] => {
  const errors: string[] = [];

  if (!q.content.trim()) {
    errors.push("Question content text is empty");
  }

  if (q.points !== undefined && q.points < 0) {
    errors.push("Points must be greater than or equal to 0");
  }

  switch (q.type) {
    case "MULTIPLE_CHOICE":
      if (q.answers.length < 2) {
        errors.push("Multiple choice question needs at least 2 options");
      }
      const correctCount = q.answers.filter((a) => a.isCorrect).length;
      if (correctCount !== 1) {
        errors.push(`Multiple choice question requires exactly 1 correct answer (currently selected: ${correctCount})`);
      }
      if (q.answers.some((a) => !a.content.trim())) {
        errors.push("All options must have content");
      }
      break;

    case "TRUE_FALSE":
      if (q.answers.length !== 2) {
        errors.push("True/False question must have exactly 2 options (True and False)");
      }
      const tfCorrect = q.answers.filter((a) => a.isCorrect).length;
      if (tfCorrect !== 1) {
        errors.push("True/False question must select either True or False as correct");
      }
      break;

    case "FILL_BLANK":
      const correctBlank = q.answers.find((a) => a.isCorrect);
      if (!correctBlank || !correctBlank.content.trim()) {
        errors.push("Fill blank question correct answer is required");
      }
      break;

    case "MATCHING":
      if (q.answers.length < 1) {
        errors.push("Matching question must have at least one matching pair");
      }
      if (q.answers.some((a) => !a.content.trim())) {
        errors.push("All matching pairs must have content");
      }
      break;
  }

  return errors;
};
