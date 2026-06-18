import React, { useState } from "react";
import { Card } from "@/components/page-ui";
import { Lock, FileText, ChevronRight, BookOpen, ArrowLeft } from "lucide-react";
import type { DetailedClassInfo, LevelMaterials } from "@/types/class-detail";

interface MaterialsSectionProps {
  classInfo: DetailedClassInfo;
}

export function MaterialsSection({ classInfo }: MaterialsSectionProps) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const classLevel = classInfo.level ?? "N5";

  const modules = [
    { id: "vocabulary", label: "Vocabulary", lessons: 15, completion: classInfo.progress.vocabulary, lastStudied: "Lesson 1: Greetings" },
    { id: "grammar", label: "Grammar", lessons: 10, completion: classInfo.progress.grammar, lastStudied: "Lesson 1: Wa & Ga" },
    { id: "listening", label: "Listening", lessons: 8, completion: classInfo.progress.listening, lastStudied: "None" },
    { id: "reading", label: "Reading", lessons: 6, completion: classInfo.progress.reading, lastStudied: "None" },
    { id: "shadowing", label: "Shadowing", lessons: 12, completion: classInfo.progress.shadowing, lastStudied: "None" },
    { id: "writing", label: "Writing", lessons: 5, completion: classInfo.progress.writing, lastStudied: "None" },
  ];

  const isLevelAllowed = (level: string) => {
    return level === classLevel;
  };

  if (selectedModule) {
    const moduleMaterials: LevelMaterials[] = (classInfo.materials as any)[selectedModule] || [];
    const moduleLabel = modules.find((m) => m.id === selectedModule)?.label || "";

    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
          <button
            onClick={() => setSelectedModule(null)}
            className="p-1.5 rounded-lg border border-slate-200/60 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="font-display font-black text-base text-foreground dark:text-white">
              {moduleLabel} Materials
            </h3>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Class Level: {classLevel}</span>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {moduleMaterials.map((levelMat) => {
            const allowed = isLevelAllowed(levelMat.level);

            return (
              <div key={levelMat.level} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Level {levelMat.level}
                  </span>
                  {!allowed && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {allowed ? (
                    levelMat.lessons.map((lesson) => (
                      <div
                        key={lesson.lessonId}
                        className="p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/10 dark:bg-white/[0.002] space-y-2"
                      >
                        <h4 className="font-bold text-xs text-foreground dark:text-white flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          {lesson.title}
                        </h4>
                        <div className="space-y-1.5">
                          {lesson.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-2.5 rounded-xl border border-slate-200/40 dark:border-white/[0.03] bg-white/70 dark:bg-[#0f1430]/75 hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center justify-between cursor-pointer"
                            >
                              <span className="text-xs font-semibold text-foreground dark:text-slate-200 flex items-center gap-1.5 truncate mr-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                {item.title}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="sm:col-span-2 p-6 border border-red-500/20 rounded-2xl bg-red-500/[0.01] flex flex-col items-center justify-center text-center gap-2">
                      <Lock className="w-6 h-6 text-red-500" />
                      <div>
                        <h4 className="font-bold text-xs text-foreground dark:text-white">Access Blocked</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 text-center">
                          You only have access to Level {classLevel} materials.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {moduleMaterials.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No materials uploaded for this module.
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
        <BookOpen className="w-4.5 h-4.5 text-primary" />
        Learning Materials
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {modules.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelectedModule(m.id)}
            className="p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002] hover:border-primary/40 dark:hover:border-cyan-400/30 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between min-h-[120px]"
          >
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground dark:text-white leading-tight">
                {m.label}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-1">
                {m.lessons} Lessons · {m.completion}% done
              </p>
            </div>
            <div className="text-[9px] text-muted-foreground truncate border-t border-slate-100 dark:border-white/5 pt-2 mt-2">
              Last studied: <span className="font-semibold text-foreground dark:text-slate-200">{m.lastStudied}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
