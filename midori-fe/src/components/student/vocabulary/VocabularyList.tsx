"use client";

import { memo } from "react";
import { VocabularyCard, type VocabularyWord } from "./VocabularyCard";

interface VocabularyListProps {
  words: VocabularyWord[];
  favoriteIds: string[];
  onToggleFavorite: (wordId: string) => void;
  onSpeak: (text: string) => void;
  isLoadingFavorites?: boolean;
  isToggling?: boolean;
}

function VocabularyListComponent({
  words,
  favoriteIds,
  onToggleFavorite,
  onSpeak,
  isLoadingFavorites = false,
  isToggling = false,
}: VocabularyListProps) {
  if (words.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No vocabulary words available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {words.map((word) => (
        <VocabularyCard
          key={word.id}
          word={word}
          isFavorite={favoriteIds.includes(word.id)}
          onToggleFavorite={onToggleFavorite}
          onSpeak={onSpeak}
          isLoading={isLoadingFavorites}
          isToggling={isToggling && favoriteIds.includes(word.id)}
        />
      ))}
    </div>
  );
}

export const VocabularyList = memo(VocabularyListComponent);
