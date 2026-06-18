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
// ─── Additional Reading Items ─────────────────────────────────────────────────
export const mockReadingAdditional: ReadingItem[] = [
  // N5 Items
  {
    id: "read-007",
    title: "JLPT N5 - At the Convenience Store",
    passageText: "あたらしいコンビニが私の家の近くにできました。店的商品很多。有食べ物和飲み物です。",
    comprehensionQuestions: [
      { id: "q1", question: "コンビニはどこにありますか？", options: ["会社の近く", "学校の近く", "家の近く", "駅の近く"], correctAnswer: 2, explanation: "あたらしいコンビニが私の家の近くにできました。" },
      { id: "q2", question: "朝のコーヒーはいくらですか？", options: ["百二十円", "三百五十円", "二百円", "五百円"], correctAnswer: 0, explanation: "百二十円です。" },
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
    passageText: "日本は四季が美しい国です。春は三月からです。桜が咲きます。夏はあ=Juneからです。秋は九月からです。冬は十二月からです。",
    comprehensionQuestions: [
      { id: "q1", question: "桜が咲く季節はいつですか？", options: ["夏", "春", "秋", "冬"], correctAnswer: 1, explanation: "春は三月からです。桜が咲きます。" },
      { id: "q2", question: "紅葉が美しい季節はいつですか？", options: ["春", "夏", "秋", "冬"], correctAnswer: 2, explanation: "秋は九月からです。紅葉が美しいです。" },
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
    passageText: "日本には様々な交通手段があります。電車の他に、バスや地下鉄があります。私の最寄りの駅は五分歩ところです。遠くへ行く時は、新幹線を使います。",
    comprehensionQuestions: [
      { id: "q1", question: "最寄りの駅までどのくらい時間がかかりますか？", options: ["十分", "五分", "十五分", "二十分"], correctAnswer: 1, explanation: "五分歩ところです。" },
      { id: "q2", question: "遠くへ行く時は何を使いますか？", options: ["電車", "バス", "新幹線", "タクシー"], correctAnswer: 2, explanation: "遠くへ行く時は、新幹線を使います。" },
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
    passageText: "日本は多くの祝日があります。一月一日は元日です。二月は節分です。三月はひな祭りです。五月は子供の日です。",
    comprehensionQuestions: [
      { id: "q1", question: "節分にすることは何ですか？", options: ["ひな人形を並べる", "鬼を追い払う", "星に願い事を書く", "家族が集まる"], correctAnswer: 1, explanation: "二月は節分です。鬼を追い払います。" },
      { id: "q2", question: "ひな祭りは誰の祝日ですか？", options: ["男の子の祝日", "女の子の祝日", "大人の祝日", "老人的祝日"], correctAnswer: 1, explanation: "三月はひな祭りです。女の子の祝日です。" },
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
    passageText: "近几年、远程办公在日本迅速普及。许多企业开始采用Hybrid工作方式。远程工作的优势包括：通勤时间减少、工作与生活balance改善。",
    comprehensionQuestions: [
      { id: "q1", question: "远程工作的主要优势是什么？", options: ["通勤时间增加", "コミュニケーション更容易", "通勤时间减少", "工作效率下降"], correctAnswer: 2, explanation: "通勤时间减少是远程工作的主要优势之一。" },
      { id: "q2", question: "文中提到的远程工作挑战不包括哪一项？", options: ["コミュニケーション难以取る", "働きすぎ", "通勤时间增加", "孤独感"], correctAnswer: 2, explanation: "通勤时间增加是优势不是挑战。" },
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
    passageText: "茶道は単なる飲み物を飲む行为ではなく、日本文化の缩図とも言える的精神实践活动です。茶道の基本原则包括「和敬清寂」四个字。",
    comprehensionQuestions: [
      { id: "q1", question: "茶道的基本原则是什么？", options: ["和食文化", "和敬清寂", "茶道礼仪", "日本精神"], correctAnswer: 1, explanation: "茶道の基本原则是「和敬清寂」。" },
      { id: "q2", question: "为什么茶室入口设计得很低？", options: ["节省空间", "体现精神——无论身份高低都应以礼相待", "美观设计", "传统规定"], correctAnswer: 1, explanation: "高贵的人也需要低头才能进入，这体现了茶道的精神。" },
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
    passageText: "人工智能（AI）技术的快速发展正在深刻改变我们的工作方式。AI提高了工作效率，降低了成本。许多重复性工作可以被AI系统高效完成。",
    comprehensionQuestions: [
      { id: "q1", question: "AI对重复性工作有什么影响？", options: ["增加工作量", "可以被高效完成", "需要更多人力", "完全消失"], correctAnswer: 1, explanation: "许多重复性工作可以被AI系统高效完成。" },
      { id: "q2", question: "作者对AI导致失业的看法是什么？", options: ["完全悲观", "完全乐观", "客观分析认为会创造新机会", "不关心"], correctAnswer: 2, explanation: "作者认为技术革命会取代一些工作，但也会创造新的就业机会。" },
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
    passageText: "持続可能な生活样式が越来越多的人に关注されています。買い物袋の使用削減が举げられます。Food Waste 的削减も重要です。",
    comprehensionQuestions: [
      { id: "q1", question: "哪些是可持续生活的方式？", options: ["尽量多买东西", "マイバッグの使用", "食物浪费", "开私家车"], correctAnswer: 1, explanation: "マイバッグを持ち歩く习惯是可持续生活的方式。" },
      { id: "q2", question: "Food Waste削減的好处是什么？", options: ["增加开支", "浪费 줄이고かつ家計節減", "需要更多时间", "对环境没有影响"], correctAnswer: 1, explanation: " 필요한分だけ買い物をすることは、浪費 줄이는だけでなく、家計の節減にも繋がります。" },
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
    passageText: "选择悖论（The Paradox of Choice）は、心理学者バリー・シュwartsが提唱した概念である。现代人は、かつてないほど多様な選択的权利を与られている。",
    comprehensionQuestions: [
      { id: "q1", question: "选择悖论是谁提出的？", options: ["フロイト", "バリー・シュwarts", "マズロー", "ユング"], correctAnswer: 1, explanation: "選択のパラドックスは、心理学者バリー・シュwartsが提唱した概念です。" },
      { id: "q2", question: "为什么选择过多会导致压力？", options: ["选择太简单", "每个选择都有潜在损失，损失带来的痛苦超过收益", "商品质量差", "没有足够的选择"], correctAnswer: 1, explanation: "任何一个選択にも潜在的な损失が伴う。そして、その损失带来的心理的痛苦は、对称的な利益带来的喜びを上回る。" },
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
    passageText: "「ものつくり」という概念は、日本の製造業の精髓を集約的に体現している。それは単なる製品製造を超えて、技術の人伝、品質へのこだわり、そして工匠の精神を含む包括的なphilosophyである。",
    comprehensionQuestions: [
      { id: "q1", question: "「ものつくり」の概念について正しくない説明はどれですか？", options: ["単なる製品製造である", "技術の传承を含む", "品質へのこだわりを含む", "工匠の精神を含む"], correctAnswer: 0, explanation: "「ものつくり」は単なる製品製造を超えて、包括的なphilosophyです。" },
      { id: "q2", question: "グローバル化する製造環境において何が不可欠ですか？", options: ["完全な自動化", "知識と経験の人移", "コストの増加", "国内生産のみ"], correctAnswer: 1, explanation: "移転先においても一定の品質水準を維持するためには、知識と経験の移転が不可欠である。" },
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
      { id: "q1", question: "著者が好きな動物は何ですか？", options: ["猫", "犬", "鳥", "魚"], correctAnswer: 1, explanation: "私は動物が好きです。特に犬が好きです。" },
      { id: "q2", question: "ポチは何歳ですか？", options: ["一歳", "二歳", "三歳", "四歳"], correctAnswer: 2, explanation: "名前はポチです。三歳です。" },
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
    passageText: "日本の学校教育について紹介します。小学は六年です。中学は三年です。高校は三年です。",
    comprehensionQuestions: [
      { id: "q1", question: "日本の高校は何年ですか？", options: ["二年", "三年", "四年", "五年"], correctAnswer: 1, explanation: "高校は三年です。" },
      { id: "q2", question: "授業は何時に始まりますか？", options: ["八時", "九時", "十時", "七時"], correctAnswer: 1, explanation: "授業は九時に始まります。" },
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
    passageText: "日本のポップカルチャーは世界的に影響を与えています。アニメとマンガは代表的なコンテンツです。",
    comprehensionQuestions: [
      { id: "q1", question: "日本のポップカルチャーの代表的是什么？", options: ["映画", "アニメとマンガ", "テレビ", "舞台"], correctAnswer: 1, explanation: "アニメとマンガは代表的なコンテンツです。" },
      { id: "q2", question: "ゲーム機で世界中に知られている企業はどれですか？", options: ["Sony only", "任天堂とソニー", "Microsoft", "Apple"], correctAnswer: 1, explanation: "任天堂やソニーのゲーム機が世界中で販売されています。" },
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
    passageText: "近年、メンタルヘルスの重要性が社会的に認知されつつあります。従来、日本社会では精神的な問題を一人で抱える傾向がありました。",
    comprehensionQuestions: [
      { id: "q1", question: "日本社会で従来どのような傾向がありましたか？", options: ["専門機関の的活动が盛ん", "精神的な問題を一人で抱える", "メンタルヘルスが重視された", "多くの人が助けを求める"], correctAnswer: 1, explanation: "従来、日本社会では精神的な問題を一人で抱える傾向がありました。" },
      { id: "q2", question: "mental health向左向右取り組みとして何が普及していますか？", options: ["药物治疗", "カウンセリングの普及", "運動禁止", "食事制限"], correctAnswer: 1, explanation: "まず、カウンセリングの普及が上げられます。" },
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
    passageText: "日常的な経験の奥深さを哲学的に探究する試みは、古くからあった。しかし、二十世紀になってようやく系統的な学問として成熟した。",
    comprehensionQuestions: [
      { id: "q1", question: "現象学が对象とした的是什么？", options: ["客観的世界", "経験の質本身", "科学的世界", "物質的世界"], correctAnswer: 1, explanation: "現象学は、「そのような経験の質本身」を对象とした。" },
      { id: "q2", question: "このアプローチの革新性は何でしたか？", options: ["科学の支持", "客観的説明への疑問", "技術の発展", "商業的成功"], correctAnswer: 1, explanation: "このアプローチの革新性は、客観的説明への疑問にあった。" },
    ],
    jlptLevel: "N1",
    tags: ["philosophy", "phenomenology", "theory"],
    estimatedTime: 25,
    createdAt: "2024-05-18",
    updatedAt: "2024-05-18",
  },
];

// Merge with main mock data
export const allMockReading = [...mockReading, ...mockReadingAdditional];

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
