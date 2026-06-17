// ─── Shared Vocabulary Store ─────────────────────────────────────────────────────
// Module-level state for sharing vocabulary between pages

import type { VocabularyItem } from "../types/content-library";

// Shared vocabulary state (will be populated from API)
let sharedVocabulary: VocabularyItem[] = [];
type VocabularyListener = (vocab: VocabularyItem[]) => void;
const listeners: Set<VocabularyListener> = new Set();

export function getVocabulary(): VocabularyItem[] {
  return [...sharedVocabulary];
}

export function setVocabulary(vocab: VocabularyItem[]): void {
  sharedVocabulary = vocab;
  notifyListeners();
}

export function addVocabularyItem(item: VocabularyItem): void {
  sharedVocabulary = [item, ...sharedVocabulary];
  notifyListeners();
}

export function updateVocabularyItem(id: string, updates: Partial<VocabularyItem>): void {
  sharedVocabulary = sharedVocabulary.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  notifyListeners();
}

export function deleteVocabularyItem(id: string): void {
  sharedVocabulary = sharedVocabulary.filter((item) => item.id !== id);
  notifyListeners();
}

export function subscribeVocabulary(listener: VocabularyListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener([...sharedVocabulary]));
}
