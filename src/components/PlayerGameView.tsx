import React from "react";
import { ArrowRight, SkipForward, Clock } from "lucide-react";
import type { GameRoom } from "../types/multiplayer";

interface PlayerGameViewProps {
  room: GameRoom;
  currentCard: string;
  cardsRemaining: number;
  onPass: () => void;
}

const PlayerGameView: React.FC<PlayerGameViewProps> = ({ 
  room, 
  currentCard, 
  cardsRemaining, 
  onPass 
}) => {
  const currentPlayer = room.players[room.gameState.currentPlayerIdx];
  const timer = room.gameState.timer;
  const timerActive = room.gameState.timerActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-start p-6 md:p-12 lg:p-16">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-4 flex items-center justify-center gap-2 drop-shadow-lg">
          <span role="img" aria-label="charades">🎭</span>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Context-Aware Charades
          </span>
        </h1>
        <div className="text-purple-300 text-sm">
          Room: <span className="font-mono font-bold">{room.id}</span>
        </div>
      </div>

      <div className="w-full max-w-5xl space-y-8">
        {/* Main Game Area - Card Display */}
        <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20">
          {/* Current Player Info with Timer */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {(room.gameState.currentPlayerIdx + 1)}
              </div>
              <div>
                <div className="text-xl font-bold text-white">{currentPlayer?.name || 'Unknown'}</div>
                <div className="text-purple-300 text-sm">Acting now</div>
              </div>
            </div>
            
            {/* Timer Display */}
            <div className="text-center">
              <div className={`text-4xl font-mono font-bold mb-1 ${
                timer <= 10 ? 'text-red-400 animate-pulse' : 'text-white'
              }`}>
                {timer}s
              </div>
              <div className="flex items-center gap-1 text-purple-300 text-sm">
                <Clock className="w-4 h-4" />
                {timerActive ? 'Active' : 'Paused'}
              </div>
            </div>
          </div>

          {/* Card Area */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-8">
            {/* Card Stack - Smaller for players */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-purple-300 font-semibold text-sm tracking-wide uppercase">
                Cards Left
              </div>
              <div className="relative h-[160px] w-[120px]">
                {Array.from({ length: Math.min(cardsRemaining, 4) }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 mx-auto"
                    style={{
                      bottom: `${i * 8}px`,
                      zIndex: 4 - i,
                      transform: `scale(${1 - i * 0.02}) rotate(${(i - 2) * 1}deg)`,
                    }}
                  >
                    <div className="h-[120px] w-[90px] bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-xl border-2 border-yellow-400 shadow-lg">
                      <div className="h-full w-full flex items-center justify-center text-yellow-300 text-2xl">
                        🃏
                      </div>
                    </div>
                  </div>
                ))}
                {cardsRemaining === 0 && (
                  <div className="h-[120px] w-[90px] bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl border-2 border-gray-400 flex items-center justify-center text-gray-300">
                    <div className="text-center">
                      <div className="text-2xl mb-1">📭</div>
                      <div className="text-xs">Empty</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-purple-400 text-sm font-medium">
                {cardsRemaining} remaining
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full shadow-xl">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Active Card - Larger for players */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-purple-300 font-semibold text-sm tracking-wide uppercase">
                Current Challenge
              </div>
              <div className="h-[200px] w-[280px] bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl border-4 border-purple-400 shadow-2xl relative overflow-hidden">
                {/* Card decorations */}
                <div className="absolute top-3 left-3 text-purple-400 text-lg">♠</div>
                <div className="absolute top-3 right-3 text-red-400 text-lg">♥</div>
                <div className="absolute bottom-3 left-3 text-red-400 text-lg transform rotate-180">♦</div>
                <div className="absolute bottom-3 right-3 text-purple-400 text-lg transform rotate-180">♣</div>
                
                {/* Card content */}
                <div className="h-full w-full flex items-center justify-center p-6">
                  <div className="text-center">
                    {currentCard ? (
                      <div className="text-xl lg:text-2xl font-bold text-gray-800 leading-tight">
                        {currentCard}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <div className="text-4xl mb-2">🎭</div>
                        <div className="text-lg">Waiting for card...</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player Action - Only Pass Button */}
          <div className="flex justify-center">
            <button
              onClick={onPass}
              disabled={!timerActive || cardsRemaining === 0}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
            >
              <SkipForward className="w-6 h-6" />
              Pass Card
            </button>
          </div>
        </div>

        {/* Live Scoreboard */}
        <div className="bg-gradient-to-br from-emerald-800/30 to-teal-800/30 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
              <span role="img" aria-label="trophy">🏆</span>
              Live Scoreboard
            </h3>
            <p className="text-emerald-400 text-sm">Round {room.gameState.round} of {room.gameState.maxRounds}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {room.players.map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                  index === room.gameState.currentPlayerIdx
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105 ring-2 ring-emerald-300' 
                    : 'bg-white/10 text-emerald-300 shadow-md hover:shadow-lg hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === room.gameState.currentPlayerIdx ? 'bg-white text-emerald-600' : 'bg-emerald-500/30 text-emerald-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {player.name}
                      {player.isHost && <span className="text-yellow-400">👑</span>}
                    </div>
                    {index === room.gameState.currentPlayerIdx && (
                      <div className="text-xs opacity-90">Acting</div>
                    )}
                  </div>
                </div>
                <div className={`text-xl font-bold ${
                  index === room.gameState.currentPlayerIdx ? 'text-white' : 'text-emerald-300'
                }`}>
                  {player.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Status for Players */}
        <div className="bg-gradient-to-r from-purple-800/30 to-indigo-800/30 backdrop-blur-lg rounded-2xl p-4 border border-purple-500/20">
          <div className="text-center">
            <div className="text-purple-300 text-sm">
              {timerActive ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Game in progress
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  Waiting for host
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerGameView;