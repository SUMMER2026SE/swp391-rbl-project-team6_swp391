// ─── Shared Flashcard Store ──────────────────────────────────────────────────────
// Module-level state for sharing flashcards between pages

import { Flashcard } from "../types/content-library";
import { mockFlashcards } from "../mock/flashcards";

// Shared flashcard state
let sharedFlashcards: Flashcard[] = [...mockFlashcards];
type FlashcardListener = (flashcards: Flashcard[]) => void;
const listeners: Set<FlashcardListener> = new Set();

export function getFlashcards(): Flashcard[] {
  return [...sharedFlashcards];
}

export function addFlashcard(flashcard: Flashcard): void {
  sharedFlashcards = [flashcard, ...sharedFlashcards];
  notifyListeners();
}

export function addFlashcards(newFlashcards: Flashcard[]): void {
  sharedFlashcards = [...newFlashcards, ...sharedFlashcards];
  notifyListeners();
}

export function updateFlashcard(id: string, updates: Partial<Flashcard>): void {
  sharedFlashcards = sharedFlashcards.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  notifyListeners();
}

export function deleteFlashcard(id: string): void {
  sharedFlashcards = sharedFlashcards.filter((item) => item.id !== id);
  notifyListeners();
}

export function subscribeFlashcards(listener: FlashcardListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener([...sharedFlashcards]));
}
