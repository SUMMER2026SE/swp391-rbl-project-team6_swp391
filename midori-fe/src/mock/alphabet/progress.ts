// Alphabet Learning Progress System - Frontend only with localStorage

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score: number;
  attempts: number;
  lastAttempt: string;
  charactersLearned: string[];
  masteredCharacters: string[];
}

export interface AlphabetProgress {
  hiraganaBasic: LessonProgress;
  hiraganaDakuten: LessonProgress;
  hiraganaCombination: LessonProgress;
  katakanaBasic: LessonProgress;
  katakanaDakuten: LessonProgress;
  katakanaCombination: LessonProgress;
  katakanaLoanwords: LessonProgress;
}

export interface OverallProgress {
  totalCharactersLearned: number;
  totalCharactersMastered: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesTaken: number;
  averageScore: number;
  streak: number;
  lastStudyDate: string;
  achievements: string[];
}

const PROGRESS_STORAGE_KEY = "alphabet-learning-progress";
const OVERALL_STORAGE_KEY = "alphabet-overall-progress";

// Initialize default lesson progress
export const createDefaultLessonProgress = (lessonId: string): LessonProgress => ({
  lessonId,
  completed: false,
  score: 0,
  attempts: 0,
  lastAttempt: "",
  charactersLearned: [],
  masteredCharacters: [],
});

// Initialize default overall progress
export const createDefaultOverallProgress = (): OverallProgress => ({
  totalCharactersLearned: 0,
  totalCharactersMastered: 0,
  lessonsCompleted: 0,
  totalLessons: 7,
  quizzesTaken: 0,
  averageScore: 0,
  streak: 0,
  lastStudyDate: "",
  achievements: [],
});

// Load lesson progress
export function loadLessonProgress(lessonId: string): LessonProgress {
  if (typeof window === "undefined") return createDefaultLessonProgress(lessonId);

  try {
    const saved = localStorage.getItem(`${PROGRESS_STORAGE_KEY}_${lessonId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load progress:", e);
  }
  return createDefaultLessonProgress(lessonId);
}

// Save lesson progress
export function saveLessonProgress(progress: LessonProgress): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`${PROGRESS_STORAGE_KEY}_${progress.lessonId}`, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save progress:", e);
  }
}

// Load overall progress
export function loadOverallProgress(): OverallProgress {
  if (typeof window === "undefined") return createDefaultOverallProgress();

  try {
    const saved = localStorage.getItem(OVERALL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load overall progress:", e);
  }
  return createDefaultOverallProgress();
}

// Save overall progress
export function saveOverallProgress(progress: OverallProgress): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(OVERALL_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save overall progress:", e);
  }
}

// Update lesson completion
export function markLessonComplete(lessonId: string, score: number): void {
  const progress = loadLessonProgress(lessonId);
  progress.completed = true;
  progress.score = Math.max(progress.score, score);
  progress.attempts += 1;
  progress.lastAttempt = new Date().toISOString();
  saveLessonProgress(progress);

  // Update overall progress
  const overall = loadOverallProgress();
  const completedLessons = Object.keys(overall.achievements).length || 0;
  overall.lessonsCompleted = completedLessons + 1;

  // Update streak
  const today = new Date().toDateString();
  if (overall.lastStudyDate !== today) {
    const lastDate = overall.lastStudyDate ? new Date(overall.lastStudyDate) : null;
    const todayDate = new Date(today);

    if (lastDate) {
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        overall.streak += 1;
      } else if (diffDays > 1) {
        overall.streak = 1;
      }
    } else {
      overall.streak = 1;
    }
    overall.lastStudyDate = today;
  }

  overall.quizzesTaken += 1;

  // Calculate new average
  const totalScores = overall.averageScore * (overall.quizzesTaken - 1) + score;
  overall.averageScore = Math.round(totalScores / overall.quizzesTaken);

  saveOverallProgress(overall);
}

// Mark character as learned
export function markCharacterLearned(lessonId: string, characterId: string): void {
  const progress = loadLessonProgress(lessonId);
  if (!progress.charactersLearned.includes(characterId)) {
    progress.charactersLearned.push(characterId);
    saveLessonProgress(progress);

    // Update overall
    const overall = loadOverallProgress();
    overall.totalCharactersLearned += 1;
    saveOverallProgress(overall);
  }
}

// Mark character as mastered
export function markCharacterMastered(lessonId: string, characterId: string): void {
  const progress = loadLessonProgress(lessonId);
  if (!progress.masteredCharacters.includes(characterId)) {
    progress.masteredCharacters.push(characterId);
    if (!progress.charactersLearned.includes(characterId)) {
      progress.charactersLearned.push(characterId);
    }
    saveLessonProgress(progress);

    // Update overall
    const overall = loadOverallProgress();
    overall.totalCharactersMastered += 1;
    saveOverallProgress(overall);
  }
}

// Unlock achievement
export function unlockAchievement(achievementId: string): boolean {
  const overall = loadOverallProgress();
  if (!overall.achievements.includes(achievementId)) {
    overall.achievements.push(achievementId);
    saveOverallProgress(overall);
    return true;
  }
  return false;
}

// Calculate completion percentage
export function calculateCompletionPercentage(): number {
  const overall = loadOverallProgress();
  return Math.round((overall.lessonsCompleted / overall.totalLessons) * 100);
}

export default {
  loadLessonProgress,
  saveLessonProgress,
  loadOverallProgress,
  saveOverallProgress,
  markLessonComplete,
  markCharacterLearned,
  markCharacterMastered,
  unlockAchievement,
  calculateCompletionPercentage,
};
