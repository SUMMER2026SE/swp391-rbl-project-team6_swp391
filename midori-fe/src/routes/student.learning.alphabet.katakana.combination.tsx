import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { fetchKatakanaCombination } from "@/lib/api/alphaBetApi";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/student/learning/alphabet/katakana/combination")({
  component: KatakanaCombinationPage,
});

function KatakanaCombinationPage() {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const characters = await fetchKatakanaCombination();
        if (characters.length > 0) {
          setLesson({
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
              exampleWord: c.example_word || "",
              exampleMeaning: c.example_meaning || "",
              audioUrl: c.audio_url,
              strokeOrder: c.stroke_order,
            })),
            color: "from-cyan-400 to-sky-500",
          });
        }
      } catch (error) {
        console.error("Failed to load katakana combination:", error);
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

  return <AlphabetLessonPage lesson={lesson} progressKey="katakana-combination" />;
}
