import React, { useState } from "react";
import { useGameStore } from "../context/gameStore";
import { Users, User, X, Trash2, Plus } from "lucide-react";

const PlayerManager: React.FC = () => {
  const players = useGameStore((s) => s.players);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const removePlayer = useGameStore((s) => s.removePlayer);
  const resetGame = useGameStore((s) => s.resetGame);

  const [name, setName] = useState("");

  const handleAdd = () => {
    if (name.trim().length > 0) {
      addPlayer(name.trim());
      setName("");
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20 w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
          <Users className="w-7 h-7 text-purple-400" />
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Players
          </span>
        </h2>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          className="bg-white/10 border-2 border-purple-400/30 rounded-xl p-3 flex-1 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition backdrop-blur-sm"
          placeholder="Enter player name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
        />
        <button
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow-lg hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 transform hover:scale-105"
          onClick={handleAdd}
          disabled={!name.trim()}
        >
          <Plus className="w-5 h-5" />
          Add Player
        </button>
        <button
          className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
          onClick={resetGame}
        >
          <Trash2 className="w-5 h-5" />
          Reset
        </button>
      </div>
      
      {players.length > 0 ? (
        <div className="space-y-3">
          <div className="text-purple-300 text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">👥</span>
            {players.length} Player{players.length !== 1 ? 's' : ''} Ready
          </div>
          <ul className="space-y-3">
            {players.map((player, index) => (
              <li
                key={player.id}
                className="flex items-center justify-between bg-gradient-to-r from-purple-800/30 to-indigo-800/30 border border-purple-400/20 rounded-xl px-4 py-3 transition-all duration-300 group hover:from-purple-700/40 hover:to-indigo-700/40 hover:shadow-lg hover:scale-[1.02] backdrop-blur-sm"
              >
                <span className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <User className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">{player.name}</span>
                  <span className="text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded-lg">
                    Score: {player.score}
                  </span>
                </span>
                <button
                  className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all duration-300 opacity-70 group-hover:opacity-100 transform hover:scale-110"
                  onClick={() => removePlayer(player.id)}
                  aria-label={`Remove ${player.name}`}
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">👥</div>
          <div className="text-purple-300 text-lg font-medium">No players added yet</div>
          <div className="text-purple-400 text-sm mt-1">Add at least 2 players to start</div>
        </div>
      )}
    </div>
  );
};

export default PlayerManager;
