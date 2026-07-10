// Learning Journey Mock Data

export type LessonStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
export type SkillType = "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";

export interface VocabularyItem {
  word: string;
  furigana: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

export interface GrammarPattern {
  pattern: string;
  explanation: string;
  examples: string[];
}

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  passageText: string;
  questions: QuizQuestion[];
  difficulty?: string;
  estimatedTime?: number;
}

export interface SkillContent {
  type: SkillType;
  vocabulary?: VocabularyItem[];
  grammar?: GrammarPattern[];
  readingText?: string;
  readingQuestions?: QuizQuestion[];
  readingPassages?: ReadingPassage[];
  readingLessonId?: string;
  listeningAudio?: string;
  listeningQuestions?: QuizQuestion[];
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  titleJapanese: string;
  description: string;
  level: string;
  status: LessonStatus;
  score?: number;
  skills: SkillContent[];
  xpReward: number;
  badgeReward?: string;
}

export interface JourneyProgress {
  totalXp: number;
  currentLessonId: string;
  completedLessons: number;
  totalLessons: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt?: string;
}

export const JOURNEY_BADGES: Badge[] = [
  { id: "first-lesson", name: "First Step", icon: "🌱", earnedAt: "2026-06-01" },
  { id: "vocabulary-master", name: "Vocabulary Master", icon: "📚" },
  { id: "grammar-hero", name: "Grammar Hero", icon: "🏆" },
  { id: "listening-champion", name: "Listening Champion", icon: "🎧" },
  { id: "reading-expert", name: "Reading Expert", icon: "📖" },
  { id: "journey-complete", name: "Journey Complete", icon: "🎉" },
];

export const JOURNEY_LESSONS: Lesson[] = [
  {
    id: "lesson-01",
    number: 1,
    title: "Greetings",
    titleJapanese: "在日本打招呼",
    description: "Learn essential Japanese greetings for everyday situations.",
    level: "N5",
    status: "COMPLETED",
    score: 92,
    xpReward: 300,
    badgeReward: "first-lesson",
    skills: [
      {
        type: "VOCABULARY",
        vocabulary: [
          {
            word: "こんにちは",
            furigana: "konnichiwa",
            meaning: "Hello / Good afternoon",
            example: "こんにちは、田中さん。",
            exampleMeaning: "Hello, Tanaka-san.",
          },
          {
            word: "おはよう",
            furigana: "ohayou",
            meaning: "Good morning",
            example: "おはようございます。",
            exampleMeaning: "Good morning.",
          },
          {
            word: "こんばんは",
            furigana: "konbanwa",
            meaning: "Good evening",
            example: "こんばんは、先生。",
            exampleMeaning: "Good evening, sensei.",
          },
          {
            word: "さようなら",
            furigana: "sayounara",
            meaning: "Goodbye",
            example: "さようなら、また明日。",
            exampleMeaning: "Goodbye, see you tomorrow.",
          },
          {
            word: "ありがとう",
            furigana: "arigatou",
            meaning: "Thank you",
            example: "ありがとうございます。",
            exampleMeaning: "Thank you very much.",
          },
        ],
      },
      {
        type: "GRAMMAR",
        grammar: [
          {
            pattern: "N は N です",
            explanation:
              "This is the basic sentence pattern meaning 'N is N'. It is used to make simple declarative statements.",
            examples: [
              "私は学生です。(I am a student.)",
              "田中さんは先生です。(Tanaka-san is a teacher.)",
              "これは本です。(This is a book.)",
            ],
          },
        ],
      },
      {
        type: "READING",
        readingLessonId: "reading-01",
      },
      {
        type: "LISTENING",
        listeningQuestions: [
          {
            id: "l1-1",
            type: "multiple_choice",
            question: "How do you say 'Thank you' politely?",
            options: ["さようなら", "おはよう", "ありがとう", "こんにちは"],
            correctAnswer: "ありがとう",
          },
        ],
      },
    ],
  },
  {
    id: "lesson-02",
    number: 2,
    title: "Daily Conversation",
    titleJapanese: "毎日の会話",
    description: "Practice common daily conversations in Japanese.",
    level: "N5",
    status: "IN_PROGRESS",
    score: 75,
    xpReward: 300,
    skills: [
      {
        type: "VOCABULARY",
        vocabulary: [
          {
            word: "今日",
            furigana: "kyou",
            meaning: "Today",
            example: "今日はいい天気です。",
            exampleMeaning: "Today is nice weather.",
          },
          {
            word: "明日",
            furigana: "ashita",
            meaning: "Tomorrow",
            example: "明日は学校に行きます。",
            exampleMeaning: "I will go to school tomorrow.",
          },
          {
            word: "昨日",
            furigana: "kinou",
            meaning: "Yesterday",
            example: "昨日は忙しかったです。",
            exampleMeaning: "Yesterday was busy.",
          },
          {
            word: "元気",
            furigana: "genki",
            meaning: "Healthy / Fine",
            example: "元気ですか。",
            exampleMeaning: "Are you well?",
          },
          {
            word: "名前",
            furigana: "namae",
            meaning: "Name",
            example: "あなたの名前は何ですか。",
            exampleMeaning: "What is your name?",
          },
        ],
      },
      {
        type: "GRAMMAR",
        grammar: [
          {
            pattern: "N は N が adj です",
            explanation: "This pattern expresses preference or ability. 'N is ... for N'",
            examples: [
              "私は肉が好きです。(I like meat.)",
              "田中さんは日本語が上手です。(Tanaka-san is good at Japanese.)",
            ],
          },
        ],
      },
      {
        type: "READING",
        readingLessonId: "reading-02",
      },
      {
        type: "LISTENING",
        listeningQuestions: [
          {
            id: "l2-1",
            type: "multiple_choice",
            question: "What does '元気ですか' mean?",
            options: [
              "How are you?",
              "What is your name?",
              "Where are you from?",
              "What time is it?",
            ],
            correctAnswer: "How are you?",
          },
        ],
      },
    ],
  },
  {
    id: "lesson-03",
    number: 3,
    title: "Family",
    titleJapanese: "家族",
    description: "Learn vocabulary and expressions related to family members.",
    level: "N5",
    status: "AVAILABLE",
    xpReward: 300,
    skills: [
      {
        type: "VOCABULARY",
        vocabulary: [
          {
            word: "家族",
            furigana: "kazoku",
            meaning: "Family",
            example: "私の家族は四人です。",
            exampleMeaning: "My family has four people.",
          },
          {
            word: "父",
            furigana: "chichi",
            meaning: "Father (my)",
            example: "父は先生です。",
            exampleMeaning: "My father is a teacher.",
          },
          {
            word: "母",
            furigana: "haha",
            meaning: "Mother (my)",
            example: "母は医者です。",
            exampleMeaning: "My mother is a doctor.",
          },
          {
            word: "兄弟",
            furigana: "kyoudai",
            meaning: "Brothers / Siblings",
            example: "兄弟は何人ですか。",
            exampleMeaning: "How many siblings do you have?",
          },
          {
            word: "子供",
            furigana: "kodomo",
            meaning: "Child / Children",
            example: "子供は三人です。",
            exampleMeaning: "There are three children.",
          },
        ],
      },
      {
        type: "GRAMMAR",
        grammar: [
          {
            pattern: "N の N",
            explanation: "The particle 'no' shows possession or relationship between nouns.",
            examples: [
              "私の本。(My book)",
              "田中さんの家。(Tanaka-san's house)",
              "日本語の老师。(Japanese language)",
            ],
          },
        ],
      },
      {
        type: "READING",
        readingLessonId: "reading-03",
      },
      {
        type: "LISTENING",
        listeningQuestions: [
          {
            id: "l3-1",
            type: "multiple_choice",
            question: "What is the mother's occupation?",
            options: ["Teacher", "Doctor", "Nurse", "Engineer"],
            correctAnswer: "Nurse",
          },
        ],
      },
    ],
  },
  {
    id: "lesson-04",
    number: 4,
    title: "Colors and Shapes",
    titleJapanese: "色と形",
    description: "Learn Japanese words for colors and basic shapes.",
    level: "N5",
    status: "LOCKED",
    xpReward: 350,
    skills: [
      {
        type: "VOCABULARY",
        vocabulary: [
          {
            word: "赤い",
            furigana: "akai",
            meaning: "Red",
            example: "これは赤い車です。",
            exampleMeaning: "This is a red car.",
          },
          {
            word: "青い",
            furigana: "aoi",
            meaning: "Blue",
            example: "空は青いですか。",
            exampleMeaning: "Is the sky blue?",
          },
          {
            word: "白い",
            furigana: "shiroi",
            meaning: "White",
            example: "白い猫が好きです。",
            exampleMeaning: "I like white cats.",
          },
          {
            word: "丸い",
            furigana: "marui",
            meaning: "Round / Circular",
            example: "月は丸いです。",
            exampleMeaning: "The moon is round.",
          },
          {
            word: "四角い",
            furigana: "shikakui",
            meaning: "Square",
            example: "この家は四角いです。",
            exampleMeaning: "This house is square.",
          },
        ],
      },
      {
        type: "GRAMMAR",
        grammar: [
          {
            pattern: "N は adj です",
            explanation:
              "Simple adjective sentence pattern. The copula 'desu' follows the adjective.",
            examples: [
              "空は青いです。(The sky is blue.)",
              "この花は赤いです。(This flower is red.)",
              "今日は暑いです。(Today is hot.)",
            ],
          },
        ],
      },
      {
        type: "READING",
        readingLessonId: "reading-04",
      },
      {
        type: "LISTENING",
        listeningQuestions: [
          {
            id: "l4-1",
            type: "multiple_choice",
            question: "What does '赤い' mean?",
            options: ["Blue", "White", "Red", "Black"],
            correctAnswer: "Red",
          },
        ],
      },
    ],
  },
  {
    id: "lesson-05",
    number: 5,
    title: "Food and Drinks",
    titleJapanese: "食べ物と飲み物",
    description: "Learn essential food and drink vocabulary.",
    level: "N5",
    status: "LOCKED",
    xpReward: 350,
    skills: [
      {
        type: "VOCABULARY",
        vocabulary: [
          {
            word: "水",
            furigana: "mizu",
            meaning: "Water",
            example: "水をください。",
            exampleMeaning: "Please give me water.",
          },
          {
            word: "ご飯",
            furigana: "gohan",
            meaning: "Rice / Meal",
            example: "朝ごはんを食べます。",
            exampleMeaning: "I eat breakfast.",
          },
          {
            word: "パン",
            furigana: "pan",
            meaning: "Bread",
            example: "朝ごはんにパンを食べます。",
            exampleMeaning: "I eat bread for breakfast.",
          },
          {
            word: "肉",
            furigana: "niku",
            meaning: "Meat",
            example: "牛肉が好きです。",
            exampleMeaning: "I like beef.",
          },
          {
            word: "野菜",
            furigana: "yasai",
            meaning: "Vegetables",
            example: "野菜を食べましょう。",
            exampleMeaning: "Let's eat vegetables.",
          },
        ],
      },
      {
        type: "GRAMMAR",
        grammar: [
          {
            pattern: "N を Vます",
            explanation: "The particle 'wo' (を) marks the direct object of an action verb.",
            examples: [
              "水を飲みます。(I drink water.)",
              "パンを食べます。(I eat bread.)",
              "本を読みます。(I read a book.)",
            ],
          },
        ],
      },
      {
        type: "READING",
        readingLessonId: "reading-05",
      },
      {
        type: "LISTENING",
        listeningQuestions: [
          {
            id: "l5-1",
            type: "multiple_choice",
            question: "What drink is mentioned?",
            options: ["Tea", "Coffee", "Water", "Juice"],
            correctAnswer: "Water",
          },
        ],
      },
    ],
  },
  {
    id: "lesson-06",
    number: 6,
    title: "Time and Dates",
    titleJapanese: "時間と日付",
    description: "Master Japanese time expressions and calendar terms.",
    level: "N5",
    status: "LOCKED",
    xpReward: 400,
    skills: [
      {
        type: "VOCABULARY",
        vocabulary: [
          {
            word: "時",
            furigana: "ji",
            meaning: "O'clock",
            example: "今、何時ですか。",
            exampleMeaning: "What time is it now?",
          },
          {
            word: "分",
            furigana: "fun",
            meaning: "Minutes",
            example: "十分待ちました。",
            exampleMeaning: "I waited for ten minutes.",
          },
          {
            word: "曜日",
            furigana: "youbi",
            meaning: "Day of the week",
            example: "今日は何曜日ですか。",
            exampleMeaning: "What day of the week is today?",
          },
          {
            word: "月",
            furigana: "tsuki",
            meaning: "Month / Moon",
            example: "今月は六月です。",
            exampleMeaning: "This month is June.",
          },
          {
            word: "年",
            furigana: "toshi",
            meaning: "Year",
            example: "来年日本に行きます。",
            exampleMeaning: "I will go to Japan next year.",
          },
        ],
      },
      {
        type: "GRAMMAR",
        grammar: [
          {
            pattern: "N に Vます",
            explanation: "The particle 'ni' indicates the time at which an action occurs.",
            examples: [
              "六時に起きます。(I wake up at six.)",
              "九時に学校が始まります。(School starts at nine.)",
              "三月に卒業します。(I graduate in March.)",
            ],
          },
        ],
      },
      {
        type: "READING",
        readingLessonId: "reading-06",
      },
      {
        type: "LISTENING",
        listeningQuestions: [
          {
            id: "l6-1",
            type: "multiple_choice",
            question: "When does the person leave home?",
            options: ["6:30", "7:00", "8:00", "9:00"],
            correctAnswer: "8:00",
          },
        ],
      },
    ],
  },
  {
    id: "lesson-07",
    number: 7,
    title: "Places",
    titleJapanese: "場所",
    description: "Learn names of common places in Japan.",
    level: "N5",
    status: "LOCKED",
    xpReward: 400,
    skills: [
      {
        type: "VOCABULARY",
        vocabulary: [
          {
            word: "駅",
            furigana: "eki",
            meaning: "Station",
            example: "駅はどこですか。",
            exampleMeaning: "Where is the station?",
          },
          {
            word: "病院",
            furigana: "byouin",
            meaning: "Hospital",
            example: "病気のとき病院に行きます。",
            exampleMeaning: "I go to the hospital when sick.",
          },
          {
            word: "銀行",
            furigana: "ginkou",
            meaning: "Bank",
            example: "明日銀行に行きます。",
            exampleMeaning: "I will go to the bank tomorrow.",
          },
          {
            word: "学校",
            furigana: "gakkou",
            meaning: "School",
            example: "毎日学校に行きます。",
            exampleMeaning: "I go to school every day.",
          },
          {
            word: "会社",
            furigana: "kaisha",
            meaning: "Company",
            example: "父は会社に勤めています。",
            exampleMeaning: "My father works at a company.",
          },
        ],
      },
      {
        type: "GRAMMAR",
        grammar: [
          {
            pattern: "N は どこですか",
            explanation: "Use 'は どこですか' pattern to ask about location of places.",
            examples: [
              "病院はどこですか。(Where is the hospital?)",
              "銀行は駅の前です。(The bank is in front of the station.)",
              "学校は遠いです。(The school is far.)",
            ],
          },
        ],
      },
      {
        type: "READING",
        readingLessonId: "reading-07",
      },
      {
        type: "LISTENING",
        listeningQuestions: [
          {
            id: "l7-1",
            type: "multiple_choice",
            question: "How does the person commute to school?",
            options: ["By bus", "By train", "By bicycle", "On foot"],
            correctAnswer: "By bicycle",
          },
        ],
      },
    ],
  },
  {
    id: "lesson-08",
    number: 8,
    title: "Shopping",
    titleJapanese: "買い物",
    description: "Practice shopping vocabulary and transactions.",
    level: "N5",
    status: "LOCKED",
    xpReward: 450,
    skills: [
      {
        type: "VOCABULARY",
        vocabulary: [
          {
            word: "買い物",
            furigana: "kaimono",
            meaning: "Shopping",
            example: "友達と買い物に行きます。",
            exampleMeaning: "I go shopping with my friend.",
          },
          {
            word: "店",
            furigana: "mise",
            meaning: "Shop / Store",
            example: "あの店は有名です。",
            exampleMeaning: "That shop is famous.",
          },
          {
            word: "安い",
            furigana: "yasui",
            meaning: "Cheap / Inexpensive",
            example: "このりんごは安いです。",
            exampleMeaning: "This apple is cheap.",
          },
          {
            word: "高い",
            furigana: "takai",
            meaning: "Expensive / Tall",
            example: "輸入品はとても高いです。",
            exampleMeaning: "Imported goods are very expensive.",
          },
          {
            word: "いくら",
            furigana: "ikura",
            meaning: "How much",
            example: "これはいくらですか。",
            exampleMeaning: "How much is this?",
          },
        ],
      },
      {
        type: "GRAMMAR",
        grammar: [
          {
            pattern: "N をください",
            explanation: "Used when ordering or requesting items. Means 'Please give me N'.",
            examples: [
              "このりんごをください。(Please give me this apple.)",
              "コーヒーをください。(Please give me coffee.)",
              "切符を二枚ください。(Please give me two tickets.)",
            ],
          },
        ],
      },
      {
        type: "READING",
        readingLessonId: "reading-08",
      },
      {
        type: "LISTENING",
        listeningQuestions: [
          {
            id: "l8-1",
            type: "multiple_choice",
            question: "What does 'いくらですか' mean?",
            options: ["What is it?", "How many?", "How much?", "Where is it?"],
            correctAnswer: "How much?",
          },
        ],
      },
    ],
  },
];

export const JOURNEY_PROGRESS: JourneyProgress = {
  totalXp: 392,
  currentLessonId: "lesson-02",
  completedLessons: 1,
  totalLessons: JOURNEY_LESSONS.length,
  badges: JOURNEY_BADGES.filter((b) => b.earnedAt),
};

export const getLessonById = (lessonId: string): Lesson | undefined => {
  return JOURNEY_LESSONS.find((l) => l.id === lessonId);
};

export const getOverallProgress = (): number => {
  const completed = JOURNEY_LESSONS.filter((l) => l.status === "COMPLETED").length;
  return Math.round((completed / JOURNEY_LESSONS.length) * 100);
};
