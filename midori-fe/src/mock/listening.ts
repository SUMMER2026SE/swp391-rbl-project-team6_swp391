// ─── Listening Mock Data ───────────────────────────────────────────────────────

import { ListeningItem } from "../types/content-library";

export const mockListening: ListeningItem[] = [
  {
    id: "listen-001",
    title: "JLPT N5 - At the Station",
    audioUrl: "/audio/n5-station.mp3",
    transcript: "A: すみません、この電車は東京に行きますか？\nB: はい、行きます。 東京駅で降りてください。\nA: ありがとうございます。 何分ぐらいかかりますか？\nB: 約30分です。",
    questions: [
      {
        id: "q1",
        question: "Where does this train go?",
        options: ["Osaka", "Tokyo", "Kyoto", "Nagoya"],
        correctAnswer: 1,
        explanation: "The speaker confirms the train goes to Tokyo.",
      },
      {
        id: "q2",
        question: "How long does it take?",
        options: ["About 20 minutes", "About 30 minutes", "About 1 hour", "About 2 hours"],
        correctAnswer: 1,
        explanation: "The response states it takes approximately 30 minutes.",
      },
      {
        id: "q3",
        question: "Where should the person get off?",
        options: ["At the next station", "At Tokyo Station", "At the final stop", "Halfway"],
        correctAnswer: 1,
        explanation: "They are told to get off at Tokyo Station.",
      },
    ],
    jlptLevel: "N5",
    tags: ["daily-life", "transportation", "dialogue"],
    duration: 120,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    id: "listen-002",
    title: "JLPT N5 - At the Restaurant",
    audioUrl: "/audio/n5-restaurant.mp3",
    transcript: "店員: いらっしゃいませ。 何しますか？\n客: すみません、メニューを見せてください。\n店員: はい、どうぞ。 ご注文はお決まりですか？\n客: すみません、もう少し待ってください。",
    questions: [
      {
        id: "q1",
        question: "What did the customer ask for?",
        options: ["The bill", "The menu", "A table", "Water"],
        correctAnswer: 1,
        explanation: "The customer asked to see the menu.",
      },
      {
        id: "q2",
        question: "What did the customer say at the end?",
        options: ["I'll order now", "Please wait", "I'll wait a bit more", "I'm leaving"],
        correctAnswer: 2,
        explanation: "The customer said to wait a bit longer.",
      },
    ],
    jlptLevel: "N5",
    tags: ["food", "restaurant", "dialogue"],
    duration: 90,
    createdAt: "2024-01-21",
    updatedAt: "2024-01-21",
  },
  {
    id: "listen-003",
    title: "JLPT N4 - Weather Forecast",
    audioUrl: "/audio/n4-weather.mp3",
    transcript: "今日の天気予報をお伝えします。今日は晴れですが、夕方から雨が降るでしょう。明日は一日中雨で、気温は15度から20度の間です。出行る方は傘をお持ちください。",
    questions: [
      {
        id: "q1",
        question: "What is the weather like today?",
        options: ["Rainy all day", "Sunny", "Cloudy", "Snowy"],
        correctAnswer: 1,
        explanation: "Today is sunny but will rain in the evening.",
      },
      {
        id: "q2",
        question: "What will tomorrow be like?",
        options: ["Sunny", "Cloudy", "Rainy all day", "Snowy"],
        correctAnswer: 2,
        explanation: "Tomorrow will be rainy all day.",
      },
      {
        id: "q3",
        question: "What temperature range is expected?",
        options: ["10-15 degrees", "15-20 degrees", "20-25 degrees", "25-30 degrees"],
        correctAnswer: 1,
        explanation: "The temperature will be between 15 and 20 degrees.",
      },
      {
        id: "q4",
        question: "What should people going out bring?",
        options: ["Sunglasses", "An umbrella", "A coat", "Food"],
        correctAnswer: 1,
        explanation: "People going out are advised to bring an umbrella.",
      },
    ],
    jlptLevel: "N4",
    tags: ["weather", "announcement", "information"],
    duration: 150,
    createdAt: "2024-02-10",
    updatedAt: "2024-02-10",
  },
  {
    id: "listen-004",
    title: "JLPT N3 - TV News",
    audioUrl: "/audio/n3-news.mp3",
    transcript: "昨夜、東京で大きな火事がありました。火は午前2時頃に消し止められましたが、3軒の家が焼けました。けが人は出ませんでしたが、近所の 사람들은大変惊いていました。消防署によると、火事の理由は調査中です。",
    questions: [
      {
        id: "q1",
        question: "What happened last night in Tokyo?",
        options: ["An earthquake", "A big fire", "A flood", "A storm"],
        correctAnswer: 1,
        explanation: "A big fire broke out in Tokyo last night.",
      },
      {
        id: "q2",
        question: "When was the fire extinguished?",
        options: ["At midnight", "Around 2 AM", "At 5 AM", "At dawn"],
        correctAnswer: 1,
        explanation: "The fire was extinguished around 2 AM.",
      },
      {
        id: "q3",
        question: "Were there any injuries?",
        options: ["Yes, several", "Only one", "None", "Unknown"],
        correctAnswer: 2,
        explanation: "There were no injuries according to the report.",
      },
      {
        id: "q4",
        question: "What is the current status of the fire investigation?",
        options: ["Already concluded", "Just started", "Still ongoing", "Not started"],
        correctAnswer: 2,
        explanation: "According to the fire department, the cause is still under investigation.",
      },
    ],
    jlptLevel: "N3",
    tags: ["news", "disaster", "report"],
    duration: 180,
    createdAt: "2024-03-10",
    updatedAt: "2024-03-10",
  },
  {
    id: "listen-005",
    title: "JLPT N2 - Business Meeting",
    audioUrl: "/audio/n2-meeting.mp3",
    transcript: "社长: まず、今月の売上について報告してください。\n部长: はい、今月は前月比15パーセントの増加を達成しました。特にアジア市場の売上が伸びています。\n社长: それは素晴らしいですね。来月の計画はどうですか？\n部长: 来月は新製品を発売予定ですので、更なる成長を見込んでいます。",
    questions: [
      {
        id: "q1",
        question: "How did this month's sales compare to last month?",
        options: ["Decreased by 15%", "Increased by 15%", "Same as last month", "Doubled"],
        correctAnswer: 1,
        explanation: "Sales increased by 15% compared to the previous month.",
      },
      {
        id: "q2",
        question: "Which market showed growth?",
        options: ["European market", "American market", "Asian market", "Domestic market"],
        correctAnswer: 2,
        explanation: "The Asian market showed particularly strong sales growth.",
      },
      {
        id: "q3",
        question: "What is planned for next month?",
        options: ["Meeting with clients", "Releasing a new product", "Closing the company", "Reducing staff"],
        correctAnswer: 1,
        explanation: "A new product launch is planned for next month.",
      },
    ],
    jlptLevel: "N2",
    tags: ["business", "meeting", "formal"],
    duration: 240,
    createdAt: "2024-04-10",
    updatedAt: "2024-04-10",
  },
  {
    id: "listen-006",
    title: "JLPT N1 - Academic Lecture",
    audioUrl: "/audio/n1-lecture.mp3",
    transcript: "今日の講義では、グローバル化が進む現代社会において、異文化コミュニケーションの重要性がますます高まっていることについてお話します。従来型の画一的なコミュニケーション方法是もはや有効ではなく、個々の文化背景を考虑した柔軟なアプローチが求められています。",
    questions: [
      {
        id: "q1",
        question: "What is the main topic of today's lecture?",
        options: ["Economic globalization", "The importance of cross-cultural communication", "Traditional Japanese culture", "Technology advancement"],
        correctAnswer: 1,
        explanation: "The lecture focuses on the increasing importance of cross-cultural communication.",
      },
      {
        id: "q2",
        question: "According to the lecture, what is needed now?",
        options: ["Uniform communication methods", "Flexible approaches considering cultural backgrounds", "More strict rules", "Technology-based solutions"],
        correctAnswer: 1,
        explanation: "A flexible approach that considers individual cultural backgrounds is needed.",
      },
      {
        id: "q3",
        question: "What is said about traditional communication methods?",
        options: ["They are still effective", "They are more important than ever", "They are no longer effective", "They should be revived"],
        correctAnswer: 2,
        explanation: "Traditional uniform communication methods are no longer effective.",
      },
    ],
    jlptLevel: "N1",
    tags: ["academic", "culture", "lecture"],
    duration: 300,
    createdAt: "2024-05-10",
    updatedAt: "2024-05-10",
  },
];

export const getListeningByLevel = (level: ListeningItem["jlptLevel"]) => {
  return mockListening.filter(item => item.jlptLevel === level);
};

export const getListeningById = (id: string) => {
  return mockListening.find(item => item.id === id);
};

export const searchListening = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return mockListening.filter(
    item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.transcript.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};
