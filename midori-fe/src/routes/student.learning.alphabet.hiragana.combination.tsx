import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { fetchHiraganaCombination } from "@/lib/api/alphaBetApi";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/student/learning/alphabet/hiragana/combination")({
  component: HiraganaCombinationPage,
});

function HiraganaCombinationPage() {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const characters = await fetchHiraganaCombination();
        if (characters.length > 0) {
          setLesson({
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
              exampleWord: c.example_word || "",
              exampleMeaning: c.example_meaning || "",
              audioUrl: c.audio_url,
              strokeOrder: c.stroke_order,
            })),
            color: "from-emerald-400 to-teal-500",
          });
        }
      } catch (error) {
        console.error("Failed to load hiragana combination:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
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
