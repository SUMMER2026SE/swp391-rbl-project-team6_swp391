import { supabase } from "@/lib/api/supabase";

export interface HiraganaCharacter {
  id: string;
  character: string;
  romaji: string;
  pronunciation?: string;
  meaning?: string;
  exampleWord?: string;
  exampleMeaning?: string;
  audioUrl?: string | null;
  strokeOrder: number;
  category: string;
  subcategory?: string | null;
  is_basic: boolean;
  is_combination: boolean;
}

export interface KatakanaCharacter {
  id: string;
  character: string;
  romaji: string;
  pronunciation?: string;
  meaning?: string;
  exampleWord?: string;
  exampleMeaning?: string;
  audioUrl?: string | null;
  strokeOrder: number;
  category: string;
  subcategory?: string | null;
  is_basic: boolean;
  is_combination: boolean;
}

export async function fetchHiraganaBasic(): Promise<HiraganaCharacter[]> {
  const { data, error } = await supabase
    .from("hiragana_characters")
    .select("*")
    .eq("category", "basic")
    .order("stroke_order", { ascending: true });

  if (error) {
    console.error("Error fetching hiragana basic:", error);
    return [];
  }
  return data || [];
}

export async function fetchHiraganaDakuten(): Promise<HiraganaCharacter[]> {
  const { data, error } = await supabase
    .from("hiragana_characters")
    .select("*")
    .in("category", ["dakuten", "handakuten"])
    .order("stroke_order", { ascending: true });

  if (error) {
    console.error("Error fetching hiragana dakuten:", error);
    return [];
  }
  return data || [];
}

export async function fetchHiraganaCombination(): Promise<HiraganaCharacter[]> {
  const { data, error } = await supabase
    .from("hiragana_characters")
    .select("*")
    .eq("category", "combination")
    .order("stroke_order", { ascending: true });

  if (error) {
    console.error("Error fetching hiragana combination:", error);
    return [];
  }
  return data || [];
}

export async function fetchKatakanaBasic(): Promise<KatakanaCharacter[]> {
  const { data, error } = await supabase
    .from("katakana_characters")
    .select("*")
    .eq("category", "basic")
    .order("stroke_order", { ascending: true });

  if (error) {
    console.error("Error fetching katakana basic:", error);
    return [];
  }
  return data || [];
}

export async function fetchKatakanaDakuten(): Promise<KatakanaCharacter[]> {
  const { data, error } = await supabase
    .from("katakana_characters")
    .select("*")
    .in("category", ["dakuten", "handakuten"])
    .order("stroke_order", { ascending: true });

  if (error) {
    console.error("Error fetching katakana dakuten:", error);
    return [];
  }
  return data || [];
}

export async function fetchKatakanaCombination(): Promise<KatakanaCharacter[]> {
  const { data, error } = await supabase
    .from("katakana_characters")
    .select("*")
    .eq("category", "combination")
    .order("stroke_order", { ascending: true });

  if (error) {
    console.error("Error fetching katakana combination:", error);
    return [];
  }
  return data || [];
}
