import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getQuestionTopics, getQuestionsByTopic, QuestionTopic } from "@/data/teacher-data";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { PreviewSheet } from "@/components/teacher/dialogs";
import { Sparkles } from "lucide-react";

import { BreadcrumbNavigation } from "@/components/teacher/question-bank/BreadcrumbNavigation";
import { QuestionBankToolbar } from "@/components/teacher/question-bank/QuestionBankToolbar";
import { LevelAccordion } from "@/components/teacher/question-bank/LevelAccordion";
import { LessonAccordion } from "@/components/teacher/question-bank/LessonAccordion";
import { SkillGrid } from "@/components/teacher/question-bank/SkillGrid";
import { QuestionTopicCard } from "@/components/teacher/question-bank/QuestionTopicCard";

export const Route = createFileRoute("/teacher/question-bank")({
  head: () => ({ meta: [{ title: "Question Bank — MIDORI Teacher" }] }),
  component: QuestionBank,
});

interface TopicWithLesson extends QuestionTopic {
  lesson: string;
}

function QuestionBank() {
  const [viewMode, setViewMode] = useState<"level" | "lesson" | "skill">("level");
  
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

  // Map mock lessons to raw topics
  const topicsWithLessons = useMemo(() => {
    const raw = getQuestionTopics();
    return raw.map((t) => {
      let lesson = "Lesson 1";
      if (t.skill === "Vocabulary" || t.skill === "Kanji") {
        lesson = "Lesson 1";
      } else if (t.skill === "Grammar") {
        lesson = "Lesson 2";
      } else if (t.skill === "Reading") {
        lesson = "Lesson 3";
      } else if (t.skill === "Listening") {
        lesson = "Lesson 4";
      }
      return {
        ...t,
        lesson,
      } as TopicWithLesson;
    });
  }, []);

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
          // Newest
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
  const selQs = selTopic ? getQuestionsByTopic(selTopic.id).slice(0, 6) : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Center library"
        title="Question Bank"
        subtitle="Center-managed individual questions, organized by level, lesson and topic."
        actions={
          <Button asChild>
            <a href="/teacher/exams/create?source=question-bank">
              <Sparkles className="mr-2 h-4 w-4" />
              Create random exam
            </a>
          </Button>
        }
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
                  <div className="mb-1 flex items-center gap-2">
                    <DifficultyBadge d={q.difficulty} />
                    <span className="text-xs text-muted-foreground">{q.points} pts</span>
                  </div>
                  <div className="font-medium">{q.prompt}</div>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button asChild>
                <a href={`/teacher/exams/create?source=question-bank&topicId=${selTopic.id}&mode=random`}>
                  Random exam from this
                </a>
              </Button>
              <Button asChild variant="outline">
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
