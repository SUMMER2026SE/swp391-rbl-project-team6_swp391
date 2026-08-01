import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { fetchHiraganaBasic } from "@/lib/api/alphaBetApi";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const Route = createFileRoute("/student/learning/alphabet/hiragana/basic")({
  component: HiraganaBasicPage,
});

function HiraganaBasicPage() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["hiragana-characters", "basic"],
    queryFn: fetchHiraganaBasic,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const lesson = useMemo(() => {
    if (!characters || characters.length === 0) return null;
    return {
      id: "hiragana-basic",
      title: "Hiragana Basic",
      subtitle: "46 Basic Characters",
      description: "Master the fundamental Hiragana syllabary - the foundation of Japanese writing.",
      totalCharacters: characters.length,
      difficulty: 1,
      estimatedTime: 45,
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
      color: "from-pink-400 to-rose-500",
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

  return <AlphabetLessonPage lesson={lesson} progressKey="hiragana-basic" />;
}
