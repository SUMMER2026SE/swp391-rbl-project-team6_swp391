import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { fetchHiraganaDakuten } from "@/lib/api/alphaBetApi";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const Route = createFileRoute("/student/learning/alphabet/hiragana/dakuten")({
  component: HiraganaDakutenPage,
});

function HiraganaDakutenPage() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["hiragana-characters", "dakuten"],
    queryFn: fetchHiraganaDakuten,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const lesson = useMemo(() => {
    if (!characters || characters.length === 0) return null;
    return {
      id: "hiragana-dakuten",
      title: "Hiragana Dakuten",
      subtitle: "Voiced Sounds",
      description: "Learn Hiragana with dakuten (voiced sounds) marked with ゛",
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
      color: "from-purple-400 to-violet-500",
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

  return <AlphabetLessonPage lesson={lesson} progressKey="hiragana-dakuten" />;
}
