// Hiragana Combination Sounds (拗音) - Small ゃ, ゅ, ょ
export interface HiraganaCharacter {
  id: string;
  character: string;
  romaji: string;
  pronunciation: string;
  meaning: string;
  exampleWord: string;
  exampleMeaning: string;
  audioUrl: null;
  strokeOrder: number;
}

export const hiraganaCombination: HiraganaCharacter[] = [
  // KYA row (きゃ行)
  { id: "kya", character: "きゃ", romaji: "kya", pronunciation: "/kja/", meaning: "kya", exampleWord: "きゃく", exampleMeaning: "customer", audioUrl: null, strokeOrder: 1 },
  { id: "kyu", character: "きゅ", romaji: "kyu", pronunciation: "/kjo/", meaning: "kyu", exampleWord: "きゅうり", exampleMeaning: "cucumber", audioUrl: null, strokeOrder: 2 },
  { id: "kyo", character: "きょ", romaji: "kyo", pronunciation: "/kjoː/", meaning: "kyo", exampleWord: "きょう", exampleMeaning: "today", audioUrl: null, strokeOrder: 3 },
  
  // SHA row (しゃ行)
  { id: "sha", character: "しゃ", romaji: "sha", pronunciation: "/ɕa/", meaning: "sha", exampleWord: "しゃしん", exampleMeaning: "photo", audioUrl: null, strokeOrder: 4 },
  { id: "shu", character: "しゅ", romaji: "shu", pronunciation: "/ɕɯ/", meaning: "shu", exampleWord: "しゅくだい", exampleMeaning: "homework", audioUrl: null, strokeOrder: 5 },
  { id: "sho", character: "しょ", romaji: "sho", pronunciation: "/ɕo/", meaning: "sho", exampleWord: "しょうがくせい", exampleMeaning: "elementary student", audioUrl: null, strokeOrder: 6 },
  
  // CHA row (ちゃ行)
  { id: "cha", character: "ちゃ", romaji: "cha", pronunciation: "/tɕa/", meaning: "cha", exampleWord: "ちゃいろ", exampleMeaning: "tea color", audioUrl: null, strokeOrder: 7 },
  { id: "chu", character: "ちゅ", romaji: "chu", pronunciation: "/tɕɯ/", meaning: "chu", exampleWord: "ちゅうがく", exampleMeaning: "middle school", audioUrl: null, strokeOrder: 8 },
  { id: "cho", character: "ちょ", romaji: "cho", pronunciation: "/tɕo/", meaning: "cho", exampleWord: "ちょうど", exampleMeaning: "just right", audioUrl: null, strokeOrder: 9 },
  
  // NYA row (にゃ行)
  { id: "nya", character: "にゃ", romaji: "nya", pronunciation: "/nja/", meaning: "nya", exampleWord: "にゃんこ", exampleMeaning: "kitty", audioUrl: null, strokeOrder: 10 },
  { id: "nyu", character: "にゅ", romaji: "nyu", pronunciation: "/njo/", meaning: "nyu", exampleWord: "にゅうがく", exampleMeaning: "entering school", audioUrl: null, strokeOrder: 11 },
  { id: "nyo", character: "にょ", romaji: "nyo", pronunciation: "/njoː/", meaning: "nyo", exampleWord: "にょうほう", exampleMeaning: "gypsum", audioUrl: null, strokeOrder: 12 },
  
  // HYA row (ひゃ行)
  { id: "hya", character: "ひゃ", romaji: "hya", pronunciation: "/çja/", meaning: "hya", exampleWord: "ひゃく", exampleMeaning: "hundred", audioUrl: null, strokeOrder: 13 },
  { id: "hyu", character: "ひゅ", romaji: "hyu", pronunciation: "/çjo/", meaning: "hyu", exampleWord: "ひゅうえい", exampleMeaning: "休泳 (swim ban)", audioUrl: null, strokeOrder: 14 },
  { id: "hyo", character: "ひょ", romaji: "hyo", pronunciation: "/çjoː/", meaning: "hyo", exampleWord: "ひょうたん", exampleMeaning: "gourd", audioUrl: null, strokeOrder: 15 },
  
  // MYA row (みゃ行)
  { id: "mya", character: "みゃ", romaji: "mya", pronunciation: "/mja/", meaning: "mya", exampleWord: "みゃく", exampleMeaning: "脈 (pulse)", audioUrl: null, strokeOrder: 16 },
  { id: "myu", character: "みゅ", romaji: "myu", pronunciation: "/mjo/", meaning: "myu", exampleWord: "みゅうちょう", exampleMeaning: "明治 (Meiji era)", audioUrl: null, strokeOrder: 17 },
  { id: "myo", character: "みょ", romaji: "myo", pronunciation: "/mjoː/", meaning: "myo", exampleWord: "みょうにち", exampleMeaning: "tomorrow", audioUrl: null, strokeOrder: 18 },
  
  // RYA row (りゃ行)
  { id: "rya", character: "りゃ", romaji: "rya", pronunciation: "/ɾja/", meaning: "rya", exampleWord: "りゃくだん", exampleMeaning: "logic", audioUrl: null, strokeOrder: 19 },
  { id: "ryu", character: "りゅ", romaji: "ryu", pronunciation: "/ɾjo/", meaning: "ryu", exampleWord: "りゅうがく", exampleMeaning: "studying abroad", audioUrl: null, strokeOrder: 20 },
  { id: "ryo", character: "りょ", romaji: "ryo", pronunciation: "/ɾjoː/", meaning: "ryo", exampleWord: "りょうり", exampleMeaning: "cooking", audioUrl: null, strokeOrder: 21 },
  
  // GYA row (ぎゃ行)
  { id: "gya", character: "ぎゃ", romaji: "gya", pronunciation: "/gja/", meaning: "gya", exampleWord: "ぎゃく", exampleMeaning: "evil", audioUrl: null, strokeOrder: 22 },
  { id: "gyu", character: "ぎゅ", romaji: "gyu", pronunciation: "/gjo/", meaning: "gyu", exampleWord: "ぎゅうにゅう", exampleMeaning: "milk", audioUrl: null, strokeOrder: 23 },
  { id: "gyo", character: "ぎょ", romaji: "gyo", pronunciation: "/gjoː/", meaning: "gyo", exampleWord: "ぎょうぎ", exampleMeaning: "manners", audioUrl: null, strokeOrder: 24 },
  
  // JA row (じゃ行)
  { id: "ja", character: "じゃ", romaji: "ja", pronunciation: "/dʑa/", meaning: "ja", exampleWord: "ジャケット", exampleMeaning: "jacket", audioUrl: null, strokeOrder: 25 },
  { id: "ju", character: "じゅ", romaji: "ju", pronunciation: "/dʑɯ/", meaning: "ju", exampleWord: "じゅう", exampleMeaning: "ten", audioUrl: null, strokeOrder: 26 },
  { id: "jo", character: "じょ", romaji: "jo", pronunciation: "/dʑo/", meaning: "jo", exampleWord: "じょせい", exampleMeaning: "woman", audioUrl: null, strokeOrder: 27 },
  
  // BYA row (びゃ行)
  { id: "bya", character: "びゃ", romaji: "bya", pronunciation: "/bja/", meaning: "bya", exampleWord: "びゃくいん", exampleMeaning: "hospital staff", audioUrl: null, strokeOrder: 28 },
  { id: "byu", character: "びゅ", romaji: "byu", pronunciation: "/bjo/", meaning: "byu", exampleWord: "びゅういん", exampleMeaning: "美ugu", audioUrl: null, strokeOrder: 29 },
  { id: "byo", character: "びょ", romaji: "byo", pronunciation: "/bjoː/", meaning: "byo", exampleWord: "びょういん", exampleMeaning: "hospital", audioUrl: null, strokeOrder: 30 },
  
  // PYA row (ぴゃ行)
  { id: "pya", character: "ぴゃ", romaji: "pya", pronunciation: "/pja/", meaning: "pya", exampleWord: "ぴゃん", exampleMeaning: "meow", audioUrl: null, strokeOrder: 31 },
  { id: "pyu", character: "ぴゅ", romaji: "pyu", pronunciation: "/pjo/", meaning: "pyu", exampleWord: "ぴゅう", exampleMeaning: "whoosh", audioUrl: null, strokeOrder: 32 },
  { id: "pyo", character: "ぴょ", romaji: "pyo", pronunciation: "/pjoː/", meaning: "pyo", exampleWord: "ぴょう", exampleMeaning: "坪 (area unit)", audioUrl: null, strokeOrder: 33 },
];

export const hiraganaCombinationLesson = {
  id: "hiragana-combination",
  title: "Hiragana Combinations",
  subtitle: "Small Character Sounds (拗音)",
  description: "Learn Hiragana combination sounds formed with small ゃ, ゅ, ょ characters.",
  totalCharacters: 33,
  difficulty: 3,
  estimatedTime: 35,
  characters: hiraganaCombination,
  color: "from-emerald-400 to-teal-500",
};

export default hiraganaCombination;
