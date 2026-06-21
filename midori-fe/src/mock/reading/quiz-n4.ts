// ─── Quiz Questions Generator - N4 Level ────────────────────────────────────────

import type { MultipleChoiceExercise, TrueFalseExercise, FillBlankExercise } from "./exercises";

export interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "fill-blank";
  difficulty: "easy" | "medium" | "hard";
  jlptLevel: "N4" | "N3" | "N2" | "N1";
  question: string;
  passage?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  grammar?: string;
}

// ─── N4 Quiz Questions ─────────────────────────────────────────────────────────

export const n4QuizQuestions: QuizQuestion[] = [
  // Grammar - Basic
  {
    id: "n4-q-001",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "明日_____映画を見に行きます。",
    options: ["で", "に", "を", "が"],
    correctAnswer: 1,
    explanation: "「に」indicates purpose of going somewhere.",
    grammar: "Verb dictionary form + に行きます"
  },
  {
    id: "n4-q-002",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "この книгаはあなた_____あげます。",
    options: ["で", "に", "を", "へ"],
    correctAnswer: 1,
    explanation: "「に」indicates the recipient of giving.",
    grammar: "に + あげます"
  },
  {
    id: "n4-q-003",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "友達_____电话をもらいました。",
    options: ["で", "に", "を", "から"],
    correctAnswer: 3,
    explanation: "「から」indicates the source of receiving.",
    grammar: "から + もらいます"
  },
  {
    id: "n4-q-004",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "日本語が話_____ようになりました。",
    options: ["する", "した", "話せる", "話した"],
    correctAnswer: 2,
    explanation: "「~ようになりました」means 'became able to'.",
    grammar: "Verb dictionary form + ようになりました"
  },
  {
    id: "n4-q-005",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "每晚十一時_____寝ます。",
    options: ["で", "に", "を", "へ"],
    correctAnswer: 1,
    explanation: "「に」marks specific time.",
    grammar: "Time + に"
  },
  // Grammar - Intermediate
  {
    id: "n4-q-006",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "時間がなかった_____、遊びに行きませんでした。",
    options: ["で", "のに", "から", "ために"],
    correctAnswer: 1,
    explanation: "「のに」expresses contradiction or unexpected result.",
    grammar: "Verb/N adj + のに"
  },
  {
    id: "n4-q-007",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "雨が降った_____、試合は中止になりました。",
    options: ["で", "に", "ので", "ために"],
    correctAnswer: 2,
    explanation: "「ので」indicates reason/cause.",
    grammar: "Verb/I adj + ので"
  },
  {
    id: "n4-q-008",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "日本に来た_____、桜を見たことがあります。",
    options: ["とき", "あいだ", "前に", "後で"],
    correctAnswer: 2,
    explanation: "「前に」means 'before'.",
    grammar: "Verb dictionary form + 前に"
  },
  {
    id: "n4-q-009",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "友達が病気の_____、見舞いに行きました。",
    options: ["あいだ", "とき", "的最中", "最中"],
    correctAnswer: 0,
    explanation: "「間」means 'during/while'.",
    grammar: "Verb/I adj + 間"
  },
  {
    id: "n4-q-010",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "好吃だと_____、思わず食べ過ぎてしまった。",
    options: ["思って", "思って", "思って", "思って"],
    correctAnswer: 0,
    explanation: "「~てしまった」expresses regret or completed action with negative result.",
    grammar: "Verb te-form + しまった"
  },
  // Vocabulary - N4
  {
    id: "n4-q-011",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「面倒」的正确读音是？",
    options: ["めんど", "めんどく", "めめん", "めん"],
    correctAnswer: 1,
    explanation: "「面倒」的读音是「めんどく」(mendoku)。",
  },
  {
    id: "n4-q-012",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「挨拶」的意思是什么？",
    options: ["忘记", "寒暄/打招呼", "讨论", "决定"],
    correctAnswer: 1,
    explanation: "「挨拶」(aisatsu) means greeting/salutation.",
  },
  {
    id: "n4-q-013",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「贅沢」的意思是什么？",
    options: ["简单", "便宜", "奢侈/奢华", "普通"],
    correctAnswer: 2,
    explanation: "「贅沢」(zeitaku) means luxurious/indulgent.",
  },
  {
    id: "n4-q-014",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「諦める」的的意思是什么？",
    options: ["坚持", "放弃", "等待", "希望"],
    correctAnswer: 1,
    explanation: "「諦める」(akiramete) means to give up.",
  },
  {
    id: "n4-q-015",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「場合」的的意思是什么？",
    options: ["时间", "情况/场合", "地点", "人物"],
    correctAnswer: 1,
    explanation: "「場合」(baai) means case/situation.",
  },
  // Reading Comprehension - N4
  {
    id: "n4-q-016",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    passage: "私は毎朝コーヒーを飲みます。今日は忙しかったので、コーヒーを飲みませんでした。",
    question: "今天为什么没有喝咖啡？",
    options: ["不喜欢咖啡", "因为忙", "因为累", "因为贵"],
    correctAnswer: 1,
    explanation: "「忙しかったので」means 'because I was busy'.",
  },
  {
    id: "n4-q-017",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    passage: "友達に来週のパーティーに来てもらいました。面白かったです。",
    question: "作者的朋友做了什么？",
    options: ["组织了派对", "来参加了派对", "准备了食物", "取消了派对"],
    correctAnswer: 1,
    explanation: "「来てもらいました」means 'a friend came (at my request)'.",
  },
  {
    id: "n4-q-018",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    passage: "日本食は身体に良いです。でも、太高价的ものは嫌いです。",
    question: "作者对日本食物的看法是什么？",
    options: ["全部喜欢", "觉得对身体好，但不喜欢太贵的", "全部不喜欢", "觉得不健康"],
    correctAnswer: 1,
    explanation: "「身体に良い」和「太高价的东西不喜欢」是对比关系。",
  },
  {
    id: "n4-q-019",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    passage: "每晚睡觉前にストレッチをしています。这么做之后睡眠质量变好了。",
    question: "作者每晚做什么？",
    options: ["看电视", "做伸展运动", "读书", "听音乐"],
    correctAnswer: 1,
    explanation: "「ストレッチ」是 stretching/伸展运动。",
  },
  {
    id: "n4-q-020",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    passage: "この餐厅的服务很好。但价格有点贵。",
    question: "关于这家餐厅，说法正确的是？",
    options: ["服务好，价格便宜", "服务好，但价格贵", "服务差，价格便宜", "服务差，价格贵"],
    correctAnswer: 1,
    explanation: "「很好」是优点，「有点贵」是缺点。",
  },
  // More Grammar - N4
  {
    id: "n4-q-021",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "家族_____写真を送ってもらいました。",
    options: ["で", "に", "を", "から"],
    correctAnswer: 3,
    explanation: "「から」indicates the source of receiving.",
    grammar: "から + もらいました"
  },
  {
    id: "n4-q-022",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "日本語が上手になったの_____、努力しました。",
    options: ["で", "に", "を", "ため"],
    correctAnswer: 3,
    explanation: "「ため」indicates purpose or cause.",
    grammar: "Verb dictionary form + ため"
  },
  {
    id: "n4-q-023",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "映画を見ている_____、電話が鳴った。",
    options: "間に",
    options: ["で", "あいだ", "前に", "後で"],
    correctAnswer: 1,
    explanation: "「間に」means 'during/while' (action in progress).",
    grammar: "Verb I-form + 間に"
  },
  {
    id: "n4-q-024",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "失敗した_____、落ち込んだ。",
    options: ["で", "に", "を", "のに"],
    correctAnswer: 3,
    explanation: "「のに」expresses contradictory feelings.",
    grammar: "Verb/I adj + のに"
  },
  {
    id: "n4-q-025",
    type: "multiple-choice",
    difficulty: "medium",
    jlptLevel: "N4",
    question: "この問題は私_____できません。",
    options: ["で", "に", "を", "へ"],
    correctAnswer: 1,
    explanation: "「に」indicates ability的对象.",
    grammar: "に + できます"
  },
  // More Vocabulary - N4
  {
    id: "n4-q-026",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「以外」的意思是什么？",
    options: ["之内", "之外/除了", "之间", "旁边"],
    correctAnswer: 1,
    explanation: "「以外」(igai) means 'besides/except'.",
  },
  {
    id: "n4-q-027",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「思わず」的的意思是什么？",
    options: ["故意地", "不自觉地/不由自主地", "慢慢地", "快速地"],
    correctAnswer: 1,
    explanation: "「思わず」(omowazu) means 'unconsciously/involuntarily'.",
  },
  {
    id: "n4-q-028",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「区別」的的意思是什么？",
    options: ["相同", "区别/分辨", "分类", "整理"],
    correctAnswer: 1,
    explanation: "「区別」(kubetsu) means distinction/differentiation.",
  },
  {
    id: "n4-q-029",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「確認」的的意思是什么？",
    options: ["否认", "确认/核实", "改变", "删除"],
    correctAnswer: 1,
    explanation: "「確認」(kakunin) means confirmation.",
  },
  {
    id: "n4-q-030",
    type: "multiple-choice",
    difficulty: "easy",
    jlptLevel: "N4",
    question: "「面倒」的的意思是什么？",
    options: ["简单", "麻烦/费事", "重要", "紧急"],
    correctAnswer: 1,
    explanation: "「面倒」(mendou) means troublesome/bothersome.",
  },
];

export default n4QuizQuestions;
