import { useState, useEffect, useCallback, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bookmark,
  BookmarkCheck,
  Loader2,
  BookOpen,
  Languages,
  Lightbulb,
  CheckSquare,
  Square,
  ExternalLink,
  Play,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dictionaryApi, type DictionaryLookupResponse, type StudentSentenceResponse, type GrammarItem } from "@/lib/api/dictionary";

interface WordDetailPopupProps {
  position: { x: number; y: number };
  onClose: () => void;
  word: string;
  reading?: string;
  sentence?: string;
  lessonId?: string;
  surface?: string;
  onWordClick?: (rect: DOMRect) => void;
  onRemember?: (word: string, meaning: string) => void;
  onSaveGrammar?: (grammar: GrammarItem) => void;
}

type TabType = "explain" | "examples" | "grammar";

export const WordDetailPopup = memo(function WordDetailPopup({
  position,
  onClose,
  word,
  reading,
  sentence,
  lessonId,
  surface,
  onWordClick,
  onRemember,
  onSaveGrammar,
}: WordDetailPopupProps) {
  const [data, setData] = useState<DictionaryLookupResponse | null>(null);
  const [grammarData, setGrammarData] = useState<StudentSentenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isRemembered, setIsRemembered] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("explain");
  const popupRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        // Also fetch grammar from sentence analysis if sentence is provided
        if (sentence) {
          try {
            const grammarResult = await dictionaryApi.analyzeSentence(sentence);
            setGrammarData(grammarResult);
          } catch (err) {
            console.error("[WordDetailPopup] Grammar fetch error:", err);
          }
        }
      } catch (err) {
        console.error("[WordDetailPopup] Fetch error:", err);
        setError("Không tìm thấy nghĩa cho từ này.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [word, reading, sentence, lessonId, surface]);

  // Get grammar items related to current word
  const getRelatedGrammar = (): GrammarItem[] => {
    if (!grammarData?.grammar || grammarData.grammar.length === 0) return [];
    // Filter grammar items that contain the current word or are part of the sentence
    return grammarData.grammar.filter(g => 
      sentence?.includes(g.pattern) || 
      (g.pattern && sentence?.includes(g.pattern.replace(/[～〜]/g, '')))
    );
  };

  // Handle save grammar
  const handleSaveGrammar = useCallback((grammar: GrammarItem) => {
    onSaveGrammar?.(grammar);
  }, [onSaveGrammar]);

  // Adjust position if popup goes off-screen
  useEffect(() => {
    if (!popupRef.current) return;

    const adjustPosition = () => {
      const popup = popupRef.current;
      if (!popup) return;

      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const baseX = Number.isFinite(position?.x) ? position.x : 0;
      const baseY = Number.isFinite(position?.y) ? position.y : 0;

      // Adjust if popup goes off right edge
      if (rect.right > viewportWidth - 8) {
        popup.style.left = `${Math.max(8, viewportWidth - rect.width - 8)}px`;
      }

      // Adjust if popup goes off bottom edge
      if (rect.bottom > viewportHeight - 8) {
        popup.style.top = `${Math.max(8, baseY - rect.height - 8)}px`;
      }

      // Adjust if popup goes off left edge
      if (rect.left < 8) {
        popup.style.left = `8px`;
      }

      // Adjust if popup goes off top edge
      if (rect.top < 8) {
        popup.style.top = `${Math.min(viewportHeight - rect.height - 8, baseY + 16)}px`;
      }
    };

    // Delay to ensure DOM is rendered
    const timeoutId = setTimeout(adjustPosition, 50);
    return () => clearTimeout(timeoutId);
  }, [position, loading]);

  // Handle remember toggle
  const handleRemember = useCallback(() => {
    setIsRemembered(!isRemembered);
    if (!isRemembered && data && onRemember) {
      onRemember(data.surface, data.primaryMeaning || data.meanings?.[0] || "");
    }
  }, [isRemembered, data, onRemember]);

  // Handle save word
  const handleSave = useCallback(async () => {
    if (!data) return;
    try {
      const result = await dictionaryApi.saveWord({
        word: data.surface,
        reading: data.reading,
        meaning: data.primaryMeaning || data.meanings?.[0],
        context: sentence,
        lessonId,
        dictionaryForm: data.dictionaryForm,
        wordType: data.wordType,
        jlpt: data.jlpt,
      });
      setIsSaved(result.saved);
    } catch (err) {
      console.error("[WordDetailPopup] Save error:", err);
    }
  }, [data, sentence, lessonId]);

  // Handle see more
  const handleSeeMore = useCallback(() => {
    if (data && popupRef.current) {
      onWordClick?.(popupRef.current.getBoundingClientRect());
    }
  }, [data, onWordClick]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 cursor-default" onClick={onClose} aria-hidden="true" />

      {/* Popup */}
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.15 }}
        style={{
          position: "fixed",
          left: Math.min(
            Math.max((Number.isFinite(position?.x) ? position.x : 0) - 190, 8),
            Math.max(8, window.innerWidth - 396)
          ),
          top: Math.min(
            (Number.isFinite(position?.y) ? position.y : 0) + 16,
            Math.max(8, window.innerHeight - 500)
          ),
          zIndex: 50,
        }}
        className={cn(
          "w-[380px] max-h-[480px] overflow-hidden bg-white dark:bg-slate-900 cursor-auto",
          "rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700"
        )}
        role="dialog"
        aria-label="Word detail popup"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState error={error} onClose={onClose} word={word} />
        ) : data ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800">
              {/* Word header */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Furigana above kanji */}
                    {data.reading && data.reading !== data.surface && (
                      <span
                        className="text-xs text-slate-400 dark:text-slate-500 block"
                        style={{ fontFamily: "var(--font-japanese, serif)" }}
                      >
                        {data.reading}
                      </span>
                    )}
                    {/* Kanji */}
                    <h2
                      className="text-2xl font-black text-slate-800 dark:text-white"
                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                    >
                      {data.surface}
                    </h2>
                    {/* Romaji */}
                    {data.romaji && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {data.romaji}
                      </span>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
                  >
                    <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {data.jlpt && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      JLPT {data.jlpt}
                    </span>
                  )}
                  {data.wordType && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                      {data.wordType}
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-t border-slate-100 dark:border-slate-800">
                <TabButton
                  active={activeTab === "explain"}
                  onClick={() => setActiveTab("explain")}
                  icon={<Lightbulb className="w-3.5 h-3.5" />}
                >
                  Giải thích
                </TabButton>
                <TabButton
                  active={activeTab === "examples"}
                  onClick={() => setActiveTab("examples")}
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                >
                  Ví dụ
                </TabButton>
                <TabButton
                  active={activeTab === "grammar"}
                  onClick={() => setActiveTab("grammar")}
                  icon={<Languages className="w-3.5 h-3.5" />}
                >
                  Ngữ pháp
                </TabButton>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[280px] p-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
              {/* Tab: Giải thích */}
              {activeTab === "explain" && (
                <div className="space-y-3">
                  {/* Context meaning prominently displayed */}
                  {data.contextMeaning ? (
                    <div className="rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-3">
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
                  ) : null}

                  {/* All meanings */}
                  {data.meanings && data.meanings.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Nghĩa
                      </p>
                      {data.meanings.map((meaning, idx) => (
                        <div key={idx} className="flex items-start gap-2 py-1">
                          <span className="text-primary font-bold text-xs min-w-[16px]">{idx + 1}.</span>
                          <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                            {meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Ví dụ */}
              {activeTab === "examples" && (
                <div className="space-y-3">
                  {data.examples && data.examples.length > 0 ? (
                    data.examples.map((example, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3"
                      >
                        {/* Japanese with furigana */}
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
                        {example.vietnamese && (
                          <p className="text-xs text-primary mt-2 leading-relaxed">
                            {example.vietnamese}
                          </p>
                        )}
                        {example.english && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                            {example.english}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Không có ví dụ cho từ này</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Ngữ pháp */}
              {activeTab === "grammar" && (
                <div className="space-y-3">
                  {/* Sentence translation */}
                  {grammarData?.translationVi && (
                    <div className="rounded-xl bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 p-3">
                      <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Languages className="w-3 h-3" />
                        Bản dịch câu
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {grammarData.translationVi}
                      </p>
                    </div>
                  )}

                  {/* Grammar patterns from sentence */}
                  {grammarData?.grammar && grammarData.grammar.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Mẫu ngữ pháp trong câu
                      </p>
                      {grammarData.grammar.map((g, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {/* Pattern */}
                              <div className="flex items-center gap-2 mb-1.5">
                                <span
                                  className="text-sm font-bold text-primary"
                                  style={{ fontFamily: "var(--font-japanese, serif)" }}
                                >
                                  {g.pattern}
                                </span>
                                {g.reading && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    [{g.reading}]
                                  </span>
                                )}
                              </div>
                              {/* Meaning */}
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
                                {g.meaning}
                              </p>
                              {/* Explanation */}
                              {g.explanation && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                  {g.explanation}
                                </p>
                              )}
                            </div>
                            {/* Save grammar button */}
                            <button
                              onClick={() => handleSaveGrammar(g)}
                              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition shrink-0"
                              title="Lưu ngữ pháp"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : data?.forms ? (
                    /* Fallback to word forms if no sentence grammar */
                    <div className="grid grid-cols-2 gap-2">
                      <FormItem label="ます" value={data.forms.masu} />
                      <FormItem label="て" value={data.forms.te} />
                      <FormItem label="た" value={data.forms.ta} />
                      <FormItem label="ない" value={data.forms.nai} />
                      <FormItem label="可能" value={data.forms.potential} />
                      <FormItem label="受身" value={data.forms.passive} />
                      <FormItem label="使役" value={data.forms.causative} />
                      <FormItem label="意向" value={data.forms.volitional} />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Languages className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Không có ngữ pháp cho câu này</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-3">
              <div className="grid grid-cols-4 gap-2">
                {/* Remember button */}
                <ActionButton
                  onClick={handleRemember}
                  icon={isRemembered ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  label="Ghi nhớ"
                  variant={isRemembered ? "green" : "gray"}
                />
                {/* Save button */}
                <ActionButton
                  onClick={handleSave}
                  icon={isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  label={isSaved ? "Đã lưu" : "Lưu"}
                  variant={isSaved ? "amber" : "gray"}
                />
                {/* No-entry button */}
                <ActionButton
                  onClick={onClose}
                  icon={<X className="w-4 h-4" />}
                  label="No-entry"
                  variant="gray"
                />
                {/* See more button */}
                <ActionButton
                  onClick={handleSeeMore}
                  icon={<ChevronRight className="w-4 h-4" />}
                  label="thế >>"
                  variant="primary"
                />
              </div>
            </div>
          </>
        ) : (
          <EmptyState word={word} onClose={onClose} />
        )}
      </motion.div>
    </>,
    document.body
  );
});

// Sub-components
function TabButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold border-b-2 transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function FormItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-10">
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
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: "gray" | "primary" | "green" | "amber";
}) {
  const variants = {
    gray: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
    primary: "bg-primary text-white hover:bg-primary/90",
    green: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
    amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors text-[10px] font-bold",
        variants[variant]
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="animate-pulse space-y-2">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
      </div>
    </div>
  );
}

function ErrorState({ error, onClose, word }: { error: string; onClose: () => void; word: string }) {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
        <X className="w-6 h-6 text-amber-500" />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{error}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">Từ: {word}</p>
      <button
        onClick={onClose}
        className="mt-4 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        Đóng
      </button>
    </div>
  );
}

function EmptyState({ word, onClose }: { word: string; onClose: () => void }) {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
        <BookOpen className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
        Không tìm thấy nghĩa cho từ này.
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">Từ: {word}</p>
      <button
        onClick={onClose}
        className="mt-4 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        Đóng
      </button>
    </div>
  );
}
