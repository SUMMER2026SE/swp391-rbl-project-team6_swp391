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
        options: [
          "肉をよく食べる",
          "油っこい食べ物が多い",
          "魚や野菜、海藻を食べる",
          "甘いお菓子が多い",
        ],
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
        options: [
          "仕事と育児の両立が困難",
          "ロールモデルが少ない",
          "学歴が低い",
          "会社の文化が男性中心",
        ],
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
        options: [
          "个人行动无关紧要",
          "只有政府能解决问题",
          "每个人都应该参与环保",
          "环境问题无法解决",
        ],
        correctAnswer: 2,
        explanation:
          "环境保护不仅是政府和企业的责任，每个人的小小行动汇聚起来，就能产生巨大的影响。",
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
        options: [
          "豪華さを崇尚する",
          "不完全の中に美を見出す",
          "常に新しいものを求める",
          "实用性を最優先する",
        ],
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
        options: [
          "侘び寂びは古い考えで現代には不要",
          "不完全さを受け入れることで精神的豊かさを得らえる",
          "全ての物を完璧にするべき",
          "日本文化は世界一",
        ],
        correctAnswer: 1,
        explanation:
          "不完全さや脆さを容忍し、物事の本質を見極めることで精神的豊かさを得られるという筆者の考えが强调されています。",
      },
    ],
    jlptLevel: "N1",
    tags: ["philosophy", "culture", "aesthetics"],
    estimatedTime: 20,
    createdAt: "2024-05-15",
    updatedAt: "2024-05-15",
  },
];
// ─── Additional Reading Items ─────────────────────────────────────────────────
export const mockReadingAdditional: ReadingItem[] = [
  // N5 Items
  {
    id: "read-007",
    title: "JLPT N5 - At the Convenience Store",
    passageText:
      "あたらしいコンビニが私の家の近くにできました。店的商品很多。有食べ物和飲み物です。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "コンビニはどこにありますか？",
        options: ["会社の近く", "学校の近く", "家の近く", "駅の近く"],
        correctAnswer: 2,
        explanation: "あたらしいコンビニが私の家の近くにできました。",
      },
      {
        id: "q2",
        question: "朝のコーヒーはいくらですか？",
        options: ["百二十円", "三百五十円", "二百円", "五百円"],
        correctAnswer: 0,
        explanation: "百二十円です。",
      },
    ],
    jlptLevel: "N5",
    tags: ["shopping", "daily-life", "convenience"],
    estimatedTime: 5,
    createdAt: "2024-01-27",
    updatedAt: "2024-01-27",
  },
  {
    id: "read-008",
    title: "JLPT N5 - Seasons in Japan",
    passageText:
      "日本は四季が美しい国です。春は三月からです。桜が咲きます。夏はあ=Juneからです。秋は九月からです。冬は十二月からです。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "桜が咲く季節はいつですか？",
        options: ["夏", "春", "秋", "冬"],
        correctAnswer: 1,
        explanation: "春は三月からです。桜が咲きます。",
      },
      {
        id: "q2",
        question: "紅葉が美しい季節はいつですか？",
        options: ["春", "夏", "秋", "冬"],
        correctAnswer: 2,
        explanation: "秋は九月からです。紅葉が美しいです。",
      },
    ],
    jlptLevel: "N5",
    tags: ["seasons", "nature", "weather"],
    estimatedTime: 5,
    createdAt: "2024-01-28",
    updatedAt: "2024-01-28",
  },
  // N4 Items
  {
    id: "read-009",
    title: "JLPT N4 - Japanese Transportation",
    passageText:
      "日本には様々な交通手段があります。電車の他に、バスや地下鉄があります。私の最寄りの駅は五分歩ところです。遠くへ行く時は、新幹線を使います。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "最寄りの駅までどのくらい時間がかかりますか？",
        options: ["十分", "五分", "十五分", "二十分"],
        correctAnswer: 1,
        explanation: "五分歩ところです。",
      },
      {
        id: "q2",
        question: "遠くへ行く時は何を使いますか？",
        options: ["電車", "バス", "新幹線", "タクシー"],
        correctAnswer: 2,
        explanation: "遠くへ行く時は、新幹線を使います。",
      },
    ],
    jlptLevel: "N4",
    tags: ["transportation", "travel", "daily-life"],
    estimatedTime: 8,
    createdAt: "2024-02-16",
    updatedAt: "2024-02-16",
  },
  {
    id: "read-010",
    title: "JLPT N4 - Japanese Holidays",
    passageText:
      "日本は多くの祝日があります。一月一日は元日です。二月は節分です。三月はひな祭りです。五月は子供の日です。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "節分にすることは何ですか？",
        options: ["ひな人形を並べる", "鬼を追い払う", "星に願い事を書く", "家族が集まる"],
        correctAnswer: 1,
        explanation: "二月は節分です。鬼を追い払います。",
      },
      {
        id: "q2",
        question: "ひな祭りは誰の祝日ですか？",
        options: ["男の子の祝日", "女の子の祝日", "大人の祝日", "老人的祝日"],
        correctAnswer: 1,
        explanation: "三月はひな祭りです。女の子の祝日です。",
      },
    ],
    jlptLevel: "N4",
    tags: ["holidays", "culture", "traditions"],
    estimatedTime: 8,
    createdAt: "2024-02-17",
    updatedAt: "2024-02-17",
  },
  // N3 Items
  {
    id: "read-011",
    title: "JLPT N3 - Remote Work Revolution",
    passageText:
      "近几年、远程办公在日本迅速普及。许多企业开始采用Hybrid工作方式。远程工作的优势包括：通勤时间减少、工作与生活balance改善。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "远程工作的主要优势是什么？",
        options: ["通勤时间增加", "コミュニケーション更容易", "通勤时间减少", "工作效率下降"],
        correctAnswer: 2,
        explanation: "通勤时间减少是远程工作的主要优势之一。",
      },
      {
        id: "q2",
        question: "文中提到的远程工作挑战不包括哪一项？",
        options: ["コミュニケーション难以取る", "働きすぎ", "通勤时间增加", "孤独感"],
        correctAnswer: 2,
        explanation: "通勤时间增加是优势不是挑战。",
      },
    ],
    jlptLevel: "N3",
    tags: ["work", "technology", "society"],
    estimatedTime: 12,
    createdAt: "2024-03-16",
    updatedAt: "2024-03-16",
  },
  {
    id: "read-012",
    title: "JLPT N3 - The Art of Japanese Tea Ceremony",
    passageText:
      "茶道は単なる飲み物を飲む行为ではなく、日本文化の缩図とも言える的精神实践活动です。茶道の基本原则包括「和敬清寂」四个字。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "茶道的基本原则是什么？",
        options: ["和食文化", "和敬清寂", "茶道礼仪", "日本精神"],
        correctAnswer: 1,
        explanation: "茶道の基本原则是「和敬清寂」。",
      },
      {
        id: "q2",
        question: "为什么茶室入口设计得很低？",
        options: ["节省空间", "体现精神——无论身份高低都应以礼相待", "美观设计", "传统规定"],
        correctAnswer: 1,
        explanation: "高贵的人也需要低头才能进入，这体现了茶道的精神。",
      },
    ],
    jlptLevel: "N3",
    tags: ["culture", "tradition", "art"],
    estimatedTime: 12,
    createdAt: "2024-03-17",
    updatedAt: "2024-03-17",
  },
  // N2 Items
  {
    id: "read-013",
    title: "JLPT N2 - AI and the Future of Work",
    passageText:
      "人工智能（AI）技术的快速发展正在深刻改变我们的工作方式。AI提高了工作效率，降低了成本。许多重复性工作可以被AI系统高效完成。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "AI对重复性工作有什么影响？",
        options: ["增加工作量", "可以被高效完成", "需要更多人力", "完全消失"],
        correctAnswer: 1,
        explanation: "许多重复性工作可以被AI系统高效完成。",
      },
      {
        id: "q2",
        question: "作者对AI导致失业的看法是什么？",
        options: ["完全悲观", "完全乐观", "客观分析认为会创造新机会", "不关心"],
        correctAnswer: 2,
        explanation: "作者认为技术革命会取代一些工作，但也会创造新的就业机会。",
      },
    ],
    jlptLevel: "N2",
    tags: ["technology", "AI", "future", "work"],
    estimatedTime: 15,
    createdAt: "2024-04-16",
    updatedAt: "2024-04-16",
  },
  {
    id: "read-014",
    title: "JLPT N2 - Sustainable Living",
    passageText:
      "持続可能な生活样式が越来越多的人に关注されています。買い物袋の使用削減が举げられます。Food Waste 的削减も重要です。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "哪些是可持续生活的方式？",
        options: ["尽量多买东西", "マイバッグの使用", "食物浪费", "开私家车"],
        correctAnswer: 1,
        explanation: "マイバッグを持ち歩く习惯是可持续生活的方式。",
      },
      {
        id: "q2",
        question: "Food Waste削減的好处是什么？",
        options: ["增加开支", "浪费 줄이고かつ家計節減", "需要更多时间", "对环境没有影响"],
        correctAnswer: 1,
        explanation:
          " 필요한分だけ買い物をすることは、浪費 줄이는だけでなく、家計の節減にも繋がります。",
      },
    ],
    jlptLevel: "N2",
    tags: ["environment", "sustainability", "lifestyle"],
    estimatedTime: 15,
    createdAt: "2024-04-17",
    updatedAt: "2024-04-17",
  },
  // N1 Items
  {
    id: "read-015",
    title: "JLPT N1 - The Paradox of Choice in Modern Society",
    passageText:
      "选择悖论（The Paradox of Choice）は、心理学者バリー・シュwartsが提唱した概念である。现代人は、かつてないほど多様な選択的权利を与られている。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "选择悖论是谁提出的？",
        options: ["フロイト", "バリー・シュwarts", "マズロー", "ユング"],
        correctAnswer: 1,
        explanation: "選択のパラドックスは、心理学者バリー・シュwartsが提唱した概念です。",
      },
      {
        id: "q2",
        question: "为什么选择过多会导致压力？",
        options: [
          "选择太简单",
          "每个选择都有潜在损失，损失带来的痛苦超过收益",
          "商品质量差",
          "没有足够的选择",
        ],
        correctAnswer: 1,
        explanation:
          "任何一个選択にも潜在的な损失が伴う。そして、その损失带来的心理的痛苦は、对称的な利益带来的喜びを上回る。",
      },
    ],
    jlptLevel: "N1",
    tags: ["psychology", "philosophy", "modern-society"],
    estimatedTime: 25,
    createdAt: "2024-05-16",
    updatedAt: "2024-05-16",
  },
  {
    id: "read-016",
    title: "JLPT N1 - Monozukuri and Global Manufacturing",
    passageText:
      "「ものつくり」という概念は、日本の製造業の精髓を集約的に体現している。それは単なる製品製造を超えて、技術の人伝、品質へのこだわり、そして工匠の精神を含む包括的なphilosophyである。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "「ものつくり」の概念について正しくない説明はどれですか？",
        options: [
          "単なる製品製造である",
          "技術の传承を含む",
          "品質へのこだわりを含む",
          "工匠の精神を含む",
        ],
        correctAnswer: 0,
        explanation: "「ものつくり」は単なる製品製造を超えて、包括的なphilosophyです。",
      },
      {
        id: "q2",
        question: "グローバル化する製造環境において何が不可欠ですか？",
        options: ["完全な自動化", "知識と経験の人移", "コストの増加", "国内生産のみ"],
        correctAnswer: 1,
        explanation:
          "移転先においても一定の品質水準を維持するためには、知識と経験の移転が不可欠である。",
      },
    ],
    jlptLevel: "N1",
    tags: ["manufacturing", "technology", "industry"],
    estimatedTime: 25,
    createdAt: "2024-05-17",
    updatedAt: "2024-05-17",
  },
  // Extra Items for Pagination Testing
  {
    id: "read-017",
    title: "JLPT N5 - My Favorite Animal",
    passageText: "私は動物が好きです。特に犬が好きです。名前はポチです。三歳です。白い犬です。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "著者が好きな動物は何ですか？",
        options: ["猫", "犬", "鳥", "魚"],
        correctAnswer: 1,
        explanation: "私は動物が好きです。特に犬が好きです。",
      },
      {
        id: "q2",
        question: "ポチは何歳ですか？",
        options: ["一歳", "二歳", "三歳", "四歳"],
        correctAnswer: 2,
        explanation: "名前はポチです。三歳です。",
      },
    ],
    jlptLevel: "N5",
    tags: ["animals", "pets", "daily-life"],
    estimatedTime: 5,
    createdAt: "2024-01-29",
    updatedAt: "2024-01-29",
  },
  {
    id: "read-018",
    title: "JLPT N4 - Japanese School Life",
    passageText:
      "日本の学校教育について紹介します。小学は六年です。中学は三年です。高校は三年です。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "日本の高校は何年ですか？",
        options: ["二年", "三年", "四年", "五年"],
        correctAnswer: 1,
        explanation: "高校は三年です。",
      },
      {
        id: "q2",
        question: "授業は何時に始まりますか？",
        options: ["八時", "九時", "十時", "七時"],
        correctAnswer: 1,
        explanation: "授業は九時に始まります。",
      },
    ],
    jlptLevel: "N4",
    tags: ["school", "education", "student-life"],
    estimatedTime: 8,
    createdAt: "2024-02-18",
    updatedAt: "2024-02-18",
  },
  {
    id: "read-019",
    title: "JLPT N3 - Japanese Pop Culture",
    passageText:
      "日本のポップカルチャーは世界的に影響を与えています。アニメとマンガは代表的なコンテンツです。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "日本のポップカルチャーの代表的是什么？",
        options: ["映画", "アニメとマンガ", "テレビ", "舞台"],
        correctAnswer: 1,
        explanation: "アニメとマンガは代表的なコンテンツです。",
      },
      {
        id: "q2",
        question: "ゲーム機で世界中に知られている企業はどれですか？",
        options: ["Sony only", "任天堂とソニー", "Microsoft", "Apple"],
        correctAnswer: 1,
        explanation: "任天堂やソニーのゲーム機が世界中で販売されています。",
      },
    ],
    jlptLevel: "N3",
    tags: ["culture", "pop-culture", "entertainment"],
    estimatedTime: 10,
    createdAt: "2024-03-18",
    updatedAt: "2024-03-18",
  },
  {
    id: "read-020",
    title: "JLPT N2 - Mental Health Awareness",
    passageText:
      "近年、メンタルヘルスの重要性が社会的に認知されつつあります。従来、日本社会では精神的な問題を一人で抱える傾向がありました。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "日本社会で従来どのような傾向がありましたか？",
        options: [
          "専門機関の的活动が盛ん",
          "精神的な問題を一人で抱える",
          "メンタルヘルスが重視された",
          "多くの人が助けを求める",
        ],
        correctAnswer: 1,
        explanation: "従来、日本社会では精神的な問題を一人で抱える傾向がありました。",
      },
      {
        id: "q2",
        question: "mental health向左向右取り組みとして何が普及していますか？",
        options: ["药物治疗", "カウンセリングの普及", "運動禁止", "食事制限"],
        correctAnswer: 1,
        explanation: "まず、カウンセリングの普及が上げられます。",
      },
    ],
    jlptLevel: "N2",
    tags: ["health", "mental-health", "society"],
    estimatedTime: 15,
    createdAt: "2024-04-18",
    updatedAt: "2024-04-18",
  },
  {
    id: "read-021",
    title: "JLPT N1 - Phenomenology of Everyday Life",
    passageText:
      "日常的な経験の奥深さを哲学的に探究する試みは、古くからあった。しかし、二十世紀になってようやく系統的な学問として成熟した。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "現象学が对象とした的是什么？",
        options: ["客観的世界", "経験の質本身", "科学的世界", "物質的世界"],
        correctAnswer: 1,
        explanation: "現象学は、「そのような経験の質本身」を对象とした。",
      },
      {
        id: "q2",
        question: "このアプローチの革新性は何でしたか？",
        options: ["科学の支持", "客観的説明への疑問", "技術の発展", "商業的成功"],
        correctAnswer: 1,
        explanation: "このアプローチの革新性は、客観的説明への疑問にあった。",
      },
    ],
    jlptLevel: "N1",
    tags: ["philosophy", "phenomenology", "theory"],
    estimatedTime: 25,
    createdAt: "2024-05-18",
    updatedAt: "2024-05-18",
  },

  // ─── NEW ADDITIONAL READING ITEMS ─────────────────────────────────────────────

  // N5 - New Items
  {
    id: "read-022",
    title: "JLPT N5 - My Town",
    passageText:
      "私の町は静かです。駅前に銀行があります。超市は駅の前です。便利店は私の家の近くにあります。町には図書館があります。本を借りることができます。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "銀行はどこにありますか？",
        options: ["家の近く", "駅前から", "図書館のとなり", "公園の前"],
        correctAnswer: 1,
        explanation: "駅前に銀行があります。",
      },
      {
        id: "q2",
        question: "图书馆可以用来做什么？",
        options: ["買い物", "本を借りる", "ご飯を食べる", "映画を見る"],
        correctAnswer: 1,
        explanation: "本を借りることができます。",
      },
    ],
    jlptLevel: "N5",
    tags: ["town", "places", "location"],
    estimatedTime: 5,
    createdAt: "2024-06-01",
    updatedAt: "2024-06-01",
  },
  {
    id: "read-023",
    title: "JLPT N5 - Weather and Seasons",
    passageText:
      "今日は晴れです。明日は曇りです。冬は雪が降ります。夏は暑いです。春と秋は涼しいです。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "今日の天気は何ですか？",
        options: ["雨", "曇り", "晴れ", "雪"],
        correctAnswer: 2,
        explanation: "今日は晴れです。",
      },
      {
        id: "q2",
        question: "冬に何が降りますか？",
        options: ["雨", "雪", "風", "霧"],
        correctAnswer: 1,
        explanation: "冬は雪が降ります。",
      },
    ],
    jlptLevel: "N5",
    tags: ["weather", "seasons", "nature"],
    estimatedTime: 5,
    createdAt: "2024-06-02",
    updatedAt: "2024-06-02",
  },
  {
    id: "read-024",
    title: "JLPT N5 - At the Restaurant",
    passageText:
      "食堂で昼ご飯を食べます。今日はラーメンにしました。美味しかったです。coffee を飲みました。三百五十円でした。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "著者はどこで昼ご飯を食べましたか？",
        options: ["家", "食堂", "レストラン", "学校"],
        correctAnswer: 1,
        explanation: "食堂で昼ご飯を食べます。",
      },
      {
        id: "q2",
        question: "今日 무엇을 먹었어요?",
        options: ["カレー", "ラーメン", "そば", "定食"],
        correctAnswer: 1,
        explanation: "今日はラーメンにしました。",
      },
    ],
    jlptLevel: "N5",
    tags: ["food", "restaurant", "daily-life"],
    estimatedTime: 5,
    createdAt: "2024-06-03",
    updatedAt: "2024-06-03",
  },
  {
    id: "read-025",
    title: "JLPT N5 - My Birthday",
    passageText:
      "私の诞生日は七月十五日です。母がケーキを作ってくれました。友達がプレゼントをくれました。嬉しかったです。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "诞生日はいつですか？",
        options: ["七月五日", "七月十五日", "八月十五日", "六月十五日"],
        correctAnswer: 1,
        explanation: "私の诞生日は七月十五日です。",
      },
      {
        id: "q2",
        question: "母が何をくれましたか？",
        options: ["プレゼント", "ケーキ", "お金", "花"],
        correctAnswer: 1,
        explanation: "母がケーキを作ってくれました。",
      },
    ],
    jlptLevel: "N5",
    tags: ["birthday", "family", "celebration"],
    estimatedTime: 5,
    createdAt: "2024-06-04",
    updatedAt: "2024-06-04",
  },

  // N4 - New Items
  {
    id: "read-026",
    title: "JLPT N4 - Japanese Holidays and Festivals",
    passageText:
      "日本には伝統的なお祭りが多いです。夏には花火大会があります很多人都穿浴衣。冬にはクリスマスがあります。正月には初詣を行います。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "夏の花火大会で着什么来る人が増えますか？",
        options: ["浴衣", "スーツ", "制服", "カジュアル"],
        correctAnswer: 0,
        explanation: "很多人都穿浴衣。",
      },
      {
        id: "q2",
        question: "正月に行う行事は何ですか？",
        options: ["花火大会", "初詣", "ディズニー", "旅行"],
        correctAnswer: 1,
        explanation: "正月には初詣を行います。",
      },
    ],
    jlptLevel: "N4",
    tags: ["festivals", "traditions", "culture"],
    estimatedTime: 8,
    createdAt: "2024-06-05",
    updatedAt: "2024-06-05",
  },
  {
    id: "read-027",
    title: "JLPT N4 - Job Hunting in Japan",
    passageText:
      "日本では、四年生の三月までに就活が終わります。まずはESを書きます。そして、面接を行います。面接では自己PR重要です。最終面接をパスすると、内定脖ます。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "就活はいつまでに終わりますか？",
        options: ["三月", "六月", "十二月", "一年中"],
        correctAnswer: 0,
        explanation: "日本では、四年生の三月までに就活が終わります。",
      },
      {
        id: "q2",
        question: "就活の第一步は何ですか？",
        options: ["面接", "ESを書く", "説明会参加", "雰囲探し"],
        correctAnswer: 1,
        explanation: "まずはESを書きます。",
      },
    ],
    jlptLevel: "N4",
    tags: ["job-hunting", "work", "career"],
    estimatedTime: 8,
    createdAt: "2024-06-06",
    updatedAt: "2024-06-06",
  },
  {
    id: "read-028",
    title: "JLPT N4 - Shopping in Japan",
    passageText:
      "日本では网购も普及しています。Amazon や楽天市場で買い物をする人が増えました。でも、コンビニや超市も気軽に買い物ができて便利です。夜遅くまで開いている店が多いです。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "网上购物用什么平台？",
        options: ["コンビニ", "Amazon・楽天市場", "百货店", "自动贩卖机"],
        correctAnswer: 1,
        explanation: "Amazon や楽天市場で買い物をする人が増えました。",
      },
      {
        id: "q2",
        question: "日本の店はどんな特徴がありますか？",
        options: ["早く閉まる", "夜遅くまで開いている", "假日不开门", "24小时营业"],
        correctAnswer: 1,
        explanation: "夜遅くまで開いている店が多いです。",
      },
    ],
    jlptLevel: "N4",
    tags: ["shopping", "online", "retail"],
    estimatedTime: 8,
    createdAt: "2024-06-07",
    updatedAt: "2024-06-07",
  },
  {
    id: "read-029",
    title: "JLPT N4 - Japanese Etiquette",
    passageText:
      "日本には 많은 作法があります。電車では大きい声で話さないことです。人にものを渡す時は両手を使います。お辞儀も很重要的コミュニケーション手段です。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "電車ですることとして正しくないのはどれですか？",
        options: ["静かにする", "大きい声で話す", "席を譲る", "スマホを見る"],
        correctAnswer: 1,
        explanation: "電車では大きい声で話さないことです。",
      },
      {
        id: "q2",
        question: "ものを渡す時はどうしますか？",
        options: ["片手", "両手", "指先", "足"],
        correctAnswer: 1,
        explanation: "人にものを渡す時は両手を使います。",
      },
    ],
    jlptLevel: "N4",
    tags: ["etiquette", "manners", "culture"],
    estimatedTime: 8,
    createdAt: "2024-06-08",
    updatedAt: "2024-06-08",
  },

  // N3 - New Items
  {
    id: "read-030",
    title: "JLPT N3 - Japanese Education System",
    passageText:
      "日本の教育制度は六・三・三・四制です。小学六年、中学三年、高校三年、大学四年です。义务教育は小学と中学の九年です。近年全球化に伴い、英語教育の導入が早期化する傾向があります。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "義務教育は合わせて何年間ですか？",
        options: ["六年", "九年", "十二年", "十三年"],
        correctAnswer: 1,
        explanation: "义务教育は小学と中学の九年です。",
      },
      {
        id: "q2",
        question: "近年什么教育变得更加早期化？",
        options: ["体育", "音楽", "英語", "美術"],
        correctAnswer: 2,
        explanation: "近年全球化に伴い、英語教育の導入が早期化する傾向があります。",
      },
    ],
    jlptLevel: "N3",
    tags: ["education", "school", "system"],
    estimatedTime: 10,
    createdAt: "2024-06-09",
    updatedAt: "2024-06-09",
  },
  {
    id: "read-031",
    title: "JLPT N3 - Smartphones and Modern Life",
    passageText:
      "现代人はスマートフォン离不开手边。情報を入手するだけでなく、SNSで交流を深めることもできます。一方で、スマホ依存が社会問題化しています。特に若者のスクリーンタイム管理が課題です。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "スマホ除了获取信息还有什么用途？",
        options: ["料理", "運動", "SNSで交流", "洗濯"],
        correctAnswer: 2,
        explanation: "情報を入手するだけでなく、SNSで交流を深めることもできます。",
      },
      {
        id: "q2",
        question: "スマホに関連する社会問題は何ですか？",
        options: ["手机坏了", "スマホ依存", "电池续航", "屏幕大小"],
        correctAnswer: 1,
        explanation: "一方で、スマホ依存が社会問題化しています。",
      },
    ],
    jlptLevel: "N3",
    tags: ["technology", "smartphone", "society"],
    estimatedTime: 10,
    createdAt: "2024-06-10",
    updatedAt: "2024-06-10",
  },
  {
    id: "read-032",
    title: "JLPT N3 - Japanese Sports Culture",
    passageText:
      "野球は日本で最もpopularな 스포츠です。高校野球は夏の风物詩です。他にも、相撲、サッカー、バレーボールなどが愛されています。近年は、F1やテニスなど国際的なスポーツにも注目が集まっています。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "日本で最も人気があるスポーツは何ですか？",
        options: ["サッカー", "野球", "相撲", "テニス"],
        correctAnswer: 1,
        explanation: "野球は日本で最もpopularな 스포츠です。",
      },
      {
        id: "q2",
        question: "高校野球はいつ頃のイベントですか？",
        options: ["春", "夏", "秋", "冬"],
        correctAnswer: 1,
        explanation: "高校野球は夏の风物詩です。",
      },
    ],
    jlptLevel: "N3",
    tags: ["sports", "baseball", "culture"],
    estimatedTime: 10,
    createdAt: "2024-06-11",
    updatedAt: "2024-06-11",
  },
  {
    id: "read-033",
    title: "JLPT N3 - The Importance of Reading",
    passageText:
      "読書の好处は多方面に渡ります。語彙力が向上し、表現力が生まれ変わります。また、想像力が豊かになり、empathic abilities も养的できます。本を選ぶ時は、难度の合ったものを選ぶことが重要的吧。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "読書的好处不包括哪一项？",
        options: ["語彙力向上", "表現力 UP", "運動能力 향상", "想像力豊か"],
        correctAnswer: 2,
        explanation: "語彙力が向上し、表現力が生まれ変わります。また、想像力が豊かになり...",
      },
      {
        id: "q2",
        question: "本を選ぶ時何が重要ですか？",
        options: ["可愛いカバー", "难度の合ったもの", "畅销书", "作者的知名度"],
        correctAnswer: 1,
        explanation: "本を選ぶ時は、难度の合ったものを選ぶことが重要的吧。",
      },
    ],
    jlptLevel: "N3",
    tags: ["reading", "books", "education"],
    estimatedTime: 10,
    createdAt: "2024-06-12",
    updatedAt: "2024-06-12",
  },

  // N2 - New Items
  {
    id: "read-034",
    title: "JLPT N2 - The Aging Society",
    passageText:
      "日本は今、超高齢社会に直面しています。世界に先駆けて Aging population が進行しています。社会保障費の増加が深刻な課題です。また、労働人口の減少も経済に大きな影响を与えています。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "日本が世界に先駆けて進行している问题是？",
        options: ["少子化", "高齢社会化", "環境污染", "経済衰退"],
        correctAnswer: 1,
        explanation: "世界に先駆けて Aging population が進行しています。",
      },
      {
        id: "q2",
        question: "高齢社会に有什么关系的问题？",
        options: ["社会保障費增加", "娱乐施設增加", "交通便利", "物价下降"],
        correctAnswer: 0,
        explanation: "社会保障費の増加が深刻な課題です。",
      },
    ],
    jlptLevel: "N2",
    tags: ["society", "aging", "demographics"],
    estimatedTime: 12,
    createdAt: "2024-06-13",
    updatedAt: "2024-06-13",
  },
  {
    id: "read-035",
    title: "JLPT N2 - Work-Life Balance",
    passageText:
      "ワークライフバランスの重要性が叫ばれています。長時間労働の是正が求められています。しかし、現実的には implementation が難しい企業も多いです。Remote work の普及が変革の起爆剤となる可能性があります。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "ワークライフバランスに関連して何が求められていますか？",
        options: ["長時間労働の是正", "給与 DOWN", "休日增加", "出勤不可"],
        correctAnswer: 0,
        explanation: "長時間労働の三是求められています。",
      },
      {
        id: "q2",
        question: "何が変革の起爆剤となる可能性がありますか？",
        options: ["対面会议", "Remote work の普及", "出張增加", "加班强制"],
        correctAnswer: 1,
        explanation: "Remote work の普及が変革の起爆剤となる可能性があります。",
      },
    ],
    jlptLevel: "N2",
    tags: ["work", "balance", "lifestyle"],
    estimatedTime: 12,
    createdAt: "2024-06-14",
    updatedAt: "2024-06-14",
  },
  {
    id: "read-036",
    title: "JLPT N2 - Digital Transformation",
    passageText:
      "デジタルトランスフォーメーション（DX）は企業にとって不可避の課題です。AIやクラウドサービスの活用が加速しています。しかし、中小企業にとっては導入のハードルが高いのも事実です。人材の育成と技術導入の両立が求められています。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "DXにおいて加速している是什么？",
        options: ["対面取引", "AIやクラウドサービスの活用", "纸的使用", "店舗扩张"],
        correctAnswer: 1,
        explanation: "AIやクラウドサービスの活用が加速しています。",
      },
      {
        id: "q2",
        question: "中小企业在DX方面面临什么挑战？",
        options: ["導入のハードルが高い", "市場扩大", "人手过剩", "竞争减少"],
        correctAnswer: 0,
        explanation: "中小企業にとっては導入のハードルが高いのも事実です。",
      },
    ],
    jlptLevel: "N2",
    tags: ["technology", "DX", "business"],
    estimatedTime: 12,
    createdAt: "2024-06-15",
    updatedAt: "2024-06-15",
  },
  {
    id: "read-037",
    title: "JLPT N2 - Cultural Diversity",
    passageText:
      "全球化の進展により、日本の社会は越来越多种多样です。街上可以看到各种国家的人。外国人の労働者や留学生が増加しています。多文化共生社会の実現が今後の重要なテーマです。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "増加している是什么人ですか？",
        options: ["旅行者", "労働者や留学生", "外交官", "记者"],
        correctAnswer: 1,
        explanation: "外国人の労働者や留学生が増加しています。",
      },
      {
        id: "q2",
        question: "今後の重要なテーマは何ですか？",
        options: ["経済成長", "多文化共生社会の実現", "军事增强", "孤立主義"],
        correctAnswer: 1,
        explanation: "多文化共生社会の実現が今後の重要なテーマです。",
      },
    ],
    jlptLevel: "N2",
    tags: ["globalization", "diversity", "society"],
    estimatedTime: 12,
    createdAt: "2024-06-16",
    updatedAt: "2024-06-16",
  },

  // N1 - New Items
  {
    id: "read-038",
    title: "JLPT N1 - The Concept of Ikigai",
    passageText:
      "「生きがい」とは、自己の人生を充実させる源泉を指す概念です。単なる快楽や物質的满足を超えた、存在本身への意义感觉を含みます。他会から求められる役割と、自己の本当にやりたいことが交わる点に、生涯続く生きがいが見出されます。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "「生きがい」の概念について正しくない説明はどれですか？",
        options: [
          "単なる快楽を超えた概念",
          "存在本身への意义感觉を含む",
          "常に金储けと関系がある",
          "自己の本当にやりたいことが関係する",
        ],
        correctAnswer: 2,
        explanation: "単なる快楽や物質的满足を超えた、存在本身への意义感觉を含みます。",
      },
      {
        id: "q2",
        question: "生きがいはどこに見出されますか？",
        options: [
          "華やかな場所",
          "他会から求められる役割と自分のやりたいことが交わる点",
          "自然に囲まれた場所",
          "思い出の地",
        ],
        correctAnswer: 1,
        explanation: "他会から求められる役割と、自己の本当にやりたいことが交わる点に...",
      },
    ],
    jlptLevel: "N1",
    tags: ["philosophy", "ikigai", "meaning-of-life"],
    estimatedTime: 15,
    createdAt: "2024-06-17",
    updatedAt: "2024-06-17",
  },
  {
    id: "read-039",
    title: "JLPT N1 - Semantic Shift in Language",
    passageText:
      "言語は生きた有机体であり、常に変容し続けています。かつては否定的な意味を持っていた言葉が、时代とともに肯定的な意味を帯びるようになる现象は珍しいことではありません。このような意味の转移は、社会的文脈と深く関わっています。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "言語について作者はどのように捉えていますか？",
        options: ["unchangeable なもの", "生きた有机体", "単なるツール", "时代遅れの产物"],
        correctAnswer: 1,
        explanation: "言語は生きた有机体であり、常に変容し続けています。",
      },
      {
        id: "q2",
        question: "意味转移と深く関わっている的是什么？",
        options: ["技術革新", "社会的文脈", "経済状況", "国際関係"],
        correctAnswer: 1,
        explanation: "このような意味の转移は、社会的文脈と深くに関わっています。",
      },
    ],
    jlptLevel: "N1",
    tags: ["linguistics", "language", "semantics"],
    estimatedTime: 15,
    createdAt: "2024-06-18",
    updatedAt: "2024-06-18",
  },
  {
    id: "read-040",
    title: "JLPT N1 - Post-Modern Society",
    passageText:
      "ポストモダン社会において、絶対的価値観は解体されました。大きい な物語は力を失い、個人の解釈多样性のみが残されました。この状况は、自由と不安を同時に中生む两面性を内有しています。自己の再構築が現代人に课せられた新たな課題と言えましょう。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "ポストモダン社会で力を失った的是什么？",
        options: ["個人", "大きい な物語", "技術", "経済"],
        correctAnswer: 1,
        explanation: "大きい な物語は力を失い...",
      },
      {
        id: "q2",
        question: "この状况が中生む两面性とは？",
        options: ["安全と危険", "自由と不安", "豊かと貧しさ", "個人と集団"],
        correctAnswer: 1,
        explanation: "この状况は、自由と不安を同時に中生む两面성을内有しています。",
      },
    ],
    jlptLevel: "N1",
    tags: ["philosophy", "postmodern", "society"],
    estimatedTime: 15,
    createdAt: "2024-06-19",
    updatedAt: "2024-06-19",
  },
  {
    id: "read-041",
    title: "JLPT N1 - Artificial Intelligence Ethics",
    passageText:
      "AI倫理は現代の紧要な课题です。アルゴリズムのbiasが社会的不公平を再生産する恐れがあります。また、説明責任の所在が曖昧であることも問題视されています。技術の进步と倫理的配慮のバランス를 어떻게 맞출 것인가が問われています。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "アルゴリズムのbiasが中生む恐れがある是什么？",
        options: ["技术进步", "社会的不公平の再生産", "经济增长", "国际合作"],
        correctAnswer: 1,
        explanation: "アルゴリズムのbiasが社会的不公平を再生産する恐れがあります。",
      },
      {
        id: "q2",
        question: "什么问题也被指出？",
        options: ["技术水平", "説明責任の所在が曖昧", "用户数量", "成本控制"],
        correctAnswer: 1,
        explanation: "また、説明責任の所在が曖昧であることも問題视されています。",
      },
    ],
    jlptLevel: "N1",
    tags: ["AI", "ethics", "technology"],
    estimatedTime: 15,
    createdAt: "2024-06-20",
    updatedAt: "2024-06-20",
  },
  {
    id: "read-042",
    title: "JLPT N1 - Hermeneutics and Interpretation",
    passageText:
      "解釈学は、文本や歴史に対する理解の方法を考察する学问です。読者は自分の前で立ち上がる文本と对话を通じて、新たな意味を生成します。この过程において、読者の前理解は無視できません。текст の意味は永远に确定するものではなく、常に开かれた状态にあります。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "解釈学が考察的是什么？",
        options: ["自然科学", "理解の方法", "経済理論", "法律制度"],
        correctAnswer: 1,
        explanation: "解釈学は、文本や歴史に対する理解の方法を考察する学问です。",
      },
      {
        id: "q2",
        question: "текст の意味について作者の见解は？",
        options: ["永远に確定する", "常に开まれた状態にある", "唯一の意味を持つ", "読者と无关"],
        correctAnswer: 1,
        explanation: "текст の意味は永远に确定するものではなく、常に开かれた状态にあります。",
      },
    ],
    jlptLevel: "N1",
    tags: ["hermeneutics", "philosophy", "interpretation"],
    estimatedTime: 15,
    createdAt: "2024-06-21",
    updatedAt: "2024-06-21",
  },

  // Extra Items for More Testing
  {
    id: "read-043",
    title: "JLPT N5 - Time to Get Up",
    passageText: "私は毎朝六時半に起きます。七時に朝ご飯を食べます。八時に家を出ます。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "何時に起きますか？",
        options: ["六時", "六時半", "七時", "五時半"],
        correctAnswer: 1,
        explanation: "私は毎朝六時半に起きます。",
      },
    ],
    jlptLevel: "N5",
    tags: ["morning", "routine", "time"],
    estimatedTime: 5,
    createdAt: "2024-06-22",
    updatedAt: "2024-06-22",
  },
  {
    id: "read-044",
    title: "JLPT N4 - Study Abroad",
    passageText: "来年、日本に留学する計画を立てています。日本語学校に通って、N1合格が目標です。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "著者は来年干什么？",
        options: ["旅行", "留学", "出張", "研修"],
        correctAnswer: 1,
        explanation: "来年、日本に留学する計画を立てています。",
      },
    ],
    jlptLevel: "N4",
    tags: ["study-abroad", "plan", "goal"],
    estimatedTime: 8,
    createdAt: "2024-06-23",
    updatedAt: "2024-06-23",
  },
  {
    id: "read-045",
    title: "JLPT N3 - Environmental Protection",
    passageText:
      "環境保護は人類永远的テーマです。Carbon emission の削減が迫切的な課題となっています。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "環境保護はどのようなテーマですか？",
        options: ["一时的", "流行的", "人類永远的", "経済的"],
        correctAnswer: 2,
        explanation: "環境保護は人類永远的テーマです。",
      },
    ],
    jlptLevel: "N3",
    tags: ["environment", "protection", "climate"],
    estimatedTime: 10,
    createdAt: "2024-06-24",
    updatedAt: "2024-06-24",
  },
  {
    id: "read-046",
    title: "JLPT N2 - Social Media Impact",
    passageText:
      "SNSは现代人の暮らし不可或缺的一部分となりました。情報伝播の速度と範囲は、かつてなかったレベルに達しています。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "SNSは现代人の暮らしにとって怎样的存在ですか？",
        options: ["无关紧要", "不可或缺的一部分", "一时的流行", "年轻人的专利"],
        correctAnswer: 1,
        explanation: "SNSは现代人の暮らし不可或缺的一部分となりました。",
      },
    ],
    jlptLevel: "N2",
    tags: ["SNS", "social-media", "communication"],
    estimatedTime: 12,
    createdAt: "2024-06-25",
    updatedAt: "2024-06-25",
  },
  {
    id: "read-047",
    title: "JLPT N1 - Phenomenology of Perception",
    passageText: "知覚の现象学は、人間の意识と世界の关係を再考させる旷の学問です。",
    comprehensionQuestions: [
      {
        id: "q1",
        question: "知覚の现象学はどのような学問ですか？",
        options: ["自然科学", "哲学の一分野", "心理学の基礎", "藝術理論"],
        correctAnswer: 1,
        explanation: "知覚の现象学は、人間の意识と世界の关係を再考させる旷の学問です。",
      },
    ],
    jlptLevel: "N1",
    tags: ["phenomenology", "perception", "philosophy"],
    estimatedTime: 15,
    createdAt: "2024-06-26",
    updatedAt: "2024-06-26",
  },
];

// Merge with main mock data
export const allMockReading = [...mockReading, ...mockReadingAdditional];

export const getReadingByLevel = (level: ReadingItem["jlptLevel"]) => {
  return mockReading.filter((item) => item.jlptLevel === level);
};

export const getReadingById = (id: string) => {
  return allMockReading.find((item) => item.id === id);
};

export const searchReading = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return mockReading.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.passageText.toLowerCase().includes(lowerQuery) ||
      item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
};
