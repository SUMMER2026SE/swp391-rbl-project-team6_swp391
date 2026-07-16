// Alphabet Mock Data Index
import type { HiraganaCharacter } from "./hiraganaBasic";
import type { KatakanaCharacter } from "./katakanaBasic";

export type { HiraganaCharacter, KatakanaCharacter };

// Lesson metadata for routing
export const ALPHABET_LESSONS = [
  {
    id: "hiragana-basic",
    title: "Hiragana Basic",
    subtitle: "46 Basic Characters",
    type: "hiragana" as const,
    subType: "basic" as const,
    path: "/student/learning/alphabet/hiragana/basic",
    difficulty: 1,
    totalCharacters: 46,
    color: "from-pink-400 to-rose-500",
    icon: "あ",
  },
  {
    id: "hiragana-dakuten",
    title: "Hiragana Dakuten",
    subtitle: "Voiced Sounds",
    type: "hiragana" as const,
    subType: "dakuten" as const,
    path: "/student/learning/alphabet/hiragana/dakuten",
    difficulty: 2,
    totalCharacters: 25,
    color: "from-purple-400 to-violet-500",
    icon: "が",
  },
  {
    id: "hiragana-combination",
    title: "Hiragana Combinations",
    subtitle: "Small Character Sounds",
    type: "hiragana" as const,
    subType: "combination" as const,
    path: "/student/learning/alphabet/hiragana/combination",
    difficulty: 3,
    totalCharacters: 33,
    color: "from-emerald-400 to-teal-500",
    icon: "きゃ",
  },
  {
    id: "katakana-basic",
    title: "Katakana Basic",
    subtitle: "46 Basic Characters",
    type: "katakana" as const,
    subType: "basic" as const,
    path: "/student/learning/alphabet/katakana/basic",
    difficulty: 1,
    totalCharacters: 46,
    color: "from-blue-400 to-cyan-500",
    icon: "ア",
  },
  {
    id: "katakana-dakuten",
    title: "Katakana Dakuten",
    subtitle: "Voiced Sounds",
    type: "katakana" as const,
    subType: "dakuten" as const,
    path: "/student/learning/alphabet/katakana/dakuten",
    difficulty: 2,
    totalCharacters: 25,
    color: "from-indigo-400 to-blue-500",
    icon: "ガ",
  },
  {
    id: "katakana-combination",
    title: "Katakana Combinations",
    subtitle: "Small Character Sounds",
    type: "katakana" as const,
    subType: "combination" as const,
    path: "/student/learning/alphabet/katakana/combination",
    difficulty: 3,
    totalCharacters: 33,
    color: "from-cyan-400 to-sky-500",
    icon: "キャ",
  },
  {
    id: "katakana-loanwords",
    title: "Katakana Loanwords",
    subtitle: "Foreign Words in Japanese",
    type: "katakana" as const,
    subType: "loanwords" as const,
    path: "/student/learning/alphabet/katakana/loanwords",
    difficulty: 4,
    totalCharacters: 70,
    color: "from-amber-400 to-orange-500",
    icon: "ツ",
  },
];

export const HIRAGANA_LESSONS = ALPHABET_LESSONS.filter((l) => l.type === "hiragana");
export const KATAKANA_LESSONS = ALPHABET_LESSONS.filter((l) => l.type === "katakana");

export function getLessonById(id: string) {
  return ALPHABET_LESSONS.find((l) => l.id === id);
}
