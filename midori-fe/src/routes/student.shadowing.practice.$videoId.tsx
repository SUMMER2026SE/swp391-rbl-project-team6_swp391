import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Play,
  Mic,
  RotateCcw,
  ArrowRight,
  Home,
  Volume2,
  Check,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Target,
  Zap,
  Loader2,
  Upload,
  ScanText,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi, type StudentShadowingLesson, type AIFeedback, type DiffToken } from "@/lib/api/studentShadowing";
import { cn, getAbsoluteVideoUrl } from "@/lib/utils";
import { toast } from "sonner";

type PracticeState = "intro" | "practicing" | "recording" | "feedback" | "result";
type LoadingStep = "idle" | "uploading" | "transcribing" | "comparing" | "feedback";

interface SentenceResult {
  sentenceId: string;
  text: string;
  translation: string;
  score: number;
  feedback: AIFeedback;
}

interface SelectedTokenInfo {
  type: "vocab" | "grammar" | "expression" | "loading";
  word: string;
  rect: DOMRect;
  kanji?: string;
  hiragana?: string;
  meaning?: string;
  jlpt?: string;
  pos?: string;
  example?: string;
  relatedWords?: string[];
  collocations?: string[];
  reading?: string;
  pattern?: string;
  explanation?: string;
  examples?: string[];
  title?: string;
  desc?: string;
  expression?: string;
  contextExplanation?: string;
}

export const Route = createFileRoute("/student/shadowing/practice/$videoId")({
  component: ShadowingPracticePage,
});

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-500 dark:text-emerald-400";
  if (score >= 60) return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}

function scoreBg(score: number) {
  if (score >= 90) return "bg-emerald-500/5 border-emerald-500/10";
  if (score >= 60) return "bg-amber-500/5 border-amber-500/10";
  return "bg-rose-500/5 border-rose-500/10";
}

function scoreBarColor(score: number) {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

const loadingSteps = [
  { key: "uploading" as LoadingStep, label: "Uploading audio...", icon: Upload },
  { key: "transcribing" as LoadingStep, label: "Transcribing speech...", icon: ScanText },
  { key: "comparing" as LoadingStep, label: "Comparing with sample...", icon: Target },
  { key: "feedback" as LoadingStep, label: "Generating feedback...", icon: Sparkles },
];

const formatTimer = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const LoadingUI = ({ currentStep }: { currentStep: LoadingStep }) => {
  const currentIndex = loadingSteps.findIndex(s => s.key === currentStep);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl border border-[var(--border)] shadow-xl p-8 max-w-md mx-auto text-center w-full"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-6 relative flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-muted rounded-full" />
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-foreground">AI đang xử lý...</h3>
        <p className="text-xs text-muted-foreground mt-1">Vui lòng chờ trong giây lát</p>
      </div>
      
      <div className="space-y-3 text-left">
        {loadingSteps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;
          const Icon = step.icon;
          
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300",
                isComplete && "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                isActive && "bg-primary/5 border-primary/20 text-primary",
                !isComplete && !isActive && "bg-muted/30 border-[var(--border)] text-muted-foreground opacity-55"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isComplete && "bg-emerald-500 text-white",
                isActive && "bg-primary text-primary-foreground animate-pulse",
                !isComplete && !isActive && "bg-muted border border-[var(--border)] text-muted-foreground"
              )}>
                {isComplete ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-xs font-semibold tracking-wide">
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

const SampleSentenceCard = ({
  sentence,
  onPlayAudio,
  isPlaying,
  isRecording,
  isEvaluating,
  onWordClick,
  selectedWord,
}: {
  sentence: any;
  onPlayAudio: () => void;
  isPlaying: boolean;
  isRecording: boolean;
  isEvaluating: boolean;
  onWordClick: (word: string, rect: DOMRect) => void;
  selectedWord: string | null;
}) => {
  const tokens = sentence.japaneseText.split(/([、。！？「」『』（）〔〕【】〈〉《》〜…――\s]+)/);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden p-6 space-y-5"
    >
      <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-primary" />
          Sample Sentence
        </span>
      </div>

      <div className="space-y-4 text-center">
        <div className="bg-muted/40 rounded-2xl p-6 text-center border border-[var(--border)]">
          <p
            className="text-3xl sm:text-4xl font-black text-foreground leading-relaxed font-japanese"
            style={{ fontFamily: "var(--font-japanese, serif)" }}
          >
            {tokens.map((token: string, idx: number) => {
              if (!token) return null;
              if (/^[、。！？「」『』（）〔〕【】〈〉《》〜…――\s]+$/.test(token)) {
                return <span key={idx} className="text-muted-foreground/50">{token}</span>;
              }
              return (
                <span
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    onWordClick(token, rect);
                  }}
                  className={cn(
                    "cursor-pointer transition-all inline-block px-1 -mx-1 rounded hover:bg-primary/10 hover:text-primary",
                    selectedWord === token ? "bg-primary/20 text-primary ring-2 ring-primary/30" : "text-foreground"
                  )}
                >
                  {token}
                </span>
              );
            })}
          </p>
          
          {sentence.kana && (
            <p className="text-sm font-medium text-muted-foreground font-japanese mt-2 text-center">
              {sentence.kana}
            </p>
          )}
        </div>
        
        <p className="text-sm sm:text-base text-muted-foreground font-medium italic mt-2 leading-relaxed">
          {sentence.vietnameseTranslation}
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={onPlayAudio}
          disabled={isPlaying || isRecording || isEvaluating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer shadow-sm border border-primary/25"
        >
          {isPlaying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Playing...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Play Audio</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const RecordingCard = ({
  isRecording,
  isEvaluating,
  hasRecording,
  onRecord,
  onReplay,
  onSubmit,
  showFeedback,
  loadingStep,
  recordingSeconds,
}: {
  isRecording: boolean;
  isEvaluating: boolean;
  hasRecording: boolean;
  onRecord: () => void;
  onReplay: () => void;
  onSubmit: () => void;
  showFeedback: boolean;
  loadingStep: LoadingStep;
  recordingSeconds: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden p-8 flex flex-col items-center justify-center text-center w-full min-h-[300px]"
    >
      {isEvaluating ? (
        <LoadingUI currentStep={loadingStep} />
      ) : isRecording ? (
        <div className="text-center space-y-6 w-full flex flex-col items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Đang ghi âm...</h3>
            <p className="text-4xl font-black text-rose-500 font-mono tracking-wider tabular-nums animate-pulse mt-1">
              {formatTimer(recordingSeconds)}
            </p>
          </div>
          
          <div className="flex justify-center items-center gap-1.5 h-10 select-none">
            {[...Array(14)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [8, 32 + Math.random() * 24, 8] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.35 + i * 0.04,
                  ease: "easeInOut",
                }}
                className="w-1.5 bg-rose-500 rounded-full"
              />
            ))}
          </div>
          
          <button
            onClick={onRecord}
            className="w-16 h-16 rounded-full bg-rose-500 hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-lg border-4 border-rose-500/20 cursor-pointer mt-2"
            title="Stop Recording"
          >
            <div className="w-5 h-5 bg-white rounded-sm" />
          </button>
        </div>
      ) : hasRecording && !showFeedback ? (
        <div className="text-center space-y-6 w-full flex flex-col items-center py-4">
          <div className="w-18 h-18 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
            <Check className="w-9 h-9" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Ghi âm hoàn tất!</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Nghe lại phát âm của bạn hoặc bấm nút gửi đi để AI phân tích.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mt-2 w-full max-w-sm">
            <button
              onClick={onRecord}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-foreground font-semibold text-xs hover:bg-muted transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Record Again
            </button>
            <button
              onClick={onReplay}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-foreground font-semibold text-xs hover:bg-muted transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Replay
            </button>
            <button
              onClick={onSubmit}
              className="w-full px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-95 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-primary/10"
            >
              Gửi phân tích
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-6 w-full flex flex-col items-center py-4">
          <button 
            onClick={onRecord}
            disabled={showFeedback}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 border-4 relative",
              showFeedback 
                ? "bg-muted text-muted-foreground border-muted/50 cursor-not-allowed" 
                : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 border-primary/20 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/25 cursor-pointer"
            )}
          >
            <Mic className="w-9 h-9" />
          </button>
          
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Bắt đầu ghi âm</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Nhấn vào nút Micro hoặc bấm phím bắt đầu để thu âm giọng nói của bạn.
            </p>
          </div>
          
          <button
            onClick={onRecord}
            disabled={showFeedback}
            className={cn(
              "px-5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow-sm border",
              showFeedback 
                ? "bg-muted text-muted-foreground border-muted/50 cursor-not-allowed" 
                : "bg-primary text-primary-foreground hover:opacity-95 border-primary/10 cursor-pointer"
            )}
          >
            <Mic className="w-3.5 h-3.5" />
            Start Recording
          </button>
        </div>
      )}
    </motion.div>
  );
};

const AIFeedbackCard = ({
  result,
  onWordClick,
  selectedWord,
}: {
  result: SentenceResult;
  onWordClick: (word: string, rect: DOMRect) => void;
  selectedWord: string | null;
}) => {
  const diff = result.feedback.diff;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full"
    >
      {/* Overall Match Card */}
      <div className="glass-card rounded-3xl border border-[var(--border)] p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Overall Match</span>
          <div className={cn("text-5xl font-black mt-2 tracking-tight", scoreColor(result.score))}>
            {result.score}%
          </div>
        </div>
        
        <div className="flex-1 w-full space-y-2.5">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Mức độ khớp</span>
            <span>{result.score}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden border border-[var(--border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn("h-full rounded-full", scoreBarColor(result.score))}
            />
          </div>
          
          <div className="mt-2.5 flex items-center gap-2">
            {result.score >= 90 ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Matched (Khớp hoàn toàn)
              </span>
            ) : result.score >= 60 ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Partially Matched (Khớp một phần)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Not Matched (Không khớp)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Speech Recognition Comparison */}
      <div className="glass-card rounded-3xl border border-[var(--border)] p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-[var(--border)]">
          <ScanText className="w-4 h-4 text-primary" />
          Speech Recognition
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/40 rounded-2xl p-4 border border-[var(--border)]">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Expected Sentence</span>
            <p className="text-lg font-bold text-foreground font-japanese mt-1.5 leading-relaxed">
              {result.text}
            </p>
          </div>
          
          <div className={cn(
            "rounded-2xl p-4 border",
            result.feedback.spokenText ? "bg-muted/40 border-[var(--border)]" : "bg-muted/10 border-[var(--border)]"
          )}>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Your Speech</span>
            <p className={cn(
              "text-lg font-bold font-japanese mt-1.5 leading-relaxed",
              result.feedback.spokenText ? "text-foreground" : "text-muted-foreground italic"
            )}>
              {result.feedback.spokenText || "(Không nhận dạng được giọng nói)"}
            </p>
          </div>
        </div>
      </div>

      {/* Word Comparison */}
      <div className="glass-card rounded-3xl border border-[var(--border)] p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-[var(--border)]">
          <Target className="w-4 h-4 text-primary" />
          Word Comparison
        </h4>
        
        <div className="bg-muted/30 rounded-2xl p-6 text-center border border-[var(--border)]">
          {diff && diff.length > 0 ? (
            <div className="flex flex-wrap justify-center items-center gap-y-3 gap-x-2 font-japanese leading-relaxed">
              {diff.map((token, idx) => {
                const isPunctuation = /^[、。！？「」『』（）〔〕【】〈〉《》〜…――\s]+$/.test(token.text);
                let colorClass = "";
                
                if (isPunctuation) {
                  colorClass = "text-muted-foreground/45";
                } else {
                  switch (token.status) {
                    case "correct":
                      colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
                      break;
                    case "incorrect":
                      colorClass = "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
                      break;
                    case "missing":
                      colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 line-through decoration-amber-500 opacity-60";
                      break;
                    case "extra":
                      colorClass = "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
                      break;
                  }
                }
                
                return (
                  <span
                    key={idx}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-lg font-bold border transition-all",
                      colorClass,
                      token.status !== "missing" && token.status !== "extra" && !isPunctuation && "cursor-pointer hover:scale-105 active:scale-95"
                    )}
                    onClick={(e) => {
                      if (token.status !== "missing" && token.status !== "extra" && !isPunctuation) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        onWordClick(token.text, rect);
                      }
                    }}
                  >
                    {token.text}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground italic text-xs">Dữ liệu so sánh từ đang được cập nhật...</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center text-xs font-semibold text-muted-foreground mt-2 pt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/30" />
            Đúng
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/10 border border-rose-500/30" />
            Chưa đúng
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/10 border border-amber-500/30 line-through" />
            Thiếu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/30" />
            Thừa
          </span>
        </div>
      </div>



      {/* Practice Tips Card */}
      <div className="glass-card rounded-3xl border border-[var(--border)] p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground tracking-widest uppercase">Practice Tips</span>
        </div>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            Listen carefully before recording.
          </li>
          <li className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            Speak naturally.
          </li>
          <li className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            Try again if your match score is low.
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

const Sidebar = ({
  video,
  currentSentenceIndex,
  sentenceResults,
  onSelectSentence,
  isRecording,
  isEvaluating,
}: {
  video: StudentShadowingLesson;
  currentSentenceIndex: number;
  sentenceResults: SentenceResult[];
  onSelectSentence: (index: number) => void;
  isRecording: boolean;
  isEvaluating: boolean;
}) => {
  const completedCount = sentenceResults.length;
  const remainingCount = video.segments.length - completedCount;
  const progressPercent = Math.round((completedCount / video.segments.length) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Lesson Info Card */}
      <div className="glass-card rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-muted/20">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lesson Information</span>
          <h3 className="font-bold text-foreground mt-1.5 line-clamp-2 leading-snug">{video.title}</h3>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Sentence</span>
              <span className="text-foreground">Câu {currentSentenceIndex + 1} / {video.segments.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Completed</span>
              <span className="text-emerald-600 dark:text-emerald-400">{completedCount} sentences</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Remaining</span>
              <span className="text-amber-600 dark:text-amber-400">{remainingCount} sentences</span>
            </div>
          </div>
          
          <div className="pt-3.5 border-t border-[var(--border)]">
            <div className="flex justify-between items-center mb-2 text-xs font-bold">
              <span className="text-foreground">Progress</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-[var(--border)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sentence History / List Card */}
      <div className="glass-card rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-muted/20">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-display">History</span>
          <p className="text-xs text-muted-foreground mt-1">Chọn câu thoại để luyện tập</p>
        </div>
        
        <div className="p-3 max-h-[350px] overflow-y-auto space-y-2 scrollbar-thin">
          {video.segments.map((seg, i) => {
            const isCompleted = sentenceResults.some(r => r.sentenceId === seg.id);
            const isActive = i === currentSentenceIndex;
            const result = sentenceResults.find(r => r.sentenceId === seg.id);
            
            return (
              <button
                key={seg.id}
                disabled={isRecording || isEvaluating}
                onClick={() => onSelectSentence(i)}
                className={cn(
                  "w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group/item",
                  isActive 
                    ? "bg-primary/10 border-primary/20 shadow-xs" 
                    : isCompleted 
                      ? "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10" 
                      : "bg-muted/30 border-[var(--border)] hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={cn(
                    "text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : isCompleted 
                        ? "bg-emerald-500 text-white" 
                        : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {i + 1}
                  </span>
                  <span className={cn(
                    "text-xs font-semibold font-japanese truncate transition-colors",
                    isActive 
                      ? "text-primary" 
                      : isCompleted 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : "text-foreground"
                  )}>
                    {seg.japaneseText}
                  </span>
                </div>
                {isCompleted && result && (
                  <span className={cn(
                    "text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded border border-current bg-background/50",
                    scoreColor(result.score)
                  )}>
                    {result.score}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

const ResultScreen = ({
  video,
  sentenceResults,
  overallScore,
  onRetry,
}: {
  video: StudentShadowingLesson;
  sentenceResults: SentenceResult[];
  overallScore: number;
  onRetry: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-card rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-8 py-10 text-center border-b border-[var(--border)]">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-foreground font-display">Hoàn thành luyện tập!</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Bạn đã hoàn thành tất cả {video.segments.length} câu thoại của bài học.
          </p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="text-center">
            <span className="text-xs font-bold text-muted-foreground tracking-widest">Độ khớp trung bình</span>
            <div className={cn(
              "text-6xl font-black mt-2 tracking-tight",
              scoreColor(overallScore)
            )}>
              {overallScore}%
            </div>
            
            <div className="h-3 bg-muted border border-[var(--border)] rounded-full overflow-hidden w-48 mx-auto mt-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallScore}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("h-full rounded-full", scoreBarColor(overallScore))}
              />
            </div>
          </div>
          
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            <span className="text-xs font-bold text-foreground block">Chi tiết kết quả từng câu:</span>
            {sentenceResults.map((res, i) => (
              <div
                key={res.sentenceId}
                className={cn(
                  "p-4 rounded-2xl border flex items-center justify-between shadow-xs",
                  scoreBg(res.score)
                )}
              >
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground">CÂU {i + 1}</span>
                  <p className="text-sm font-bold text-foreground font-japanese mt-1">
                    {res.text}
                  </p>
                </div>
                <span className={cn("text-xl font-black", scoreColor(res.score))}>
                  {res.score}%
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-3 pt-3">
            <button
              onClick={onRetry}
              className="flex-1 py-3 rounded-xl border border-[var(--border)] text-foreground font-bold text-xs hover:bg-muted transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Luyện tập lại
            </button>
            <Link
              to="/student/shadowing"
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-95 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function ShadowingPracticePage() {
  const params = Route.useParams();
  const videoId = params.videoId;
  const navigate = useNavigate();

  const [video, setVideo] = useState<StudentShadowingLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [practiceState, setPracticeState] = useState<PracticeState>("practicing");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sentenceResults, setSentenceResults] = useState<SentenceResult[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastRecordedBlob, setLastRecordedBlob] = useState<Blob | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<SelectedTokenInfo | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<number | null>(null);

  const lastResult = useMemo(() => {
    if (sentenceResults.length === 0) return null;
    return sentenceResults[sentenceResults.length - 1];
  }, [sentenceResults]);

  const currentSentence = useMemo(() => {
    if (!video || video.segments.length === 0) return null;
    return video.segments[currentSentenceIndex];
  }, [video, currentSentenceIndex]);

  const isLastSentence = useMemo(() => {
    if (!video) return true;
    return currentSentenceIndex === video.segments.length - 1;
  }, [video, currentSentenceIndex]);

  const overallScore = useMemo(() => {
    if (sentenceResults.length === 0) return 0;
    const total = sentenceResults.reduce((acc, r) => acc + r.score, 0);
    return Math.round(total / sentenceResults.length);
  }, [sentenceResults]);

  useEffect(() => {
    studentShadowingApi.getShadowingDetail(videoId)
      .then((res) => {
        setVideo(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [videoId]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [audioUrl]);

  const handlePlayAudio = useCallback(() => {
    if (!videoRef.current || !currentSentence) return;
    
    videoRef.current.pause();
    videoRef.current.currentTime = currentSentence.startTime;
    videoRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(err => console.error(err));

    const onTimeUpdate = () => {
      if (videoRef.current && videoRef.current.currentTime >= currentSentence.endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.removeEventListener("timeupdate", onTimeUpdate);
      }
    };

    videoRef.current.addEventListener("timeupdate", onTimeUpdate);
  }, [currentSentence]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setLastRecordedBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
      };
      
      startTimeRef.current = Date.now();
      setRecordingSeconds(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      mediaRecorder.start();
      setIsRecording(true);
      setShowFeedback(false);
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          stopRecording();
        }
      }, 8000);
      
    } catch (err) {
      console.error("Microphone access failed", err);
      alert("Không thể truy cập Microphone. Vui lòng cấp quyền sử dụng Micro!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const handleRecord = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording]);

  const handleReplay = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const handleSubmit = async () => {
    if (!lastRecordedBlob || !currentSentence) return;
    
    setIsEvaluating(true);
    setLoadingStep("uploading");
    
    try {
      setLoadingStep("transcribing");
      await new Promise(r => setTimeout(r, 600));
      
      setLoadingStep("comparing");
      await new Promise(r => setTimeout(r, 600));
      
      setLoadingStep("feedback");
      await new Promise(r => setTimeout(r, 600));
      
      const feedback = await studentShadowingApi.evaluateSpeech(
        lastRecordedBlob,
        currentSentence.japaneseText,
        recordingSeconds || 2
      );
      
      const result: SentenceResult = {
        sentenceId: currentSentence.id,
        text: currentSentence.japaneseText,
        translation: currentSentence.vietnameseTranslation,
        score: feedback.overallScore,
        feedback,
      };
      
      setSentenceResults((prev) => {
        const idx = prev.findIndex(r => r.sentenceId === currentSentence.id);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = result;
          return next;
        }
        return [...prev, result];
      });
      
      setShowFeedback(true);
    } catch (err) {
      console.error("Evaluation failed", err);
      const fallbackFeedback: AIFeedback = {
        pronunciation: 0,
        pitchAccent: 0,
        fluency: 0,
        speed: 0,
        overallScore: 0,
        feedback: "Không thể phân tích giọng nói lúc này. Vui lòng thử lại!",
        strengths: [],
        improvements: ["Kiểm tra kết nối mạng", "Thử lại sau"],
        advice: "Hãy thử lại.",
        spokenText: "",
        incorrectWords: [],
      };
      
      const result: SentenceResult = {
        sentenceId: currentSentence.id,
        text: currentSentence.japaneseText,
        translation: currentSentence.vietnameseTranslation,
        score: 0,
        feedback: fallbackFeedback,
      };
      
      setSentenceResults((prev) => [...prev, result]);
      setShowFeedback(true);
    } finally {
      setIsEvaluating(false);
      setLoadingStep("idle");
    }
  };

  const handleNextSentence = useCallback(() => {
    setShowFeedback(false);
    if (isLastSentence) {
      setPracticeState("result");
    } else {
      setCurrentSentenceIndex((prev) => prev + 1);
      setPracticeState("practicing");
    }
  }, [isLastSentence]);

  const handleRetry = useCallback(() => {
    setPracticeState("practicing");
    setCurrentSentenceIndex(0);
    setSentenceResults([]);
    setShowFeedback(false);
  }, []);

  const handleWordClick = useCallback(async (word: string, rect: DOMRect) => {
    setSelectedWord(word);
    if (!currentSentence) return;
    
    setSelectedToken({
      type: "loading",
      word: word,
      rect,
    });

    try {
      const response = await studentShadowingApi.explainText(word, currentSentence.japaneseText);
      setSelectedToken({
        type: response.type || "vocab",
        word: word,
        rect,
        kanji: response.kanji || word,
        hiragana: response.hiragana || "",
        meaning: response.meaning || response.explanation || "",
        jlpt: response.jlpt || "N5",
        example: response.example || "",
        relatedWords: response.relatedWords || [],
      });
    } catch (err) {
      console.error("AI explanation failed", err);
      setSelectedToken({
        type: "vocab",
        word: word,
        rect,
        kanji: word,
        meaning: "(Từ vựng chưa có trong từ điển)",
      });
    }
  }, [currentSentence]);

  const handleSaveProgress = () => {
    toast.success("Tiến độ học tập của bạn đã được lưu thành công!");
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-slate-50">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-muted-foreground">Khởi tạo môi trường luyện tập...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-slate-50">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <h3 className="text-lg font-bold text-foreground mb-2">Không tìm thấy bài học</h3>
          <p className="text-xs text-muted-foreground mb-4">Bài học bạn yêu cầu không tồn tại.</p>
          <Link
            to="/student/shadowing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition text-xs shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <SakuraBg count={8} />
      
      {/* Hidden video element used for audio tracks */}
      <video ref={videoRef} src={getAbsoluteVideoUrl(video.videoUrl)} className="hidden" />

      {/* Header */}
      <header className="bg-card/75 border-b border-[var(--border)] backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/student/shadowing"
                className="w-10 h-10 rounded-xl bg-muted/40 border border-[var(--border)] flex items-center justify-center hover:bg-muted/80 transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </Link>
              <div>
                <h1 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                  Shadowing Practice
                  <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black bg-primary/10 text-primary border border-primary/20">
                    JLPT N5
                  </span>
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                  Practice speaking Japanese by repeating the sample sentence and receive AI-powered feedback.
                </p>
              </div>
            </div>
            
            {practiceState !== "result" && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-muted-foreground">
                  {currentSentenceIndex + 1}/{video.segments.length}
                </span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden border border-[var(--border)]">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${((currentSentenceIndex + 1) / video.segments.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {practiceState === "result" ? (
          <ResultScreen
            video={video}
            sentenceResults={sentenceResults}
            overallScore={overallScore}
            onRetry={handleRetry}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Main Content Column - 65% */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSentenceIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Sample Sentence Card */}
                  {currentSentence && (
                    <SampleSentenceCard
                      sentence={currentSentence}
                      onPlayAudio={handlePlayAudio}
                      isPlaying={isPlaying}
                      isRecording={isRecording}
                      isEvaluating={isEvaluating}
                      onWordClick={handleWordClick}
                      selectedWord={selectedWord}
                    />
                  )}

                  {/* Recording Card */}
                  <RecordingCard
                    isRecording={isRecording}
                    isEvaluating={isEvaluating}
                    hasRecording={!!lastRecordedBlob}
                    onRecord={handleRecord}
                    onReplay={handleReplay}
                    onSubmit={handleSubmit}
                    showFeedback={showFeedback}
                    loadingStep={loadingStep}
                    recordingSeconds={recordingSeconds}
                  />

                  {/* AI Feedback / Results */}
                  {showFeedback && lastResult && (
                    <AIFeedbackCard
                      result={lastResult}
                      onWordClick={handleWordClick}
                      selectedWord={selectedWord}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Action Buttons */}
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap justify-end gap-3 pt-2"
                >
                  <button
                    onClick={() => {
                      setShowFeedback(false);
                      setSentenceResults((prev) => prev.filter(r => r.sentenceId !== currentSentence?.id));
                    }}
                    className="px-5 py-2.5 border border-[var(--border)] text-foreground font-semibold text-xs rounded-xl hover:bg-muted transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Record Again
                  </button>
                  
                  <button
                    onClick={handleSaveProgress}
                    className="px-5 py-2.5 border border-primary/25 text-primary font-semibold text-xs rounded-xl hover:bg-primary/5 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    Save Progress
                  </button>
                  
                  <button
                    onClick={handleNextSentence}
                    className="px-5 py-2.5 bg-primary text-primary-foreground hover:opacity-95 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-primary/10"
                  >
                    {isLastSentence ? "See Results" : "Next Sentence"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Sidebar Column - 35% */}
            <div className="lg:col-span-1">
              <Sidebar
                video={video}
                currentSentenceIndex={currentSentenceIndex}
                sentenceResults={sentenceResults}
                onSelectSentence={(index) => {
                  setCurrentSentenceIndex(index);
                  setShowFeedback(false);
                }}
                isRecording={isRecording}
                isEvaluating={isEvaluating}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Vocab/Grammar Popover */}
      {selectedToken && selectedToken.rect && (
        <div 
          className="fixed inset-0 z-50 pointer-events-auto" 
          onClick={() => { setSelectedToken(null); setSelectedWord(null); }}
        >
          {(() => {
            const popoverWidth = 300;
            const rawLeft = selectedToken.rect.left + selectedToken.rect.width / 2;
            const popoverLeft = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, rawLeft - popoverWidth / 2));
            
            const showAbove = selectedToken.rect.bottom > window.innerHeight - 300;
            const popoverTop = showAbove ? selectedToken.rect.top - 8 : selectedToken.rect.bottom + 8;
            const arrowLeft = rawLeft - popoverLeft;

            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl select-text overflow-hidden"
                style={{
                  left: `${popoverLeft}px`,
                  top: `${popoverTop}px`,
                  width: `${popoverWidth}px`,
                  transform: showAbove ? "translateY(-100%)" : "none",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 bg-gradient-to-b from-pink-500/20 to-transparent">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white font-japanese">
                        {selectedToken.word}
                      </h3>
                      {selectedToken.hiragana && (
                        <p className="text-xs text-white/50 mt-1">{selectedToken.hiragana}</p>
                      )}
                    </div>
                    {selectedToken.jlpt && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        {selectedToken.jlpt}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
                
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Nghĩa</p>
                    <p className="text-sm text-white font-semibold leading-relaxed">
                      {selectedToken.meaning || "Đang tải..."}
                    </p>
                  </div>
                  
                  {selectedToken.example && (
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Ví dụ</p>
                      <p className="text-xs text-white/70 font-medium leading-relaxed bg-white/5 rounded-lg p-2.5 border border-white/5">
                        {selectedToken.example}
                      </p>
                    </div>
                  )}
                  
                  {selectedToken.relatedWords && selectedToken.relatedWords.length > 0 && (
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1.5">Từ liên quan</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedToken.relatedWords.slice(0, 5).map((word, idx) => (
                          <span key={idx} className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/10 text-white/80 border border-white/10">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedToken.type === "loading" && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                    </div>
                  )}
                </div>
                
                <div 
                  className={cn(
                    "absolute w-0 h-0 border-x-8 border-x-transparent",
                    showAbove ? "bottom-0 translate-y-full border-t-8 border-t-[#1a1a2e]" : "top-0 -translate-y-full border-b-8 border-b-[#1a1a2e]"
                  )}
                  style={{ left: `${arrowLeft}px`, transform: "translateX(-50%)" }}
                />
              </motion.div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
