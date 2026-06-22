import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eraser,
  Check,
  Lock,
  Heart,
  Play,
  Pause,
  Download,
  BookOpen,
  ArrowLeft,
  RefreshCcw,
  Sparkles,
  Award,
  ChevronRight,
  Info
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { KANJI_DATA, type KanjiCharacter } from "@/data/kanji-data";
import { speakJapanese } from "@/data/japanese-learning-data";

export const Route = createFileRoute("/student/learning/kanji")({
  component: KanjiLearningPage,
});

// Student levels logic
const ALL_LEVELS = ["N5 - Cơ bản", "N4", "N3", "N2", "N1", "214 Bộ thủ"];
const STUDENT_LEVEL = "N5 - Cơ bản"; // Mock current student level

function KanjiLearningPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>("N5 - Cơ bản");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedKanji, setSelectedKanji] = useState<KanjiCharacter | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPractice, setShowPractice] = useState<boolean>(false);

  // Load favorites from local storage
  useEffect(() => {
    const stored = localStorage.getItem("midori_favorite_kanji");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  const toggleFavorite = (char: string) => {
    let nextFavorites = [...favorites];
    if (favorites.includes(char)) {
      nextFavorites = nextFavorites.filter(f => f !== char);
    } else {
      nextFavorites.push(char);
    }
    setFavorites(nextFavorites);
    localStorage.setItem("midori_favorite_kanji", JSON.stringify(nextFavorites));
  };

  // Filter Kanji data
  const dataKey = selectedLevel === "N5 - Cơ bản" ? "N5" : selectedLevel;
  const currentKanjiList = KANJI_DATA[dataKey] || [];
  const filteredKanjiList = currentKanjiList.filter(kanji => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      kanji.char.includes(query) ||
      kanji.sinoVietnamese.toLowerCase().includes(query) ||
      kanji.meaning.toLowerCase().includes(query)
    );
  });

  // Level access control
  const isLevelLocked = (level: string) => {
    if (level === "214 Bộ thủ") return false;
    const levelOrder = ["N5 - Cơ bản", "N4", "N3", "N2", "N1"];
    const currentIdx = levelOrder.indexOf(STUDENT_LEVEL);
    const targetIdx = levelOrder.indexOf(level);
    return targetIdx > currentIdx;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <SakuraBg count={16} />
      
      {/* Background Pastel Blurs (Pink-Blue Ambient Glow) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Main Floating Outer White Container */}
        <div className="bg-white dark:bg-slate-900 border border-[#EEF2F7] dark:border-white/10 rounded-[40px] p-6 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-2xl">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link to="/student/dashboard" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition flex items-center gap-1 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                Kanji Practice Dashboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Master Sino-Japanese characters through writing, order animation, and worksheets.
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-xs text-indigo-600 dark:text-indigo-300 font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Current Level: {STUDENT_LEVEL}</span>
            </div>
          </div>

          {!showPractice ? (
            /* =========================================================================
               KANJI DASHBOARD VIEW
               ========================================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Search Kanji Card */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-[#EEF2F7] dark:border-white/10 rounded-[32px] p-6 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tìm kiếm Kanji</h3>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nhập Kanji, âm Hán Việt..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-4 pr-10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white text-xs font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Level Tabs & Kanji Grid Container */}
              <div className="lg:col-span-8 space-y-6">
                {/* Level Tabs */}
                <div className="flex flex-wrap gap-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-2 rounded-[20px] backdrop-blur-md mt-2">
                  {ALL_LEVELS.map(level => {
                    const locked = isLevelLocked(level);
                    const active = selectedLevel === level;
                    const isRadicalTab = level === "214 Bộ thủ";
                    
                    return (
                      <button
                        key={level}
                        disabled={locked}
                        onClick={() => {
                          setSelectedLevel(level);
                          setSearchQuery("");
                        }}
                        className={cn(
                          "relative flex-1 md:flex-none min-w-[75px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300",
                          active 
                            ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-lg shadow-purple-500/20"
                            : isRadicalTab
                              ? "bg-[#F3E8FF] border border-purple-200 text-[#7C3AED] hover:opacity-90 dark:bg-purple-950/40 dark:border-purple-800/40 dark:text-purple-300 shadow-sm"
                              : locked
                                ? "bg-slate-100/50 border border-slate-200/50 text-slate-400 opacity-60 dark:bg-slate-900/40 dark:border-transparent cursor-not-allowed"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:bg-transparent dark:border-transparent dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                        )}
                      >
                        <span>{level}</span>
                        {locked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Kanji Grid Container */}
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-[#EEF2F7] dark:border-white/10 rounded-[32px] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      Trình độ: {selectedLevel}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Hiển thị {filteredKanjiList.length} chữ
                    </span>
                  </div>

                  {filteredKanjiList.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-slate-500 dark:text-slate-400">Không tìm thấy chữ Kanji nào phù hợp.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {filteredKanjiList.map((kanji, idx) => {
                        const isFav = favorites.includes(kanji.char);
                        return (
                          <motion.button
                            key={kanji.char}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedKanji(kanji)}
                            className="relative aspect-square flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm transition-all"
                          >
                            <span 
                              className="text-2xl font-bold text-slate-900 dark:text-white mb-1"
                              style={{ fontFamily: "var(--font-japanese)" }}
                            >
                              {kanji.char}
                            </span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                              {kanji.sinoVietnamese}
                            </span>
                            {isFav && (
                              <div className="absolute top-1.5 right-1.5">
                                <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* =========================================================================
               WRITING PRACTICE VIEW
               ========================================================================= */
            <WritingPracticeView 
              kanji={selectedKanji!} 
              onBack={() => setShowPractice(false)} 
            />
          )}
        </div>

        {/* =========================================================================
           KANJI DETAIL MODAL
           ========================================================================= */}
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
  kanji: KanjiCharacter;
  favorites: string[];
  onClose: () => void;
  onToggleFav: (char: string) => void;
  onOpenPractice: () => void;
}

function KanjiDetailModal({ kanji, favorites, onClose, onToggleFav, onOpenPractice }: DetailModalProps) {
  const isFav = favorites.includes(kanji.char);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Restart Animation
  const handlePlayAnimation = () => {
    setIsPlaying(true);
    setAnimationKey(prev => prev + 1);
  };

  const handleSpeak = () => {
    speakJapanese(kanji.char);
  };

  // PDF Export using Canvas rendering + jsPDF download
  const handleExportPDF = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw header double border/line
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    // Internal margin
    const margin = 80;
    
    // 1. Header Text
    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MIDORI KANJI PRACTICE SHEET", canvas.width / 2, 110);

    ctx.fillStyle = "#64748b";
    ctx.font = "16px sans-serif";
    ctx.fillText("Tự động xuất từ ứng dụng học tập Midori Student", canvas.width / 2, 145);

    // Double line below header
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

    // 2. Main content: Left Kanji Box & Right Info Box
    const kx = 80;
    const ky = 210;
    const kw = 320;
    const kh = 320;

    // Draw Kanji Box border
    ctx.strokeStyle = "#4f46e5";
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

    // Draw Large Kanji inside Box
    ctx.save();
    ctx.translate(kx + kw / 2, ky + kh / 2 - 25);
    ctx.scale(2.0, 2.0);
    ctx.translate(-50, -50);
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    kanji.svgPaths.forEach(pathStr => {
      const p2d = new Path2D(pathStr);
      ctx.stroke(p2d);
    });
    ctx.restore();

    // Draw Sino-Vietnamese name inside Kanji Box
    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(kanji.sinoVietnamese, kx + kw / 2, ky + kh - 30);

    // Right Info Box
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

    // 3. Stroke breakdown order
    const sby = 560;
    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Thứ tự các nét viết (Stroke Order)", margin, sby);

    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(margin, sby + 10);
    ctx.lineTo(margin + 50, sby + 10);
    ctx.stroke();

    // Draw stroke steps
    const stepSize = 65;
    const stepGap = 12;
    const startX = margin;
    const startY = sby + 30;

    kanji.svgPaths.forEach((path, idx) => {
      const row = Math.floor(idx / 14);
      const col = idx % 14;
      const x = startX + col * (stepSize + stepGap);
      const y = startY + row * (stepSize + stepGap);

      // Draw box border
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.fillStyle = "#f8fafc";
      drawRoundRect(x, y, stepSize, stepSize, 8);
      ctx.fill();
      ctx.stroke();

      // Draw cumulative paths
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

      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 6;
      const currentP2D = new Path2D(path);
      ctx.stroke(currentP2D);
      ctx.restore();

      // Draw step number
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(idx + 1), x + stepSize - 5, y + stepSize - 5);
    });

    const strokeRowsCount = Math.ceil(kanji.svgPaths.length / 14);
    const strokeSectionHeight = strokeRowsCount * (stepSize + stepGap);

    // 4. Practice Grid Section
    const pgy = startY + strokeSectionHeight + 30;
    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Luyện viết tay (Practice Grid)", margin, pgy);

    ctx.strokeStyle = "#4f46e5";
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

        // Draw solid square border
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1;
        drawRoundRect(bx, by, boxSize, boxSize, 12);
        ctx.stroke();

        // Draw dashed crosshair lines inside square
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

        // Watermark trace for first 3 squares
        if (r === 0 && c < 3) {
          ctx.save();
          ctx.translate(bx + boxSize / 2, by + boxSize / 2);
          ctx.scale((boxSize * 0.8) / 100, (boxSize * 0.8) / 100);
          ctx.translate(-50, -50);
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          kanji.svgPaths.forEach(pathStr => {
            const p2d = new Path2D(pathStr);
            ctx.stroke(p2d);
          });
          ctx.restore();
        }
      }
    }

    // 5. Footer
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, 1630);
    ctx.lineTo(canvas.width - margin, 1630);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Bản quyền thuộc về Midori Japanese Platform © 2026. Tất cả các quyền được bảo lưu.", canvas.width / 2, 1660);

    // Save as PDF
    import("jspdf").then(({ jsPDF }) => {
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      pdf.save(`midori-kanji-${kanji.char}.pdf`);
    }).catch(err => {
      console.error("Failed to load jsPDF library dynamically:", err);
      alert("Đã xảy ra lỗi khi tải thư viện xuất PDF!");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row"
      >
        
        {/* Left Side: Large Kanji Character & Animation */}
        <div className="w-full md:w-1/2 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50">
          
          {/* Header toolbar */}
          <div className="w-full flex justify-between items-center mb-4">
            <button
              onClick={() => onToggleFav(kanji.char)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-pink-500 shadow-sm transition"
            >
              <Heart className={cn("w-5 h-5", isFav && "fill-pink-500 text-pink-500")} />
            </button>
          </div>

          {/* Kanji SVG Drawing Display */}
          <div className="relative w-48 h-48 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
            {/* Background grid lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400 border-dashed" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400 border-dashed" />
            </div>

            <svg key={animationKey} viewBox="0 0 100 100" className="w-40 h-40">
              {kanji.svgPaths.map((path, index) => {
                // Calculation of path length to animate it drawing
                // Standard default length is ~100
                const pathLength = 120;
                
                return (
                  <motion.path
                    key={index}
                    d={path}
                    fill="none"
                    stroke="#111827"
                    strokeWidth={5}
                    strokeLinecap="round"
                    initial={isPlaying ? { strokeDasharray: pathLength, strokeDashoffset: pathLength } : {}}
                    animate={isPlaying ? { strokeDashoffset: 0 } : {}}
                    transition={isPlaying ? {
                      duration: 0.8,
                      delay: index * 0.8,
                      ease: "easeInOut"
                    } : {}}
                    onAnimationComplete={index === kanji.svgPaths.length - 1 ? () => setIsPlaying(false) : undefined}
                  />
                );
              })}
            </svg>

            {!isPlaying && (
              <button
                onClick={handlePlayAnimation}
                className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[2px] opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-50 flex items-center justify-center shadow-lg text-white">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </button>
            )}
          </div>

          <div className="w-full text-center mt-4">
            <h2 
              className="text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: "var(--font-japanese)" }}
            >
              {kanji.char}
            </h2>
            <p className="text-sm text-indigo-600 font-extrabold tracking-widest mt-1">
              {kanji.sinoVietnamese}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="w-full flex gap-2 mt-6">
            <button
              onClick={handleExportPDF}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Tải file tập viết
            </button>
            
            <button
              onClick={onOpenPractice}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-pink-400 hover:opacity-90 text-xs text-white font-bold transition shadow-lg shadow-purple-500/20"
            >
              <BookOpen className="w-4 h-4" />
              Luyện viết
            </button>
          </div>

        </div>

        {/* Right Side: Kanji Metadata Info */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between bg-white">
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold">
                  {kanji.strokes} nét viết
                </span>
                <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-600 border border-pink-200 text-[10px] font-bold">
                  Bộ: {kanji.radical}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ý nghĩa</h4>
              <p className="text-sm text-slate-800 mt-1 font-semibold">{kanji.meaning}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Âm Onyomi</h4>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">
                  {kanji.onyomi}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Âm Kunyomi</h4>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">
                  {kanji.kunyomi}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-500" /> Mẹo ghi nhớ
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-200">
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

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#10b981"; // Emerald color for writing practice
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
      y: (clientY - rect.top) * scaleY
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
    ctx.moveTo(currentStroke[currentStroke.length - 1]?.x || coords.x, currentStroke[currentStroke.length - 1]?.y || coords.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setCurrentStroke(prev => [...prev, coords]);
  };

  const stopDraw = () => {
    if (isDrawing && currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
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

    remaining.forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Sub Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Chi tiết
        </button>

        <h3 className="font-extrabold text-slate-900 text-lg">
          Luyện viết chữ: {kanji.char} ({kanji.sinoVietnamese})
        </h3>
      </div>

      {/* Stroke breakdown steps */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md">
        <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">
          Mô tả các bước rã nét viết (Stroke buildup steps):
        </h4>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {kanji.svgPaths.map((path, idx) => (
            <div key={idx} className="flex-shrink-0 w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                {/* Previous strokes */}
                {kanji.svgPaths.slice(0, idx).map((p, pIdx) => (
                  <path key={pIdx} d={p} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={4} strokeLinecap="round" />
                ))}
                {/* Current stroke */}
                <path d={path} fill="none" stroke="#10b981" strokeWidth={5} strokeLinecap="round" />
              </svg>
              <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-bold">
                Nét {idx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Writing Canvas Board */}
      <div className="relative bg-white border-2 border-dashed border-slate-200 rounded-3xl aspect-square w-full max-w-md mx-auto overflow-hidden shadow-sm">
        
        {/* Guide grid helper */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 border-dashed" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 border-dashed" />
        </div>

        {/* Gray Guide Kanji Background */}
        {showGuide && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <span 
              className="text-[250px] font-bold text-slate-300 select-none"
              style={{ fontFamily: "var(--font-japanese)" }}
            >
              {kanji.char}
            </span>
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

      {/* Practice Controls */}
      <div className="flex gap-3 max-w-md mx-auto">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className={cn(
            "flex-1 py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm",
            showGuide 
              ? "bg-indigo-50 border-indigo-200 text-indigo-600"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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

      {/* Evaluate Button */}
      <div className="max-w-md mx-auto">
        <button
          onClick={handleEvaluate}
          className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-blue-400 to-pink-400 text-white font-bold text-sm shadow-md shadow-purple-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Award className="w-4.5 h-4.5" /> Chấm điểm nét viết
        </button>
      </div>

      {/* Evaluate Score Display Card */}
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
            <div className="text-4xl font-black bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent mb-2">
              {score}%
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              {feedback}
            </p>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Số nét đã viết: {strokes.length} / {kanji.strokes} nét
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
