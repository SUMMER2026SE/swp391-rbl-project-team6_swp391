// Complete Japanese Character Data for Learning System

// ============ HIRAGANA BASIC ============
export const HIRAGANA_BASIC = [
  // Vowels
  { char: "あ", romaji: "a" }, { char: "い", romaji: "i" }, { char: "う", romaji: "u" }, { char: "え", romaji: "e" }, { char: "お", romaji: "o" },
  // K row
  { char: "か", romaji: "ka" }, { char: "き", romaji: "ki" }, { char: "く", romaji: "ku" }, { char: "け", romaji: "ke" }, { char: "こ", romaji: "ko" },
  // S row
  { char: "さ", romaji: "sa" }, { char: "し", romaji: "shi" }, { char: "す", romaji: "su" }, { char: "せ", romaji: "se" }, { char: "そ", romaji: "so" },
  // T row
  { char: "た", romaji: "ta" }, { char: "ち", romaji: "chi" }, { char: "つ", romaji: "tsu" }, { char: "て", romaji: "te" }, { char: "と", romaji: "to" },
  // N row
  { char: "な", romaji: "na" }, { char: "に", romaji: "ni" }, { char: "ぬ", romaji: "nu" }, { char: "ね", romaji: "ne" }, { char: "の", romaji: "no" },
  // H row
  { char: "は", romaji: "ha" }, { char: "ひ", romaji: "hi" }, { char: "ふ", romaji: "fu" }, { char: "へ", romaji: "he" }, { char: "ほ", romaji: "ho" },
  // M row
  { char: "ま", romaji: "ma" }, { char: "み", romaji: "mi" }, { char: "む", romaji: "mu" }, { char: "め", romaji: "me" }, { char: "も", romaji: "mo" },
  // Y row
  { char: "や", romaji: "ya" }, { char: "ゆ", romaji: "yu" }, { char: "よ", romaji: "yo" },
  // R row
  { char: "ら", romaji: "ra" }, { char: "り", romaji: "ri" }, { char: "る", romaji: "ru" }, { char: "れ", romaji: "re" }, { char: "ろ", romaji: "ro" },
  // W row
  { char: "わ", romaji: "wa" }, { char: "を", romaji: "wo" },
  // N
  { char: "ん", romaji: "n" },
];

// ============ KATAKANA BASIC ============
export const KATAKANA_BASIC = [
  // Vowels
  { char: "ア", romaji: "a" }, { char: "イ", romaji: "i" }, { char: "ウ", romaji: "u" }, { char: "エ", romaji: "e" }, { char: "オ", romaji: "o" },
  // K row
  { char: "カ", romaji: "ka" }, { char: "キ", romaji: "ki" }, { char: "ク", romaji: "ku" }, { char: "ケ", romaji: "ke" }, { char: "コ", romaji: "ko" },
  // S row
  { char: "サ", romaji: "sa" }, { char: "シ", romaji: "shi" }, { char: "ス", romaji: "su" }, { char: "セ", romaji: "se" }, { char: "ソ", romaji: "so" },
  // T row
  { char: "タ", romaji: "ta" }, { char: "チ", romaji: "chi" }, { char: "ツ", romaji: "tsu" }, { char: "テ", romaji: "te" }, { char: "ト", romaji: "to" },
  // N row
  { char: "ナ", romaji: "na" }, { char: "ニ", romaji: "ni" }, { char: "ヌ", romaji: "nu" }, { char: "ネ", romaji: "ne" }, { char: "ノ", romaji: "no" },
  // H row
  { char: "ハ", romaji: "ha" }, { char: "ヒ", romaji: "hi" }, { char: "フ", romaji: "fu" }, { char: "ヘ", romaji: "he" }, { char: "ホ", romaji: "ho" },
  // M row
  { char: "マ", romaji: "ma" }, { char: "ミ", romaji: "mi" }, { char: "ム", romaji: "mu" }, { char: "メ", romaji: "me" }, { char: "モ", romaji: "mo" },
  // Y row
  { char: "ヤ", romaji: "ya" }, { char: "ユ", romaji: "yu" }, { char: "ヨ", romaji: "yo" },
  // R row
  { char: "ラ", romaji: "ra" }, { char: "リ", romaji: "ri" }, { char: "ル", romaji: "ru" }, { char: "レ", romaji: "re" }, { char: "ロ", romaji: "ro" },
  // W row
  { char: "ワ", romaji: "wa" }, { char: "ヲ", romaji: "wo" },
  // N
  { char: "ン", romaji: "n" },
];

// ============ DAKUTEN (Voiced Sounds) ============
export const HIRAGANA_DAKUTEN = [
  // G row (k → g)
  { char: "が", romaji: "ga" }, { char: "ぎ", romaji: "gi" }, { char: "ぐ", romaji: "gu" }, { char: "げ", romaji: "ge" }, { char: "ご", romaji: "go" },
  // Z row (s → z)
  { char: "ざ", romaji: "za" }, { char: "じ", romaji: "ji" }, { char: "ず", romaji: "zu" }, { char: "ぜ", romaji: "ze" }, { char: "ぞ", romaji: "zo" },
  // D row (t → d)
  { char: "だ", romaji: "da" }, { char: "ぢ", romaji: "di/ji" }, { char: "づ", romaji: "du/zu" }, { char: "で", romaji: "de" }, { char: "ど", romaji: "do" },
  // B row (h → b)
  { char: "ば", romaji: "ba" }, { char: "び", romaji: "bi" }, { char: "ぶ", romaji: "bu" }, { char: "べ", romaji: "be" }, { char: "ぼ", romaji: "bo" },
  // P row (h → p)
  { char: "ぱ", romaji: "pa" }, { char: "ぴ", romaji: "pi" }, { char: "ぷ", romaji: "pu" }, { char: "ぺ", romaji: "pe" }, { char: "ぽ", romaji: "po" },
];

export const KATAKANA_DAKUTEN = [
  // G row
  { char: "ガ", romaji: "ga" }, { char: "ギ", romaji: "gi" }, { char: "グ", romaji: "gu" }, { char: "ゲ", romaji: "ge" }, { char: "ゴ", romaji: "go" },
  // Z row
  { char: "ザ", romaji: "za" }, { char: "ジ", romaji: "ji" }, { char: "ズ", romaji: "zu" }, { char: "ゼ", romaji: "ze" }, { char: "ゾ", romaji: "zo" },
  // D row
  { char: "ダ", romaji: "da" }, { char: "ヂ", romaji: "di/ji" }, { char: "ヅ", romaji: "du/zu" }, { char: "デ", romaji: "de" }, { char: "ド", romaji: "do" },
  // B row
  { char: "バ", romaji: "ba" }, { char: "ビ", romaji: "bi" }, { char: "ブ", romaji: "bu" }, { char: "ベ", romaji: "be" }, { char: "ボ", romaji: "bo" },
  // P row
  { char: "パ", romaji: "pa" }, { char: "ピ", romaji: "pi" }, { char: "プ", romaji: "pu" }, { char: "ペ", romaji: "pe" }, { char: "ポ", romaji: "po" },
];

// ============ COMBINATION SOUNDS (YOON) ============
export const HIRAGANA_COMBINATION = [
  // KYA, KYU, KYO
  { char: "きゃ", romaji: "kya" }, { char: "きゅ", romaji: "kyu" }, { char: "きょ", romaji: "kyo" },
  // SHA, SHU, SHO (SHI already exists, but include variant)
  { char: "しゃ", romaji: "sha" }, { char: "しゅ", romaji: "shu" }, { char: "しょ", romaji: "sho" },
  // CHA, CHU, CHO (CHI already exists)
  { char: "ちゃ", romaji: "cha" }, { char: "ちゅ", romaji: "chu" }, { char: "ちょ", romaji: "cho" },
  // NYA, NYU, NYO
  { char: "にゃ", romaji: "nya" }, { char: "にゅ", romaji: "nyu" }, { char: "にょ", romaji: "nyo" },
  // HYA, HYU, HYO
  { char: "ひゃ", romaji: "hya" }, { char: "ひゅ", romaji: "hyu" }, { char: "ひょ", romaji: "hyo" },
  // MYA, MYU, MYO
  { char: "みゃ", romaji: "mya" }, { char: "みゅ", romaji: "myu" }, { char: "みょ", romaji: "myo" },
  // RYA, RYU, RYO
  { char: "りゃ", romaji: "rya" }, { char: "りゅ", romaji: "ryu" }, { char: "りょ", romaji: "ryo" },
  // GYA, GYU, GYO
  { char: "ぎゃ", romaji: "gya" }, { char: "ぎゅ", romaji: "gyu" }, { char: "ぎょ", romaji: "gyo" },
  // JA, JU, JO (JI already exists)
  { char: "じゃ", romaji: "ja" }, { char: "じゅ", romaji: "ju" }, { char: "じょ", romaji: "jo" },
  // BYA, BYU, BYO
  { char: "びゃ", romaji: "bya" }, { char: "びゅ", romaji: "byu" }, { char: "びょ", romaji: "byo" },
  // PYA, PYU, PYO
  { char: "ぴゃ", romaji: "pya" }, { char: "ぴゅ", romaji: "pyu" }, { char: "ぴょ", romaji: "pyo" },
];

export const KATAKANA_COMBINATION = [
  // KYA, KYU, KYO
  { char: "キャ", romaji: "kya" }, { char: "キュ", romaji: "kyu" }, { char: "キョ", romaji: "kyo" },
  // SHA, SHU, SHO
  { char: "シャ", romaji: "sha" }, { char: "シュ", romaji: "shu" }, { char: "ショ", romaji: "sho" },
  // CHA, CHU, CHO
  { char: "チャ", romaji: "cha" }, { char: "チュ", romaji: "chu" }, { char: "チョ", romaji: "cho" },
  // NYA, NYU, NYO
  { char: "ニャ", romaji: "nya" }, { char: "ニュ", romaji: "nyu" }, { char: "ニョ", romaji: "nyo" },
  // HYA, HYU, HYO
  { char: "ヒャ", romaji: "hya" }, { char: "ヒュ", romaji: "hyu" }, { char: "ヒョ", romaji: "hyo" },
  // MYA, MYU, MYO
  { char: "ミャ", romaji: "mya" }, { char: "ミュ", romaji: "myu" }, { char: "ミョ", romaji: "myo" },
  // RYA, RYU, RYO
  { char: "リャ", romaji: "rya" }, { char: "リュ", romaji: "ryu" }, { char: "リョ", romaji: "ryo" },
  // GYA, GYU, GYO
  { char: "ギャ", romaji: "gya" }, { char: "ギュ", romaji: "gyu" }, { char: "ギョ", romaji: "gyo" },
  // JA, JU, JO
  { char: "ジャ", romaji: "ja" }, { char: "ジュ", romaji: "ju" }, { char: "ジョ", romaji: "jo" },
  // BYA, BYU, BYO
  { char: "ビャ", romaji: "bya" }, { char: "ビュ", romaji: "byu" }, { char: "ビョ", romaji: "byo" },
  // PYA, PYU, PYO
  { char: "ピャ", romaji: "pya" }, { char: "ピュ", romaji: "pyu" }, { char: "ピョ", romaji: "pyo" },
];

// ============ LONG SOUNDS ============
export const LONG_SOUND_EXAMPLES = [
  // Hiragana
  { char: "おかあさん", romaji: "okaasan", meaning: "mother", type: "hiragana" },
  { char: "おとうさん", romaji: "otoosan", meaning: "father", type: "hiragana" },
  { char: "せんせい", romaji: "sensei", meaning: "teacher", type: "hiragana" },
  { char: "いえます", romaji: "iemasu", meaning: "can say", type: "hiragana" },
  { char: "きく", romaji: "kiku", meaning: "to listen", type: "hiragana" },
  { char: "あき", romaji: "aki", meaning: "autumn", type: "hiragana" },
  { char: "おおきい", romaji: "ookii", meaning: "big", type: "hiragana" },
  { char: "ちいさい", romaji: "chiisai", meaning: "small", type: "hiragana" },
  // Katakana
  { char: "カー", romaji: "kaa", meaning: "car", type: "katakana" },
  { char: "キー", romaji: "kii", meaning: "key", type: "katakana" },
  { char: "メール", romaji: "meeru", meaning: "mail/email", type: "katakana" },
  { char: "ゲーム", romaji: "geemu", meaning: "game", type: "katakana" },
  { char: "コーヒー", romaji: "koohii", meaning: "coffee", type: "katakana" },
  { char: "スター", romaji: "sutaa", meaning: "star", type: "katakana" },
  { char: "ノート", romaji: "nooto", meaning: "notebook", type: "katakana" },
  { char: "テレビ", romaji: "terebi", meaning: "television", type: "katakana" },
];

// ============ SMALL TSU (Gemination) ============
export const SMALL_TSU_EXAMPLES = [
  // Hiragana
  { char: "がっこう", romaji: "gakkou", meaning: "school", type: "hiragana" },
  { char: "けさ", romaji: "kesa", meaning: "this morning", type: "hiragana" },
  { char: "あさって", romaji: "asatte", meaning: "day after tomorrow", type: "hiragana" },
  { char: "ずっと", romaji: "zutto", meaning: "all the way", type: "hiragana" },
  { char: "ほっと", romaji: "hotto", meaning: "relief", type: "hiragana" },
  { char: "いっしょ", romaji: "issho", meaning: "together", type: "hiragana" },
  { char: "ざっし", romaji: "zasshi", meaning: "magazine", type: "hiragana" },
  { char: "みっつ", romaji: "mittsu", meaning: "three (things)", type: "hiragana" },
  // Katakana
  { char: "ベッド", romaji: "beddo", meaning: "bed", type: "katakana" },
  { char: "キャップ", romaji: "kyappu", meaning: "cap", type: "katakana" },
  { char: "ネット", romaji: "netto", meaning: "net", type: "katakana" },
  { char: "マップ", romaji: "mappu", meaning: "map", type: "katakana" },
  { char: "バッグ", romaji: "baggu", meaning: "bag", type: "katakana" },
  { char: "咖啡", romaji: "koohii", meaning: "coffee", type: "katakana" },
  { char: "ホット", romaji: "hotto", meaning: "hot", type: "katakana" },
  { char: "コップ", romaji: "koppu", meaning: "cup/glass", type: "katakana" },
];

// ============ LESSON DEFINITIONS ============
export interface Lesson {
  id: string;
  type: "basic" | "dakuten" | "combination" | "longsound" | "smalltsu";
  script: "hiragana" | "katakana";
  title: string;
  subtitle: string;
  description: string;
  characters: { char: string; romaji: string }[];
  color: string;
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTime: number; // in minutes
  quizCount: number;
}

export const LESSONS: Lesson[] = [
  // Hiragana Basic
  {
    id: "hiragana-basic",
    type: "basic",
    script: "hiragana",
    title: "Hiragana Basic",
    subtitle: " foundational characters",
    description: "Master the 46 fundamental Hiragana characters. These form the backbone of Japanese writing and are essential for reading and writing.",
    characters: HIRAGANA_BASIC,
    color: "from-pink-400 to-rose-500",
    icon: "あ",
    difficulty: 1,
    estimatedTime: 30,
    quizCount: 10,
  },
  // Katakana Basic
  {
    id: "katakana-basic",
    type: "basic",
    script: "katakana",
    title: "Katakana Basic",
    subtitle: " foundational characters",
    description: "Learn the 46 basic Katakana characters used primarily for foreign words, loanwords, and emphasis in Japanese.",
    characters: KATAKANA_BASIC,
    color: "from-blue-400 to-cyan-500",
    icon: "ア",
    difficulty: 1,
    estimatedTime: 30,
    quizCount: 10,
  },
  // Hiragana Dakuten
  {
    id: "hiragana-dakuten",
    type: "dakuten",
    script: "hiragana",
    title: "Hiragana Dakuten",
    subtitle: "Voiced sounds",
    description: "Learn Hiragana with dakuten (゛) marks that create voiced sounds like が, じ, づ, ば, and ぱ.",
    characters: HIRAGANA_DAKUTEN,
    color: "from-purple-400 to-violet-500",
    icon: "が",
    difficulty: 2,
    estimatedTime: 25,
    quizCount: 10,
  },
  // Katakana Dakuten
  {
    id: "katakana-dakuten",
    type: "dakuten",
    script: "katakana",
    title: "Katakana Dakuten",
    subtitle: "Voiced sounds",
    description: "Master Katakana voiced sounds with dakuten marks. Essential for reading foreign words that contain voiced consonants.",
    characters: KATAKANA_DAKUTEN,
    color: "from-indigo-400 to-blue-500",
    icon: "ガ",
    difficulty: 2,
    estimatedTime: 25,
    quizCount: 10,
  },
  // Hiragana Combinations
  {
    id: "hiragana-combination",
    type: "combination",
    script: "hiragana",
    title: "Hiragana Combinations",
    subtitle: "Small ya, yu, yo sounds",
    description: "Learn how small ゃ, ゅ, ょ combine with base characters to create combination sounds like きゃ, しゅ, ちょ.",
    characters: HIRAGANA_COMBINATION,
    color: "from-emerald-400 to-teal-500",
    icon: "きゃ",
    difficulty: 3,
    estimatedTime: 20,
    quizCount: 10,
  },
  // Katakana Combinations
  {
    id: "katakana-combination",
    type: "combination",
    script: "katakana",
    title: "Katakana Combinations",
    subtitle: "Small ya, yu, yo sounds",
    description: "Master Katakana combination sounds. These are crucial for reading many common Japanese words and loanwords.",
    characters: KATAKANA_COMBINATION,
    color: "from-cyan-400 to-sky-500",
    icon: "キャ",
    difficulty: 3,
    estimatedTime: 20,
    quizCount: 10,
  },
  // Long Sounds
  {
    id: "long-sounds",
    type: "longsound",
    script: "hiragana",
    title: "Long Sounds",
    subtitle: "Prolonged syllables",
    description: "Understand how long vowels work in Japanese. The same vowel repeated doubles the length and changes pronunciation.",
    characters: LONG_SOUND_EXAMPLES,
    color: "from-amber-400 to-orange-500",
    icon: "お",
    difficulty: 2,
    estimatedTime: 15,
    quizCount: 10,
  },
  // Small Tsu
  {
    id: "small-tsu",
    type: "smalltsu",
    script: "hiragana",
    title: "Small Tsu (Gemination)",
    subtitle: "Geminate consonants",
    description: "Learn the small っ mark that doubles the following consonant sound. Essential for proper pronunciation.",
    characters: SMALL_TSU_EXAMPLES,
    color: "from-red-400 to-pink-500",
    icon: "っ",
    difficulty: 3,
    estimatedTime: 15,
    quizCount: 10,
  },
];

// ============ ACHIEVEMENT DEFINITIONS ============
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: {
    type: "lessons_completed" | "quiz_score" | "streak" | "characters_learned" | "perfect_score" | "speed_challenge";
    count: number;
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Complete your first lesson",
    icon: "🎌",
    color: "from-green-400 to-emerald-500",
    requirement: { type: "lessons_completed", count: 1 },
  },
  {
    id: "hiragana-master",
    title: "Hiragana Master",
    description: "Complete all Hiragana lessons",
    icon: "あ",
    color: "from-pink-400 to-rose-500",
    requirement: { type: "lessons_completed", count: 3 },
  },
  {
    id: "katakana-master",
    title: "Katakana Master",
    description: "Complete all Katakana lessons",
    icon: "ア",
    color: "from-blue-400 to-cyan-500",
    requirement: { type: "lessons_completed", count: 3 },
  },
  {
    id: "perfect-score",
    title: "Perfect Score",
    description: "Get 100% on any quiz",
    icon: "💯",
    color: "from-yellow-400 to-amber-500",
    requirement: { type: "perfect_score", count: 1 },
  },
  {
    id: "speed-demon",
    title: "Speed Demon",
    description: "Complete a speed challenge with 90% accuracy",
    icon: "⚡",
    color: "from-orange-400 to-red-500",
    requirement: { type: "speed_challenge", count: 1 },
  },
  {
    id: "streak-3",
    title: "Getting Started",
    description: "Study for 3 days in a row",
    icon: "🔥",
    color: "from-orange-400 to-yellow-500",
    requirement: { type: "streak", count: 3 },
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Study for 7 days in a row",
    icon: "🗓️",
    color: "from-purple-400 to-pink-500",
    requirement: { type: "streak", count: 7 },
  },
  {
    id: "character-expert",
    title: "Character Expert",
    description: "Learn 100 characters",
    icon: "📚",
    color: "from-indigo-400 to-purple-500",
    requirement: { type: "characters_learned", count: 100 },
  },
  {
    id: "quiz-champion",
    title: "Quiz Champion",
    description: "Complete 50 quizzes",
    icon: "🏆",
    color: "from-yellow-400 to-orange-500",
    requirement: { type: "quiz_score", count: 50 },
  },
];

// ============ QUIZ QUESTIONS FOR EACH LESSON TYPE ============
export interface QuizQuestion {
  type: "recognition" | "listening" | "matching" | "wordbuilding" | "fillblank";
  question: string;
  options?: string[];
  correctAnswer: string;
  audio?: string;
  hint?: string;
}

// Generate quiz questions from character data
export function generateQuizQuestions(lesson: Lesson): QuizQuestion[] {
  const chars = lesson.characters;
  const questions: QuizQuestion[] = [];

  // Recognition quizzes (character to romaji)
  chars.slice(0, 5).forEach((char) => {
    const wrongOptions = chars
      .filter((c) => c.romaji !== char.romaji)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.romaji);

    questions.push({
      type: "recognition",
      question: `What is the romaji for "${char.char}"?`,
      options: [char.romaji, ...wrongOptions].sort(() => Math.random() - 0.5),
      correctAnswer: char.romaji,
    });
  });

  // Listening quizzes
  chars.slice(0, 3).forEach((char) => {
    questions.push({
      type: "listening",
      question: `Listen and select the correct character`,
      options: [char.char, ...chars.filter((c) => c.char !== char.char).sort(() => Math.random() - 0.5).slice(0, 3).map((c) => c.char)].sort(() => Math.random() - 0.5),
      correctAnswer: char.char,
    });
  });

  // Matching quizzes (for example words)
  if (lesson.type === "longsound" || lesson.type === "smalltsu") {
    const examples = lesson.characters.slice(0, 4);
    questions.push({
      type: "matching",
      question: "Match the characters to their meanings",
      correctAnswer: JSON.stringify(examples.map((e) => ({ char: e.char, meaning: e.meaning }))),
    });
  }

  // Word building (for combinations)
  if (lesson.type === "combination") {
    const comboChars = chars.slice(0, 4);
    questions.push({
      type: "wordbuilding",
      question: "Build the combination sound",
      options: comboChars.map((c) => c.romaji),
      correctAnswer: comboChars[0].romaji,
      hint: `Combine with small や, ゆ, or よ`,
    });
  }

  // Fill in the blank
  chars.slice(0, 2).forEach((char) => {
    questions.push({
      type: "fillblank",
      question: `Complete the word: ${char.romaji.replace(/.$/, "___")}`,
      options: [char.romaji.slice(-1)],
      correctAnswer: char.romaji.slice(-1),
    });
  });

  return questions;
}

// ============ PROGRESS TRACKING ============
export interface UserProgress {
  lessonProgress: Record<string, {
    completed: boolean;
    score: number;
    attempts: number;
    lastAttempt: string;
  }>;
  achievements: string[];
  streak: number;
  lastStudyDate: string;
  totalCharactersLearned: number;
  totalQuizzesTaken: number;
}

// Mock initial progress
export const INITIAL_PROGRESS: UserProgress = {
  lessonProgress: {},
  achievements: [],
  streak: 0,
  lastStudyDate: "",
  totalCharactersLearned: 0,
  totalQuizzesTaken: 0,
};

// Helper function to speak Japanese
export function speakJapanese(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

// Helper function to get lesson by ID
export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

// Get all lessons for a specific script
export function getLessonsByScript(script: "hiragana" | "katakana"): Lesson[] {
  return LESSONS.filter((lesson) => lesson.script === script);
}

// Get lessons by type
export function getLessonsByType(type: Lesson["type"]): Lesson[] {
  return LESSONS.filter((lesson) => lesson.type === type);
}
