export interface ShadowingEvaluationResponse {
  overall: number;
  accuracy: number;
  similarity: number;
  missingWords: string[];
  extraWords: string[];
  wrongWords: string[];
  needAI: boolean;
  feedback: string[];
  validationError?: string;
  transcript?: string;
}

export const evaluateShadowingSentence = async (videoId: string, sentenceOrder: number, audioFile: File): Promise<ShadowingEvaluationResponse> => {
  const formData = new FormData();
  formData.append("audioFile", audioFile);
  formData.append("videoId", videoId);
  formData.append("sentenceOrder", String(sentenceOrder));

  const response = await fetch("/api/student/shadowing/evaluation", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Evaluation failed" }));
    throw new Error(error.message ?? `Evaluation failed: ${response.status}`);
  }

  const json = await response.json();
  return (json.data ?? {}) as ShadowingEvaluationResponse;
};
