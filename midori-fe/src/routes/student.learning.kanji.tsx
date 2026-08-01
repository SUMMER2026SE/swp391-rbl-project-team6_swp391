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
import { WorksheetPreviewComponent } from "@/components/WorksheetPreviewComponent";
import { KanjiStrokePlayer } from "@/components/student/kanji/KanjiStrokePlayer";
import { speakJapanese } from "@/data/japanese-learning-data";

export const Route = createFileRoute("/student/learning/kanji")({
  component: KanjiLearningPage,
});

interface KanjiCharacter {
  char: string;
  sinoVietnamese: string;
  meaning: string;
  strokes: number;
  onyomi: string;
  kunyomi: string;
  mnemonic: string;
  radical: string;
  svgPaths: string[];
}

interface ExtendedKanjiCharacter extends KanjiCharacter {
  id?: string;
  svgAvailable?: boolean;
  examples?: { word: string; meaning: string }[];
}

// Helper to calculate Framer Motion keyframe times for stroke order animation loops
function getStrokeAnimationProps(idx: number, totalStrokes: number) {
  const strokeDuration = 0.8;
  const pauseDuration = 1.5;
  const totalPeriod = totalStrokes * strokeDuration + pauseDuration;

  const tStart = (idx * strokeDuration) / totalPeriod;
  const tEnd = ((idx + 1) * strokeDuration) / totalPeriod;

  return {
    animate: { pathLength: [0, 0, 1, 1] },
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

    if (i === 1 && Math.abs(lbl.x - raw[0].x) < 5 && Math.abs(lbl.y - raw[0].y) < 5) {
      finalX += 9;
      finalY += 6;
    }

    return { x: finalX, y: finalY, idx: lbl.idx };
  });
}

function generateStrokeOrderImages(kanji: KanjiCharacter): string[] {
  const images: string[] = [];
  const size = 100;

  kanji.svgPaths.forEach((path) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 5;
    const prevP2D = new Path2D(path);
    ctx.stroke(prevP2D);

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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedKanji, setSelectedKanji] = useState<ExtendedKanjiCharacter | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPractice, setShowPractice] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [inputKanjiText, setInputKanjiText] = useState<string>("");
  const [searchReplayKey, setSearchReplayKey] = useState<number>(0);

  const [searchResult, setSearchResult] = useState<ExtendedKanjiCharacter | null>(null);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>("");

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [debouncedInputKanjiText, setDebouncedInputKanjiText] = useState<string>("");

  // All resolved kanji characters from real API, keyed by character
  const [resolvedKanjiCache, setResolvedKanjiCache] = useState<Record<string, ExtendedKanjiCharacter>>({});
  const [loadingKanji, setLoadingKanji] = useState<Set<string>>(new Set());
  const loadingCharsRef = useRef<Set<string>>(new Set());

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Debounce worksheet input text
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInputKanjiText(inputKanjiText);
    }, 500);
    return () => clearTimeout(handler);
  }, [inputKanjiText]);

  // Fetch a single kanji from the backend API
  const fetchKanji = async (char: string, signal?: AbortSignal): Promise<ExtendedKanjiCharacter | null> => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
    try {
      const res = await fetch(`${BASE_URL}/kanji/${encodeURIComponent(char)}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("midori_access_token")}`,
        },
        signal,
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.success || !json.data) return null;
      const d = json.data;

      let svgPaths: string[] = [];
      if (d.svgAvailable && d.id) {
        try {
          const svgRes = await fetch(`${BASE_URL}/kanji/${d.id}/svg`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("midori_access_token")}` },
            signal,
          });
          if (svgRes.ok) {
            const svgText = await svgRes.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            const paths = doc.querySelectorAll("path");
            svgPaths = Array.from(paths).map((p) => p.getAttribute("d") || "");
          }
        } catch {
          // SVG unavailable — fall through with empty paths
        }
      }

      return {
        id: d.id,
        char: d.character,
        sinoVietnamese: d.radical ? `Bộ ${d.radical}` : "HÁN TỰ",
        meaning: d.meaning || "Chưa cập nhật",
        strokes: d.strokeCount || svgPaths.length || 0,
        onyomi: d.onyomi || "-",
        kunyomi: d.kunyomi || "-",
        radical: d.radical || "-",
        mnemonic: d.mnemonic || "Chưa có mẹo ghi nhớ cho kanji này.",
        svgPaths,
        svgAvailable: d.svgAvailable === true,
        examples: [],
      };
    } catch {
      return null;
    }
  };

  // Load kanji characters typed into the worksheet textarea
  useEffect(() => {
    const chars = Array.from(debouncedInputKanjiText.replace(/\s+/g, ""));
    const controllers: AbortController[] = [];

    chars.forEach((char) => {
      if (resolvedKanjiCache[char]) return;
      if (loadingCharsRef.current.has(char)) return;

      loadingCharsRef.current.add(char);
      setLoadingKanji((prev) => new Set(prev).add(char));

      const controller = new AbortController();
      controllers.push(controller);

      fetchKanji(char, controller.signal).then((result) => {
        if (result) {
          setResolvedKanjiCache((prev) => ({ ...prev, [char]: result }));
        }
      }).finally(() => {
        loadingCharsRef.current.delete(char);
        setLoadingKanji((prev) => {
          const next = new Set(prev);
          next.delete(char);
          return next;
        });
      });
    });

    return () => {
      controllers.forEach((c) => c.abort());
    };
  }, [debouncedInputKanjiText]);

  // Search kanji from backend API
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResult(null);
      setSearchError("");
      return;
    }

    const charToSearch = Array.from(debouncedSearchQuery.trim())[0];
    const isKanji = (str: string) => /[\u4e00-\u9faf\u3400-\u4dbf]/.test(str);

    if (!charToSearch || !isKanji(charToSearch)) {
      setSearchResult(null);
      setSearchError("Vui lòng nhập một chữ Kanji hợp lệ.");
      return;
    }

    setLoadingSearch(true);
    setSearchError("");
    setSearchResult(null);

    const controller = new AbortController();

    fetchKanji(charToSearch, controller.signal).then((result) => {
      if (result) {
        setSearchResult(result);
      } else {
        setSearchError("Không tìm thấy chữ Kanji này trong cơ sở dữ liệu.");
      }
    }).catch((err) => {
      if (err.name !== "AbortError") {
        setSearchError("Đã xảy ra lỗi khi tìm kiếm.");
      }
    }).finally(() => {
      if (!controller.signal.aborted) {
        setLoadingSearch(false);
      }
    });

    return () => {
      controller.abort();
    };
  }, [debouncedSearchQuery]);

  // Build worksheet kanji list from resolved cache (all from real API)
  const previewKanjiList: ExtendedKanjiCharacter[] = Array.from(
    inputKanjiText.replace(/\s+/g, "")
  ).map((char) => resolvedKanjiCache[char]).filter(Boolean);

  // Load favorites from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("midori_favorite_kanji");
    if (stored) {
      try { setFavorites(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const toggleFavorite = (char: string) => {
    let next = [...favorites];
    if (favorites.includes(char)) {
      next = next.filter((f) => f !== char);
    } else {
      next.push(char);
    }
    setFavorites(next);
    localStorage.setItem("midori_favorite_kanji", JSON.stringify(next));
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
        mnemonic: k.mnemonic || `Dữ liệu KANJIDIC2 cho chữ ${k.char}.`,
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

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

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
                Tra cứu Kanji từ cơ sở dữ liệu KANJIDIC2 thực, xuất bản A4 PDF chuẩn chuyên nghiệp.
              </p>
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
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
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
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              DANH SÁCH TỰ VIẾT
              {previewKanjiList.length > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-black",
                    activeTab === "worksheet"
                      ? "bg-white text-violet-600"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
                      placeholder="Nhập chữ Kanji (ví dụ: 食, 学)..."
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
                  ) : searchError ? (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-[32px] p-8 text-center space-y-3 shadow-md"
                    >
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-white/5 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Info className="w-8 h-8 text-pink-500" />
                      </div>
                      <h4 className="font-bold text-[#0F172A] dark:text-white text-base">{searchError}</h4>
                      <p className="text-xs text-[#475569] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Chữ Kanji này chưa có trong cơ sở dữ liệu KANJIDIC2 của hệ thống.
                      </p>
                    </motion.div>
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
                        Không tìm thấy chữ Kanji
                      </h4>
                      <p className="text-xs text-[#475569] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Không tìm thấy kết quả cho "
                        <span className="font-bold text-pink-600 dark:text-pink-400">{searchQuery}</span>
                        ".
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

                          {/* JLPT & Radical Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-[22px] border border-slate-200/40 dark:border-white/5">
                              <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] block uppercase mb-1">
                                Trình độ JLPT
                              </span>
                              <span className="inline-block text-[10px] font-extrabold bg-pink-500/10 text-pink-500 px-3 py-1 rounded-full border border-pink-500/20">
                                {searchResult.radical?.startsWith("N") ? searchResult.radical : "N5"}
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
                              Mẹo ghi nhớ
                            </span>
                            <p className="text-slate-755 dark:text-slate-300 italic text-xs leading-relaxed font-semibold">
                              {searchResult.mnemonic}
                            </p>
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
                                Hình nét chưa khả dụng.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const clean = inputKanjiText.replace(/\s+/g, "");
                          if (clean.includes(searchResult.char)) {
                            alert(`Chữ ${searchResult.char} đã có trong danh sách luyện viết!`);
                            return;
                          }
                          setInputKanjiText((prev) =>
                            prev ? `${prev} ${searchResult.char}` : searchResult.char
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
                      Nhập danh sách chữ Kanji
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Nhập chữ Kanji muốn luyện viết. Hệ thống sẽ tra cứu tự động từ cơ sở dữ liệu KANJIDIC2.
                    </p>
                  </div>

                  <textarea
                    value={inputKanjiText}
                    onChange={(e) => setInputKanjiText(e.target.value)}
                    className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-lg font-bold font-japanese tracking-widest text-[#111827] dark:text-white outline-none focus:ring-2 focus:ring-pink-500/40 transition resize-y leading-relaxed"
                    placeholder="Ví dụ: 食 学 校 先 生..."
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

                {/* Loading indicators */}
                {loadingKanji.size > 0 && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                    <span className="text-sm text-slate-500">
                      Đang tải {loadingKanji.size} kanji từ cơ sở dữ liệu...
                    </span>
                  </div>
                )}

                {/* Workspace canvas container */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-[32px] overflow-hidden">
                  <div className="flex font-japanese text-slate-800 dark:text-slate-100 min-h-[600px]">
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
                          disabled={isExporting || previewKanjiList.length === 0}
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

                      {/* Empty state */}
                      {previewKanjiList.length === 0 && loadingKanji.size === 0 && (
                        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-3 py-16">
                          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                          <h3 className="font-bold text-slate-400 dark:text-slate-500 text-base">
                            Nhập chữ Kanji để bắt đầu
                          </h3>
                          <p className="text-sm text-slate-400 dark:text-slate-600 max-w-xs">
                            Gõ chữ Kanji vào ô trên, hệ thống sẽ tự động tra cứu thông tin từ cơ sở dữ liệu thực.
                          </p>
                        </div>
                      )}

                      {previewKanjiList.length > 0 && (
                        <WorksheetPreviewComponent
                          kanjiList={previewKanjiList}
                          onRemoveKanji={(char) => {
                            setInputKanjiText((prev) => {
                              const chars = Array.from(prev.replace(/\s+/g, ""));
                              return chars.filter((c) => c !== char).join(" ");
                            });
                          }}
                          onClearAll={() => setInputKanjiText("")}
                          onDownloadPDF={handleExportWorksheetPDF}
                          isExporting={isExporting}
                        />
                      )}
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
              onOpenPractice={() => setShowPractice(true)}
              onAddToWorksheet={(k) => {
                const clean = inputKanjiText.replace(/\s+/g, "");
                if (clean.includes(k.char)) {
                  alert(`Chữ ${k.char} đã có trong danh sách!`);
                  return;
                }
                setInputKanjiText((prev) => (prev ? `${prev} ${k.char}` : k.char));
                alert(`Đã thêm chữ ${k.char} vào danh sách!`);
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
  onAddToWorksheet: (kanji: ExtendedKanjiCharacter) => void;
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

  const handleReplayAnimation = () => setAnimationKey((prev) => prev + 1);

  const handleSpeak = () => speakJapanese(kanji.char);

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
    ctx.moveTo(margin, 180);
    ctx.lineTo(canvas.width - margin, 180);
    ctx.stroke();

    const kx = 80, ky = 210, kw = 320, kh = 320;

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

    const ix = 440, iy = 210;
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
      for (const word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > 720 && line) {
          ctx.fillText(line, ix, currentY);
          line = word + " ";
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

    const stepSize = 65, stepGap = 12, startX = margin, startY = sby + 30;
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

    const gridCols = 8, gridRows = 5, boxSize = 110, boxGap = 20;
    const gStartX = margin, gStartY = pgy + 35;

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
    ctx.fillText("Bản quyền thuộc về Midori Japanese Platform © 2026.", canvas.width / 2, 1660);

    import("jspdf")
      .then(({ jsPDF }) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
        pdf.save(`midori-kanji-${kanji.char}.pdf`);
      })
      .catch((err) => {
        console.error("Failed to load jsPDF:", err);
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
            title="Nhấp để xem lại"
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

              {getProcessedLabels(kanji.svgPaths).map((lbl) => (
                <g key={`modal-label-${lbl.idx}`}>
                  <circle cx={lbl.x} cy={lbl.y} r="6.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
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
            <h2 className="text-4xl font-extrabold text-[#0F172A]" style={{ fontFamily: "var(--font-japanese)" }}>
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
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              )}
              disabled={isInWorksheet}
            >
              {isInWorksheet ? (
                <><Check className="w-4 h-4 text-emerald-600" /> Đã thêm</>
              ) : (
                <><Plus className="w-4 h-4 text-pink-600" /> Thêm tự viết</>
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
              <button onClick={onClose} className="text-slate-400 hover:text-[#0F172A] text-xs font-semibold transition">
                Đóng
              </button>
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ý nghĩa</h4>
              <p className="text-sm text-[#111827] mt-1 font-semibold">{kanji.meaning}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Âm Onyomi</h4>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">{kanji.onyomi}</p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Âm Kunyomi</h4>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">{kanji.kunyomi}</p>
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
  kanji: ExtendedKanjiCharacter;
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
      alert("Vui lòng viết chữ Kanji lên bảng trước!");
      return;
    }
    const deviation = Math.abs(strokes.length - kanji.strokes);
    const baseScore = Math.max(30, 95 - deviation * 15);
    setScore(Math.min(100, Math.floor(baseScore + Math.random() * 8)));
    setFeedback(score !== null && score >= 90 ? "Tuyệt vời!" : "Cố gắng thêm!");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setCurrentStroke([getCoords(e)]);
    setScore(null);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const coords = getCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const last = currentStroke[currentStroke.length - 1] || coords;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setCurrentStroke((prev) => [...prev, coords]);
  };

  const stopDraw = () => {
    if (isDrawing && currentStroke.length > 0) setStrokes((prev) => [...prev, currentStroke]);
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
    const remaining = strokes.slice(0, -1);
    setStrokes(remaining);
    setScore(null);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
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
        <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" /> Quay lại Chi tiết
        </button>
        <h3 className="font-bold text-[#0F172A] text-lg">
          Luyện viết: {kanji.char} ({kanji.sinoVietnamese})
        </h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md">
        <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Các bước rã nét:</h4>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {kanji.svgPaths.map((path, idx) => (
            <div key={idx} className="flex-shrink-0 w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                {kanji.svgPaths.slice(0, idx).map((p, pIdx) => (
                  <path key={pIdx} d={p} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={4} strokeLinecap="round" />
                ))}
                <path d={path} fill="none" stroke="#10b981" strokeWidth={5} strokeLinecap="round" />
              </svg>
              <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-bold">Nét {idx + 1}</span>
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
            showGuide ? "bg-pink-50 border-pink-200 text-pink-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          {showGuide ? "Ẩn nét vẽ mờ" : "Hiện nét vẽ mờ"}
        </button>

        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          className="flex-1 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs text-slate-600 font-bold transition shadow-sm"
        >
          Hoàn tác
        </button>

        <button
          onClick={clearCanvas}
          className="flex-1 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-600 font-bold transition shadow-sm"
        >
          Xóa bảng
        </button>
      </div>

      <div className="max-w-md mx-auto">
        <button
          onClick={handleEvaluate}
          className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-purple-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Award className="w-4 h-4" /> Chấm điểm nét viết
        </button>
      </div>

      <AnimatePresence>
        {score !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-5 rounded-2xl border border-slate-200 bg-white shadow-md text-center max-w-md mx-auto"
          >
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kết quả đánh giá</div>
            <div className="text-4xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
              {score}%
            </div>
            <p className="text-sm text-slate-700 font-medium">{feedback}</p>
            <div className="text-[11px] text-slate-400 mt-2">Số nét đã viết: {strokes.length} / {kanji.strokes} nét</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
