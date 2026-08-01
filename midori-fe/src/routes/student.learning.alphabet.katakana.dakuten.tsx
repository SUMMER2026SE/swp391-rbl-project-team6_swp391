import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { fetchKatakanaDakuten } from "@/lib/api/alphaBetApi";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const Route = createFileRoute("/student/learning/alphabet/katakana/dakuten")({
  component: KatakanaDakutenPage,
});

function KatakanaDakutenPage() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["katakana-characters", "dakuten"],
    queryFn: fetchKatakanaDakuten,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const lesson = useMemo(() => {
    if (!characters || characters.length === 0) return null;
    return {
      id: "katakana-dakuten",
      title: "Katakana Dakuten",
      subtitle: "Voiced Sounds",
      description: "Learn Katakana with dakuten (voiced sounds) marked with ガ, ギ, etc.",
      totalCharacters: characters.length,
      difficulty: 2,
      estimatedTime: 30,
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
      color: "from-indigo-400 to-blue-500",
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

  return <AlphabetLessonPage lesson={lesson} progressKey="katakana-dakuten" />;
}
