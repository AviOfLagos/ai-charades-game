import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PlayerManager from "../components/PlayerManager";
import ContextModal from "../components/ContextModal";
import { generateCharadesAI } from "../utils/textProcessing/generateCharadesAI";

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

const SoloSetup: React.FC = () => {
  const navigate = useNavigate();
  const [showContextModal, setShowContextModal] = useState(false);
  const [context, setContext] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [numCards, setNumCards] = useState(20);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [contextSet, setContextSet] = useState(false);
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

  // Handle solo game setup completion
  const handleStartGame = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const items = await generateCharadesAI(effectiveContext, customPrompt, numCards, difficulty);
      
      // Store game data in sessionStorage for the game screen
      sessionStorage.setItem('gameData', JSON.stringify({
        charades: items,
        gameMode: 'solo',
        context: effectiveContext,
        customPrompt,
        numCards,
        difficulty
      }));
      
      navigate('/charades/game');
    } catch {
      setError("Failed to generate charade items.");
    }
    
    setLoading(false);
  };

  const handleBack = () => {
    navigate('/charades');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-start p-6 md:p-16 lg:p-20">
      {/* Back Button */}
      <div className="w-full max-w-6xl mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 flex items-center gap-2 drop-shadow-lg">
        <span role="img" aria-label="charades">🎭</span>
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Solo Game Setup
        </span>
      </h1>
      
      <div className="w-full max-w-6xl flex flex-col gap-8">
        <PlayerManager />
        
        <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
              <span className="text-3xl">🎯</span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Game Setup
              </span>
            </h2>
          </div>
          
          <div className="flex flex-col items-center gap-6">
            <button
              className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow-lg hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
              onClick={() => setShowContextModal(true)}
            >
              <span className="text-xl">⚙️</span>
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
              className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              onClick={handleStartGame}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block text-xl">⏳</span>
                  Generating Cards...
                </>
              ) : (
                <>
                  <span className="text-xl">🎮</span>
                  Start Game
                </>
              )}
            </button>
            
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mt-4 w-full max-w-md">
                <div className="text-red-300 font-semibold flex items-center justify-center gap-2">
                  <span role="img" aria-label="error">⚠️</span>
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoloSetup;