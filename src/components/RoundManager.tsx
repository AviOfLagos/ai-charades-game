import React, { useEffect, useRef, useState } from "react";
import { useGameStore } from "../context/gameStore";
import { Timer, Play, Pause, RotateCcw, Check, SkipForward, ArrowRight } from "lucide-react";

interface RoundManagerProps {
  onNextCard?: () => void;
  cardsRemaining?: number;
  onGameEnd?: () => void;
}

const RoundManager: React.FC<RoundManagerProps> = ({ onNextCard, cardsRemaining = 0, onGameEnd }) => {
  const players = useGameStore((s) => s.players);
  const currentPlayerIdx = useGameStore((s) => s.currentPlayerIdx);
  const round = useGameStore((s) => s.round);
  const maxRounds = useGameStore((s) => s.maxRounds);
  const timer = useGameStore((s) => s.timer);
  const timerActive = useGameStore((s) => s.timerActive);
  const setTimer = useGameStore((s) => s.setTimer);
  const setTimerActive = useGameStore((s) => s.setTimerActive);
  const nextPlayer = useGameStore((s) => s.nextPlayer);
  const incrementScore = useGameStore((s) => s.incrementScore);

  const [turnEnded, setTurnEnded] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect with auto-end when cards finished
  useEffect(() => {
    if (timerActive && timer > 0 && cardsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else if (timer === 0 && timerActive) {
      setTimerActive(false);
      setTurnEnded(true);
    } else if (cardsRemaining === 0 && timerActive) {
      // Auto-end timer when all cards are finished
      setTimerActive(false);
      setTurnEnded(true);
      if (onGameEnd) onGameEnd();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive, timer, cardsRemaining, setTimer, setTimerActive, onGameEnd]);

  const handleStart = () => {
    setTurnEnded(false);
    setTimerActive(true);
  };
  const handlePause = () => setTimerActive(false);
  const handleReset = () => {
    setTimer(60);
    setTurnEnded(false);
  };

  const handleCorrect = () => {
    if (players.length > 0) {
      incrementScore(players[currentPlayerIdx].id, 1);
    }
    // Timer continues, just advance to next card
    if (onNextCard) onNextCard();
  };

  const handlePass = () => {
    // No scoring, but timer continues and advance to next card
    if (onNextCard) onNextCard();
  };

  const handleNext = () => {
    setTurnEnded(false);
    setTimer(60);
    nextPlayer();
    // Reset timer for next player's turn
    setTimerActive(false);
  };

  const currentPlayer = players[currentPlayerIdx];
  const canStart = players.length >= 2 && !timerActive && !turnEnded;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 rounded-3xl shadow-2xl p-8 border border-indigo-500/20 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
          <Timer className="w-7 h-7 text-indigo-400" />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Game Controls
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Player Info */}
        <div className="bg-gradient-to-br from-indigo-800/50 to-purple-800/50 rounded-2xl p-6 border border-indigo-400/20">
          <div className="text-center">
            <div className="text-indigo-300 text-sm font-semibold mb-2 uppercase tracking-wide">Current Player</div>
            {currentPlayer ? (
              <>
                <div className="text-2xl font-bold text-white mb-1">{currentPlayer.name}</div>
                <div className="text-indigo-300 text-sm">Score: {currentPlayer.score}</div>
              </>
            ) : (
              <div className="text-gray-400 text-lg">No players</div>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 rounded-2xl p-6 border border-purple-400/20">
          <div className="text-center">
            <div className="text-purple-300 text-sm font-semibold mb-2 uppercase tracking-wide">Timer</div>
            <div className="text-5xl font-mono font-bold text-white mb-4">{timer}s</div>
            <div className="flex gap-2 justify-center">
              {!timerActive && !turnEnded ? (
                <button
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow hover:from-emerald-600 hover:to-teal-600 transition flex items-center gap-2 disabled:opacity-50"
                  onClick={handleStart}
                  disabled={!canStart}
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-xl shadow hover:from-gray-600 hover:to-gray-700 transition flex items-center gap-2 disabled:opacity-50"
                  onClick={handlePause}
                  disabled={!timerActive}
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              <button
                className="px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl shadow hover:from-slate-600 hover:to-slate-700 transition flex items-center gap-2"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Round Info */}
        <div className="bg-gradient-to-br from-pink-800/50 to-red-800/50 rounded-2xl p-6 border border-pink-400/20">
          <div className="text-center">
            <div className="text-pink-300 text-sm font-semibold mb-2 uppercase tracking-wide">Round Progress</div>
            <div className="text-2xl font-bold text-white mb-1">Round {round}</div>
            <div className="text-pink-300 text-sm">of {maxRounds}</div>
            <div className="mt-3 text-xs text-pink-300">Cards left: {cardsRemaining}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          onClick={handleCorrect}
          disabled={!timerActive || cardsRemaining === 0}
        >
          <Check className="w-5 h-5" />
          Correct
        </button>
        <button
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          onClick={handlePass}
          disabled={!timerActive || cardsRemaining === 0}
        >
          <SkipForward className="w-5 h-5" />
          Pass
        </button>
        <button
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          onClick={handleNext}
          disabled={players.length < 2}
        >
          <ArrowRight className="w-5 h-5" />
          Next Player
        </button>
      </div>

      {/* Status Messages */}
      {players.length < 2 && (
        <div className="mt-6 text-center">
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
            <div className="text-red-300 font-semibold">
              ⚠️ At least 2 players are required to start the game
            </div>
          </div>
        </div>
      )}
      
      {cardsRemaining === 0 && (
        <div className="mt-6 text-center">
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
            <div className="text-purple-300 font-semibold">
              🎉 All cards completed! Game ending...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundManager;
