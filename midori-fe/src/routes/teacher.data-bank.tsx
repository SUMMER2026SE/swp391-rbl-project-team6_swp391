import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/data-bank")({
  head: () => ({ meta: [{ title: "Redirecting... — MIDORI Teacher" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/teacher/question-bank" });
  },
  component: function DataBankRedirect() {
    return null;
  },
});
