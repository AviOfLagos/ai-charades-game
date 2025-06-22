import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socketService } from '../services/socketService';
import { Users, ArrowLeft, Wifi, WifiOff } from 'lucide-react';

interface JoinRoomProps {
  onJoinSuccess: (roomCode: string) => void;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ onJoinSuccess }) => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    connectToServer();
    
    return () => {
      socketService.disconnect();
    };
  }, []);

  const connectToServer = async () => {
    setConnectionStatus('connecting');
    setError(null);
    
    try {
      await socketService.connect();
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('disconnected');
      setError('Failed to connect to game server. Please try again.');
      console.error('Connection failed:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode) {
      setError('Invalid room code');
      return;
    }

    if (connectionStatus !== 'connected') {
      setError('Not connected to server. Please wait...');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      await socketService.joinRoom(roomCode, playerName.trim());
      onJoinSuccess(roomCode);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connecting':
        return { icon: <Wifi className="w-5 h-5 animate-pulse" />, text: 'Connecting...', color: 'text-yellow-400' };
      case 'connected':
        return { icon: <Wifi className="w-5 h-5" />, text: 'Connected', color: 'text-green-400' };
      case 'disconnected':
        return { icon: <WifiOff className="w-5 h-5" />, text: 'Disconnected', color: 'text-red-400' };
    }
  };

  const connectionDisplay = getConnectionStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6 md:p-16 lg:p-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 flex items-center justify-center gap-3 drop-shadow-lg">
          <span className="text-5xl">🎭</span>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Join Game
          </span>
        </h1>
        <p className="text-xl text-purple-300">
          Enter your name to join the party!
        </p>
      </div>

      {/* Room Info */}
      {roomCode && (
        <div className="bg-gradient-to-br from-purple-800/30 to-indigo-800/30 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-purple-500/20">
          <div className="text-center">
            <div className="text-purple-300 text-sm font-semibold mb-2 uppercase tracking-wide">Room Code</div>
            <div className="text-3xl font-mono font-bold text-white">{roomCode}</div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 ${connectionDisplay.color}`}>
          {connectionDisplay.icon}
          <span className="text-sm font-medium">{connectionDisplay.text}</span>
        </div>
      </div>

      {/* Join Form */}
      <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-white">Enter Your Name</h2>
        </div>

        <div className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Your display name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              className="w-full bg-white/10 border-2 border-purple-400/30 rounded-xl p-4 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition backdrop-blur-sm text-center text-lg"
              maxLength={20}
              disabled={isJoining || connectionStatus !== 'connected'}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
              <div className="text-red-300 text-sm font-semibold text-center flex items-center justify-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleJoinRoom}
              disabled={isJoining || connectionStatus !== 'connected' || !playerName.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
            >
              {isJoining ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Joining...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Join Game
                </>
              )}
            </button>

            <button
              onClick={handleGoBack}
              className="w-full px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Games
            </button>
          </div>
        </div>
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="mt-6">
          <button
            onClick={connectToServer}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            disabled={connectionStatus === 'connecting'}
          >
            {connectionStatus === 'connecting' ? 'Reconnecting...' : 'Retry Connection'}
          </button>
        </div>
      )}
    </div>
  );
};

export default JoinRoom;