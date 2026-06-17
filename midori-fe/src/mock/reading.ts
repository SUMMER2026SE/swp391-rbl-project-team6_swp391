// ─── Reading Mock Data ────────────────────────────────────────────────────────

import { ReadingItem } from "../types/content-library";

export const mockReading: ReadingItem[] = [
  {
    id: "read-001",
    title: "JLPT N5 - My Family",
    passageText: `私の名前は田中です。二十五歳です。東京都に住んでいます。
家族は四人です。父と母と妹がいます。
父は会社の社長です。毎日忙しく働いています。
母は高校の国語の教師です。本を読むことが好きです。
妹は大学生です。日本語を勉強しています。
私たちは毎週日曜日に一緒に食事をします。`,
    comprehensionQuestions: [
      {
        id: "q1",
        question: "田中さんは何人家族ですか？",
        options: ["二人", "三人", "四人", "五人"],
        correctAnswer: 2,
        explanation: "家族は四人です。父と母と妹がいます。",
      },
      {
        id: "q2",
        question: "父は何をしている人ですか？",
        options: ["先生", "社長", "医者", "エンジニア"],
        correctAnswer: 1,
        explanation: "父は会社の社長です。",
      },
      {
        id: "q3",
        question: "母は何の科教諭ですか？",
        options: ["数学", "英語", "国語", "理科"],
        correctAnswer: 2,
        explanation: "母は高校の国語の教師です。",
      },
    ],
    jlptLevel: "N5",
    tags: ["family", "introduction", "basic"],
    estimatedTime: 5,
    createdAt: "2024-01-25",
    updatedAt: "2024-01-25",
  },
  {
    id: "read-002",
    title: "JLPT N5 - My Daily Life",
    passageText: `私は毎日六時に起きます。ラジオ体操をしてから、朝ご飯を食べます。
七時に家を出て、九時に会社につきます。会社は東京にあります。
昼ご飯は会社の食堂で食べます。食堂は周三階にあります。
下午五時に仕事が終ります。六時頃家に帰ります。
晚上七時頃に晩ご飯を食べます。それから、勉强やテレビを見ます。
十一時頃に寝ます。`,
    comprehensionQuestions: [
      {
        id: "q1",
        question: "何時に起きますか？",
        options: ["五時", "六時", "七時", "八時"],
        correctAnswer: 1,
        explanation: "私は毎日六時に起きます。",
      },
      {
        id: "q2",
        question: "昼ご飯はどこで食べますか？",
        options: ["家", "食堂", "レストラン", "学校"],
        correctAnswer: 1,
        explanation: "昼ご飯は会社の食堂で食べます。",
      },
      {
        id: "q3",
        question: "晚上何を作りますか？",
        options: ["運動", "散歩", "勉强やテレビ", "ゲーム"],
        correctAnswer: 2,
        explanation: "晚上七時頃に晩ご飯を食べます。それから、勉强やテレビを見ます。",
      },
    ],
    jlptLevel: "N5",
    tags: ["daily-life", "routine", "basic"],
    estimatedTime: 5,
    createdAt: "2024-01-26",
    updatedAt: "2024-01-26",
  },
  {
    id: "read-003",
    title: "JLPT N4 - Japanese Food Culture",
    passageText: `日本食は世界で人気があります。寿司や刺身、ラーメンなどの日本食は多くの国で食实践活动されています。
しかし、最近の調査によると、本物の日本食を知らない人も多います。
例えば、てんぷらは油で揚げる食べ物ですが、からあげと混同されることがあります。
また、日本の家庭料理には защит和生活紧密相关的食材が多いです。
味噌汁、煮物、焼き魚などは毎日のように食べられています。
日本食の健康面でのメリットも世界に広まりつつあります。
魚や野菜、海藻を食べる习惯は栄養バランスに优れています。`,
    comprehensionQuestions: [
      {
        id: "q1",
        question: "日本食は世界でどうなっていますか？",
        options: ["人気がない", "徐々に消えている", "人気がある", "まだ知らない"],
        correctAnswer: 2,
        explanation: "日本食は世界で人気があります。",
      },
      {
        id: "q2",
        question: "てんぷらとは何ですか？",
        options: ["煮る食べ物", "揚げる食べ物", "生で食べる", "蒸す食べ物"],
        correctAnswer: 1,
        explanation: "てんぷらは油で揚げる食べ物です。",
      },
      {
        id: "q3",
        question: "日本食の健康面でのメリットはどれですか？",
        options: ["肉をよく食べる", "油っこい食べ物が多い", "魚や野菜、海藻を食べる", "甘いお菓子が多い"],
        correctAnswer: 2,
        explanation: "魚や野菜、海藻を食べる习惯は栄養バランスに优れています。",
      },
    ],
    jlptLevel: "N4",
    tags: ["culture", "food", "health"],
    estimatedTime: 8,
    createdAt: "2024-02-15",
    updatedAt: "2024-02-15",
  },
  {
    id: "read-004",
    title: "JLPT N3 - Working Women in Japan",
    passageText: `近年、日本では女性和管理職に就くmano增加しています。
それでも、まだ男性管理職的优势は动摇していません。
調査によると、女性が管理職にならない理由は多样です。
まず、仕事と育児の両立が困难という意見が多います。
次に、先辈女性管理職が少ないため、ロールモデルがいないという声もあります。
また、公司の文化や气氛が男性中心であるため你觉得呢という声もあります。
しかし、政府は女性就活支援的政策を導入しており、状況は改善されつつあります。
越来越多的企业在推行弹性工作制度和远程办公，为女性员工提供更多便利。`,
    comprehensionQuestions: [
      {
        id: "q1",
        question: "女性和管理職についてどうですか？",
        options: ["全くいない", "増加している", "減少している", "変わらない"],
        correctAnswer: 1,
        explanation: "女性和管理職に就くmano增加しています。",
      },
      {
        id: "q2",
        question: "女性が管理職にならない理由として挙げられていないのはどれですか？",
        options: ["仕事と育児の両立が困難", "ロールモデルが少ない", "学歴が低い", "会社の文化が男性中心"],
        correctAnswer: 2,
        explanation: "学历は低いことは理由として挙げられていません。",
      },
      {
        id: "q3",
        question: "状況を改善するために誰が何を提供していますか？",
        options: ["企業 - 補助金", "政府 - 支援的政策", "学校 - 教育", "家族 - 手伝い"],
        correctAnswer: 1,
        explanation: "政府，活了女性就活支援的政策を導入しており、状況は改善されつつあります。",
      },
    ],
    jlptLevel: "N3",
    tags: ["society", "work", "women"],
    estimatedTime: 10,
    createdAt: "2024-03-15",
    updatedAt: "2024-03-15",
  },
  {
    id: "read-005",
    title: "JLPT N2 - Environmental Issues",
    passageText: `地球環境的问题是当今世界面临的重大课题之一。环境污染、气候变化、资源枯竭等问题日益严峻，需要各国共同努力解决。

首先，空气污染是许多大城市的共同问题。汽车尾气和工业排放是主要污染源。

其次，气候变化导致极端天气频发。海平面上升威胁着沿海城市的安全。

再者，塑料污染已成为海洋生态系统的重大威胁。每年有数百万吨塑料流入海洋。

为解决这些问题，国际社会正在采取行动。《巴黎协定》是各国共同应对气候变化的里程碑。

个人层面上，我们可以通过减少一次性塑料使用、公共交通出行、节约用电等方式为环境保护贡献力量。

重要的是，环境保护不仅是政府和企业的责任，每个人的小小行动汇聚起来，就能产生巨大的影响。`,
    comprehensionQuestions: [
      {
        id: "q1",
        question: "空气污染的主要原因是什么？",
        options: ["工厂爆炸", "汽车尾气和工业排放", "森林火灾", "火山爆发"],
        correctAnswer: 1,
        explanation: "汽车尾气和工业排放是主要污染源。",
      },
      {
        id: "q2",
        question: "《巴黎协定》是什么？",
        options: ["贸易协定", "应对气候变化的协议", "和平条约", "经济合作协定"],
        correctAnswer: 1,
        explanation: "《巴黎协定》是各国共同应对气候变化的里程碑。",
      },
      {
        id: "q3",
        question: "文章强调了什么观点？",
        options: ["个人行动无关紧要", "只有政府能解决问题", "每个人都应该参与环保", "环境问题无法解决"],
        correctAnswer: 2,
        explanation: "环境保护不仅是政府和企业的责任，每个人的小小行动汇聚起来，就能产生巨大的影响。",
      },
    ],
    jlptLevel: "N2",
    tags: ["environment", "global-issues", "essay"],
    estimatedTime: 15,
    createdAt: "2024-04-15",
    updatedAt: "2024-04-15",
  },
  {
    id: "read-006",
    title: "JLPT N1 - The Philosophy of Wabi-Sabi",
    passageText: `日本の美意識である「侘び寂び（Wabi-Sabi）」は、物の本質を深く見つめる考え方です。

まず、侘びとは、豪華さや華やかさではなく、地味で質素な中に美しさを見出すことです。簡素な生活や不完全な物の中にこそ、本当の価値があると考えます。

一方、寂びとは、時の流れによる変化を受け入れ、老いること、年季が入ることの中に美しさを見出すことです。茶道の世界里、千三百年前の茶碗や、古びた書院造りの建物に美しさを見出します。

この美意識は、現代のデザインや建築にも大きく影响を与えています。ミニマリズムや、ルフ・アーキテクチャーに侘び寂びの影響が見られます。

また、日常生活においても、全てを完璧にしようとするのではなく、不完全さや脆さを容忍し、物事の本質を見極めることの重要性は示唆されます。

现代社会に扔いて、この古くからある美意識は私たちが物的情報に溺れることなく、精神的な豊かさを寻求するヒントを与えてくれるでしょう。`,
    comprehensionQuestions: [
      {
        id: "q1",
        question: "侘び寂びの考え方の特徴はどれですか？",
        options: ["豪華さを崇尚する", "不完全の中に美を見出す", "常に新しいものを求める", "实用性を最優先する"],
        correctAnswer: 1,
        explanation: "侘び寂びは、不完全さや脆さの中に美しさを見出す考え方です。",
      },
      {
        id: "q2",
        question: "寂びの概念と関係ないものはどれですか？",
        options: ["古びた茶碗", "年季の入った建物", "最新のテクノロジー", "時の流れによる変化"],
        correctAnswer: 2,
        explanation: "寂びは古びた物、時の流れに美しさを見出す概念です。",
      },
      {
        id: "q3",
        question: "この文章で筆者が最も言いたいことは何ですか？",
        options: ["侘び寂びは古い考えで現代には不要", "不完全さを受け入れることで精神的豊かさを得らえる", "全ての物を完璧にするべき", "日本文化は世界一"],
        correctAnswer: 1,
        explanation: "不完全さや脆さを容忍し、物事の本質を見極めることで精神的豊かさを得られるという筆者の考えが强调されています。",
      },
    ],
    jlptLevel: "N1",
    tags: ["philosophy", "culture", "aesthetics"],
    estimatedTime: 20,
    createdAt: "2024-05-15",
    updatedAt: "2024-05-15",
  },
];

export const getReadingByLevel = (level: ReadingItem["jlptLevel"]) => {
  return mockReading.filter(item => item.jlptLevel === level);
};

export const getReadingById = (id: string) => {
  return mockReading.find(item => item.id === id);
};

export const searchReading = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return mockReading.filter(
    item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.passageText.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};
