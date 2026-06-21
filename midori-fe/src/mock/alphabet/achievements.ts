// Alphabet Learning Achievements

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: {
    type: "characters_learned" | "lessons_completed" | "quiz_score" | "streak" | "alphabet_complete";
    count: number;
  };
}

export const achievements: Achievement[] = [
  {
    id: "first-character",
    title: "First Steps",
    description: "Learn your first Japanese character",
    icon: "🌸",
    requirement: { type: "characters_learned", count: 1 },
  },
  {
    id: "ten-characters",
    title: "Character Explorer",
    description: "Learn 10 Japanese characters",
    icon: "📚",
    requirement: { type: "characters_learned", count: 10 },
  },
  {
    id: "fifty-characters",
    title: "Halfway There",
    description: "Learn 50 Japanese characters",
    icon: "🎯",
    requirement: { type: "characters_learned", count: 50 },
  },
  {
    id: "hundred-characters",
    title: "Character Master",
    description: "Learn 100 Japanese characters",
    icon: "🏆",
    requirement: { type: "characters_learned", count: 100 },
  },
  {
    id: "first-lesson",
    title: "Lesson Beginner",
    description: "Complete your first lesson",
    icon: "🎓",
    requirement: { type: "lessons_completed", count: 1 },
  },
  {
    id: "three-lessons",
    title: "Dedicated Learner",
    description: "Complete 3 lessons",
    icon: "📖",
    requirement: { type: "lessons_completed", count: 3 },
  },
  {
    id: "seven-lessons",
    title: "Alphabet Apprentice",
    description: "Complete all 7 lessons",
    icon: "🌟",
    requirement: { type: "lessons_completed", count: 7 },
  },
  {
    id: "perfect-quiz",
    title: "Perfect Score",
    description: "Get 100% on a quiz",
    icon: "💯",
    requirement: { type: "quiz_score", count: 100 },
  },
  {
    id: "high-score",
    title: "High Achiever",
    description: "Score 90% or higher on 5 quizzes",
    icon: "⭐",
    requirement: { type: "quiz_score", count: 90 },
  },
  {
    id: "streak-3",
    title: "Getting Started",
    description: "Study for 3 days in a row",
    icon: "🔥",
    requirement: { type: "streak", count: 3 },
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Study for 7 days in a row",
    icon: "🗓️",
    requirement: { type: "streak", count: 7 },
  },
  {
    id: "streak-30",
    title: "Monthly Master",
    description: "Study for 30 days in a row",
    icon: "👑",
    requirement: { type: "streak", count: 30 },
  },
  {
    id: "hiragana-complete",
    title: "Hiragana Master",
    description: "Complete all Hiragana lessons",
    icon: "あ",
    requirement: { type: "alphabet_complete", count: 3 },
  },
  {
    id: "katakana-complete",
    title: "Katakana Master",
    description: "Complete all Katakana lessons",
    icon: "ア",
    requirement: { type: "alphabet_complete", count: 4 },
  },
  {
    id: "alphabet-complete",
    title: "Alphabet Expert",
    description: "Complete all lessons in both alphabets",
    icon: "🎌",
    requirement: { type: "alphabet_complete", count: 7 },
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find((a) => a.id === id);
}

export function checkAchievements(unlockedIds: string[]): Achievement[] {
  return achievements.filter((a) => !unlockedIds.includes(a.id));
}

export default achievements;
