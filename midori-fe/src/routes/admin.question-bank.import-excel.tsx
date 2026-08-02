import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useAdminQuestionBankLessons } from "../services/questionBankService";
import { QuestionBankStickyHeader } from "../components/question-bank-sticky-header";
import { AiPdfImportWorkflow } from "../components/admin/AiPdfImportWorkflow";
import { ImportedQuestion } from "../components/admin/pdf-import/QuestionEditor";
import {
  parseReadingQuestionText,
  composeReadingQuestionText,
  shouldSplitReadingForQuestion,
} from "../components/admin/pdf-import/readingQuestionParser";

export const Route = createFileRoute("/admin/question-bank/import-excel")({
  component: ImportExcelPage,
});

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

function ImportExcelPage() {
  const search = useSearch({ from: "/admin/question-bank/import-excel" }) as {
    level?: string;
    lessonId?: string;
  };
  const navigate = useNavigate();

  const level = (search.level?.toUpperCase() || "N5") as JLPTLevel;
  const lessonId = parseInt(search.lessonId || "1");

  const { createQuestionsBatch, lessons } = useAdminQuestionBankLessons(level);
  const lesson = lessons.find((l) => l.id === lessonId);
  const lessonName = lesson?.lessonName || `Lesson ${lessonId}`;

  const handleCreateQuestions = async (importedQuestions: ImportedQuestion[]) => {
    const questionsData = importedQuestions.map((q) => {
      const correctIndex = q.answers.findIndex((ans) => ans.isCorrect);
      const options = q.answers.map((ans) => ans.content);

      // Reading questions are edited with separate passage / question text
      // boxes. Recompose them into the canonical "Read the passage: ...
      // Question: ..." shape right before saving so the DB still stores a
      // single `prompt` string (no schema change).
      let questionText = q.content;
      if (shouldSplitReadingForQuestion(q.category)) {
        const parsed = parseReadingQuestionText(q.content);
        if (parsed.split) {
          questionText = composeReadingQuestionText(
            parsed.passage,
            parsed.question,
            parsed.labelKey ?? "en-read",
          );
        }
      }

      return {
        type: q.type || "MULTIPLE_CHOICE",
        skill: (q.category || "Vocabulary").toUpperCase(),
        difficulty: q.difficulty || "MEDIUM",
        questionText,
        options,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        explanation: q.explanation || "",
        translationMetadata: q.translationMetadata,
        sentenceWritingMetadata: q.sentenceWritingMetadata,
        errorCorrectionMetadata: q.errorCorrectionMetadata,
        matchingMetadata: q.matchingMetadata,
      };
    });

    await createQuestionsBatch(lessonId, questionsData);

    navigate({
      to: "/admin/question-bank/lesson-detail",
      search: { level: level.toLowerCase(), lessonId: String(lessonId) },
    });
  };

  return (
    <div className="space-y-6">
      <QuestionBankStickyHeader
        backHref={`/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`}
        backLabel="Back"
        level={level}
        lessonId={lessonId}
        breadcrumbs={[
          { label: "Question Bank", href: "/admin/question-bank" },
          { label: level, href: `/admin/question-bank/${level.toLowerCase()}` },
          {
            label: lessonName,
            href: `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`,
          },
          { label: "Import PDF" },
        ]}
        title="Import Questions with AI"
        subtitle="Upload a question, test, or lesson PDF to create reusable Question Bank items using AI"
        stats={
          <div className="card-base p-4 border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-primary-col">{lessonName}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-primary/12 text-primary text-xs font-semibold">
                    {level}
                  </span>
                </div>
                <p className="text-sm text-muted-col">Lesson {lessonId}</p>
              </div>
            </div>
          </div>
        }
      />

      <div className="card-base p-6 border border-[var(--border)]">
        <AiPdfImportWorkflow
          onCreate={handleCreateQuestions}
          title="Import Questions with AI"
          subtitle="Upload any PDF exam sheet to extract questions"
          backHref={`/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`}
          backLabel="Back to Lesson Detail"
          enabled={true}
        />
      </div>
    </div>
  );
}
