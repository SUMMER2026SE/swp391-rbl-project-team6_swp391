import { createFileRoute, Outlet } from "@tanstack/react-router";
import { JourneyMap } from "@/components/student/journey";
import {
  JOURNEY_LESSONS,
  JOURNEY_PROGRESS,
} from "@/mock/student-learning-journey";
import { useLocation } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";

export const Route = createFileRoute("/student/journey")({
  component: JourneyLayout,
});

function JourneyLayout() {
  const location = useLocation();
  const isIndex = location.pathname === "/student/journey" || location.pathname === "/student/journey/";

  if (isIndex) {
    const progress = JOURNEY_PROGRESS;
    const lessons = JOURNEY_LESSONS;
    return (
      <div className="space-y-6">
        <PageHeader
          title="Learning Journey"
          subtitle="Track your progress through Japanese language lessons"
        />
        <JourneyMap lessons={lessons} progress={progress} />
      </div>
    );
  }

  return <Outlet />;
}
