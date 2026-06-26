/**
 * Quiz utility functions for Learning Journey
 */

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create shuffled answer options with stable IDs
 * @param correctText - The correct answer text
 * @param wrongOptions - Array of wrong answer texts
 * @returns Shuffled array of AnswerOption objects
 */
export function createShuffledOptions(
  correctText: string,
  wrongOptions: string[]
): AnswerOption[] {
  const allOptions = [
    { id: `correct-${correctText}`, text: correctText, isCorrect: true },
    ...wrongOptions.map((text, index) => ({
      id: `wrong-${index}-${text}`,
      text,
      isCorrect: false,
    })),
  ];

  return shuffleArray(allOptions);
}
