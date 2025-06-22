import React, { useEffect, useRef, useState } from "react";
import { useGameStore } from "../context/gameStore";
import { Timer, Play, Pause, RotateCcw, Check, SkipForward, ArrowRight } from "lucide-react";

interface RoundManagerProps {
  onNextCard?: () => void;
}

const RoundManager: React.FC<RoundManagerProps> = ({ onNextCard }) => {
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

  // Timer effect
  useEffect(() => {
    if (timerActive && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else if (timer === 0 && timerActive) {
      setTimerActive(false);
      setTurnEnded(true);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive, timer, setTimer, setTimerActive]);

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
    setTurnEnded(true);
    setTimerActive(false);
  };

  const handlePass = () => {
    setTurnEnded(true);
    setTimerActive(false);
  };

  const handleNext = () => {
    setTurnEnded(false);
    setTimer(60);
    nextPlayer();
    if (onNextCard) onNextCard();
    // Optionally: nextRound() if all players have played
  };

  const currentPlayer = players[currentPlayerIdx];
  const canStart = players.length >= 2 && !timerActive && !turnEnded;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100 w-full max-w-xl mx-auto flex flex-col gap-4 mt-6">
      <h2 className="font-bold text-indigo-700 text-xl flex items-center gap-2 mb-2">
        <Timer className="w-6 h-6" />
        Round Manager
      </h2>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 flex flex-col items-center">
          <div className="text-lg font-semibold text-violet-700">
            Round {round} / {maxRounds}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {players.length > 0 && currentPlayer
              ? (
                <>
                  <span className="font-semibold text-indigo-700">{currentPlayer.name}</span>
                  <span className="ml-2 text-xs text-violet-700 font-semibold">Score: {currentPlayer.score}</span>
                </>
              )
              : "No players"}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="text-4xl font-mono text-indigo-800 mb-2">
            {timer}s
          </div>
          <div className="flex gap-2">
            {!timerActive && !turnEnded ? (
              <button
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow hover:from-indigo-600 hover:to-violet-600 transition flex items-center gap-2"
                onClick={handleStart}
                disabled={!canStart}
              >
                <Play className="w-5 h-5" />
                Start
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl shadow hover:bg-gray-300 transition flex items-center gap-2"
                onClick={handlePause}
                disabled={!timerActive}
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-200 transition flex items-center gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>
      </div>
      {/* Turn Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-4">
        <button
          className="px-5 py-2 bg-green-500 text-white font-bold rounded-xl shadow hover:bg-green-600 transition flex items-center gap-2 disabled:opacity-50"
          onClick={handleCorrect}
          disabled={!timerActive || turnEnded}
        >
          <Check className="w-5 h-5" />
          Correct
        </button>
        <button
          className="px-5 py-2 bg-yellow-400 text-white font-bold rounded-xl shadow hover:bg-yellow-500 transition flex items-center gap-2 disabled:opacity-50"
          onClick={handlePass}
          disabled={!timerActive || turnEnded}
        >
          <SkipForward className="w-5 h-5" />
          Pass
        </button>
        <button
          className="px-5 py-2 bg-blue-500 text-white font-bold rounded-xl shadow hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
          onClick={handleNext}
          disabled={!turnEnded}
        >
          <ArrowRight className="w-5 h-5" />
          Next Player
        </button>
      </div>
      {players.length < 2 && (
        <div className="text-red-600 font-semibold text-center mt-2">
          At least 2 players are required to start a round.
        </div>
      )}
      {turnEnded && (
        <div className="text-indigo-700 font-semibold text-center mt-2">
          Turn ended. Click "Next Player" to continue.
        </div>
      )}
    </div>
  );
};

export default RoundManager;
