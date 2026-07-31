import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { fetchKatakanaCombination } from "@/lib/api/alphaBetApi";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const Route = createFileRoute("/student/learning/alphabet/katakana/combination")({
  component: KatakanaCombinationPage,
});

function KatakanaCombinationPage() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["katakana-characters", "combination"],
    queryFn: fetchKatakanaCombination,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const lesson = useMemo(() => {
    if (!characters || characters.length === 0) return null;
    return {
      id: "katakana-combination",
      title: "Katakana Combinations",
      subtitle: "Small Character Sounds",
      description: "Learn Katakana combination sounds with small characters (キャ, シュ, etc.)",
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
      color: "from-cyan-400 to-sky-500",
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

  return <AlphabetLessonPage lesson={lesson} progressKey="katakana-combination" />;
}
