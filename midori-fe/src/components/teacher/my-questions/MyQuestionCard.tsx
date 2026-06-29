import { format } from "date-fns";
import {
  Eye,
  Edit2,
  Copy,
  Archive,
  Trash2,
  MoreVertical,
  Calendar,
  Clock,
  Layers,
  Activity,
  ArchiveRestore,
} from "lucide-react";
import type { MockQuestion } from "@/data/mockQuestions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LevelBadge, DifficultyBadge, StatusBadge } from "../badges";

interface MyQuestionCardProps {
  question: MockQuestion;
  viewMode: "grid" | "list";
  onView: (q: MockQuestion) => void;
  onEdit: (q: MockQuestion) => void;
  onDuplicate: (q: MockQuestion) => void;
  onArchiveToggle: (q: MockQuestion) => void;
  onDelete: (q: MockQuestion) => void;
}

export function MyQuestionCard({
  question,
  viewMode,
  onView,
  onEdit,
  onDuplicate,
  onArchiveToggle,
  onDelete,
}: MyQuestionCardProps) {
  const formattedCreatedAt = question.createdAt
    ? format(new Date(question.createdAt), "MMM d, yyyy")
    : "N/A";
  const formattedUpdatedAt = question.updatedAt
    ? format(new Date(question.updatedAt), "MMM d, yyyy HH:mm")
    : "N/A";

  const isArchived = question.status === "Archived";

  const actionMenuItems = (
    <>
      <DropdownMenuItem onClick={() => onView(question)} className="cursor-pointer">
        <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(question)} className="cursor-pointer">
        <Edit2 className="mr-2 h-4 w-4 text-muted-foreground" />
        Edit Question
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onDuplicate(question)} className="cursor-pointer">
        <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onArchiveToggle(question)} className="cursor-pointer">
        {isArchived ? (
          <>
            <ArchiveRestore className="mr-2 h-4 w-4 text-muted-foreground" />
            Unarchive
          </>
        ) : (
          <>
            <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
            Archive
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => onDelete(question)}
        className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </>
  );

  if (viewMode === "list") {
    return (
      <Card className="border-border/60 hover:border-primary/40 hover:shadow-sm transition-all duration-200">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <LevelBadge level={question.level} />
              <DifficultyBadge d={question.difficulty} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                {question.skill}
              </span>
              <span className="text-xs text-muted-foreground bg-accent/30 px-2 py-0.5 rounded">
                {question.type}
              </span>
              <StatusBadge status={question.status} />
            </div>

            <h3 className="font-semibold text-base text-foreground truncate hover:text-primary cursor-pointer mb-1" onClick={() => onView(question)}>
              {question.title}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-1 mb-2 font-jp">
              {question.content}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Created: {formattedCreatedAt}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Edited: {formattedUpdatedAt}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                Used: {question.usageCount} times
              </span>
            </div>

            {question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button variant="outline" size="sm" onClick={() => onView(question)} className="h-8">
              <Eye className="h-4 w-4 mr-1.5" /> View
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(question)} className="h-8">
              <Edit2 className="h-4 w-4 mr-1.5" /> Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {actionMenuItems}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view mode
  return (
    <Card className="flex flex-col h-full border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <LevelBadge level={question.level} />
            <DifficultyBadge d={question.difficulty} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {actionMenuItems}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-2">
            {question.skill}
          </span>
          <span className="text-[10px] text-muted-foreground bg-accent/30 px-1.5 py-0.5 rounded">
            {question.type}
          </span>
        </div>

        <h3
          onClick={() => onView(question)}
          className="font-display font-semibold text-base leading-snug mb-2 hover:text-primary cursor-pointer line-clamp-1"
        >
          {question.title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-jp flex-1">
          {question.content}
        </p>

        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {question.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="border-t pt-3 mt-auto space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created
            </span>
            <span>{formattedCreatedAt}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Edited
            </span>
            <span>{formattedUpdatedAt}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Status
            </span>
            <StatusBadge status={question.status} />
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Usage Count
            </span>
            <span className="font-semibold">{question.usageCount} times</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
