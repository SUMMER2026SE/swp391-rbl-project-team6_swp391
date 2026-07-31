import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { fetchHiraganaCombination } from "@/lib/api/alphaBetApi";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const Route = createFileRoute("/student/learning/alphabet/hiragana/combination")({
  component: HiraganaCombinationPage,
});

function HiraganaCombinationPage() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["hiragana-characters", "combination"],
    queryFn: fetchHiraganaCombination,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const lesson = useMemo(() => {
    if (!characters || characters.length === 0) return null;
    return {
      id: "hiragana-combination",
      title: "Hiragana Combinations",
      subtitle: "Small Character Sounds",
      description: "Learn Hiragana combination sounds with small characters (きゃ, しゅ, etc.)",
      totalCharacters: characters.length,
      difficulty: 3,
      estimatedTime: 40,
      characters: characters.map((c) => ({
        id: c.id,
        character: c.character,
        romaji: c.romaji,
        pronunciation: `/${c.romaji}/`,
        meaning: c.meaning || "",
        exampleWord: c.exampleWord || "",
        exampleMeaning: c.exampleMeaning || "",
        audioUrl: c.audioUrl,
        strokeOrder: c.strokeOrder,
      })),
      color: "from-emerald-400 to-teal-500",
    } as any;
  }, [characters]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Failed to load lesson</div>
      </div>
    );
  }

  return <AlphabetLessonPage lesson={lesson} progressKey="hiragana-combination" />;
}
