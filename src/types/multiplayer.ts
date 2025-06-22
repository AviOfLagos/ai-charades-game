export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
}

export interface GameState {
  isStarted: boolean;
  currentPlayerIdx: number;
  timer: number;
  timerActive: boolean;
  round: number;
  maxRounds: number;
  charades: Array<{ text: string; difficulty?: string }>;
  currentCardIdx: number;
}

export interface GameRoom {
  id: string;
  hostSocketId: string;
  players: Player[];
  gameState: GameState;
  createdAt: Date;
}

export interface RoomCreatedData {
  roomCode: string;
  shareUrl: string;
  room: GameRoom;
}

export interface PlayerJoinedData {
  room: GameRoom;
  newPlayer: Player;
}

export interface GameAction {
  roomCode: string;
  action: 'correct' | 'pass' | 'next-player' | 'timer-update';
  payload?: any;
}

export interface SocketEvents {
  // Outgoing events (client to server)
  'create-room': (data: { hostName: string }) => void;
  'join-room': (data: { roomCode: string; playerName: string }) => void;
  'get-room-info': (data: { roomCode: string }) => void;
  'start-game': (data: { roomCode: string; charades: any[] }) => void;
  'game-action': (data: GameAction) => void;

  // Incoming events (server to client)
  'room-created': (data: RoomCreatedData) => void;
  'player-joined': (data: PlayerJoinedData) => void;
  'join-error': (data: { message: string }) => void;
  'room-info': (data: { room: GameRoom }) => void;
  'room-not-found': () => void;
  'game-started': (data: { room: GameRoom }) => void;
  'game-state-updated': (data: { room: GameRoom }) => void;
  'player-left': (data: { room: GameRoom }) => void;
}