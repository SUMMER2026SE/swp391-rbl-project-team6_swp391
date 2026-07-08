import type { TeacherQuestionResponse } from "@/lib/api/teacherQuestions";
import type { JLPTLevel } from "@/types/teacher-exam";

export interface QuestionTopicView {
  id: string;
  name: string;
  jpName: string;
  level: JLPTLevel;
  skill: string;
  totalQuestions: number;
  easy: number;
  medium: number;
  hard: number;
  updatedAt: string;
}

export interface BankQuestionView {
  id: string;
  topicId: string;
  prompt: string;
  jpPrompt?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  skill: string;
  points: number;
}

function normalizeDifficulty(value: string): "easy" | "medium" | "hard" {
  const d = value.toLowerCase();
  if (d === "easy" || d === "hard") return d;
  return "medium";
}

export function mapApiQuestion(q: TeacherQuestionResponse): BankQuestionView {
  return {
    id: q.id,
    topicId: q.topicId || "uncategorized",
    prompt: q.prompt,
    jpPrompt: q.jpPrompt,
    options: q.options,
    correctAnswerIndex: q.correctAnswerIndex,
    explanation: q.explanation || "",
    difficulty: normalizeDifficulty(q.difficulty),
    skill: q.questionType || "Grammar",
    points: q.points,
  };
}

export function buildTopicsFromQuestions(
  questions: TeacherQuestionResponse[],
): QuestionTopicView[] {
  const byTopic = new Map<string, TeacherQuestionResponse[]>();

  for (const q of questions) {
    const topicId = q.topicId || "uncategorized";
    const list = byTopic.get(topicId) || [];
    list.push(q);
    byTopic.set(topicId, list);
  }

  return Array.from(byTopic.entries()).map(([topicId, qs]) => {
    const easy = qs.filter((q) => normalizeDifficulty(q.difficulty) === "easy").length;
    const medium = qs.filter((q) => normalizeDifficulty(q.difficulty) === "medium").length;
    const hard = qs.filter((q) => normalizeDifficulty(q.difficulty) === "hard").length;
    const label = topicId === "uncategorized" ? "Uncategorized" : topicId;
    const latest = qs.reduce(
      (max, q) => (q.updatedAt > max ? q.updatedAt : max),
      qs[0]?.updatedAt || "",
    );

    return {
      id: topicId,
      name: label,
      jpName: label,
      level: "N3" as JLPTLevel,
      skill: qs[0]?.questionType || "Grammar",
      totalQuestions: qs.length,
      easy,
      medium,
      hard,
      updatedAt: latest,
    };
  });
}

export function getTopicById(
  topics: QuestionTopicView[],
  id: string,
): QuestionTopicView | undefined {
  return topics.find((t) => t.id === id);
}

export function getAggregatedTopicCounts(
  topics: QuestionTopicView[],
  topicIds: string[],
) {
  const selected = topics.filter((t) => topicIds.includes(t.id));
  return {
    easy: selected.reduce((s, t) => s + t.easy, 0),
    medium: selected.reduce((s, t) => s + t.medium, 0),
    hard: selected.reduce((s, t) => s + t.hard, 0),
    total: selected.reduce((s, t) => s + t.totalQuestions, 0),
  };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface RandomGenParams {
  questions: BankQuestionView[];
  topicIds: string[];
  total: number;
  easyPct: number;
  mediumPct: number;
  hardPct: number;
  excludeIds?: string[];
}

export function pickRandomQuestions(params: RandomGenParams): BankQuestionView[] {
  const pool = params.questions.filter(
    (q) =>
      params.topicIds.includes(q.topicId) &&
      !(params.excludeIds || []).includes(q.id),
  );
  if (pool.length === 0 || params.total <= 0) return [];

  const easyCount = Math.round((params.total * params.easyPct) / 100);
  const mediumCount = Math.round((params.total * params.mediumPct) / 100);
  const hardCount = Math.max(0, params.total - easyCount - mediumCount);

  const byDiff = {
    easy: shuffle(pool.filter((q) => q.difficulty === "easy")),
    medium: shuffle(pool.filter((q) => q.difficulty === "medium")),
    hard: shuffle(pool.filter((q) => q.difficulty === "hard")),
  };

  const picked: BankQuestionView[] = [];
  const take = (list: BankQuestionView[], n: number) => {
    for (const q of list) {
      if (picked.length >= params.total || n <= 0) break;
      if (!picked.some((p) => p.id === q.id)) {
        picked.push(q);
        n--;
      }
    }
    return n;
  };

  let remEasy = take(byDiff.easy, easyCount);
  let remMedium = take(byDiff.medium, mediumCount);
  let remHard = take(byDiff.hard, hardCount);

  const remainder = shuffle(pool.filter((q) => !picked.some((p) => p.id === q.id)));
  for (const q of remainder) {
    if (picked.length >= params.total) break;
    if (remEasy > 0 && q.difficulty === "easy") {
      picked.push(q);
      remEasy--;
    } else if (remMedium > 0 && q.difficulty === "medium") {
      picked.push(q);
      remMedium--;
    } else if (remHard > 0 && q.difficulty === "hard") {
      picked.push(q);
      remHard--;
    } else if (remEasy + remMedium + remHard > 0) {
      picked.push(q);
    }
  }

  return picked.slice(0, params.total);
}
