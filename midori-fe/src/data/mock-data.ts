export const grammarLessons = [
  { id: "g1", level: "N5", title: "〜です / だ", meaning: "to be (copula)", example: "私は学生です。", romaji: "Watashi wa gakusei desu.", translation: "I am a student.", progress: 100 },
  { id: "g2", level: "N5", title: "〜があります", meaning: "there is / exists (inanimate)", example: "机の上に本があります。", romaji: "Tsukue no ue ni hon ga arimasu.", translation: "There is a book on the desk.", progress: 80 },
  { id: "g3", level: "N4", title: "〜なければなりません", meaning: "must do", example: "毎日勉強する必要があります。", romaji: "Mainichi benkyou suru hitsuyou ga arimasu.", translation: "I need to study every day.", progress: 60 },
  { id: "g4", level: "N4", title: "〜たことがあります", meaning: "have experience of", example: "日本へ行ったことがあります。", romaji: "Nihon e itta koto ga arimasu.", translation: "I have been to Japan.", progress: 45 },
  { id: "g5", level: "N3", title: "〜わけではない", meaning: "it doesn't mean that", example: "嫌いなわけではない。", romaji: "Kirai na wake de wa nai.", translation: "It's not that I dislike it.", progress: 25 },
  { id: "g6", level: "N3", title: "〜ばかりでなく", meaning: "not only ... but also", example: "英語ばかりでなく、日本語も話せます。", romaji: "Eigo bakari de naku, nihongo mo hanasemasu.", translation: "I can speak not only English but also Japanese.", progress: 10 },
  { id: "g7", level: "N2", title: "〜にもかかわらず", meaning: "in spite of", example: "雨にもかかわらず出かけた。", romaji: "Ame ni mo kakawarazu dekaketa.", translation: "I went out despite the rain.", progress: 5 },
  { id: "g8", level: "N1", title: "〜を余儀なくされる", meaning: "be forced to", example: "辞職を余儀なくされた。", romaji: "Jishoku o yogi naku sareta.", translation: "Was forced to resign.", progress: 0 },
];

export type ShadowingSentence = { id: string; jp: string; romaji: string; en: string };

export type ShadowingConversation = {
  id: string;
  title: string;
  sentences: ShadowingSentence[];
};

export type ShadowingTopic = {
  id: string;
  level: string;
  label: string;
  emoji: string;
  title: string;
  description: string;
  conversations: ShadowingConversation[];
};

export const vocabulary = [
  { id: "v1", jp: "勉強", kana: "べんきょう", romaji: "benkyou", en: "study", level: "N5" },
  { id: "v2", jp: "学校", kana: "がっこう", romaji: "gakkou", en: "school", level: "N5" },
  { id: "v3", jp: "図書館", kana: "としょかん", romaji: "toshokan", en: "library", level: "N5" },
  { id: "v4", jp: "経験", kana: "けいけん", romaji: "keiken", en: "experience", level: "N4" },
  { id: "v5", jp: "影響", kana: "えいきょう", romaji: "eikyou", en: "influence", level: "N3" },
  { id: "v6", jp: "解決", kana: "かいけつ", romaji: "kaiketsu", en: "resolution", level: "N3" },
  { id: "v7", jp: "矛盾", kana: "むじゅん", romaji: "mujun", en: "contradiction", level: "N2" },
  { id: "v8", jp: "曖昧", kana: "あいまい", romaji: "aimai", en: "vague", level: "N1" },
];

export const listeningExercises = [
  { id: "l1",  title: "Morning at the café",       level: "N5", duration: "0:42", transcript: "おはようございます。コーヒーを一つください。" },
  { id: "l2",  title: "Asking for directions",     level: "N5", duration: "1:05", transcript: "すみません、駅はどこですか。" },
  { id: "l3",  title: "Self introduction",         level: "N5", duration: "0:55", transcript: "はじめまして。田中です。" },
  { id: "l4",  title: "Shopping at a convenience store", level: "N5", duration: "1:10", transcript: "これ、一つください。お金はいくらですか。" },
  { id: "l5",  title: "Ordering food",             level: "N5", duration: "0:58", transcript: "すみません、メ뉴をください。" },
  { id: "l6",  title: "Making a phone call",       level: "N4", duration: "2:20", transcript: "もしもし、田中さんのお宅ですか。" },
  { id: "l7",  title: "Weekend plans",            level: "N4", duration: "1:45", transcript: "今週の週末、何をしますか。" },
  { id: "l8",  title: "Weather forecast",         level: "N4", duration: "1:30", transcript: "今日は晴れです。明日は雨です。" },
  { id: "l9",  title: "At the train station",    level: "N4", duration: "2:05", transcript: "この電車は東京に行きますか。" },
  { id: "l10", title: "Visiting a doctor",        level: "N4", duration: "2:15", transcript: "頭が痛いです。熱がありますか。" },
  { id: "l11", title: "Job interview small talk", level: "N3", duration: "2:18", transcript: "本日はお時間をいただきありがとうございます。" },
  { id: "l12", title: "Explaining daily routine",  level: "N3", duration: "2:30", transcript: "毎朝六時に起きます。七時に朝ごはんを食べます。" },
  { id: "l13", title: "Discussing hobbies",        level: "N3", duration: "2:10", transcript: "私は映画を見るのが好きです。" },
  { id: "l14", title: "Business meeting",         level: "N2", duration: "3:45", transcript: "本案についてご説明します。何かご質問はありますか。" },
  { id: "l15", title: "News commentary",           level: "N2", duration: "3:20", transcript: "今朝のニュースについて話しましょう。" },
  { id: "l16", title: "Academic discussion",       level: "N1", duration: "4:30", transcript: "本研究の目的は、経済成長と環境保護のバランスを分析することです。" },
  { id: "l17", title: "Philosophical debate",      level: "N1", duration: "4:00", transcript: "真理の定義については、古代から多くの哲学者が議論してきました。" },
  { id: "l18", title: "Formal presentation",      level: "N1", duration: "5:15", transcript: "本プレゼンテーションでは、AI技術が社会に与える影響について考察します。" },
];

export const shadowingLessons = [
  {
    id: "n5",
    level: "N5",
    title: "N5 Level",
    description: "Basic greetings, shopping, and daily expressions",
    sentences: [
      { id: "s1", jp: "おはようございます。", romaji: "Ohayou gozaimasu.", en: "Good morning." },
      { id: "s2", jp: "今日はいい天気ですね。", romaji: "Kyou wa ii tenki desu ne.", en: "The weather is nice today, isn't it?" },
      { id: "s3", jp: "これはいくらですか。", romaji: "Kore wa ikura desu ka.", en: "How much is this?" },
      { id: "s4", jp: "ください。", romaji: "Kudasai.", en: "Please give me." },
      { id: "s5", jp: "もう一度言ってください。", romaji: "Mou ichido itte kudasai.", en: "Please say it again." },
      { id: "s6", jp: "ありがとうございます。", romaji: "Arigatou gozaimasu.", en: "Thank you very much." },
      { id: "s7", jp: "こんにちは。", romaji: "Konnichiwa.", en: "Hello / Good afternoon." },
      { id: "s8", jp: "はじめまして。", romaji: "Hajimemashite.", en: "Nice to meet you." },
      { id: "s9", jp: "日本語を勉強しています。", romaji: "Nihongo o benkyou shiteimasu.", en: "I'm studying Japanese." },
      { id: "s10", jp: "私は学生です。", romaji: "Watashi wa gakusei desu.", en: "I am a student." },
    ]
  },
  {
    id: "n4",
    level: "N4",
    title: "N4 Level",
    description: "Daily conversations and simple discussions",
    sentences: [
      { id: "s11", jp: "週末は何をしましたか。", romaji: "Shuumatsu wa nani o shimashita ka.", en: "What did you do on the weekend?" },
      { id: "s12", jp: "駅はどこですか。", romaji: "Eki wa doko desu ka.", en: "Where is the station?" },
      { id: "s13", jp: "まっすぐ行ってください。", romaji: "Massugu itte kudasai.", en: "Please go straight." },
      { id: "s14", jp: "メニューをください。", romaji: "Menyuu o kudasai.", en: "Please give me the menu." },
      { id: "s15", jp: "おすすめは何ですか。", romaji: "Osusume wa nan desu ka.", en: "What do you recommend?" },
      { id: "s16", jp: "とても美味しかったです。", romaji: "Totemo oishikatta desu.", en: "It was very delicious." },
      { id: "s17", jp: "今日は忙しかったです。", romaji: "Kyou wa isogashikatta desu.", en: "Today was busy." },
      { id: "s18", jp: "友達に会いました。", romaji: "Tomodachi ni aimashita.", en: "I met my friend." },
      { id: "s19", jp: "映画を見ました。", romaji: "Eiga o mimashita.", en: "I watched a movie." },
      { id: "s20", jp: "本をを読みました。", romaji: "Hon o yomimashita.", en: "I read a book." },
    ]
  },
  {
    id: "n3",
    level: "N3",
    title: "N3 Level",
    description: "Everyday conversations and opinions",
    sentences: [
      { id: "s21", jp: "日本の文化についてどう思いますか。", romaji: "Nihon no bunka ni tsuite dou omoimasu ka.", en: "What do you think about Japanese culture?" },
      { id: "s22", jp: "引っ越しを検討しています。", romaji: "Hikkoshi o kentou shiteimasu.", en: "I'm considering moving." },
      { id: "s23", jp: "最近のニュースについて話しましょう。", romaji: "Saikin no nyuusu ni tsuite hanashimashou.", en: "Let's talk about recent news." },
      { id: "s24", jp: "環境問題は深刻だと思います。", romaji: "Kankyou mondai wa shinkoku da to omoimasu.", en: "I think environmental problems are serious." },
      { id: "s25", jp: " 健康のために運動しています。", romaji: "Kenkou no tame ni undou shiteimasu.", en: "I exercise for my health." },
      { id: "s26", jp: "旅行代理人柄ことが好きです。", romaji: "Ryokou suru koto ga suki desu.", en: "I like traveling." },
      { id: "s27", jp: "キャリアについて考える必要があります。", romaji: "Kyaria ni tsuite kangaeru hitsuyou ga arimasu.", en: "I need to think about my career." },
      { id: "s28", jp: "技術の 발전は驚きです。", romaji: "Gijutsu no hatten wa odoroki desu.", en: "The advancement of technology is surprising." },
      { id: "s29", jp: "経済状況が変わつつあります。", romaji: "Keizai joukyou ga kawatte imasu.", en: "The economic situation is changing." },
      { id: "s30", jp: "国際交流の意味を深めました。", romaji: "Kokusai kouryu no imi o fukameraremashita.", en: "I came to understand the meaning of international exchange." },
    ]
  },
  {
    id: "n2",
    level: "N2",
    title: "N2 Level",
    description: "Complex topics and formal discussions",
    sentences: [
      { id: "s31", jp: "経済成長のバランスを考慮する必要があります。", romaji: "Keizai seichou no baransu o kouryo suru hitsuyou ga arimasu.", en: "We need to consider the balance of economic growth." },
      { id: "s32", jp: "技術の進歩は社会に大きな影響を与えています。", romaji: "Gijutsu no shinpo wa shakai ni oona na eikyou o ataete imasu.", en: "Technological progress is having a major impact on society." },
      { id: "s33", jp: "環境保護の観点から考えると、再生能源の開発が重要です。", romaji: "Kankyou hogo no kantennai kangaeru to, saisei energy no kaihatsu ga juuyou desu.", en: "From the perspective of environmental protection, developing renewable energy is important." },
      { id: "s34", jp: "グLOBAL化进程加速しています。", romaji: "Gurōbaruka ga shinpo o hasashite imasu.", en: "Globalization is accelerating." },
      { id: "s35", jp: "少子高齢化社会の課題に直面しています。", romaji: "Shoushi koureika shakai no kadai ni chokumen shite imasu.", en: "We are facing the challenges of a declining birthrate and aging society." },
      { id: "s36", jp: "情報セキュリティの重要性が増しています。", romaji: "Jouhou sekyuriti no juuyousei ga mashte imasu.", en: "The importance of information security is increasing." },
      { id: "s37", jp: "持続可能な開発目标の達成に向けて努力しています。", romaji: "Jizoku kanou na kaihatsu mokuhyou no tasei ni mukete doryoku shite imasu.", en: "We are working towards achieving sustainable development goals." },
      { id: "s38", jp: "イノベーションが産業構造转变を推進しています。", romaji: "Inobeeshon ga sangyou kouzou no henkan o suishin shite imasu.", en: "Innovation is driving changes in industrial structure." },
      { id: "s39", jp: "AIと人間の协働は新しい可能性を开いています。", romaji: "AI to ningen no gyoukun wa atarashii kanousei o hirakete imasu.", en: "Collaboration between AI and humans is opening new possibilities." },
      { id: "s40", jp: "デジタル转型はビジネスモデルを変革しています。", romaji: "Dejitaru toransufooma wa bijinesu moderu o henkaku shite imasu.", en: "Digital transformation is revolutionizing business models." },
    ]
  },
  {
    id: "n1",
    level: "N1",
    title: "N1 Level",
    description: "Advanced academic and professional Japanese",
    sentences: [
      { id: "s41", jp: "本論文では、環境問題に対する国際的な協調の必要性について论述しています。", romaji: "Hon ronbun de wa, kankyou mondai ni taisuru kokusai teki na kyouchou no hitsuyousei ni tsuite ronjutsu shite imasu.", en: "This paper discusses the necessity of international cooperation regarding environmental issues." },
      { id: "s42", jp: "経済学的な観点から見ると、この政策は長期的に効果的です。", romaji: "Keizaigaku teki na kantennai kara miru to, kono seisaku wa choukiteki ni kouka teki desu.", en: "From an economic perspective, this policy is effective in the long term." },
      { id: "s43", jp: "科学技术の进步が人类の知识基盤を拡大しています。", romaji: "Kagaku gijutsu no shinpo ga jinrui no chishiki kiban o kakudai shite imasu.", en: "Advances in science and technology are expanding the human knowledge base." },
      { id: "s44", jp: "社会学的な分析によれば、家族の形態多様化が進行しています。", romaji: "Shakaigaku teki na bunseki ni yoreba, kazoku no keitai tayouka ga shinkou shite imasu.", en: "According to sociological analysis, the diversification of family structures is progressing." },
      { id: "s45", jp: "言語学的な観点では、文化间コミュニケーションの重要性が増しています。", romaji: "Gengogaku teki na kantennai de wa, bunkakan komunikeeshon no juuyousei ga mashte imasu.", en: "From a linguistic perspective, the importance of cross-cultural communication is increasing." },
      { id: "s46", jp: "哲学的な考察に基づけば、真理追求は人间の本源的な欲求です。", romaji: "Tetsugaku teki na kousatsu ni motozuiteba, shinri tsuikyuu wa jinrui no hongen teki na yokkyuu desu.", en: "Based on philosophical consideration, the pursuit of truth is a fundamental human desire." },
      { id: "s47", jp: "歴史的な文脈において、この出来事大き的意义を有しています。", romaji: "Rekishi teki na bunmaku ni oite, kono deki goto wa oona na igi o yuu shite imasu.", en: "In its historical context, this event holds great significance." },
      { id: "s48", jp: "倫理学的な視点加納めれば、現代社会の道德的価値観的多様化を容認すべきです。", romaji: "Rinrigaku teki na shiten kara miru to, gendai shakai no doutoku teki kachikan kan no tayouka o younin suki beki desu.", en: "From an ethical standpoint, we should accept the moral value diversity of modern society." },
      { id: "s49", jp: "量的・質的分析を踏まえ、以下のような結論いたしました。", romaji: "Ryou teki・shitsu teki bunseki o fummae, ika no you na setsuron itashimashita.", en: "Based on quantitative and qualitative analysis, I arrived at the following conclusion." },
      { id: "s50", jp: "本研究の成果は、相关分野の学术的进展に貢献するものと期待されます。", romaji: "Hon kenkyuu no seika wa, sankei bunnya no gakujutsu teki shinpen ni kouken suru mono to kitai saremasu.", en: "The results of this research are expected to contribute to academic progress in related fields." },
    ]
  },
];

// shadowingTopics wraps shadowingLessons in the { topic -> conversations -> sentences } hierarchy
const LEVEL_EMOJI: Record<string, string> = {
  N5: "🌱", N4: "🌿", N3: "🌸", N2: "🍂", N1: "❄️",
};

export const shadowingTopics: ShadowingTopic[] = shadowingLessons.map((lesson) => ({
  id: lesson.id,
  level: lesson.level,
  label: lesson.level + " Shadowing",
  emoji: LEVEL_EMOJI[lesson.level] ?? "📚",
  title: lesson.title,
  description: lesson.description,
  conversations: [
    {
      id: `${lesson.id}-c1`,
      title: `${lesson.title} — Part 1`,
      sentences: lesson.sentences.slice(0, 5),
    },
    {
      id: `${lesson.id}-c2`,
      title: `${lesson.title} — Part 2`,
      sentences: lesson.sentences.slice(5),
    },
  ],
}));

// Keep for backwards compatibility
export const shadowingSentences = shadowingLessons[0].sentences;

export const jlptExams = [
  { id: "e1", level: "N5", title: "JLPT N5 Mock Exam 2024 #1", questions: 60, duration: 105, attempts: 1240 },
  { id: "e2", level: "N4", title: "JLPT N4 Mock Exam 2024 #2", questions: 70, duration: 125, attempts: 980 },
  { id: "e3", level: "N3", title: "JLPT N3 Mock Exam 2024 #1", questions: 80, duration: 140, attempts: 720 },
];

export const weeklyXp = [
  { day: "Mon", xp: 120 }, { day: "Tue", xp: 220 }, { day: "Wed", xp: 180 },
  { day: "Thu", xp: 310 }, { day: "Fri", xp: 260 }, { day: "Sat", xp: 410 }, { day: "Sun", xp: 280 },
];

export const skillRadar = [
  { skill: "Vocab", score: 78 }, { skill: "Grammar", score: 65 },
  { skill: "Listening", score: 72 }, { skill: "Reading", score: 60 },
  { skill: "Speaking", score: 55 }, { skill: "Kanji", score: 70 },
];

export const leaderboard = [
  { rank: 1, name: "Sakura Ito", xp: 12420, streak: 89, avatar: "S" },
  { rank: 2, name: "Hiroshi Tanaka", xp: 11890, streak: 64, avatar: "H" },
  { rank: 3, name: "Mei Lin", xp: 10560, streak: 47, avatar: "M" },
  { rank: 4, name: "You", xp: 9820, streak: 32, avatar: "Y" },
  { rank: 5, name: "Daniel Kim", xp: 9200, streak: 21, avatar: "D" },
  { rank: 6, name: "Aiko Mori", xp: 8740, streak: 18, avatar: "A" },
];

export const adminUsers = [
  { id: "u1", name: "Sakura Ito", email: "sakura@midori.jp", role: "Student", status: "Active", joined: "2024-08-12" },
  { id: "u2", name: "Kenji Sensei", email: "kenji@midori.jp", role: "Teacher", status: "Active", joined: "2024-06-03" },
  { id: "u3", name: "Mei Lin", email: "mei@midori.jp", role: "Student", status: "Active", joined: "2024-09-21" },
  { id: "u4", name: "Hana Mori", email: "hana@midori.jp", role: "Teacher", status: "Pending", joined: "2025-04-01" },
  { id: "u5", name: "Daniel Kim", email: "daniel@midori.jp", role: "Student", status: "Suspended", joined: "2024-11-09" },
];
