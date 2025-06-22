import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { Copy, Share2, Users, Crown, Clock, Play, ExternalLink } from 'lucide-react';
import type { GameRoom } from '../types/multiplayer';

interface GameLobbyProps {
  roomCode: string;
  currentRoom: GameRoom | null;
  isHost: boolean;
  onGameStart: (room: GameRoom) => void;
  onLeaveRoom: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ 
  roomCode, 
  currentRoom, 
  isHost, 
  onGameStart,
  onLeaveRoom 
}) => {
  const [room, setRoom] = useState<GameRoom | null>(currentRoom);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const shareUrl = `${window.location.origin}/join/${roomCode}`;

  useEffect(() => {
    // Set up Socket.io listeners for real-time updates
    socketService.onPlayerJoined((data) => {
      setRoom(data.room);
    });

    socketService.onPlayerLeft((data) => {
      setRoom(data.room);
    });

    socketService.onGameStarted((data) => {
      setRoom(data.room);
      onGameStart(data.room);
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.offPlayerJoined();
      socketService.offPlayerLeft();
      socketService.offGameStarted();
    };
  }, [onGameStart]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our Charades Game!',
          text: `Join our Context-Aware Charades game! Room: ${roomCode}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleStartGame = () => {
    if (!room || !isHost) return;
    
    setIsStarting(true);
    // This will trigger the game setup flow for the host
    onGameStart(room);
  };

  const minPlayersToStart = 2;
  const canStartGame = isHost && room && room.players.length >= minPlayersToStart;

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-purple-300">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-start p-6 md:p-16 lg:p-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 flex items-center justify-center gap-3 drop-shadow-lg">
          <span className="text-5xl">🎭</span>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Game Lobby
          </span>
        </h1>
        <p className="text-xl text-purple-300">
          Waiting for players to join...
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Room Info & Sharing */}
        <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
              <Share2 className="w-7 h-7 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Room Details
              </span>
            </h2>
          </div>

          {/* Room Code Display */}
          <div className="bg-gradient-to-r from-purple-800/30 to-indigo-800/30 rounded-2xl p-6 mb-6 border border-purple-400/20">
            <div className="text-center">
              <div className="text-purple-300 text-sm font-semibold mb-2 uppercase tracking-wide">Room Code</div>
              <div className="text-4xl font-mono font-bold text-white mb-4">{roomCode}</div>
              <div className="text-purple-300 text-sm">Share this code with friends!</div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCopyLink}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow-lg hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
            >
              <Copy className="w-5 h-5" />
              {showCopiedMessage ? 'Link Copied!' : 'Copy Invite Link'}
            </button>

            <button
              onClick={handleShare}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
            >
              <ExternalLink className="w-5 h-5" />
              Share Game
            </button>

            <div className="text-center">
              <div className="text-purple-400 text-xs bg-purple-900/20 px-3 py-2 rounded-lg">
                💡 Players can join by visiting: <br />
                <span className="font-mono text-purple-300">{shareUrl}</span>
              </div>
            </div>
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="mt-8 pt-6 border-t border-purple-500/20">
              <div className="flex items-center gap-2 text-yellow-400 mb-4">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">You are the host</span>
              </div>
              
              <button
                onClick={handleStartGame}
                disabled={!canStartGame || isStarting}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
              >
                {isStarting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Starting Game...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Game
                  </>
                )}
              </button>

              {!canStartGame && (
                <div className="text-center mt-3">
                  <div className="text-purple-300 text-sm">
                    Need at least {minPlayersToStart} players to start
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Players List */}
        <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
              <Users className="w-7 h-7 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Players ({room.players.length})
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {room.players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                  player.id === socketService.socketId
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 ring-2 ring-emerald-400/20'
                    : 'bg-gradient-to-r from-purple-800/30 to-indigo-800/30 border border-purple-400/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-semibold flex items-center gap-2">
                      {player.name}
                      {player.isHost && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                      {player.id === socketService.socketId && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-purple-300 text-sm">
                      {player.isHost ? 'Host' : 'Player'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-purple-300 text-xs">Score</div>
                </div>
              </div>
            ))}
          </div>

          {room.players.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👥</div>
              <div className="text-purple-300 text-lg">No players yet</div>
              <div className="text-purple-400 text-sm mt-1">Share the room code to invite friends!</div>
            </div>
          )}
        </div>
      </div>

      {/* Game Status */}
      <div className="mt-8 bg-gradient-to-r from-purple-800/30 to-indigo-800/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-purple-300 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Game Status</span>
          </div>
          <div className="text-lg text-white">
            {room.gameState.isStarted ? 'Game in progress...' : 'Waiting to start'}
          </div>
          <div className="text-sm text-purple-400 mt-1">
            {room.players.length} of 12 players joined
          </div>
        </div>
      </div>

      {/* Leave Room Button */}
      <div className="mt-6">
        <button
          onClick={onLeaveRoom}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default GameLobby;