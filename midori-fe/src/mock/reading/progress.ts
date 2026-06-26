// ─── Reading Progress Tracking System ────────────────────────────────────────────

import type { JLPTLevel } from "../../types/content-library";

// ─── Progress Types ─────────────────────────────────────────────────────────────

export interface ReadingProgress {
  lessonId: string;
  lessonTitle: string;
  jlptLevel: JLPTLevel;
  status: "not-started" | "in-progress" | "completed";
  score?: number;
  maxScore?: number;
  timeSpent?: number; // in minutes
  completedAt?: string;
  lastAccessedAt: string;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeSpent?: number; // in seconds
}

export interface ReadingStats {
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalTimeSpent: number; // in minutes
  currentStreak: number; // consecutive days
  longestStreak: number;
  levelProgress: {
    [key in JLPTLevel]?: {
      total: number;
      completed: number;
      averageScore: number;
    };
  };
  weeklyProgress: WeeklyProgress[];
  achievements: Achievement[];
}

export interface WeeklyProgress {
  week: string;
  lessonsCompleted: number;
  quizzesCompleted: number;
  averageScore: number;
  timeSpent: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  requirement: number;
  currentProgress: number;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "midori-reading-progress";
const STATS_KEY = "midori-reading-stats";

// ─── Helper Functions ──────────────────────────────────────────────────────────

function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

// ─── Progress Management ───────────────────────────────────────────────────────

export const readingProgressStore = {
  // Get all progress
  getAllProgress: (): Record<string, ReadingProgress> => {
    return getLocalStorage(STORAGE_KEY, {});
  },

  // Get progress for a specific lesson
  getProgress: (lessonId: string): ReadingProgress | null => {
    const allProgress = readingProgressStore.getAllProgress();
    return allProgress[lessonId] || null;
  },

  // Update progress for a lesson
  updateProgress: (lessonId: string, progress: Partial<ReadingProgress>): ReadingProgress => {
    const allProgress = readingProgressStore.getAllProgress();
    const existingProgress = allProgress[lessonId] || {
      lessonId,
      lessonTitle: "",
      jlptLevel: "N5" as JLPTLevel,
      status: "not-started",
      lastAccessedAt: new Date().toISOString(),
    };

    const updatedProgress: ReadingProgress = {
      ...existingProgress,
      ...progress,
      lastAccessedAt: new Date().toISOString(),
    };

    allProgress[lessonId] = updatedProgress;
    setLocalStorage(STORAGE_KEY, allProgress);

    // Update stats after progress change
    readingStatsStore.calculateStats();

    return updatedProgress;
  },

  // Mark lesson as completed
  completeLesson: (lessonId: string, score?: number, maxScore?: number): void => {
    readingProgressStore.updateProgress(lessonId, {
      status: "completed",
      score,
      maxScore,
      completedAt: new Date().toISOString(),
    });
  },

  // Mark lesson as in progress
  startLesson: (lessonId: string, title: string, jlptLevel: JLPTLevel): void => {
    readingProgressStore.updateProgress(lessonId, {
      status: "in-progress",
      lessonTitle: title,
      jlptLevel,
    });
  },

  // Record a quiz answer
  recordAnswer: (lessonId: string, answer: QuizAnswer): void => {
    const progress = readingProgressStore.getProgress(lessonId);
    if (!progress) return;

    const answers = progress.answers || [];
    const existingIndex = answers.findIndex((a) => a.questionId === answer.questionId);

    if (existingIndex >= 0) {
      answers[existingIndex] = answer;
    } else {
      answers.push(answer);
    }

    readingProgressStore.updateProgress(lessonId, { answers });
  },

  // Reset all progress
  resetAll: (): void => {
    setLocalStorage(STORAGE_KEY, {});
    readingStatsStore.calculateStats();
  },

  // Get progress by level
  getProgressByLevel: (level: JLPTLevel): ReadingProgress[] => {
    const allProgress = readingProgressStore.getAllProgress();
    return Object.values(allProgress).filter((p) => p.jlptLevel === level);
  },

  // Get completed lessons
  getCompletedLessons: (): ReadingProgress[] => {
    const allProgress = readingProgressStore.getAllProgress();
    return Object.values(allProgress).filter((p) => p.status === "completed");
  },
};

// ─── Stats Management ─────────────────────────────────────────────────────────

export const readingStatsStore = {
  // Get stats
  getStats: (): ReadingStats => {
    return getLocalStorage(STATS_KEY, readingStatsStore.getDefaultStats());
  },

  // Default stats
  getDefaultStats: (): ReadingStats => ({
    totalLessons: 0,
    completedLessons: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    levelProgress: {},
    weeklyProgress: [],
    achievements: readingStatsStore.getDefaultAchievements(),
  }),

  // Default achievements
  getDefaultAchievements: (): Achievement[] => [
    {
      id: "first-lesson",
      title: "First Steps",
      description: "Complete your first reading lesson",
      icon: "🎯",
      requirement: 1,
      currentProgress: 0,
    },
    {
      id: "five-lessons",
      title: "Getting Started",
      description: "Complete 5 reading lessons",
      icon: "📚",
      requirement: 5,
      currentProgress: 0,
    },
    {
      id: "ten-lessons",
      title: "Dedicated Reader",
      description: "Complete 10 reading lessons",
      icon: "📖",
      requirement: 10,
      currentProgress: 0,
    },
    {
      id: "perfect-score",
      title: "Perfect Score",
      description: "Get 100% on any quiz",
      icon: "💯",
      requirement: 1,
      currentProgress: 0,
    },
    {
      id: "streak-3",
      title: "On a Roll",
      description: "Maintain a 3-day reading streak",
      icon: "🔥",
      requirement: 3,
      currentProgress: 0,
    },
    {
      id: "streak-7",
      title: "Week Warrior",
      description: "Maintain a 7-day reading streak",
      icon: "⭐",
      requirement: 7,
      currentProgress: 0,
    },
    {
      id: "n5-master",
      title: "N5 Master",
      description: "Complete all N5 reading lessons",
      icon: "🌱",
      requirement: 20,
      currentProgress: 0,
    },
  ],

  // Calculate and update stats
  calculateStats: (): ReadingStats => {
    const allProgress = readingProgressStore.getAllProgress();
    const progressValues = Object.values(allProgress);

    const completedLessons = progressValues.filter((p) => p.status === "completed");
    const lessonsWithScores = completedLessons.filter((p) => p.score !== undefined && p.maxScore);

    // Calculate average score
    let averageScore = 0;
    if (lessonsWithScores.length > 0) {
      const totalScore = lessonsWithScores.reduce((sum, p) => {
        return sum + ((p.score || 0) / (p.maxScore || 1)) * 100;
      }, 0);
      averageScore = Math.round(totalScore / lessonsWithScores.length);
    }

    // Calculate total time spent
    const totalTimeSpent = progressValues.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    // Calculate level progress
    const levelProgress: ReadingStats["levelProgress"] = {};
    const levels: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

    levels.forEach((level) => {
      const levelProgress_ = progressValues.filter((p) => p.jlptLevel === level);
      const completed = levelProgress_.filter((p) => p.status === "completed");
      const withScores = completed.filter((p) => p.score !== undefined);

      let avgScore = 0;
      if (withScores.length > 0) {
        const total = withScores.reduce(
          (sum, p) => sum + ((p.score || 0) / (p.maxScore || 1)) * 100,
          0,
        );
        avgScore = Math.round(total / withScores.length);
      }

      levelProgress[level] = {
        total: levelProgress_.length,
        completed: completed.length,
        averageScore: avgScore,
      };
    });

    // Count quizzes
    const completedQuizzes = lessonsWithScores.length;

    // Calculate streaks (simplified)
    const stats = readingStatsStore.getStats();
    const { currentStreak, longestStreak } = readingStatsStore.calculateStreaks(
      progressValues,
      stats.longestStreak,
    );

    // Update achievements
    const achievements = readingStatsStore.updateAchievements(
      completedLessons.length,
      averageScore,
      currentStreak,
      stats.achievements,
    );

    const newStats: ReadingStats = {
      totalLessons: progressValues.length,
      completedLessons: completedLessons.length,
      totalQuizzes: completedLessons.length,
      completedQuizzes,
      averageScore,
      totalTimeSpent,
      currentStreak,
      longestStreak,
      levelProgress,
      weeklyProgress: stats.weeklyProgress,
      achievements,
    };

    setLocalStorage(STATS_KEY, newStats);
    return newStats;
  },

  // Calculate streaks
  calculateStreaks: (
    progressValues: ReadingProgress[],
    currentLongestStreak: number,
  ): { currentStreak: number; longestStreak: number } => {
    if (progressValues.length === 0) {
      return { currentStreak: 0, longestStreak: currentLongestStreak };
    }

    // Get unique dates of activity
    const activityDates = progressValues
      .filter((p) => p.lastAccessedAt)
      .map((p) => new Date(p.lastAccessedAt).toISOString().split("T")[0])
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort()
      .reverse();

    if (activityDates.length === 0) {
      return { currentStreak: 0, longestStreak: currentLongestStreak };
    }

    // Check if there's activity today or yesterday
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let currentStreak = 0;
    if (activityDates[0] === today || activityDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < activityDates.length; i++) {
        const prevDate = new Date(activityDates[i - 1]);
        const currDate = new Date(activityDates[i]);
        const diffDays = (prevDate.getTime() - currDate.getTime()) / 86400000;

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const longestStreak = Math.max(currentStreak, currentLongestStreak);
    return { currentStreak, longestStreak };
  },

  // Update achievements
  updateAchievements: (
    completedLessons: number,
    averageScore: number,
    currentStreak: number,
    existingAchievements: Achievement[],
  ): Achievement[] => {
    return existingAchievements.map((achievement) => {
      let currentProgress = 0;
      let unlocked = false;

      switch (achievement.id) {
        case "first-lesson":
          currentProgress = Math.min(completedLessons, 1);
          unlocked = completedLessons >= 1;
          break;
        case "five-lessons":
          currentProgress = Math.min(completedLessons, 5);
          unlocked = completedLessons >= 5;
          break;
        case "ten-lessons":
          currentProgress = Math.min(completedLessons, 10);
          unlocked = completedLessons >= 10;
          break;
        case "perfect-score":
          unlocked = averageScore === 100;
          currentProgress = unlocked ? 1 : 0;
          break;
        case "streak-3":
          currentProgress = Math.min(currentStreak, 3);
          unlocked = currentStreak >= 3;
          break;
        case "streak-7":
          currentProgress = Math.min(currentStreak, 7);
          unlocked = currentStreak >= 7;
          break;
        case "n5-master":
          currentProgress = Math.min(completedLessons, 20);
          unlocked = completedLessons >= 20;
          break;
      }

      return {
        ...achievement,
        currentProgress,
        unlockedAt:
          unlocked && !achievement.unlockedAt ? new Date().toISOString() : achievement.unlockedAt,
      };
    });
  },

  // Reset stats
  resetStats: (): void => {
    setLocalStorage(STATS_KEY, readingStatsStore.getDefaultStats());
  },
};

// ─── Convenience Hooks ────────────────────────────────────────────────────────

export const useReadingProgress = () => {
  return {
    progress: readingProgressStore.getAllProgress(),
    stats: readingStatsStore.getStats(),
    getProgress: readingProgressStore.getProgress,
    updateProgress: readingProgressStore.updateProgress,
    completeLesson: readingProgressStore.completeLesson,
    startLesson: readingProgressStore.startLesson,
    recordAnswer: readingProgressStore.recordAnswer,
    resetAll: () => {
      readingProgressStore.resetAll();
      readingStatsStore.resetStats();
    },
  };
};

export default {
  progressStore: readingProgressStore,
  statsStore: readingStatsStore,
  useReadingProgress,
};
