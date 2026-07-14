import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { WordPopup } from "./word-popup";
import { cn } from "@/lib/utils";

interface WordSegment {
  text: string;
  isJapanese: boolean;
  startIndex: number;
  endIndex: number;
}

interface ClickableTranscriptProps {
  text: string;
  className?: string;
  contextSentence?: string;
  onWordClick?: (word: string, position: { x: number; y: number }) => void;
}

// Split Japanese text into word segments for click detection
function tokenizeJapanese(text: string): WordSegment[] {
  const segments: WordSegment[] = [];
  let currentIndex = 0;
  
  // Common Japanese word patterns (simplified tokenization)
  const patterns = [
    // Hiragana words (2+ characters)
    /[あ-んが-ぽぁ-ん]+/g,
    // Katakana words
    /[ア-ンガ-ポァ-ン]+/g,
    // Kanji (one or more)
    /[一-龯]+/g,
    // Mixed kanji + hiragana
    /[一-龯]+[あ-んが-ぽぁ-ん]*/g,
    // Single hiragana/katakana
    /[あ-んが-ぽぁ-ン]/g,
    // Numbers with counter
    /[0-9０-９]+[一人個本枚杯匹頭冊枚台]/g,
  ];

  // Simple approach: identify Japanese vs non-Japanese characters
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const charCode = char.charCodeAt(0);
    
    // Check if it's a Japanese character (Hiragana, Katakana, Kanji, Japanese punctuation)
    const isJapaneseChar = (
      (charCode >= 0x3040 && charCode <= 0x309F) || // Hiragana
      (charCode >= 0x30A0 && charCode <= 0x30FF) || // Katakana
      (charCode >= 0x4E00 && charCode <= 0x9FFF) || // CJK Unified Ideographs (Kanji)
      (charCode >= 0x3400 && charCode <= 0x4DBF) || // CJK Extension A
      '、，。！？「」『』（）〔〕【】〜…‥'.includes(char)
    );

    if (isJapaneseChar) {
      // Find the end of this Japanese word/segment
      let end = i + 1;
      while (end < text.length) {
        const nextChar = text[end];
        const nextCharCode = nextChar.charCodeAt(0);
        const nextIsJapanese = (
          (nextCharCode >= 0x3040 && nextCharCode <= 0x309F) ||
          (nextCharCode >= 0x30A0 && nextCharCode <= 0x30FF) ||
          (nextCharCode >= 0x4E00 && nextCharCode <= 0x9FFF) ||
          (nextCharCode >= 0x3400 && nextCharCode <= 0x4DBF) ||
          '、，。！？「」『』（）〔〕【】〜…‥'.includes(nextChar)
        );
        
        if (!nextIsJapanese) break;
        end++;
      }
      
      segments.push({
        text: text.slice(i, end),
        isJapanese: true,
        startIndex: i,
        endIndex: end,
      });
      i = end;
    } else {
      // Non-Japanese (spaces, English, etc.)
      let end = i + 1;
      while (end < text.length) {
        const nextChar = text[end];
        const nextCharCode = nextChar.charCodeAt(0);
        const nextIsJapanese = (
          (nextCharCode >= 0x3040 && nextCharCode <= 0x309F) ||
          (nextCharCode >= 0x30A0 && nextCharCode <= 0x30FF) ||
          (nextCharCode >= 0x4E00 && nextCharCode <= 0x9FFF) ||
          (nextCharCode >= 0x3400 && nextCharCode <= 0x4DBF) ||
          '、，。！？「」『』（）〔〕【】〜…‥'.includes(nextChar)
        );
        
        if (nextIsJapanese) break;
        end++;
      }
      
      segments.push({
        text: text.slice(i, end),
        isJapanese: false,
        startIndex: i,
        endIndex: end,
      });
      i = end;
    }
  }

  return segments;
}

export function ClickableTranscript({
  text,
  className,
  contextSentence,
  onWordClick
}: ClickableTranscriptProps) {
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    position: { x: number; y: number };
  } | null>(null);

  const segments = tokenizeJapanese(text);

  const handleWordClick = useCallback((
    word: string,
    event: React.MouseEvent<HTMLSpanElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedWord({
      word,
      position: { x: rect.left, y: rect.bottom + 8 },
    });
    onWordClick?.(word, { x: rect.left, y: rect.bottom + 8 });
  }, [onWordClick]);

  const handleClosePopup = useCallback(() => {
    setSelectedWord(null);
  }, []);

  return (
    <>
      <div className={cn("whitespace-pre-wrap", className)}>
        {segments.map((segment, index) => {
          if (segment.isJapanese) {
            if (/^[、，。！？「」『』（）〔〕【】〜…‥\s]+$/.test(segment.text)) {
              return (
                <span key={index} className="inline">
                  {segment.text}
                </span>
              );
            }

            return (
              <span
                key={index}
                onClick={(e) => handleWordClick(segment.text.trim(), e)}
                className="inline cursor-pointer hover:bg-primary/20 hover:text-primary rounded px-0.5 transition-colors duration-150 underline decoration-primary/30 underline-offset-2"
                style={{ fontFamily: "var(--font-japanese, serif)" }}
                title="Bấm để xem nghĩa"
              >
                {segment.text}
              </span>
            );
          }

          return (
            <span key={index} className="inline">
              {segment.text}
            </span>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedWord && (
          <WordPopup
            word={selectedWord.word}
            position={selectedWord.position}
            onClose={handleClosePopup}
            contextSentence={contextSentence}
          />
        )}
      </AnimatePresence>
    </>
  );
}
