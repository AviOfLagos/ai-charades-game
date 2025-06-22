/**
 * Returns the prompt for Gemini to generate charade game items.
 * Accepts number of cards and difficulty as parameters.
 */
export function getCharadePrompt(context: string, numCards: number, difficulty: "easy" | "medium" | "hard", customPrompt?: string) {
  return `
You are an AI assistant for a charades game. Given the following context, generate a list of ${numCards} charade game ideas (phrases, names, or concepts) that are relevant, fun, and challenging for players. All items must be suitable for the "${difficulty}" difficulty level. Only return a JSON array of objects with "text" and "difficulty" fields. Do NOT include any Markdown or code block formatting, just the raw JSON array.

Context:
${context}

${customPrompt ? "Instructions: " + customPrompt : ""}
`;
}
