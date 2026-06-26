"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  BookOpen,
  GraduationCap,
  Headphones,
  Sparkles,
  Trophy,
  Lock,
  CheckCircle,
  ArrowLeft,
  Play,
} from "lucide-react";
import {
  getLessonById,
  type SkillType,
} from "@/mock/student-learning-journey";
import { SkillCard } from "@/components/student/journey/SkillCard";
import { ProgressCircle } from "@/components/student/journey/ProgressCircle";
import { XPCard, LessonCompleteCard } from "@/components/student/journey/XPCard";
import { VocabularyModule } from "@/components/student/journey/VocabularyModule";
import { GrammarModule } from "@/components/student/journey/GrammarModule";
import { ReadingModule } from "@/components/student/journey/ReadingModule";
import { ListeningModule } from "@/components/student/journey/ListeningModule";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/journey/$lessonId")({
  component: LessonDetailPage,
});

function LessonDetailPage() {
  const params = Route.useParams();
  const lesson = getLessonById(params.lessonId);

  const [activeSkill, setActiveSkill] = useState<SkillType | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  const [completedSkills, setCompletedSkills] = useState<Set<SkillType>>(new Set());
  const [lessonXpAwarded, setLessonXpAwarded] = useState(false);

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Lesson Not Found</h2>
          <p className="text-sm text-muted-foreground mb-5">
            The lesson you are looking for does not exist.
          </p>
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

  const isLocked = lesson.status === "LOCKED";
  const isCompleted = lesson.status === "COMPLETED";

  const skillProgress: Record<SkillType, number> = {
    VOCABULARY: isCompleted ? 100 : completedSkills.has("VOCABULARY") ? 100 : 0,
    GRAMMAR: isCompleted ? 100 : completedSkills.has("GRAMMAR") ? 100 : 0,
    READING: isCompleted ? 100 : completedSkills.has("READING") ? 100 : 0,
    LISTENING: isCompleted ? 100 : completedSkills.has("LISTENING") ? 100 : 0,
  };

  const overallProgress = Math.round(
    (Object.values(skillProgress).reduce((a, b) => a + b, 0) / 4)
  );

  const handleSkillComplete = (skillType: SkillType, xp: number) => {
    setXpEarned(prev => prev + xp);
    setCompletedSkills(prev => new Set(prev).add(skillType));
  };

  const skillIcons: Record<SkillType, React.ElementType> = {
    VOCABULARY: BookOpen,
    GRAMMAR: GraduationCap,
    READING: BookOpen,
    LISTENING: Headphones,
  };

  const getSkillModule = (skillType: SkillType) => {
    const skill = lesson.skills.find(s => s.type === skillType);
    if (!skill) return null;

    switch (skillType) {
      case "VOCABULARY":
        return skill.vocabulary ? (
          <VocabularyModule
            vocabulary={skill.vocabulary}
            onComplete={(xp) => handleSkillComplete(skillType, xp)}
          />
        ) : null;
      case "GRAMMAR":
        return skill.grammar ? (
          <GrammarModule
            grammar={skill.grammar}
            onComplete={(xp) => handleSkillComplete(skillType, xp)}
          />
        ) : null;
      case "READING":
        return skill.readingPassages ? (
          <ReadingModule
            passages={skill.readingPassages}
            onComplete={(xp) => handleSkillComplete(skillType, xp)}
          />
        ) : null;
      case "LISTENING":
        return skill.listeningQuestions ? (
          <ListeningModule
            questions={skill.listeningQuestions}
            onComplete={(xp) => handleSkillComplete(skillType, xp)}
          />
        ) : null;
      default:
        return null;
    }
  };

  if (isLocked) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center"
          >
            <Lock className="w-8 h-8 text-muted-foreground" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2">Lesson Locked</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Complete the previous lesson with a score of 70% or higher to unlock this content.
          </p>
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <Link
          to="/student/journey"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-4 group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Learning Journey
        </Link>

        <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex-1">
              {/* Lesson Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold",
                  isCompleted
                    ? "bg-primary text-white"
                    : "bg-sky-blue text-white"
                )}>
                  Lesson {lesson.number.toString().padStart(2, "0")}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold">
                  {lesson.level}
                </span>
                {lesson.score !== undefined && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-500 text-xs font-semibold">
                    Score: {lesson.score}%
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                {lesson.title}
              </h1>
              <p className="text-sm text-muted-foreground mb-3">
                {lesson.description}
              </p>

              {/* Japanese Title */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                <span className="text-lg">🇯🇵</span>
                <span className="text-sm text-foreground font-medium">
                  {lesson.titleJapanese}
                </span>
              </div>
            </div>

            {/* Progress Circle */}
            <div className="flex items-center gap-4">
              <ProgressCircle progress={overallProgress} size="md" />
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
                >
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lesson Complete Overlay */}
      <AnimatePresence>
        {isLessonComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-card rounded-xl p-5 max-w-md w-full shadow-xl"
            >
              <LessonCompleteCard
                lessonTitle={lesson.title}
                totalXp={lesson.xpReward}
                score={overallProgress}
                badgesEarned={lesson.badgeReward ? [lesson.badgeReward] : []}
              />
              <Link
                to="/student/journey"
                className="w-full mt-4 py-2.5 rounded-lg bg-gradient-hero text-white font-semibold text-center block hover:opacity-90 transition text-sm"
              >
                Continue Journey
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skills Section - Learning Dashboard */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
        {/* Skill Navigation Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <h2 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Learning Skills
            </h2>
            <div className="space-y-2">
              {lesson.skills.map((skill, index) => (
                <motion.div
                  key={skill.type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <SkillCard
                    skill={skill}
                    isActive={activeSkill === skill.type}
                    onSelect={() => setActiveSkill(activeSkill === skill.type ? null : skill.type)}
                    progress={skillProgress[skill.type]}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* XP Card */}
          {xpEarned > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <XPCard xpGained={xpEarned} completedSkill={activeSkill || undefined} />
            </motion.div>
          )}

          {/* Lesson Info */}
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm text-foreground">Lesson Rewards</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-muted-foreground">XP:</span>
                <span className="font-bold text-amber-500">{lesson.xpReward}</span>
              </div>
              {lesson.badgeReward && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span className="text-muted-foreground">Badge:</span>
                  <span className="font-bold text-amber-500">1</span>
                </div>
              )}
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
                  <div className={cn(
                    "w-11 h-11 rounded-lg flex items-center justify-center",
                    activeSkill === "VOCABULARY" && "bg-primary/15",
                    activeSkill === "GRAMMAR" && "bg-lavender/20",
                    activeSkill === "READING" && "bg-sky-blue/15",
                    activeSkill === "LISTENING" && "bg-sakura/20"
                  )}>
                    {(() => {
                      const Icon = skillIcons[activeSkill];
                      return <Icon className="w-5 h-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      {activeSkill.charAt(0) + activeSkill.slice(1).toLowerCase()}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeSkill === "VOCABULARY" && "Learn new vocabulary words"}
                      {activeSkill === "GRAMMAR" && "Understand grammar patterns"}
                      {activeSkill === "READING" && "Practice reading comprehension"}
                      {activeSkill === "LISTENING" && "Improve listening skills"}
                    </p>
                  </div>
                  {skillProgress[activeSkill] === 100 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-xs font-semibold"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Completed
                    </motion.div>
                  )}
                </div>

                {/* Skill Module */}
                <div className="min-h-[300px]">
                  {getSkillModule(activeSkill)}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-6"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-5"
                >
                  <Play className="w-8 h-8 text-primary ml-0.5" />
                </motion.div>
                <h3 className="text-lg font-bold text-foreground mb-2">Ready to Learn?</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-5">
                  Choose a skill from the left panel to begin learning. Each skill includes theory and practice sections.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap justify-center">
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    Vocabulary
                  </span>
                  <span>+</span>
                  <span className="px-2 py-0.5 rounded-md bg-lavender/20 text-lavender">
                    Grammar
                  </span>
                  <span>+</span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-blue/15 text-sky-blue">
                    Reading
                  </span>
                  <span>+</span>
                  <span className="px-2 py-0.5 rounded-md bg-sakura/20 text-sakura">
                    Listening
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
