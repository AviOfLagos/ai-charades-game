import { io, Socket } from 'socket.io-client';
import type { GameRoom, RoomCreatedData, PlayerJoinedData, GameAction } from '../types/multiplayer';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001', {
          transports: ['websocket', 'polling'],
          timeout: 45000,           // 45 seconds connection timeout
          reconnection: true,       // Enable automatic reconnection
          reconnectionAttempts: 5,  // Try to reconnect 5 times
          reconnectionDelay: 2000   // Wait 2 seconds between attempts
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

      console.log(`SocketService: 🚀 Joining room ${roomCode} as ${playerName} with socket ${this.socket.id}`);
      this.socket.emit('join-room', { roomCode, playerName });
      
      this.socket.once('player-joined', (data: PlayerJoinedData) => {
        console.log(`SocketService: ✅ Successfully joined room ${roomCode}:`, data);
        resolve(data);
      });

      this.socket.once('join-error', (error: { message: string }) => {
        console.error(`SocketService: ❌ Failed to join room ${roomCode}:`, error);
        reject(new Error(error.message));
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        console.error(`SocketService: ⏱️ Join room ${roomCode} timeout`);
        reject(new Error('Join room timeout'));
      }, 15000);
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

  // Rejoin a room (for when user navigates back to lobby)
  rejoinRoom(roomCode: string, playerName?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }

      console.log(`SocketService: 🔄 Rejoining room ${roomCode} as ${playerName || 'unknown'} with socket ${this.socket.id}`);
      
      // Clear any existing listeners for this rejoin attempt
      this.socket.off('rejoin-success');
      this.socket.off('rejoin-error');
      
      // Set up one-time listeners with unique handler
      const timeoutId = setTimeout(() => {
        this.socket?.off('rejoin-success', successHandler);
        this.socket?.off('rejoin-error', errorHandler);
        console.error(`SocketService: ⏱️ Rejoin room ${roomCode} timeout`);
        reject(new Error('Rejoin timeout'));
      }, 10000);
      
      const successHandler = () => {
        clearTimeout(timeoutId);
        this.socket?.off('rejoin-error', errorHandler);
        console.log('SocketService: ✅ Successfully rejoined room:', roomCode);
        resolve();
      };
      
      const errorHandler = (error: { message: string }) => {
        clearTimeout(timeoutId);
        this.socket?.off('rejoin-success', successHandler);
        console.error(`SocketService: ❌ Failed to rejoin room ${roomCode}:`, error);
        reject(new Error(error.message));
      };
      
      this.socket.once('rejoin-success', successHandler);
      this.socket.once('rejoin-error', errorHandler);
      
      this.socket.emit('rejoin-room', { roomCode, playerName });
    });
  }

  startGame(roomCode: string, charades: Array<{ text: string; difficulty?: string }>) {
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
      console.log('SocketService: ✅ Setting up player-joined listener for socket:', this.socket.id);
      this.socket.on('player-joined', (data) => {
        console.log('SocketService: ✅ RECEIVED player-joined RAW event:', data);
        callback(data);
      });
    } else {
      console.error('SocketService: ❌ Cannot set up player-joined listener - no socket connection');
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

  onRoomClosed(callback: (data: { message: string }) => void) {
    if (this.socket) {
      this.socket.on('room-closed', callback);
    }
  }

  onPlayerRejoined(callback: (data: { room: GameRoom }) => void) {
    if (this.socket) {
      this.socket.on('player-rejoined', callback);
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

  offRoomClosed() {
    if (this.socket) {
      this.socket.off('room-closed');
    }
  }

  offPlayerRejoined() {
    if (this.socket) {
      this.socket.off('player-rejoined');
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