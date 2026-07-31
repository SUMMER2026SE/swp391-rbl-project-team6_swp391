import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { classesApi } from "@/lib/api/classes";
import { useQuery } from "@tanstack/react-query";
import { StudentLandingPage } from "@/components/student-landing";
import { useState } from "react";

export const Route = createFileRoute("/student/landing")({
  component: StudentLandingRoute,
});

function StudentLandingRoute() {
  const { refreshCurrentUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: dbClasses = [],
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ["studentJoinedClassesDashboard"],
    queryFn: () => classesApi.getJoinedClasses(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshCurrentUser(), refetchClasses()]);
    } catch (err) {
      console.error("Failed to refresh status:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="pt-2">
      <StudentLandingPage onRefresh={handleRefresh} isRefreshing={isRefreshing} />
    </div>
  );
}
