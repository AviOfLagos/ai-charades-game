import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useGameStore } from "../context/gameStore";
import RoundManager from "../components/RoundManager";
import PlayerGameView from "../components/PlayerGameView";
import type { CharadeAIItem } from "../utils/textProcessing/generateCharadesAI";
import type { GameRoom } from "../types/multiplayer";
import { socketService } from "../services/socketService";

const GameScreen: React.FC = () => {
  const navigate = useNavigate();
  const players = useGameStore((s) => s.players);
  const round = useGameStore((s) => s.round);
  const maxRounds = useGameStore((s) => s.maxRounds);
  const currentPlayerIdx = useGameStore((s) => s.currentPlayerIdx);

  const [charades, setCharades] = useState<CharadeAIItem[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [cardFlipping, setCardFlipping] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameMode, setGameMode] = useState<"solo" | "multiplayer">("solo");
  const [isHost, setIsHost] = useState(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState<GameRoom | null>(null);
  const [roomCode, setRoomCode] = useState("");

  // Load game data on component mount
  useEffect(() => {
    const gameData = sessionStorage.getItem('gameData');
    if (gameData) {
      const parsed = JSON.parse(gameData);
      setCharades(parsed.charades || []);
      setGameMode(parsed.gameMode || "solo");
      setIsHost(parsed.isHost || false);
      setMultiplayerRoom(parsed.multiplayerRoom || null);
      setRoomCode(parsed.roomCode || "");
    } else {
      // No game data, redirect to welcome screen
      navigate('/charades');
    }
  }, [navigate]);

  // Set up Socket.io event listeners for multiplayer synchronization
  useEffect(() => {
    if (gameMode === "multiplayer" && socketService.connected) {
      // Listen for game state updates from server
      socketService.onGameStateUpdated((data) => {
        const room = data.room;
        setMultiplayerRoom(room);
        
        // Sync local game state with server
        if (room.gameState.charades && room.gameState.charades.length > 0) {
          const typedCharades = room.gameState.charades.map(item => ({
            text: item.text,
            difficulty: (item.difficulty as "easy" | "medium" | "hard") || "medium"
          }));
          setCharades(typedCharades);
          setCurrentCardIdx(room.gameState.currentCardIdx || 0);
        }
      });

      return () => {
        socketService.offGameStateUpdated();
      };
    }
  }, [gameMode]);

  // Advance to next card with flip animation
  const handleNextCard = () => {
    setCardFlipping(true);
    setTimeout(() => {
      setCurrentCardIdx((idx) => (idx + 1 < charades.length ? idx + 1 : idx));
      setCardFlipping(false);
    }, 300);
  };

  // Handle game end when all cards are finished
  const handleGameEnd = () => {
    setShowGameOver(true);
  };

  // Calculate remaining cards
  const cardsRemaining = charades.length - currentCardIdx - 1;

  // Handle back navigation
  const handleBack = () => {
    if (gameMode === "multiplayer") {
      navigate(`/charades/lobby/${roomCode}`);
    } else {
      navigate('/charades/solo');
    }
  };

  // Handle restarting and going back to main menu
  const handleBackToSuite = () => {
    sessionStorage.removeItem('gameData');
    socketService.disconnect();
    useGameStore.getState().resetGame();
    navigate('/');
  };

  // Game over: show premium winner screen
  if (showGameOver || currentCardIdx >= charades.length) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    const handleRestart = () => {
      setShowGameOver(false);
      setCurrentCardIdx(0);
      useGameStore.getState().resetGame();
      
      // For multiplayer, go back to lobby; for solo, go to setup
      if (gameMode === "multiplayer") {
        navigate(`/charades/lobby/${roomCode}`);
      } else {
        navigate('/charades/solo');
      }
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 flex flex-col items-center justify-center py-10 px-4">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 max-w-4xl w-full">
          {/* Trophy Header */}
          <div className="text-center mb-12">
            <div className="text-8xl mb-4">🏆</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent mb-4">
              Game Complete!
            </h1>
            <p className="text-xl text-purple-200">Final Results & Winners</p>
          </div>

          {/* Winners Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {sortedPlayers.slice(0, 3).map((player, index) => {
              const positions = ["🥇", "🥈", "🥉"];
              const colors = [
                "from-yellow-400 to-yellow-600",
                "from-gray-300 to-gray-500", 
                "from-amber-600 to-amber-800"
              ];
              const bgColors = [
                "from-yellow-500/20 to-yellow-600/20",
                "from-gray-400/20 to-gray-500/20",
                "from-amber-500/20 to-amber-600/20"
              ];
              
              return (
                <div 
                  key={player.id}
                  className={`bg-gradient-to-br ${bgColors[index]} backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center transform transition-all duration-500 ${
                    index === 0 ? 'scale-110 -translate-y-4' : index === 1 ? 'scale-105 -translate-y-2' : ''
                  }`}
                >
                  <div className="text-6xl mb-4">{positions[index]}</div>
                  <div className={`text-2xl font-bold bg-gradient-to-r ${colors[index]} bg-clip-text text-transparent mb-2`}>
                    {index === 0 ? 'Champion' : index === 1 ? '2nd Place' : '3rd Place'}
                  </div>
                  <div className="text-xl font-semibold text-white mb-2">{player.name}</div>
                  <div className="text-3xl font-bold text-white">{player.score} points</div>
                </div>
              );
            })}
          </div>

          {/* Game Stats */}
          <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-white">{charades.length}</div>
                <div className="text-purple-200">Total Cards</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{round}</div>
                <div className="text-purple-200">Rounds Played</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{players.length}</div>
                <div className="text-purple-200">Players</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRestart}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105"
            >
              🎮 Play Again
            </button>
            <button
              onClick={handleBackToSuite}
              className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-xl shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105"
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Non-host players get simplified view for multiplayer
  if (gameMode === "multiplayer" && multiplayerRoom && !isHost) {
    const currentCard = charades[currentCardIdx]?.text || "";
    const handlePlayerPass = () => {
      socketService.sendGameAction({
        roomCode,
        action: 'pass',
        payload: {}
      });
    };

    return (
      <PlayerGameView
        room={multiplayerRoom}
        currentCard={currentCard}
        cardsRemaining={cardsRemaining}
        onPass={handlePlayerPass}
      />
    );
  }

  // Main game view (host in multiplayer or solo player)
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
          Context-Aware Charades
        </span>
      </h1>
      
      <div className="w-full max-w-6xl flex flex-col gap-8">
        {/* Premium Card Game Area */}
        <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20">
          {/* Game Table Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
              <span className="text-4xl">🎭</span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Charades Arena
              </span>
            </h2>
            <p className="text-purple-300 text-sm mt-2">Cards remaining: {cardsRemaining}</p>
            {gameMode === "multiplayer" && (
              <p className="text-purple-400 text-xs mt-1">Room: {roomCode} | {isHost ? "Host Controls" : "Player View"}</p>
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
            {/* Card Stack with Joker Backs */}
            <div className="flex flex-col items-center">
              <div className="mb-6 text-purple-300 font-semibold text-sm tracking-wide uppercase">
                Card Deck
              </div>
              <div className="relative h-[240px] w-[200px] flex items-end justify-center">
                {charades.slice(currentCardIdx + 1).slice(0, 6).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 mx-auto transition-all duration-500 hover:scale-105 cursor-pointer"
                    style={{
                      bottom: `${i * 10}px`,
                      zIndex: 6 - i,
                      transform: `scale(${1 - i * 0.03}) rotate(${(i - 3) * 1.2}deg)`,
                    }}
                  >
                    {/* Playing Card Back Design */}
                    <div className="h-[180px] w-[130px] bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl border-3 border-yellow-400 shadow-xl relative overflow-hidden">
                      <div className="absolute inset-3 bg-gradient-to-br from-red-500 to-red-700 rounded-xl border border-yellow-300">
                        <div className="h-full w-full flex items-center justify-center relative">
                          <div className="text-yellow-300 text-4xl font-bold">🃏</div>
                          <div className="absolute top-2 left-2 text-yellow-300 text-sm font-bold">🂿</div>
                          <div className="absolute bottom-2 right-2 text-yellow-300 text-sm font-bold transform rotate-180">🂿</div>
                          <div className="absolute inset-2 border border-yellow-400/30 rounded-lg"></div>
                          <div className="absolute top-1 right-1 text-yellow-300 text-xs">♠</div>
                          <div className="absolute bottom-1 left-1 text-yellow-300 text-xs transform rotate-180">♠</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {cardsRemaining === 0 && (
                  <div className="h-[180px] w-[130px] bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl border-3 border-gray-400 flex items-center justify-center text-gray-300">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📭</div>
                      <div className="text-sm">Empty</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Elegant Separator */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full shadow-2xl animate-pulse">
                <ArrowRight className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Active Premium Card */}
            <div className="flex flex-col items-center">
              <div className="mb-6 text-purple-300 font-semibold text-sm tracking-wide uppercase">
                Active Challenge
              </div>
              <div 
                key={currentCardIdx} 
                className="relative h-[240px] w-[320px] perspective-1000"
              >
                <div className={`h-full w-full bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl border-4 border-purple-400 shadow-2xl relative overflow-hidden transition-all duration-700 transform hover:scale-105 ${
                  cardFlipping ? 'animate-spin-y-180' : 'animate-in slide-in-from-left-5 fade-in'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20"></div>
                  <div className="absolute top-4 left-4 text-purple-400 text-lg font-bold">♠</div>
                  <div className="absolute top-4 right-4 text-red-400 text-lg font-bold">♥</div>
                  <div className="absolute bottom-4 left-4 text-red-400 text-lg font-bold transform rotate-180">♦</div>
                  <div className="absolute bottom-4 right-4 text-purple-400 text-lg font-bold transform rotate-180">♣</div>
                  
                  <div className={`h-full w-full flex items-center justify-center p-6 transition-opacity duration-300 ${
                    cardFlipping ? 'opacity-0' : 'opacity-100'
                  }`}>
                    <div className="text-center">
                      {charades.length === 0 ? (
                        <div className="text-gray-500">
                          <div className="text-5xl mb-3">🎭</div>
                          <div className="text-xl font-semibold">No cards available</div>
                        </div>
                      ) : currentCardIdx < charades.length ? (
                        <div className="text-2xl lg:text-3xl font-bold text-gray-800 leading-tight tracking-wide">
                          {charades[currentCardIdx].text}
                        </div>
                      ) : (
                        <div className="text-purple-600">
                          <div className="text-5xl mb-3">🎉</div>
                          <div className="text-xl font-bold">Game Complete!</div>
                          <div className="text-sm mt-2 text-purple-500">Calculating final scores...</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 via-transparent to-pink-400/20 pointer-events-none"></div>
                  
                  {cardFlipping && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center">
                      <div className="text-white text-xl font-bold animate-pulse">🔄</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game Controls */}
        <RoundManager
          onNextCard={handleNextCard}
          cardsRemaining={cardsRemaining}
          onGameEnd={handleGameEnd}
          isMultiplayer={gameMode === "multiplayer"}
          roomCode={roomCode}
          currentRoom={multiplayerRoom}
        />

        {/* Live Scoreboard */}
        <div className="bg-gradient-to-br from-emerald-800/30 to-teal-800/30 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-emerald-300 flex items-center gap-2">
              <span role="img" aria-label="trophy">🏆</span>
              Live Scoreboard
            </h3>
            <p className="text-emerald-400 text-sm">Round {round} of {maxRounds}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                  index === currentPlayerIdx 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105 ring-2 ring-emerald-300' 
                    : 'bg-white/10 text-emerald-300 shadow-md hover:shadow-lg hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === currentPlayerIdx ? 'bg-white text-emerald-600' : 'bg-emerald-500/30 text-emerald-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{player.name}</div>
                    {index === currentPlayerIdx && (
                      <div className="text-xs opacity-90">Current Player</div>
                    )}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  index === currentPlayerIdx ? 'text-white' : 'text-emerald-300'
                }`}>
                  {player.score}
                </div>
              </div>
            ))}
          </div>
          
          {players.length === 0 && (
            <div className="text-center text-emerald-400 py-8">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-sm">No players added yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;