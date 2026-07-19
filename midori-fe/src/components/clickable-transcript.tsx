import { useState, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { WordPopup } from "@/components/word-popup";
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
  interactive?: boolean;
  tokens?: any[];
}

interface SelectionState {
  type: "word" | "sentence";
  text: string;
  rect: DOMRect;
  position: { x: number; y: number };
  contextSentence?: string;
}

// Split Japanese text into word segments for click detection
function tokenizeJapanese(text: string): WordSegment[] {
  const segments: WordSegment[] = [];
  let i = 0;

  const punctuation = "、，。！？「」『』（）〔〕【】〜…‥";

  while (i < text.length) {
    const char = text[i];
    const charCode = char.charCodeAt(0);

    // If it's punctuation, make it a separate segment
    if (punctuation.includes(char)) {
      segments.push({
        text: char,
        isJapanese: true, // Treated as Japanese for general script category, but punctuation check handles non-clickability
        startIndex: i,
        endIndex: i + 1,
      });
      i++;
      continue;
    }

    const isJapaneseChar =
      (charCode >= 0x3040 && charCode <= 0x309f) || // Hiragana
      (charCode >= 0x30a0 && charCode <= 0x30ff) || // Katakana
      (charCode >= 0x4e00 && charCode <= 0x9fff) || // CJK Unified Ideographs (Kanji)
      (charCode >= 0x3400 && charCode <= 0x4dbf); // CJK Extension A

    if (isJapaneseChar) {
      // Find the end of this Japanese word/segment (stopping at punctuation or non-Japanese)
      let end = i + 1;
      while (end < text.length) {
        const nextChar = text[end];
        if (punctuation.includes(nextChar)) break;

        const nextCharCode = nextChar.charCodeAt(0);
        const nextIsJapanese =
          (nextCharCode >= 0x3040 && nextCharCode <= 0x309f) ||
          (nextCharCode >= 0x30a0 && nextCharCode <= 0x30ff) ||
          (nextCharCode >= 0x4e00 && nextCharCode <= 0x9fff) ||
          (nextCharCode >= 0x3400 && nextCharCode <= 0x4dbf);

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
        if (punctuation.includes(nextChar)) break;

        const nextCharCode = nextChar.charCodeAt(0);
        const nextIsJapanese =
          (nextCharCode >= 0x3040 && nextCharCode <= 0x309f) ||
          (nextCharCode >= 0x30a0 && nextCharCode <= 0x30ff) ||
          (nextCharCode >= 0x4e00 && nextCharCode <= 0x9fff) ||
          (nextCharCode >= 0x3400 && nextCharCode <= 0x4dbf);

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

// Get Japanese sentence boundaries (periods, question marks, etc.)
function getSentenceBoundaries(text: string): { start: number; end: number }[] {
  const sentences: { start: number; end: number }[] = [];
  const delimiters = /[。！？\!\?]+/g;

  let lastIndex = 0;
  let match;

  while ((match = delimiters.exec(text)) !== null) {
    if (match.index > lastIndex) {
      sentences.push({
        start: lastIndex,
        end: match.index + match[0].length,
      });
    }
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    sentences.push({
      start: lastIndex,
      end: text.length,
    });
  }

  return sentences;
}

export const ClickableTranscript = memo(function ClickableTranscript({
  text,
  className,
  contextSentence,
  onWordClick,
  interactive = true,
  tokens,
}: ClickableTranscriptProps) {
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const hasTokens = Array.isArray(tokens) && tokens.length > 0;

  const segments = useMemo(() => {
    if (hasTokens) {
      return tokens.map((t: any, idx: number) => {
        const text = t.surface || "";
        const charCode = text.charCodeAt(0);
        const isJapaneseChar =
          (charCode >= 0x3040 && charCode <= 0x309f) || // Hiragana
          (charCode >= 0x30a0 && charCode <= 0x30ff) || // Katakana
          (charCode >= 0x4e00 && charCode <= 0x9fff) || // Kanji
          (charCode >= 0x3400 && charCode <= 0x4dbf);

        // Use the position from the token if available, otherwise calculate from idx
        const startPos = typeof t.position === 'number' ? t.position : idx;
        const endPos = startPos + text.length;

        return {
          text: text,
          isJapanese: isJapaneseChar,
          startIndex: startPos,
          endIndex: endPos,
        };
      });
    }
    return tokenizeJapanese(text);
  }, [text, tokens, hasTokens]);

  const sentences = useMemo(() => getSentenceBoundaries(text), [text]);

  // Handle click on a Japanese word
  const handleWordClick = useCallback(
    (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
      if (!interactive) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const newSelection: SelectionState = {
        type: "word",
        text: word.trim(),
        rect: rect,
        position: { x: rect.left, y: rect.bottom },
        contextSentence: contextSentence,
      };
      setSelection(newSelection);
      onWordClick?.(word, { x: rect.left, y: rect.bottom });
    },
    [interactive, contextSentence, onWordClick]
  );

  // Handle click on a sentence
  const handleSentenceClick = useCallback(
    (sentenceText: string, event: React.MouseEvent<HTMLSpanElement>) => {
      if (!interactive) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const newSelection: SelectionState = {
        type: "sentence",
        text: sentenceText.trim(),
        rect: rect,
        position: { x: rect.left, y: rect.bottom + 8 },
        contextSentence: sentenceText.trim(),
      };
      setSelection(newSelection);
    },
    [interactive]
  );

  // Handle closing the popup
  const handleClosePopup = useCallback(() => {
    setSelection(null);
  }, []);

  // Handle clicking a word within the popup (for vocabulary lookup)
  const handleWordClickFromPopup = useCallback(
    (rect: DOMRect) => {
      // Close current popup
      setSelection({
        type: "word",
        text: selection?.text || "",
        rect: rect,
        position: { x: rect.left, y: rect.bottom },
        contextSentence: selection?.contextSentence,
      });
    },
    [selection]
  );

  // Check if a segment is clickable (Japanese word, not just punctuation)
  const isClickableSegment = (segment: WordSegment): boolean => {
    if (!segment.isJapanese) return false;
    // Don't make punctuation alone clickable
    return !/^[、，。！？「」『』（）〔〕【】〜…‥\s]+$/.test(segment.text);
  };

  // Find which sentence a segment belongs to
  const getSentenceForSegment = (segment: WordSegment): string => {
    for (const sentence of sentences) {
      if (segment.startIndex >= sentence.start && segment.endIndex <= sentence.end) {
        return text.slice(sentence.start, sentence.end).trim();
      }
    }
    return text.trim();
  };

  return (
    <>
      <div className={cn("whitespace-pre-wrap", className)}>
        {segments.map((segment, index) => {
          // Non-Japanese segments - render as plain text
          if (!segment.isJapanese) {
            return (
              <span key={index} className="inline">
                {segment.text}
              </span>
            );
          }

          // Japanese punctuation - render as plain text
          if (/^[、，。！？「」『』（）〔〕【】〜…‥\s]+$/.test(segment.text)) {
            return (
              <span key={index} className="inline">
                {segment.text}
              </span>
            );
          }

          // Clickable Japanese word
          return (
            <span
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                // Handle both click types
                if (e.detail === 2) {
                  // Double click - show sentence
                  const sentenceText = getSentenceForSegment(segment);
                  handleSentenceClick(sentenceText, e);
                } else {
                  // Single click - show word
                  handleWordClick(segment.text, e);
                }
              }}
              onContextMenu={(e) => {
                // Right click - show sentence analysis
                e.preventDefault();
                const sentenceText = getSentenceForSegment(segment);
                handleSentenceClick(sentenceText, e);
              }}
              onKeyDown={(e) => {
                // Enter key - show word, Shift+Enter - show sentence
                if (e.key === "Enter") {
                  if (e.shiftKey) {
                    const sentenceText = getSentenceForSegment(segment);
                    handleSentenceClick(sentenceText, e as unknown as React.MouseEvent<HTMLSpanElement>);
                  } else {
                    handleWordClick(segment.text, e as unknown as React.MouseEvent<HTMLSpanElement>);
                  }
                }
              }}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? "button" : undefined}
              aria-label={interactive ? `Tra từ: ${segment.text}` : undefined}
              className={cn(
                "inline cursor-pointer hover:bg-primary/20 hover:text-primary rounded px-0.5 -mx-0.5 transition-colors duration-150",
                interactive && "underline decoration-primary/30 underline-offset-2"
              )}
              style={{ fontFamily: "var(--font-japanese, serif)" }}
              title={interactive ? "Bấm để xem nghĩa (Click: từ, Right-click: câu)" : undefined}
            >
              {segment.text}
            </span>
          );
        })}
      </div>

      {/* Popup - rendered via portal to avoid clipping by ancestor transforms */}
      {createPortal(
        <AnimatePresence>
          {selection && selection.type === "word" && (
            <WordPopup
              word={selection.text}
              position={selection.position}
              onClose={handleClosePopup}
              contextSentence={selection.contextSentence}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
});

// Export sentence-aware version
export interface InteractiveTranscriptProps extends ClickableTranscriptProps {
  onSentenceClick?: (sentence: string, position: { x: number; y: number }) => void;
}

export const InteractiveTranscript = memo(function InteractiveTranscript({
  text,
  className,
  contextSentence,
  onWordClick,
  onSentenceClick,
  interactive = true,
  tokens,
}: InteractiveTranscriptProps) {
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const hasTokens = Array.isArray(tokens) && tokens.length > 0;

  const segments = useMemo(() => {
    if (hasTokens) {
      return tokens.map((t: any, idx: number) => {
        const text = t.surface || "";
        const charCode = text.charCodeAt(0);
        const isJapaneseChar =
          (charCode >= 0x3040 && charCode <= 0x309f) || // Hiragana
          (charCode >= 0x30a0 && charCode <= 0x30ff) || // Katakana
          (charCode >= 0x4e00 && charCode <= 0x9fff) || // Kanji
          (charCode >= 0x3400 && charCode <= 0x4dbf);

        // Use the position from the token if available, otherwise calculate from idx
        const startPos = typeof t.position === 'number' ? t.position : idx;
        const endPos = startPos + text.length;

        return {
          text: text,
          isJapanese: isJapaneseChar,
          startIndex: startPos,
          endIndex: endPos,
        };
      });
    }
    return tokenizeJapanese(text);
  }, [text, tokens, hasTokens]);

  const sentences = useMemo(() => getSentenceBoundaries(text), [text]);

  const handleWordClick = useCallback(
    (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
      if (!interactive) return;

      const rect = event.currentTarget.getBoundingClientRect();
      setSelection({
        type: "word",
        text: word.trim(),
        rect: rect,
        position: { x: rect.left, y: rect.bottom },
        contextSentence: contextSentence,
      });
      onWordClick?.(word, { x: rect.left, y: rect.bottom });
    },
    [interactive, contextSentence, onWordClick]
  );

  const handleSentenceClick = useCallback(
    (sentenceText: string, event: React.MouseEvent<HTMLSpanElement>) => {
      if (!interactive) return;

      const rect = event.currentTarget.getBoundingClientRect();
      setSelection({
        type: "sentence",
        text: sentenceText.trim(),
        rect: rect,
        position: { x: rect.left, y: rect.bottom + 8 },
        contextSentence: sentenceText.trim(),
      });
      onSentenceClick?.(sentenceText, { x: rect.left, y: rect.bottom + 8 });
    },
    [interactive, onSentenceClick]
  );

  const handleClosePopup = useCallback(() => {
    setSelection(null);
  }, []);

  const handleWordClickFromPopup = useCallback(
    (rect: DOMRect) => {
      if (selection) {
        setSelection({
          type: "word",
          text: selection.text,
          rect: rect,
          position: { x: rect.left, y: rect.bottom },
          contextSentence: selection.contextSentence,
        });
      }
    },
    [selection]
  );

  const getSentenceForSegment = (segment: WordSegment): string => {
    for (const sentence of sentences) {
      if (segment.startIndex >= sentence.start && segment.endIndex <= sentence.end) {
        return text.slice(sentence.start, sentence.end).trim();
      }
    }
    return text.trim();
  };

  return (
    <>
      <div className={cn("whitespace-pre-wrap", className)}>
        {segments.map((segment, index) => {
          if (!segment.isJapanese) {
            return (
              <span key={index} className="inline">
                {segment.text}
              </span>
            );
          }

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
              onClick={(e) => {
                e.stopPropagation();
                if (e.detail === 2) {
                  const sentenceText = getSentenceForSegment(segment);
                  handleSentenceClick(sentenceText, e);
                } else {
                  handleWordClick(segment.text, e);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                const sentenceText = getSentenceForSegment(segment);
                handleSentenceClick(sentenceText, e);
              }}
              tabIndex={interactive ? 0 : -1}
              aria-label={interactive ? `Tra từ: ${segment.text}` : undefined}
              className={cn(
                "inline cursor-pointer hover:bg-primary/20 hover:text-primary rounded px-0.5 -mx-0.5 transition-colors duration-150",
                interactive && "underline decoration-primary/30 underline-offset-2"
              )}
              style={{ fontFamily: "var(--font-japanese, serif)" }}
              title={interactive ? "Bấm để xem nghĩa (Click: từ, Right-click: câu)" : undefined}
            >
              {segment.text}
            </span>
          );
        })}
      </div>

      {createPortal(
        <AnimatePresence>
          {selection && selection.type === "word" && (
            <WordPopup
              word={selection.text}
              position={selection.position}
              onClose={handleClosePopup}
              contextSentence={selection.contextSentence}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
});
