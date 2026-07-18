import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { PreviewSheet } from "@/components/teacher/dialogs";

import { BreadcrumbNavigation } from "@/components/teacher/question-bank/BreadcrumbNavigation";
import { QuestionBankToolbar } from "@/components/teacher/question-bank/QuestionBankToolbar";
import { LevelAccordion } from "@/components/teacher/question-bank/LevelAccordion";
import { LessonAccordion } from "@/components/teacher/question-bank/LessonAccordion";
import { SkillGrid } from "@/components/teacher/question-bank/SkillGrid";
import { useQuery } from "@tanstack/react-query";
import { teacherQuestionsApi } from "@/lib/api/teacherQuestions";
import { mapBackendQuestionToFrontend } from "@/services/questionBankService";
import type { JLPTLevel, QuestionType, Difficulty } from "@/services/questionBank.types";

export const Route = createFileRoute("/teacher/question-bank")({
  head: () => ({ meta: [{ title: "Question Bank — MIDORI Teacher" }] }),
  component: QuestionBank,
});

interface TopicWithLesson {
  id: string;
  level: JLPTLevel;
  lessonId: number;
  lesson: string;
  skill: QuestionType;
  name: string;
  jpName: string;
  totalQuestions: number;
  easy: number;
  medium: number;
  hard: number;
  updatedAt: string;
}

function QuestionBank() {
  const [viewMode, setViewMode] = useState<"level" | "lesson" | "skill" | any>("level");
  
  // Toolbar Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [lessonFilter, setLessonFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  // Breadcrumbs Drilling Navigation State
  const [navLevel, setNavLevel] = useState<string | null>(null);
  const [navLesson, setNavLesson] = useState<string | null>(null);
  const [navSkill, setNavSkill] = useState<string | null>(null);

  // Accordion Expand States
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    N5: true, // N5 open by default
  });
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});

  // Preview Dialog State
  const [openPreviewTopicId, setOpenPreviewTopicId] = useState<string | null>(null);

  // React Query data fetching from centralized backend
  const { data: rawQuestions = [] } = useQuery({
    queryKey: ["questionBankQuestions"],
    queryFn: async () => {
      const res = await teacherQuestionsApi.getQuestions();
      return res;
    },
  });

  const questions = useMemo(() => {
    const mapped = rawQuestions.map(mapBackendQuestionToFrontend);
    console.log("Teacher QB: mapped questions =", mapped);
    return mapped;
  }, [rawQuestions]);

  const { data: n5Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N5"],
    queryFn: () => teacherQuestionsApi.getLessons("N5").then((res) => res),
  });
  const { data: n4Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N4"],
    queryFn: () => teacherQuestionsApi.getLessons("N4").then((res) => res),
  });
  const { data: n3Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N3"],
    queryFn: () => teacherQuestionsApi.getLessons("N3").then((res) => res),
  });
  const { data: n2Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N2"],
    queryFn: () => teacherQuestionsApi.getLessons("N2").then((res) => res),
  });
  const { data: n1Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N1"],
    queryFn: () => teacherQuestionsApi.getLessons("N1").then((res) => res),
  });

  const lessonsMap = useMemo(() => {
    const map = new Map<number, string>();
    const all = [...n5Lessons, ...n4Lessons, ...n3Lessons, ...n2Lessons, ...n1Lessons];
    all.forEach((l) => map.set(l.id, l.lessonName));
    return map;
  }, [n5Lessons, n4Lessons, n3Lessons, n2Lessons, n1Lessons]);

  // Dynamically group questions into virtual Topics to match the existing UI hierarchy
  const topicsWithLessons = useMemo(() => {
    const groups: Record<string, Question[]> = {};
    questions.forEach((q) => {
      const key = `${q.level}_${q.lesson}_${q.type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    });

    const topics: TopicWithLesson[] = [];
    Object.entries(groups).forEach(([key, list]) => {
      if (list.length === 0) return;
      const [level, lessonIdStr, type] = key.split("_");
      const lessonId = parseInt(lessonIdStr);
      const lessonName = lessonsMap.get(lessonId) || `Lesson ${lessonId}`;
      
      const easy = list.filter((q) => q.difficulty === "Easy").length;
      const medium = list.filter((q) => q.difficulty === "Medium").length;
      const hard = list.filter((q) => q.difficulty === "Hard").length;

      topics.push({
        id: key,
        level: level as JLPTLevel,
        lessonId,
        lesson: lessonName,
        skill: type as QuestionType,
        name: `${lessonName} — ${type}`,
        jpName: lessonName,
        totalQuestions: list.length,
        easy,
        medium,
        hard,
        updatedAt: list[0]?.createdAt || new Date().toISOString(),
      });
    });

    console.log("Teacher QB: topicsWithLessons =", topics);
    return topics;
  }, [questions, lessonsMap]);

  // Update available lessons for selector dropdown based on Level filter selection
  const availableLessons = useMemo(() => {
    const subset = levelFilter === "All" 
      ? topicsWithLessons 
      : topicsWithLessons.filter((t) => t.level === levelFilter);
    const unique = Array.from(new Set(subset.map((t) => t.lesson)));
    return unique.sort();
  }, [topicsWithLessons, levelFilter]);

  // Handle Level selection change on toolbar
  const handleLevelChange = (lvl: string) => {
    setLevelFilter(lvl);
    setLessonFilter("All");
    if (lvl !== "All") {
      setNavLevel(lvl);
      setViewMode("lesson");
    } else {
      setNavLevel(null);
      setNavLesson(null);
      setNavSkill(null);
      setViewMode("level");
    }
  };

  // Handle Lesson selection change on toolbar
  const handleLessonChange = (les: string) => {
    setLessonFilter(les);
    if (les !== "All") {
      setNavLesson(les);
      setViewMode("skill");
    } else {
      setNavLesson(null);
      setNavSkill(null);
      setViewMode("lesson");
    }
  };

  // Breadcrumbs click backtrack handler
  const handleBreadcrumbClick = (type: "root" | "level" | "lesson") => {
    if (type === "root") {
      setNavLevel(null);
      setNavLesson(null);
      setNavSkill(null);
      setLevelFilter("All");
      setLessonFilter("All");
      setSkillFilter("All");
      setViewMode("level");
    } else if (type === "level") {
      setNavLesson(null);
      setNavSkill(null);
      setLessonFilter("All");
      setSkillFilter("All");
      setViewMode("lesson");
    } else if (type === "lesson") {
      setNavSkill(null);
      setSkillFilter("All");
      setViewMode("skill");
    }
  };

  // Filter topics based on search inputs, difficulty, skill, level, and lesson filters
  const filteredTopics = useMemo(() => {
    return topicsWithLessons
      .filter((t) => {
        // Search Filter
        const matchesSearch =
          searchQuery === "" ||
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.jpName.toLowerCase().includes(searchQuery.toLowerCase());

        // Level Filter (sync with navLevel if not All)
        const activeLevel = navLevel ?? levelFilter;
        const matchesLevel = activeLevel === "All" || t.level === activeLevel;

        // Lesson Filter (sync with navLesson if not All)
        const activeLesson = navLesson ?? lessonFilter;
        const matchesLesson = activeLesson === "All" || t.lesson === activeLesson;

        // Skill Filter (sync with navSkill if not All)
        const activeSkill = navSkill ?? skillFilter;
        const matchesSkill = activeSkill === "All" || t.skill === activeSkill;

        // Difficulty Filter
        let matchesDifficulty = true;
        if (difficultyFilter === "Easy") {
          matchesDifficulty = t.easy > 0;
        } else if (difficultyFilter === "Medium") {
          matchesDifficulty = t.medium > 0;
        } else if (difficultyFilter === "Hard") {
          matchesDifficulty = t.hard > 0;
        }

        return matchesSearch && matchesLevel && matchesLesson && matchesSkill && matchesDifficulty;
      })
      .sort((a, b) => {
        if (sortBy === "Alphabetical") {
          return a.name.localeCompare(b.name);
        } else if (sortBy === "Oldest") {
          return a.updatedAt.localeCompare(b.updatedAt);
        } else {
          return b.updatedAt.localeCompare(a.updatedAt);
        }
      });
  }, [
    topicsWithLessons,
    searchQuery,
    levelFilter,
    lessonFilter,
    skillFilter,
    difficultyFilter,
    sortBy,
    navLevel,
    navLesson,
    navSkill,
  ]);

  // Hierarchically group filtered topics for rendering views
  const groupedHierarchicalData = useMemo(() => {
    const data = {} as Record<string, Record<string, Record<string, TopicWithLesson[]>>>;
    filteredTopics.forEach((t) => {
      if (!data[t.level]) data[t.level] = {};
      if (!data[t.level][t.lesson]) data[t.level][t.lesson] = {};
      if (!data[t.level][t.lesson][t.skill]) data[t.level][t.lesson][t.skill] = [];
      data[t.level][t.lesson][t.skill].push(t);
    });
    return data;
  }, [filteredTopics]);

  // Group lessons and skills inside the active JLPT Level for Lesson View
  const groupedLessons = useMemo(() => {
    const activeLevel = navLevel !== "All" ? navLevel : null;
    const subset = activeLevel 
      ? filteredTopics.filter((t) => t.level === activeLevel) 
      : filteredTopics;

    const data = {} as Record<string, Record<string, TopicWithLesson[]>>;
    subset.forEach((t) => {
      if (!data[t.lesson]) data[t.lesson] = {};
      if (!data[t.lesson][t.skill]) data[t.lesson][t.skill] = [];
      data[t.lesson][t.skill].push(t);
    });
    return data;
  }, [filteredTopics, navLevel]);

  // Group skills for Skill View
  const groupedSkills = useMemo(() => {
    const data = {} as Record<string, TopicWithLesson[]>;
    filteredTopics.forEach((t) => {
      if (!data[t.skill]) data[t.skill] = [];
      data[t.skill].push(t);
    });
    return data;
  }, [filteredTopics]);

  // Click selectors to drill down the hierarchy
  const handleToggleLevel = (lvl: string) => {
    setExpandedLevels((prev) => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  const handleToggleLesson = (les: string) => {
    setExpandedLessons((prev) => ({ ...prev, [les]: !prev[les] }));
  };

  const handleSelectLesson = (lvl: string, les: string) => {
    setNavLevel(lvl);
    setNavLesson(les);
    setLevelFilter(lvl);
    setLessonFilter(les);
    setViewMode("skill");
    setExpandedLessons((prev) => ({ ...prev, [les]: true }));
  };

  const handleSelectSkill = (les: string, skill: string) => {
    setNavLesson(les);
    setNavSkill(skill);
    setLessonFilter(les);
    setSkillFilter(skill);
    setViewMode("skill");
  };

  // Preview Sheets Details Fetching
  const selTopic = openPreviewTopicId ? topicsWithLessons.find((t) => t.id === openPreviewTopicId) : null;
  const selQs = useMemo(() => {
    if (!selTopic) return [];
    return questions.filter(
      (q) =>
        q.level === selTopic.level &&
        q.lesson === selTopic.lessonId &&
        q.type === selTopic.skill
    ).slice(0, 6);
  }, [selTopic, questions]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Center library"
        title="Question Bank"
        subtitle="Center-managed individual questions, organized by level, lesson and topic."
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b pb-4 border-border/40">
        <BreadcrumbNavigation
          level={navLevel}
          lesson={navLesson}
          skill={navSkill}
          onNavigate={handleBreadcrumbClick}
        />
      </div>

      {/* Toolbar */}
      <QuestionBankToolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        level={levelFilter}
        onLevelChange={handleLevelChange}
        lesson={lessonFilter}
        onLessonChange={handleLessonChange}
        skill={skillFilter}
        onSkillChange={setSkillFilter}
        difficulty={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
        sort={sortBy}
        onSortChange={setSortBy}
        availableLessons={availableLessons}
      />

      {/* Content Rendering depending on Mode */}
      {filteredTopics.length === 0 ? (
        <Card className="py-12 text-center text-muted-foreground border-border/60 shadow-sm">
          No topics found.
        </Card>
      ) : (
        <>
          {viewMode === "level" && (
            <LevelAccordion
              groupedData={groupedHierarchicalData}
              expandedLevels={expandedLevels}
              onToggleLevel={handleToggleLevel}
              onSelectLesson={handleSelectLesson}
            />
          )}

          {viewMode === "lesson" && (
            <LessonAccordion
              groupedLessons={groupedLessons}
              expandedLessons={expandedLessons}
              onToggleLesson={handleToggleLesson}
              onSelectSkill={handleSelectSkill}
              onOpenPreview={setOpenPreviewTopicId}
            />
          )}

          {viewMode === "skill" && (
            <SkillGrid
              groupedSkills={groupedSkills}
              onOpenPreview={setOpenPreviewTopicId}
            />
          )}
        </>
      )}

      {/* Preview Sheet dialog */}
      <PreviewSheet
        open={!!selTopic}
        onOpenChange={(o) => !o && setOpenPreviewTopicId(null)}
        title={selTopic?.name ?? ""}
        description={selTopic?.jpName}
      >
        {selTopic && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <LevelBadge level={selTopic.level} />
              <span className="text-xs text-muted-foreground">{selTopic.skill}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-bold">{selTopic.totalQuestions}</div>
              </div>
              <div className="rounded-md bg-success/10 p-2">
                <div className="text-xs text-success">Easy</div>
                <div className="font-bold">{selTopic.easy}</div>
              </div>
              <div className="rounded-md bg-warning/15 p-2">
                <div className="text-xs">Medium</div>
                <div className="font-bold">{selTopic.medium}</div>
              </div>
              <div className="rounded-md bg-destructive/10 p-2">
                <div className="text-xs text-destructive">Hard</div>
                <div className="font-bold">{selTopic.hard}</div>
              </div>
            </div>
            <div className="mt-2 text-xs font-semibold text-muted-foreground">Sample questions</div>
            <ul className="space-y-2">
              {selQs.map((q) => (
                <li key={q.id} className="rounded-lg border p-3 text-sm">
                  <div className="mb-1.5 flex items-center gap-2">
                    <DifficultyBadge d={q.difficulty} />
                    <span className="text-xs text-muted-foreground">{q.points} pts</span>
                  </div>
                  <div className="font-medium mb-2">{q.questionText}</div>
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`rounded p-2 text-xs border ${
                              isCorrect
                                ? "bg-green-500/10 border-green-500/30 text-green-700 font-medium"
                                : "bg-muted/40 border-border/40 text-muted-foreground"
                            }`}
                          >
                            <span className="font-bold mr-1">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>{" "}
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Button asChild className="w-full">
                <a href={`/teacher/homework/create?source=question-bank&topicId=${selTopic.id}`}>
                  Add to homework
                </a>
              </Button>
            </div>
          </div>
        )}
      </PreviewSheet>
    </div>
  );
}
