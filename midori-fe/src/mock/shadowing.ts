// ─── Shadowing Mock Data ───────────────────────────────────────────────────────

import { ShadowingItem } from "../types/content-library";

export const mockShadowing: ShadowingItem[] = [
  {
    id: "shadow-001",
    title: "N5 Basic Greetings",
    audioUrl: "/audio/n5-greetings.mp3",
    script: [
      {
        id: "seg-001",
        startTime: 0,
        endTime: 3,
        text: "おはようございます。",
        translation: "Good morning. (polite)",
        pitchAccent: "おはようございます。(3)",
      },
      {
        id: "seg-002",
        startTime: 3,
        endTime: 7,
        text: "今日は天気が良いですね。",
        translation: "The weather is nice today.",
        pitchAccent: "今日は(1)天気が(4)良い(0)ですね。(4)",
      },
      {
        id: "seg-003",
        startTime: 7,
        endTime: 12,
        text: "散歩にでも行きませんか？",
        translation: "Why don't we go for a walk?",
        pitchAccent: "散歩にでも(0)行きません(4)か？(4)",
      },
      {
        id: "seg-004",
        startTime: 12,
        endTime: 16,
        text: "はい、ぜひ行きましょう！",
        translation: "Yes, let's definitely go!",
        pitchAccent: "はい、ぜひ(0)行きましょう！(4)",
      },
    ],
    practiceSegments: [
      { segmentId: "seg-001", repetitions: 3, speed: 1.0 },
      { segmentId: "seg-002", repetitions: 3, speed: 1.0 },
      { segmentId: "seg-003", repetitions: 3, speed: 0.75 },
      { segmentId: "seg-004", repetitions: 3, speed: 1.0 },
    ],
    jlptLevel: "N5",
    tags: ["greeting", "daily-conversation", "beginner"],
    duration: 16,
    createdAt: "2024-01-30",
    updatedAt: "2024-01-30",
  },
  {
    id: "shadow-002",
    title: "N5 Restaurant Ordering",
    audioUrl: "/audio/n5-restaurant-order.mp3",
    script: [
      {
        id: "seg-001",
        startTime: 0,
        endTime: 4,
        text: "すみません、メニューをください。",
        translation: "Excuse me, please give me the menu.",
        pitchAccent: "すみません(4)、メニューを(0)ください(4)。",
      },
      {
        id: "seg-002",
        startTime: 4,
        endTime: 9,
        text: "はい、どうぞ。ご注文はお決まりですか？",
        translation: "Here you are. Have you decided what you'd like?",
        pitchAccent: "はい、どうぞ(4)。ご注文は(0)お決まりです(5)か？(4)",
      },
      {
        id: "seg-003",
        startTime: 9,
        endTime: 14,
        text: "すみません、まだ考えていません。",
        translation: "I'm sorry, I'm still thinking.",
        pitchAccent: "すみません(4)、まだ(0)考えていません(5)。",
      },
      {
        id: "seg-004",
        startTime: 14,
        endTime: 18,
        text: "では、しばらくお待ちください。",
        translation: "Then, please wait a moment.",
        pitchAccent: "では、しばらく(0)お待ちください(5)。",
      },
    ],
    practiceSegments: [
      { segmentId: "seg-001", repetitions: 3, speed: 1.0 },
      { segmentId: "seg-002", repetitions: 3, speed: 0.75 },
      { segmentId: "seg-003", repetitions: 3, speed: 1.0 },
      { segmentId: "seg-004", repetitions: 3, speed: 1.0 },
    ],
    jlptLevel: "N5",
    tags: ["restaurant", "ordering", "daily-conversation"],
    duration: 18,
    createdAt: "2024-01-31",
    updatedAt: "2024-01-31",
  },
  {
    id: "shadow-003",
    title: "N4 Asking for Directions",
    audioUrl: "/audio/n4-directions.mp3",
    script: [
      {
        id: "seg-001",
        startTime: 0,
        endTime: 5,
        text: "すみません、駅はどこですか？",
        translation: "Excuse me, where is the station?",
        pitchAccent: "すみません(4)、駅は(1)どこです(2)か？(4)",
      },
      {
        id: "seg-002",
        startTime: 5,
        endTime: 11,
        text: "この道をまっすぐ行ってください。",
        translation: "Please go straight along this road.",
        pitchAccent: "この道を(2)まっすぐ(0)行ってください(5)。",
      },
      {
        id: "seg-003",
        startTime: 11,
        endTime: 17,
        text: "二つ目の角を右に曲がると、見えます。",
        translation: "You'll see it when you turn right at the second corner.",
        pitchAccent: "二つ目の(0)角を(2)右に(0)曲がると(2)、見えます(4)。",
      },
      {
        id: "seg-004",
        startTime: 17,
        endTime: 21,
        text: "ありがとうございます。助かりました。",
        translation: "Thank you very much. That helps a lot.",
        pitchAccent: "ありがとうございます(5)。助かりました(5)。",
      },
    ],
    practiceSegments: [
      { segmentId: "seg-001", repetitions: 4, speed: 1.0 },
      { segmentId: "seg-002", repetitions: 3, speed: 0.75 },
      { segmentId: "seg-003", repetitions: 3, speed: 0.75 },
      { segmentId: "seg-004", repetitions: 4, speed: 1.0 },
    ],
    jlptLevel: "N4",
    tags: ["directions", "travel", "practical"],
    duration: 21,
    createdAt: "2024-02-20",
    updatedAt: "2024-02-20",
  },
  {
    id: "shadow-004",
    title: "N3 Business Phone Call",
    audioUrl: "/audio/n3-phone-call.mp3",
    script: [
      {
        id: "seg-001",
        startTime: 0,
        endTime: 5,
        text: "はい、田中株式会社です。",
        translation: "Hello, this is Tanaka Corporation.",
        pitchAccent: "はい(1)、田中(1)株式会社です(5)。",
      },
      {
        id: "seg-002",
        startTime: 5,
        endTime: 11,
        text: "いつもお世話になっております。佐藤商事の山本ですが。",
        translation: "Thank you for your continued support. This is Yamamoto from Sato Trading.",
        pitchAccent: "いつも(0)お世話に(4)なっております(5)。佐藤商事の(0)山本です(4)けど(4)。",
      },
      {
        id: "seg-003",
        startTime: 11,
        endTime: 18,
        text: "恐れ入りますが、企画部の田中さんはいらっしますか？",
        translation: "I'm sorry to bother you, but is Mr./Ms. Tanaka of the Planning Department available?",
        pitchAccent: "恐れ入りますが(5)、企画部の(0)田中は(1)さんかいらっしゃいますか(6)？",
      },
      {
        id: "seg-004",
        startTime: 18,
        endTime: 24,
        text: "ただいま席を外しております。",
        translation: "He/She is currently away from their seat.",
        pitchAccent: "ただいま(0)席を(2)外しております(5)。",
      },
    ],
    practiceSegments: [
      { segmentId: "seg-001", repetitions: 3, speed: 1.0 },
      { segmentId: "seg-002", repetitions: 3, speed: 0.75 },
      { segmentId: "seg-003", repetitions: 3, speed: 0.5 },
      { segmentId: "seg-004", repetitions: 3, speed: 0.75 },
    ],
    jlptLevel: "N3",
    tags: ["business", "phone", "formal"],
    duration: 24,
    createdAt: "2024-03-20",
    updatedAt: "2024-03-20",
  },
  {
    id: "shadow-005",
    title: "N2 News Report Style",
    audioUrl: "/audio/n2-news.mp3",
    script: [
      {
        id: "seg-001",
        startTime: 0,
        endTime: 6,
        text: "今日の午後に、都心部で大規模なデモが発生しました。",
        translation: "This afternoon, a large-scale demonstration occurred in the city center.",
        pitchAccent: "今日の(1)午後に(2)、都心部で(0)大規模な(4)デモが(1)発生しました(5)。",
      },
      {
        id: "seg-002",
        startTime: 6,
        endTime: 13,
        text: "主催者侧によりますと、参加者は約5000人に上るということです。",
        translation: "According to the organizers, the number of participants reached approximately 5,000.",
        pitchAccent: "主催者侧によりますと(6)、参加者は(0)約5000人に(3)上る(0)ということです(5)。",
      },
      {
        id: "seg-003",
        startTime: 13,
        endTime: 20,
        text: "警察は周边の交通量を制限し、迂回を呼びかけています。",
        translation: "The police have restricted traffic in the surrounding area and are calling for detours.",
        pitchAccent: "警察は(1)周边の(0)交通量を(4)制限し(1)、迂回を(0)呼びかけています(5)。",
      },
    ],
    practiceSegments: [
      { segmentId: "seg-001", repetitions: 3, speed: 0.75 },
      { segmentId: "seg-002", repetitions: 3, speed: 0.5 },
      { segmentId: "seg-003", repetitions: 3, speed: 0.5 },
    ],
    jlptLevel: "N2",
    tags: ["news", "formal", "intermediate"],
    duration: 20,
    createdAt: "2024-04-20",
    updatedAt: "2024-04-20",
  },
  {
    id: "shadow-006",
    title: "N1 Academic Presentation",
    audioUrl: "/audio/n1-presentation.mp3",
    script: [
      {
        id: "seg-001",
        startTime: 0,
        endTime: 8,
        text: "本研究は、現代社会における若者の政治参加の動向及其の背景にある要因について分析することを目的としています。",
        translation: "This research aims to analyze the trends in young people's political participation in modern society and the factors behind them.",
        pitchAccent: "本研究は(4)、現代社会における(0)若者の(2)政治参加の(4)動向及び(2)その背景に(0)ある(2)要因について(4)分析する(4)ことを(2)目的と(2)しています(5)。",
      },
      {
        id: "seg-002",
        startTime: 8,
        endTime: 16,
        text: "先行研究では、政治不信や投票率の低下が指摘されていましたが、本研究では、SNSの活用という新しい視点から分析を試みました。",
        translation: "While previous studies have pointed out political distrust and declining voting rates, this study attempted to analyze from a new perspective of SNS utilization.",
        pitchAccent: "先行研究では(4)、政治不信や(0)投票率の(3)低下が(1)指摘されていましたが(6)、本研究では(4)、SNSの(1)活用という(3)新しい(3)視点から(4)分析を(1)試みました(4)。",
      },
      {
        id: "seg-003",
        startTime: 16,
        endTime: 24,
        text: "调查结果からは、若者がSNSを通じて政治的意思決定を行う倾向が強まっていることが明らかになりました。",
        translation: "The survey results revealed that the tendency for young people to make political decisions through SNS is increasing.",
        pitchAccent: "调查结果からは(5)、若者が(2)SNSを通じて(4)政治的(0)意思决定を(4)行う(2)倾向が(1)强まって(4)いることが(3)明らかになりました(6)。",
      },
    ],
    practiceSegments: [
      { segmentId: "seg-001", repetitions: 2, speed: 0.5 },
      { segmentId: "seg-002", repetitions: 2, speed: 0.5 },
      { segmentId: "seg-003", repetitions: 2, speed: 0.5 },
    ],
    jlptLevel: "N1",
    tags: ["academic", "presentation", "formal"],
    duration: 24,
    createdAt: "2024-05-20",
    updatedAt: "2024-05-20",
  },
];

export const getShadowingByLevel = (level: ShadowingItem["jlptLevel"]) => {
  return mockShadowing.filter(item => item.jlptLevel === level);
};

export const getShadowingById = (id: string) => {
  return mockShadowing.find(item => item.id === id);
};

export const searchShadowing = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return mockShadowing.filter(
    item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.script.some(seg => seg.text.toLowerCase().includes(lowerQuery)) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};
