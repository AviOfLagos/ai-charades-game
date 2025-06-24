import React from "react";
import { useNavigate } from "react-router-dom";
import { Play, Lock, Users, Clock, Target, Star } from "lucide-react";

interface Game {
  id: string;
  name: string;
  description: string;
  players: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  icon: string;
  active: boolean;
  comingSoon?: boolean;
}

const GAMES: Game[] = [
  {
    id: "context-charades",
    name: "Context-Aware Charades",
    description: "AI-powered charades based on your conversations, social feeds, and trending topics",
    players: "2-12 players",
    duration: "15-30 min",
    difficulty: "Medium",
    icon: "🎭",
    active: true,
  },
  {
    id: "emoji-story",
    name: "Emoji Story Builder",
    description: "Collaborative storytelling using only emojis - create hilarious narratives together",
    players: "3-8 players", 
    duration: "10-20 min",
    difficulty: "Easy",
    icon: "😄",
    active: false,
    comingSoon: true,
  },
  {
    id: "ai-trivia",
    name: "AI Trivia Master",
    description: "Dynamic trivia questions generated from your interests and current events",
    players: "2-20 players",
    duration: "20-40 min", 
    difficulty: "Hard",
    icon: "🧠",
    active: false,
    comingSoon: true,
  },
  {
    id: "word-association",
    name: "Word Association Chain",
    description: "Fast-paced word connections with AI-powered themes and challenges",
    players: "4-10 players",
    duration: "10-15 min",
    difficulty: "Easy",
    icon: "🔗",
    active: false,
    comingSoon: true,
  },
  {
    id: "drawing-telephone",
    name: "Drawing Telephone",
    description: "Classic telephone game with drawings - watch your ideas transform hilariously",
    players: "4-16 players",
    duration: "15-25 min",
    difficulty: "Medium",
    icon: "🎨",
    active: false,
    comingSoon: true,
  },
  {
    id: "music-mashup",
    name: "Music Mashup Challenge",
    description: "Create and guess music combinations based on your group's favorite artists",
    players: "3-12 players",
    duration: "20-30 min",
    difficulty: "Medium", 
    icon: "🎵",
    active: false,
    comingSoon: true,
  },
];

const GameSuite: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSelectGame = (gameId: string) => {
    if (gameId === "context-charades") {
      navigate("/charades");
    }
  };
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-green-400 bg-green-500/20";
      case "Medium": return "text-yellow-400 bg-yellow-500/20";
      case "Hard": return "text-red-400 bg-red-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-start p-6 md:p-16 lg:p-20">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 flex items-center justify-center gap-4 drop-shadow-lg">
          <span className="text-6xl">🎮</span>
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Party Games Suite
          </span>
        </h1>
        <p className="text-xl text-purple-300 max-w-2xl mx-auto">
          AI-powered party games for friends, family, and teammates. Join the fun with just a click!
        </p>
      </div>

      {/* Games Grid */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`relative bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border transition-all duration-300 ${
              game.active
                ? "border-purple-500/40 hover:border-purple-400/60 hover:shadow-purple-500/20 hover:shadow-xl transform hover:scale-105 cursor-pointer"
                : "border-gray-600/30 opacity-75"
            }`}
            onClick={() => game.active && handleSelectGame(game.id)}
          >
            {/* Lock Icon for Inactive Games */}
            {!game.active && (
              <div className="absolute top-6 right-6 bg-gray-700/50 rounded-full p-2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
            )}

            {/* Coming Soon Badge */}
            {game.comingSoon && (
              <div className="absolute top-6 right-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Coming Soon
              </div>
            )}

            {/* Game Icon */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{game.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{game.name}</h3>
              <p className="text-purple-300 text-sm leading-relaxed">
                {game.description}
              </p>
            </div>

            {/* Game Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-purple-200">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-sm">{game.players}</span>
              </div>
              <div className="flex items-center gap-3 text-purple-200">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-sm">{game.duration}</span>
              </div>
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-purple-400" />
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${getDifficultyColor(game.difficulty)}`}>
                  {game.difficulty}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                game.active
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                  : "bg-gray-600/50 cursor-not-allowed"
              }`}
              disabled={!game.active}
              onClick={(e) => {
                e.stopPropagation();
                if (game.active) handleSelectGame(game.id);
              }}
            >
              {game.active ? (
                <>
                  <Play className="w-5 h-5" />
                  Play Now
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Coming Soon
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-r from-purple-800/30 to-indigo-800/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-400" />
            <h4 className="text-lg font-bold text-white">More Games Coming Soon!</h4>
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-purple-300 text-sm">
            We're constantly adding new AI-powered party games. Follow us for updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameSuite;