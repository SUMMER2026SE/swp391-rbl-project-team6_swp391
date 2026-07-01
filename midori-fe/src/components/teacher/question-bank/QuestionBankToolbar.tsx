import { Search, ArrowUpDown } from "lucide-react";
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
  difficulty: string;
  onDifficultyChange: (val: string) => void;
  sort: string;
  onSortChange: (val: string) => void;
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
  difficulty,
  onDifficultyChange,
  sort,
  onSortChange,
  availableLessons,
}: QuestionBankToolbarProps) {
  return (
    <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search topics by name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-full h-10 border-border/60"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[140px] h-10 border-border/60">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Newest">Newest</SelectItem>
              <SelectItem value="Oldest">Oldest</SelectItem>
              <SelectItem value="Alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
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
              <SelectItem value="Kanji">Kanji</SelectItem>
              <SelectItem value="Reading">Reading</SelectItem>
              <SelectItem value="Listening">Listening</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Difficulty
          </label>
          <Select value={difficulty} onValueChange={onDifficultyChange}>
            <SelectTrigger className="w-full h-9 border-border/60">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Difficulties</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
