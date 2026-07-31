import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanjiStrokePlayerProps {
  /**
   * UUID of the kanji entry in PostgreSQL.
   * The component fetches SVG via GET /api/kanji/{kanjiId}/svg
   * — no Unicode computation in React.
   */
  kanjiId: string;
}

export function KanjiStrokePlayer({ kanjiId }: KanjiStrokePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const textsRef = useRef<SVGTextElement[]>([]);
  
  const currentStrokeIndexRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const [svgText, setSvgText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [currentStroke, setCurrentStroke] = useState<number>(0);
  const [totalStrokes, setTotalStrokes] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5, 1, 2

  // Fetch SVG from backend using UUID (no character/unicode computation)
  useEffect(() => {
    if (!kanjiId) return;

    // Reset player state
    setIsPlaying(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    currentStrokeIndexRef.current = 0;
    setCurrentStroke(0);
    progressRef.current = 0;
    lastTimeRef.current = null;
    pathsRef.current = [];
    textsRef.current = [];

    setLoading(true);
    setError("");
    setSvgText("");

    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
    fetch(`${BASE_URL}/kanji/${kanjiId}/svg`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("midori_access_token")}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Stroke animation is unavailable.");
        }
        return res.text();
      })
      .then((data) => {
        setSvgText(data);
      })
      .catch((err) => {
        console.error("Lỗi khi tải SVG Kanji:", err);
        setError("Stroke animation is unavailable.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [kanjiId]);

  // Inject SVG and prepare paths
  useEffect(() => {
    if (!svgText || !containerRef.current) return;

    // Inject SVG string
    containerRef.current.innerHTML = svgText;

    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) {
      setError("Dữ liệu hình ảnh lỗi.");
      return;
    }

    // Stylings to make it responsive
    svgEl.setAttribute("width", "100%");
    svgEl.setAttribute("height", "100%");
    svgEl.setAttribute("viewBox", "0 0 109 109");
    svgEl.style.overflow = "visible";

    // 1. Create watermark in background
    const existingWatermark = svgEl.querySelector(".kanjivg-watermark");
    if (existingWatermark) existingWatermark.remove();

    const pathsGroup = svgEl.querySelector('[id^="kvg:StrokePaths"]');
    if (pathsGroup) {
      const watermarkGroup = pathsGroup.cloneNode(true) as SVGElement;
      watermarkGroup.removeAttribute("id");
      watermarkGroup.classList.add("kanjivg-watermark");
      const watermarkPaths = watermarkGroup.querySelectorAll("path");
      watermarkPaths.forEach((p) => {
        p.style.stroke = "currentColor";
        p.style.opacity = "0.08";
        p.style.strokeWidth = "3";
        p.style.fill = "none";
      });
      pathsGroup.parentNode?.insertBefore(watermarkGroup, pathsGroup);

      // 2. Prepare active animation paths
      const activePaths = pathsGroup.querySelectorAll("path");
      const parsedPaths = Array.from(activePaths) as SVGPathElement[];
      pathsRef.current = parsedPaths;
      setTotalStrokes(parsedPaths.length);

      parsedPaths.forEach((p) => {
        p.style.stroke = "#ec4899"; // Vibrant Pink
        p.style.strokeWidth = "4";
        p.style.strokeLinecap = "round";
        p.style.strokeLinejoin = "round";
        p.style.fill = "none";

        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      });
    }

    // 3. Prepare stroke numbers
    const numbersGroup = svgEl.querySelector('[id^="kvg:StrokeNumbers"]');
    if (numbersGroup) {
      const texts = numbersGroup.querySelectorAll("text");
      const parsedTexts = Array.from(texts) as SVGTextElement[];
      textsRef.current = parsedTexts;

      parsedTexts.forEach((t) => {
        t.style.fontFamily = "Inter, sans-serif";
        t.style.fontSize = "7.5px";
        t.style.fontWeight = "900";
        t.style.fill = "#f43f5e"; // Rose red
        t.style.opacity = "0";
      });
    }

    // Wait for the browser to render the SVG before computing getTotalLength()
    // otherwise it might return 0, making strokes invisible.
    setTimeout(() => {
      const pathsGroup = svgEl.querySelector('[id^="kvg:StrokePaths"]');
      if (pathsGroup) {
        const parsedPaths = Array.from(pathsGroup.querySelectorAll("path")) as SVGPathElement[];
        parsedPaths.forEach((p) => {
          const len = p.getTotalLength() || 1000; // fallback just in case
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
        });
      }
      // Auto play when loaded
      setIsPlaying(true);
    }, 50);

  }, [svgText]);

  // Animation Loop
  const animate = (timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const paths = pathsRef.current;
    const currentIdx = currentStrokeIndexRef.current;

    if (currentIdx >= paths.length) {
      setIsPlaying(false);
      lastTimeRef.current = null;
      return;
    }

    // Draw duration per stroke (base 750ms scaled by speed)
    const strokeDuration = 750 / speed;
    progressRef.current += deltaTime / strokeDuration;

    if (progressRef.current >= 1) {
      progressRef.current = 1;
    }

    // Animate current path
    const activePath = paths[currentIdx];
    if (activePath) {
      const len = activePath.getTotalLength();
      activePath.style.strokeDashoffset = `${len * (1 - progressRef.current)}`;
    }

    // Show current stroke number
    if (textsRef.current[currentIdx]) {
      textsRef.current[currentIdx].style.opacity = "1";
    }

    // Ensure all previous paths are fully drawn
    for (let i = 0; i < currentIdx; i++) {
      if (paths[i]) {
        paths[i].style.strokeDashoffset = "0";
      }
      if (textsRef.current[i]) {
        textsRef.current[i].style.opacity = "1";
      }
    }

    // Ensure all future paths are fully hidden
    for (let i = currentIdx + 1; i < paths.length; i++) {
      if (paths[i]) {
        const len = paths[i].getTotalLength();
        paths[i].style.strokeDashoffset = `${len}`;
      }
      if (textsRef.current[i]) {
        textsRef.current[i].style.opacity = "0";
      }
    }

    if (progressRef.current >= 1) {
      currentStrokeIndexRef.current += 1;
      setCurrentStroke(currentStrokeIndexRef.current);
      progressRef.current = 0;

      if (currentStrokeIndexRef.current >= paths.length) {
        setIsPlaying(false);
        lastTimeRef.current = null;
        return;
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = null;
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, speed]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentStrokeIndexRef.current >= pathsRef.current.length) {
        currentStrokeIndexRef.current = 0;
        setCurrentStroke(0);
        progressRef.current = 0;
        pathsRef.current.forEach((p) => {
          p.style.strokeDashoffset = `${p.getTotalLength()}`;
        });
        textsRef.current.forEach((t) => {
          t.style.opacity = "0";
        });
      }
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    setIsPlaying(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    currentStrokeIndexRef.current = 0;
    setCurrentStroke(0);
    progressRef.current = 0;
    lastTimeRef.current = null;

    pathsRef.current.forEach((p) => {
      p.style.strokeDashoffset = `${p.getTotalLength()}`;
    });
    textsRef.current.forEach((t) => {
      t.style.opacity = "0";
    });

    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[280px] space-y-4">
      {/* Stroke player canvas */}
      <div className="relative w-52 h-52 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-[28px] flex items-center justify-center overflow-hidden shadow-sm">
        {/* Background writing grid */}
        <div className="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-slate-200 dark:text-slate-800">
            <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
          </svg>
        </div>

        {loading && (
          <div className="absolute z-20 inset-0 flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-[1px]">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold leading-snug">{error}</span>
          </div>
        ) : (
          <div ref={containerRef} className="w-40 h-40 text-slate-800 dark:text-slate-100 relative z-10 flex items-center justify-center" />
        )}
      </div>

      {/* Control bar */}
      {!error && !loading && (
        <div className="w-full space-y-3">
          {/* Progress indicators & numbers */}
          <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
            <span>Nét: {currentStroke} / {totalStrokes}</span>
            <span>Tốc độ: x{speed}</span>
          </div>

          <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/40 dark:border-white/5 rounded-2xl p-2 flex items-center justify-between gap-1 shadow-sm">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              disabled={loading || !!error}
              className="p-2.5 bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-xl transition cursor-pointer shadow-sm shadow-pink-500/20 disabled:opacity-50"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            {/* Replay */}
            <button
              onClick={handleReplay}
              disabled={loading || !!error}
              className="p-2.5 bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 active:scale-95 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Xem lại từ đầu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-200/50 dark:bg-slate-950/40 rounded-xl p-0.5 border border-slate-200/20 dark:border-white/5">
              {([0.5, 1, 2] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={cn(
                    "px-2.5 py-1.5 text-[9px] font-extrabold rounded-lg transition-all cursor-pointer",
                    speed === s
                      ? "bg-white dark:bg-slate-800 text-pink-500 shadow-xs"
                      : "text-slate-450 hover:text-slate-700 dark:hover:text-slate-250"
                  )}
                >
                  x{s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
