import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Hash, Gamepad2, ArrowLeft } from "lucide-react";
import { socketService } from "../services/socketService";

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle solo game start
  const handleStartSolo = () => {
    navigate('/charades/solo');
  };

  // Handle create room
  const handleCreateRoom = async () => {
    console.log('Create room button clicked!');
    setLoading(true);
    setError(null);
    
    try {
      console.log('Connecting to socket...');
      await socketService.connect();
      console.log('Socket connected, creating room...');
      
      const hostName = `Host_${Math.random().toString(36).substr(2, 5)}`;
      const roomData = await socketService.createRoom(hostName);
      
      console.log('Room created:', roomData);
      
      // Store multiplayer data for the lobby
      const multiplayerData = {
        gameMode: 'multiplayer',
        isHost: true,
        room: roomData.room,
        roomCode: roomData.roomCode
      };
      console.log('WelcomeScreen: Storing multiplayer data:', multiplayerData);
      sessionStorage.setItem('multiplayerData', JSON.stringify(multiplayerData));
      
      navigate(`/charades/lobby/${roomData.roomCode}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to create room: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle join room
  const handleJoinRoom = async (roomCode: string) => {
    console.log('Join room button clicked!', roomCode);
    setLoading(true);
    setError(null);
    
    try {
      console.log('Connecting to socket for joining...');
      await socketService.connect();
      console.log('Socket connected, joining room...');
      
      const playerName = `Player_${Math.random().toString(36).substr(2, 5)}`;
      const joinData = await socketService.joinRoom(roomCode, playerName);
      
      console.log('Joined room:', joinData);
      
      // Store multiplayer data for the lobby
      sessionStorage.setItem('multiplayerData', JSON.stringify({
        gameMode: 'multiplayer',
        isHost: false,
        room: joinData.room,
        roomCode: roomCode
      }));
      
      navigate(`/charades/lobby/${roomCode}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      setError(error instanceof Error ? error.message : 'Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithCode = () => {
    if (joinCode.trim()) {
      handleJoinRoom(joinCode.trim());
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6 md:p-16 lg:p-20">
      {/* Back Button */}
      <div className="w-full max-w-4xl mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-6">🎭</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Context-Aware Charades
          </span>
        </h1>
        <p className="text-xl text-purple-300 max-w-2xl mx-auto">
          AI-powered charades with your own content. Upload files, paste conversations, and challenge your friends!
        </p>
      </div>

      {/* Game Options */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Solo Play */}
        <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20 text-center hover:scale-105 transition-all duration-300">
          <div className="text-5xl mb-4">🎮</div>
          <h3 className="text-xl font-bold text-white mb-3">Solo Play</h3>
          <p className="text-purple-300 text-sm mb-6">
            Practice alone or with friends locally. Host your own game setup.
          </p>
          <button
            onClick={handleStartSolo}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow-lg hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Gamepad2 className="w-5 h-5" />
            Start Solo
          </button>
        </div>

        {/* Create Room */}
        <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20 text-center hover:scale-105 transition-all duration-300">
          <div className="text-5xl mb-4">👑</div>
          <h3 className="text-xl font-bold text-white mb-3">Create Room</h3>
          <p className="text-purple-300 text-sm mb-6">
            Host a multiplayer game. Share a room code for others to join.
          </p>
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Creating...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Create Room
              </>
            )}
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20 text-center hover:scale-105 transition-all duration-300">
          <div className="text-5xl mb-4">🤝</div>
          <h3 className="text-xl font-bold text-white mb-3">Join Room</h3>
          <p className="text-purple-300 text-sm mb-4">
            Enter a room code to join an existing game.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
              className="w-full bg-white/10 border-2 border-purple-400/30 rounded-xl p-3 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition backdrop-blur-sm text-center font-mono"
              maxLength={6}
            />
            <button
              onClick={handleJoinWithCode}
              disabled={!joinCode.trim() || loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Joining...
                </>
              ) : (
                <>
                  <Hash className="w-5 h-5" />
                  Join Game
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full max-w-4xl mb-6">
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
            <div className="text-red-300 font-semibold text-center flex items-center justify-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="bg-gradient-to-r from-purple-800/20 to-indigo-800/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 max-w-4xl w-full">
        <h4 className="text-lg font-bold text-white text-center mb-4">✨ Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-300">
          <div className="flex items-center gap-2">
            <span>📁</span>
            Upload files (.txt, .md, .docx, .pdf)
          </div>
          <div className="flex items-center gap-2">
            <span>📝</span>
            Paste conversations & social feeds
          </div>
          <div className="flex items-center gap-2">
            <span>🤖</span>
            AI-powered context-aware cards
          </div>
          <div className="flex items-center gap-2">
            <span>🎲</span>
            Customizable difficulty levels
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-xs text-purple-400 text-center">
        &copy; {new Date().getFullYear()} Context-Aware Charades &mdash; Powered by Gemini AI
      </div>
    </div>
  );
};

export default WelcomeScreen;
