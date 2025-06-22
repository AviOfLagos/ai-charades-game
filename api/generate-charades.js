const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL ? `models/${process.env.GEMINI_MODEL}` : "models/gemini-1.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Returns the prompt for Gemini to generate charade game items.
 * Accepts number of cards and difficulty as parameters.
 */
function getCharadePrompt(context, numCards, difficulty, customPrompt) {
  return `
You are an AI assistant for a charades game. Generate ${numCards} charade game items based on the provided context. Each item should be actable/mimeable for charades gameplay.

Context:
${context}

${customPrompt ? "Additional Instructions: " + customPrompt : ""}

Difficulty Guidelines:
- Easy: Simple actions, common objects, basic emotions (1-2 words)
- Medium: Popular phrases, well-known people/places, everyday activities (2-3 words)  
- Hard: Complex concepts, idioms, specific references, longer phrases (3+ words)

Requirements:
- All items must be suitable for "${difficulty}" difficulty
- Items should be diverse (mix of actions, objects, people, places, emotions, etc.)
- Avoid items that are impossible to act out physically
- Make items contextually relevant to the provided theme
- Return ONLY a valid JSON array with objects containing "text" and "difficulty" fields
- No code blocks, no markdown formatting

Example format: [{"text": "Traffic jam", "difficulty": "medium"}, {"text": "Buying suya", "difficulty": "easy"}]
`;
}

// Utility to strip Markdown code block wrappers from Gemini output
function stripCodeBlock(text) {
  return text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1").trim();
}

async function handler(req, res) {
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
  const diffLevels = ["easy", "medium", "hard"];
  const diff = diffLevels.includes(difficulty) ? difficulty : "medium";

  try {
    // If DUMMY_GEMINI is explicitly set to true, return dummy data
    if (process.env.DUMMY_GEMINI === "true") {
      const dummyItems = Array.from({ length: Math.min(n, 20) }, (_, i) => ({
        text: `Lagos Traffic Jam ${i + 1}`,
        difficulty: diff
      }));
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

    const geminiData = await geminiRes.json();

    // Parse Gemini response
    let items = [];
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
    if (process.env.DUMMY_GEMINI === "true") {
      const fallbackDummyItems = Array.from({ length: Math.min(n, 20) }, (_, i) => ({
        text: `Fallback Lagos Charade ${i + 1}`,
        difficulty: diff
      }));
      return res.status(200).json({ items: fallbackDummyItems, debug: { error: err.message } });
    }
    res.status(500).json({ error: "Failed to generate charade items", details: err.message });
  }
}

// ES module export
export default handler;
