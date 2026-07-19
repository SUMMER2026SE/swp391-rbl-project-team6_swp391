import type { JLPTLevel, Skill, Difficulty } from "./teacher-data";

export interface MockQuestion {
  id: string;
  title: string;
  type: string; // e.g., "Multiple Choice", "Fill in the blank"
  level: JLPTLevel;
  skill: Skill;
  difficulty: Difficulty;
  content: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  status: "Active" | "Archived";
}

export const initialMockQuestions: MockQuestion[] = [
  {
    id: "q-1",
    title: "JLPT N3 Grammar: ~からこそ",
    type: "Multiple Choice",
    level: "N3",
    skill: "Grammar",
    difficulty: "Medium",
    content: "日本語を勉強している（　　）、日本の文化をもっと深く理解したいと思うようになった。",
    choices: ["からこそ", "かわりに", "ことによって", "ばかりに"],
    correctAnswer: "からこそ",
    explanation:
      "「〜からこそ」 indicates that it is the precise reason/cause. 'It is precisely because I am studying Japanese that...'",
    tags: ["grammar", "n3-exam", "causation"],
    createdAt: "2026-05-10T10:00:00Z",
    updatedAt: "2026-06-15T12:30:00Z",
    usageCount: 15,
    status: "Active",
  },
  {
    id: "q-2",
    title: "JLPT N5 Kanji: 食べる",
    type: "Multiple Choice",
    level: "N5",
    skill: "Kanji",
    difficulty: "Easy",
    content:
      "あさごはんを（食）べます。 What is the correct hiragana for the kanji in parentheses?",
    choices: ["た", "の", "い", "か"],
    correctAnswer: "た",
    explanation:
      "「食べる」 is read as 「たべる」 (taberu), meaning 'to eat'. The kanji portion 「食」 is read as 「た」.",
    tags: ["kanji", "n5-basics", "verbs"],
    createdAt: "2026-04-01T09:00:00Z",
    updatedAt: "2026-04-01T09:00:00Z",
    usageCount: 42,
    status: "Active",
  },
  {
    id: "q-3",
    title: "JLPT N2 Vocabulary: 妥協",
    type: "Multiple Choice",
    level: "N2",
    skill: "Vocabulary",
    difficulty: "Hard",
    content: "両国は激しい交渉の末、ついに（　　）点を見出した。",
    choices: ["妥協", "対立", "調整", "一致"],
    correctAnswer: "妥協",
    explanation:
      "「妥協点」 (dakyouten) means a compromise point/common ground. 'After intense negotiations, the two countries finally found common ground.'",
    tags: ["vocabulary", "business", "n2"],
    createdAt: "2026-06-01T14:00:00Z",
    updatedAt: "2026-06-20T16:45:00Z",
    usageCount: 8,
    status: "Active",
  },
  {
    id: "q-4",
    title: "JLPT N4 Grammar: ~ほうがいい",
    type: "Multiple Choice",
    level: "N4",
    skill: "Grammar",
    difficulty: "Easy",
    content: "風邪をひいたときは、早く（　　）ほうがいいですよ。",
    choices: ["寝る", "寝た", "寝て", "寝ない"],
    correctAnswer: "寝た",
    explanation:
      "「〜たほうがいい」 is used to give advice. The past tense (Ta-form) is followed by ほうがいい.",
    tags: ["grammar", "advice", "verbs"],
    createdAt: "2026-03-12T11:00:00Z",
    updatedAt: "2026-05-02T10:00:00Z",
    usageCount: 29,
    status: "Active",
  },
  {
    id: "q-5",
    title: "JLPT N1 Reading: Essay on Modernity",
    type: "Multiple Choice",
    level: "N1",
    skill: "Reading",
    difficulty: "Hard",
    content: "筆者が考える「現代社会における個人主義の課題」に最も近いものはどれか。",
    choices: [
      "他者への無関心と孤独感の増大",
      "自己決定能力の過度な向上",
      "伝統的文化との完全な調和",
      "経済的な格差の完全な是正",
    ],
    correctAnswer: "他者への無関心と孤独感の増大",
    explanation:
      "According to the passage, the primary challenge of individualism in modern society is the increase in indifference towards others and feelings of isolation.",
    tags: ["reading", "n1-exam", "essay"],
    createdAt: "2026-06-10T15:20:00Z",
    updatedAt: "2026-06-25T08:15:00Z",
    usageCount: 3,
    status: "Active",
  },
  {
    id: "q-6",
    title: "JLPT N3 Vocabulary: 賑やか",
    type: "Multiple Choice",
    level: "N3",
    skill: "Vocabulary",
    difficulty: "Medium",
    content: "あの通りはいつも（　　）で、たくさんの店が並んでいる。",
    choices: ["賑やか", "静か", "不便", "危険"],
    correctAnswer: "賑やか",
    explanation:
      "「賑やか」 (nigiyaka) means lively/bustling. 'That street is always lively, with many shops lined up.'",
    tags: ["vocabulary", "adjectives", "n3"],
    createdAt: "2026-02-15T08:00:00Z",
    updatedAt: "2026-02-15T08:00:00Z",
    usageCount: 22,
    status: "Archived",
  },
];
