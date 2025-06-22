import React from "react";
import { Trophy, RefreshCcw } from "lucide-react";

interface GameSummaryProps {
  scores: { name: string; score: number }[];
  onRestart: () => void;
}

const GameSummary: React.FC<GameSummaryProps> = ({ scores, onRestart }) => {
  if (scores.length === 0) return null;
  const maxScore = Math.max(...scores.map(s => s.score));
  const winners = scores.filter(s => s.score === maxScore);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-200 via-white to-violet-300 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full flex flex-col items-center gap-6 border border-indigo-100">
        <Trophy className="w-12 h-12 text-yellow-500 drop-shadow-lg" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 text-center mb-2">
          Game Over!
        </h1>
        <div className="text-lg text-gray-700 text-center mb-2">
          {winners.length === 1
            ? <>🏆 <span className="font-bold text-violet-700">{winners[0].name}</span> wins with <span className="font-bold">{winners[0].score}</span> points!</>
            : <>🏆 <span className="font-bold text-violet-700">{winners.map(w => w.name).join(", ")}</span> tie with <span className="font-bold">{maxScore}</span> points!</>
          }
        </div>
        <div className="w-full">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-indigo-50">
                <th className="px-2 py-1 border text-left">Player</th>
                <th className="px-2 py-1 border text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {scores
                .sort((a, b) => b.score - a.score)
                .map((s, idx) => (
                  <tr key={s.name} className={idx === 0 ? "bg-yellow-50" : ""}>
                    <td className="px-2 py-1 border">{s.name}</td>
                    <td className="px-2 py-1 border text-right">{s.score}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <button
          className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow hover:from-indigo-600 hover:to-violet-600 transition flex items-center gap-2 justify-center"
          onClick={onRestart}
        >
          <RefreshCcw className="w-5 h-5" />
          Restart Game
        </button>
      </div>
    </div>
  );
};

export default GameSummary;
