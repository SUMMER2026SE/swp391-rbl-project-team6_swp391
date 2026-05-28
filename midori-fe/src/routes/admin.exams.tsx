import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CheckCircle, XCircle, Eye,
  AlertTriangle, X, ChevronLeft, BookOpen,
  Timer, Calendar, User, Tag, List, Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Question = {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type Exam = {
  id: number;
  title: string;
  teacherName: string;
  level: string;
  type: string;
  questions: Question[];
  duration: number;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
};

const EXAM_STATUS_CONFIG = {
  pending:  { label: "Pending",   bg: "bg-[var(--status-pending)]/12",   text: "text-[var(--status-pending)]",   border: "border-[var(--status-pending)]/25" },
  approved: { label: "Approved",  bg: "bg-[var(--status-active)]/12",   text: "text-[var(--status-active)]",   border: "border-[var(--status-active)]/25" },
  rejected: { label: "Rejected", bg: "bg-[var(--status-rejected)]/12", text: "text-[var(--status-rejected)]", border: "border-[var(--status-rejected)]/25" },
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialExams: Exam[] = [
  {
    id: 1,
    title: "JLPT N2 Grammar Mock Exam",
    teacherName: "Kenji Yamamoto",
    level: "N2",
    type: "Grammar",
    duration: 60,
    submittedDate: "2 days ago",
    status: "pending",
    questions: [
      {
        id: 1,
        text: "明日会議____、欠席する場合は事前に連絡してください。",
        options: ["のある", "がある場合", "がある場合に", "のあるとき"],
        correctIndex: 1,
        explanation: "「〜がある場合は、…」は仮定、条件を表す文法です。「ある」の後ろには「場合」が直接続きます。",
      },
      {
        id: 2,
        text: "彼は忙し____、電話に出てくれない。",
        options: ["そうで", "そうでも", "そうな", "そうなのに"],
        correctIndex: 2,
        explanation: "「〜そうで」は様態の意味で「〜の様子で」を表します。「忙しそうで」は「忙しそうな様子で」を意味します。",
      },
      {
        id: 3,
        text: "この問題は____、却很为难。",
        options: ["簡単なのに", "簡単なので", "簡単なはずだ", "簡単なわけだ"],
        correctIndex: 0,
        explanation: "「〜のに」は逆接の意味で、予期とは反対の結果を表します。「簡単なのに」（although it's simple）と予想に反します。",
      },
      {
        id: 4,
        text: "雨に____、試合は中止になります。",
        options: ["なれば", "なっても", "なったら", "なって"],
        correctIndex: 2,
        explanation: "「〜たら」は条件を表し、未来の確定条件に使います。「雨になったら」は「もし雨が降ったら」という条件です。",
      },
      {
        id: 5,
        text: "彼は日本語教師____、京都大学で博士号を取った。",
        options: ["として", "である上に", "だけでなく", "のみで"],
        correctIndex: 2,
        explanation: "「〜だけでなく…も」は「not only ... but also…」という構造です。「だけでなく」の後に「京都大学でも」が省略されています。",
      },
    ],
  },
  {
    id: 2,
    title: "N3 Listening Comprehension Test",
    teacherName: "Park Joon-ho",
    level: "N3",
    type: "Listening",
    duration: 40,
    submittedDate: "3 days ago",
    status: "pending",
    questions: [
      {
        id: 1,
        text: "女の人と男の人が話しています。男の人は今日何をしますか？",
        options: [
          "会議に出て、資料を配る",
          "資料を準備して、会议に出る",
          "先に帰って、明日資料を作る",
          "部下に資料を作らせる",
        ],
        correctIndex: 1,
        explanation: "男の人は「資料を準備してから会議に出る」と言っているので、正解は「資料を準備して、会议に出る」です。",
      },
      {
        id: 2,
        text: "天気予報を聞いています。明日はどうなりそうですか。",
        options: [
          "晴れだが、風が強い",
          "雨で、気温も低い",
          "曇りだが、午後に晴れる",
          "雪で、車を注意する必要がある",
        ],
        correctIndex: 1,
        explanation: "天気予報によると、明日は雨で気温も低いということです。選択肢の中で「雨で、気温も低い」が正解です。",
      },
      {
        id: 3,
        text: "電話で予約の確認をしています。予約は何時ですか。",
        options: ["午前10時", "午後2時", "午後4時", "午前11時"],
        correctIndex: 2,
        explanation: "電話で「4時の予約を確認しました」と言っているので、正解は「午後4時」です。",
      },
    ],
  },
  {
    id: 3,
    title: "N4 Vocabulary Quiz",
    teacherName: "Taro Yamamoto",
    level: "N4",
    type: "Vocabulary",
    duration: 30,
    submittedDate: "1 day ago",
    status: "pending",
    questions: [
      {
        id: 1,
        text: "「便利」の読み方正しいのはどれですか。",
        options: ["べんり", "じんり", "びんり", "べんりき"],
        correctIndex: 0,
        explanation: "「便利」の読み方は「べんり（benri）」です。「じんり」ではありません。",
      },
      {
        id: 2,
        text: "「ansky」の漢字正确的是：",
        options: ["暗記", "前期", "後期", "興味"],
        correctIndex: 3,
        explanation: "「興味」（きょうみ）は「interest / curiosity（火災の興味はありません）。選択肢の「暗記」は「あんき」です。",
      },
      {
        id: 3,
        text: "「そろそろ」的意味は：",
        options: ["まだ", "もうすぐ", "すでに", "もちろん"],
        correctIndex: 1,
        explanation: "「そろそろ」（sorosoro）は「もうすぐ（soon, before long）」という意味です。",
      },
    ],
  },
];

const approvedExams: Exam[] = [
  {
    id: 101,
    title: "JLPT N3 Grammar Final Exam",
    teacherName: "Sakura Hayashi",
    level: "N3",
    type: "Grammar",
    duration: 90,
    submittedDate: "Jan 2024",
    status: "approved",
    questions: [
      { id: 1, text: "これは____在日本使用的语法结构。", options: ["簡単な", "簡単なの", "簡単なもの", "簡単なようで"], correctIndex: 2 },
      { id: 2, text: "時間が____、帰りましょう。", options: ["使った", "使ったので", "使ったのに", "使うなら"], correctIndex: 1 },
    ],
  },
  {
    id: 102,
    title: "N5 Kanji Recognition Quiz",
    teacherName: "Taro Yamamoto",
    level: "N5",
    type: "Kanji",
    duration: 20,
    submittedDate: "Dec 2023",
    status: "approved",
    questions: [
      { id: 1, text: "「山」の読み方正确的是：", options: ["やま", "さめ", "たけ", "たかさ"], correctIndex: 0 },
    ],
  },
];

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  visible,
}: {
  message: string;
  type: "success" | "error";
  visible: boolean;
}) {
  const isSuccess = type === "success";
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border shadow-xl glass-modal ${
            isSuccess
              ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
              : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {isSuccess ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Approve Confirm Modal ───────────────────────────────────────────────────

function ApproveConfirmModal({
  exam,
  onConfirm,
  onClose,
}: {
  exam: Exam;
  onConfirm: (id: number) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onConfirm(exam.id);
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--status-active)]/12 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-7 h-7 text-[var(--status-active)]" />
          </div>
          <h3 className="font-display font-bold text-primary-col text-lg">Approve Exam</h3>
          <p className="text-secondary-col text-sm mt-2">
            Are you sure you want to approve this exam?
          </p>
          <div className="mt-3 p-3 rounded-xl glass-surface text-left">
            <p className="text-primary-col font-semibold text-sm">{exam.title}</p>
            <p className="text-muted-col text-xs mt-0.5">by {exam.teacherName} · {exam.level}</p>
          </div>
          <p className="text-muted-col text-xs mt-3">
            This exam will be published for students immediately.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {loading ? "Approving..." : "Confirm Approve"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reject Modal ────────────────────────────────────────────────────────────

const REJECT_REASONS = [
  "Incorrect content",
  "Wrong answer key",
  "Missing questions",
  "Wrong JLPT level",
  "Format not met",
  "Duplicate content",
  "Other",
];

function RejectModal({
  exam,
  onConfirm,
  onClose,
}: {
  exam: Exam;
  onConfirm: (id: number, reason: string) => void;
  onClose: () => void;
}) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleReason = (r: string) => {
    setSelectedReasons(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const isOtherSelected = selectedReasons.includes("Other");
  const isValid = selectedReasons.length > 0 && (!isOtherSelected || detail.trim().length > 0);

  const handleConfirm = async () => {
    if (!isValid) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const reason = [...selectedReasons, isOtherSelected && detail.trim() ? `Other: ${detail}` : ""]
      .filter(Boolean).join("; ");
    onConfirm(exam.id, reason);
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div>
            <h3 className="font-display font-bold text-primary-col text-lg">Reject Exam</h3>
            <p className="text-muted-col text-xs mt-0.5">{exam.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Exam Info */}
          <div className="p-3 rounded-xl glass-surface">
            <p className="text-primary-col font-semibold text-sm">{exam.title}</p>
            <p className="text-muted-col text-xs mt-0.5">by {exam.teacherName} · {exam.level} · {exam.questions.length} questions</p>
          </div>

          {/* Reason Checklist */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
              Select reason <span className="text-[var(--status-rejected)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REJECT_REASONS.map(reason => {
                const checked = selectedReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    onClick={() => toggleReason(reason)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-left ${
                      checked
                        ? "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
                        : "glass-surface text-secondary-col"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        checked ? "bg-[var(--status-rejected)] border-[var(--status-rejected)]" : "border-[var(--border)]"
                      }`}>
                        {checked && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      {reason}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other detail */}
          {isOtherSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                Description <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
              </label>
              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="Please describe the issue in detail..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl input-glass text-sm placeholder:text-muted-col resize-none"
              />
            </motion.div>
          )}
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/25 hover:bg-[var(--status-rejected)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {loading ? "Rejecting..." : "Confirm Reject"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Exam View Drawer ────────────────────────────────────────────────────────

function ExamViewDrawer({
  exam,
  onClose,
  onApprove,
  onReject,
  showActions = true,
}: {
  exam: Exam;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  showActions?: boolean;
}) {
  const sc = EXAM_STATUS_CONFIG[exam.status];

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      </motion.div>

      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl glass-modal rounded-l-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-muted-col uppercase tracking-wider">Exam Details</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
            {sc.label}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {/* Exam Title & Meta */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="font-display font-black text-primary-col text-xl leading-tight">{exam.title}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { icon: User,        value: exam.teacherName },
                { icon: Tag,         value: exam.level },
                { icon: BookOpen,     value: exam.type },
                { icon: List,         value: `${exam.questions.length} questions` },
                { icon: Timer,        value: `${exam.duration} min` },
                { icon: Calendar,     value: exam.submittedDate },
              ].map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-surface text-muted-col text-xs">
                  <Icon className="w-3 h-3 text-primary" />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="px-6 pb-6">
            <h4 className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-3">
              Question List ({exam.questions.length})
            </h4>
            <div className="space-y-4">
              {exam.questions.map((q, qi) => (
                <div key={q.id} className="rounded-xl border border-glass-border glass-surface overflow-hidden">
                  {/* Question header */}
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {qi + 1}
                    </div>
                    <p className="text-primary-col text-sm leading-relaxed flex-1">{q.text}</p>
                  </div>

                  {/* Options */}
                  <div className="px-4 pb-3 grid grid-cols-1 gap-1.5">
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === q.correctIndex;
                      return (
                        <div
                          key={oi}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
                            isCorrect
                              ? "bg-[var(--status-active)]/10 border-[var(--status-active)]/25 text-[var(--status-active)]"
                              : "glass-surface text-secondary-col"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${
                            isCorrect ? "bg-[var(--status-active)] border-[var(--status-active)] text-white" : "border-[var(--border)]"
                          }`}>
                            {isCorrect ? "✓" : String.fromCharCode(65 + oi)}
                          </div>
                          <span className={isCorrect ? "font-bold" : ""}>{opt}</span>
                          {isCorrect && <span className="ml-auto text-[var(--status-active)] font-bold text-[10px]">Correct</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mx-4 mb-3 p-3 rounded-lg bg-primary/8 border border-primary/15">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <BookOpen className="w-3 h-3 text-primary" />
                        <span className="text-primary text-[10px] font-bold uppercase tracking-wider">Explanation</span>
                      </div>
                      <p className="text-secondary-col text-xs leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar — only for pending exams */}
        {showActions && exam.status === "pending" && (
          <div className="px-6 py-4 border-t separator">
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
                Close
              </button>
              <button
                onClick={() => onReject(exam.id)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => onApprove(exam.id)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
            </div>
          </div>
        )}

        {!showActions && (
          <div className="px-6 py-4 border-t separator">
            <button onClick={onClose} className="w-full py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
              Close
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─── Exam Card (Pending) ──────────────────────────────────────────────────────

function ExamCard({
  exam,
  onApprove,
  onReject,
  onView,
}: {
  exam: Exam;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onView: (exam: Exam) => void;
}) {
  const sc = EXAM_STATUS_CONFIG[exam.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="card-base p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--status-pending)]/10 text-[var(--status-pending)] flex items-center justify-center flex-shrink-0">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-primary-col">{exam.title}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/12 text-primary">{exam.level}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>{sc.label}</span>
          </div>
          <div className="text-xs text-muted-col mb-3">
            by {exam.teacherName} · {exam.questions.length} questions · {exam.duration} min · {exam.submittedDate}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(exam.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--status-active)]/10 text-[var(--status-active)] text-xs font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => onReject(exam.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-xs font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <button
              onClick={() => onView(exam)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-surface text-secondary-col text-xs font-bold border border-glass-border hover:border-primary/30 hover:text-primary transition"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/exams")({ component: ExamsApprovalPage });

function ExamsApprovalPage() {
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [exams, setExams] = useState(initialExams);
  const [viewing, setViewing] = useState<Exam | null>(null);
  const [viewingApproved, setViewingApproved] = useState<Exam | null>(null);
  const [approveTarget, setApproveTarget] = useState<Exam | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Exam | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const pendingCount = exams.filter(e => e.status === "pending").length;

  const handleApprove = useCallback((id: number) => {
    setExams(prev => prev.filter(e => e.id !== id));
    showToast("Exam approved and published successfully!", "success");
  }, [showToast]);

  const handleReject = useCallback((id: number, _reason: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
    showToast("Exam rejected.", "error");
  }, [showToast]);

  const handleApproveConfirm = useCallback((id: number) => {
    handleApprove(id);
    setApproveTarget(null);
  }, [handleApprove]);

  const handleRejectConfirm = useCallback((id: number, reason: string) => {
    handleReject(id, reason);
    setRejectTarget(null);
  }, [handleReject]);

  const pendingExams = exams.filter(e => e.status === "pending");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Exam Approval</h1>
          <p className="text-sm text-secondary-col mt-0.5">Review and approve teacher-submitted exams</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--status-pending)]/10 text-[var(--status-pending)] text-xs font-bold border border-[var(--status-pending)]/20">
            <AlertTriangle className="w-3 h-3" />
            {pendingCount} exam{pendingCount > 1 ? "s" : ""} pending review
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1 w-fit">
        {(["pending", "approved"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              tab === t
                ? "bg-gradient-hero text-white shadow-md"
                : "text-secondary-col nav-item"
            }`}
          >
            {t === "pending" ? `Pending (${pendingCount})` : `Approved (${approvedExams.length})`}
          </button>
        ))}
      </div>

      {/* Pending Tab */}
      {tab === "pending" && (
        <div className="space-y-3">
          {pendingExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl empty-state">
              <CheckCircle className="w-12 h-12 text-[var(--status-active)]/40 mb-3" />
              <p className="text-secondary-col font-semibold text-sm">All caught up — no pending exams!</p>
            </div>
          ) : (
            pendingExams.map(exam => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onApprove={id => {
                  const e = exams.find(x => x.id === id);
                  if (e) setApproveTarget(e);
                }}
                onReject={id => {
                  const e = exams.find(x => x.id === id);
                  if (e) setRejectTarget(e);
                }}
                onView={setViewing}
              />
            ))
          )}
        </div>
      )}

      {/* Approved Tab */}
      {tab === "approved" && (
        <div className="card-base overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
            <div className="col-span-6">Exam</div>
            <div className="col-span-3 text-center">Stats</div>
            <div className="col-span-3 text-right">View</div>
          </div>
          {approvedExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="w-10 h-10 text-muted-col/40 mb-2" />
              <p className="text-secondary-col text-sm">No approved exams yet.</p>
            </div>
          ) : (
            approvedExams.map((exam, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--status-active)]/10 text-[var(--status-active)] flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-primary-col truncate">{exam.title}</div>
                    <div className="text-muted-col text-[10px] truncate">{exam.teacherName} · {exam.level} · {exam.type}</div>
                  </div>
                </div>
                <div className="col-span-3 flex items-center justify-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-primary-col font-display font-bold text-sm">{[1240, 3210][i]?.toLocaleString() ?? "—"}</span>
                    <span className="text-muted-col text-[9px]">attempts</span>
                  </div>
                  <div className="w-px h-6 bg-[var(--border)]" />
                  <div className="flex flex-col items-center">
                    <span className="text-[var(--status-active)] font-display font-bold text-sm">{[74, 82][i] ?? "—"}%</span>
                    <span className="text-muted-col text-[9px]">avg score</span>
                  </div>
                </div>
                <div className="col-span-3 flex justify-end">
                  <button
                    onClick={() => setViewingApproved(exam)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-surface text-secondary-col text-xs font-bold border border-glass-border hover:border-primary/30 hover:text-primary transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View Drawer (Pending) */}
      <AnimatePresence>
        {viewing && (
          <ExamViewDrawer
            exam={viewing}
            onClose={() => setViewing(null)}
            onApprove={id => {
              const e = exams.find(x => x.id === id);
              if (e) setApproveTarget(e);
              setViewing(null);
            }}
            onReject={id => {
              const e = exams.find(x => x.id === id);
              if (e) setRejectTarget(e);
              setViewing(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* View Drawer (Approved) */}
      <AnimatePresence>
        {viewingApproved && (
          <ExamViewDrawer
            exam={viewingApproved}
            onClose={() => setViewingApproved(null)}
            onApprove={() => {}}
            onReject={() => {}}
            showActions={false}
          />
        )}
      </AnimatePresence>

      {/* Approve Confirm Modal */}
      <AnimatePresence>
        {approveTarget && (
          <ApproveConfirmModal
            exam={approveTarget}
            onConfirm={handleApproveConfirm}
            onClose={() => setApproveTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            exam={rejectTarget}
            onConfirm={handleRejectConfirm}
            onClose={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast?.message ?? ""} type={toast?.type ?? "success"} visible={!!toast} />
    </div>
  );
}
