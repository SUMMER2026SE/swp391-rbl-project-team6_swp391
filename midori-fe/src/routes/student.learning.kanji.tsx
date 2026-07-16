import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Check,
  Lock,
  Heart,
  Play,
  Download,
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  Award,
  ChevronRight,
  Info,
  Trash2,
  Plus,
  Printer,
  Loader2,
  X,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { KANJI_DATA, type KanjiCharacter } from "@/data/kanji-data";
import { speakJapanese } from "@/data/japanese-learning-data";
import { WorksheetPreviewComponent } from "@/components/WorksheetPreviewComponent";
import { KanjiStrokePlayer } from "@/components/student/kanji/KanjiStrokePlayer";

export const Route = createFileRoute("/student/learning/kanji")({
  component: KanjiLearningPage,
});

const STUDENT_LEVEL = "N5 - Cơ bản"; // Mock current student level

interface ExtendedKanjiCharacter extends KanjiCharacter {
  id?: string; // UUID from PostgreSQL
  svgAvailable?: boolean; // Whether SVG stroke data exists in DB
  examples?: { word: string; meaning: string }[];
}

const MOCK_KANJI_DATABASE: Record<string, Omit<ExtendedKanjiCharacter, "char">> = {
  今: {
    sinoVietnamese: "KIM",
    meaning: "Bây giờ (Now)",
    strokes: 4,
    onyomi: "コン (kon), キン (kin)",
    kunyomi: "いま (ima)",
    mnemonic: "Hình ảnh một chiếc ô che chở cho con người ngay tại thời điểm HIỆN TẠI.",
    radical: "Nhân (人)",
    svgPaths: [
      "M 52,15 C 46,28 36,40 20,48", // Stroke 1: Roof left diagonal
      "M 52,15 C 58,28 68,40 82,48", // Stroke 2: Roof right diagonal
      "M 36,46 C 45,44 55,44 68,46", // Stroke 3: Horizontal line
      "M 35,64 L 54,64 L 47,85 C 45,88 40,88 38,82", // Stroke 4: Curved hook
    ],
    examples: [
      { word: "今日 (きょう - kyou)", meaning: "Hôm nay" },
      { word: "今月 (こんげつ - kongetsu)", meaning: "Tháng này" },
    ],
  },
  玉: {
    sinoVietnamese: "NGỌC",
    meaning: "Đá quý (Gem, Jade)",
    strokes: 5,
    onyomi: "ギョク (gyoku)",
    kunyomi: "たま (tama)",
    mnemonic: "Vua (Vương 王) đeo thêm một viên ngọc quý ở bên sườn.",
    radical: "Ngọc (玉)",
    svgPaths: [
      "M 25,25 L 75,25",
      "M 50,25 L 50,75",
      "M 30,50 L 70,50",
      "M 20,78 L 80,78",
      "M 65,65 A 4,4 0 1,1 65,64.9",
    ],
    examples: [
      { word: "玉子 (たまご - tamago)", meaning: "Quả trứng" },
      { word: "お玉 (おたま - otama)", meaning: "Cái muôi múc canh" },
    ],
  },
  交: {
    sinoVietnamese: "GIAO",
    meaning: "Giao nhau, trao đổi (Cross, Intersect)",
    strokes: 6,
    onyomi: "コウ (kou)",
    kunyomi: "まじ-わる (maji-waru)",
    mnemonic: "Một người đứng chéo chân để GIAO lưu với người khác.",
    radical: "Đầu (亠)",
    svgPaths: [
      "M 50,15 L 50,25",
      "M 20,32 L 80,32",
      "M 45,45 C 40,55 30,70 20,80",
      "M 55,45 C 60,55 70,70 80,80",
      "M 35,55 L 65,55",
      "M 35,68 L 65,68",
    ],
    examples: [
      { word: "交番 (こうばん - kouban)", meaning: "Đồn cảnh sát" },
      { word: "交通 (こうつう - koutsuu)", meaning: "Giao thông" },
    ],
  },
  合: {
    sinoVietnamese: "HỢP",
    meaning: "Hợp, vừa vặn (Fit, Join)",
    strokes: 6,
    onyomi: "ゴウ (gou), ガッ (gat)",
    kunyomi: "あ-u (a-u)",
    mnemonic: "Ba người (Nhân 合) cùng chung một miệng (Khẩu 口) bàn luận rất PHÙ HỢP.",
    radical: "Khẩu (口)",
    svgPaths: [
      "M 50,15 L 20,40",
      "M 50,15 L 80,40",
      "M 30,42 L 70,42",
      "M 35,55 L 35,80",
      "M 35,57 L 65,57 L 65,80",
      "M 35,78 L 65,78",
    ],
    examples: [
      { word: "合格 (ごうかく - goukaku)", meaning: "Đỗ, thi đỗ" },
      { word: "試合 (しあい - shiai)", meaning: "Trận đấu" },
    ],
  },
  歩: {
    sinoVietnamese: "BỘ",
    meaning: "Bước đi (Step)",
    strokes: 7,
    onyomi: "ホ (ho), ブ (bu)",
    kunyomi: "ある-く (aru-ku)",
    mnemonic: "Dừng lại (Chỉ 止) rồi đi tiếp một ít (Thiểu 少) chính là BƯỚC ĐI.",
    radical: "Chỉ (止)",
    svgPaths: [
      "M 50,15 L 50,45",
      "M 30,30 L 70,30",
      "M 35,45 L 65,45",
      "M 25,60 L 75,60",
      "M 40,60 L 30,80",
      "M 60,60 L 70,80",
      "M 50,70 L 50,85",
    ],
    examples: [
      { word: "歩行者 (ほこうしゃ - hokousha)", meaning: "Người đi bộ" },
      { word: "散歩 (さんぽ - sanpo)", meaning: "Đi dạo" },
    ],
  },
  步: {
    sinoVietnamese: "BỘ",
    meaning: "Bước đi (Step)",
    strokes: 7,
    onyomi: "ホ (ho), ブ (bu)",
    kunyomi: "ある-く (aru-ku)",
    mnemonic: "Dừng lại (Chỉ 止) rồi đi tiếp một ít (Thiểu 少) chính là BƯỚC ĐI.",
    radical: "Chỉ (止)",
    svgPaths: [
      "M 50,15 L 50,45",
      "M 30,30 L 70,30",
      "M 35,45 L 65,45",
      "M 25,60 L 75,60",
      "M 40,60 L 30,80",
      "M 60,60 L 70,80",
      "M 50,70 L 50,85",
    ],
    examples: [
      { word: "歩行者 (ほこうしゃ - hokousha)", meaning: "Người đi bộ" },
      { word: "散歩 (さんぽ - sanpo)", meaning: "Đi dạo" },
    ],
  },
  茶: {
    sinoVietnamese: "TRÀ",
    meaning: "Trà, chè (Tea)",
    strokes: 9,
    onyomi: "チャ (cha), サ (sa)",
    kunyomi: "cha (cha)",
    mnemonic: "Cây cỏ (Thảo 艹) dưới mái nhà (Nhân Nhân) trồng trên đất gỗ (Mộc 木) là chè TRÀ.",
    radical: "Thảo (艹)",
    svgPaths: [
      "M 20,25 L 80,25",
      "M 35,15 L 35,25",
      "M 65,15 L 65,25",
      "M 50,30 L 25,48",
      "M 50,30 L 75,48",
      "M 50,48 L 50,85",
      "M 50,55 L 25,65",
      "M 50,55 L 75,65",
      "M 25,82 L 75,82",
    ],
    examples: [
      { word: "お茶 (おちゃ - ocha)", meaning: "Trà xanh" },
      { word: "紅茶 (こうちゃ - koucha)", meaning: "Hồng trà" },
    ],
  },
  弓: {
    sinoVietnamese: "CUNG",
    meaning: "Cái cung (Bow)",
    strokes: 3,
    onyomi: "キュウ (kyuu)",
    kunyomi: "yumi (yumi)",
    mnemonic: "Hình vẽ mô phỏng chiếc CUNG tên có dây căng.",
    radical: "Cung (弓)",
    svgPaths: [
      "M 25,20 L 70,20 C 70,20 70,40 55,40",
      "M 55,40 L 55,55 L 75,55",
      "M 75,55 C 75,70 60,85 25,85",
    ],
    examples: [
      { word: "弓道 (きゅうどう - kyuudou)", meaning: "Cung đạo" },
      { word: "半弓 (はんきゅう - hankyuu)", meaning: "Cung ngắn" },
    ],
  },
  雲: {
    sinoVietnamese: "VÂN",
    meaning: "Mây (Cloud)",
    strokes: 12,
    onyomi: "ウン (un)",
    kunyomi: "kumo (kumo)",
    mnemonic: "Cơn mưa (Vũ 雨) ngưng đọng trên bầu trời tạo thành các áng MÂY (Vân Vân).",
    radical: "Vũ (雨)",
    svgPaths: [
      "M 20,20 L 80,20",
      "M 30,32 L 30,55 L 70,55 L 70,32",
      "M 50,20 L 50,55",
      "M 35,40 A 3,3 0 1,1 35,39.9",
      "M 65,40 A 3,3 0 1,1 65,39.9",
      "M 35,48 A 3,3 0 1,1 35,47.9",
      "M 65,48 A 3,3 0 1,1 65,47.9",
      "M 30,68 C 45,64 55,64 70,68",
      "M 45,68 L 30,85",
      "M 55,68 C 65,75 75,80 80,85",
    ],
    examples: [
      { word: "雨雲 (あまぐも - amagumo)", meaning: "Mây mưa" },
      { word: "雲海 (うんかい - unkai)", meaning: "Biển mây" },
    ],
  },
  算: {
    sinoVietnamese: "TOÁN",
    meaning: "Tính toán (Calculate)",
    strokes: 14,
    onyomi: "サン (san)",
    kunyomi: "soro (soro)",
    mnemonic: "Dùng thẻ tre (Trúc ⺮) và hai tay (Lập 廾) nâng bàn tính để TÍNH TOÁN.",
    radical: "Trúc (⺮)",
    svgPaths: [
      "M 25,18 L 45,18",
      "M 35,10 L 35,25",
      "M 55,18 L 75,18",
      "M 65,10 L 65,25",
      "M 20,38 L 80,38",
      "M 30,48 L 70,48",
      "M 30,38 L 30,65 L 70,65 L 70,38",
      "M 40,48 L 40,60",
      "M 60,48 L 60,60",
      "M 20,72 L 80,72",
      "M 35,72 L 35,88",
      "M 65,72 L 65,88",
      "M 20,88 L 80,88",
      "M 50,72 L 50,88",
    ],
    examples: [
      { word: "計算 (けいさん - keisan)", meaning: "Tính toán" },
      { word: "予算 (よさん - yosan)", meaning: "Ngân sách" },
    ],
  },
  小: {
    sinoVietnamese: "TIỂU",
    meaning: "Nhỏ (Small)",
    strokes: 3,
    onyomi: "ショウ (shou)",
    kunyomi: "ちい-さい (chii-sai)",
    mnemonic: "Một đường thẳng đứng bị chia nhỏ thành hai phần nhỏ hai bên.",
    radical: "Tiểu (小)",
    svgPaths: [
      "M 50,15 L 50,80 C 50,80 48,85 40,80",
      "M 25,45 C 23,55 18,65 12,70",
      "M 75,45 C 77,55 82,65 88,70",
    ],
    examples: [
      { word: "小学生 (しょうがくせい - shougakusei)", meaning: "Học sinh tiểu học" },
      { word: "小説 (しょうせつ - shousetsu)", meaning: "Tiểu thuyết" },
    ],
  },
};

function findKanjiCharacter(char: string): ExtendedKanjiCharacter | undefined {
  const mockFound = MOCK_KANJI_DATABASE[char];
  if (mockFound) {
    return { char, ...mockFound };
  }
  for (const level in KANJI_DATA) {
    const found = KANJI_DATA[level].find((k) => k.char === char.trim());
    if (found) return found;
  }
  return undefined;
}

// Helper to calculate Framer Motion keyframe times for perfectly synchronized stroke order animation loops
function getStrokeAnimationProps(idx: number, totalStrokes: number) {
  const strokeDuration = 0.8;
  const pauseDuration = 1.5;
  const totalPeriod = totalStrokes * strokeDuration + pauseDuration;

  const tStart = (idx * strokeDuration) / totalPeriod;
  const tEnd = ((idx + 1) * strokeDuration) / totalPeriod;

  return {
    animate: {
      pathLength: [0, 0, 1, 1],
    },
    transition: {
      times: [0, tStart, tEnd, 1],
      duration: totalPeriod,
      repeat: Infinity,
      ease: "linear" as const,
    },
  };
}

// Helper to resolve overlapping start points for numbering circles
function getProcessedLabels(svgPaths: string[]) {
  const raw = svgPaths.map((path, idx) => {
    const startMatch = path.match(/M\s*([\d.-]+)[\s,]+([\d.-]+)/i);
    let x = 50;
    let y = 50;
    if (startMatch) {
      x = parseFloat(startMatch[1]);
      y = parseFloat(startMatch[2]);
    }
    return { x, y, idx };
  });

  return raw.map((lbl, i) => {
    let finalX = lbl.x;
    let finalY = lbl.y;

    // If Stroke 2 starts exactly where Stroke 1 starts (like roof peak)
    if (i === 1 && Math.abs(lbl.x - raw[0].x) < 5 && Math.abs(lbl.y - raw[0].y) < 5) {
      finalX += 9; // Shift down-right along Stroke 2 line
      finalY += 6;
    }

    return { x: finalX, y: finalY, idx: lbl.idx };
  });
}

function generateStrokeOrderImages(kanji: KanjiCharacter): string[] {
  const images: string[] = [];
  const size = 100;

  kanji.svgPaths.forEach((path, idx) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw previous strokes in light gray
    const prevPathStr = kanji.svgPaths.slice(0, idx).join(" ");
    if (prevPathStr) {
      ctx.beginPath();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 5;
      const prevP2D = new Path2D(prevPathStr);
      ctx.stroke(prevP2D);
    }

    // Draw current stroke in deep indigo
    ctx.beginPath();
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 6;
    const currentP2D = new Path2D(path);
    ctx.stroke(currentP2D);

    images.push(canvas.toDataURL("image/png"));
  });

  return images;
}

function KanjiLearningPage() {
  const [activeTab, setActiveTab] = useState<"search" | "worksheet">("search");
  const [searchQuery, setSearchQuery] = useState<string>("今");
  const [selectedKanji, setSelectedKanji] = useState<KanjiCharacter | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPractice, setShowPractice] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [inputKanjiText, setInputKanjiText] = useState<string>("今 玉 交 合");
  const [searchReplayKey, setSearchReplayKey] = useState<number>(0);
  
  const [searchResult, setSearchResult] = useState<ExtendedKanjiCharacter | null>(null);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  // Cache resolved kanji characters (from real database) for the writing worksheet
  const [resolvedKanjiCache, setResolvedKanjiCache] = useState<Record<string, ExtendedKanjiCharacter>>({});
  const loadingCharsRef = useRef<Set<string>>(new Set());

  // Dynamically load details for characters in worksheet input that aren't in local static lists
  useEffect(() => {
    const chars = Array.from(inputKanjiText.replace(/\s+/g, ""));
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

    chars.forEach((char) => {
      // If already in local mock database or static N5 data, skip
      if (MOCK_KANJI_DATABASE[char] || findKanjiCharacter(char)) return;
      // If already resolved in cache, skip
      if (resolvedKanjiCache[char]) return;
      // If currently fetching, skip
      if (loadingCharsRef.current.has(char)) return;

      loadingCharsRef.current.add(char);

      fetch(`${BASE_URL}/kanji/${encodeURIComponent(char)}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("midori_access_token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then(async (json) => {
          if (json.success && json.data) {
            const d = json.data;
            let svgPaths: string[] = [];

            if (d.svgAvailable && d.id) {
              try {
                const svgRes = await fetch(`${BASE_URL}/kanji/${d.id}/svg`, {
                  headers: {
                    "Authorization": `Bearer ${localStorage.getItem("midori_access_token")}`,
                  },
                });
                if (svgRes.ok) {
                  const svgText = await svgRes.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(svgText, "image/svg+xml");
                  const strokePathsGroup = doc.querySelector('[id^="kvg:StrokePaths"]');
                  const paths = strokePathsGroup 
                    ? strokePathsGroup.querySelectorAll("path") 
                    : doc.querySelectorAll("path");
                  svgPaths = Array.from(paths).map((p) => p.getAttribute("d") || "");
                }
              } catch (e) {
                console.error("Failed to fetch SVG for", char, e);
              }
            }

            setResolvedKanjiCache((prev) => ({
              ...prev,
              [char]: {
                char: d.character,
                sinoVietnamese: d.radical ? `Bộ ${d.radical}` : "HÁN TỰ",
                meaning: d.meaning || "Chưa cập nhật",
                strokes: d.strokeCount || svgPaths.length || 0,
                onyomi: d.onyomi || "-",
                kunyomi: d.kunyomi || "-",
                radical: d.radical || "-",
                mnemonic: `Dữ liệu từ hệ thống (Trình độ: ${d.jlpt || "N/A"}).`,
                svgPaths: svgPaths,
              },
            }));
          }
        })
        .catch((err) => {
          console.error("Failed to resolve kanji in worksheet:", char, err);
        })
        .finally(() => {
          loadingCharsRef.current.delete(char);
        });
    });
  }, [inputKanjiText, resolvedKanjiCache]);

  const parseTextToKanji = (text: string) => {
    const chars = Array.from(text.replace(/\s+/g, ""));
    const list: KanjiCharacter[] = [];
    chars.forEach((char) => {
      const cached = resolvedKanjiCache[char];
      if (cached) {
        list.push(cached);
        return;
      }
      const found = findKanjiCharacter(char);
      if (found) {
        list.push(found);
      } else {
        list.push({
          char: char,
          sinoVietnamese: "HÁN TỰ",
          meaning: "Nghĩa của chữ " + char,
          strokes: 0,
          onyomi: "-",
          kunyomi: "-",
          radical: "Bộ " + char,
          mnemonic: "Đang tải hoặc tự tạo.",
          svgPaths: [],
        });
      }
    });
    return list;
  };

  const previewKanjiList = parseTextToKanji(inputKanjiText);

  // Search logic (loads real database entries from backend API)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }
    const query = searchQuery.trim().toLowerCase();

    // 1. Search in local KANJI_DATA database (Sino-Vietnamese matches, meaning matches, etc.)
    let foundLocal: any = null;
    for (const level in KANJI_DATA) {
      const found = KANJI_DATA[level].find(
        (k) =>
          k.char.toLowerCase() === query ||
          k.sinoVietnamese.toLowerCase() === query ||
          k.sinoVietnamese.toLowerCase().includes(query) ||
          k.meaning.toLowerCase().includes(query) ||
          k.onyomi.toLowerCase().includes(query) ||
          k.kunyomi.toLowerCase().includes(query),
      );
      if (found) {
        foundLocal = found;
        break;
      }
    }

    // 2. Search in local MOCK_KANJI_DATABASE
    if (!foundLocal) {
      const charToMock = Array.from(searchQuery.trim())[0];
      if (charToMock && MOCK_KANJI_DATABASE[charToMock]) {
        foundLocal = { char: charToMock, ...MOCK_KANJI_DATABASE[charToMock] };
      }
    }

    if (foundLocal) {
      setSearchResult(foundLocal);
      return;
    }

    // 3. Fallback to real backend dictionary API GET /api/kanji/{kanji}
    const charToSearch = Array.from(searchQuery.trim())[0];
    const isKanji = (str: string) => /[\u4e00-\u9faf\u3400-\u4dbf]/.test(str);
    if (charToSearch && isKanji(charToSearch)) {
      setLoadingSearch(true);
      setSearchResult(null);

      const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
      fetch(`${BASE_URL}/kanji/${encodeURIComponent(charToSearch)}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("midori_access_token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((json) => {
          if (json.success && json.data) {
            const d = json.data;
            setSearchResult({
              id: d.id,
              char: d.character,
              sinoVietnamese: d.radical ? `Bộ ${d.radical}` : "HÁN TỰ",
              meaning: d.meaning || "Chưa cập nhật",
              strokes: d.strokeCount || 0,
              onyomi: d.onyomi || "-",
              kunyomi: d.kunyomi || "-",
              radical: d.radical || "-",
              mnemonic: `Dữ liệu gốc từ thư viện KANJIDIC2 hệ thống (Trình độ: ${d.jlpt || "N/A"}).`,
              svgPaths: [],
              svgAvailable: d.svgAvailable === true,
            });
          } else {
            setSearchResult(null);
          }
        })
        .catch((err) => {
          console.error("Backend Kanji fetch failed:", err);
          setSearchResult(null);
        })
        .finally(() => {
          setLoadingSearch(false);
        });
    } else {
      setSearchResult(null);
    }
  }, [searchQuery]);

  // Load favorites from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("midori_favorite_kanji");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  const toggleFavorite = (char: string) => {
    let nextFavorites = [...favorites];
    if (favorites.includes(char)) {
      nextFavorites = nextFavorites.filter((f) => f !== char);
    } else {
      nextFavorites.push(char);
    }
    setFavorites(nextFavorites);
    localStorage.setItem("midori_favorite_kanji", JSON.stringify(nextFavorites));
  };

  const handleExportWorksheetPDF = async () => {
    if (previewKanjiList.length === 0) {
      alert("Vui lòng nhập ít nhất một chữ Kanji để xuất PDF!");
      return;
    }

    setIsExporting(true);
    try {
      const kanjiListDTO = previewKanjiList.map((k) => ({
        character: k.char,
        hanViet: k.sinoVietnamese,
        meaning: k.meaning,
        mnemonic: k.mnemonic || "Hình ảnh tượng hình cho chữ " + k.char,
        svgPaths: k.svgPaths,
        strokeOrderImages: generateStrokeOrderImages(k),
      }));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api"}/kanji/pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("midori_access_token")}`,
          },
          body: JSON.stringify(kanjiListDTO),
        },
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `midori-kanji-worksheet.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Đã xảy ra lỗi khi xuất file PDF. Vui lòng thử lại!");
    } finally {
      setIsExporting(false);
    }
  };

  const activeLabels = searchResult ? getProcessedLabels(searchResult.svgPaths) : [];

  return (
    <div className="min-h-screen relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
      <SakuraBg count={16} />

      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          to="/student/learning/japanese"
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-slate-500 hover:text-pink-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Learning
        </Link>

        {/* Main Header */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-[#EEF2F7] dark:border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.04)] mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white">Kanji Practice</h1>
              <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
                Luyện viết và tra cứu chữ Kanji tiện lợi, xuất bản A4 PDF chuẩn chuyên nghiệp.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
              <span className="text-[#111827] dark:text-slate-200">
                Trình độ hiện tại: {STUDENT_LEVEL}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        {!showPractice && (
          <div className="flex border-b border-slate-200 dark:border-white/10 mb-8 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl shadow-sm border">
            <button
              onClick={() => setActiveTab("search")}
              className={cn(
                "flex-1 md:flex-none px-6 py-3 text-xs font-black rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider",
                activeTab === "search"
                  ? "bg-gradient-to-r from-violet-500 to-blue-400 text-white shadow-md shadow-violet-500/20"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white",
              )}
            >
              TÌM KIẾM KANJI
            </button>
            <button
              onClick={() => setActiveTab("worksheet")}
              className={cn(
                "flex-1 md:flex-none px-6 py-3 text-xs font-black rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider flex items-center justify-center gap-2",
                activeTab === "worksheet"
                  ? "bg-gradient-to-r from-violet-500 to-blue-400 text-white shadow-md shadow-violet-500/20"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white",
              )}
            >
              DANH SÁCH TỰ VIẾT
              {previewKanjiList.length > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-black",
                    activeTab === "worksheet"
                      ? "bg-white text-violet-600"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                  )}
                >
                  {previewKanjiList.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Dynamic Views */}
        {!showPractice ? (
          <div>
            {activeTab === "search" ? (
              /* TAB 1: KANJI SEARCH ENGINE */
              <div className="max-w-3xl mx-auto space-y-8 py-4">
                {/* Search Bar Container */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden text-center space-y-6">
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="max-w-md mx-auto space-y-2 relative z-10">
                    <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white flex items-center justify-center gap-2">
                      <Search className="w-6 h-6 text-violet-500 dark:text-violet-400" />
                      Tìm kiếm Kanji
                    </h2>
                    <p className="text-xs text-[#475569] dark:text-slate-400">
                      Tra cứu nhanh thứ tự nét, âm đọc Hán Việt và tạo bảng luyện viết tức thời
                    </p>
                  </div>

                  <div className="relative max-w-xl mx-auto z-10">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nhập Kanji, âm Hán Việt (ví dụ: 今, KIM)..."
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-5 pr-12 text-sm text-[#111827] dark:text-white placeholder-[#94A3B8] outline-none focus:ring-2 focus:ring-pink-500/40 hover:border-slate-350 dark:hover:border-white/20 transition-all shadow-inner"
                    />
                    {searchQuery ? (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold transition cursor-pointer"
                      >
                        Clear
                      </button>
                    ) : (
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Search Result card */}
                <AnimatePresence mode="wait">
                  {loadingSearch ? (
                    <div className="flex justify-center items-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                    </div>
                  ) : searchQuery.trim() && !searchResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-[32px] p-8 text-center space-y-3 shadow-md"
                    >
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-white/5 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Info className="w-8 h-8 text-pink-500" />
                      </div>
                      <h4 className="font-bold text-[#0F172A] dark:text-white text-base">
                        Không tìm thấy chữ Kanji nào trùng khớp
                      </h4>
                      <p className="text-xs text-[#475569] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Không tìm thấy kết quả nào cho "
                        <span className="font-bold text-pink-600 dark:text-pink-400">
                          {searchQuery}
                        </span>
                        ". Hãy thử tìm bằng chữ Kanji (ví dụ: 今) hoặc âm đọc khác.
                      </p>
                    </motion.div>
                  ) : null}

                  {searchResult && (
                    <motion.div
                      key={searchResult.char}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-[32px] p-6 sm:p-8 shadow-md space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                        <h4 className="font-bold text-sm text-[#0F172A] dark:text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                          Kết quả tìm kiếm
                        </h4>
                        <span className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-bold px-2.5 py-0.5 rounded-full">
                          {searchResult.strokes} nét
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Side: Detailed Info */}
                        <div className="lg:col-span-7 space-y-4 text-xs">
                          {/* Sino-Vietnamese & Meaning */}
                          <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-[22px] border border-slate-200/40 dark:border-white/5">
                            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] block uppercase mb-1">
                              Ý nghĩa Hán Việt
                            </span>
                            <span className="font-extrabold text-xl text-slate-900 dark:text-white uppercase tracking-wide">
                              {searchResult.sinoVietnamese}
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 mt-1 font-semibold text-sm">
                              {searchResult.meaning}
                            </p>
                          </div>

                          {/* Onyomi & Kunyomi */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-[22px] border border-slate-200/40 dark:border-white/5">
                              <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] block uppercase mb-1">
                                Âm Onyomi (ON)
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 font-bold text-sm tracking-wide">
                                {searchResult.onyomi}
                              </span>
                            </div>
                            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-[22px] border border-slate-200/40 dark:border-white/5">
                              <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] block uppercase mb-1">
                                Âm Kunyomi (KUN)
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 font-bold text-sm tracking-wide">
                                {searchResult.kunyomi}
                              </span>
                            </div>
                          </div>

                          {/* radical & JLPT Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-[22px] border border-slate-200/40 dark:border-white/5">
                              <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] block uppercase mb-1">
                                Trình độ JLPT
                              </span>
                              <span className="inline-block text-[10px] font-extrabold bg-pink-500/10 text-pink-500 px-3 py-1 rounded-full border border-pink-500/20">
                                {searchResult.radical && searchResult.radical.startsWith("N") ? searchResult.radical : `N5`}
                              </span>
                            </div>
                            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-[22px] border border-slate-200/40 dark:border-white/5">
                              <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] block uppercase mb-1">
                                Bộ thủ chính
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 font-bold text-xs uppercase">
                                {searchResult.radical || "-"}
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-[22px] border border-slate-200/40 dark:border-white/5">
                            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] block uppercase mb-1">
                              Mẹo nhớ
                            </span>
                            <p className="text-slate-755 dark:text-slate-300 italic text-xs leading-relaxed font-semibold">
                              {searchResult.mnemonic}
                            </p>
                          </div>

                          {/* Vocabulary Examples */}
                          <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-[22px] border border-slate-200/40 dark:border-white/5 space-y-3">
                            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] block uppercase">
                              Ví dụ từ vựng (Examples)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {(
                                searchResult.examples || [
                                  {
                                    word: `${searchResult.char}人 (${searchResult.sinoVietnamese} nhân)`,
                                    meaning: `Người liên quan đến ${searchResult.sinoVietnamese}`,
                                  },
                                  {
                                    word: `日本${searchResult.char} (Nhật Bản ${searchResult.sinoVietnamese})`,
                                    meaning: `Khái niệm ${searchResult.sinoVietnamese} Nhật Bản`,
                                  },
                                ]
                              ).map((ex, exIdx) => (
                                <div
                                  key={exIdx}
                                  className="flex justify-between items-center text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-150/40 dark:border-white/5 shadow-xs"
                                >
                                  <span className="font-bold text-slate-900 dark:text-slate-100 font-japanese">
                                    {ex.word}
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                                    {ex.meaning}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Animated Kanji Stroke Player */}
                        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-950/20 p-6 rounded-[28px] border border-slate-200/40 dark:border-white/5">
                          <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase mb-4 tracking-wider">
                            Quy trình vẽ nét (Stroke Animation)
                          </span>
                          {searchResult.id && searchResult.svgAvailable ? (
                            <KanjiStrokePlayer kanjiId={searchResult.id} />
                          ) : (
                            <div className="flex flex-col items-center justify-center w-52 h-52 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-[28px] text-center p-4 space-y-2">
                              <div className="text-6xl font-bold text-slate-800 dark:text-white select-none font-japanese">
                                {searchResult.char}
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Hình nét vẽ chưa khả dụng cho chữ này.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const cleanText = inputKanjiText.replace(/\s+/g, "");
                          if (cleanText.includes(searchResult.char)) {
                            alert(`Chữ ${searchResult.char} đã có trong danh sách luyện viết!`);
                            return;
                          }
                          setInputKanjiText((prev) =>
                            prev ? `${prev} ${searchResult.char}` : searchResult.char,
                          );
                          alert(`Đã thêm chữ ${searchResult.char} vào danh sách tự viết!`);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-400 hover:opacity-90 text-white font-bold text-sm transition-all duration-300 shadow-md shadow-violet-500/25 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm vào danh sách tự viết
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* TAB 2: DANH SÁCH TỰ VIẾT (Worksheet Generator) */
              <div className="space-y-6">
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-[32px] p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-[#0F172A] dark:text-slate-200 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                      Nhập tự do danh sách chữ Kanji
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Type or paste multiple Kanji characters separated by a space.
                    </p>
                  </div>

                  <textarea
                    value={inputKanjiText}
                    onChange={(e) => setInputKanjiText(e.target.value)}
                    className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-lg font-bold font-japanese tracking-widest text-[#111827] dark:text-white outline-none focus:ring-2 focus:ring-pink-500/40 transition resize-y leading-relaxed"
                    placeholder="Ví dụ: 今 玉 交 合..."
                  />

                  <div className="flex justify-end gap-2.5">
                    <button
                      onClick={() => setInputKanjiText("")}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa hết
                    </button>
                  </div>
                </div>

                {/* Workspace canvas container */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-[32px] overflow-hidden">
                  <div className="flex font-japanese text-slate-800 dark:text-slate-100 min-h-[600px]">
                    {/* Main Workspace background with grid blueprint */}
                    <div
                      className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(226, 232, 240, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(226, 232, 240, 0.4) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                    >
                      {/* Top Navigation Controls */}
                      <div className="w-full max-w-[750px] mx-auto flex justify-between items-center mb-6 no-print">
                        <button
                          onClick={() => setActiveTab("search")}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition cursor-pointer shadow-sm hover:shadow"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                          Quay lại
                        </button>

                        <button
                          onClick={handleExportWorksheetPDF}
                          disabled={isExporting}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-pink-500/10 cursor-pointer"
                        >
                          {isExporting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Đang tải...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" /> Tải PDF
                            </>
                          )}
                        </button>
                      </div>

                      {/* White Canvas preview rendering WorksheetPreviewComponent */}
                      <WorksheetPreviewComponent
                        kanjiList={previewKanjiList}
                        onRemoveKanji={(char) => {
                          setInputKanjiText((prev) => {
                            const chars = Array.from(prev.replace(/\s+/g, ""));
                            const filtered = chars.filter((c) => c !== char);
                            return filtered.join(" ");
                          });
                        }}
                        onClearAll={() => setInputKanjiText("")}
                        onDownloadPDF={handleExportWorksheetPDF}
                        isExporting={isExporting}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* WRITING PRACTICE VIEW */
          <WritingPracticeView kanji={selectedKanji!} onBack={() => setShowPractice(false)} />
        )}

        {/* KANJI DETAIL MODAL */}
        <AnimatePresence>
          {selectedKanji && !showPractice && (
            <KanjiDetailModal
              kanji={selectedKanji}
              favorites={favorites}
              onClose={() => setSelectedKanji(null)}
              onToggleFav={toggleFavorite}
              onOpenPractice={() => {
                setShowPractice(true);
              }}
              onAddToWorksheet={(k) => {
                const cleanText = inputKanjiText.replace(/\s+/g, "");
                if (cleanText.includes(k.char)) {
                  alert(`Chữ ${k.char} đã có trong danh sách tự viết!`);
                  return;
                }
                setInputKanjiText((prev) => (prev ? `${prev} ${k.char}` : k.char));
                alert(`Đã thêm chữ ${k.char} vào danh sách tự viết!`);
              }}
              isInWorksheet={inputKanjiText.replace(/\s+/g, "").includes(selectedKanji.char)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* =========================================================================
   SUB-COMPONENT: KANJI DETAIL MODAL
   ========================================================================= */
interface DetailModalProps {
  kanji: ExtendedKanjiCharacter;
  favorites: string[];
  onClose: () => void;
  onToggleFav: (char: string) => void;
  onOpenPractice: () => void;
  onAddToWorksheet: (kanji: KanjiCharacter) => void;
  isInWorksheet: boolean;
}

function KanjiDetailModal({
  kanji,
  favorites,
  onClose,
  onToggleFav,
  onOpenPractice,
  onAddToWorksheet,
  isInWorksheet,
}: DetailModalProps) {
  const isFav = favorites.includes(kanji.char);
  const [animationKey, setAnimationKey] = useState(0);

  const handleReplayAnimation = () => {
    setAnimationKey((prev) => prev + 1);
  };

  const handleSpeak = () => {
    speakJapanese(kanji.char);
  };

  const handleExportPDF = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    const margin = 80;

    ctx.fillStyle = "#db2777";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MIDORI KANJI PRACTICE SHEET", canvas.width / 2, 110);

    ctx.fillStyle = "#64748b";
    ctx.font = "16px sans-serif";
    ctx.fillText("Tự động xuất từ ứng dụng học tập Midori Student", canvas.width / 2, 145);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, 175);
    ctx.lineTo(canvas.width - margin, 175);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(margin, 180);
    ctx.lineTo(canvas.width - margin, 180);
    ctx.stroke();

    const kx = 80;
    const ky = 210;
    const kw = 320;
    const kh = 320;

    ctx.strokeStyle = "#db2777";
    ctx.lineWidth = 4;
    ctx.fillStyle = "#f8fafc";

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    drawRoundRect(kx, ky, kw, kh, 20);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(kx + kw / 2, ky + kh / 2 - 25);
    ctx.scale(2.0, 2.0);
    ctx.translate(-50, -50);
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    kanji.svgPaths.forEach((pathStr) => {
      const p2d = new Path2D(pathStr);
      ctx.stroke(p2d);
    });
    ctx.restore();

    ctx.fillStyle = "#db2777";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(kanji.sinoVietnamese, kx + kw / 2, ky + kh - 30);

    const ix = 440;
    const iy = 210;

    const drawInfoRow = (label: string, value: string, yPos: number) => {
      ctx.textAlign = "left";
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(label.toUpperCase(), ix, yPos);

      ctx.fillStyle = "#0f172a";
      ctx.font = "16px sans-serif";

      const words = value.split(" ");
      let line = "";
      let currentY = yPos + 22;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 720 && n > 0) {
          ctx.fillText(line, ix, currentY);
          line = words[n] + " ";
          currentY += 20;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, ix, currentY);
      return currentY + 15;
    };

    let nextY = iy + 15;
    nextY = drawInfoRow("Ý nghĩa", kanji.meaning, nextY);
    nextY = drawInfoRow("Số nét", `${kanji.strokes} nét`, nextY);
    nextY = drawInfoRow("Âm ON / KUN", `ON: ${kanji.onyomi}  |  KUN: ${kanji.kunyomi}`, nextY);
    nextY = drawInfoRow("Mẹo ghi nhớ", kanji.mnemonic, nextY);

    const sby = 560;
    ctx.fillStyle = "#db2777";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Thứ tự các nét viết (Stroke Order)", margin, sby);

    ctx.strokeStyle = "#db2777";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(margin, sby + 10);
    ctx.lineTo(margin + 50, sby + 10);
    ctx.stroke();

    const stepSize = 65;
    const stepGap = 12;
    const startX = margin;
    const startY = sby + 30;

    kanji.svgPaths.forEach((path, idx) => {
      const row = Math.floor(idx / 14);
      const col = idx % 14;
      const x = startX + col * (stepSize + stepGap);
      const y = startY + row * (stepSize + stepGap);

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.fillStyle = "#f8fafc";
      drawRoundRect(x, y, stepSize, stepSize, 8);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(x + stepSize / 2, y + stepSize / 2);
      ctx.scale((stepSize * 0.8) / 100, (stepSize * 0.8) / 100);
      ctx.translate(-50, -50);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let pIdx = 0; pIdx < idx; pIdx++) {
        const p2d = new Path2D(kanji.svgPaths[pIdx]);
        ctx.stroke(p2d);
      }

      ctx.strokeStyle = "#db2777";
      ctx.lineWidth = 6;
      const currentP2D = new Path2D(path);
      ctx.stroke(currentP2D);
      ctx.restore();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(idx + 1), x + stepSize - 5, y + stepSize - 5);
    });

    const strokeRowsCount = Math.ceil(kanji.svgPaths.length / 14);
    const strokeSectionHeight = strokeRowsCount * (stepSize + stepGap);

    const pgy = startY + strokeSectionHeight + 30;
    ctx.fillStyle = "#db2777";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Luyện viết tay (Practice Grid)", margin, pgy);

    ctx.strokeStyle = "#db2777";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(margin, pgy + 10);
    ctx.lineTo(margin + 50, pgy + 10);
    ctx.stroke();

    const gridCols = 8;
    const gridRows = 5;
    const boxSize = 110;
    const boxGap = 20;
    const gStartX = margin;
    const gStartY = pgy + 35;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const bx = gStartX + c * (boxSize + boxGap);
        const by = gStartY + r * (boxSize + boxGap);

        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1;
        drawRoundRect(bx, by, boxSize, boxSize, 12);
        ctx.stroke();

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(bx, by + boxSize / 2);
        ctx.lineTo(bx + boxSize, by + boxSize / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx + boxSize / 2, by);
        ctx.lineTo(bx + boxSize / 2, by + boxSize);
        ctx.stroke();

        ctx.setLineDash([]);

        if (r === 0 && c < 3) {
          ctx.save();
          ctx.translate(bx + boxSize / 2, by + boxSize / 2);
          ctx.scale((boxSize * 0.8) / 100, (boxSize * 0.8) / 100);
          ctx.translate(-50, -50);
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          kanji.svgPaths.forEach((pathStr) => {
            const p2d = new Path2D(pathStr);
            ctx.stroke(p2d);
          });
          ctx.restore();
        }
      }
    }

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, 1630);
    ctx.lineTo(canvas.width - margin, 1630);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Bản quyền thuộc về Midori Japanese Platform © 2026. Tất cả các quyền được bảo lưu.",
      canvas.width / 2,
      1660,
    );

    import("jspdf")
      .then(({ jsPDF }) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
        pdf.save(`midori-kanji-${kanji.char}.pdf`);
      })
      .catch((err) => {
        console.error("Failed to load jsPDF library dynamically:", err);
        alert("Đã xảy ra lỗi khi tải thư viện xuất PDF!");
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row"
      >
        <div className="w-full md:w-1/2 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50">
          <div className="w-full flex justify-between items-center mb-4">
            <button
              onClick={() => onToggleFav(kanji.char)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-pink-500 shadow-sm transition"
            >
              <Heart className={cn("w-5 h-5", isFav && "fill-pink-500 text-pink-500")} />
            </button>
          </div>

          <div
            onClick={handleReplayAnimation}
            title="Nhấp để xem lại hướng dẫn"
            className="relative w-48 h-48 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer hover:border-pink-300 transition-colors group"
          >
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400 border-dashed" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400 border-dashed" />
            </div>

            <div className="absolute bottom-2 right-2 text-[9px] text-slate-400 font-extrabold bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-2.5 h-2.5 fill-slate-400" />
              Xem lại
            </div>

            <svg key={animationKey} viewBox="0 0 100 100" className="w-40 h-40 fill-none">
              {/* Static light gray watermark representing the final shape */}
              {kanji.svgPaths.map((path, idx) => (
                <path
                  key={`modal-watermark-${idx}`}
                  d={path}
                  stroke="#cbd5e1"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
              ))}

              {/* Animated active paths drawing the strokes in perfect sequence */}
              {kanji.svgPaths.map((path, idx) => {
                const animProps = getStrokeAnimationProps(idx, kanji.svgPaths.length);
                return (
                  <motion.path
                    key={`modal-stroke-${idx}`}
                    d={path}
                    stroke="#db2777"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={animProps.animate}
                    transition={animProps.transition}
                  />
                );
              })}

              {/* Clean, large red circles with white numbers placed at starting points */}
              {getProcessedLabels(kanji.svgPaths).map((lbl) => (
                <g key={`modal-label-${lbl.idx}`}>
                  <circle
                    cx={lbl.x}
                    cy={lbl.y}
                    r="6.5"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                  <text
                    x={lbl.x}
                    y={lbl.y + 3}
                    fill="#ffffff"
                    fontSize="8.5"
                    fontWeight="black"
                    textAnchor="middle"
                    className="select-none pointer-events-none font-sans"
                  >
                    {lbl.idx + 1}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="w-full text-center mt-4">
            <h2
              className="text-4xl font-extrabold text-[#0F172A]"
              style={{ fontFamily: "var(--font-japanese)" }}
            >
              {kanji.char}
            </h2>
            <p className="text-sm text-pink-600 font-extrabold tracking-widest mt-1">
              {kanji.sinoVietnamese}
            </p>
          </div>

          <div className="w-full flex gap-2 mt-6">
            <button
              onClick={() => onAddToWorksheet(kanji)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition shadow-sm",
                isInWorksheet
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
              )}
              disabled={isInWorksheet}
            >
              {isInWorksheet ? (
                <>
                  <Check className="w-4.5 h-4.5 text-emerald-600" />
                  Đã thêm
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-pink-600" />
                  Thêm tự viết
                </>
              )}
            </button>

            <button
              onClick={onOpenPractice}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-xs text-white font-bold transition shadow-lg shadow-purple-500/20"
            >
              <BookOpen className="w-4 h-4" />
              Luyện viết
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between bg-white">
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-600 border border-pink-200 text-[10px] font-bold">
                  {kanji.strokes} nét viết
                </span>
                <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-600 border border-pink-200 text-[10px] font-bold">
                  Bộ: {kanji.radical}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-[#0F172A] text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Ý nghĩa
              </h4>
              <p className="text-sm text-[#111827] mt-1 font-semibold">{kanji.meaning}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Âm Onyomi
                </h4>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">
                  {kanji.onyomi}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Âm Kunyomi
                </h4>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">
                  {kanji.kunyomi}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-pink-500" /> Mẹo ghi nhớ
              </h4>
              <p className="text-xs text-[#111827] mt-1 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                "{kanji.mnemonic}"
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
            <span>MIDORI Japanese learning platform</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================================
   SUB-COMPONENT: WRITING PRACTICE SCREEN VIEW
   ========================================================================= */
interface PracticeViewProps {
  kanji: KanjiCharacter;
  onBack: () => void;
}

function WritingPracticeView({ kanji, onBack }: PracticeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  const handleEvaluate = () => {
    if (strokes.length === 0) {
      alert("Vui lòng viết chữ Kanji lên bảng trước khi chấm điểm!");
      return;
    }

    const deviation = Math.abs(strokes.length - kanji.strokes);
    const baseScore = Math.max(30, 95 - deviation * 15);
    const finalScore = Math.min(100, Math.floor(baseScore + Math.random() * 8));

    setScore(finalScore);

    if (finalScore >= 90) {
      setFeedback("Tuyệt vời! Nét chữ viết rất chính xác và đẹp mắt! 🌟");
    } else if (finalScore >= 75) {
      setFeedback("Khá tốt! Thứ tự nét vẽ tương đối chuẩn xác. Luyện tập thêm nhé! 👍");
    } else {
      setFeedback("Cố gắng lên! Hãy quan sát kỹ hướng dẫn thứ tự nét ở trên và thử lại. 💪");
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoords(e);
    setIsDrawing(true);
    setCurrentStroke([coords]);
    setScore(null);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const coords = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(
      currentStroke[currentStroke.length - 1]?.x || coords.x,
      currentStroke[currentStroke.length - 1]?.y || coords.y,
    );
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setCurrentStroke((prev) => [...prev, coords]);
  };

  const stopDraw = () => {
    if (isDrawing && currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setCurrentStroke([]);
    setScore(null);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    if (strokes.length === 0) return;
    const remaining = strokes.slice(0, -1);
    setStrokes(remaining);
    setScore(null);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    remaining.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.slice(1).forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Chi tiết
        </button>

        <h3 className="font-bold text-[#0F172A] text-lg">
          Luyện viết chữ: {kanji.char} ({kanji.sinoVietnamese})
        </h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md">
        <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">
          Mô tả các bước rã nét viết (Stroke buildup steps):
        </h4>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {kanji.svgPaths.map((path, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 relative flex items-center justify-center"
            >
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                {kanji.svgPaths.slice(0, idx).map((p, pIdx) => (
                  <path
                    key={pIdx}
                    d={p}
                    fill="none"
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                ))}
                <path d={path} fill="none" stroke="#10b981" strokeWidth={5} strokeLinecap="round" />
              </svg>
              <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-bold">
                Nét {idx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative bg-white border-2 border-dashed border-slate-200 rounded-3xl aspect-square w-full max-w-md mx-auto overflow-hidden shadow-sm">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 border-dashed" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 border-dashed" />
        </div>

        {showGuide && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <span className="text-[250px] font-bold text-slate-300 select-none">{kanji.char}</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className="w-full aspect-square cursor-crosshair touch-none relative z-10"
        />
      </div>

      <div className="flex gap-3 max-w-md mx-auto">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className={cn(
            "flex-1 py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm",
            showGuide
              ? "bg-pink-50 border-pink-200 text-pink-600"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          {showGuide ? "Ẩn nét vẽ mờ" : "Hiện nét vẽ mờ"}
        </button>

        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          className="flex-1 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs text-slate-600 font-bold transition shadow-sm"
        >
          Hoàn tác (Undo)
        </button>

        <button
          onClick={clearCanvas}
          className="flex-1 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-600 font-bold transition shadow-sm"
        >
          Xóa bảng (Clear)
        </button>
      </div>

      <div className="max-w-md mx-auto">
        <button
          onClick={handleEvaluate}
          className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-purple-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Award className="w-4.5 h-4.5" /> Chấm điểm nét viết
        </button>
      </div>

      <AnimatePresence>
        {score !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-md text-center max-w-md mx-auto"
          >
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Kết quả đánh giá
            </div>
            <div className="text-4xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
              {score}%
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{feedback}</p>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Số nét đã viết: {strokes.length} / {kanji.strokes} nét
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
