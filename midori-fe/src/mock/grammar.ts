// ─── Grammar Mock Data ───────────────────────────────────────────────────────

import type { JLPTLevel } from "../mocks/contentLibraryMock";

// Local type definition matching this file's data structure
interface GrammarItemLocal {
  id: string;
  grammarStructure: string;
  meaning: string;
  exampleSentences: Array<{ sentence: string; meaning: string }>;
  jlptLevel: JLPTLevel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const mockGrammar: GrammarItemLocal[] = [
  {
    id: "gram-001",
    grammarStructure: "～は～です",
    meaning: "A là B (mệnh đề khẳng định)",
    exampleSentences: [
      { sentence: "私は学生です。", meaning: "Tôi là sinh viên." },
      { sentence: "これは本です。", meaning: "Đây là sách." },
    ],
    jlptLevel: "N5",
    tags: ["basic", "copula", "declarative"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "gram-002",
    grammarStructure: "～は～ではありません",
    meaning: "A không phải là B (phủ định)",
    exampleSentences: [
      { sentence: "私は先生ではありません。", meaning: "Tôi không phải là giáo viên." },
      { sentence: "それは猫ではありません。", meaning: "Đó không phải là con mèo." },
    ],
    jlptLevel: "N5",
    tags: ["basic", "copula", "negative"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "gram-003",
    grammarStructure: "～は～ですか？",
    meaning: "A có phải là B không? (câu hỏi)",
    exampleSentences: [
      { sentence: "あなたは学生ですか？", meaning: "Bạn có phải là sinh viên không?" },
      { sentence: "これは何ですか？", meaning: "Đây là cái gì?" },
    ],
    jlptLevel: "N5",
    tags: ["basic", "copula", "question"],
    createdAt: "2024-01-16",
    updatedAt: "2024-01-16",
  },
  {
    id: "gram-004",
    grammarStructure: "～があります／います",
    meaning: "Có A (vật/người ở đâu đó)",
    exampleSentences: [
      { sentence: "部屋に猫がいます。", meaning: "Có con mèo trong phòng." },
      { sentence: "机の上に本があります。", meaning: "Có một cuốn sách trên bàn." },
    ],
    jlptLevel: "N5",
    tags: ["existence", "location", "basic"],
    createdAt: "2024-01-17",
    updatedAt: "2024-01-17",
  },
  {
    id: "gram-005",
    grammarStructure: "～たい",
    meaning: "Muốn làm gì (động từ thể たい)",
    exampleSentences: [
      { sentence: "日本語を勉強したいです。", meaning: "Tôi muốn học tiếng Nhật." },
      { sentence: "寿司を食べたいです。", meaning: "Tôi muốn ăn sushi." },
    ],
    jlptLevel: "N5",
    tags: ["desire", "verb", "たい-form"],
    createdAt: "2024-01-18",
    updatedAt: "2024-01-18",
  },
  {
    id: "gram-006",
    grammarStructure: "～てください",
    meaning: "Làm ơn làm gì (yêu cầu/xin phép)",
    exampleSentences: [
      { sentence: "名前を書いてください。", meaning: "Làm ơn viết tên." },
      { sentence: "これをコピーしてください。", meaning: "Làm ơn photocopy cái này." },
    ],
    jlptLevel: "N5",
    tags: ["request", "polite", "te-form"],
    createdAt: "2024-01-19",
    updatedAt: "2024-01-19",
  },
  {
    id: "gram-007",
    grammarStructure: "～でしょう",
    meaning: "Có lẽ/Chắc là (suy đoán)",
    exampleSentences: [
      { sentence: "明日は晴れでしょう。", meaning: "Ngày mai chắc là trời nắng." },
      { sentence: "彼は日本に行くでしょう。", meaning: "Có lẽ anh ấy sẽ đi Nhật Bản." },
    ],
    jlptLevel: "N4",
    tags: ["speculation", "conjecture", "probability"],
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: "gram-008",
    grammarStructure: "～ことができます",
    meaning: "Có thể làm gì (năng lực/khả năng)",
    exampleSentences: [
      { sentence: "日本語を話すことができます。", meaning: "Tôi có thể nói tiếng Nhật." },
      { sentence: "車を運転することができます。", meaning: "Tôi có thể lái xe." },
    ],
    jlptLevel: "N4",
    tags: ["ability", "potential", "こと-form"],
    createdAt: "2024-02-02",
    updatedAt: "2024-02-02",
  },
  {
    id: "gram-009",
    grammarStructure: "～なければならない",
    meaning: "Phải làm gì (bắt buộc)",
    exampleSentences: [
      { sentence: "明日提出しなければならない。", meaning: "Ngày mai phải nộp." },
      { sentence: "毎日勉強しなければならない。", meaning: "Phải học mỗi ngày." },
    ],
    jlptLevel: "N4",
    tags: ["obligation", "necessity", "negative"],
    createdAt: "2024-02-03",
    updatedAt: "2024-02-03",
  },
  {
    id: "gram-010",
    grammarStructure: "～そうだ",
    meaning: "Nghe nói rằng... (nguồn tin)",
    exampleSentences: [
      {
        sentence: "天気予報によると、明日は雨そうだ。",
        meaning: "Theo dự báo thời tiết, nghe nói ngày mai trời mưa.",
      },
      { sentence: "彼が合格したそうだ。", meaning: "Nghe nói anh ấy đã đỗ." },
    ],
    jlptLevel: "N4",
    tags: ["hearsay", "information", "そうだ"],
    createdAt: "2024-02-04",
    updatedAt: "2024-02-04",
  },
  {
    id: "gram-011",
    grammarStructure: "～ために",
    meaning: "Vì để... / Nhằm mục đích",
    exampleSentences: [
      { sentence: "健康のために運動する。", meaning: "Tập thể dục vì sức khỏe." },
      { sentence: "大学に入るために勉強する。", meaning: "Học để vào đại học." },
    ],
    jlptLevel: "N3",
    tags: ["purpose", "reason", "ために"],
    createdAt: "2024-03-01",
    updatedAt: "2024-03-01",
  },
  {
    id: "gram-012",
    grammarStructure: "～と言われている",
    meaning: "Được cho là... / Được nói rằng...",
    exampleSentences: [
      { sentence: "日本語は難しいと言われている。", meaning: "Tiếng Nhật được cho là khó." },
      {
        sentence: "この映画は素晴らしいと言われている。",
        meaning: "Bộ phim này được nói là tuyệt vời.",
      },
    ],
    jlptLevel: "N3",
    tags: ["passive", "hearsay", "cultural"],
    createdAt: "2024-03-02",
    updatedAt: "2024-03-02",
  },
  {
    id: "gram-013",
    grammarStructure: "～に関して",
    meaning: "Liên quan đến... / Về...",
    exampleSentences: [
      { sentence: "環境問題に関して議論した。", meaning: "Đã thảo luận về vấn đề môi trường." },
      {
        sentence: "この事件に関して情報がない。",
        meaning: "Không có thông tin liên quan đến vụ việc này.",
      },
    ],
    jlptLevel: "N2",
    tags: ["topic", "regarding", "formal"],
    createdAt: "2024-04-01",
    updatedAt: "2024-04-01",
  },
  {
    id: "gram-014",
    grammarStructure: "～にもかかわらず",
    meaning: "Mặc dù... / Dù... (có sự đối lập)",
    exampleSentences: [
      {
        sentence: "雨にもかかわらず、試合は続けた。",
        meaning: "Mặc dù trời mưa, trận đấu vẫn tiếp tục.",
      },
      {
        sentence: "眠いにもかかわらず、仕事を続けた。",
        meaning: "Dù buồn ngủ, vẫn tiếp tục làm việc.",
      },
    ],
    jlptLevel: "N2",
    tags: ["contrast", "despite", "formal"],
    createdAt: "2024-04-02",
    updatedAt: "2024-04-02",
  },
  {
    id: "gram-015",
    grammarStructure: "～に違いない",
    meaning: "Chắc chắn là... / Không còn nghi ngờ gì",
    exampleSentences: [
      { sentence: "彼が犯人犯に違いない。", meaning: "Chắc chắn anh ta là thủ phạm." },
      { sentence: "この答えは正しいに違いない。", meaning: "Câu trả lời này chắc chắn đúng." },
    ],
    jlptLevel: "N1",
    tags: ["certainty", "conjecture", "formal"],
    createdAt: "2024-05-01",
    updatedAt: "2024-05-01",
  },
];

export const getGrammarByLevel = (level: JLPTLevel) => {
  return mockGrammar.filter((item) => item.jlptLevel === level);
};

export const getGrammarById = (id: string) => {
  return mockGrammar.find((item) => item.id === id);
};

export const searchGrammar = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return mockGrammar.filter(
    (item) =>
      item.grammarStructure.toLowerCase().includes(lowerQuery) ||
      item.meaning.toLowerCase().includes(lowerQuery) ||
      item.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery)),
  );
};
