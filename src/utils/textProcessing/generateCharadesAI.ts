/**
 * Calls the Vercel serverless function to generate charade game items using Gemini AI.
 */

export interface CharadeAIItem {
  text: string;
  difficulty: "easy" | "medium" | "hard";
}

export async function generateCharadesAI(
  context: string,
  customPrompt?: string,
  numCards?: number,
  difficulty?: "easy" | "medium" | "hard"
): Promise<CharadeAIItem[]> {
  const res = await fetch("/api/generate-charades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context, customPrompt, numCards, difficulty })
  });

  if (!res.ok) {
    throw new Error("Failed to generate charade items");
  }

  const data = await res.json();
  return data.items as CharadeAIItem[];
}
