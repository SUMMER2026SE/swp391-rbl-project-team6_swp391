import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption =
  | "Newest"
  | "Oldest"
  | "Recently Edited"
  | "Most Used"
  | "Alphabetical";

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={value} onValueChange={(val) => onChange(val as SortOption)}>
        <SelectTrigger className="w-[180px] h-10 border-border/60">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Newest">Newest</SelectItem>
          <SelectItem value="Oldest">Oldest</SelectItem>
          <SelectItem value="Recently Edited">Recently Edited</SelectItem>
          <SelectItem value="Most Used">Most Used</SelectItem>
          <SelectItem value="Alphabetical">Alphabetical</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
