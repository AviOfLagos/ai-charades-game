import { io, Socket } from 'socket.io-client';
import type { SocketEvents, GameRoom, RoomCreatedData, PlayerJoinedData, GameAction } from '../types/multiplayer';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(process.env.VITE_BACKEND_URL || 'http://localhost:3001', {
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('Connected to server:', this.socket?.id);
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from server');
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Room management
  createRoom(hostName: string): Promise<RoomCreatedData> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('create-room', { hostName });
      
      this.socket.once('room-created', (data: RoomCreatedData) => {
        resolve(data);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Room creation timeout'));
      }, 10000);
    });
  }

  joinRoom(roomCode: string, playerName: string): Promise<PlayerJoinedData> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('join-room', { roomCode, playerName });
      
      this.socket.once('player-joined', (data: PlayerJoinedData) => {
        resolve(data);
      });

      this.socket.once('join-error', (error: { message: string }) => {
        reject(new Error(error.message));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Join room timeout'));
      }, 10000);
    });
  }

  getRoomInfo(roomCode: string): Promise<GameRoom> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('get-room-info', { roomCode });
      
      this.socket.once('room-info', (data: { room: GameRoom }) => {
        resolve(data.room);
      });

      this.socket.once('room-not-found', () => {
        reject(new Error('Room not found'));
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Room info timeout'));
      }, 5000);
    });
  }

  startGame(roomCode: string, charades: any[]) {
    if (this.socket) {
      this.socket.emit('start-game', { roomCode, charades });
    }
  }

  sendGameAction(action: GameAction) {
    if (this.socket) {
      this.socket.emit('game-action', action);
    }
  }

  // Event listeners
  onPlayerJoined(callback: (data: PlayerJoinedData) => void) {
    if (this.socket) {
      this.socket.on('player-joined', callback);
    }
  }

  onPlayerLeft(callback: (data: { room: GameRoom }) => void) {
    if (this.socket) {
      this.socket.on('player-left', callback);
    }
  }

  onGameStarted(callback: (data: { room: GameRoom }) => void) {
    if (this.socket) {
      this.socket.on('game-started', callback);
    }
  }

  onGameStateUpdated(callback: (data: { room: GameRoom }) => void) {
    if (this.socket) {
      this.socket.on('game-state-updated', callback);
    }
  }

  // Remove event listeners
  offPlayerJoined() {
    if (this.socket) {
      this.socket.off('player-joined');
    }
  }

  offPlayerLeft() {
    if (this.socket) {
      this.socket.off('player-left');
    }
  }

  offGameStarted() {
    if (this.socket) {
      this.socket.off('game-started');
    }
  }

  offGameStateUpdated() {
    if (this.socket) {
      this.socket.off('game-state-updated');
    }
  }

  get socketId() {
    return this.socket?.id || null;
  }

  get connected() {
    return this.isConnected;
  }
}

// Export singleton instance
export const socketService = new SocketService();