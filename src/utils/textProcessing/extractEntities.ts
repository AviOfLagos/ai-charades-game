/**
 * Extracts entities and concepts from a context string for charades.
 * This is a placeholder for future NLP logic.
 */

export type CharadeCategory = "person" | "relationship" | "event" | "trend" | "other";

export interface CharadeItem {
  text: string;
  category: CharadeCategory;
  difficulty: "easy" | "medium" | "hard";
}

export interface ExtractionResult {
  items: CharadeItem[];
}

export function extractEntities(context: string): ExtractionResult {
  // TODO: Replace with real NLP/entity extraction logic.
  // For now, split by lines and assign dummy categories/difficulty.
  const lines = context
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const items: CharadeItem[] = lines.map((line, idx) => ({
    text: line,
    category: ["person", "relationship", "event", "trend", "other"][idx % 5] as CharadeCategory,
    difficulty: ["easy", "medium", "hard"][idx % 3] as "easy" | "medium" | "hard"
  }));

  return { items };
}
