import { useState } from "react";
import PlayerManager from "./components/PlayerManager";
import RoundManager from "./components/RoundManager";
import ContextModal from "./components/ContextModal";
import WelcomeScreen from "./screens/WelcomeScreen";
import { generateCharadesAI } from "./utils/textProcessing/generateCharadesAI";
import type { CharadeAIItem } from "./utils/textProcessing/generateCharadesAI";
import { SquareStack, SquareDashed, ArrowRight } from "lucide-react";
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
        {/* Enhanced Card Game Area */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100 w-full max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-indigo-700 flex items-center justify-center gap-2">
              <span role="img" aria-label="cards">🃏</span>
              Game Cards
            </h2>
            <p className="text-gray-600 text-sm mt-1">Stack → Active Card</p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
            {/* Card Stack */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-indigo-700 font-semibold flex items-center gap-2">
                <SquareStack className="w-6 h-6" />
                <span>Card Stack</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">
                  {charades.length - currentCardIdx - 1}
                </span>
              </div>
              <div className="relative h-[160px] w-[140px] flex items-end justify-center">
                {charades.slice(currentCardIdx + 1).slice(0, 5).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 mx-auto bg-gradient-to-br from-indigo-300 to-violet-300 border-2 border-indigo-400 rounded-2xl shadow-lg h-[120px] w-[120px] transition-all duration-300 hover:scale-105"
                    style={{
                      bottom: `${i * 12}px`,
                      zIndex: 5 - i,
                      opacity: 0.8 - i * 0.15,
                      transform: `scale(${1 - i * 0.08}) rotate(${(i - 2) * 2}deg)`,
                    }}
                  >
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-white text-xs font-bold opacity-70">CARD</div>
                    </div>
                  </div>
                ))}
                {charades.length - currentCardIdx - 1 === 0 && (
                  <div className="absolute left-0 right-0 mx-auto bg-gray-100 border-2 border-gray-200 rounded-2xl shadow h-[120px] w-[120px] flex items-center justify-center text-gray-400 text-sm">
                    <div className="text-center">
                      <div className="text-2xl mb-1">📭</div>
                      <div className="text-xs">Empty</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Animated Arrow */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                <ArrowRight className="w-6 h-6" />
              </div>
            </div>

            {/* Active Card */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-violet-700 font-semibold flex items-center gap-2">
                <SquareDashed className="w-6 h-6" />
                <span>Active Card</span>
              </div>
              <div 
                key={currentCardIdx} 
                className="bg-gradient-to-br from-white to-violet-50 border-3 border-violet-400 rounded-2xl shadow-2xl p-8 min-h-[160px] w-[280px] flex items-center justify-center transition-all duration-500 transform hover:scale-105 animate-in slide-in-from-left-5"
              >
                <div className="text-center">
                  {charades.length === 0 ? (
                    <div className="text-gray-500">
                      <div className="text-4xl mb-2">🎭</div>
                      <div className="text-lg">No cards available</div>
                    </div>
                  ) : currentCardIdx < charades.length ? (
                    <div className="text-2xl lg:text-3xl font-bold text-violet-700 leading-tight">
                      {charades[currentCardIdx].text}
                    </div>
                  ) : (
                    <div className="text-violet-600">
                      <div className="text-4xl mb-2">🏁</div>
                      <div className="text-lg font-semibold">All cards completed!</div>
                      <div className="text-sm mt-1">Ready for results</div>
                    </div>
                  )}
                </div>
              </div>
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
