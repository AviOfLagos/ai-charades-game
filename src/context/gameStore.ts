import { create } from "zustand";

export type Difficulty = "easy" | "medium" | "hard";

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIdx: number;
  round: number;
  maxRounds: number;
  timer: number; // seconds left in current round
  timerActive: boolean;
  difficulty: Difficulty;
  setPlayers: (players: Player[]) => void;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  setCurrentPlayerIdx: (idx: number) => void;
  nextPlayer: () => void;
  setRound: (round: number) => void;
  nextRound: () => void;
  setMaxRounds: (max: number) => void;
  setScore: (id: string, score: number) => void;
  incrementScore: (id: string, delta?: number) => void;
  setTimer: (seconds: number) => void;
  setTimerActive: (active: boolean) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  players: [],
  currentPlayerIdx: 0,
  round: 1,
  maxRounds: 10,
  timer: 60,
  timerActive: false,
  difficulty: "medium",
  setPlayers: (players: Player[]) => set({ players }),
  addPlayer: (name: string) =>
    set((state) => ({
      players: [
        ...state.players,
        { id: Math.random().toString(36).slice(2), name, score: 0 },
      ],
    })),
  removePlayer: (id: string) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== id),
    })),
  setCurrentPlayerIdx: (idx: number) => set({ currentPlayerIdx: idx }),
  nextPlayer: () =>
    set((state) => ({
      currentPlayerIdx:
        state.players.length > 0
          ? (state.currentPlayerIdx + 1) % state.players.length
          : 0,
    })),
  setRound: (round: number) => set({ round }),
  nextRound: () => set((state) => ({ round: state.round + 1 })),
  setMaxRounds: (max: number) => set({ maxRounds: max }),
  setScore: (id: string, score: number) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, score } : p
      ),
    })),
  incrementScore: (id: string, delta: number = 1) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, score: p.score + delta } : p
      ),
    })),
  setTimer: (seconds: number) => set({ timer: seconds }),
  setTimerActive: (active: boolean) => set({ timerActive: active }),
  setDifficulty: (difficulty: Difficulty) => set({ difficulty }),
  resetGame: () =>
    set({
      players: [],
      currentPlayerIdx: 0,
      round: 1,
      maxRounds: 10,
      timer: 60,
      timerActive: false,
      difficulty: "medium",
    }),
}));
