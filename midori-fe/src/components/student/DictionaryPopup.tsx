import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bookmark,
  BookmarkCheck,
  Loader2,
  ExternalLink,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Languages,
  Sparkles,
  Play,
  Pause,
  Save,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dictionaryApi, type DictionaryLookupResponse, type SaveWordRequest } from "@/lib/api/dictionary";

interface DictionaryPopupProps {
  position: { x: number; y: number };
  onClose: () => void;
  word: string;
  reading?: string;
  sentence?: string;
  lessonId?: string;
  surface?: string;
  onWordClick?: (word: string) => void;
}

export const DictionaryPopup = memo(function DictionaryPopup({
  position,
  onClose,
  word,
  reading,
  sentence,
  lessonId,
  surface,
  onWordClick,
}: DictionaryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DictionaryLookupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"meaning" | "forms" | "examples">("meaning");

  // Fetch word data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await dictionaryApi.lookupWord({
          word,
          reading,
          sentence,
          lessonId,
          surface,
        });
        setData(result);
        setIsSaved(result.saved);
      } catch (err) {
        console.error("[DictionaryPopup] Fetch error:", err);
        setError("Không tìm thấy nghĩa cho từ này.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [word, reading, sentence, lessonId, surface]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      let adjustedX = position.x;
      let adjustedY = position.y;

      // Prevent right overflow
      if (adjustedX + rect.width > window.innerWidth - 20) {
        adjustedX = window.innerWidth - rect.width - 20;
      }
      // Prevent bottom overflow - show above
      if (adjustedY + rect.height > window.innerHeight - 20) {
        adjustedY = position.y - rect.height - 20;
      }
      // Prevent left overflow
      if (adjustedX < 20) {
        adjustedX = 20;
      }
      // Prevent top overflow
      if (adjustedY < 20) {
        adjustedY = 20;
      }

      popupRef.current.style.left = `${adjustedX}px`;
      popupRef.current.style.top = `${adjustedY}px`;
    }
  }, [position, loading]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Text-to-speech
  const handleSpeak = useCallback(() => {
    if (!data?.surface) return;

    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(data.surface);
    utterance.lang = "ja-JP";
    utterance.rate = 0.8;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [data, isPlaying]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    if (!data) return;
    const text = `${data.surface}\n${data.reading}\n${data.primaryMeaning || data.meanings?.[0] || ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  // Save word
  const handleSave = useCallback(async () => {
    if (!data || isSaving) return;

    setIsSaving(true);
    try {
      const request: SaveWordRequest = {
        word: data.surface,
        reading: data.reading,
        meaning: data.primaryMeaning || data.meanings?.[0],
        context: sentence,
        lessonId,
        dictionaryForm: data.dictionaryForm,
        wordType: data.wordType,
        jlpt: data.jlpt,
      };

      const result = await dictionaryApi.saveWord(request);
      setIsSaved(result.saved);
    } catch (err) {
      console.error("[DictionaryPopup] Save error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [data, sentence, lessonId, isSaving]);

  // Open full dictionary
  const handleOpenDictionary = useCallback(() => {
    window.open(`/dictionary?word=${encodeURIComponent(word)}`, "_blank");
  }, [word]);

  // Handle word click in examples
  const handleWordClickInPopup = useCallback(
    (clickedWord: string) => {
      onWordClick?.(clickedWord);
    },
    [onWordClick]
  );

  // Get JLPT badge color
  const getJlptColor = (jlpt: string) => {
    switch (jlpt) {
      case "N5":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "N4":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "N3":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "N2":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "N1":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />

      {/* Popup */}
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.15 }}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 50,
        }}
        className={cn(
          "w-[420px] max-h-[520px] overflow-hidden bg-white dark:bg-slate-900",
          "rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700",
          "backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95"
        )}
        role="dialog"
        aria-label="Dictionary popup"
      >
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState error={error} onClose={onClose} word={word} onSearch={handleOpenDictionary} />
        ) : data ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between p-4">
                <div className="flex-1 min-w-0">
                  {/* Kanji with furigana above */}
                  <div className="flex flex-col items-start">
                    {data.reading && data.reading !== data.surface && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 mb-0.5" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                        {data.reading}
                      </span>
                    )}
                    <h2
                      className="text-3xl font-black text-slate-800 dark:text-white"
                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                    >
                      {data.surface}
                    </h2>
                  </div>

                  {/* Romaji */}
                  {data.romaji && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span>{data.romaji}</span>
                    </p>
                  )}

                  {/* Dictionary form */}
                  {data.dictionaryForm && data.dictionaryForm !== data.surface && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      <span className="text-slate-500">原型: </span>
                      <span style={{ fontFamily: "var(--font-japanese, serif)" }}>
                        {data.dictionaryForm}
                      </span>
                    </p>
                  )}

                  {/* Tags */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {data.jlpt && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold",
                          getJlptColor(data.jlpt)
                        )}
                      >
                        JLPT {data.jlpt}
                      </span>
                    )}
                    {data.wordType && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                        {data.wordType}
                      </span>
                    )}
                    {data.fromAi && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        AI
                      </span>
                    )}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
                >
                  <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 px-4">
                <button
                  onClick={() => setActiveTab("meaning")}
                  className={cn(
                    "px-3 py-2 text-xs font-bold border-b-2 transition-colors",
                    activeTab === "meaning"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  )}
                >
                  Nghĩa
                </button>
                {data.forms && (
                  <button
                    onClick={() => setActiveTab("forms")}
                    className={cn(
                      "px-3 py-2 text-xs font-bold border-b-2 transition-colors",
                      activeTab === "forms"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    )}
                  >
                    Biến thể
                  </button>
                )}
                {data.examples && data.examples.length > 0 && (
                  <button
                    onClick={() => setActiveTab("examples")}
                    className={cn(
                      "px-3 py-2 text-xs font-bold border-b-2 transition-colors",
                      activeTab === "examples"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    )}
                  >
                    Ví dụ
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[340px] p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
              {/* Context Meaning */}
              {data.contextMeaning && (
                <div className="rounded-xl bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Languages className="w-3 h-3" />
                    Nghĩa trong câu này
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {data.contextMeaning}
                  </p>
                  {data.contextExplanation && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {data.contextExplanation}
                    </p>
                  )}
                </div>
              )}

              {/* Tab: Meaning */}
              {activeTab === "meaning" && (
                <>
                  {/* All Meanings */}
                  {data.meanings && data.meanings.length > 0 && (
                    <div className="space-y-2">
                      {data.meanings.map((meaning, idx) => (
                        <div key={idx} className="flex items-start gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <span className="text-primary font-bold text-sm min-w-[20px]">{idx + 1}.</span>
                          <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                            {meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Context Meaning - Show prominently if available */}
                  {data.contextMeaning && (
                    <div className="mt-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-3">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Languages className="w-3 h-3" />
                        Nghĩa trong câu
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                        {data.contextMeaning}
                      </p>
                      {data.contextExplanation && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 italic">
                          {data.contextExplanation}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Tab: Forms */}
              {activeTab === "forms" && data.forms && (
                <div className="grid grid-cols-2 gap-2">
                  <FormItem label="ます" value={data.forms.masu} />
                  <FormItem label="て" value={data.forms.te} />
                  <FormItem label="た" value={data.forms.ta} />
                  <FormItem label="ない" value={data.forms.nai} />
                  <FormItem label="可能" value={data.forms.potential} />
                  <FormItem label="受身" value={data.forms.passive} />
                  <FormItem label="使役" value={data.forms.causative} />
                  <FormItem label="意向" value={data.forms.volitional} />
                  <FormItem label="たい" value={data.forms.tai} />
                  <FormItem label="なければ" value={data.forms.nakereba} />
                </div>
              )}

              {/* Tab: Examples */}
              {activeTab === "examples" && data.examples && (
                <div className="space-y-3">
                  {data.examples.map((example, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3"
                    >
                      {/* Japanese sentence with furigana */}
                      <div className="flex flex-col">
                        {example.reading && example.reading !== example.japanese && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                            {example.reading}
                          </span>
                        )}
                        <span
                          className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {example.japanese}
                        </span>
                      </div>
                      {/* Vietnamese meaning */}
                      {example.vietnamese && (
                        <p className="text-xs text-primary mt-2 leading-relaxed">
                          {example.vietnamese}
                        </p>
                      )}
                      {/* English meaning */}
                      {example.english && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                          {example.english}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-3">
              <div className="grid grid-cols-4 gap-2">
                <ActionButton
                  onClick={handleSpeak}
                  icon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  label={isPlaying ? "Dừng" : "Phát"}
                  variant={isPlaying ? "blue" : "gray"}
                />
                <ActionButton
                  onClick={handleCopy}
                  icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  label={copied ? "Đã copy" : "Copy"}
                  variant="gray"
                />
                <ActionButton
                  onClick={handleSave}
                  icon={
                    isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSaved ? (
                      <BookmarkCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )
                  }
                  label={isSaved ? "Đã lưu" : "Lưu"}
                  variant={isSaved ? "amber" : "gray"}
                  disabled={isSaving}
                />
                <ActionButton
                  onClick={handleOpenDictionary}
                  icon={<ExternalLink className="w-4 h-4" />}
                  label="Tra cứu"
                  variant="gray"
                />
              </div>
            </div>
          </>
        ) : (
          <EmptyState word={word} onClose={onClose} onSearch={handleOpenDictionary} />
        )}
      </motion.div>
    </>
  );
});

// Sub-components
function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="animate-pulse space-y-2">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onClose,
  word,
  onSearch,
}: {
  error: string;
  onClose: () => void;
  word: string;
  onSearch: () => void;
}) {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6 text-amber-500" />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{error}</p>
      <button
        onClick={onSearch}
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium cursor-pointer"
      >
        Tìm trong từ điển
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onClose}
        className="block mt-4 mx-auto text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        Đóng
      </button>
    </div>
  );
}

function EmptyState({
  word,
  onClose,
  onSearch,
}: {
  word: string;
  onClose: () => void;
  onSearch: () => void;
}) {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
        <BookOpen className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Không tìm thấy nghĩa cho từ này.
      </p>
      <button
        onClick={onSearch}
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium cursor-pointer"
      >
        Tìm trong từ điển
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onClose}
        className="block mt-4 mx-auto text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        Đóng
      </button>
    </div>
  );
}

function FormItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-12">
        {label}
      </span>
      <span
        className="text-sm font-medium text-slate-700 dark:text-slate-200"
        style={{ fontFamily: "var(--font-japanese, serif)" }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  variant,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: "blue" | "gray" | "amber";
  disabled?: boolean;
}) {
  const variants = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50",
    gray: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
    amber:
      "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
