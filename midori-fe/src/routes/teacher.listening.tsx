import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/listening")({
  component: TeacherListeningPlaceholder,
});

function TeacherListeningPlaceholder() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-xl font-semibold text-primary-col">Teacher Listening</h1>
        <p className="text-sm text-muted-col">Teacher module is not used in this project.</p>
      </div>
    </div>
  );
}
