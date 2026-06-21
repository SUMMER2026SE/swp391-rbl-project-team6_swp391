// Katakana Loanwords ( 외래어 / 片假名借用語)
export interface LoanWord {
  id: string;
  word: string;
  romaji: string;
  meaning: string;
  category: string;
  pronunciation: string;
}

export const katakanaLoanwords: LoanWord[] = [
  // Technology & Computers
  { id: "lw-1", word: "テレビ", romaji: "terebi", meaning: "television", category: "Technology", pronunciation: "/teɾebi/" },
  { id: "lw-2", word: "コンピューター", romaji: "konpyuutaa", meaning: "computer", category: "Technology", pronunciation: "/kompiɯːtaː/" },
  { id: "lw-3", word: "インターネット", romaji: "intaanetto", meaning: "internet", category: "Technology", pronunciation: "/intɔːnetto/" },
  { id: "lw-4", word: "スマホ", romaji: "sumaho", meaning: "smartphone", category: "Technology", pronunciation: "/sɯmaho/" },
  { id: "lw-5", word: "カメラ", romaji: "kamera", meaning: "camera", category: "Technology", pronunciation: "/kameɾa/" },
  { id: "lw-6", word: "ラジオ", romaji: "rajio", meaning: "radio", category: "Technology", pronunciation: "/ɾadʑio/" },
  { id: "lw-7", word: "ビデオ", romaji: "bideo", meaning: "video", category: "Technology", pronunciation: "/bideo/" },
  { id: "lw-8", word: "メール", romaji: "meeru", meaning: "email", category: "Technology", pronunciation: "/meːɾɯ/" },
  { id: "lw-9", word: "ゲーム", romaji: "geemu", meaning: "game", category: "Technology", pronunciation: "/geːmɯ/" },
  { id: "lw-10", word: "パスワード", romaji: "pasuwaado", meaning: "password", category: "Technology", pronunciation: "/pasɯwaːdo/" },
  
  // Food & Drinks
  { id: "lw-11", word: "コーヒー", romaji: "koohii", meaning: "coffee", category: "Food", pronunciation: "/koːhiː/" },
  { id: "lw-12", word: "レストラン", romaji: "resutoran", meaning: "restaurant", category: "Food", pronunciation: "/ɾesɯtoɾaN/" },
  { id: "lw-13", word: "パン", romaji: "pan", meaning: "bread", category: "Food", pronunciation: "/paN/" },
  { id: "lw-14", word: "バター", romaji: "bataa", meaning: "butter", category: "Food", pronunciation: "/bataː/" },
  { id: "lw-15", word: "チーズ", romaji: "chiizu", meaning: "cheese", category: "Food", pronunciation: "/tɕiːzɯ/" },
  { id: "lw-16", word: "ケーキ", romaji: "keeki", meaning: "cake", category: "Food", pronunciation: "/keːki/" },
  { id: "lw-17", word: "アイスクリーム", romaji: "aisukuriimu", meaning: "ice cream", category: "Food", pronunciation: "/aisɯkɯɾiːmɯ/" },
  { id: "lw-18", word: "ピザ", romaji: "piza", meaning: "pizza", category: "Food", pronunciation: "/piza/" },
  { id: "lw-19", word: "汉堡", romaji: "hanbaagaa", meaning: "hamburger", category: "Food", pronunciation: "/haNbaːgaː/" },
  { id: "lw-20", word: "可乐", romaji: "koora", meaning: "cola", category: "Drinks", pronunciation: "/koːɾa/" },
  
  // Transportation
  { id: "lw-21", word: "タクシー", romaji: "takushii", meaning: "taxi", category: "Transportation", pronunciation: "/takɯɕiː/" },
  { id: "lw-22", word: "バス", romaji: "basu", meaning: "bus", category: "Transportation", pronunciation: "/basɯ/" },
  { id: "lw-23", word: "電車", romaji: "densha", meaning: "train", category: "Transportation", pronunciation: "/deNɕa/" },
  { id: "lw-24", word: "メートル", romaji: "meetoru", meaning: "meter", category: "Measurement", pronunciation: "/meːtoɾɯ/" },
  { id: "lw-25", word: "キロメートル", romaji: "kiromeetoru", meaning: "kilometer", category: "Measurement", pronunciation: "/kiɾomeːtoɾɯ/" },
  
  // Fashion & Clothing
  { id: "lw-26", word: "ドレス", romaji: "doresu", meaning: "dress", category: "Fashion", pronunciation: "/doɾesɯ/" },
  { id: "lw-27", word: "スカート", romaji: "sukaato", meaning: "skirt", category: "Fashion", pronunciation: "/sɯkaːto/" },
  { id: "lw-28", word: "ズボン", romaji: "zubon", meaning: "pants", category: "Fashion", pronunciation: "/zɯboN/" },
  { id: "lw-29", word: "セーター", romaji: "seetaa", meaning: "sweater", category: "Fashion", pronunciation: "/seːtaː/" },
  { id: "lw-30", word: "コート", romaji: "kooto", meaning: "coat", category: "Fashion", pronunciation: "/koːto/" },
  
  // Entertainment
  { id: "lw-31", word: "映画", romaji: "eiga", meaning: "movie/film", category: "Entertainment", pronunciation: "/eːga/" },
  { id: "lw-32", word: "音楽", romaji: "ongaku", meaning: "music", category: "Entertainment", pronunciation: "/oNgaɯkɯ/" },
  { id: "lw-33", word: "バンド", romaji: "bando", meaning: "band", category: "Entertainment", pronunciation: "/baNdo/" },
  { id: "lw-34", word: "音乐会", romaji: "ongakkai", meaning: "concert", category: "Entertainment", pronunciation: "/oNgaKkai/" },
  { id: "lw-35", word: "ピアノ", romaji: "piano", meaning: "piano", category: "Music", pronunciation: "/piano/" },
  { id: "lw-36", word: "ギター", romaji: "gitaa", meaning: "guitar", category: "Music", pronunciation: "/gitaː/" },
  { id: "lw-37", word: "オルゴール", romaji: "orugooru", meaning: "music box", category: "Music", pronunciation: "/oɾɯgoːɾɯ/" },
  
  // Sports & Fitness
  { id: "lw-38", word: "足球", romaji: "sakkaa", meaning: "soccer", category: "Sports", pronunciation: "/saKkaː/" },
  { id: "lw-39", word: "网球", romaji: "tenisu", meaning: "tennis", category: "Sports", pronunciation: "/tenisɯ/" },
  { id: "lw-40", word: "高尔夫", romaji: "gorufu", meaning: "golf", category: "Sports", pronunciation: "/goɾɯfɯ/" },
  { id: "lw-41", word: "马拉松", romaji: "marason", meaning: "marathon", category: "Sports", pronunciation: "/maɾasoN/" },
  { id: "lw-42", word: "瑜伽", romaji: "yoga", meaning: "yoga", category: "Fitness", pronunciation: "/joga/" },
  
  // Places
  { id: "lw-43", word: "ホテル", romaji: "hoteru", meaning: "hotel", category: "Places", pronunciation: "/hoteɾɯ/" },
  { id: "lw-44", word: "银行", romaji: "ginkou", meaning: "bank", category: "Places", pronunciation: "/giNkou/" },
  { id: "lw-45", word: "博物馆", romaji: "hakubutsukan", meaning: "museum", category: "Places", pronunciation: "/haKɯbɯtsɯkaN/" },
  { id: "lw-46", word: "动物园", romaji: "doubutsuen", meaning: "zoo", category: "Places", pronunciation: "/doːbɯtsɯeN/" },
  { id: "lw-47", word: "公园", romaji: "kouen", meaning: "park", category: "Places", pronunciation: "/koːeN/" },
  
  // Business
  { id: "lw-48", word: "会社", romaji: "kaisha", meaning: "company", category: "Business", pronunciation: "/kaiɕa/" },
  { id: "lw-49", word: "社长", romaji: "shachou", meaning: "company president", category: "Business", pronunciation: "/ɕatɕoː/" },
  { id: "lw-50", word: "办公室", romaji: "ofisu", meaning: "office", category: "Business", pronunciation: "/ofisɯ/" },
  { id: "lw-51", word: "アパート", romaji: "apaato", meaning: "apartment", category: "Housing", pronunciation: "/apaːto/" },
  { id: "lw-52", word: "マンション", romaji: "manshon", meaning: "mansion/condo", category: "Housing", pronunciation: "/maNɕoN/" },
  
  // Time
  { id: "lw-53", word: "小时", romaji: "jikan", meaning: "hour/time", category: "Time", pronunciation: "/dʑikaN/" },
  { id: "lw-54", word: "分钟", romaji: "fun", meaning: "minute", category: "Time", pronunciation: "/fɯN/" },
  { id: "lw-55", word: "秒", romaji: "byou", meaning: "second", category: "Time", pronunciation: "/bjoː/" },
  
  // Colors
  { id: "lw-56", word: " красный", romaji: "aka", meaning: "red (native)", category: "Colors", pronunciation: "/aka/" },
  { id: "lw-57", word: "青", romaji: "ao", meaning: "blue (native)", category: "Colors", pronunciation: "/ao/" },
  { id: "lw-58", word: "緑", romaji: "midori", meaning: "green (native)", category: "Colors", pronunciation: "/midoɾi/" },
  
  // Countries
  { id: "lw-59", word: "アメリカ", romaji: "amerika", meaning: "America/USA", category: "Countries", pronunciation: "/ameɾika/" },
  { id: "lw-60", word: "フランス", romaji: "furansu", meaning: "France", category: "Countries", pronunciation: "/fɯɾaNsɯ/" },
  { id: "lw-61", word: "ドイツ", romaji: "doitsu", meaning: "Germany", category: "Countries", pronunciation: "/doːtsɯ/" },
  { id: "lw-62", word: "イタリア", romaji: "itaria", meaning: "Italy", category: "Countries", pronunciation: "/itaɾia/" },
  { id: "lw-63", word: "スペイン", romaji: "supein", meaning: "Spain", category: "Countries", pronunciation: "/sɯpeiN/" },
  { id: "lw-64", word: "ヨーロッパ", romaji: "yooroppa", meaning: "Europe", category: "Countries", pronunciation: "/joːɾoppa/" },
  
  // Miscellaneous
  { id: "lw-65", word: "アイデア", romaji: "aidea", meaning: "idea", category: "General", pronunciation: "/aidea/" },
  { id: "lw-66", word: "レポート", romaji: "repooto", meaning: "report", category: "General", pronunciation: "/ɾepoːto/" },
  { id: "lw-67", word: "テスト", romaji: "tesuto", meaning: "test", category: "Education", pronunciation: "/tesɯto/" },
  { id: "lw-68", word: "クラス", romaji: "kurasu", meaning: "class", category: "Education", pronunciation: "/kɯɾasɯ/" },
  { id: "lw-69", word: "先生", romaji: "sensei", meaning: "teacher (honorific)", category: "Education", pronunciation: "/seNseː/" },
  { id: "lw-70", word: "生徒", romaji: "seito", meaning: "student", category: "Education", pronunciation: "/seːto/" },
];

export const katakanaLoanwordsLesson = {
  id: "katakana-loanwords",
  title: "Katakana Loanwords",
  subtitle: "Foreign Words in Japanese",
  description: "Learn common loanwords (外 来語) borrowed from foreign languages and written in Katakana.",
  totalCharacters: 70,
  difficulty: 2,
  estimatedTime: 40,
  loanwords: katakanaLoanwords,
  color: "from-amber-400 to-orange-500",
};

export default katakanaLoanwords;
