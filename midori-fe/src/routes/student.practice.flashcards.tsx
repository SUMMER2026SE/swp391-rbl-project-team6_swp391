import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student/practice/flashcards")({
  beforeLoad: () => {
    throw redirect({ to: "/student/flashcards" });
  },
});
