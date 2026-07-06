import { api } from "./client";

// Mock dictionary for N5 vocabulary
const N5_DICTIONARY: Record<string, {
  type: "vocab" | "grammar" | "expression";
  kanji: string;
  hiragana: string;
  meaning: string;
  jlpt: string;
  example?: string;
  relatedWords?: string[];
}> = {
  "私": {
    type: "vocab",
    kanji: "私",
    hiragana: "わたし",
    meaning: "Tôi (đại từ xưng hô ngôi thứ nhất)",
    jlpt: "N5",
    example: "私は学生です。= Tôi là học sinh.",
    relatedWords: ["僕", "俺", "あたし"]
  },
  "は": {
    type: "grammar",
    kanji: "は",
    hiragana: "は",
    meaning: "Trợ từ chủ đề - đánh dấu chủ đề của câu",
    jlpt: "N5",
    example: "私は田中です。= Tôi là Tanaka.",
    relatedWords: ["が", "を", "に"]
  },
  "です": {
    type: "grammar",
    kanji: "です",
    hiragana: "です",
    meaning: "Động từ dứt khoát (trợ từ) - dùng để khẳng định lịch sự",
    jlpt: "N5",
    example: "先生です。= Là giáo viên.",
    relatedWords: ["だ", "ます"]
  },
  "学生": {
    type: "vocab",
    kanji: "学生",
    hiragana: "がくせい",
    meaning: "Học sinh / Sinh viên",
    jlpt: "N5",
    example: "私は学生です。= Tôi là học sinh.",
    relatedWords: ["先生", "友達", "家族"]
  },
  "先生": {
    type: "vocab",
    kanji: "先生",
    hiragana: "せんせい",
    meaning: "Giáo viên / Thầy cô",
    jlpt: "N5",
    example: "あの人は先生です。= Người đó là giáo viên.",
    relatedWords: ["学生", "学校"]
  },
  "日本": {
    type: "vocab",
    kanji: "日本",
    hiragana: "にほん",
    meaning: "Nhật Bản",
    jlpt: "N5",
    example: "日本はきれいです。= Nhật Bản đẹp.",
    relatedWords: ["日本人", "日本語"]
  },
  "日本語": {
    type: "vocab",
    kanji: "日本語",
    hiragana: "にほんご",
    meaning: "Tiếng Nhật",
    jlpt: "N5",
    example: "日本語を勉強しています。= Đang học tiếng Nhật.",
    relatedWords: ["日本", "英語"]
  },
  "好き": {
    type: "vocab",
    kanji: "好き",
    hiragana: "すき",
    meaning: "Thích",
    jlpt: "N5",
    example: "映画が好きです。= Thích phim.",
    relatedWords: ["嫌い", "大事"]
  },
  "何": {
    type: "vocab",
    kanji: "何",
    hiragana: "なに",
    meaning: "Cái gì / Hỏi đối tượng",
    jlpt: "N5",
    example: "これは何ですか？= Cái này là gì?",
    relatedWords: ["どこ", "誰", "いつ"]
  },
  "名前": {
    type: "vocab",
    kanji: "名前",
    hiragana: "なまえ",
    meaning: "Tên",
    jlpt: "N5",
    example: "名前は何ですか？= Tên là gì?",
    relatedWords: ["姓", "名"]
  },
  "ありがとう": {
    type: "vocab",
    kanji: "ありがとう",
    hiragana: "ありがとう",
    meaning: "Cảm ơn",
    jlpt: "N5",
    example: "ありがとうございます。= Cảm ơn (lịch sự).",
    relatedWords: ["すみません", "ごめんなさい"]
  },
  "友達": {
    type: "vocab",
    kanji: "友達",
    hiragana: "ともだち",
    meaning: "Bạn bè",
    jlpt: "N5",
    example: "友達と映画を見ます。= Xem phim với bạn bè.",
    relatedWords: ["家族", "恋人"]
  },
  "家族": {
    type: "vocab",
    kanji: "家族",
    hiragana: "かぞく",
    meaning: "Gia đình",
    jlpt: "N5",
    example: "家族は何人ですか？= Gia đình có bao nhiêu người?",
    relatedWords: ["親", "子供", "兄弟"]
  },
  "こんにちは": {
    type: "expression",
    kanji: "こんにちは",
    hiragana: "こんにちは",
    meaning: "Xin chào (buổi ngày)",
    jlpt: "N5",
    example: "こんにちは、田中さん。= Xin chào Tanaka-san.",
    relatedWords: ["こんばんは", "おはよう"]
  },
  "お願いします": {
    type: "expression",
    kanji: "お願いします",
    hiragana: "おねがいします",
    meaning: "Xin nhờ / Làm ơn",
    jlpt: "N5",
    example: "水をください、お願いします。= Xin cho tôi xin nước.",
    relatedWords: ["ありがとうございます", "すみません"]
  }
};

export interface StudentShadowingSegment {
  id: string;
  startTime: number;
  endTime: number;
  japaneseText: string;
  vietnameseTranslation: string;
}

export interface StudentShadowingLesson {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  topic?: string;
  jlptLevel?: string;
  segments: StudentShadowingSegment[];
}

export const studentShadowingApi = {
  /**
   * Get list of all shadowing lessons for student.
   */
  listShadowing: async (): Promise<StudentShadowingLesson[]> => {
    const res = await api.get<any[]>("/student/shadowing");
    return res.map((l: any) => ({
      id: l.id,
      title: l.title,
      videoUrl: l.videoUrl,
      duration: l.duration,
      topic: l.topic,
      jlptLevel: l.jlptLevel,
      segments: l.sentences ? l.sentences.map((s: any) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        japaneseText: s.japanese,
        vietnameseTranslation: s.vietnamese
      })) : []
    }));
  },

  /**
   * Get details of a single shadowing lesson by ID for student.
   */
  getShadowingDetail: async (id: string): Promise<StudentShadowingLesson> => {
    const l = await api.get<any>(`/student/shadowing/${id}`);
    return {
      id: l.id,
      title: l.title,
      videoUrl: l.videoUrl,
      duration: l.duration,
      topic: l.topic,
      jlptLevel: l.jlptLevel,
      segments: l.sentences ? l.sentences.map((s: any) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        japaneseText: s.japanese,
        vietnameseTranslation: s.vietnamese
      })) : []
    };
  },

  /**
   * Evaluate student speech audio recording
   */
  evaluateSpeech: async (audioBlob: Blob, expectedText: string, duration: number): Promise<AIFeedback> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "user_recording.webm");
    formData.append("expectedText", expectedText);
    formData.append("duration", duration.toString());
    
    return await api.post<AIFeedback>("/student/shadowing/evaluate", formData);
  },

  /**
   * Explain a selected word or phrase in the context of the sentence
   */
  explainText: async (text: string, sentence: string): Promise<any> => {
    // Try to find in mock dictionary first
    const cleanText = text.trim();
    
    if (N5_DICTIONARY[cleanText]) {
      const entry = N5_DICTIONARY[cleanText];
      return {
        type: entry.type,
        kanji: entry.kanji,
        hiragana: entry.hiragana,
        meaning: entry.meaning,
        jlpt: entry.jlpt,
        example: entry.example,
        relatedWords: entry.relatedWords,
        pattern: entry.type === "grammar" ? entry.kanji : undefined,
        explanation: entry.type === "grammar" ? entry.meaning : undefined
      };
    }
    
    // If not found in dictionary, try API call
    const formData = new FormData();
    formData.append("text", text);
    formData.append("sentence", sentence);
    
    try {
      return await api.post<any>("/student/shadowing/explain", formData);
    } catch (err) {
      // Return a generic response if API fails
      return {
        type: "vocab",
        kanji: cleanText,
        hiragana: "",
        meaning: "(Từ vựng chưa có trong từ điển)",
        jlpt: "N5",
        example: "",
        relatedWords: []
      };
    }
  }
};

export interface WordResult {
  word: string;
  correct: boolean;
}

export interface DiffToken {
  text: string;
  status: "correct" | "incorrect" | "missing" | "extra";
}

export interface AIFeedback {
  pronunciation: number;
  pitchAccent: number;
  fluency: number;
  speed: number;
  overallScore: number;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
  advice?: string;
  retries?: number;
  speedRecommendation?: string;
  incorrectWords?: string[];
  wordResults?: WordResult[];
  spokenText: string;
  diff?: DiffToken[];
}
