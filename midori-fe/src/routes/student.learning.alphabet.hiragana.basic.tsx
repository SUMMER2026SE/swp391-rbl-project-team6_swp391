import { createFileRoute } from "@tanstack/react-router";
import { AlphabetLessonPage } from "@/components/student/alphabet/AlphabetLessonPage";
import { fetchHiraganaBasic } from "@/lib/api/alphaBetApi";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/student/learning/alphabet/hiragana/basic")({
  component: HiraganaBasicPage,
});

function HiraganaBasicPage() {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const characters = await fetchHiraganaBasic();
        if (characters.length > 0) {
          setLesson({
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
              exampleWord: c.example_word || "",
              exampleMeaning: c.example_meaning || "",
              audioUrl: c.audio_url,
              strokeOrder: c.stroke_order,
            })),
            color: "from-pink-400 to-rose-500",
          });
        }
      } catch (error) {
        console.error("Failed to load hiragana basic:", error);
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

  return <AlphabetLessonPage lesson={lesson} progressKey="hiragana-basic" />;
}
