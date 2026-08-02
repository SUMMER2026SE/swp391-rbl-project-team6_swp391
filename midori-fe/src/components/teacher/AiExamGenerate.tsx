import React from "react";
import { AiContentGenerate, type AiQuestionResponse } from "./AiContentGenerate";
import { examsApi } from "@/lib/api/exams";
import { teacherQuestionsApi } from "@/lib/api/teacherQuestions";
import type { BuilderQuestion } from "@/types/question";
import {
  mapBuilderQuestionToRequest,
} from "@/lib/teacherHomeworkMapping";

interface AiExamGenerateProps {
  lockedClass?: { id: string; name: string; level: string } | null;
  onDone?: (title: string, examId?: string) => void;
}

export const AiExamGenerate: React.FC<AiExamGenerateProps> = ({
  lockedClass,
  onDone,
}) => {
  return (
    <AiContentGenerate
      config={{
        title: "AI Generate Exam",
        subtitle:
          "Select a lesson and AI will generate questions from the content library.",
        generateApi: async (req) => {
          const res = await examsApi.generateAiExam(req);
          return res as unknown as AiQuestionResponse;
        },
        onDone,
        onSave: async ({
          questions,
          classId,
          title,
          level,
          shouldPublish,
          metadata,
          queryClient,
        }) => {
          const batchQuestions = questions.map((q: BuilderQuestion) =>
            mapBuilderQuestionToRequest(q, level, "EXAM")
          );

          const res = await teacherQuestionsApi.createQuestionsBatch({
            questions: batchQuestions,
          });
          const savedQuestionIds = res.savedQuestions.map((q) => q.id);

          const examTitle = title || `AI Generated Exam - ${level} Lesson`;
          const savedExam = await examsApi.createExam({
            title: examTitle,
            level,
            totalQuestions: questions.length,
            timeLimit: (metadata.duration as number) || 60,
            classIds: classId ? [classId] : [],
            questionIds: savedQuestionIds,
            status: shouldPublish ? "PUBLISHED" : "DRAFT",
          });

          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["exams"] }),
            queryClient.invalidateQueries({ queryKey: ["teacherExams"] }),
            ...(classId
              ? [
                  queryClient.invalidateQueries({ queryKey: ["examsByClass", classId] }),
                  queryClient.invalidateQueries({ queryKey: ["classExams", classId] }),
                ]
              : []),
          ]);

          if (onDone) {
            onDone(examTitle, savedExam.id);
          }
        },
      }}
      lockedClass={lockedClass}
    />
  );
};
