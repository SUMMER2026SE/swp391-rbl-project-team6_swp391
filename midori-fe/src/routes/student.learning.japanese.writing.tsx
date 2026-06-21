import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Eraser,
  Undo,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import {
  HIRAGANA_BASIC,
  KATAKANA_BASIC,
  HIRAGANA_DAKUTEN,
  KATAKANA_DAKUTEN,
  HIRAGANA_COMBINATION,
  KATAKANA_COMBINATION,
  speakJapanese,
} from "@/data/japanese-learning-data";

export const Route = createFileRoute("/student/learning/japanese/writing")({
  component: WritingPracticePage,
});

type CharacterSet = {
  name: string;
  chars: { char: string; romaji: string }[];
  color: string;
};

const CHARACTER_SETS: { id: string; name: string; data: CharacterSet }[] = [
  {
    id: "hiragana-basic",
    name: "Hiragana Basic",
    data: { name: "Hiragana Basic", chars: HIRAGANA_BASIC, color: "from-pink-400 to-rose-500" },
  },
  {
    id: "katakana-basic",
    name: "Katakana Basic",
    data: { name: "Katakana Basic", chars: KATAKANA_BASIC, color: "from-blue-400 to-cyan-500" },
  },
  {
    id: "hiragana-dakuten",
    name: "Hiragana Dakuten",
    data: { name: "Hiragana Dakuten", chars: HIRAGANA_DAKUTEN, color: "from-purple-400 to-violet-500" },
  },
  {
    id: "katakana-dakuten",
    name: "Katakana Dakuten",
    data: { name: "Katakana Dakuten", chars: KATAKANA_DAKUTEN, color: "from-indigo-400 to-blue-500" },
  },
  {
    id: "hiragana-combination",
    name: "Hiragana Combinations",
    data: { name: "Hiragana Combinations", chars: HIRAGANA_COMBINATION, color: "from-emerald-400 to-teal-500" },
  },
  {
    id: "katakana-combination",
    name: "Katakana Combinations",
    data: { name: "Katakana Combinations", chars: KATAKANA_COMBINATION, color: "from-cyan-400 to-sky-500" },
  },
];

function WritingPracticePage() {
  const [selectedSetId, setSelectedSetId] = useState("hiragana-basic");
  const [showGuide, setShowGuide] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showSetSelector, setShowSetSelector] = useState(true);
  const [completedChars, setCompletedChars] = useState<Set<string>>(new Set());

  const selectedSet = CHARACTER_SETS.find((s) => s.id === selectedSetId)?.data;
  const currentChar = selectedSet?.chars[currentIdx];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // Clear canvas when character changes
  useEffect(() => {
    clearCanvas();
    setIsCorrect(null);
  }, [currentIdx, selectedSetId]);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setCurrentStroke([coords]);
  }, [getCoordinates]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const coords = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(currentStroke[currentStroke.length - 1]?.x || coords.x, currentStroke[currentStroke.length - 1]?.y || coords.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setCurrentStroke((prev) => [...prev, coords]);
  }, [isDrawing, currentStroke, getCoordinates]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setCurrentStroke([]);
    setIsCorrect(null);
  }, []);

  const undoLastStroke = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    if (strokes.length === 0) return;

    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    newStrokes.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    setIsCorrect(null);
  }, [strokes]);

  const markAsComplete = () => {
    if (currentChar) {
      setCompletedChars((prev) => new Set([...prev, currentChar.char]));
      setIsCorrect(true);
      setTimeout(() => {
        if (currentIdx < (selectedSet?.chars.length || 0) - 1) {
          setCurrentIdx((i) => i + 1);
        }
      }, 1000);
    }
  };

  // Set selector view
  if (showSetSelector) {
    return (
      <div className="min-h-screen">
        <SakuraBg count={15} />
        <div className="relative z-10">
          <div className="w-full max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <Link
                to="/student/learning/japanese"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">Writing Practice</h1>
                <p className="text-sm text-slate-500 dark:text-indigo-200/60">Practice writing characters</p>
              </div>
            </div>

            {/* Character Sets */}
            <div className="grid gap-4">
              {CHARACTER_SETS.map((set, index) => (
                <motion.button
                  key={set.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedSetId(set.id);
                    setCurrentIdx(0);
                    setCompletedChars(new Set());
                    setShowSetSelector(false);
                  }}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl bg-white/80 dark:bg-indigo-950/50 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all text-left",
                    selectedSetId === set.id && "ring-2 ring-primary"
                  )}
                >
                  <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white shadow-lg", set.data.color)}>
                    {set.data.chars[0]?.char}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">{set.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-indigo-200/60">{set.data.chars.length} characters</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedSet || !currentChar) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <SakuraBg count={15} />
      <div className="relative z-10">
        <div className="w-full max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSetSelector(true)}
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white">{selectedSet.name}</h1>
                <p className="text-xs text-slate-500 dark:text-indigo-200/60">
                  {completedChars.size} / {selectedSet.chars.length} completed
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition",
                showGuide
                  ? "bg-primary/10 text-primary"
                  : "bg-white/60 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80"
              )}
            >
              {showGuide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Guide
            </button>
          </div>

          {/* Progress */}
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-indigo-200/80">
              Character <span className="font-bold text-slate-800 dark:text-white">{currentIdx + 1}</span> of{" "}
              <span className="text-slate-500">{selectedSet.chars.length}</span>
            </span>
          </div>
          <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / selectedSet.chars.length) * 100}%` }}
              className={cn("h-full rounded-full", `bg-gradient-to-r ${selectedSet.color}`)}
            />
          </div>

          {/* Character Display */}
          <div className="text-center mb-4">
            <div
              className="text-4xl font-black text-slate-700 dark:text-white inline-flex items-center gap-4"
              style={{ fontFamily: "var(--font-japanese)" }}
            >
              {currentChar.char}
              <button
                onClick={() => speakJapanese(currentChar.char)}
                className="p-2 rounded-xl bg-slate-100/80 dark:bg-white/10 text-slate-500 hover:text-primary transition"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <div className="text-lg text-slate-500 dark:text-indigo-200/60 mt-1">{currentChar.romaji}</div>
          </div>

          {/* Canvas Area */}
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/20 overflow-hidden mb-4">
            {/* Guide Character */}
            {showGuide && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <span
                  className="text-[180px] font-black text-slate-800 dark:text-white select-none"
                  style={{ fontFamily: "var(--font-japanese)" }}
                >
                  {currentChar.char}
                </span>
              </div>
            )}

            {/* Grid lines for guidance */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300 dark:bg-white/10" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 dark:bg-white/10" />
            </div>

            {/* Drawing Canvas */}
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full aspect-square touch-none cursor-crosshair"
            />

            {/* Success indicator */}
            {isCorrect && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm"
              >
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-2xl">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={undoLastStroke}
              disabled={strokes.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-semibold disabled:opacity-30 transition"
            >
              <Undo className="w-4 h-4" />
              Undo
            </button>
            <button
              onClick={clearCanvas}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-semibold hover:bg-slate-100 transition"
            >
              <Eraser className="w-4 h-4" />
              Clear
            </button>
          </div>

          {/* Complete Button */}
          <button
            onClick={markAsComplete}
            disabled={isCorrect === true}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all",
              isCorrect === true
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90"
            )}
          >
            {isCorrect === true ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Completed! Moving to next...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Mark as Complete
              </>
            )}
          </button>

          {/* Character Navigation */}
          <div className="flex items-center justify-center gap-2 mt-4 overflow-x-auto pb-2">
            {selectedSet.chars.slice(0, 15).map((char, idx) => (
              <button
                key={char.char}
                onClick={() => setCurrentIdx(idx)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all shrink-0",
                  idx === currentIdx
                    ? "bg-primary text-white shadow-lg"
                    : completedChars.has(char.char)
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                    : "bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-100"
                )}
              >
                <span style={{ fontFamily: "var(--font-japanese)" }}>{char.char}</span>
              </button>
            ))}
            {selectedSet.chars.length > 15 && (
              <span className="text-xs text-slate-500 shrink-0">+{selectedSet.chars.length - 15} more</span>
            )}
          </div>

          {/* Prev/Next buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                if (currentIdx > 0) {
                  setCurrentIdx((i) => i - 1);
                }
              }}
              disabled={currentIdx === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-semibold disabled:opacity-30 transition"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => {
                if (currentIdx < selectedSet.chars.length - 1) {
                  setCurrentIdx((i) => i + 1);
                }
              }}
              disabled={currentIdx === selectedSet.chars.length - 1}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-semibold disabled:opacity-30 transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
