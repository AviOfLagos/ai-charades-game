import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socketService } from '../services/socketService';
import { Copy, Share2, Users, Crown, Clock, Play, ExternalLink, ArrowLeft } from 'lucide-react';
import type { GameRoom } from '../types/multiplayer';

const GameLobby: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  
  // Load multiplayer data from sessionStorage
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [rejoining, setRejoining] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; title: string; message: string } | null>(null);
  
  // Initialize room data from sessionStorage
  useEffect(() => {
    if (initialized) return; // Prevent multiple initializations
    
    console.log('GameLobby: Loading multiplayer data...');
    const multiplayerData = sessionStorage.getItem('multiplayerData');
    console.log('GameLobby: multiplayerData:', multiplayerData);
    
    if (multiplayerData) {
      const parsed = JSON.parse(multiplayerData);
      console.log('GameLobby: parsed data:', parsed);
      setRoom(parsed.room);
      setIsHost(parsed.isHost);
      setInitialized(true);
      
      // Ensure socket connection is active
      if (roomCode && !socketService.connected) {
        console.log('GameLobby: Socket not connected, reconnecting...');
        socketService.connect().then(() => {
          console.log('GameLobby: Socket reconnected successfully');
          
          // For non-hosts, try to rejoin room
          if (!parsed.isHost && !rejoining) {
            const currentPlayer = parsed.room.players.find((p: any) => !p.isHost);
            const playerName = currentPlayer?.name;
            
            if (playerName) {
              console.log('GameLobby: Attempting to rejoin room as:', playerName);
              setRejoining(true);
              socketService.rejoinRoom(roomCode, playerName).catch((error) => {
                console.log('GameLobby: Rejoin failed, but continuing with existing data:', error);
              }).finally(() => {
                setRejoining(false);
              });
            }
          }
        }).catch((error) => {
          console.error('GameLobby: Failed to reconnect socket:', error);
          setErrorModal({
            show: true,
            title: 'Connection Failed',
            message: 'Unable to connect to the game server. Please check your internet connection and try again.'
          });
        });
      }
    } else {
      console.log('GameLobby: No multiplayer data, redirecting...');
      navigate('/charades');
    }
  }, [initialized, navigate, roomCode]);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareUrl = `${window.location.origin}/charades/join/${roomCode}`;

  // Set up Socket.io event listeners
  useEffect(() => {
    if (!roomCode) return;
    
    console.log('GameLobby: Setting up Socket.io listeners for room:', roomCode);
    
    // Set up Socket.io listeners for real-time updates
    socketService.onPlayerJoined((data) => {
      console.log('GameLobby: ✅ RECEIVED player-joined event:', data);
      console.log('GameLobby: Current room state before update:', room);
      console.log('GameLobby: New room data from event:', data.room);
      
      setRoom(data.room);
      
      // Update sessionStorage with latest room data
      const multiplayerData = sessionStorage.getItem('multiplayerData');
      if (multiplayerData) {
        const parsed = JSON.parse(multiplayerData);
        parsed.room = data.room;
        sessionStorage.setItem('multiplayerData', JSON.stringify(parsed));
        console.log('GameLobby: Updated sessionStorage with new room data');
      }
    });

    socketService.onPlayerLeft((data) => {
      console.log('GameLobby: Player left:', data);
      setRoom(data.room);
      
      // Update sessionStorage with latest room data
      const multiplayerData = sessionStorage.getItem('multiplayerData');
      if (multiplayerData) {
        const parsed = JSON.parse(multiplayerData);
        parsed.room = data.room;
        sessionStorage.setItem('multiplayerData', JSON.stringify(parsed));
      }
    });

    socketService.onGameStarted((data) => {
      console.log('GameLobby: ✅ RECEIVED game-started event:', data);
      setRoom(data.room);
      setIsStarting(false); // Reset starting state
      
      // Determine if current user is host based on socket ID
      const currentUserIsHost = data.room.hostSocketId === socketService.socketId;
      console.log('GameLobby: Current socket ID:', socketService.socketId);
      console.log('GameLobby: Host socket ID:', data.room.hostSocketId);
      console.log('GameLobby: Current user is host:', currentUserIsHost);
      
      // Store game data and navigate to game
      sessionStorage.setItem('gameData', JSON.stringify({
        gameMode: 'multiplayer',
        isHost: currentUserIsHost, // Use proper host detection
        multiplayerRoom: data.room,
        roomCode: roomCode,
        charades: data.room.gameState.charades || []
      }));
      
      console.log('GameLobby: Navigating to game screen...');
      navigate('/charades/game');
    });

    socketService.onRoomClosed((data) => {
      console.log('GameLobby: Room closed by host:', data);
      setErrorModal({
        show: true,
        title: 'Room Closed',
        message: data.message
      });
    });

    socketService.onPlayerRejoined((data) => {
      console.log('GameLobby: ✅ RECEIVED player-rejoined event:', data);
      setRoom(data.room);
      
      // Update sessionStorage with latest room data
      const multiplayerData = sessionStorage.getItem('multiplayerData');
      if (multiplayerData) {
        const parsed = JSON.parse(multiplayerData);
        parsed.room = data.room;
        sessionStorage.setItem('multiplayerData', JSON.stringify(parsed));
        console.log('GameLobby: Updated sessionStorage with rejoined room data');
      }
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.offPlayerJoined();
      socketService.offPlayerLeft();
      socketService.offGameStarted();
      socketService.offRoomClosed();
      socketService.offPlayerRejoined();
    };
  }, [roomCode, navigate]);

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
    if (isSharing) return; // Prevent multiple share attempts
    
    if (navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: 'Join our Charades Game!',
          text: `Join our Context-Aware Charades game! Room: ${roomCode}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Failed to share:', error);
        // If share fails, fallback to copy
        handleCopyLink();
      } finally {
        setIsSharing(false);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleStartGame = async () => {
    if (!room || !isHost || !roomCode) return;
    
    setIsStarting(true);
    
    try {
      // Generate default charades for the game
      const defaultCharades = [
        { text: "Act out a person driving a car", difficulty: "easy" },
        { text: "Pretend to be a chef cooking", difficulty: "easy" },
        { text: "Act like you're walking a dog", difficulty: "easy" },
        { text: "Mime brushing your teeth", difficulty: "easy" },
        { text: "Act out someone taking a photo", difficulty: "easy" },
        { text: "Pretend to be a teacher writing on a blackboard", difficulty: "medium" },
        { text: "Act like you're playing basketball", difficulty: "medium" },
        { text: "Mime someone reading a book", difficulty: "medium" },
        { text: "Act out a person exercising", difficulty: "medium" },
        { text: "Pretend to be someone painting a picture", difficulty: "hard" }
      ];
      
      console.log('GameLobby: Starting multiplayer game with charades:', defaultCharades);
      
      // Send start game command to backend
      socketService.startGame(roomCode, defaultCharades);
      
      // Store game data for this client
      sessionStorage.setItem('gameData', JSON.stringify({
        gameMode: 'multiplayer',
        isHost: true,
        multiplayerRoom: room,
        roomCode: roomCode,
        charades: defaultCharades
      }));
      
      console.log('GameLobby: Game start command sent, waiting for confirmation...');
      
    } catch (error) {
      console.error('GameLobby: Failed to start game:', error);
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = () => {
    socketService.disconnect();
    sessionStorage.removeItem('multiplayerData');
    navigate('/charades');
  };

  const handleBack = () => {
    navigate('/charades');
  };

  const handleErrorModalClose = () => {
    setErrorModal(null);
    
    // Clean up and redirect to welcome screen
    sessionStorage.removeItem('multiplayerData');
    socketService.disconnect();
    navigate('/charades');
  };

  const minPlayersToStart = 2;
  const canStartGame = isHost && room && room.players && room.players.length >= minPlayersToStart;

  console.log('GameLobby: Render - room:', room);
  console.log('GameLobby: Render - isHost:', isHost);
  console.log('GameLobby: Render - roomCode:', roomCode);

  if (!room || !room.players) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-purple-300">Loading room...</p>
        </div>
      </div>
    );
  }

  try {
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
          onClick={handleLeaveRoom}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
        >
          Leave Room
        </button>
      </div>

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 via-red-900/20 to-slate-800 rounded-3xl shadow-2xl p-8 border border-red-500/30 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-4">{errorModal.title}</h2>
              <p className="text-red-200 mb-6 leading-relaxed">{errorModal.message}</p>
              <button
                onClick={handleErrorModalClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error('GameLobby: Render error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error loading lobby</div>
          <p className="text-white mb-4">Room: {roomCode}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }
};

export default GameLobby;