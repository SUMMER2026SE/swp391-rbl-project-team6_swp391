// ─── Listening Mock Data ───────────────────────────────────────────────────────
// Self-contained mock data structure kept for legacy imports in the mock
// barrel. The actual student-facing Listening flow uses the real API in
// `@/lib/api/listening` and the ListeningItem type defined there. This
// file intentionally does NOT depend on the API types.

export interface MockListeningLesson {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string;
  jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1";
  tags: string[];
  duration: number;
  createdAt: string;
  updatedAt: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export const mockListening: MockListeningLesson[] = [
  {
    id: "listen-001",
    title: "JLPT N5 - At the Station",
    audioUrl: "/audio/n5-station.mp3",
    transcript:
      "A: すみません、この電車は東京に行きますか？\nB: はい、行きます。 東京駅で降りてください。\nA: ありがとうございます。 何分ぐらいかかりますか？\nB: 約30分です。",
    jlptLevel: "N5",
    tags: ["daily-life", "transportation", "dialogue"],
    duration: 120,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
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
    ],
  },
];