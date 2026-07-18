import {
  BookOpen,
  GraduationCap,
  Headphones,
  BookText,
  type LucideIcon,
} from "lucide-react";

export type SkillType = "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
export type SkillStatus = "AVAILABLE" | "COMING_SOON";

export interface SkillMeta {
  type: SkillType;
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for the colored accent badge */
  accentBg: string;
  accentIcon: string;
  accentText: string;
  /** Subtle hover background */
  hoverBg: string;
}

export const SKILL_ORDER: SkillType[] = [
  "VOCABULARY",
  "GRAMMAR",
  "READING",
  "LISTENING",
];

export const SKILL_META: Record<SkillType, SkillMeta> = {
  VOCABULARY: {
    type: "VOCABULARY",
    label: "Vocabulary",
    icon: BookOpen,
    accentBg: "bg-primary/10",
    accentIcon: "text-primary",
    accentText: "text-primary",
    hoverBg: "hover:bg-primary/5",
  },
  GRAMMAR: {
    type: "GRAMMAR",
    label: "Grammar",
    icon: GraduationCap,
    accentBg: "bg-lavender/20",
    accentIcon: "text-lavender",
    accentText: "text-lavender",
    hoverBg: "hover:bg-lavender/10",
  },
  READING: {
    type: "READING",
    label: "Reading",
    icon: BookText,
    accentBg: "bg-sky-blue/15",
    accentIcon: "text-sky-blue",
    accentText: "text-sky-blue",
    hoverBg: "hover:bg-sky-blue/10",
  },
  LISTENING: {
    type: "LISTENING",
    label: "Listening",
    icon: Headphones,
    accentBg: "bg-sakura/20",
    accentIcon: "text-sakura",
    accentText: "text-sakura",
    hoverBg: "hover:bg-sakura/10",
  },
};