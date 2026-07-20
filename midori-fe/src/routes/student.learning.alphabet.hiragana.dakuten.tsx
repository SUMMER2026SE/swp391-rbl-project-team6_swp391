import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { fetchHiraganaDakuten } from "@/lib/api/alphaBetApi";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/student/learning/alphabet/hiragana/dakuten")({
  component: HiraganaDakutenPage,
});

function HiraganaDakutenPage() {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const characters = await fetchHiraganaDakuten();
        if (characters.length > 0) {
          setLesson({
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
              exampleWord: c.example_word || "",
              exampleMeaning: c.example_meaning || "",
              audioUrl: c.audio_url,
              strokeOrder: c.stroke_order,
            })),
            color: "from-purple-400 to-violet-500",
          });
        }
      } catch (error) {
        console.error("Failed to load hiragana dakuten:", error);
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

  return <AlphabetLessonPage lesson={lesson} progressKey="hiragana-dakuten" />;
}
