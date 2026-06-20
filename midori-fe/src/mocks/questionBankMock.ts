// Question Bank Mock Data
// This file contains mock data for development
// Later this will be replaced with real backend API calls

import type { JLPTLevel, QuestionType, Difficulty, ListeningQuestion, StandardQuestion, Question } from "../services/questionBank.types";

export interface MockLesson {
  id: number;
  lessonNumber: number;
  lessonName: string;
  questionCount: number;
  createdAt: string;
}

export interface MockListeningQuestion {
  id: string;
  level: JLPTLevel;
  lesson: number;
  type: "Listening";
  difficulty: Difficulty;
  audioUrl: string;
  audioFileName: string;
  audioDuration: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  createdAt: string;
}

// Base mock data - used as initial seed
export const baseMockData: Record<JLPTLevel, MockLesson[]> = {
  N5: [
    { id: 1, lessonNumber: 1, lessonName: "Introduction to Japanese", questionCount: 0, createdAt: new Date().toISOString() },
    { id: 2, lessonNumber: 2, lessonName: "Basic Greetings", questionCount: 0, createdAt: new Date().toISOString() },
    { id: 3, lessonNumber: 3, lessonName: "Numbers and Counting", questionCount: 0, createdAt: new Date().toISOString() },
    { id: 4, lessonNumber: 4, lessonName: "Colors and Shapes", questionCount: 0, createdAt: new Date().toISOString() },
    { id: 5, lessonNumber: 5, lessonName: "Days and Months", questionCount: 0, createdAt: new Date().toISOString() },
  ],
  N4: [
    { id: 1, lessonNumber: 1, lessonName: "Daily Conversations", questionCount: 0, createdAt: new Date().toISOString() },
    { id: 2, lessonNumber: 2, lessonName: "Travel Japanese", questionCount: 0, createdAt: new Date().toISOString() },
    { id: 3, lessonNumber: 3, lessonName: "Shopping and Dining", questionCount: 0, createdAt: new Date().toISOString() },
  ],
  N3: [
    { id: 1, lessonNumber: 1, lessonName: "Intermediate Grammar", questionCount: 0, createdAt: new Date().toISOString() },
    { id: 2, lessonNumber: 2, lessonName: "Reading Comprehension", questionCount: 0, createdAt: new Date().toISOString() },
  ],
  N2: [
    { id: 1, lessonNumber: 1, lessonName: "Advanced Grammar Patterns", questionCount: 0, createdAt: new Date().toISOString() },
    { id: 2, lessonNumber: 2, lessonName: "Business Japanese", questionCount: 0, createdAt: new Date().toISOString() },
  ],
  N1: [
    { id: 1, lessonNumber: 1, lessonName: "Advanced Expressions", questionCount: 0, createdAt: new Date().toISOString() },
    { id: 2, lessonNumber: 2, lessonName: "Academic Japanese", questionCount: 0, createdAt: new Date().toISOString() },
  ],
};

// Mock audio URLs
const MOCK_AUDIO_BASE = "https://www.soundhelix.com/examples/mp3";

// Sample questions for demonstration
export const sampleQuestions: (MockListeningQuestion | Omit<Question, "audio">)[] = [
  {
    id: "q001",
    level: "N5",
    lesson: 1,
    type: "Vocabulary",
    difficulty: "Easy",
    questionText: "What does こんにちは (konnichiwa) mean?",
    options: ["Good morning", "Good afternoon", "Good evening", "Goodbye"],
    correctIndex: 1,
    explanation: "こんにちは means 'Good afternoon' or 'Hello' during the day.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q002",
    level: "N5",
    lesson: 1,
    type: "Vocabulary",
    difficulty: "Easy",
    questionText: "What does あめ (ame) mean?",
    options: ["Snow", "Wind", "Rain", "Sun"],
    correctIndex: 2,
    explanation: "あめ means 'rain' in Japanese.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q003",
    level: "N5",
    lesson: 2,
    type: "Grammar",
    difficulty: "Easy",
    questionText: "Which particle is used to mark the subject?",
    options: ["を (wo)", "が (ga)", "に (ni)", "で (de)"],
    correctIndex: 1,
    explanation: "が (ga) is used to mark the subject of a sentence.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q004",
    level: "N5",
    lesson: 2,
    type: "Grammar",
    difficulty: "Medium",
    questionText: "How do you say 'I am a student' in Japanese?",
    options: ["私は先生です", "私は学生です", "私は日本人です", "私は友達です"],
    correctIndex: 1,
    explanation: "学生 (gakusei) means 'student'.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q005",
    level: "N5",
    lesson: 3,
    type: "Reading",
    difficulty: "Medium",
    questionText: "What number is にじゅう (nijuu)?",
    options: ["10", "15", "20", "25"],
    correctIndex: 2,
    explanation: "にじゅう is 20 in Japanese (に = 2, じゅう = 10).",
    createdAt: new Date().toISOString(),
  },
  // Listening Questions with audio
  {
    id: "q006",
    level: "N5",
    lesson: 1,
    type: "Listening",
    difficulty: "Easy",
    audioUrl: `${MOCK_AUDIO_BASE}/SoundHelix-Song-1.mp3`,
    audioFileName: "greeting_dialogue.mp3",
    audioDuration: 95,
    questionText: "Listen to the dialogue and select the correct response.",
    options: ["Good morning", "Good afternoon", "Good evening", "Goodbye"],
    correctIndex: 1,
    explanation: "The audio contains a greeting during the daytime, which is こんにちは (konnichiwa).",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q007",
    level: "N5",
    lesson: 2,
    type: "Listening",
    difficulty: "Medium",
    audioUrl: `${MOCK_AUDIO_BASE}/SoundHelix-Song-2.mp3`,
    audioFileName: "basic_conversation.mp3",
    audioDuration: 125,
    questionText: "Listen to the conversation and answer the question.",
    options: ["At home", "At school", "At the store", "At the park"],
    correctIndex: 1,
    explanation: "The speaker mentions going to school (がっこう).",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q008",
    level: "N5",
    lesson: 3,
    type: "Listening",
    difficulty: "Easy",
    audioUrl: `${MOCK_AUDIO_BASE}/SoundHelix-Song-3.mp3`,
    audioFileName: "counting_practice.mp3",
    audioDuration: 60,
    questionText: "Listen and select the number mentioned.",
    options: ["1", "2", "3", "4"],
    correctIndex: 0,
    explanation: "The audio says いち (ichi) which means 1.",
    createdAt: new Date().toISOString(),
  },
  // N4 Questions
  {
    id: "q101",
    level: "N4",
    lesson: 1,
    type: "Vocabulary",
    difficulty: "Easy",
    questionText: "What does 有名 (ゆうめい) mean?",
    options: ["Famous", "Beautiful", "Expensive", "Delicious"],
    correctIndex: 0,
    explanation: "有名 means 'famous' or 'well-known' in Japanese.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q102",
    level: "N4",
    lesson: 1,
    type: "Grammar",
    difficulty: "Medium",
    questionText: "Which sentence uses the conditional form correctly?",
    options: ["食べたら、行きます", "食べったら、行きます", "食べるたら、行きます", "食べたなら、行きます"],
    correctIndex: 0,
    explanation: "たら is the past conditional form of verbs.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q103",
    level: "N4",
    lesson: 2,
    type: "Reading",
    difficulty: "Medium",
    questionText: "What is the main topic of this passage about travel?",
    options: ["Food", "Transportation", "Weather", "Shopping"],
    correctIndex: 1,
    explanation: "The passage mainly discusses train and bus transportation.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q104",
    level: "N4",
    lesson: 3,
    type: "Listening",
    difficulty: "Medium",
    audioUrl: `${MOCK_AUDIO_BASE}/SoundHelix-Song-4.mp3`,
    audioFileName: "shopping_dialogue.mp3",
    audioDuration: 85,
    questionText: "Listen and select the price mentioned.",
    options: ["1000 yen", "1500 yen", "2000 yen", "2500 yen"],
    correctIndex: 1,
    explanation: "The speaker mentions the item costs 1500 yen.",
    createdAt: new Date().toISOString(),
  },
  // N3 Questions
  {
    id: "q201",
    level: "N3",
    lesson: 1,
    type: "Vocabulary",
    difficulty: "Medium",
    questionText: "What does 面倒 (めんどう) mean?",
    options: ["Troublesome", "Wonderful", "Interesting", "Expensive"],
    correctIndex: 0,
    explanation: "面倒 means 'troublesome' or 'bothersome'.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q202",
    level: "N3",
    lesson: 1,
    type: "Grammar",
    difficulty: "Hard",
    questionText: "Which grammar pattern expresses an immediate result?",
    options: ["～たとたん", "～とおりに", "～だらけ", "～気味"],
    correctIndex: 0,
    explanation: "たとたん expresses something happening immediately after another action.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q203",
    level: "N3",
    lesson: 2,
    type: "Reading",
    difficulty: "Hard",
    questionText: "What can be inferred about the author's opinion?",
    options: ["Agrees with the policy", "Disagrees with the policy", "Is neutral about the policy", "Does not mention the policy"],
    correctIndex: 1,
    explanation: "The author uses critical language and provides counterarguments.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q204",
    level: "N3",
    lesson: 2,
    type: "Listening",
    difficulty: "Hard",
    audioUrl: `${MOCK_AUDIO_BASE}/SoundHelix-Song-5.mp3`,
    audioFileName: "news_report.mp3",
    audioDuration: 120,
    questionText: "What is the main news topic?",
    options: ["Weather warning", "Earthquake", "Traffic accident", "Sports event"],
    correctIndex: 1,
    explanation: "The news report is about a recent earthquake.",
    createdAt: new Date().toISOString(),
  },
  // N2 Questions
  {
    id: "q301",
    level: "N2",
    lesson: 1,
    type: "Vocabulary",
    difficulty: "Hard",
    questionText: "What does 兼ねる (かねる) mean in business context?",
    options: ["Cannot do simultaneously", "To rent", "To learn", "To manage"],
    correctIndex: 0,
    explanation: "兼ねる means 'cannot do simultaneously' or 'to find it difficult to'.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q302",
    level: "N2",
    lesson: 1,
    type: "Grammar",
    difficulty: "Hard",
    questionText: "Which sentence correctly uses ～にもかかわらず?",
    options: [
      "雨にもかかわらず、試合は行われた",
      "雨ににもかかわらず、試合は行われた",
      "雨をにもかかわらず、試合は行われた",
      "雨でのにもかかわらず、試合は行われた"
    ],
    correctIndex: 0,
    explanation: "にもかかわらず uses the dictionary form + にもかかわらず.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q303",
    level: "N2",
    lesson: 2,
    type: "Reading",
    difficulty: "Hard",
    questionText: "What is the purpose of this business email?",
    options: ["To request information", "To apologize", "To confirm a meeting", "To reject an offer"],
    correctIndex: 2,
    explanation: "The email is confirming the date and time of a scheduled meeting.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q304",
    level: "N2",
    lesson: 2,
    type: "Listening",
    difficulty: "Hard",
    audioUrl: `${MOCK_AUDIO_BASE}/SoundHelix-Song-6.mp3`,
    audioFileName: "business_meeting.mp3",
    audioDuration: 150,
    questionText: "What decision was made in the meeting?",
    options: ["Launch new product", "Postpone project", "Hire new staff", "Cancel event"],
    correctIndex: 1,
    explanation: "The meeting decided to postpone the project by one month.",
    createdAt: new Date().toISOString(),
  },
  // N1 Questions
  {
    id: "q401",
    level: "N1",
    lesson: 1,
    type: "Vocabulary",
    difficulty: "Hard",
    questionText: "What does 言わば (いいかえば) mean?",
    options: ["In other words", "As you know", "To be honest", "In general"],
    correctIndex: 0,
    explanation: "言わば means 'so to speak' or 'in other words'.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q402",
    level: "N1",
    lesson: 1,
    type: "Grammar",
    difficulty: "Hard",
    questionText: "Which grammar pattern indicates 'even though'?",
    options: ["～をもって", "～にもかかわらず", "～いかんでは", "～いかんにかかわらず"],
    correctIndex: 3,
    explanation: "～いかんにかかわらず means 'regardless of' or 'no matter what'.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q403",
    level: "N1",
    lesson: 2,
    type: "Reading",
    difficulty: "Hard",
    questionText: "What literary technique is used in this passage?",
    options: ["Metaphor", "Personification", "Hyperbole", "Irony"],
    correctIndex: 3,
    explanation: "The author uses irony to convey the opposite of what is literally stated.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "q404",
    level: "N1",
    lesson: 2,
    type: "Listening",
    difficulty: "Hard",
    audioUrl: `${MOCK_AUDIO_BASE}/SoundHelix-Song-7.mp3`,
    audioFileName: "academic_lecture.mp3",
    audioDuration: 180,
    questionText: "What is the professor's main argument?",
    options: ["Technology improves education", "Traditional methods are better", "Balance is needed", "Change is unnecessary"],
    correctIndex: 2,
    explanation: "The professor argues that a balanced approach is necessary.",
    createdAt: new Date().toISOString(),
  },
];
