import React from "react";
import { AiContentGenerate, type AiQuestionResponse } from "./AiContentGenerate";
import { homeworkApi } from "@/lib/api/homework";
import { teacherQuestionsApi } from "@/lib/api/teacherQuestions";
import type { BuilderQuestion } from "@/types/question";
import {
  mapBuilderQuestionToRequest,
} from "@/lib/teacherHomeworkMapping";

interface AiHomeworkGenerateProps {
  lockedClass?: { id: string; name: string; level: string } | null;
  onDone?: (title: string, homeworkId?: string) => void;
}

export const AiHomeworkGenerate: React.FC<AiHomeworkGenerateProps> = ({
  lockedClass,
  onDone,
}) => {
  return (
    <AiContentGenerate
      config={{
        title: "AI Generate Homework",
        subtitle:
          "Select a lesson and AI will generate homework questions from the content library.",
        generateApi: async (req) => {
          const res = await homeworkApi.generateAiHomework(req);
          return {
            title: res.title,
            description: res.description,
            questions: res.questions,
          } as unknown as AiQuestionResponse;
        },
        metadataFields: [
          {
            key: "dueDate",
            label: "Due Date",
            type: "datetime-local" as const,
          },
          {
            key: "maxScore",
            label: "Max Score",
            type: "number" as const,
            defaultValue: 100,
          },
          {
            key: "attempts",
            label: "Max Attempts",
            type: "number" as const,
            defaultValue: 1,
          },
        ],
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
            mapBuilderQuestionToRequest(q, level, "HOMEWORK")
          );

          const batchRes = await teacherQuestionsApi.createQuestionsBatch({
            questions: batchQuestions,
          });
          const savedQuestionIds = batchRes.savedQuestions.map((q) => q.id);

          const homeworkTitle =
            title || `AI Generated Homework - ${level} Lesson`;
          const rawDueDate = metadata.dueDate as string;
          const dueDate = rawDueDate
            ? new Date(rawDueDate).toISOString()
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          await homeworkApi.createHomework({
            classId,
            title: homeworkTitle,
            instructions: `Generated using AI from lesson content at ${level} level.`,
            dueDate,
            maxScore: (metadata.maxScore as number) || 100,
            attempts: (metadata.attempts as number) || 1,
            timeLimit: (metadata.duration as number) || 45,
            questionIds: savedQuestionIds,
          });

          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["teacherHomeworks"] }),
            queryClient.invalidateQueries({
              queryKey: ["teacherHomeworksByClass", classId],
            }),
            queryClient.invalidateQueries({ queryKey: ["teacherClassDetail", classId] }),
            queryClient.invalidateQueries({ queryKey: ["teacherClasses"] }),
          ]);

          if (onDone) {
            onDone(homeworkTitle);
          }
        },
      }}
      lockedClass={lockedClass}
    />
  );
};
