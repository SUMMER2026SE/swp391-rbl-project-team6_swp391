"use client";

import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  BookOpen,
  GraduationCap,
  Headphones,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { SkillCard } from "@/components/student/journey/SkillCard";
import { VocabularyModule } from "@/components/student/journey/VocabularyModule";
import { GrammarModule } from "@/components/student/journey/GrammarModule";
import { ReadingModule } from "@/components/student/journey/ReadingModule";
import { ListeningModule } from "@/components/student/journey/ListeningModule";
import { cn } from "@/lib/utils";
import { lessonsApi } from "@/lib/api/lessons";
import { studentVocabularyApi } from "@/lib/api/vocabulary";
import { studentGrammarApi, type GrammarDetailResponse } from "@/lib/api/grammarContent";
import { studentReadingApi } from "@/lib/api/reading";
import { studentListeningApi } from "@/lib/api/listening";

type SkillType = "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";

interface SkillContent {
  type: SkillType;
  status: "available" | "coming_soon";
  data?: unknown;
}

type LessonDetailSearch = {
  skill?: string;
};

export const Route = createFileRoute("/student/journey/$lessonId")({
  component: LessonDetailPage,
  validateSearch: (search: Record<string, unknown>): LessonDetailSearch => ({
    skill: typeof search.skill === "string" ? search.skill : undefined,
  }),
  loader: async ({ params }) => {
    const lesson = await lessonsApi.getAllLessons();
    const found = lesson.find((l) => l.id === params.lessonId);
    if (!found) throw new Error("Lesson not found");
    return { lesson: found };
  },
});

const SKILL_LABELS: Record<SkillType, string> = {
  VOCABULARY: "Vocabulary",
  GRAMMAR: "Grammar",
  READING: "Reading",
  LISTENING: "Listening",
};

function normalizeSkill(raw: string | undefined): SkillType | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === "VOCABULARY" || upper === "GRAMMAR" || upper === "READING" || upper === "LISTENING") {
    return upper;
  }
  return null;
}

function LessonDetailPage() {
  const { lesson } = Route.useLoaderData();
  const { skill: skillParam } = Route.useSearch();

  const [activeSkill, setActiveSkill] = useState<SkillType | null>(() => normalizeSkill(skillParam));
  const [skills, setSkills] = useState<SkillContent[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingSkills(true);
    setError(null);

    async function loadSkills() {
      try {
        const results = await Promise.allSettled([
          studentVocabularyApi
            .getVocabularyLessons()
            .then((items) => items.find((item) => item.lessonId === lesson.id) ?? null),
          studentGrammarApi
            .getGrammarLessons({ level: lesson.level })
            .then((items) =>
              items.filter((item) => item.lessonNumber === lesson.lessonNumber),
            ),
          studentReadingApi
            .getReadingLessons()
            .then((items) => items.find((item) => item.lessonId === lesson.id) ?? null),
          studentListeningApi
            .getListeningLessons()
            .then((items) => items.find((item) => item.lessonId === lesson.id) ?? null),
        ]);

        if (cancelled) return;

        const grammar = results[1].status === "fulfilled" ? results[1].value : [];
        const vocabulary = results[0].status === "fulfilled" ? results[0].value : null;
        const reading = results[2].status === "fulfilled" ? results[2].value : null;
        const listening = results[3].status === "fulfilled" ? results[3].value : null;

        const grammarDetails = await Promise.all(
          grammar.map((item) =>
            studentGrammarApi.getGrammarLesson(item.id).catch(() => null),
          ),
        );
        const grammarContent = grammarDetails.filter(
          (item): item is GrammarDetailResponse => item !== null,
        );

        const skillContent: SkillContent[] = [
          {
            type: "VOCABULARY",
            status: vocabulary ? "available" : "coming_soon",
            data: vocabulary,
          },
          {
            type: "GRAMMAR",
            status: grammarContent.length > 0 ? "available" : "coming_soon",
            data: grammarContent,
          },
          { type: "READING", status: reading ? "available" : "coming_soon", data: reading ?? null },
          { type: "LISTENING", status: listening ? "available" : "coming_soon", data: listening ?? null },
        ];
        setSkills(skillContent);

        // Resolve active skill: prefer the URL ?skill param when its skill is available;
        // otherwise default to the first available skill.
        setActiveSkill((current) => {
          const requested = normalizeSkill(skillParam);
          if (requested) {
            const match = skillContent.find((s) => s.type === requested);
            if (match && match.status === "available") return requested;
          }
          const firstAvailable = skillContent.find((s) => s.status === "available");
          return firstAvailable?.type ?? current ?? null;
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load lesson skills");
      } finally {
        if (!cancelled) setLoadingSkills(false);
      }
    }

    loadSkills();

    return () => {
      cancelled = true;
    };
  }, [lesson.id, lesson.level, lesson.lessonNumber, skillParam]);

  const skillIcons: Record<SkillType, React.ElementType> = {
    VOCABULARY: BookOpen,
    GRAMMAR: GraduationCap,
    READING: BookOpen,
    LISTENING: Headphones,
  };

  const getSkillModule = (skillType: SkillType) => {
    const skill = skills.find((s) => s.type === skillType);
    if (!skill || skill.status !== "available") return null;

    switch (skillType) {
      case "VOCABULARY":
        return <VocabularyModule lessonId={lesson.id} />;
      case "GRAMMAR":
        return (
          <GrammarModule
            grammar={(skill.data as GrammarDetailResponse[]) ?? []}
          />
        );
      case "READING":
        return <ReadingModule lessonNumber={lesson.lessonNumber} />;
      case "LISTENING":
        return <ListeningModule lessonId={lesson.id} />;
      default:
        return null;
    }
  };

  if (loadingSkills) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Loading Lesson</h2>
          <p className="text-sm text-muted-foreground">Please wait while we load the lesson content.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Failed to load lesson</h2>
          <p className="text-sm text-muted-foreground mb-5">{error}</p>
          <Link
            to="/student/journey"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-hero text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Journey
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <Link
          to="/student/journey"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-4 group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Learning Journey
        </Link>

        <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-lg bg-sky-blue text-white text-xs font-bold">
                Lesson {(lesson.lessonNumber ?? 1).toString().padStart(2, "0")}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold">
                {lesson.level}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-sm text-muted-foreground">{lesson.description}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Skills Section */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
        {/* Skill Navigation Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <div className="bg-card rounded-xl border border-border/50 p-3 shadow-sm">
            <h2 className="font-display font-bold text-sm text-foreground mb-3 px-1">Skills</h2>
            <div className="space-y-2">
              {skills.map((skill) => (
                <SkillCard
                  key={skill.type}
                  skill={skill}
                  isActive={activeSkill === skill.type}
                  onSelect={() => setActiveSkill(skill.type)}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Skill Content Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border/50 shadow-sm min-h-[400px]"
        >
          <AnimatePresence mode="wait">
            {activeSkill ? (
              <motion.div
                key={activeSkill}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-5"
              >
                {/* Skill Header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-lg flex items-center justify-center",
                      activeSkill === "VOCABULARY" && "bg-primary/15",
                      activeSkill === "GRAMMAR" && "bg-lavender/20",
                      activeSkill === "READING" && "bg-sky-blue/15",
                      activeSkill === "LISTENING" && "bg-sakura/20",
                    )}
                  >
                    {(() => {
                      const Icon = skillIcons[activeSkill];
                      return <Icon className="w-5 h-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      {SKILL_LABELS[activeSkill]}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeSkill === "VOCABULARY" && "Learn new vocabulary words"}
                      {activeSkill === "GRAMMAR" && "Understand grammar patterns"}
                      {activeSkill === "READING" && "Practice reading comprehension"}
                      {activeSkill === "LISTENING" && "Improve listening skills"}
                    </p>
                  </div>
                </div>

                {/* Skill Module */}
                <div className="min-h-[300px]">{getSkillModule(activeSkill)}</div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-2">No content yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  This lesson does not have any skill content available right now.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}