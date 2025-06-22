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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative flex flex-col gap-6 border border-indigo-200">
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          <h2 className="font-bold text-xl text-indigo-700">Custom Context & AI Settings</h2>
        </div>
        <ContextInput onContextChange={setContext} />
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="font-semibold text-indigo-700 mb-1 flex items-center gap-1">
              <Settings className="w-4 h-4" />
              Custom AI Prompt
            </label>
            <input
              type="text"
              className="border-2 border-indigo-200 rounded-xl p-2 h-[48px] w-full focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
              placeholder="e.g. Focus on inside jokes, avoid politics..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>
          <div className="flex-1 flex flex-row gap-2 md:gap-4">
            <div className="flex flex-col flex-1">
              <label className="font-medium text-indigo-700 mb-1 text-left">How many cards?</label>
              <input
                type="number"
                min={1}
                max={50}
                className="border-2 border-indigo-200 rounded-xl p-2 h-[48px] w-full focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                value={numCards}
                onChange={e => setNumCards(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="font-medium text-indigo-700 mb-1 text-left">Select difficulty</label>
              <select
                className="border-2 border-indigo-200 rounded-xl p-2 h-[48px] w-full focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
        <button
          className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow hover:from-indigo-600 hover:to-violet-600 transition flex items-center gap-2 justify-center disabled:opacity-50"
          onClick={() => onSave(context, prompt, numCards, difficulty)}
          disabled={!context.trim()}
        >
          <Save className="w-5 h-5" />
          Save Context & Settings
        </button>
      </div>
    </div>
  );
};

export default ContextModal;
