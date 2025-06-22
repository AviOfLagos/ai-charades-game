import React, { useState } from "react";
import ContextInput from "./ContextInput";
import { X, FileText, Settings, Save } from "lucide-react";

interface ContextModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (context: string, prompt: string, numCards: number, difficulty: "easy" | "medium" | "hard") => void;
  initialContext?: string;
  initialPrompt?: string;
  initialNumCards?: number;
  initialDifficulty?: "easy" | "medium" | "hard";
}

const ContextModal: React.FC<ContextModalProps> = ({
  open,
  onClose,
  onSave,
  initialContext = "",
  initialPrompt = "",
  initialNumCards = 20,
  initialDifficulty = "medium",
}) => {
  const [context, setContext] = useState(initialContext);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [numCards, setNumCards] = useState(initialNumCards);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(initialDifficulty);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Auto-save when clicking outside
      onSave(context, prompt, numCards, difficulty);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-slate-800/95 via-purple-900/95 to-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-3xl relative flex flex-col gap-6 border border-purple-500/30">
        <button
          className="absolute top-6 right-6 p-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-300 transform hover:scale-110"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">⚙️</span>
            <h2 className="text-3xl font-bold text-white">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Customize Cards
              </span>
            </h2>
          </div>
          <p className="text-purple-300 text-sm">Tailor your charade experience</p>
        </div>

        <ContextInput onContextChange={setContext} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-purple-300 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Custom AI Prompt
            </label>
            <input
              type="text"
              className="bg-white/10 border-2 border-purple-400/30 rounded-xl p-4 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition backdrop-blur-sm"
              placeholder="e.g. Focus on inside jokes, avoid politics..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <label className="font-semibold text-purple-300">Cards Count</label>
              <input
                type="number"
                min={1}
                max={50}
                className="bg-white/10 border-2 border-purple-400/30 rounded-xl p-4 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition backdrop-blur-sm"
                value={numCards}
                onChange={e => setNumCards(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="font-semibold text-purple-300">Difficulty</label>
              <select
                className="bg-white/10 border-2 border-purple-400/30 rounded-xl p-4 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition backdrop-blur-sm"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
              >
                <option value="easy" className="bg-gray-800">Easy</option>
                <option value="medium" className="bg-gray-800">Medium</option>
                <option value="hard" className="bg-gray-800">Hard</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
            onClick={() => onSave(context, prompt, numCards, difficulty)}
          >
            <Save className="w-5 h-5" />
            Save & Continue
          </button>
          <button
            className="px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-purple-400 text-xs">
            💡 Tip: Click outside this window to auto-save your settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContextModal;
