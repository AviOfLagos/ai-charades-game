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
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100 w-full max-w-xl mx-auto flex flex-col gap-4">
      <h2 className="font-bold text-indigo-700 text-xl flex items-center gap-2 mb-2">
        <Users className="w-6 h-6" />
        Players
      </h2>
      <div className="flex gap-2">
        <input
          type="text"
          className="border-2 border-indigo-200 rounded-xl p-2 flex-1 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          placeholder="Enter player name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
        />
        <button
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow hover:from-indigo-600 hover:to-violet-600 transition flex items-center gap-1"
          onClick={handleAdd}
          disabled={!name.trim()}
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
        <button
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-200 transition flex items-center gap-1"
          onClick={resetGame}
        >
          <Trash2 className="w-4 h-4" />
          Reset
        </button>
      </div>
      {players.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-2">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded px-3 py-2 transition-all duration-200 group hover:bg-indigo-100 hover:shadow"
            >
              <span className="truncate text-base text-indigo-900 flex items-center gap-2">
                <User className="w-5 h-5 text-violet-600" />
                {player.name}
                <span className="ml-2 text-xs text-violet-700 font-semibold">Score: {player.score}</span>
              </span>
              <button
                className="ml-2 p-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition opacity-80 group-hover:opacity-100"
                onClick={() => removePlayer(player.id)}
                aria-label={`Remove ${player.name}`}
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-500 text-sm mt-2">No players added yet.</div>
      )}
    </div>
  );
};

export default PlayerManager;
