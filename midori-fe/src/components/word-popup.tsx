import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bookmark, BookmarkCheck, Loader2, ExternalLink, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { dictionaryApi } from "@/lib/api/dictionary";

export interface SavedWord {
  word: string;
  reading: string;
  meaning: string;
  context?: string;
  savedAt: string;
}

const STORAGE_KEY = "midori_saved_words";

// Hook to manage saved words
// Hook to manage saved words
export function useSavedWords(videoId?: string) {
  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => {
    if (videoId) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const mapBackendToSavedWord = useCallback((w: any): SavedWord => ({
    word: w.surface,
    reading: w.reading || w.surface,
    meaning: w.meaning,
    context: w.context || "",
    savedAt: w.createdAt || new Date().toISOString()
  }), []);

  useEffect(() => {
    if (!videoId) return;

    let active = true;
    dictionaryApi.getSavedWords(videoId)
      .then(data => {
        if (active && Array.isArray(data)) {
          setSavedWords(data.map(mapBackendToSavedWord));
        }
      })
      .catch(err => {
        console.error("[SavedWords] Error fetching saved words from backend:", err);
      });

    return () => {
      active = false;
    };
  }, [videoId, mapBackendToSavedWord]);

  const saveWord = useCallback(async (word: SavedWord) => {
    if (videoId) {
      try {
        await dictionaryApi.saveWord({
          word: word.word,
          reading: word.reading,
          meaning: word.meaning,
          context: word.context,
          lessonId: videoId
        });
        setSavedWords((prev) => {
          const exists = prev.some(
            (w) => w.word === word.word && w.reading === word.reading
          );
          if (exists) return prev;
          return [word, ...prev];
        });
      } catch (err) {
        console.error("[SavedWords] Failed to save word to backend:", err);
      }
    } else {
      setSavedWords((prev) => {
        const exists = prev.some(
          (w) => w.word === word.word && w.reading === word.reading
        );
        if (exists) return prev;
        const updated = [word, ...prev].slice(0, 500); // Keep max 500 words
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("midori_saved_words_changed"));
        return updated;
      });
    }
  }, [videoId]);

  const removeWord = useCallback(async (word: string, reading: string) => {
    if (videoId) {
      try {
        await dictionaryApi.unsaveWord(word, videoId);
        setSavedWords((prev) =>
          prev.filter((w) => !(w.word === word && w.reading === reading))
        );
      } catch (err) {
        console.error("[SavedWords] Failed to remove word from backend:", err);
      }
    } else {
      setSavedWords((prev) => {
        const updated = prev.filter(
          (w) => !(w.word === word && w.reading === reading)
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("midori_saved_words_changed"));
        return updated;
      });
    }
  }, [videoId]);

  const isWordSaved = useCallback(
    (word: string, reading: string) => {
      return savedWords.some(
        (w) => w.word === word && (w.reading === reading || !reading)
      );
    },
    [savedWords]
  );

  useEffect(() => {
    if (videoId) return;
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setSavedWords(stored ? JSON.parse(stored) : []);
      } catch {
        setSavedWords([]);
      }
    };

    window.addEventListener("midori_saved_words_changed", handleStorageChange);
    
    const handleWindowStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        handleStorageChange();
      }
    };
    window.addEventListener("storage", handleWindowStorage);

    return () => {
      window.removeEventListener("midori_saved_words_changed", handleStorageChange);
      window.removeEventListener("storage", handleWindowStorage);
    };
  }, [videoId]);

  return { savedWords, saveWord, removeWord, isWordSaved };
}

// Dictionary API types
interface DictionaryResult {
  word: string;
  reading: string;
  meaning: string;
  pos?: string;
  examples?: { ja: string; vn: string }[];
}

interface WordPopupProps {
  word: string;
  reading?: string;
  position: { x: number; y: number };
  onClose: () => void;
  contextSentence?: string;
}

// Use student dictionary API (more comprehensive) with proper Vietnamese meanings
async function lookupWord(japanese: string): Promise<DictionaryResult | null> {
  if (!japanese || japanese.trim() === "") return null;

  try {
    // Call the comprehensive student dictionary lookup which has:
    // 1. Vietnamese meanings (preferred) - primaryMeaning, contextMeaning
    // 2. English meanings (fallback)
    // 3. AI enrichment
    // 4. Better phrase segmentation
    const result = await dictionaryApi.lookupWord({
      word: japanese.trim(),
      reading: undefined,
      sentence: undefined,
      lessonId: undefined,
      surface: undefined,
    });

    // Check if backend returned valid data with meanings
    if (result && result.surface) {
      // Prefer Vietnamese meanings (primaryMeaning, contextMeaning)
      // Fallback to English meanings if Vietnamese not available
      let meaning = "";
      
      if (result.contextMeaning && result.contextMeaning.trim()) {
        // Use Vietnamese context meaning with explanation
        meaning = result.contextMeaning;
        if (result.contextExplanation && result.contextExplanation.trim()) {
          meaning += ` • ${result.contextExplanation}`;
        }
      } else if (result.primaryMeaning && result.primaryMeaning.trim()) {
        // Use Vietnamese primary meaning
        meaning = result.primaryMeaning;
      } else if (result.meanings && result.meanings.length > 0) {
        // Fallback to meanings array (might be English)
        meaning = result.meanings.join("; ");
      }
      
      if (meaning.trim()) {
        return {
          word: result.surface || japanese,
          reading: result.reading || japanese,
          meaning: meaning,
          pos: result.wordType,
        };
      }
    }

    // If no meanings found, try the simpler hover endpoint as fallback
    try {
      const hoverResult = await dictionaryApi.getHoverInfo(japanese);
      if (hoverResult && hoverResult.word && hoverResult.meanings && hoverResult.meanings.length > 0) {
        return {
          word: hoverResult.word || japanese,
          reading: hoverResult.reading || japanese,
          meaning: hoverResult.meanings.join("; "),
          pos: hoverResult.partOfSpeech,
        };
      }
    } catch {
      // Ignore hover fallback errors
    }
  } catch (err) {
    console.error(`[Dictionary] Error looking up word "${japanese}":`, err);
    // Continue to fallback dictionary
  }

  const localDictionary: Record<string, DictionaryResult> = {
    "する": { word: "する", reading: "する", meaning: "Làm, thực hiện (làm động từ tự do)", pos: "động từ" },
    "見る": { word: "見る", reading: "みる", meaning: "Nhìn, xem", pos: "động từ group 2" },
    "聞く": { word: "聞く", reading: "きく", meaning: "Nghe, hỏi", pos: "động từ group 1" },
    "行く": { word: "行く", reading: "いく", meaning: "Đi", pos: "động từ group 1" },
    "来る": { word: "来る", reading: "くる", meaning: "Đến, tới", pos: "động từ group 3" },
    "食べる": { word: "食べる", reading: "たべる", meaning: "Ăn", pos: "động từ group 2" },
    "飲む": { word: "飲む", reading: "のむ", meaning: "Uống", pos: "động từ group 1" },
    "読む": { word: "読む", reading: "よむ", meaning: "Đọc", pos: "động từ group 1" },
    "書く": { word: "書く", reading: "かく", meaning: "Viết", pos: "động từ group 1" },
    "話す": { word: "話す", reading: "はなす", meaning: "Nói, nói chuyện", pos: "động từ group 1" },
    "分かる": { word: "分かる", reading: "わかる", meaning: "Hiểu, biết", pos: "động từ group 1" },
    "思う": { word: "思う", reading: "おもう", meaning: "Nghĩ", pos: "động từ group 1" },
    "作る": { word: "作る", reading: "つくる", meaning: "Làm, tạo, chế tạo", pos: "động từ group 1" },
    "大きい": { word: "大きい", reading: "おおきい", meaning: "Lớn", pos: "tính từ -i" },
    "小さい": { word: "小さい", reading: "ちいさい", meaning: "Nhỏ", pos: "tính từ -i" },
    "新しい": { word: "新しい", reading: "あたらしい", meaning: "Mới", pos: "tính từ -i" },
    "古い": { word: "古い", reading: "ふるい", meaning: "Cũ", pos: "tính từ -i" },
    "良い": { word: "良い", reading: "よい/いい", meaning: "Tốt", pos: "tính từ -i" },
    "悪い": { word: "悪い", reading: "わるい", meaning: "Xấu", pos: "tính từ -i" },
    "高い": { word: "高い", reading: "たかい", meaning: "Cao, đắt", pos: "tính từ -i" },
    "美味しい": { word: "美味しい", reading: "おいしい", meaning: "Ngon", pos: "tính từ -i" },
    "人": { word: "人", reading: "ひと", meaning: "Người", pos: "danh từ" },
    "日本": { word: "日本", reading: "にほん", meaning: "Nhật Bản", pos: "danh từ" },
    "日本語": { word: "日本語", reading: "にほんご", meaning: "Tiếng Nhật", pos: "danh từ" },
    "水": { word: "水", reading: "みず", meaning: "Nước", pos: "danh từ" },
    "車": { word: "車", reading: "くるま", meaning: "Xe hơi", pos: "danh từ" },
    "学校": { word: "学校", reading: "がっこう", meaning: "Trường học", pos: "danh từ" },
    "会社": { word: "会社", reading: "かいしゃ", meaning: "Công ty", pos: "danh từ" },
    "先生": { word: "先生", reading: "せんせい", meaning: "Giáo viên, thầy cô", pos: "danh từ" },
    "友達": { word: "友達", reading: "ともだち", meaning: "Bạn bè", pos: "danh từ" },
    "家族": { word: "家族", reading: "かぞく", meaning: "Gia đình", pos: "danh từ" },
    "時間": { word: "時間", reading: "じかん", meaning: "Thời gian", pos: "danh từ" },
    "今日": { word: "今日", reading: "きょう", meaning: "Hôm nay", pos: "danh từ" },
    "明日": { word: "明日", reading: "あした", meaning: "Ngày mai", pos: "danh từ" },
    "昨日": { word: "昨日", reading: "きのう", meaning: "Hôm qua", pos: "danh từ" },
    "は": { word: "は", reading: "wa", meaning: "Chủ ngữ/đề tài (trợ từ)", pos: "trợ từ" },
    "を": { word: "を", reading: "wo/o", meaning: "Đuôi đối tượng (trợ từ)", pos: "trợ từ" },
    "が": { word: "が", reading: "ga", meaning: "Chủ ngữ (trợ từ)", pos: "trợ từ" },
    "に": { word: "に", reading: "ni", meaning: "Hướng tới, tại (trợ từ)", pos: "trợ từ" },
    "で": { word: "で", reading: "de", meaning: "Tại, bằng, với (trợ từ)", pos: "trợ từ" },
    "と": { word: "と", reading: "to", meaning: "Và, với, hoặc (trợ từ)", pos: "trợ từ" },
    "の": { word: "の", reading: "no", meaning: "Của, sở hữu (trợ từ)", pos: "trợ từ" },
    "ありがとう": { word: "ありがとう", reading: "arigatou", meaning: "Cảm ơn", pos: "cụm từ" },
    "すみません": { word: "すみません", reading: "sumimasen", meaning: "Xin lỗi, cảm ơn", pos: "cụm từ" },
  };

  return localDictionary[japanese] || null;
}

export function WordPopup({ word, reading, position, onClose, contextSentence }: WordPopupProps) {
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const { saveWord, removeWord, isWordSaved } = useSavedWords();
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setIsSaved(isWordSaved(word, reading || word));

    lookupWord(word).then((res) => {
      setResult(res);
      setLoading(false);
    });
  }, [word, reading, isWordSaved]);

  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth - 10) {
        popupRef.current.style.left = `${position.x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight - 10) {
        popupRef.current.style.top = `${position.y - rect.height - 10}px`;
      }
    }
  }, [position]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!result) return;

    if (isSaved) {
      removeWord(result.word, result.reading);
      setIsSaved(false);
    } else {
      saveWord({
        word: result.word,
        reading: result.reading,
        meaning: result.meaning,
        context: contextSentence,
        savedAt: new Date().toISOString(),
      });
      setIsSaved(true);
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window && result) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(result.reading || result.word);
      utterance.lang = "ja-JP";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998] pointer-events-none" />

      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.95, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -5 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: Math.min(position.x + 10, window.innerWidth - 340),
          top: Math.min(position.y + 10, window.innerHeight - 320),
          zIndex: 9999,
        }}
        className={cn(
          "w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700",
          "overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-0.5">
              📖 Từ điển
            </span>
            <span
              className="text-lg font-black text-slate-800 dark:text-white"
              style={{ fontFamily: "var(--font-japanese, serif)" }}
            >
              {word}
            </span>
            {result?.reading && result.reading !== word && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                [{result.reading}]
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : result && result.meaning && result.meaning.trim() !== "" ? (
            <div className="space-y-3">
              {/* Vietnamese Meaning */}
              <div className="flex items-start gap-2">
                {result.pos && (
                  <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary shrink-0">
                    {result.pos}
                  </span>
                )}
                <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {result.meaning.includes("• [") ? (
                    // Multi-part phrase segmentation results - render each part separately
                    result.meaning.split("; ").map((part, i) => (
                      <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
                        {part.match(/^•\s*\[(.+?)\]\s*(.*)$/) ? (
                          <>
                            <span className="font-bold text-primary shrink-0" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                              {part.match(/^•\s*\[(.+?)\]/)?.[1]}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {part.match(/^•\s*\[.+?\]\s*(.*)$/)?.[1]}
                            </span>
                          </>
                        ) : (
                          <span>{part}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-800 dark:text-white font-medium">{result.meaning}</p>
                  )}
                </div>
              </div>

              {/* Context Sentence */}
              {contextSentence && contextSentence.trim() !== "" && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3">
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5">
                    📝 Ngữ cảnh
                  </p>
                  <p
                    className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium"
                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                  >
                    {contextSentence}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Không tìm thấy nghĩa cho từ này.
              </p>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(word)}+意味`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                Tìm trên Google
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSpeak}
            disabled={!result}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition",
              result
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                : "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Phát âm
          </button>
          <button
            onClick={handleSave}
            disabled={!result}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition",
              isSaved
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            )}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5" />
                Đã lưu
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                Lưu từ
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}
