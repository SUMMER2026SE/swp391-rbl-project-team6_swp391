// ─── AI Service for Listening Content ───────────────────────────────────────────
// Provides AI processing for audio files with mock fallback

import type { JLPTLevel } from "../mocks/contentLibraryMock";
import type {
  ListeningAIResult,
  ListeningQuestion,
  ListeningTranscript,
  AIProcessingStatus,
  ListeningMode,
} from "./aiService.types";

// ─── Configuration ─────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const isApiEnabled = !!API_BASE_URL;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AIContentGenerationOptions {
  level: JLPTLevel;
  mode: ListeningMode;
  title?: string;
  duration?: number;
}

// ─── AI Mock Data Templates by Level ──────────────────────────────────────────

const MOCK_TRANSCRIPTS: Record<JLPTLevel, string[]> = {
  N5: [
    "A: すみません、駅はどこですか？\nB: あのビルの隣です。\nA: ありがとうございます。\nB: どういたしまして。",
    "店員: いらっしゃいませ。\n客: すみません、パンをください。\n店員: はい、どうぞ。\n客: ありがとうございます。",
    "先生: 今日は日本語の時間です。\n学生: はい、先生。\n先生: ページを開けてください。\n学生: 先生、何ページですか？",
  ],
  N4: [
    "今日の天気は晴れです。朝は涼しいですが、昼間は暖かくなります。外出する時はジャケットを持って行ってください。明日は雨が降る予報です。",
    "新しい映画館ができました。駅の前で、でも широкий screenがあります。チケットは前一週間前から買えます。人は多いので，早く行った方がいいです。",
    "友達と lunch を食べました。美味しいイタリア料理でした。子はくな人来ましたが，雰囲気は良かったです。また行きたいです。",
  ],
  N3: [
    "最近の社会問題について话しましょう。少子高齢化は深刻な问题で，政府は様々な対策を考えています。若い世代负担が重くなる一方，老後の生活费も不安です。",
    "كنولوجياの発展は我々の生活を大きく变化させました。智能手机の普及により，情報は瞬時に手に入る时代になりました。しかし，信息過多也成为新的課題です。",
    "环境问题への関心が高まっています。地球温暖化の対策に迫っ版が求められています。各国は再エネの普及を推進していますが，实現にはまだ时间がかかりそうです。",
  ],
  N2: [
    "経済学者の分析によると，消費者心理の改善が景気の持ち直しにつながる可能性が高いとのことです。ただし，エネルギー価格の高騰が影を落としているのも事実です。",
    "現代社会において，都市部への人口集中は避けられないトレンドと言えます。しかし，地方創生のための施策も効果を上げ始めており， некоторые地域では転入超過の動きも見られます。",
    "会议では，新しいマーケティング戦略について議論されました。デジタル трансформацияを踏まえたアプローチが求められていますが，従来の方法も見直す必要があるとのことです。",
  ],
  N1: [
    "本稿では，現代社会における人間関係の變容について考察する。信息技术の進化により，直接的なコミュニケーションの機会は著しく減少している。このことがもたらす心理的影響は看過できない。",
    "产业结构の変革は避けられない趨勢である。AI技術の導入により，既存のビジネスモデルは根本的に見直される必要がある。だが，技術の進化は同時に新たな可能性を拓くものでもある。",
    "グローバル化が進む現代において，異文化理解の重要性は日益つ高まっている。画一的な価値観ではなく，多様性を受け入れる柔軟性が求められている。これは国家レベルでも企業レベルでも同じことが言える。",
  ],
};

const MOCK_QUESTIONS: Record<JLPTLevel, ListeningQuestion[]> = {
  N5: [
    {
      id: "mock-q1",
      question: "Where is the station?",
      options: [
        "Next to that building",
        "Behind the park",
        "In front of the school",
        "Near the hospital",
      ],
      correctAnswer: 0,
      explanation: "The speaker says the station is next to that building.",
      hintWords: ["あのビル"],
    },
    {
      id: "mock-q2",
      question: "What did the customer order?",
      options: ["Rice", "Bread", "Noodles", "Vegetables"],
      correctAnswer: 1,
      explanation: "The customer ordered bread.",
      hintWords: ["パン"],
    },
  ],
  N4: [
    {
      id: "mock-q1",
      question: "What is the weather like today?",
      options: ["Rainy", "Cloudy", "Sunny", "Snowy"],
      correctAnswer: 2,
      explanation: "The forecast says it will be sunny today.",
      hintWords: ["晴れ"],
    },
    {
      id: "mock-q2",
      question: "What should you bring when going out?",
      options: ["An umbrella", "A jacket", "Sunglasses", "A hat"],
      correctAnswer: 1,
      explanation: "You should bring a jacket because it will be cool in the morning.",
      hintWords: ["ジャケット"],
    },
    {
      id: "mock-q3",
      question: "What is the weather forecast for tomorrow?",
      options: ["Sunny", "Cloudy", "Rainy", "Snowy"],
      correctAnswer: 2,
      explanation: "Tomorrow is expected to be rainy.",
      hintWords: ["雨"],
    },
  ],
  N3: [
    {
      id: "mock-q1",
      question: "What is mentioned as a serious social issue?",
      options: [
        "Climate change",
        "Declining birthrate and aging population",
        "Unemployment",
        "Housing problems",
      ],
      correctAnswer: 1,
      explanation:
        "The declining birthrate and aging population is mentioned as a serious social issue.",
      hintWords: ["少子高齢化"],
    },
    {
      id: "mock-q2",
      question: "What burden is mentioned as increasing?",
      options: [
        "Workload",
        "Financial burden on younger generations",
        "Housing costs",
        "Education costs",
      ],
      correctAnswer: 1,
      explanation: "The financial burden on younger generations is mentioned as increasing.",
      hintWords: ["負担"],
    },
    {
      id: "mock-q3",
      question: "What concern is mentioned about retirement?",
      options: ["Health issues", "Living expenses", "Loneliness", "Boredom"],
      correctAnswer: 1,
      explanation: "Living expenses after retirement is mentioned as a concern.",
      hintWords: ["老後の生活费"],
    },
  ],
  N2: [
    {
      id: "mock-q1",
      question: "What might lead to economic recovery according to the analyst?",
      options: [
        "Government intervention",
        "Improved consumer sentiment",
        "Lower taxes",
        "Increased exports",
      ],
      correctAnswer: 1,
      explanation:
        "According to the economic analyst, improved consumer sentiment is likely to lead to economic recovery.",
      hintWords: ["消費者心理"],
    },
    {
      id: "mock-q2",
      question: "What is casting a shadow despite improvements?",
      options: ["Labor shortages", "Rising energy prices", "Trade deficits", "Inflation"],
      correctAnswer: 1,
      explanation: "Rising energy prices are mentioned as casting a shadow on the economy.",
      hintWords: ["エネルギー価格"],
    },
    {
      id: "mock-q3",
      question: "What trend regarding population in urban areas is mentioned?",
      options: [
        "Population is decreasing",
        "Population concentration is unavoidable",
        "Rural areas are growing",
        "Population is stabilizing",
      ],
      correctAnswer: 1,
      explanation: "Population concentration in urban areas is mentioned as an unavoidable trend.",
      hintWords: ["人口集中"],
    },
    {
      id: "mock-q4",
      question: "What new approach is being discussed in the meeting?",
      options: [
        "Traditional marketing",
        "Digital transformation-based approach",
        "International expansion",
        "Cost reduction",
      ],
      correctAnswer: 1,
      explanation: "A digital transformation-based approach is being discussed.",
      hintWords: ["デジタル transformation"],
    },
  ],
  N1: [
    {
      id: "mock-q1",
      question: "What has significantly decreased due to technology evolution?",
      options: [
        "Work opportunities",
        "Direct communication opportunities",
        "Learning resources",
        "Social activities",
      ],
      correctAnswer: 1,
      explanation:
        "Direct communication opportunities have significantly decreased due to technology evolution.",
      hintWords: ["コミュニケーション"],
    },
    {
      id: "mock-q2",
      question: "What psychological impact is mentioned?",
      options: [
        "Increased happiness",
        "Cannot be overlooked",
        "Reduced stress",
        "Improved relationships",
      ],
      correctAnswer: 1,
      explanation: "The psychological impact mentioned cannot be overlooked.",
      hintWords: ["心理的影響"],
    },
    {
      id: "mock-q3",
      question: "What transformation is described as an unavoidable trend?",
      options: [
        "Digital transformation",
        "Industrial structure transformation",
        "Social transformation",
        "Cultural transformation",
      ],
      correctAnswer: 1,
      explanation: "Industrial structure transformation is described as an unavoidable trend.",
      hintWords: ["产业结构"],
    },
    {
      id: "mock-q4",
      question: "What is required in modern global society according to the passage?",
      options: [
        "Uniform values",
        "Flexibility to accept diversity",
        "Strict rules",
        "Technology adoption",
      ],
      correctAnswer: 1,
      explanation: "Flexibility to accept diversity is required in modern global society.",
      hintWords: ["多様性"],
    },
    {
      id: "mock-q5",
      question: "What does AI introduction require existing business models to do?",
      options: ["Expand globally", "Be fundamentally reviewed", "Increase prices", "Reduce staff"],
      correctAnswer: 1,
      explanation:
        "AI introduction requires existing business models to be fundamentally reviewed.",
      hintWords: ["見直される"],
    },
  ],
};

// ─── AI Service ─────────────────────────────────────────────────────────────────

class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Process audio file with AI to generate transcript and questions
   */
  async processAudio(
    audioFileId: string,
    level: JLPTLevel,
    mode: ListeningMode,
  ): Promise<ListeningAIResult> {
    // Try API first
    if (isApiEnabled) {
      try {
        const response = await fetch(`${this.baseUrl}/listening/ai-process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioFileId, level, mode }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.data as ListeningAIResult;
        }
      } catch (error) {
        console.warn("AI API failed, using mock service:", error);
      }
    }

    // Fallback to mock AI processing
    return this.mockAIProcess(audioFileId, level, mode);
  }

  /**
   * Generate AI content without actual audio (mock mode)
   */
  async generateContent(options: AIContentGenerationOptions): Promise<ListeningAIResult> {
    // Simulate API delay
    await this.simulateDelay(2000, 4000);

    const { level, mode } = options;
    const transcripts = MOCK_TRANSCRIPTS[level];
    const randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];

    const result: ListeningAIResult = {
      audioFileId: `mock-audio-${Date.now()}`,
      status: "completed",
      transcript: {
        raw: randomTranscript,
        cleaned: this.cleanTranscript(randomTranscript),
        segments: this.generateSegments(randomTranscript),
      },
      questions: [],
      metadata: {
        level,
        mode,
        generatedAt: new Date().toISOString(),
        processingTime: Math.floor(Math.random() * 3000) + 2000,
      },
    };

    // Generate questions based on mode
    if (mode === "quiz" || mode === "both") {
      const mockQuestions = MOCK_QUESTIONS[level];
      const numQuestions =
        mode === "both" ? Math.min(mockQuestions.length, 5) : Math.min(mockQuestions.length, 3);
      result.questions = mockQuestions.slice(0, numQuestions);
    }

    return result;
  }

  /**
   * Check AI processing status
   */
  async getProcessingStatus(jobId: string): Promise<AIProcessingStatus> {
    if (isApiEnabled) {
      try {
        const response = await fetch(`${this.baseUrl}/listening/ai-status/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          return data.data as AIProcessingStatus;
        }
      } catch (error) {
        console.warn("AI status check failed:", error);
      }
    }

    // Mock status
    return {
      jobId,
      status: Math.random() > 0.2 ? "completed" : "processing",
      progress: Math.floor(Math.random() * 100),
      estimatedTime: Math.floor(Math.random() * 30) + 10,
    };
  }

  /**
   * Cancel AI processing job
   */
  async cancelProcessing(jobId: string): Promise<boolean> {
    if (isApiEnabled) {
      try {
        const response = await fetch(`${this.baseUrl}/listening/ai-cancel/${jobId}`, {
          method: "POST",
        });
        return response.ok;
      } catch (error) {
        console.warn("AI cancel failed:", error);
      }
    }

    // Mock cancel - always succeeds
    console.log(`Mock: Cancelled processing job ${jobId}`);
    return true;
  }

  // ─── Private Helper Methods ────────────────────────────────────────────────

  private async mockAIProcess(
    audioFileId: string,
    level: JLPTLevel,
    mode: ListeningMode,
  ): Promise<ListeningAIResult> {
    // Simulate processing delay (2-4 seconds)
    await this.simulateDelay(2000, 4000);

    const transcripts = MOCK_TRANSCRIPTS[level];
    const randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];

    const result: ListeningAIResult = {
      audioFileId,
      status: "completed",
      transcript: {
        raw: randomTranscript,
        cleaned: this.cleanTranscript(randomTranscript),
        segments: this.generateSegments(randomTranscript),
      },
      questions: [],
      metadata: {
        level,
        mode,
        generatedAt: new Date().toISOString(),
        processingTime: Math.floor(Math.random() * 3000) + 2000,
      },
    };

    // Generate questions based on mode
    if (mode === "quiz" || mode === "both") {
      const mockQuestions = MOCK_QUESTIONS[level];
      const numQuestions =
        mode === "both" ? Math.min(mockQuestions.length, 5) : Math.min(mockQuestions.length, 3);
      result.questions = mockQuestions.slice(0, numQuestions);
    }

    return result;
  }

  private cleanTranscript(rawTranscript: string): string {
    // Clean up transcript - remove speaker labels, normalize spacing
    return rawTranscript
      .split("\n")
      .map((line) => line.replace(/^[A-Z]:\s*/g, "").trim())
      .filter((line) => line.length > 0)
      .join("\n");
  }

  private generateSegments(transcript: string): ListeningTranscript["segments"] {
    const lines = transcript.split("\n").filter((l) => l.trim());
    let startTime = 0;

    return lines.map((line, index) => {
      const duration = Math.floor(Math.random() * 10) + 5; // 5-15 seconds per segment
      const segment: ListeningTranscript["segments"][0] = {
        id: `seg-${index}`,
        startTime,
        endTime: startTime + duration,
        text: line.replace(/^[A-Z]:\s*/g, "").trim(),
        translation: this.translateSegment(line),
      };
      startTime += duration + 1; // Add 1 second pause between segments
      return segment;
    });
  }

  private translateSegment(segment: string): string {
    // Mock translations
    const translations: Record<string, string> = {
      すみません: "Excuse me",
      駅はどこですか: "Where is the station?",
      あのビルの隣です: "It's next to that building",
      ありがとうございます: "Thank you",
      どういたしまして: "You're welcome",
      いらっしゃいませ: "Welcome",
      パン: "bread",
      "はい、どうぞ": "Yes, here you go",
      今日は日本語の時間です: "Today is Japanese class",
      先生: "Teacher",
      学生: "Student",
      ページを開けてください: "Please open your books",
      何ページですか: "What page?",
    };

    let translation = segment;
    Object.entries(translations).forEach(([jp, en]) => {
      translation = translation.replace(jp, en);
    });

    // If no known translation, return placeholder
    if (translation === segment) {
      return "[Translation pending]";
    }
    return translation;
  }

  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

// ─── Export Singleton ───────────────────────────────────────────────────────────
export const aiService = new AIService();

// ─── Named Exports for Convenience ──────────────────────────────────────────────
export const processAudioWithAI = (audioFileId: string, level: JLPTLevel, mode: ListeningMode) =>
  aiService.processAudio(audioFileId, level, mode);

export const generateAIListeningContent = (options: AIContentGenerationOptions) =>
  aiService.generateContent(options);

export const checkAIProcessingStatus = (jobId: string) => aiService.getProcessingStatus(jobId);

export const cancelAIProcessing = (jobId: string) => aiService.cancelProcessing(jobId);

// ─── Check if API is available ────────────────────────────────────────────────
export const isAIApiEnabled = isApiEnabled;
