import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuestionBankToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  level: string;
  onLevelChange: (val: string) => void;
  lesson: string;
  onLessonChange: (val: string) => void;
  skill: string;
  onSkillChange: (val: string) => void;
  availableLessons: string[];
}

export function QuestionBankToolbar({
  search,
  onSearchChange,
  level,
  onLevelChange,
  lesson,
  onLessonChange,
  skill,
  onSkillChange,
  availableLessons,
}: QuestionBankToolbarProps) {
  return (
    <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search topics by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-full h-10 border-border/60"
        />
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            JLPT Level
          </label>
          <Select value={level} onValueChange={onLevelChange}>
            <SelectTrigger className="w-full h-9 border-border/60">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Levels</SelectItem>
              <SelectItem value="N5">N5</SelectItem>
              <SelectItem value="N4">N4</SelectItem>
              <SelectItem value="N3">N3</SelectItem>
              <SelectItem value="N2">N2</SelectItem>
              <SelectItem value="N1">N1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Lesson
          </label>
          <Select value={lesson} onValueChange={onLessonChange}>
            <SelectTrigger className="w-full h-9 border-border/60">
              <SelectValue placeholder="All Lessons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Lessons</SelectItem>
              {availableLessons.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Skill
          </label>
          <Select value={skill} onValueChange={onSkillChange}>
            <SelectTrigger className="w-full h-9 border-border/60">
              <SelectValue placeholder="All Skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Skills</SelectItem>
              <SelectItem value="Vocabulary">Vocabulary</SelectItem>
              <SelectItem value="Grammar">Grammar</SelectItem>
              <SelectItem value="Reading">Reading</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
