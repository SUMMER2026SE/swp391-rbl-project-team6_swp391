// ─── Reading Exercises Mock Data ─────────────────────────────────────────────────

import type { JLPTLevel } from "../../types/content-library";

export interface ReadingExercise {
  id: string;
  type: "multiple-choice" | "true-false" | "fill-blank" | "vocabulary-matching" | "comprehension" | "sentence-order" | "translation";
  difficulty: "easy" | "medium" | "hard";
  jlptLevel: JLPTLevel;
  instruction: string;
  data: MultipleChoiceExercise | TrueFalseExercise | FillBlankExercise | VocabularyMatchingExercise | SentenceOrderExercise | TranslationExercise;
}

export interface MultipleChoiceExercise {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  readingId?: string;
}

export interface TrueFalseExercise {
  statement: string;
  correctAnswer: boolean;
  explanation?: string;
  readingId?: string;
}

export interface FillBlankExercise {
  sentence: string;
  blankPosition: number;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  readingId?: string;
}

export interface VocabularyMatchingExercise {
  japaneseWord: string;
  reading: string;
  options: { id: string; meaning: string }[];
  correctAnswer: string;
  explanation?: string;
  readingId?: string;
}

export interface SentenceOrderExercise {
  scrambledWords: string[];
  correctOrder: number[];
  correctSentence: string;
  explanation?: string;
  readingId?: string;
}

export interface TranslationExercise {
  originalSentence: string;
  language: "ja-en" | "en-ja";
  options: string[];
  correctAnswer: number;
  explanation?: string;
  readingId?: string;
}

// ─── N5 Reading Exercises ────────────────────────────────────────────────────────

export const n5ReadingExercises: ReadingExercise[] = [
  // Multiple Choice - Basic
  {
    id: "ex-n5-001",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "私は每天早上六点半_______。",
      options: ["寝ます", "起きます", "食べます", "飲みます"],
      correctAnswer: 1,
      explanation: "「起きます」means to wake up/get up, fitting the context of early morning routine.",
      readingId: "read-n5-004"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-002",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "家族は四人不_______。",
      options: ["です", "います", "します", "です"],
      correctAnswer: 1,
      explanation: "「います」is used for people and animals, indicating existence.",
      readingId: "read-n5-003"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-003",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "趣味は切手の収集_______。",
      options: ["です", "います", "します", "でした"],
      correctAnswer: 0,
      explanation: "「です」is the polite sentence ending to state facts.",
      readingId: "read-n5-001"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-004",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "今日_______晴れです。",
      options: ["の", "は", "が", "を"],
      correctAnswer: 1,
      explanation: "「は」is the topic marker particle.",
      readingId: "read-n5-007"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-005",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "駅_______どこですか？",
      options: ["は", "が", "に", "で"],
      correctAnswer: 1,
      explanation: "「が」is used to mark the subject of existence.",
      readingId: "read-n5-018"
    } as MultipleChoiceExercise
  },

  // True/False - Basic
  {
    id: "ex-n5-006",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "田中さんは十八歳です。",
      correctAnswer: true,
      explanation: "From the reading: 「十八歳です」(18 years old).",
      readingId: "read-n5-001"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-007",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "妹は高校生ではありません。",
      correctAnswer: false,
      explanation: "From the reading: 「妹は十七歳で、高校生です」(The sister is 17 and a high school student).",
      readingId: "read-n5-003"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-008",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "今日は雨です。",
      correctAnswer: false,
      explanation: "From the reading: 「今日は晴れです」(Today is sunny).",
      readingId: "read-n5-007"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-009",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "放課後は部活があります。",
      correctAnswer: true,
      explanation: "From the reading: 「放課後は部活があります」(After school, there are club activities).",
      readingId: "read-n5-002"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-010",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "靴は三万円でした。",
      correctAnswer: true,
      explanation: "From the reading: 「三万円でした」(It was 30,000 yen).",
      readingId: "read-n5-005"
    } as TrueFalseExercise
  },

  // Fill in the Blank - Basic
  {
    id: "ex-n5-011",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank with the correct word:",
    data: {
      sentence: "私は每朝六時半に_____。",
      blankPosition: 0,
      options: ["寝ます", "起きます", "食べます", "飲みます"],
      correctAnswer: 1,
      explanation: "The context of "every morning" suggests waking up.",
      readingId: "read-n5-004"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-012",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank with the correct word:",
    data: {
      sentence: "家族は_____です。",
      blankPosition: 0,
      options: ["三人", "四人", "五人", "六人"],
      correctAnswer: 1,
      explanation: "From the reading: 父、母、妹と私 = 4 people.",
      readingId: "read-n5-003"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-013",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank with the correct word:",
    data: {
      sentence: "趣味は_____の収集です。",
      blankPosition: 0,
      options: ["切手", "水果", "料理", "写真"],
      correctAnswer: 0,
      explanation: "From the reading: 「趣味は切手の収集です」(My hobby is collecting stamps).",
      readingId: "read-n5-001"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-014",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank with the correct word:",
    data: {
      sentence: "靴は三_____でした。",
      blankPosition: 0,
      options: ["千円", "万円", "百円", "十万円"],
      correctAnswer: 1,
      explanation: "From the reading: 「三万円でした」(It was 30,000 yen).",
      readingId: "read-n5-005"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-015",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank with the correct word:",
    data: {
      sentence: "この道をまっすぐ_____てください。",
      blankPosition: 0,
      options: ["行き", "歩き", "走り", "泳ぎ"],
      correctAnswer: 0,
      explanation: "「行ってください」means please go.",
      readingId: "read-n5-018"
    } as FillBlankExercise
  },

  // Vocabulary Matching - Basic
  {
    id: "ex-n5-016",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "家族",
      reading: "かぞく",
      options: [
        { id: "a", meaning: "friend" },
        { id: "b", meaning: "family" },
        { id: "c", meaning: "school" },
        { id: "d", meaning: "work" }
      ],
      correctAnswer: "b",
      explanation: "「家族」(kazoku) means family.",
      readingId: "read-n5-003"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-017",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "趣味",
      reading: "しゅみ",
      options: [
        { id: "a", meaning: "study" },
        { id: "b", meaning: "work" },
        { id: "c", meaning: "hobby" },
        { id: "d", meaning: "food" }
      ],
      correctAnswer: "c",
      explanation: "「趣味」(shumi) means hobby.",
      readingId: "read-n5-001"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-018",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "天気",
      reading: "てんき",
      options: [
        { id: "a", meaning: "time" },
        { id: "b", meaning: "weather" },
        { id: "c", meaning: "place" },
        { id: "d", meaning: "person" }
      ],
      correctAnswer: "b",
      explanation: "「天気」(tenki) means weather.",
      readingId: "read-n5-007"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-019",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "靴",
      reading: "くつ",
      options: [
        { id: "a", meaning: "hat" },
        { id: "b", meaning: "shoes" },
        { id: "c", meaning: "bag" },
        { id: "d", meaning: "coat" }
      ],
      correctAnswer: "b",
      explanation: "「靴」(kutsu) means shoes.",
      readingId: "read-n5-005"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-020",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "駅",
      reading: "えき",
      options: [
        { id: "a", meaning: "airport" },
        { id: "b", meaning: "port" },
        { id: "c", meaning: "station" },
        { id: "d", meaning: "bank" }
      ],
      correctAnswer: "c",
      explanation: "「駅」(eki) means station.",
      readingId: "read-n5-018"
    } as VocabularyMatchingExercise
  },

  // Comprehension - Basic
  {
    id: "ex-n5-021",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read the passage and answer the question:",
    data: {
      question: "田中さんは何处に出身ですか？\n\n「私の名前は田中あおいと言います。十八歳です。東京都の出身です。今は大学の日本語を勉强しています。」",
      options: ["大阪", "京都", "東京都", "奈良"],
      correctAnswer: 2,
      explanation: "From the reading: 「東京都の出身です」(I am from Tokyo).",
      readingId: "read-n5-001"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-022",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read the passage and answer the question:",
    data: {
      question: "父は何をしている人ですか？\n\n「父は会社の社长です。每日忙しく働いています。」",
      options: ["教師", "社长", "医者", "店員"],
      correctAnswer: 1,
      explanation: "From the reading: 「父は会社の社长です」(My father is a company president).",
      readingId: "read-n5-003"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-023",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read the passage and answer the question:",
    data: {
      question: "靴はいくらでしたか？\n\n「デパートで新しい靴を買いました。三万円でした。」",
      options: ["二万円", "三万円", "四万円", "五万円"],
      correctAnswer: 1,
      explanation: "From the reading: 「三万円でした」(It was 30,000 yen).",
      readingId: "read-n5-005"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-024",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read the passage and answer the question:",
    data: {
      question: "放課後干什么？\n\n「放課後は部活があります。火曜日は日本語のClaireがあります。」",
      options: ["回家", "部活", "買い物", "勉強"],
      correctAnswer: 1,
      explanation: "From the reading: 「放課後は部活があります」(After school, there are club activities).",
      readingId: "read-n5-002"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-025",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read the passage and answer the question:",
    data: {
      question: "駅はどこにありますか？\n\n「この道をまっすぐ行ってください。二番目の交差点で右に曲がってください。銀行の裏侧になります。」",
      options: ["银行前面", "银行后面", "银行的左边", "银行的右边"],
      correctAnswer: 1,
      explanation: "From the reading: 「銀行の裏侧になります」(It will be behind the bank).",
      readingId: "read-n5-018"
    } as MultipleChoiceExercise
  },

  // Sentence Ordering - Basic
  {
    id: "ex-n5-026",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words to form a correct sentence:",
    data: {
      scrambledWords: ["起きます", "六時半", "毎日", "に"],
      correctOrder: [2, 0, 1, 3],
      correctSentence: "毎日六時半に起きます。",
      explanation: "Time expressions typically come before the verb in Japanese.",
      readingId: "read-n5-004"
    } as SentenceOrderExercise
  },
  {
    id: "ex-n5-027",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words to form a correct sentence:",
    data: {
      scrambledWords: ["です", "四人", "家族", "私"],
      correctOrder: [2, 0, 3, 1],
      correctSentence: "家族は四人です。",
      explanation: "The topic marker は follows the topic.",
      readingId: "read-n5-003"
    } as SentenceOrderExercise
  },
  {
    id: "ex-n5-028",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words to form a correct sentence:",
    data: {
      scrambledWords: ["晴れ", "今日", "です"],
      correctOrder: [1, 0, 2],
      correctSentence: "今日は晴れです。",
      explanation: "Topic comes first, followed by the predicate.",
      readingId: "read-n5-007"
    } as SentenceOrderExercise
  },
  {
    id: "ex-n5-029",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words to form a correct sentence:",
    data: {
      scrambledWords: ["です", "収集", "趣味", "切手", "の"],
      correctOrder: [2, 0, 3, 4, 1],
      correctSentence: "趣味は切手の収集です。",
      explanation: "The topic + は + modifier + の + noun + です pattern.",
      readingId: "read-n5-001"
    } as SentenceOrderExercise
  },
  {
    id: "ex-n5-030",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words to form a correct sentence:",
    data: {
      scrambledWords: ["です", "駅", "どこ"],
      correctOrder: [1, 0, 2],
      correctSentence: "駅はどこですか？",
      explanation: "Question word order: noun + は + question word + か.",
      readingId: "read-n5-018"
    } as SentenceOrderExercise
  },

  // Translation - Basic
  {
    id: "ex-n5-031",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate the following sentence:",
    data: {
      originalSentence: "おはようございます。",
      language: "ja-en",
      options: [
        "Good night.",
        "Good morning.",
        "Thank you.",
        "Excuse me."
      ],
      correctAnswer: 1,
      explanation: "「おはようございます」means Good morning.",
    } as TranslationExercise
  },
  {
    id: "ex-n5-032",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate the following sentence:",
    data: {
      originalSentence: "ありがとうございます。",
      language: "ja-en",
      options: [
        "Good morning.",
        "See you later.",
        "Thank you.",
        "Goodbye."
      ],
      correctAnswer: 2,
      explanation: "「ありがとうございます」means Thank you very much.",
    } as TranslationExercise
  },
  {
    id: "ex-n5-033",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate the following sentence:",
    data: {
      originalSentence: "すみません、駅はどこですか？",
      language: "ja-en",
      options: [
        "Excuse me, where is the station?",
        "Hello, I am at the station.",
        "Thank you for the station.",
        "Goodbye, station."
      ],
      correctAnswer: 0,
      explanation: "「すみません」is used to get attention and apologize. 「どこですか」means where is it?",
      readingId: "read-n5-018"
    } as TranslationExercise
  },
  {
    id: "ex-n5-034",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate the following sentence:",
    data: {
      originalSentence: "家族は四人です。",
      language: "ja-en",
      options: [
        "There are three people in my family.",
        "There are four people in my family.",
        "There are five people in my family.",
        "There are two people in my family."
      ],
      correctAnswer: 1,
      explanation: "「四人です」means there are four people.",
      readingId: "read-n5-003"
    } as TranslationExercise
  },
  {
    id: "ex-n5-035",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate the following sentence:",
    data: {
      originalSentence: "趣味は切手の収集です。",
      language: "ja-en",
      options: [
        "My hobby is reading books.",
        "My hobby is collecting stamps.",
        "My hobby is taking photos.",
        "My hobby is cooking."
      ],
      correctAnswer: 1,
      explanation: "「切手の収集」means stamp collecting.",
      readingId: "read-n5-001"
    } as TranslationExercise
  },

  // More Multiple Choice
  {
    id: "ex-n5-036",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct particle:",
    data: {
      question: "私_____日本語を勉强しています。",
      options: ["は", "が", "を", "に"],
      correctAnswer: 0,
      explanation: "「は」marks the topic of the sentence.",
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-037",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct particle:",
    data: {
      question: "電車_____乗ります。",
      options: ["は", "が", "を", "で"],
      correctAnswer: 3,
      explanation: "「で」indicates the means of transportation.",
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-038",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "_____は晴れです。",
      options: ["今日", "明日", "昨日", "毎日"],
      correctAnswer: 0,
      explanation: "「今日」(kyou) means today.",
      readingId: "read-n5-007"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-039",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "_____は十八歳です。",
      options: ["私", "父", "母", "妹"],
      correctAnswer: 0,
      explanation: "From the reading: 「十八歳です」(I am 18 years old).",
      readingId: "read-n5-001"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-040",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "_____は高中生了。",
      options: ["父", "母", "妹", "私"],
      correctAnswer: 2,
      explanation: "From the reading: 「妹は十七歳で、高校生です」(The sister is 17 and a high school student).",
      readingId: "read-n5-003"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-041",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "放課後_____部活があります。",
      options: ["は", "が", "を", "で"],
      correctAnswer: 0,
      explanation: "「は」marks the topic being discussed.",
      readingId: "read-n5-002"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-042",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "三万円_____鞋子的价格。",
      options: ["で", "に", "と", "の"],
      correctAnswer: 3,
      explanation: "「の」connects the modifier to the noun.",
      readingId: "read-n5-005"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-043",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "银行在车站的_____。",
      options: ["前", "後ろ", "上", "下"],
      correctAnswer: 1,
      explanation: "「裏」(ura) means behind/back.",
      readingId: "read-n5-018"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-044",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "在第二个路口_____转。",
      options: ["左に", "右に", "前に", "後に"],
      correctAnswer: 1,
      explanation: "「右に曲がる」means to turn right.",
      readingId: "read-n5-018"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-045",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Choose the correct answer:",
    data: {
      question: "明天预计有_____。",
      options: ["晴れ", "雨", "雪", "曇り"],
      correctAnswer: 1,
      explanation: "From the reading: 「明日は雨が降る見込みです」(Rain is expected tomorrow).",
      readingId: "read-n5-007"
    } as MultipleChoiceExercise
  },

  // More Fill in the Blank
  {
    id: "ex-n5-046",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "每朝六時半_____起きます。",
      blankPosition: 0,
      options: ["で", "に", "は", "が"],
      correctAnswer: 1,
      explanation: "「に」marks the specific time.",
      readingId: "read-n5-004"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-047",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "家族_____四人です。",
      blankPosition: 0,
      options: ["が", "は", "を", "に"],
      correctAnswer: 1,
      explanation: "「は」marks the topic.",
      readingId: "read-n5-003"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-048",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "趣味_____切手の収集です。",
      blankPosition: 0,
      options: ["が", "は", "を", "の"],
      correctAnswer: 1,
      explanation: "「は」marks the topic.",
      readingId: "read-n5-001"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-049",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "今日_____晴れです。",
      blankPosition: 0,
      options: ["が", "は", "を", "で"],
      correctAnswer: 1,
      explanation: "「は」marks the topic.",
      readingId: "read-n5-007"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-050",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "駅_____どこですか？",
      blankPosition: 0,
      options: ["が", "は", "を", "で"],
      correctAnswer: 1,
      explanation: "「は」marks the topic.",
      readingId: "read-n5-018"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-051",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "デパート_____新しい靴を買いました。",
      blankPosition: 0,
      options: ["で", "に", "は", "が"],
      correctAnswer: 0,
      explanation: "「で」marks the location where an action takes place.",
      readingId: "read-n5-005"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-052",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "学校_____九時に始まります。",
      blankPosition: 0,
      options: ["が", "は", "を", "に"],
      correctAnswer: 1,
      explanation: "「は」marks the topic.",
      readingId: "read-n5-002"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-053",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "放課後_____部活があります。",
      blankPosition: 0,
      options: ["が", "は", "を", "で"],
      correctAnswer: 1,
      explanation: "「は」marks the topic.",
      readingId: "read-n5-002"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-054",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "靴_____三万円でした。",
      blankPosition: 0,
      options: ["が", "は", "を", "で"],
      correctAnswer: 1,
      explanation: "「は」marks the topic.",
      readingId: "read-n5-005"
    } as FillBlankExercise
  },
  {
    id: "ex-n5-055",
    type: "fill-blank",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Fill in the blank:",
    data: {
      sentence: "银行_____裏侧にあります。",
      blankPosition: 0,
      options: ["が", "は", "を", "の"],
      correctAnswer: 3,
      explanation: "「の」connects the modifier to the noun.",
      readingId: "read-n5-018"
    } as FillBlankExercise
  },

  // More True/False
  {
    id: "ex-n5-056",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "田中さんは東京都出身です。",
      correctAnswer: true,
      explanation: "From the reading: 「東京都の出身です」.",
      readingId: "read-n5-001"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-057",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "授業は八時に始まります。",
      correctAnswer: false,
      explanation: "From the reading: 「授業は九時に始まります」(Classes start at 9).",
      readingId: "read-n5-002"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-058",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "最高気温は二十八度です。",
      correctAnswer: true,
      explanation: "From the reading: 「最高気温は二十八度です」.",
      readingId: "read-n5-007"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-059",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "靴は二万円でした。",
      correctAnswer: false,
      explanation: "From the reading: 「三万円でした」(It was 30,000 yen).",
      readingId: "read-n5-005"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-060",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "车站前面有银行。",
      correctAnswer: false,
      explanation: "From the reading: 「銀行の裏侧になります」(It will be behind the bank).",
      readingId: "read-n5-018"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-061",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "趣味は切手の収集です。",
      correctAnswer: true,
      explanation: "From the reading: 「趣味は切手の収集です」.",
      readingId: "read-n5-001"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-062",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "父は医者です。",
      correctAnswer: false,
      explanation: "From the reading: 「父は会社の社长です」(My father is a company president).",
      readingId: "read-n5-003"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-063",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "母は看護師です。",
      correctAnswer: true,
      explanation: "From the reading: 「母は医院的护士です」(My mother is a nurse).",
      readingId: "read-n5-003"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-064",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "学校は六時までです。",
      correctAnswer: true,
      explanation: "From the reading: 「がっこうは六時までです」(School is until 6).",
      readingId: "read-n5-002"
    } as TrueFalseExercise
  },
  {
    id: "ex-n5-065",
    type: "true-false",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Is this statement true or false?",
    data: {
      statement: "明天不下雨。",
      correctAnswer: false,
      explanation: "From the reading: 「明日は雨が降る見込みです」(Rain is expected tomorrow).",
      readingId: "read-n5-007"
    } as TrueFalseExercise
  },

  // More Vocabulary Matching
  {
    id: "ex-n5-066",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "授業",
      reading: "じゅぎょう",
      options: [
        { id: "a", meaning: "homework" },
        { id: "b", meaning: "class/lesson" },
        { id: "c", meaning: "exam" },
        { id: "d", meaning: "club" }
      ],
      correctAnswer: "b",
      explanation: "「授業」(jugyou) means class or lesson.",
      readingId: "read-n5-002"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-067",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "部活",
      reading: "ぶかつ",
      options: [
        { id: "a", meaning: "homework" },
        { id: "b", meaning: "club activities" },
        { id: "c", meaning: "class" },
        { id: "d", meaning: "club member" }
      ],
      correctAnswer: "b",
      explanation: "「部活」(bukatsu) means club activities.",
      readingId: "read-n5-002"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-068",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: " перемена",
      reading: "こうさてん",
      options: [
        { id: "a", meaning: "corner" },
        { id: "b", meaning: "intersection" },
        { id: "c", meaning: "crossing" },
        { id: "d", meaning: "road" }
      ],
      correctAnswer: "b",
      explanation: "「交差点」(kousaten) means intersection.",
      readingId: "read-n5-018"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-069",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "右",
      reading: "みぎ",
      options: [
        { id: "a", meaning: "left" },
        { id: "b", meaning: "right" },
        { id: "c", meaning: "front" },
        { id: "d", meaning: "back" }
      ],
      correctAnswer: "b",
      explanation: "「右」(migi) means right.",
      readingId: "read-n5-018"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-070",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "最高気温",
      reading: "さいこうきおん",
      options: [
        { id: "a", meaning: "lowest temperature" },
        { id: "b", meaning: "average temperature" },
        { id: "c", meaning: "highest temperature" },
        { id: "d", meaning: "current temperature" }
      ],
      correctAnswer: "c",
      explanation: "「最高気温」(saikou kion) means highest temperature.",
      readingId: "read-n5-007"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-071",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "弯る",
      reading: "まがる",
      options: [
        { id: "a", meaning: "to go straight" },
        { id: "b", meaning: "to turn" },
        { id: "c", meaning: "to stop" },
        { id: "d", meaning: "to run" }
      ],
      correctAnswer: "b",
      explanation: "「曲がる」(magaru) means to turn.",
      readingId: "read-n5-018"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-072",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "雨天",
      reading: "あめ",
      options: [
        { id: "a", meaning: "snow" },
        { id: "b", meaning: "sun" },
        { id: "c", meaning: "wind" },
        { id: "d", meaning: "rain" }
      ],
      correctAnswer: "d",
      explanation: "「雨」(ame) means rain.",
      readingId: "read-n5-007"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-073",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "每天",
      reading: "まいにち",
      options: [
        { id: "a", meaning: "tomorrow" },
        { id: "b", meaning: "yesterday" },
        { id: "c", meaning: "every day" },
        { id: "d", meaning: "today" }
      ],
      correctAnswer: "c",
      explanation: "「毎日」(mainichi) means every day.",
      readingId: "read-n5-004"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-074",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "友達",
      reading: "ともだち",
      options: [
        { id: "a", meaning: "family" },
        { id: "b", meaning: "teacher" },
        { id: "c", meaning: "friend" },
        { id: "d", meaning: "enemy" }
      ],
      correctAnswer: "c",
      explanation: "「友達」(tomodachi) means friend.",
      readingId: "read-n5-001"
    } as VocabularyMatchingExercise
  },
  {
    id: "ex-n5-075",
    type: "vocabulary-matching",
    difficulty: "easy",
    jlptLevel: "N5",
    instruction: "Match the Japanese word with its meaning:",
    data: {
      japaneseWord: "大学",
      reading: "だいがく",
      options: [
        { id: "a", meaning: "high school" },
        { id: "b", meaning: "university" },
        { id: "c", meaning: "middle school" },
        { id: "d", meaning: "elementary school" }
      ],
      correctAnswer: "b",
      explanation: "「大学」(daigaku) means university.",
      readingId: "read-n5-001"
    } as VocabularyMatchingExercise
  },

  // More Comprehension
  {
    id: "ex-n5-076",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "田中さんの名前は、なんですか？\n\n「私の名前は田中あおいと言います。」",
      options: ["田中", "あおい", "田中あおい", "不明"],
      correctAnswer: 2,
      explanation: "「田中あおい」(Tanaka Aoi) is the full name.",
      readingId: "read-n5-001"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-077",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "学校はいつ始まりますか？\n\n「授業は九時に始まります。」",
      options: ["八時", "九時", "十時", "七時"],
      correctAnswer: 1,
      explanation: "From the reading: 「九時に始まります」.",
      readingId: "read-n5-002"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-078",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "妈妈是什么职业？\n\n「母は医院的护士です。夜も働きます。」",
      options: ["教師", "护士", "社长", "店員"],
      correctAnswer: 1,
      explanation: "From the reading: 「母は医院的护士です」(My mother is a nurse at a hospital).",
      readingId: "read-n5-003"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-079",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "今天的天气怎么样？\n\n「今日は晴れで、最高気温は二十八度です。」",
      options: ["雨で寒い", "曇りで涼しい", "晴れで暑い", "雪で冷たい"],
      correctAnswer: 2,
      explanation: "From the reading: 「今日は晴れで、最高気温は二十八度です」(Today is sunny with 28 degrees).",
      readingId: "read-n5-007"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-080",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "买东西花了多少钱？\n\n「全部で五千円使いました。」",
      options: ["三万円", "五千円", "一万円", "二千円"],
      correctAnswer: 1,
      explanation: "From the reading: 「全部で五千円使いました」(I spent 5,000 yen in total).",
      readingId: "read-n5-005"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-081",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "周末做什么？\n\n「週末に友達と集まります。」",
      options: ["一人で勉強する", "家族と旅行する", "友達と集まる", "在家睡觉"],
      correctAnswer: 2,
      explanation: "From the reading: 「週末に友達と集まります」(I meet with friends on weekends).",
      readingId: "read-n5-001"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-082",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "妹妹几岁？\n\n「妹は十七歳で、高校生です。」",
      options: ["十五歳", "十六歳", "十七歳", "十八歳"],
      correctAnswer: 2,
      explanation: "From the reading: 「妹は十七歳」(My sister is 17).",
      readingId: "read-n5-003"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-083",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "学校几点结束？\n\n「がっこうは六時までです。」",
      options: ["五時まで", "六時まで", "七時まで", "八時まで"],
      correctAnswer: 1,
      explanation: "From the reading: 「がっこうは六時までです」(School is until 6).",
      readingId: "read-n5-002"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-084",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "在哪里买鞋？\n\n「デパートで新しい靴を買いました。」",
      options: ["超市", "デパート", "便利店", "市场"],
      correctAnswer: 1,
      explanation: "From the reading: 「デパートで新しい靴を買いました」(I bought new shoes at the department store).",
      readingId: "read-n5-005"
    } as MultipleChoiceExercise
  },
  {
    id: "ex-n5-085",
    type: "comprehension",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Read and answer:",
    data: {
      question: "在哪个路口转弯？\n\n「二番目の交差点で右に曲がってください。」",
      options: ["一番目", "二番目", "三番目", "四番目"],
      correctAnswer: 1,
      explanation: "From the reading: 「二番目の交差点で右に曲がってください」(Turn right at the second intersection).",
      readingId: "read-n5-018"
    } as MultipleChoiceExercise
  },

  // More Sentence Ordering
  {
    id: "ex-n5-086",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words:",
    data: {
      scrambledWords: ["です", "晴れ", "今日"],
      correctOrder: [2, 1, 0],
      correctSentence: "今日は晴れです。",
      explanation: "Topic (今日) + predicate (晴れです).",
      readingId: "read-n5-007"
    } as SentenceOrderExercise
  },
  {
    id: "ex-n5-087",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words:",
    data: {
      scrambledWords: ["大学", "日本語", "勉强", "で", "しています"],
      correctOrder: [0, 2, 3, 1, 4],
      correctSentence: "大学で日本語を勉强しています。",
      explanation: "Place + object + verb with -te iru form.",
      readingId: "read-n5-001"
    } as SentenceOrderExercise
  },
  {
    id: "ex-n5-088",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words:",
    data: {
      scrambledWords: ["学校", "九時", "に", "始まります"],
      correctOrder: [0, 1, 2, 3],
      correctSentence: "学校は九時に始まります。",
      explanation: "Topic + time + particle + verb.",
      readingId: "read-n5-002"
    } as SentenceOrderExercise
  },
  {
    id: "ex-n5-089",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words:",
    data: {
      scrambledWords: ["です", "高校生了", "妹"],
      correctOrder: [2, 0, 1],
      correctSentence: "妹は高校生了です。",
      explanation: "Topic + copula + predicate.",
      readingId: "read-n5-003"
    } as SentenceOrderExercise
  },
  {
    id: "ex-n5-090",
    type: "sentence-order",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Arrange the words:",
    data: {
      scrambledWords: ["で", "新しい靴", "買いました", "デパート"],
      correctOrder: [0, 2, 1, 3],
      correctSentence: "デパートで新しい靴を買いました。",
      explanation: "Location + object + verb in past tense.",
      readingId: "read-n5-005"
    } as SentenceOrderExercise
  },

  // More Translation
  {
    id: "ex-n5-091",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "每朝六時半に起きます。",
      language: "ja-en",
      options: [
        "I go to bed at 6:30 every morning.",
        "I wake up at 6:30 every morning.",
        "I eat breakfast at 6:30 every morning.",
        "I study at 6:30 every morning."
      ],
      correctAnswer: 1,
      explanation: "「起きます」means to wake up/get up.",
      readingId: "read-n5-004"
    } as TranslationExercise
  },
  {
    id: "ex-n5-092",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "家族は四人です。",
      language: "ja-en",
      options: [
        "There are three people in my family.",
        "There are four people in my family.",
        "There are five people in my family.",
        "There are two people in my family."
      ],
      correctAnswer: 1,
      explanation: "「四人です」means four people.",
      readingId: "read-n5-003"
    } as TranslationExercise
  },
  {
    id: "ex-n5-093",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "放課後は部活があります。",
      language: "ja-en",
      options: [
        "After school, there is homework.",
        "After school, there is club activities.",
        "After school, there is lunch.",
        "After school, there is a test."
      ],
      correctAnswer: 1,
      explanation: "「部活」(bukatsu) means club activities.",
      readingId: "read-n5-002"
    } as TranslationExercise
  },
  {
    id: "ex-n5-094",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "趣味は切手の収集です。",
      language: "ja-en",
      options: [
        "My hobby is collecting stamps.",
        "My hobby is reading books.",
        "My hobby is watching TV.",
        "My hobby is cooking."
      ],
      correctAnswer: 0,
      explanation: "「切手の収集」means stamp collecting.",
      readingId: "read-n5-001"
    } as TranslationExercise
  },
  {
    id: "ex-n5-095",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "今日は晴れです。",
      language: "ja-en",
      options: [
        "Today is rainy.",
        "Today is cloudy.",
        "Today is snowy.",
        "Today is sunny."
      ],
      correctAnswer: 3,
      explanation: "「晴れ」(hare) means sunny/clear.",
      readingId: "read-n5-007"
    } as TranslationExercise
  },
  {
    id: "ex-n5-096",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "まっすぐ行ってください。",
      language: "ja-en",
      options: [
        "Please turn left.",
        "Please turn right.",
        "Please go straight.",
        "Please stop."
      ],
      correctAnswer: 2,
      explanation: "「まっすぐ行ってください」means please go straight.",
      readingId: "read-n5-018"
    } as TranslationExercise
  },
  {
    id: "ex-n5-097",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "三万円でした。",
      language: "ja-en",
      options: [
        "It was 20,000 yen.",
        "It was 30,000 yen.",
        "It was 40,000 yen.",
        "It was 50,000 yen."
      ],
      correctAnswer: 1,
      explanation: "「三万円」means 30,000 yen.",
      readingId: "read-n5-005"
    } as TranslationExercise
  },
  {
    id: "ex-n5-098",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "右に曲がってください。",
      language: "ja-en",
      options: [
        "Please turn left.",
        "Please turn right.",
        "Please go straight.",
        "Please wait."
      ],
      correctAnswer: 1,
      explanation: "「右に曲がる」means to turn right.",
      readingId: "read-n5-018"
    } as TranslationExercise
  },
  {
    id: "ex-n5-099",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "明日は雨が降る見込みです。",
      language: "ja-en",
      options: [
        "It will be sunny tomorrow.",
        "It will be snowy tomorrow.",
        "Rain is expected tomorrow.",
        "It will be cloudy tomorrow."
      ],
      correctAnswer: 2,
      explanation: "「雨が降る見込みです」means rain is expected.",
      readingId: "read-n5-007"
    } as TranslationExercise
  },
  {
    id: "ex-n5-100",
    type: "translation",
    difficulty: "medium",
    jlptLevel: "N5",
    instruction: "Translate:",
    data: {
      originalSentence: "全部で五千円使いました。",
      language: "ja-en",
      options: [
        "I spent 3,000 yen in total.",
        "I spent 5,000 yen in total.",
        "I spent 10,000 yen in total.",
        "I spent 1,000 yen in total."
      ],
      correctAnswer: 1,
      explanation: "「五千円」means 5,000 yen.",
      readingId: "read-n5-005"
    } as TranslationExercise
  },
];

// Helper functions
export const getExercisesByLevel = (level: JLPTLevel): ReadingExercise[] => {
  return n5ReadingExercises.filter(ex => ex.jlptLevel === level);
};

export const getExercisesByType = (type: ReadingExercise["type"]): ReadingExercise[] => {
  return n5ReadingExercises.filter(ex => ex.type === type);
};

export const getExercisesByDifficulty = (difficulty: ReadingExercise["difficulty"]): ReadingExercise[] => {
  return n5ReadingExercises.filter(ex => ex.difficulty === difficulty);
};

export const getRandomExercises = (count: number, level?: JLPTLevel): ReadingExercise[] => {
  let exercises = level ? getExercisesByLevel(level) : n5ReadingExercises;
  return [...exercises].sort(() => Math.random() - 0.5).slice(0, count);
};

export default n5ReadingExercises;
