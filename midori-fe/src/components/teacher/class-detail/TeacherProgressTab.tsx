import { useMemo } from "react";
import { Card } from "@/components/page-ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  Users,
  Target,
} from "lucide-react";

export function TeacherProgressTab() {
  return (
    <div className="space-y-6">
      {/* Overall Class Progress */}
      <Card className="p-6">
        <h3 className="font-display font-black text-sm text-foreground dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Overall Learning Progress
        </h3>
        <EmptyState
          icon={TrendingUp}
          title="No progress data available"
          description="Overall class progress will appear here once students start completing lessons."
        />
      </Card>

      {/* Learning Progress Distribution */}
      <Card className="p-6">
        <h3 className="font-display font-black text-sm text-foreground dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Learning Progress Distribution
        </h3>
        <EmptyState
          icon={Users}
          title="No distribution data available"
          description="Student progress distribution will appear here once learning data is available."
        />
      </Card>

      {/* Recent Learning Activity */}
      <Card className="p-6">
        <h3 className="font-display font-black text-sm text-foreground dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Learning Activity
        </h3>
        <EmptyState
          icon={Clock}
          title="No recent activity"
          description="Recent learning activities will appear here as students make progress."
        />
      </Card>

      {/* Learning Milestones */}
      <Card className="p-6">
        <h3 className="font-display font-black text-sm text-foreground dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Learning Milestones
        </h3>
        <EmptyState
          icon={Target}
          title="No milestones yet"
          description="Class milestones will appear here as students reach learning goals."
        />
      </Card>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
      </div>
      <h4 className="font-semibold text-sm text-foreground dark:text-white mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

export function TeacherProgressTabSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-32 w-full" />
        </Card>
      ))}
    </div>
  );
}
