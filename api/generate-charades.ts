import type { Request, Response } from 'express';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL ? `models/${process.env.GEMINI_MODEL}` : "models/gemini-1.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface CharadeAIItem {
  text: string;
  difficulty: "easy" | "medium" | "hard";
}

/**
 * Returns the prompt for Gemini to generate charade game items.
 * Accepts number of cards and difficulty as parameters.
 */
function getCharadePrompt(context: string, numCards: number, difficulty: "easy" | "medium" | "hard", customPrompt?: string) {
  return `
You are an AI assistant for a charades game. Given the following context, generate a list of ${numCards} charade game ideas (phrases, names, or concepts) that are relevant, fun, and challenging for players. All items must be suitable for the "${difficulty}" difficulty level. Only return a JSON array of objects with "text" and "difficulty" fields. Do NOT include any Markdown or code block formatting, just the raw JSON array.

Context:
${context}

${customPrompt ? "Instructions: " + customPrompt : ""}
`;
}

// Utility to strip Markdown code block wrappers from Gemini output
function stripCodeBlock(text: string): string {
  return text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1").trim();
}

export default async function handler(req: Request, res: Response) {
if (req.method !== "POST") {
  return res.status(405).json({ error: "Method not allowed" });
}

  const { context, customPrompt, numCards, difficulty } = req.body || {};
  if (!context || typeof context !== "string") {
    res.status(400).json({ error: "Missing or invalid context" });
    return;
  }
  
  console.log("Handler invoked with environment variables:", {
    NODE_ENV: process.env.NODE_ENV,
    DUMMY_GEMINI: process.env.DUMMY_GEMINI
  });
  
  const n = typeof numCards === "number" && numCards > 0 ? numCards : 20;
  const diff: "easy" | "medium" | "hard" = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";

  try {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development" || process.env.DUMMY_GEMINI === "true") {
      const dummyItems = [
        { text: "Dummy charade 1", difficulty: "medium" },
        { text: "Dummy charade 2", difficulty: "medium" }
      ];
      return res.status(200).json({ items: dummyItems, debug: { text: "dummy", geminiData: {} } });
    }
    // Call Gemini API
    const prompt = getCharadePrompt(context, n, diff, customPrompt);
    console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
    console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL);
    console.log("Calling Gemini API with URL:", GEMINI_API_URL);
    console.log("Prompt sent to Gemini:", prompt);
    const geminiRes = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    console.log("Received Gemini response with status:", geminiRes.status);
    if (!geminiRes.ok) {
      const errResponse = await geminiRes.text();
      console.error("Gemini API call failed with status:", geminiRes.status, "Response:", errResponse);
      throw new Error(`Gemini API error: ${geminiRes.status}: ${errResponse}`);
    }
    const geminiData = await geminiRes.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };

    // Parse Gemini response (strip code block, then parse JSON)
    let items: CharadeAIItem[] = [];
    let text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Debug logging for local development
    console.log("Gemini API raw response:", JSON.stringify(geminiData, null, 2));
    console.log("Extracted text for JSON parse:", text);

    // If Gemini returns a prompt for more context, treat as error
    if (
      typeof text === "string" &&
      text.toLowerCase().includes("please provide me with the context")
    ) {
      return res.status(400).json({
        error: "Gemini API requires more context. Please provide a valid context string."
      });
    }

    text = stripCodeBlock(text);

    try {
      items = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse Gemini output as JSON:", err);
      items = [];
    }

    res.status(200).json({ items, debug: { text, geminiData } });
  } catch (err) {
    console.error(err);
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development" || process.env.DUMMY_GEMINI === "true") {
      const fallbackDummyItems = [
        { text: "Fallback dummy charade 1", difficulty: "medium" },
        { text: "Fallback dummy charade 2", difficulty: "medium" }
      ];
      return res.status(200).json({ items: fallbackDummyItems, debug: { error: (err as Error).message } });
    }
    res.status(500).json({ error: "Failed to generate charade items", details: (err as Error).message });
  }
}
