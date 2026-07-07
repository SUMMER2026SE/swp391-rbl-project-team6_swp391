import { createFileRoute } from "@tanstack/react-router";
import { AISenseiPage } from "@/components/ai-sensei-chat";

export const Route = createFileRoute("/student/ai-sensei")({
  component: AISenseiPage,
});
