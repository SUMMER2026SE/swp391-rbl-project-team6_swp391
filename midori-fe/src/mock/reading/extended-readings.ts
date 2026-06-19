// ─── Extended Reading Data with Vocabulary and Grammar ──────────────────────────────────

import type { ReadingItem, JLPTLevel } from "../types/content-library";

// Extended Reading Item with vocabulary and grammar
export interface ExtendedReadingItem extends ReadingItem {
  vocabulary: VocabularyItem[];
  grammarPoints: GrammarPoint[];
  romaji?: string;
  translation?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
}

export interface GrammarPoint {
  grammar: string;
  explanation: string;
  example: string;
  exampleTranslation: string;
}

// ─── JLPT N5 Readings (20 lessons) ─────────────────────────────────────────────

export const n5Readings: ExtendedReadingItem[] = [
  // 1. Self Introduction
  {
    id: "read-n5-001",
    title: "自己しょうかい - Self Introduction",
    passageText: `はじめまして。田中あおいと言います。十八歳です。
東京都の出身です。今は大学的日本語を勉强しています。
趣味は切手の収集です。週末に友達と集まります。
どうぞよろしくお願いいします。`,
    romaji: `Hajimemashite. Tanaka Aoi to iimasu. Juuhassai desu.
Toukyouto no shusshin desu. Ima wa daigaku de nihongo wo benkyou shiteimasu.
Shumi wa kitte no shuushuu desu. Shuumaatsu ni tomodachi to atumarimasu.
Douzo yoroshiku onegaishimasu.`,
    translation: `Nice to meet you. My name is Tanaka Aoi. I am 18 years old.
I am from Tokyo. Currently, I am studying Japanese at university.
My hobby is collecting stamps. On weekends, I meet with friends.
Nice to meet you.`,
    vocabulary: [
      { word: "自己しょうかい", reading: "じこしょうかい", meaning: "self introduction", partOfSpeech: "noun" },
      { word: "出身", reading: "しゅっしん", meaning: "place of origin", partOfSpeech: "noun" },
      { word: "大学", reading: "だいがく", meaning: "university/college", partOfSpeech: "noun" },
      { word: "勉强", reading: "べんきょう", meaning: "study", partOfSpeech: "noun/verb" },
      { word: "趣味", reading: "しゅみ", meaning: "hobby", partOfSpeech: "noun" },
      { word: "切手", reading: "きって", meaning: "postage stamp", partOfSpeech: "noun" },
      { word: "収集", reading: "しゅうしゅう", meaning: "collection", partOfSpeech: "noun" },
      { word: "週末", reading: "しゅうまつ", meaning: "weekend", partOfSpeech: "noun" },
      { word: "友達", reading: "ともだち", meaning: "friend", partOfSpeech: "noun" },
      { word: "集的", reading: "あつまる", meaning: "to gather/to meet", partOfSpeech: "verb" },
    ],
    grammarPoints: [
      { grammar: "~です", explanation: "Polite sentence ending for stating facts", example: "十八歳です", exampleTranslation: "I am 18 years old" },
      { grammar: "~ています", explanation: "Present continuous action", example: "日本語を勉强しています", exampleTranslation: "I am studying Japanese" },
      { grammar: "~てください", explanation: "Polite request", example: "よろしくお願いいします", exampleTranslation: "Please (treat me well)" },
    ],
    comprehensionQuestions: [
      { id: "rq-001-1", question: "田中さんの趣味は何ですか？", options: ["読書", "切手の収集", "散歩", "料理"], correctAnswer: 1, explanation: "趣味は切手の収集です。" },
      { id: "rq-001-2", question: "田中さんはどこに出身ですか？", options: ["大阪", "京都", "東京都", "广州"], correctAnswer: 2, explanation: "東京都の出身です。" },
      { id: "rq-001-3", question: "週末に田中さんは何をしますか？", options: ["一人で勉強する", "友達と集まる", "家族と旅行する", "働く"], correctAnswer: 1, explanation: "週末に友達と集まります。" },
    ],
    jlptLevel: "N5",
    tags: ["introduction", "self-introduction", "basic"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },

  // 2. School Life
  {
    id: "read-n5-002",
    title: "がっこうの生活 - School Life",
    passageText: `私は毎朝七時に起きます。八時にがっこうに行きます。
授業は九時に始まります。午前は四時間勉强します。
昼ご飯は十二時に食べます。放課後は部活があります。
火曜日は日本語のClaireがあります。水曜日は数学があります。
がっこうは六時までです。回家后、宿題をします。`,
    romaji: `Watashi wa maiasa shichiji ni okimasu. hachiji ni gakkou ni ikimasu.
Jugyou wa kuji ni hajimarimasu. Gozen wa yojikan benkyou shimasu.
Hirugohan wa juniniji ni tabemasu. Houkago wa bukatsu ga arimasu.
Kayoubi wa nihongo no kurasu ga arimasu. Suiyoubi wa suugaku ga arimasu.
Gakkou wa rokuji made desu. Kaeru ato, shukudai wo shimasu.`,
    translation: `I wake up at 7 every morning. I go to school at 8.
Classes start at 9. I study for 4 hours in the morning.
I eat lunch at 12. After school, there is club activities.
On Tuesday, there is Japanese class. On Wednesday, there is math.
School is until 6. After coming home, I do homework.`,
    vocabulary: [
      { word: "授業", reading: "じゅぎょう", meaning: "class/lesson", partOfSpeech: "noun" },
      { word: "午前", reading: "ごぜん", meaning: "morning/AM", partOfSpeech: "noun" },
      { word: "昼ご飯", reading: "ひるごはん", meaning: "lunch", partOfSpeech: "noun" },
      { word: "放課後", reading: "ほうかご", meaning: "after school", partOfSpeech: "noun" },
      { word: "部活", reading: "ぶかつ", meaning: "club activities", partOfSpeech: "noun" },
      { word: "数学", reading: "すうがく", meaning: "mathematics", partOfSpeech: "noun" },
      { word: "宿題", reading: "しゅくだい", meaning: "homework", partOfSpeech: "noun" },
      { word: "始まる", reading: "はじまる", meaning: "to begin", partOfSpeech: "verb" },
      { word: "帰る", reading: "かえる", meaning: "to return home", partOfSpeech: "verb" },
      { word: "する", reading: "する", meaning: "to do", partOfSpeech: "verb" },
    ],
    grammarPoints: [
      { grammar: "~に(時間)", explanation: "At a specific time point", example: "七時に起きます", exampleTranslation: "I wake up at 7" },
      { grammar: "~に行きます", explanation: "Go to (place) to (do something)", example: "がっこうに行きます", exampleTranslation: "I go to school" },
      { grammar: "~後", explanation: "After doing something", example: "帰る後、宿題をします", exampleTranslation: "After returning, I do homework" },
    ],
    comprehensionQuestions: [
      { id: "rq-002-1", question: "授業はいつ始まりますか？", options: ["七時", "八時", "九時", "六時"], correctAnswer: 2, explanation: "授業は九時に始まります。" },
      { id: "rq-002-2", question: "火曜日に何がありますか？", options: ["数学", "日本語", "英語", "理科"], correctAnswer: 1, explanation: "火曜日は日本語のClaireがあります。" },
      { id: "rq-002-3", question: "放課後干什么？", options: ["回家", "部活", "旅行", "買い物"], correctAnswer: 1, explanation: "放課後は部活があります。" },
    ],
    jlptLevel: "N5",
    tags: ["school", "daily-life", "schedule"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-02",
    updatedAt: "2024-01-02",
  },

  // 3. Family
  {
    id: "read-n5-003",
    title: "かぞく - My Family",
    passageText: `私の家族は四人です。父と母と妹がいます。
父は会社の社长です。每日忙しく働いています。
母は医院的护士です。夜も働きます。
妹は十七歳で、高校生です。足が速いです。
私は家族が一番大切だと思います。`,
    romaji: `Watashi no kazoku wa yonin desu. Chichi to haha to imouto ga imasu.
Chichi wa kaisha no shachou desu. Mainichi isogashiku hataraiteimasu.
Haha wa byouin no kangofu desu. Yoru mo hataraki masu.
Imouto wa juunanasai de, koukousei desu. Ashi ga hayai desu.
Watashi wa kazoku ga ichiban taisetsu da to omoimasu.`,
    translation: `My family has four people. I have a father, mother, and younger sister.
My father is a company president. He works hard every day.
My mother is a nurse at a hospital. She works at night too.
My sister is 17 and a high school student. She is fast runner.
I think family is the most important thing.`,
    vocabulary: [
      { word: "家族", reading: "かぞく", meaning: "family", partOfSpeech: "noun" },
      { word: "父", reading: "ちち", meaning: "father", partOfSpeech: "noun" },
      { word: "母", reading: "はは", meaning: "mother", partOfSpeech: "noun" },
      { word: "妹", reading: "いもうと", meaning: "younger sister", partOfSpeech: "noun" },
      { word: "社長", reading: "しゃちょう", meaning: "company president", partOfSpeech: "noun" },
      { word: "护士", reading: "かんごふ", meaning: "nurse", partOfSpeech: "noun" },
      { word: "高校生", reading: "こうこうせい", meaning: "high school student", partOfSpeech: "noun" },
      { word: "大切", reading: "たいせつ", meaning: "important", partOfSpeech: "adjective" },
      { word: "速い", reading: "はやい", meaning: "fast/quick", partOfSpeech: "adjective" },
      { word: "思う", reading: "おもう", meaning: "to think", partOfSpeech: "verb" },
    ],
    grammarPoints: [
      { grammar: "~がいます", explanation: "There exists (people/animals)", example: "父と母と妹がいます", exampleTranslation: "I have a father, mother, and sister" },
      { grammar: "~で一番~", explanation: "The most ~ in...", example: "家族が一番大切", exampleTranslation: "Family is the most important" },
      { grammar: "~と思います", explanation: "I think that...", example: "家族が一番大切だと思います", exampleTranslation: "I think family is the most important" },
    ],
    comprehensionQuestions: [
      { id: "rq-003-1", question: "家族の構成は几人ですか？", options: ["三人", "四人", "五人", "六人"], correctAnswer: 1, explanation: "私の家族は四人です。" },
      { id: "rq-003-2", question: "父は何をしていますか？", options: ["教師", "社長", "医者", "弁護士"], correctAnswer: 1, explanation: "父は会社の社长です。" },
      { id: "rq-003-3", question: "妹的特点是什么？", options: ["歌が上手", "足が速い", "料理が得意", "絵が上手"], correctAnswer: 1, explanation: "足が速いです。" },
    ],
    jlptLevel: "N5",
    tags: ["family", "daily-life", "description"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-03",
    updatedAt: "2024-01-03",
  },

  // 4. Daily Routine
  {
    id: "read-n5-004",
    title: "每日の一日 - My Daily Routine",
    passageText: `私は毎日同じRoutineを繰り返しています。
六時半に起きて、ラジオ体操をします。七時に朝ご飯を食べます。
その後、歯を磨いて、顔を洗います。八時に家を出ます。
会社までは電車で三十分かかります。
午後六時に퇴근して、七時半に家に着きます。
晚上軽く 운동して、十一時に寝ます。`,
    romaji: `Watashi wa mainichi onaji routine wo kurikaeshiteimasu.
Rokuji han ni okite, rajio taisou wo shimasu. Shichiji ni asagohan wo tabemasu.
Sono ato, ha wo migai te, kao wo araimasu. hachiji ni ie wo dasu.
Kaisha made wa densha de sanjuppun kakarimasu.
Gogo rokuji ni taishoku shite, shichiji han ni ie ni tsukimasu.
Yuugata karuku undou shite, juuichiji ni nemasu.`,
    translation: `I repeat the same routine every day.
I wake up at 6:30 and do radio exercises. I eat breakfast at 7.
After that, I brush my teeth and wash my face. I leave home at 8.
It takes 30 minutes by train to the company.
I finish work at 6 PM and arrive home at 7:30.
In the evening, I exercise lightly and go to sleep at 11.`,
    vocabulary: [
      { word: "毎日", reading: "まいにち", meaning: "every day", partOfSpeech: "noun" },
      { word: "体操", reading: "たいそう", meaning: "exercise/calisthenics", partOfSpeech: "noun" },
      { word: "磨く", reading: "みがく", meaning: "to brush/to polish", partOfSpeech: "verb" },
      { word: "洗", reading: "あら", meaning: "to wash", partOfSpeech: "verb" },
      { word: "電車", reading: "でんしゃ", meaning: "train", partOfSpeech: "noun" },
      { word: " 퇴근", reading: "たいきょく", meaning: "finish work", partOfSpeech: "noun/verb" },
      { word: "着く", reading: "つく", meaning: "to arrive", partOfSpeech: "verb" },
      { word: "晚上", reading: "よる", meaning: "evening/night", partOfSpeech: "noun" },
      { word: " 운동", reading: "うんどう", meaning: "exercise", partOfSpeech: "noun/verb" },
      { word: "寝る", reading: "ねる", meaning: "to sleep", partOfSpeech: "verb" },
    ],
    grammarPoints: [
      { grammar: "~てから", explanation: "After doing...", example: "起きてから、ラジオ体操をします", exampleTranslation: "After waking up, I do radio exercises" },
      { grammar: "~まで", explanation: "Until/to (a place)", example: "会社まで電車で三十分", exampleTranslation: "30 minutes by train to the company" },
      { grammar: "~てみる", explanation: "Try doing...", example: "軽く运动してみる", exampleTranslation: "Try exercising lightly" },
    ],
    comprehensionQuestions: [
      { id: "rq-004-1", question: "何時に家を出ますか？", options: ["六時半", "七時", "八時", "九時"], correctAnswer: 2, explanation: "八時に家を出ます。" },
      { id: "rq-004-2", question: "会社まで何でいきますか？", options: ["バス", "電車", "車", "歩いて"], correctAnswer: 1, explanation: "電車で三十分かかります。" },
      { id: "rq-004-3", question: "晚上干什么？", options: ["勉强", "運動", "買い物", "fera"], correctAnswer: 1, explanation: "晚上軽く运动して、十一時に寝ます。" },
    ],
    jlptLevel: "N5",
    tags: ["daily-routine", "schedule", "time"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-04",
    updatedAt: "2024-01-04",
  },

  // 5. Shopping
  {
    id: "read-n5-005",
    title: "買い物 - Shopping",
    passageText: `今日は友達と一緒にShoppingに行きました。
デパートで新しい靴を買いました。三万円でした。
その後、 카페でCoffeeを飲みました。咖啡很贵 but delicious.
超市で食材も買いました。的水果很新鲜.
全部で五千円使いました。`,
    romaji: `Kyou wa tomodachi to issho ni shoppingu ni ikimashita.
Depaato de atarashii kutsu wo kaimashita. Sanmanen deshita.
Sono ato, cafe de coffee wo nondimashita.
Supa de shokuzai mo kaimashita.
Zenbu de gosenen tsukaimashita.`,
    translation: `Today I went shopping with my friend.
I bought new shoes at the department store. It was 30,000 yen.
After that, I drank coffee at a cafe.
I also bought ingredients at the supermarket.
I spent 5,000 yen in total.`,
    vocabulary: [
      { word: "買い物", reading: "かいもの", meaning: "shopping", partOfSpeech: "noun" },
      { word: "友達", reading: "ともだち", meaning: "friend", partOfSpeech: "noun" },
      { word: "デパート", reading: "デパート", meaning: "department store", partOfSpeech: "noun" },
      { word: "靴", reading: "くつ", meaning: "shoes", partOfSpeech: "noun" },
      { word: "買う", reading: "かう", meaning: "to buy", partOfSpeech: "verb" },
      { word: "カフェ", reading: "カフェ", meaning: "cafe", partOfSpeech: "noun" },
      { word: "超市", reading: "スーパーで", meaning: "supermarket", partOfSpeech: "noun" },
      { word: "食材", reading: "しょくざい", meaning: "food ingredients", partOfSpeech: "noun" },
      { word: "使う", reading: "つかう", meaning: "to use/to spend", partOfSpeech: "verb" },
      { word: "全部", reading: "ぜんぶ", meaning: "all/total", partOfSpeech: "noun/adverb" },
    ],
    grammarPoints: [
      { grammar: "~円と~円", explanation: "Stating prices", example: "三万円でした", exampleTranslation: "It was 30,000 yen" },
      { grammar: "~で~も", explanation: "Also...at (place)", example: "デパートで靴を買いました", exampleTranslation: "Bought shoes at the department store" },
      { grammar: "全部で~", explanation: "In total...", example: "全部で五千円", exampleTranslation: "5,000 yen in total" },
    ],
    comprehensionQuestions: [
      { id: "rq-005-1", question: "靴はいくらでしたか？", options: ["五万円", "三万円", "一万円", "三千円"], correctAnswer: 1, explanation: "三万円でした。" },
      { id: "rq-005-2", question: "全部でいくら使いましたか？", options: ["三万円", "一万円", "五千円", "八千円"], correctAnswer: 2, explanation: "全部で五千円使いました。" },
      { id: "rq-005-3", question: "谁と買い物に行きましたか？", options: ["家族と", "友達と", "一人で", "先生と"], correctAnswer: 1, explanation: "今日は友達と一緒にShoppingに行きました。" },
    ],
    jlptLevel: "N5",
    tags: ["shopping", "daily-life", "money"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-05",
    updatedAt: "2024-01-05",
  },

  // 6. Restaurant
  {
    id: "read-n5-006",
    title: "レストランで - At the Restaurant",
    passageText: `今晚友達と意大利餐厅吃饭。
服务员问：「何にしますか？」
我点了意大利面和朋友点了披萨。
这家店的料理很好吃，下次还想来。`,
    romaji: `Konban tomodachi to ristorante de tabemashita.
Supaisu wa "Nani ni shimasu ka?" to kiimashita.
Watashi wa supageti wo, tomodachi wa pizza wo chuumon shimashita.
Kono mise no ryouri ga oishii desu, raigetsu moikitai desu.`,
    translation: `Tonight I ate at an Italian restaurant with my friend.
The waiter asked: "What will you have?"
I ordered spaghetti and my friend ordered pizza.
The food at this restaurant is delicious, I want to come again next time too.`,
    vocabulary: [
      { word: "今晚", reading: "こんばん", meaning: "tonight", partOfSpeech: "noun" },
      { word: "レストラン", reading: "レストラン", meaning: "restaurant", partOfSpeech: "noun" },
      { word: "服务员", reading: "スタッフ", meaning: "staff/waiter", partOfSpeech: "noun" },
      { word: "意大利面", reading: "スパゲティ", meaning: "spaghetti", partOfSpeech: "noun" },
      { word: "披萨", reading: "ピザ", meaning: "pizza", partOfSpeech: "noun" },
      { word: "注文", reading: "ちゅうもん", meaning: "order", partOfSpeech: "noun/verb" },
      { word: "料理", reading: "りょうり", meaning: "cooking/food/dishes", partOfSpeech: "noun" },
      { word: "美味しい", reading: "おいしい", meaning: "delicious", partOfSpeech: "adjective" },
      { word: "次", reading: "つぎ", meaning: "next", partOfSpeech: "noun" },
      { word: "来たい", reading: "きたい", meaning: "want to come", partOfSpeech: "verb" },
    ],
    grammarPoints: [
      { grammar: "~と~", explanation: "With (person)", example: "友達とレストランに行きます", exampleTranslation: "I go to a restaurant with my friend" },
      { grammar: "~にします", explanation: "I'll have/~ will be", example: "何にしますか", exampleTranslation: "What will you have?" },
      { grammar: "~たいです", explanation: "Want to (verb)", example: "来たいです", exampleTranslation: "I want to come" },
    ],
    comprehensionQuestions: [
      { id: "rq-006-1", question: "著者は何を注文しましたか？", options: ["ピザ", "意大利面", "カレー", "ラーメン"], correctAnswer: 1, explanation: "Watashi wa supageti wo chuumon shimashita." },
      { id: "rq-006-2", question: "友達は何を注文しましたか？", options: ["意大利面", "披萨", "カレー", "定食"], correctAnswer: 1, explanation: "Tomodachi wa pizza wo chuumon shimashita." },
      { id: "rq-006-3", question: "著者は还想来这里吗？", options: ["不想", "无所谓", "很想", "不知道"], correctAnswer: 2, explanation: "下次还想来。(Raigetsu moikitai desu.)" },
    ],
    jlptLevel: "N5",
    tags: ["restaurant", "food", "dining"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-06",
    updatedAt: "2024-01-06",
  },

  // 7. Weather
  {
    id: "read-n5-007",
    title: "今日の天気 - Today's Weather",
    passageText: `今日の東京の天気予報です。
今日は晴れで、最高気温は二十八度です。
湿度も高く、ちょっと蒸し暑いです。
明日は雨が降る見込みです。
週間后半は凉しくなるそうです。`,
    romaji: `Kyou no Toukyou no tenki yohou desu.
Kyou wa hare de, saikou kion wa nijuuhachi do desu.
Shitsudo mo takaku, chotto mushiatsui desu.
Ashita wa ame ga furu mikomi desu.
Shuukan kouhan wa suzushiku naru sou desu.`,
    translation: `Today's weather forecast for Tokyo.
Today is sunny with a high of 28 degrees.
Humidity is also high, making it a bit muggy.
Rain is expected tomorrow.
It seems it will become cooler in the latter half of the week.`,
    vocabulary: [
      { word: "天気予報", reading: "てんきよほう", meaning: "weather forecast", partOfSpeech: "noun" },
      { word: "晴れ", reading: "はれ", meaning: "clear/sunny weather", partOfSpeech: "noun" },
      { word: "最高気温", reading: "さいこうきおん", meaning: "highest temperature", partOfSpeech: "noun" },
      { word: "湿度", reading: "しつど", meaning: "humidity", partOfSpeech: "noun" },
      { word: "蒸し暑い", reading: "むしあつい", meaning: "muggy/sticky hot", partOfSpeech: "adjective" },
      { word: "雨", reading: "あめ", meaning: "rain", partOfSpeech: "noun" },
      { word: "降る", reading: "ふる", meaning: "to fall/to precipitate", partOfSpeech: "verb" },
      { word: "凉的", reading: "すずしい", meaning: "cool/refreshing", partOfSpeech: "adjective" },
      { word: "週間", reading: "しゅうかん", meaning: "week", partOfSpeech: "noun" },
      { word: "后半", reading: "こうはん", meaning: "second half/latter half", partOfSpeech: "noun" },
    ],
    grammarPoints: [
      { grammar: "~そうです", explanation: "I heard that~/apparently", example: "凉しくなるそうです", exampleTranslation: "I heard it will become cool" },
      { grammar: "~見込みです", explanation: "Expected to...", example: "雨が降る見込みです", exampleTranslation: "Rain is expected" },
      { grammar: "~度です", explanation: "Degree (temperature)", example: "二十八度です", exampleTranslation: "It is 28 degrees" },
    ],
    comprehensionQuestions: [
      { id: "rq-007-1", question: "今日の天気は何ですか？", options: ["雨", "曇り", "晴れ", "雪"], correctAnswer: 2, explanation: "今日は晴れです。" },
      { id: "rq-007-2", question: "最高気温は喉度ですか？", options: ["十八度", "二十八度", "三十八度", "八度"], correctAnswer: 1, explanation: "最高気温は二十八度です。" },
      { id: "rq-007-3", question: "明後日の天気はどうですか？", options: ["晴れ", "雪", "雨", "曇り"], correctAnswer: 2, explanation: "明日は雨が降る見込みです。" },
    ],
    jlptLevel: "N5",
    tags: ["weather", "forecast", "nature"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-07",
    updatedAt: "2024-01-07",
  },

  // 8. Travel
  {
    id: "read-n5-008",
    title: "旅行の計画 - Travel Plans",
    passageText: `来月京都へ旅行に行くつもりです。
新幹線で行く予定ですが、飞机也可以。
三日間の旅程を計画しています。
初日は清水寺を訪れます。
二日目は奈良を見物です。
三日目は大阪で购物和三 맛집 탐방です。`,
    romaji: `Raigetsu Kyouto e ryokou ni iku tsumori desu.
Shinkansen de iku yotei desu ga, fly kamoshirenai.
Mikka kan no ryokou wo keikaku shiteimasu.
Shonichi wa Kiyomizudera wo otazunemashita.
Futsukame wa Nara wo kaimotsu shimashita.
Mikukame wa Osaka de shopping to meshi tsubo tanbou desu.`,
    translation: `I plan to travel to Kyoto next month.
I plan to go by Shinkansen, but maybe by plane too.
I am planning a 3-day itinerary.
On the first day, I will visit Kiyomizu-dera temple.
On the second day, I will sightsee in Nara.
On the third day, I will go shopping and explore local restaurants in Osaka.`,
    vocabulary: [
      { word: "旅行", reading: "りょこう", meaning: "travel/trip", partOfSpeech: "noun" },
      { word: "新幹線", reading: "しんかんせん", meaning: "Shinkansen/bullet train", partOfSpeech: "noun" },
      { word: "旅程", reading: "りょてい", meaning: "itinerary", partOfSpeech: "noun" },
      { word: "計画", reading: "けいかく", meaning: "plan", partOfSpeech: "noun/verb" },
      { word: "訪ねる", reading: "おとずれる", meaning: "to visit", partOfSpeech: "verb" },
      { word: "見物", reading: "けんぶつ", meaning: "sightseeing", partOfSpeech: "noun" },
      { word: "购物", reading: "ショッピング", meaning: "shopping", partOfSpeech: "noun" },
      { word: "美食", reading: "びしょく", meaning: "gourmet food", partOfSpeech: "noun" },
      { word: "探訪", reading: "たんぼう", meaning: "exploration", partOfSpeech: "noun" },
      { word: "つもり", reading: "つもり", meaning: "intention/plan", partOfSpeech: "expression" },
    ],
    grammarPoints: [
      { grammar: "~つもりです", explanation: "Intend to~/planning to~", example: "旅行に行くつもりです", exampleTranslation: "I plan to go on a trip" },
      { grammar: "~予定です", explanation: "Scheduled to~/planned to~", example: "新幹線で行く予定です", exampleTranslation: "I am scheduled to go by Shinkansen" },
      { grammar: "~也很好", explanation: "Can also~/might also~", example: "飞机也可以", exampleTranslation: "Plane might work too" },
    ],
    comprehensionQuestions: [
      { id: "rq-008-1", question: "旅行は去哪里？", options: ["東京", "大阪", "京都", "奈良"], correctAnswer: 2, explanation: "来月京都へ旅行に行くつもりです。" },
      { id: "rq-008-2", question: "旅程は何日間ですか？", options: ["二日", "三日", "四日", "五日"], correctAnswer: 1, explanation: "三日間の旅程を計画しています。" },
      { id: "rq-008-3", question: "初日に去哪里？", options: ["奈良", "大阪", "清水寺", "東京"], correctAnswer: 2, explanation: "初日は清水寺を訪れます。" },
    ],
    jlptLevel: "N5",
    tags: ["travel", "plan", "sightseeing"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-08",
    updatedAt: "2024-01-08",
  },

  // 9. Hobbies
  {
    id: "read-n5-009",
    title: "趣味と特技 - Hobbies and Skills",
    passageText: `私の趣味は摄影とCookです。
周末，我喜欢带着相机去公园拍照。
料理も好きで时常做日本料理。
寿司と天ぷらが特に得意です。
これらの趣味を通じて、多くのfriendを作りました。`,
    romaji: `Watashi no shumi wa shashin to ryouri desu.
Shuumaatsu wa kamera wo motte kouen e iku.
Ryori mo suki de tokidoki nihon ryouri wo shimasu.
Sushi to tempura ga tokuni tokui desu.
Korera no shumi wo tsuhajishite, ooku no tomodachi wo tsukurimashita.`,
    translation: `My hobbies are photography and cooking.
On weekends, I like to take my camera to the park to take photos.
I also like cooking and often make Japanese food.
I am especially good at sushi and tempura.
Through these hobbies, I have made many friends.`,
    vocabulary: [
      { word: "趣味", reading: "しゅみ", meaning: "hobby", partOfSpeech: "noun" },
      { word: "摄影", reading: "しゃしん", meaning: "photography", partOfSpeech: "noun" },
      { word: "料理", reading: "りょうり", meaning: "cooking", partOfSpeech: "noun/verb" },
      { word: "相机", reading: "カメラ", meaning: "camera", partOfSpeech: "noun" },
      { word: "公園", reading: "こうえん", meaning: "park", partOfSpeech: "noun" },
      { word: "寿司", reading: "すし", meaning: "sushi", partOfSpeech: "noun" },
      { word: "天ぷら", reading: "てんぷら", meaning: "tempura", partOfSpeech: "noun" },
      { word: "特に", reading: "とくにな", meaning: "especially", partOfSpeech: "adverb" },
      { word: "得意", reading: "とくい", meaning: "good at/strong point", partOfSpeech: "adjective/noun" },
      { word: "通じて", reading: "つうじて", meaning: "through/via", partOfSpeech: "prep/verb" },
    ],
    grammarPoints: [
      { grammar: "~ особенно", explanation: "Especially~", example: "寿司と天ぷらが特に得意です", exampleTranslation: "I'm especially good at sushi and tempura" },
      { grammar: "~を通じて", explanation: "Through~/via~", example: "趣味を通じて友達を作った", exampleTranslation: "Made friends through hobbies" },
      { grammar: "~も~です", explanation: "~also is~", example: "料理も好きです", exampleTranslation: "I also like cooking" },
    ],
    comprehensionQuestions: [
      { id: "rq-009-1", question: "著者の趣味は何ですか？", options: ["読書と運動", "摄影と料理", "音楽と絵", "旅行と购物"], correctAnswer: 1, explanation: "私の趣味は摄影とCookです。" },
      { id: "rq-009-2", question: "周末做什么？", options: ["在家睡觉", "带着相机去公园拍照", "去旅行", "打工"], correctAnswer: 1, explanation: "周末，我喜欢带着相机去公园拍照。" },
      { id: "rq-009-3", question: "著者は何が得意ですか？", options: ["拉面和饺子", "寿司和天妇罗", "咖喱和炒饭", "汉堡和薯条"], correctAnswer: 1, explanation: "寿司と天ぷらが特に得意です。" },
    ],
    jlptLevel: "N5",
    tags: ["hobbies", "photography", "cooking"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-09",
    updatedAt: "2024-01-09",
  },

  // 10. Work
  {
    id: "read-n5-010",
    title: "私の仕事 - My Job",
    passageText: `私はIT 회사에서 일합니다。
每朝九時に出社して、下午六時に退社します。
主な業務はプログラム开发です。
英语と日本語を使って仕事をします。
今は新しい 프로젝트를 진행 중입니다。
忙しですが、内容は面白です。`,
    romaji: `Watashi wa IT kaisha de hataraki masu.
Maiasa kuji ni shussha shite, gogo rokuji ni taisha shimasu.
Omona gimu wa puroguramu kaihatsu desu.
Eigo to nihongo wo tsukatte shigoto wo shimasu.
Ima wa atarashii purojekuto wo shin Eichou desu.
Isogashii desu ga, naiyou wa omoshiroi desu.`,
    translation: `I work at an IT company.
I leave for work at 9 AM and leave the office at 6 PM.
My main job is program development.
I use English and Japanese to do my work.
I am currently working on a new project.
I'm busy, but the work is interesting.`,
    vocabulary: [
      { word: "IT会社", reading: "アイティかいしゃ", meaning: "IT company", partOfSpeech: "noun" },
      { word: "出社", reading: "しゅっしゃ", meaning: "arrival at office", partOfSpeech: "noun/verb" },
      { word: "退社", reading: "たいしゃ", meaning: "leaving the office", partOfSpeech: "noun/verb" },
      { word: "業務", reading: "ぎょうむ", meaning: "business/task/work", partOfSpeech: "noun" },
      { word: "開発", reading: "かいはつ", meaning: "development", partOfSpeech: "noun" },
      { word: "英語", reading: "えいご", meaning: "English (language)", partOfSpeech: "noun" },
      { word: "日本語", reading: "にほんご", meaning: "Japanese (language)", partOfSpeech: "noun" },
      { word: "プロジェクト", reading: "プロジェクト", meaning: "project", partOfSpeech: "noun" },
      { word: "忙しい", reading: "いそがしい", meaning: "busy", partOfSpeech: "adjective" },
      { word: "面白い", reading: "おもしろい", meaning: "interesting", partOfSpeech: "adjective" },
    ],
    grammarPoints: [
      { grammar: "~ています", explanation: "Currently doing~ (progressive)", example: "新しい 프로젝트를 진행 중입니다", exampleTranslation: "I am currently working on a new project" },
      { grammar: "~ですが、~", explanation: "~but~/although~", example: "忙しいですが、面白いです", exampleTranslation: "I'm busy, but it's interesting" },
      { grammar: "~を使って", explanation: "Using~", example: "日本語を使って仕事をします", exampleTranslation: "I work using Japanese" },
    ],
    comprehensionQuestions: [
      { id: "rq-010-1", question: "著者はどこでしていますか？", options: ["学校", "IT会社", "医院", "银行"], correctAnswer: 1, explanation: "私はIT 회사에서 일합니다。" },
      { id: "rq-010-2", question: "主な業務は何ですか？", options: ["翻訳", "営業", "程序开发", "设计"], correctAnswer: 2, explanation: "主な業務はプログラム开发です。" },
      { id: "rq-010-3", question: "今何をしていますか？", options: ["旅游", "学习", "新しい 프로젝트를 진행 중", "休息"], correctAnswer: 2, explanation: "今は新しい 프로젝트를 진행 중입니다。" },
    ],
    jlptLevel: "N5",
    tags: ["work", "job", "business"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10",
  },

  // 11. Transportation
  {
    id: "read-n5-011",
    title: "交通手段 - Transportation",
    passageText: `私は每天都坐電車上班。
家から駅まで歩いて五分钟です。
快速電車に乗ると、三十分で着きます。
遅刻しそうな時は、タクシーを利用します。
週末は有时骑车去超市买东西。`,
    romaji: `Watashi wa mainichi densha de tsugyou shimasu.
Ie kara eki made aruite gofun desu.
Kaisoku densha ni noru to, sanjuppun de tsukimasu.
Chikokushisou na toki wa, takushii wo riyou shimasu.
Shuumaatsu wa toki dok tokai de supa made ikimasu.`,
    translation: `I commute by train every day.
It's a 5-minute walk from my house to the station.
If I take the express train, I arrive in 30 minutes.
When I'm about to be late, I use a taxi.
On weekends, I sometimes ride my bike to the supermarket.`,
    vocabulary: [
      { word: "交通手段", reading: "こうつうしゅだん", meaning: "means of transportation", partOfSpeech: "noun" },
      { word: "電車", reading: "でんしゃ", meaning: "train", partOfSpeech: "noun" },
      { word: "通勤", reading: "つうきん", meaning: "commuting", partOfSpeech: "noun/verb" },
      { word: "快速", reading: "かисoku", meaning: "rapid/express", partOfSpeech: "noun/adjective" },
      { word: "遅刻", reading: "ちこく", meaning: "being late", partOfSpeech: "noun/verb" },
      { word: "タクシー", reading: "タクシー", meaning: "taxi", partOfSpeech: "noun" },
      { word: "利用", reading: "りよう", meaning: "use/utilization", partOfSpeech: "noun/verb" },
      { word: "自転車", reading: "じてんしゃ", meaning: "bicycle/bike", partOfSpeech: "noun" },
      { word: "有时", reading: "有时候", meaning: "sometimes", partOfSpeech: "adverb" },
      { word: "超市", reading: "すーぱー", meaning: "supermarket", partOfSpeech: "noun" },
    ],
    grammarPoints: [
      { grammar: "~に~ます", explanation: "Taking~ (transport)", example: "電車に乗ります", exampleTranslation: "I take the train" },
      { grammar: "~そうな時", explanation: "When seems like~", example: "遅刻しそうな時", exampleTranslation: "When it looks like I'll be late" },
      { grammar: "~と~ます", explanation: "If/When~ then~", example: "快速に乗ると三十分で着きます", exampleTranslation: "If you take the express, you arrive in 30 minutes" },
    ],
    comprehensionQuestions: [
      { id: "rq-011-1", question: "著者は每天都怎么上班？", options: ["开车", "骑车", "坐電車", "走路"], correctAnswer: 2, explanation: "私は每天都坐電車上班。" },
      { id: "rq-011-2", question: "家から駅まで多长时间？", options: ["十分钟", "五分钟", "十五分钟", "二十分钟"], correctAnswer: 1, explanation: "家から駅まで歩いて五分钟です。" },
      { id: "rq-011-3", question: "遅刻しそうな時は怎么做？", options: ["早起きする", "タクシーを利用", "休む", "打电话"], correctAnswer: 1, explanation: "遅刻しそうな時は、タクシーを利用します。" },
    ],
    jlptLevel: "N5",
    tags: ["transportation", "commuting", "daily-life"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-11",
    updatedAt: "2024-01-11",
  },

  // 12. Time and Schedule
  {
    id: "read-n5-012",
    title: "時間管理与スケジュール - Time Management",
    passageText: `我的时间管理很重要。
每天早上六点半起床，晚上十一点睡觉。
上午主要用于工作或学习。
午休时间是一点到两点。
下班后去健身房锻炼。
周末安排学习日语或与朋友聚会。`,
    romaji: `Watashi no jikan kanri wa juuyou desu.
Mainichi asa rokuji han ni okimasu, banjuuichiji ni nemasu.
Gozen wa shigoto matawa benkyou ni tsukaimasu.
Hiruyasumi wa ichiji kara niji made desu.
Taishoku go kenkin ni ikimasu.
Shuumaatsu wa nihongo wo benkyou shita matsumodachi to atsumarimasu.`,
    translation: `Time management is important to me.
I wake up at 6:30 every morning and sleep at 11 PM.
I use mornings mainly for work or study.
Lunch break is from 1 to 2 PM.
After work, I go to the gym to exercise.
On weekends, I study Japanese or meet with friends.`,
    vocabulary: [
      { word: "時間管理", reading: "じかんかんり", meaning: "time management", partOfSpeech: "noun" },
      { word: "重要", reading: "じゅうよう", meaning: "important", partOfSpeech: "adjective" },
      { word: "午前", reading: "ごぜん", meaning: "morning/AM", partOfSpeech: "noun" },
      { word: "昼休み", reading: "ひるやすみ", meaning: "lunch break", partOfSpeech: "noun" },
      { word: "健身房", reading: "フィットネスクラブ", meaning: "fitness gym", partOfSpeech: "noun" },
      { word: "锻炼", reading: "くれたい", meaning: "exercise/training", partOfSpeech: "noun/verb" },
      { word: "周末", reading: "しゅうまつ", meaning: "weekend", partOfSpeech: "noun" },
      { word: "安排", reading: "はいち", meaning: "arrangement", partOfSpeech: "noun/verb" },
      { word: "聚会", reading: "しゅうかい", meaning: "meeting/gathering", partOfSpeech: "noun" },
      { word: "或者", reading: "あるい", meaning: "or", partOfSpeech: "conjunction" },
    ],
    grammarPoints: [
      { grammar: "~は~です", explanation: "As for~ it is~", example: "時間管理は重要です", exampleTranslation: "Time management is important" },
      { grammar: "~から~まで", explanation: "From~ to~", example: "一時から二時まで", exampleTranslation: "From 1 to 2" },
      { grammar: "~か~", explanation: "~or~", example: "勉强するか友達と集まる", exampleTranslation: "Study or meet with friends" },
    ],
    comprehensionQuestions: [
      { id: "rq-012-1", question: "著者は何時に起きますか？", options: ["六時", "六時半", "七時", "五時半"], correctAnswer: 1, explanation: "每天早上六点半起床。" },
      { id: "rq-012-2", question: "午休时间是几点到几点？", options: ["十二時から一時", "一時方から二時", "二時から三時", "十一時から十二時"], correctAnswer: 1, explanation: "午休时间是一点到两点。" },
      { id: "rq-012-3", question: "下班后去做什么？", options: ["回家", "去健身房锻炼", "图书馆", "购物"], correctAnswer: 1, explanation: "下班后去健身房锻炼。" },
    ],
    jlptLevel: "N5",
    tags: ["time", "schedule", "daily-life"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-12",
    updatedAt: "2024-01-12",
  },

  // 13. Health
  {
    id: "read-n5-013",
    title: "健康生活习惯 - Healthy Habits",
    passageText: `健康のために每早起いています。
每天喝八杯水。
蔬菜と果物を多く食べます。
每周去三次健身房。
十分な睡觉也很重要。
不熬夜，保持规律的生活节奏。`,
    romaji: `Kenkou no tame ni mainichi asa okite imasu.
Mainichi happai no mizu wo nomimasu.
Yasai to kudamono wo ooku tabemasu.
Shuu de sankai fitnesu ni ikimasu.
Juubun na suimin mo juuyou desu.
Yoru osoku neru koto wo shinai, houritsu teki na seikatsu shichou wo tamotsu.`,
    translation: `I wake up early every day for my health.
I drink 8 glasses of water daily.
I eat lots of vegetables and fruits.
I go to the gym three times a week.
Getting enough sleep is also important.
I don't stay up late, and maintain a regular lifestyle.`,
    vocabulary: [
      { word: "健康", reading: "けんこう", meaning: "health", partOfSpeech: "noun" },
      { word: "早起", reading: "はやおき", meaning: "early rising", partOfSpeech: "noun" },
      { word: "水", reading: "みず", meaning: "water", partOfSpeech: "noun" },
      { word: "野菜", reading: "やさい", meaning: "vegetables", partOfSpeech: "noun" },
      { word: "果物", reading: "くだもの", meaning: "fruits", partOfSpeech: "noun" },
      { word: "健身房", reading: "ジム", meaning: "gym", partOfSpeech: "noun" },
      { word: "十分な", reading: "じゅうぶんな", meaning: "sufficient/enough", partOfSpeech: "adjective" },
      { word: "睡觉", reading: "すいみん", meaning: "sleep", partOfSpeech: "noun" },
      { word: "熬夜", reading: "やきん", meaning: "staying up late", partOfSpeech: "noun/verb" },
      { word: "生活的节奏", reading: "リズム", meaning: "rhythm/pace", partOfSpeech: "noun" },
    ],
    grammarPoints: [
      { grammar: "~のために", explanation: "For the sake of~/for~", example: "健康のために", exampleTranslation: "For health" },
      { grammar: "~ことが~", explanation: "It is~ to~ (evaluating actions)", example: "十分な睡觉也很重要", exampleTranslation: "Getting enough sleep is also important" },
      { grammar: "~を~", explanation: "~and~ (listing)", example: "野菜と果物を多く食べます", exampleTranslation: "I eat lots of vegetables and fruits" },
    ],
    comprehensionQuestions: [
      { id: "rq-013-1", question: "著者每天喝多少水？", options: ["四杯", "六杯", "八杯", "十杯"], correctAnswer: 2, explanation: "每天喝八杯水。" },
      { id: "rq-013-2", question: "著者每周去几次健身房？", options: ["一回", "二回", "三回", "四回"], correctAnswer: 2, explanation: "每周去三次健身房。" },
      { id: "rq-013-3", question: "著者不做什么？", options: ["早起", "運動", "熬夜", "喝水"], correctAnswer: 2, explanation: "不熬夜，保持规律的生活节奏。" },
    ],
    jlptLevel: "N5",
    tags: ["health", "habits", "lifestyle"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-13",
    updatedAt: "2024-01-13",
  },

  // 14. Festival
  {
    id: "read-n5-014",
    title: "日本的节日 - Japanese Festivals",
    passageText: `日本には很多传统节日。
一月一日是新年，人们会去神社参拜。
三月三是女孩节，有女儿的家庭会摆放人偶。
五月五日是男孩节，有儿子的家庭会挂鲤鱼旗。
七月到八月有烟火大会和庙会。`,
    romaji: `Nihon niwa ooku no dentouteki na matsuri ga arimasu.
Ichigatsu tsuitachi wa Shinnen de, hitobito wa jinja ni sanpai ni ikimasu.
Sangatsu mikka wa Hina matsuri de, musume no katei wa hinakazari wo shimasu.
Gogatsu itsuka wa Kodomo no Hi de, musuko no katei wa koinobori wo kake masu.
Shichigatsu kara hachigatsu ni hanabi taikai to omatsuri ga arimasu.`,
    translation: `Japan has many traditional festivals.
January 1st is New Year, people go to shrines for worship.
March 3rd is Girls' Day, families with daughters display dolls.
May 5th is Boys' Day, families with sons fly carp streamers.
From July to August there are firework displays and festivals.`,
    vocabulary: [
      { word: "节日", reading: " Matsuri", meaning: "festival", partOfSpeech: "noun" },
      { word: "新年", reading: "しんねん", meaning: "New Year", partOfSpeech: "noun" },
      { word: "神社", reading: "じんじゃ", meaning: "shrine", partOfSpeech: "noun" },
      { word: "参拜", reading: "さんぱい", meaning: "worship/visit", partOfSpeech: "noun/verb" },
      { word: "女儿节", reading: "ひな祭り", meaning: "Girls' Day/Doll Festival", partOfSpeech: "noun" },
      { word: "人偶", reading: "ひなにんぎょう", meaning: "doll", partOfSpeech: "noun" },
      { word: "男孩节", reading: "こどもの日", meaning: "Children's Day/Boys' Day", partOfSpeech: "noun" },
      { word: "鲤鱼旗", reading: "こいのぼり", meaning: "carp streamers", partOfSpeech: "noun" },
      { word: "烟火", reading: "はなび", meaning: "fireworks", partOfSpeech: "noun" },
      { word: "庙会", reading: "お庙さん", meaning: "festival/bon festival", partOfSpeech: "noun" },
    ],
    grammarPoints: [
      { grammar: "~には~が~", explanation: "In~ there is~", example: "日本には节日があります", exampleTranslation: "In Japan there are festivals" },
      { grammar: "~の家庭は~", explanation: "Families with~", example: "娘の家庭は人形を飾ります", exampleTranslation: "Families with daughters display dolls" },
      { grammar: "~から~まで", explanation: "From~ to~", example: "七月者から八月まで", exampleTranslation: "From July to August" },
    ],
    comprehensionQuestions: [
      { id: "rq-014-1", question: "一月一日人们做什么？", options: ["看烟火", "去神社参拜", "挂鲤鱼旗", "摆放人偶"], correctAnswer: 1, explanation: "人们会去神社参拜。" },
      { id: "rq-014-2", question: "三月三日是什么节日？", options: ["新年", "女儿节", "男孩节", "孟兰盆节"], correctAnswer: 1, explanation: "三月三是女孩节。" },
      { id: "rq-014-3", question: "鲤鱼旗在什么时候挂？", options: ["一月", "三月", "五月", "七月"], correctAnswer: 2, explanation: "五月五日是男孩节，有儿子的家庭会挂鲤鱼旗。" },
    ],
    jlptLevel: "N5",
    tags: ["festival", "tradition", "culture"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-14",
    updatedAt: "2024-01-14",
  },

  // 15. Weekend Activities
  {
    id: "read-n5-015",
    title: "周末活动 - Weekend Activities",
    passageText: `周末我喜欢去咖啡馆读书。
有时候和朋友一起去看电影。
天气好的时候会去公园散步。
也会在家打扫房间或洗衣服。
周日晚上会为新的一周做准备。`,
    romaji: `Shuumaatsu wa kafe de dokusho wo suru koto ga suki desu.
Tokidoki tomodachi to eiga wo mi ni ikimasu.
Tenki ga yoi toki wa kouen wo sanpo shimasu.
Ie wo osouji shitatsumode wo shimasu.
Nichiyoubi no ban ni shuushuu no tame no junbi wo shimasu.`,
    translation: `On weekends I like reading at cafes.
Sometimes I go watch movies with friends.
When the weather is nice, I take walks in the park.
I also clean the house and do laundry at home.
On Sunday evenings, I prepare for the new week.`,
    vocabulary: [
      { word: "周末", reading: "しゅうまつ", meaning: "weekend", partOfSpeech: "noun" },
      { word: "咖啡馆", reading: "カフェ", meaning: "cafe", partOfSpeech: "noun" },
      { word: "読書", reading: "どくしょ", meaning: "reading", partOfSpeech: "noun" },
      { word: "映画", reading: "えいが", meaning: "movie/film", partOfSpeech: "noun" },
      { word: "散步", reading: "さんぽ", meaning: "walk/stroll", partOfSpeech: "noun/verb" },
      { word: "打扫", reading: "おそうじ", meaning: "cleaning", partOfSpeech: "noun/verb" },
      { word: "洗灌", reading: "せんたく", meaning: "laundry/washing", partOfSpeech: "noun/verb" },
      { word: "准备", reading: "じゅんび", meaning: "preparation", partOfSpeech: "noun/verb" },
      { word: "新的一周", reading: "しんしゅう", meaning: "new week", partOfSpeech: "noun" },
      { word: "天気", reading: "てんき", meaning: "weather", partOfSpeech: "noun" },
    ],
    grammarPoints: [
      { grammar: "~ことが~です", explanation: "Likes/dislikes doing~", example: "読書することが好きです", exampleTranslation: "I like reading" },
      { grammar: "~ 때は~", explanation: "When~/if~", example: "天気の日きは散步します", exampleTranslation: "When the weather is good, I walk" },
      { grammar: "~ために~", explanation: "In order to~/for~", example: "新年のために準備します", exampleTranslation: "I prepare for the new week" },
    ],
    comprehensionQuestions: [
      { id: "rq-015-1", question: "周末喜欢在哪里读书？", options: ["图书馆", "咖啡馆", "家里", "办公室"], correctAnswer: 1, explanation: "周末我喜欢去咖啡馆读书。" },
      { id: "rq-015-2", question: "天气好的时候会去做什么？", options: ["看电影", "去咖啡馆", "去公园散步", "在家打扫"], correctAnswer: 2, explanation: "天气好的时候会去公园散步。" },
      { id: "rq-015-3", question: "周日晚上会做什么？", options: ["出去玩", "睡觉", "为新一周做准备", "工作"], correctAnswer: 2, explanation: "周日晚上会为新的一周做准备。" },
    ],
    jlptLevel: "N5",
    tags: ["weekend", "activities", "lifestyle"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },

  // 16. Japanese Culture
  {
    id: "read-n5-016",
    title: "日本文化介绍 - Japanese Culture Introduction",
    passageText: `日本文化非常有特色。
茶道体现了一种宁静致远的精神。
花道展示了自然之美。
空手道和柔道是传统的武术。
和服是日本传统的服装。
这些文化都深受世界各国人民的喜爱。`,
    romaji: `Nihon bunka wa hijou ni tokushoku ga arimasu.
Sadou wa shizuka na seishin wo体現 shiteimasu.
Kadou wa shizen no bi wo shouji shiteimasu.
Karatedou to judou wa dentouteki na bujutsu desu.
Wafuku wa Nihon dentouteki na fukusou desu.
Korera no bunka wa sekai shokoku jinmin nozeki ni ai sareru shiteimasu.`,
    translation: `Japanese culture is very distinctive.
Tea ceremony embodies a spirit of tranquility and refinement.
Flower arrangement displays the beauty of nature.
Karate and judo are traditional martial arts.
Kimono is traditional Japanese clothing.
These cultures are deeply loved by people around the world.`,
    vocabulary: [
      { word: "文化", reading: "ぶんか", meaning: "culture", partOfSpeech: "noun" },
      { word: "特色", reading: "とくしょく", meaning: "characteristic/feature", partOfSpeech: "noun" },
      { word: "茶道", reading: "さどう", meaning: "tea ceremony", partOfSpeech: "noun" },
      { word: "花道", reading: "かどう", meaning: "flower arrangement/ikebana", partOfSpeech: "noun" },
      { word: "武术", reading: "ぶじゅつ", meaning: "martial arts", partOfSpeech: "noun" },
      { word: "空手道", reading: "からてどう", meaning: "karate", partOfSpeech: "noun" },
      { word: "柔道", reading: "じゅうどう", meaning: "judo", partOfSpeech: "noun" },
      { word: "和服", reading: "わふく", meaning: "Japanese clothing/kimono", partOfSpeech: "noun" },
      { word: "传统", reading: "でんとう", meaning: "tradition", partOfSpeech: "noun" },
      { word: "深受", reading: "ひとにざる", meaning: "deeply/by the people", partOfSpeech: "expression" },
    ],
    grammarPoints: [
      { grammar: "~非常有~", explanation: "Very much has the characteristic of~", example: "非常有特色", exampleTranslation: "Very distinctive" },
      { grammar: "~体现了~", explanation: "Embodies~/represents~", example: "体现了宁静致远的精神", exampleTranslation: "Embodies a spirit of tranquility" },
      { grammar: "~深受~喜爱", explanation: "Deeply loved by~", example: "深受世界各国人民的喜爱", exampleTranslation: "Deeply loved by people around the world" },
    ],
    comprehensionQuestions: [
      { id: "rq-016-1", question: "茶道体现了什么精神？", options: ["竞争", "宁静致远", "快速", "激烈"], correctAnswer: 1, explanation: "茶道体现了一种宁静致远的精神。" },
      { id: "rq-016-2", question: "空手道和柔道是什么？", options: ["舞蹈", "音乐", "传统武术", "绘画"], correctAnswer: 2, explanation: "空手道和柔道是传统的武术。" },
      { id: "rq-016-3", question: "这些文化被谁喜爱？", options: ["只有日本人", "世界各国人民", "只有亚洲人", "只有年轻人"], correctAnswer: 1, explanation: "这些文化都深受世界各国人民的喜爱。" },
    ],
    jlptLevel: "N5",
    tags: ["culture", "tradition", "Japan"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-16",
    updatedAt: "2024-01-16",
  },

  // 17. Classroom Conversation
  {
    id: "read-n5-017",
    title: "教室里的对话 - Classroom Conversation",
    passageText: `老师：今天的课文大家理解了吗？
学生：老师，有个地方不太明白。
老师：哪里不明白？请举手提问。
学生：第三段的语法有点难。
老师：好的，我们来详细讲解一下。`,
    romaji: `Sensei: Kyou no kyoukasho minna rikai shimashita ka?
Gakusei: Sensei, aru tokoro amari wakari mase n.
Sensei: Doko wake ku? Te wo agete toetsumon shite kudasai.
Gakusei: Dai san dan no bunpou ga attoku muzukashii desu.
Sensei: Hai, watashitachi wa saishou chotto setsumei shimasu.`,
    translation: `Teacher: Did everyone understand today's lesson?
Student: Teacher, there's a part I don't quite understand.
Teacher: Which part is unclear? Please raise your hand and ask.
Student: The grammar in the third paragraph is a bit difficult.
Teacher: Okay, let me explain it in detail.`,
    vocabulary: [
      { word: "老师", reading: "せんせい", meaning: "teacher", partOfSpeech: "noun" },
      { word: "学生", reading: "がくせい", meaning: "student", partOfSpeech: "noun" },
      { word: "课文", reading: "かきょう", meaning: "text/lesson content", partOfSpeech: "noun" },
      { word: "理解", reading: "りかい", meaning: "understanding", partOfSpeech: "noun/verb" },
      { word: "不明白", reading: "わからない", meaning: "don't understand", partOfSpeech: "expression" },
      { word: "举手", reading: "てをあげる", meaning: "raise hand", partOfSpeech: "expression" },
      { word: "提问", reading: "つもんでも", meaning: "question/ask", partOfSpeech: "noun/verb" },
      { word: "段落", reading: "だんらく", meaning: "paragraph", partOfSpeech: "noun" },
      { word: "语法", reading: "ぶんぽう", meaning: "grammar", partOfSpeech: "noun" },
      { word: "讲解", reading: "こうかい", meaning: "explanation", partOfSpeech: "noun/verb" },
    ],
    grammarPoints: [
      { grammar: "~ましたか？", explanation: "Past tense question", example: "理解しましたか", exampleTranslation: "Did you understand?" },
      { grammar: "~が~", explanation: "~but~/although~", example: "有个地方不太明白", exampleTranslation: "There's one part I don't quite understand" },
      { grammar: "~を~", explanation: "Direct object marker", example: "手を起こげてください", exampleTranslation: "Please raise your hand" },
    ],
    comprehensionQuestions: [
      { id: "rq-017-1", question: "老师问大家什么？", options: ["回家了", "理解了吗", "吃饭了吗", "睡觉了吗"], correctAnswer: 1, explanation: "今天的课文大家理解了吗？" },
      { id: "rq-017-2", question: "学生对老师的回答是什么？", options: ["都明白了", "有个地方不太明白", "完全不懂", "没有问题"], correctAnswer: 1, explanation: "老师，有个地方不太明白。" },
      { id: "rq-017-3", question: "学生说哪部分难？", options: ["第一段", "第二段", "第三段", "第四段"], correctAnswer: 2, explanation: "第三段的语法有点难。" },
    ],
    jlptLevel: "N5",
    tags: ["classroom", "conversation", "school"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-17",
    updatedAt: "2024-01-17",
  },

  // 18. Directions
  {
    id: "read-n5-018",
    title: "问路 - Asking for Directions",
    passageText: `A：すみません、駅はどこですか？
B：この道をまっすぐ行ってください。
二番目の交差点で右に曲がってください。
銀行の裏侧になります。
A：ありがとうございます。`,
    romaji: `A: Sumimasen, eki wa doko desu ka?
B: Kono michi wo massugu itte kudasai.
Nizaime no kousaten de migi ni magatte kudasai.
Ginkou no uragawa ni narimasu.
A: Arigatou gozaimasu.`,
    translation: `A: Excuse me, where is the station?
B: Go straight ahead on this road.
At the second intersection, turn right.
It will be behind the bank.
A: Thank you very much.`,
    vocabulary: [
      { word: "駅", reading: "えき", meaning: "station", partOfSpeech: "noun" },
      { word: "道", reading: "みち", meaning: "road/way", partOfSpeech: "noun" },
      { word: "まっすぐ", reading: "まっすぐ", meaning: "straight ahead", partOfSpeech: "adverb" },
      { word: "交差点", reading: "こうさてん", meaning: "intersection", partOfSpeech: "noun" },
      { word: "右", reading: "みぎ", meaning: "right", partOfSpeech: "noun/direction" },
      { word: "曲がる", reading: "まがる", meaning: "to turn", partOfSpeech: "verb" },
      { word: "銀行", reading: "ぎんこう", meaning: "bank", partOfSpeech: "noun" },
      { word: "裏侧", reading: "うらがわ", meaning: "back/rear side", partOfSpeech: "noun" },
      { word: "ありがとうございます", reading: "ありがとう", meaning: "thank you (polite)", partOfSpeech: "expression" },
      { word: "すみません", reading: "すみません", meaning: "excuse me/sorry", partOfSpeech: "expression" },
    ],
    grammarPoints: [
      { grammar: "~はどこですか？", explanation: "Where is~?", example: "駅はどこですか", exampleTranslation: "Where is the station?" },
      { grammar: "~てください", explanation: "Please do~", example: "まっすぐ行ってください", exampleTranslation: "Please go straight" },
      { grammar: "~で~", explanation: "At~ do~", example: "交差点で右に曲がる", exampleTranslation: "Turn right at the intersection" },
    ],
    comprehensionQuestions: [
      { id: "rq-018-1", question: "问路人要去哪里？", options: ["银行", "学校", "车站", "医院"], correctAnswer: 2, explanation: "A：すみません、駅はどこですか？" },
      { id: "rq-018-2", question: "应该在哪里转弯？", options: ["第一个路口", "第二个路口", "第三个路口", "不用转弯"], correctAnswer: 1, explanation: "二番目の交差点で右に曲がってください。" },
      { id: "rq-018-3", question: "车站在银行的哪一边？", options: ["前面", "右面", "左面", "里面"], correctAnswer: 3, explanation: "銀行の裏侧になります。" },
    ],
    jlptLevel: "N5",
    tags: ["directions", "asking-way", "practical"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-18",
    updatedAt: "2024-01-18",
  },

  // 19. Phone Conversation
  {
    id: "read-n5-019",
    title: "打电话 - Making a Phone Call",
    passageText: `A：もしもし、田中さんのお宅ですか？
B：はい、田中ですが。
A：山本さんと申しますが、明日の方向が変わりました。
B：そうですか。何時ですか？
A：午後の三時に変更になりました。`,
    romaji: `A: Moshi moshi, Tanaka san no otaku desu ka?
B: Hai, Tanaka desu ga.
A: Yamamoto san to moushi masu ga, ashita no yukisugi ga kawarimashita.
B: Sou desu ka? Nanji desu ka?
A: Gogo no sanji ni henkou ni narimashita.`,
    translation: `A: Hello, is this the Tanaka residence?
B: Yes, this is Tanaka speaking.
A: This is Yamamoto speaking. Tomorrow's schedule has changed.
B: I see. What time?
A: It has been changed to 3 PM in the afternoon.`,
    vocabulary: [
      { word: "もしもし", reading: "もしもし", meaning: "hello (on phone)", partOfSpeech: "expression" },
      { word: "お宅", reading: "おたく", meaning: "your home/residence", partOfSpeech: "noun" },
      { word: "申す", reading: "もうす", meaning: "to say/humble form of 言う", partOfSpeech: "verb" },
      { word: "明日", reading: "あした", meaning: "tomorrow", partOfSpeech: "noun" },
      { word: "方向", reading: "スケジュール", meaning: "schedule", partOfSpeech: "noun" },
      { word: "変わる", reading: "かわる", meaning: "to change", partOfSpeech: "verb" },
      { word: "変更", reading: "へんこう", meaning: "change/modification", partOfSpeech: "noun" },
      { word: "午後", reading: "ごご", meaning: "afternoon/PM", partOfSpeech: "noun" },
      { word: "三時", reading: "さんじ", meaning: "3 o'clock", partOfSpeech: "time" },
      { word: "ですが", reading: "ですが", meaning: "but/however (soft)", partOfSpeech: "conjunction" },
    ],
    grammarPoints: [
      { grammar: "~ですが", explanation: "This is~ (polite self-introduction on phone)", example: "田中ですが", exampleTranslation: "This is Tanaka" },
      { grammar: "~と申しますが", explanation: "I am~ (humble)", example: "山本さんと申しますが", exampleTranslation: "This is Yamamoto speaking" },
      { grammar: "~ようになりました", explanation: "Has become~/changed to~", example: "三時に変更になりました", exampleTranslation: "It has been changed to 3 PM" },
    ],
    comprehensionQuestions: [
      { id: "rq-019-1", question: "打电话的人是谁？", options: ["田中", "山本", "不知道", "老师"], correctAnswer: 1, explanation: "山本さんと申しますが。" },
      { id: "rq-019-2", question: "什么改变了？", options: ["日期", "时间", "明天的方向", "地点"], correctAnswer: 1, explanation: "明日の方向が変わりました。(Schedule changed)" },
      { id: "rq-019-3", question: "改成几点？", options: ["下午一点", "下午两点", "下午三点", "下午四点"], correctAnswer: 2, explanation: "午後の三時に変更になりました。" },
    ],
    jlptLevel: "N5",
    tags: ["phone", "conversation", "communication"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-19",
    updatedAt: "2024-01-19",
  },

  // 20. Simple News
  {
    id: "read-n5-020",
    title: "简单新闻 - Simple News",
    passageText: `今天的新闻。
天气：明天全国有雨。
交通：新干线出现延误。
经济：股价小幅上涨。
体育：日本队赢了比赛。`,
    romaji: `Kyou no nyuusu.
Tenki: Ashita zen kuni ni ame.
Koutsuu: Shinkansen ni engi.
Keizai: Kabuka shou haba agari masu.
Sports: Nihon tai kachi shimashita.`,
    translation: `Today's news.
Weather: Rain expected nationwide tomorrow.
Transportation: Shinkansen delays.
Economy: Stock prices rose slightly.
Sports: Japan team won the match.`,
    vocabulary: [
      { word: "新闻", reading: "ニュース", meaning: "news", partOfSpeech: "noun" },
      { word: "天气", reading: "てんき", meaning: "weather", partOfSpeech: "noun" },
      { word: "全国", reading: "ぜんこく", meaning: "nationwide/all over the country", partOfSpeech: "noun" },
      { word: "雨", reading: "あめ", meaning: "rain", partOfSpeech: "noun" },
      { word: "交通", reading: "こうつう", meaning: "transportation/traffic", partOfSpeech: "noun" },
      { word: "延误", reading: "えんき", meaning: "delay", partOfSpeech: "noun" },
      { word: "经济", reading: "けいざい", meaning: "economy", partOfSpeech: "noun" },
      { word: "股价", reading: "かぶか", meaning: "stock price", partOfSpeech: "noun" },
      { word: "上涨", reading: "あがり", meaning: "rise/go up", partOfSpeech: "noun/verb" },
      { word: "比赛", reading: "マッチ", meaning: "match/game", partOfSpeech: "noun" },
    ],
    grammarPoints: [
      { grammar: "~に~", explanation: "In~ (location)", example: "全国に雨", exampleTranslation: "Rain across the country" },
      { grammar: "~が~", explanation: "~subject marker", example: "股价小幅上涨", exampleTranslation: "Stock prices rose slightly" },
      { grammar: "~赢了", explanation: "~won", example: "日本队赢了比赛", exampleTranslation: "Japan team won the match" },
    ],
    comprehensionQuestions: [
      { id: "rq-020-1", question: "明天的天气预报是什么？", options: ["晴天", "下雪", "有雨", "阴天"], correctAnswer: 2, explanation: "明天全国有雨。" },
      { id: "rq-020-2", question: "交通方面有什么问题？", options: ["堵车", "新干线出现延误", "飞机取消", "没有特别问题"], correctAnswer: 1, explanation: "新干线出现延误。" },
      { id: "rq-020-3", question: "体育新闻报道了什么？", options: ["日本队输了", "日本队赢了", "比赛取消", "没有体育新闻"], correctAnswer: 1, explanation: "日本队赢了比赛。" },
    ],
    jlptLevel: "N5",
    tags: ["news", "information", "current-events"],
    estimatedTime: 8,
    difficulty: "beginner",
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
];

// Export all readings
export const extendedReadings = [...n5Readings];

export default extendedReadings;
