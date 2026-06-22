export interface KanjiCharacter {
  char: string;
  sinoVietnamese: string;
  meaning: string;
  strokes: number;
  onyomi: string;
  kunyomi: string;
  mnemonic: string;
  radical: string; // Bộ thủ
  // SVG paths for stroke order animation
  // Coordinate space: 0 to 100
  svgPaths: string[];
}

export const KANJI_DATA: Record<string, KanjiCharacter[]> = {
  N5: [
    {
      char: "一",
      sinoVietnamese: "NHẤT",
      meaning: "Một (One)",
      strokes: 1,
      onyomi: "イチ (ichi), イツ (itsu)",
      kunyomi: "ひと-つ (hito-tsu)",
      mnemonic: "Hình ảnh một ngón tay nằm ngang hoặc một vạch kẻ duy nhất.",
      radical: "Nhất (一)",
      svgPaths: [
        "M 20,50 C 35,46 65,46 80,50"
      ]
    },
    {
      char: "二",
      sinoVietnamese: "NHỊ",
      meaning: "Hai (Two)",
      strokes: 2,
      onyomi: "ニ (ni), ジ (ji)",
      kunyomi: "ふta-つ (futa-tsu)",
      mnemonic: "Hai vạch kẻ ngang song song biểu thị số hai.",
      radical: "Nhị (二)",
      svgPaths: [
        "M 30,35 C 40,32 60,32 70,35",
        "M 20,68 C 35,63 65,63 80,68"
      ]
    },
    {
      char: "三",
      sinoVietnamese: "TAM",
      meaning: "Ba (Three)",
      strokes: 3,
      onyomi: "サン (san)",
      kunyomi: "みっ-つ (mit-tsu)",
      mnemonic: "Ba vạch kẻ ngang chồng lên nhau biểu thị số ba.",
      radical: "Nhất (一)",
      svgPaths: [
        "M 28,26 C 38,23 62,23 72,26",
        "M 33,48 C 43,45 57,45 67,48",
        "M 18,72 C 33,67 67,67 82,72"
      ]
    },
    {
      char: "川",
      sinoVietnamese: "XUYÊN",
      meaning: "Sông (River)",
      strokes: 3,
      onyomi: "セン (sen)",
      kunyomi: "かわ (kawa)",
      mnemonic: "Hình ảnh dòng sông chảy với 3 làn nước song song.",
      radical: "Xuyên (巛)",
      svgPaths: [
        "M 32,22 C 32,35 30,65 24,78",
        "M 50,22 L 50,75",
        "M 72,16 L 72,82"
      ]
    },
    {
      char: "日",
      sinoVietnamese: "NHẬT",
      meaning: "Mặt trời, Ngày (Sun, Day)",
      strokes: 4,
      onyomi: "ニチ (nichi), ジツ (jitsu)",
      kunyomi: "ひ (hi), び (bi), か (ka)",
      mnemonic: "Hình vẽ mặt trời tròn có nhân ở giữa, được biến đổi thành hình vuông cho dễ viết.",
      radical: "Nhật (日)",
      svgPaths: [
        "M 30,20 L 30,80",
        "M 30,22 L 70,22 L 70,80",
        "M 30,50 L 70,50",
        "M 30,78 L 70,78"
      ]
    },
    {
      char: "月",
      sinoVietnamese: "NGUYỆT",
      meaning: "Mặt trăng, Tháng (Moon, Month)",
      strokes: 4,
      onyomi: "ゲツ (getsu), ガツ (gatsu)",
      kunyomi: "つき (tsuki)",
      mnemonic: "Hình ảnh vầng trăng khuyết lơ lửng trên trời đêm.",
      radical: "Nguyệt (月)",
      svgPaths: [
        "M 32,18 C 32,32 30,62 20,82",
        "M 32,20 L 68,20 L 68,82",
        "M 32,45 L 68,45",
        "M 32,65 L 68,65"
      ]
    },
    {
      char: "火",
      sinoVietnamese: "HỎA",
      meaning: "Lửa (Fire)",
      strokes: 4,
      onyomi: "カ (ka)",
      kunyomi: "ひ (hi), び (bi)",
      mnemonic: "Hình ảnh một đống lửa đang bùng cháy dữ dội.",
      radical: "Hỏa (火)",
      svgPaths: [
        "M 28,38 C 24,42 20,50 18,58",
        "M 72,36 C 76,41 80,48 82,56",
        "M 48,16 C 48,45 35,68 18,78",
        "M 48,46 C 56,54 70,68 84,78"
      ]
    },
    {
      char: "水",
      sinoVietnamese: "THỦY",
      meaning: "Nước (Water)",
      strokes: 4,
      onyomi: "スイ (sui)",
      kunyomi: "みず (mizu)",
      mnemonic: "Hình ảnh dòng nước chảy xiết ở giữa và các bọt nước bắn ra hai bên.",
      radical: "Thủy (水)",
      svgPaths: [
        "M 50,15 L 50,75 C 50,82 45,82 40,78",
        "M 24,38 L 50,38",
        "M 20,72 L 50,38",
        "M 76,38 L 50,54 L 80,76"
      ]
    },
    {
      char: "木",
      sinoVietnamese: "MỘC",
      meaning: "Cây (Tree)",
      strokes: 4,
      onyomi: "モク (moku), ボク (boku)",
      kunyomi: "き (ki), ko (ko)",
      mnemonic: "Hình vẽ một cái cây với thân thẳng đứng, cành ngang và rễ đâm sâu dưới đất.",
      radical: "Mộc (木)",
      svgPaths: [
        "M 20,38 L 80,38",
        "M 50,15 L 50,82",
        "M 50,38 C 42,50 28,68 16,78",
        "M 50,38 C 58,50 72,68 84,78"
      ]
    },
    {
      char: "金",
      sinoVietnamese: "KIM",
      meaning: "Vàng, Tiền (Gold, Money)",
      strokes: 8,
      onyomi: "キン (kin), コン (kon)",
      kunyomi: "かね (kane), gane (gane)",
      mnemonic: "Bên dưới mái nhà chứa những quặng vàng lấp lánh chôn giấu trong lòng đất.",
      radical: "Kim (金)",
      svgPaths: [
        "M 50,14 C 44,18 28,28 18,34",
        "M 50,14 C 56,18 72,28 82,34",
        "M 32,44 L 68,44",
        "M 50,34 L 50,58",
        "M 26,58 L 74,58",
        "M 36,52 Q 33,52 32,54",
        "M 64,52 Q 67,52 68,54",
        "M 16,78 L 84,78"
      ]
    }
  ],
  N4: [
    {
      char: "会",
      sinoVietnamese: "HỘI",
      meaning: "Gặp gỡ, Hội họp (Meet)",
      strokes: 6,
      onyomi: "カイ (kai), エ (e)",
      kunyomi: "あ-う (a-u)",
      mnemonic: "Hai người cùng gặp nhau dưới mái nhà chung.",
      radical: "Nhân (人)",
      svgPaths: [
        "M 50,15 C 42,20 28,30 18,38",
        "M 50,15 C 58,20 72,30 82,38",
        "M 36,46 L 64,46",
        "M 30,56 L 70,56",
        "M 36,56 L 36,78",
        "M 64,56 L 64,78"
      ]
    },
    {
      char: "社",
      sinoVietnamese: "XÃ",
      meaning: "Công ty, Đền thờ (Company, Shrine)",
      strokes: 7,
      onyomi: "シャ (sha)",
      kunyomi: "やしろ (yashiro)",
      mnemonic: "Khu đất đền thờ linh thiêng hiển thị dưới ánh mặt trời.",
      radical: "Thị (⽰)",
      svgPaths: [
        "M 28,15 L 28,24",
        "M 18,28 L 38,28 C 30,36 22,50 16,60",
        "M 30,42 L 30,82",
        "M 30,48 L 42,78",
        "M 48,32 L 80,32",
        "M 64,18 L 64,82",
        "M 44,80 L 86,80"
      ]
    },
    {
      char: "店",
      sinoVietnamese: "TIẾM",
      meaning: "Cửa hàng (Shop)",
      strokes: 8,
      onyomi: "テン (ten)",
      kunyomi: "みせ (mise)",
      mnemonic: "Cửa hàng nằm dưới bóng mát của một mái hiên nhà.",
      radical: "Nghiễm (⼴)",
      svgPaths: [
        "M 50,12 L 50,18",
        "M 24,24 L 80,24",
        "M 30,24 C 30,42 26,65 18,78",
        "M 44,38 L 74,38",
        "M 44,38 L 44,56 L 74,56",
        "M 40,68 L 78,68",
        "M 48,68 L 48,82 L 72,82",
        "M 72,68 L 72,82"
      ]
    }
  ],
  N3: [
    {
      char: "業",
      sinoVietnamese: "NGHIỆP",
      meaning: "Nghề nghiệp, Công nghiệp (Industry, Work)",
      strokes: 13,
      onyomi: "ギョウ (gyou), ゴウ (gou)",
      kunyomi: "わざ (waza)",
      mnemonic: "Nhiều người hợp lực làm việc chăm chỉ để tạo ra sự nghiệp lớn.",
      radical: "Mộc (木)",
      svgPaths: [
        "M 32,18 L 40,28",
        "M 68,18 L 60,28",
        "M 26,36 L 26,48",
        "M 74,36 L 74,48",
        "M 18,48 L 82,48",
        "M 36,48 C 36,54 32,60 28,64",
        "M 64,48 C 64,54 68,60 72,64",
        "M 15,68 L 85,68",
        "M 50,12 L 50,90",
        "M 32,80 L 32,90",
        "M 68,80 L 68,90"
      ]
    },
    {
      char: "薬",
      sinoVietnamese: "DƯỢC",
      meaning: "Thuốc (Medicine)",
      strokes: 16,
      onyomi: "ヤク (yaku)",
      kunyomi: "くすり (kusuri)",
      mnemonic: "Thảo mộc (bộ Thảo) mang lại niềm vui (lạc/nhạc) chính là Thuốc chữa bệnh.",
      radical: "Thảo (艸)",
      svgPaths: [
        "M 30,16 L 30,24",
        "M 70,16 L 70,24",
        "M 18,24 L 82,24",
        "M 32,38 L 68,38",
        "M 24,48 L 76,48",
        "M 50,32 L 50,78",
        "M 28,62 Q 22,62 18,65",
        "M 72,62 Q 78,62 82,65"
      ]
    }
  ],
  N2: [
    {
      char: "際",
      sinoVietnamese: "TẾ",
      meaning: "Ranh giới, Khi (Boundary, Occasion)",
      strokes: 14,
      onyomi: "サイ (sai)",
      kunyomi: "きわ (kiwa)",
      mnemonic: "Đứng bên vách đá cúng tế tại ranh giới phân chia lãnh thổ.",
      radical: "Phụ (⻖)",
      svgPaths: [
        "M 20,20 C 26,20 28,30 26,42 C 24,54 18,68 14,78",
        "M 28,32 L 28,82",
        "M 45,18 L 75,18",
        "M 60,18 L 60,38",
        "M 38,45 L 82,45",
        "M 46,58 C 42,66 36,74 28,82",
        "M 64,58 C 68,66 76,74 86,82"
      ]
    }
  ],
  N1: [
    {
      char: "顕",
      sinoVietnamese: "HIỂN",
      meaning: "Hiển hiện, Rõ ràng (Manifest, Clear)",
      strokes: 18,
      onyomi: "ケン (ken)",
      kunyomi: "あらわ-れる (arawa-reru)",
      mnemonic: "Dùng mắt chiếu sáng rõ ràng mọi ngóc ngách.",
      radical: "Hiệt (⾴)",
      svgPaths: [
        "M 20,20 L 45,20",
        "M 32,20 L 32,45",
        "M 18,48 L 48,48",
        "M 55,20 L 85,20",
        "M 70,20 L 70,82",
        "M 55,50 L 85,50",
        "M 55,80 L 85,80"
      ]
    }
  ],
  "214 Bộ thủ": [
    {
      char: "一",
      sinoVietnamese: "NHẤT",
      meaning: "Một (One)",
      strokes: 1,
      onyomi: "イチ (ichi), イツ (itsu)",
      kunyomi: "ひと-つ (hito-tsu)",
      mnemonic: "Hình ảnh một ngón tay nằm ngang hoặc một vạch kẻ duy nhất.",
      radical: "Nhất (一)",
      svgPaths: [
        "M 20,50 C 35,46 65,46 80,50"
      ]
    },
    {
      char: "二",
      sinoVietnamese: "NHỊ",
      meaning: "Hai (Two)",
      strokes: 2,
      onyomi: "ニ (ni), ジ (ji)",
      kunyomi: "ふta-つ (futa-tsu)",
      mnemonic: "Hai vạch kẻ ngang song song biểu thị số hai.",
      radical: "Nhị (二)",
      svgPaths: [
        "M 30,35 C 40,32 60,32 70,35",
        "M 20,68 C 35,63 65,63 80,68"
      ]
    },
    {
      char: "川",
      sinoVietnamese: "XUYÊN",
      meaning: "Sông (River)",
      strokes: 3,
      onyomi: "セン (sen)",
      kunyomi: "かわ (kawa)",
      mnemonic: "Hình ảnh dòng sông chảy với 3 làn nước song song.",
      radical: "Xuyên (巛)",
      svgPaths: [
        "M 32,22 C 32,35 30,65 24,78",
        "M 50,22 L 50,75",
        "M 72,16 L 72,82"
      ]
    },
    {
      char: "日",
      sinoVietnamese: "NHẬT",
      meaning: "Mặt trời, Ngày (Sun, Day)",
      strokes: 4,
      onyomi: "ニチ (nichi), ジツ (jitsu)",
      kunyomi: "ひ (hi), び (bi), か (ka)",
      mnemonic: "Hình vẽ mặt trời tròn có nhân ở giữa, được biến đổi thành hình vuông cho dễ viết.",
      radical: "Nhật (日)",
      svgPaths: [
        "M 30,20 L 30,80",
        "M 30,22 L 70,22 L 70,80",
        "M 30,50 L 70,50",
        "M 30,78 L 70,78"
      ]
    },
    {
      char: "月",
      sinoVietnamese: "NGUYỆT",
      meaning: "Mặt trăng, Tháng (Moon, Month)",
      strokes: 4,
      onyomi: "ゲツ (getsu), ガツ (gatsu)",
      kunyomi: "つき (tsuki)",
      mnemonic: "Hình ảnh vầng trăng khuyết lơ lửng trên trời đêm.",
      radical: "Nguyệt (月)",
      svgPaths: [
        "M 32,18 C 32,32 30,62 20,82",
        "M 32,20 L 68,20 L 68,82",
        "M 32,45 L 68,45",
        "M 32,65 L 68,65"
      ]
    },
    {
      char: "火",
      sinoVietnamese: "HỎA",
      meaning: "Lửa (Fire)",
      strokes: 4,
      onyomi: "カ (ka)",
      kunyomi: "ひ (hi), び (bi)",
      mnemonic: "Hình ảnh một đống lửa đang bùng cháy dữ dội.",
      radical: "Hỏa (火)",
      svgPaths: [
        "M 28,38 C 24,42 20,50 18,58",
        "M 72,36 C 76,41 80,48 82,56",
        "M 48,16 C 48,45 35,68 18,78",
        "M 48,46 C 56,54 70,68 84,78"
      ]
    },
    {
      char: "水",
      sinoVietnamese: "THỦY",
      meaning: "Nước (Water)",
      strokes: 4,
      onyomi: "スイ (sui)",
      kunyomi: "みず (mizu)",
      mnemonic: "Hình ảnh dòng nước chảy xiết ở giữa và các bọt nước bắn ra hai bên.",
      radical: "Thủy (水)",
      svgPaths: [
        "M 50,15 L 50,75 C 50,82 45,82 40,78",
        "M 24,38 L 50,38",
        "M 20,72 L 50,38",
        "M 76,38 L 50,54 L 80,76"
      ]
    },
    {
      char: "木",
      sinoVietnamese: "MỘC",
      meaning: "Cây (Tree)",
      strokes: 4,
      onyomi: "モク (moku), ボク (boku)",
      kunyomi: "ki (ki), ko (ko)",
      mnemonic: "Hình vẽ một cái cây với thân thẳng đứng, cành ngang và rễ đâm sâu dưới đất.",
      radical: "Mộc (木)",
      svgPaths: [
        "M 20,38 L 80,38",
        "M 50,15 L 50,82",
        "M 50,38 C 42,50 28,68 16,78",
        "M 50,38 C 58,50 72,68 84,78"
      ]
    },
    {
      char: "金",
      sinoVietnamese: "KIM",
      meaning: "Vàng, Tiền (Gold, Money)",
      strokes: 8,
      onyomi: "KIN (kin), KON (kon)",
      kunyomi: "kane (kane), gane (gane)",
      mnemonic: "Bên dưới mái nhà chứa những quặng vàng lấp lánh chôn giấu trong lòng đất.",
      radical: "Kim (金)",
      svgPaths: [
        "M 50,14 C 44,18 28,28 18,34",
        "M 50,14 C 56,18 72,28 82,34",
        "M 32,44 L 68,44",
        "M 50,34 L 50,58",
        "M 26,58 L 74,58",
        "M 36,52 Q 33,52 32,54",
        "M 64,52 Q 67,52 68,54",
        "M 16,78 L 84,78"
      ]
    }
  ]
};
