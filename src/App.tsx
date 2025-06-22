import { useState } from "react";
import PlayerManager from "./components/PlayerManager";
import RoundManager from "./components/RoundManager";
import ContextModal from "./components/ContextModal";
import WelcomeScreen from "./screens/WelcomeScreen";
import { generateCharadesAI } from "./utils/textProcessing/generateCharadesAI";
import type { CharadeAIItem } from "./utils/textProcessing/generateCharadesAI";
import { SquareStack, SquareDashed } from "lucide-react";
import GameSummary from "./screens/GameSummary";
import { useGameStore } from "./context/gameStore";
import './App.css' // Import your CSS file here

const DEFAULT_CONTEXT = `
Trending in Lagos, Nigeria:
- Fuel scarcity and traffic jams
- Afrobeats music and street parties
- Jollof rice vs. fried rice debates
- Nollywood movie premieres
- Danfo buses and okada riders
- Lagos Island vs. Mainland rivalry
- Tech startups and remote work
- "No wahala" and "How far?" slang
- Power outages (NEPA) and generators
- Football, Super Eagles, and local derbies
`;

function App() {
  // All hooks must be called unconditionally at the top level!
  const players = useGameStore((s) => s.players);

  const [showWelcome, setShowWelcome] = useState(true);
  const [showContextModal, setShowContextModal] = useState(false);
  const [context, setContext] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [numCards, setNumCards] = useState(20);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [contextSet, setContextSet] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [charades, setCharades] = useState<CharadeAIItem[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save context/settings from modal
  const handleSaveContext = (ctx: string, prompt: string, n: number, diff: "easy" | "medium" | "hard") => {
    setContext(ctx);
    setCustomPrompt(prompt);
    setNumCards(n);
    setDifficulty(diff);
    setContextSet(true);
    setShowContextModal(false);
  };

  // Use default context if none provided
  const effectiveContext = contextSet && context.trim() ? context : DEFAULT_CONTEXT;

  // Start game: generate charade cards and show round manager
  const handleStartGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await generateCharadesAI(effectiveContext, customPrompt, numCards, difficulty);
      setCharades(items);
      setCurrentCardIdx(0);
      setGameStarted(true);
    } catch {
      setError("Failed to generate charade items.");
    }
    setLoading(false);
  };

  // Advance to next card (called from RoundManager via prop)
  const handleNextCard = () => {
    setCurrentCardIdx((idx) => (idx + 1 < charades.length ? idx + 1 : idx));
  };

  if (showWelcome) {
    return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
  }

  // Pre-game setup: player manager, context modal, start game button
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-violet-200 flex flex-col items-center justify-start py-10 px-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 mb-8 flex items-center gap-2 drop-shadow">
          <span role="img" aria-label="charades">🎭</span>
          Context-Aware Charades
        </h1>
        <div className="w-full h-full max-w-4xl flex flex-col gap-8">
          <PlayerManager />
          <div className="flex flex-col items-center gap-4">
            <button
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow hover:from-indigo-600 hover:to-violet-600 transition flex items-center gap-2"
              onClick={() => setShowContextModal(true)}
            >
              Customize Charade Cards
            </button>
            <ContextModal
              open={showContextModal}
              onClose={() => setShowContextModal(false)}
              onSave={handleSaveContext}
              initialContext={context}
              initialPrompt={customPrompt}
              initialNumCards={numCards}
              initialDifficulty={difficulty}
            />
            <button
              className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow hover:bg-green-600 transition flex items-center gap-2 mt-2"
              onClick={handleStartGame}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block mr-2">⏳</span>
                  Generating Cards...
                </>
              ) : (
                <>
                  Start Game
                </>
              )}
            </button>
            {error && <div className="text-red-600 mt-2 font-semibold flex items-center gap-1"><span role="img" aria-label="error">⚠️</span>{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Game over: show summary
  if (gameStarted && currentCardIdx >= charades.length) {
    const scores = players.map((p) => ({ name: p.name, score: p.score }));
    const handleRestart = () => {
      setGameStarted(false);
      setCharades([]);
      setCurrentCardIdx(0);
      setContextSet(false);
      setContext("");
      setCustomPrompt("");
      setNumCards(20);
      setDifficulty("medium");
      useGameStore.getState().resetGame();
    };
    return <GameSummary scores={scores} onRestart={handleRestart} />;
  }

  // In-game: show card area and round manager
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-violet-200 flex flex-col items-center justify-start py-10 px-2">
      <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 mb-8 flex items-center gap-2 drop-shadow">
        <span role="img" aria-label="charades">🎭</span>
        Context-Aware Charades
      </h1>
      <div className="w-full h-full max-w-4xl flex flex-col gap-8">
        {/* Card area */}
        <div className="flex flex-col md:flex-row items-center gap-8 w-full">
          {/* Card stack (left) */}
          <div className="flex flex-col items-center flex-1 min-w-[120px]">
            <div className="mb-2 text-indigo-700 font-semibold flex items-center gap-1">
              <SquareStack className="w-5 h-5" />
              Card Stack
            </div>
            <div className="relative h-[120px] w-[120px] flex items-end justify-center">
              {charades.slice(currentCardIdx + 1).slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 mx-auto bg-indigo-200 border border-indigo-300 rounded-xl shadow h-[100px] w-[100px] transition-all"
                  style={{
                    bottom: `${i * 8}px`,
                    zIndex: 1 + i,
                    opacity: 0.7 - i * 0.1,
                    transform: `scale(${1 - i * 0.05})`,
                  }}
                />
              ))}
              {charades.length - currentCardIdx - 1 === 0 && (
                <div className="absolute left-0 right-0 mx-auto bg-gray-100 border border-gray-200 rounded-xl shadow h-[100px] w-[100px] flex items-center justify-center text-gray-400 text-xs">
                  No more cards
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {charades.length - currentCardIdx - 1} left
            </div>
          </div>
          {/* Active card (right) */}
          <div className="flex flex-col items-center flex-1 min-w-[220px]">
            <div className="mb-2 text-indigo-700 font-semibold flex items-center gap-1">
              <SquareDashed className="w-5 h-5" />
              Active Card
            </div>
            <div className="bg-white border-2 border-dashed border-violet-400 rounded-xl shadow-lg p-8 text-2xl font-bold text-violet-700 min-h-[100px] flex items-center justify-center w-full max-w-md transition-all">
              {charades.length === 0
                ? "No cards available"
                : currentCardIdx < charades.length
                  ? charades[currentCardIdx].text
                  : "All cards played. Click Next to see results."}
            </div>
          </div>
        </div>
        <RoundManager
          onNextCard={handleNextCard}
        />
      </div>
    </div>
  );
}

export default App;
