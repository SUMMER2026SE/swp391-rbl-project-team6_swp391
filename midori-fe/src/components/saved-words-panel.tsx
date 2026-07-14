import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookmarkCheck, 
  Trash2, 
  Search, 
  Volume2, 
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Copy
} from "lucide-react";
import { useSavedWords, type SavedWord } from "./word-popup";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SavedWordsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedWordsPanel({ isOpen, onClose }: SavedWordsPanelProps) {
  const { savedWords, removeWord } = useSavedWords();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedWord, setExpandedWord] = useState<string | null>(null);

  const filteredWords = savedWords.filter(
    (word) =>
      word.word.includes(searchQuery) ||
      word.reading.includes(searchQuery) ||
      word.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSpeak = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "ja-JP";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const groupedWords = filteredWords.reduce((acc, word) => {
    const firstChar = word.word[0] || "?";
    if (!acc[firstChar]) {
      acc[firstChar] = [];
    }
    acc[firstChar].push(word);
    return acc;
  }, {} as Record<string, SavedWord[]>);

  const sortedGroups = Object.entries(groupedWords).sort(([a], [b]) => 
    a.localeCompare(b, "ja")
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-linear-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5 text-amber-500" />
              <h2 className="font-black text-slate-800 dark:text-white">
                Từ đã lưu
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                {savedWords.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm từ đã lưu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Word List */}
          <div className="flex-1 overflow-y-auto">
            {filteredWords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  {searchQuery
                    ? "Không tìm thấy từ nào phù hợp."
                    : "Chưa có từ nào được lưu."}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1">
                  {searchQuery
                    ? "Thử tìm kiếm với từ khóa khác."
                    : "Nhấn vào từ trong transcript để xem nghĩa và lưu lại."}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {sortedGroups.map(([group, words]) => (
                  <div key={group} className="mb-4">
                    {/* Group Header */}
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
                      <span 
                        className="text-lg font-black text-slate-400 dark:text-slate-500"
                        style={{ fontFamily: "var(--font-japanese, serif)" }}
                      >
                        {group}
                      </span>
                    </div>

                    {/* Words in Group */}
                    <div className="space-y-1 px-2 py-1">
                      {words.map((word, idx) => {
                        const uniqueKey = `${word.word}-${word.reading}-${idx}`;
                        const isExpanded = expandedWord === uniqueKey;

                        return (
                          <motion.div
                            key={uniqueKey}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="group"
                          >
                            <div
                              className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                                isExpanded
                                  ? "bg-primary/10 border border-primary/20"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                              onClick={() =>
                                setExpandedWord(isExpanded ? null : uniqueKey)
                              }
                            >
                              {/* Word */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="text-base font-bold text-slate-800 dark:text-white truncate"
                                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                                  >
                                    {word.word}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    [{word.reading}]
                                  </span>
                                </div>
                                {isExpanded && (
                                  <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed"
                                  >
                                    {word.meaning}
                                  </motion.p>
                                )}
                                {isExpanded && word.context && (
                                  <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1"
                                  >
                                    "{word.context}"
                                  </motion.p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSpeak(word.word);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition"
                                  title="Phát âm"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(word.word);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition"
                                  title="Copy"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeWord(word.word, word.reading);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 transition"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <Button
              onClick={() => {
                // Export as JSON
                const dataStr = JSON.stringify(filteredWords, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `midori-vocabulary-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              disabled={filteredWords.length === 0}
              className="w-full rounded-xl h-10 font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Xuất danh sách từ ({filteredWords.length})
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact saved words button for embedding
interface SavedWordsButtonProps {
  className?: string;
}

export function SavedWordsButton({ className }: SavedWordsButtonProps) {
  const { savedWords } = useSavedWords();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative inline-flex items-center gap-2 px-3 py-2 rounded-xl transition",
          "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
          "text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30",
          className
        )}
      >
        <BookmarkCheck className="w-4 h-4" />
        <span className="text-xs font-bold">Từ đã lưu</span>
        {savedWords.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
            {savedWords.length > 99 ? "99+" : savedWords.length}
          </span>
        )}
      </button>

      <SavedWordsPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
