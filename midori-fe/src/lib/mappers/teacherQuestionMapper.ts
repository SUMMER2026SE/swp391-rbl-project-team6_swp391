import type { Skill, Difficulty } from "@/data/teacher-data";
import type { TeacherQuestionResponse } from "@/lib/api/teacherQuestions";
import type { MockQuestion } from "@/data/mockQuestions";

export const mapDifficulty = (d: string): Difficulty => {
  const norm = d.toUpperCase();
  if (norm === "EASY") return "Easy";
  if (norm === "HARD") return "Hard";
  return "Medium";
};

export const mapSkill = (s: string): Skill => {
  const norm = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const validSkills: Skill[] = ["Vocabulary", "Grammar", "Listening", "Reading", "Shadowing", "Writing"];
  if (validSkills.includes(norm as Skill)) {
    return norm as Skill;
  }
  return "Vocabulary";
};

export function mapTeacherQuestionToViewModel(q: TeacherQuestionResponse): MockQuestion {
  return {
    id: q.id,
    title: q.prompt.length > 30 ? q.prompt.slice(0, 30) + "..." : q.prompt,
    type: q.questionType === "Grammar" ? "Multiple Choice" : q.questionType,
    level: "N5", // fallback default
    skill: mapSkill(q.questionType),
    difficulty: mapDifficulty(q.difficulty),
    content: q.prompt,
    choices: q.options,
    correctAnswer: q.options[q.correctAnswerIndex] || "",
    explanation: q.explanation || "",
    tags: q.tags ? q.tags.split(",") : [],
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    usageCount: 0,
    status: q.status.toUpperCase() === "ARCHIVED" ? "Archived" : "Active"
  };
}
