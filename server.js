import express from "express";
import bodyParser from "body-parser";
import { config } from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import handler from "./api/generate-charades.js";

// Load environment variables
config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 7200000, // 2 hours (2 * 60 * 60 * 1000)
  pingInterval: 30000,   // 30 seconds
  connectTimeout: 45000  // 45 seconds
});

const port = process.env.PORT || 3001;

app.use(bodyParser.json());

// In-memory storage for game rooms (use Redis in production)
const gameRooms = new Map();

// Room management functions
const generateRoomCode = () => {
  return nanoid(6).toUpperCase();
};

const createRoom = (hostSocketId, hostName) => {
  const roomCode = generateRoomCode();
  const room = {
    id: roomCode,
    hostSocketId,
    players: [{ id: hostSocketId, name: hostName, isHost: true, score: 0 }],
    gameState: {
      isStarted: false,
      currentPlayerIdx: 0,
      timer: 60,
      timerActive: false,
      round: 1,
      maxRounds: 3,
      charades: [],
      currentCardIdx: 0
    },
    createdAt: new Date()
  };
  gameRooms.set(roomCode, room);
  return room;
};

const joinRoom = (roomCode, socketId, playerName) => {
  const room = gameRooms.get(roomCode);
  if (!room) return null;
  
  // Check if player already exists
  const existingPlayer = room.players.find(p => p.id === socketId);
  if (existingPlayer) return room;
  
  // Add new player
  room.players.push({ 
    id: socketId, 
    name: playerName, 
    isHost: false, 
    score: 0 
  });
  
  return room;
};

// Store disconnected players with a grace period
const disconnectedPlayers = new Map(); // socketId -> { roomCode, player, timestamp, timeoutId }

const removePlayerFromRoom = (socketId, immediate = false) => {
  for (const [roomCode, room] of gameRooms.entries()) {
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      
      // If host left, kick all players and close room immediately
      if (room.hostSocketId === socketId) {
        console.log(`Host left room ${roomCode}, closing room and kicking all players`);
        
        // Notify all remaining players that the room is closed
        io.to(roomCode).emit('room-closed', { 
          message: 'Host has left the game. You have been disconnected.' 
        });
        
        // Delete the room
        gameRooms.delete(roomCode);
        
        return { room: null, roomCode, hostLeft: true };
      }
      
      // For non-host players, give them a grace period to reconnect (unless immediate removal)
      if (!immediate) {
        // Longer grace period during active games
        const gracePeriodMs = room.gameState.isStarted ? 120000 : 30000; // 2 minutes for active games, 30s for lobby
        const gracePeriodSec = gracePeriodMs / 1000;
        console.log(`⏰ GRACE PERIOD: ${player.name} (${socketId}) disconnected from ${roomCode}, giving ${gracePeriodSec}s to reconnect`);
        
        // Set timeout to remove player after grace period
        const timeoutId = setTimeout(() => {
          const disconnectedInfo = disconnectedPlayers.get(socketId);
          if (disconnectedInfo) {
            // Player didn't reconnect, remove them permanently
            console.log(`❌ TIMEOUT: Removing ${disconnectedInfo.player.name} from ${roomCode} after grace period`);
            disconnectedPlayers.delete(socketId);
            
            const currentRoom = gameRooms.get(roomCode);
            if (currentRoom) {
              // Find player by name (since socket ID might have changed)
              const currentPlayerIndex = currentRoom.players.findIndex(p => p.name === disconnectedInfo.player.name);
              if (currentPlayerIndex !== -1) {
                currentRoom.players.splice(currentPlayerIndex, 1);
                
                // Notify remaining players
                io.to(roomCode).emit('player-left', { room: currentRoom });
                
                // If room is empty, delete it (but only if game hasn't started)
                if (currentRoom.players.length === 0) {
                  if (!currentRoom.gameState.isStarted) {
                    gameRooms.delete(roomCode);
                    console.log(`🗑️ Deleted empty room ${roomCode}`);
                  } else {
                    console.log(`🎮 Keeping empty room ${roomCode} - game in progress`);
                  }
                }
              }
            }
          }
        }, gracePeriodMs); // Variable grace period
        
        disconnectedPlayers.set(socketId, {
          roomCode,
          player: { ...player },
          timestamp: Date.now(),
          timeoutId
        });
        
        return { room, roomCode, gracePeriod: true };
      } else {
        // Immediate removal
        room.players.splice(playerIndex, 1);
        
        // If room is empty, delete it (but only if game hasn't started)
        if (room.players.length === 0) {
          if (!room.gameState.isStarted) {
            gameRooms.delete(roomCode);
            console.log(`🗑️ Deleted empty room ${roomCode} (immediate)`);
          } else {
            console.log(`🎮 Keeping empty room ${roomCode} - game in progress (immediate)`);
          }
        }
        
        return { room, roomCode };
      }
    }
  }
  return null;
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new game room
  socket.on('create-room', (data) => {
    const { hostName } = data;
    const room = createRoom(socket.id, hostName);
    socket.join(room.id);
    
    socket.emit('room-created', {
      roomCode: room.id,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${room.id}`,
      room
    });
    
    console.log(`Room created: ${room.id} by ${hostName} (socket: ${socket.id})`);
    console.log(`Host ${socket.id} joined Socket.io room ${room.id}`);
  });

  // Join an existing room
  socket.on('join-room', (data) => {
    const { roomCode, playerName } = data;
    console.log(`🚀 JOIN REQUEST: ${playerName} (${socket.id}) wants to join room ${roomCode}`);
    
    const room = joinRoom(roomCode, socket.id, playerName);
    
    if (!room) {
      console.log(`❌ JOIN FAILED: Room ${roomCode} not found`);
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }
    
    socket.join(roomCode);
    console.log(`✅ SOCKET JOINED: ${socket.id} joined Socket.io room ${roomCode}`);
    
    // Notify all players in room
    const eventData = {
      room,
      newPlayer: room.players.find(p => p.id === socket.id)
    };
    
    console.log(`📡 EMITTING player-joined to room ${roomCode}:`);
    console.log(`   - Room has ${room.players.length} players:`);
    room.players.forEach((player, idx) => {
      console.log(`     ${idx + 1}. ${player.name} (${player.id}) ${player.isHost ? '[HOST]' : ''}`);
    });
    
    io.to(roomCode).emit('player-joined', eventData);
    
    console.log(`${playerName} (socket: ${socket.id}) joined room ${roomCode}`);
    console.log(`Emitting player-joined to room ${roomCode} with ${room.players.length} players`);
  });

  // Get room info
  socket.on('get-room-info', (data) => {
    const { roomCode } = data;
    const room = gameRooms.get(roomCode);
    
    if (room) {
      socket.emit('room-info', { room });
    } else {
      socket.emit('room-not-found');
    }
  });

  // Rejoin a room (when user navigates back to lobby or reconnects)
  socket.on('rejoin-room', (data) => {
    const { roomCode, playerName } = data;
    console.log(`🔄 REJOIN REQUEST: ${playerName} (${socket.id}) wants to rejoin room ${roomCode}`);
    
    const room = gameRooms.get(roomCode);
    
    if (!room) {
      console.log(`❌ REJOIN FAILED: Room ${roomCode} not found`);
      socket.emit('rejoin-error', { message: 'Room not found' });
      return;
    }
    
    // Check if this socket is already in the room
    let existingPlayer = room.players.find(p => p.id === socket.id);
    
    if (existingPlayer) {
      // Player already exists with current socket ID, just join the socket room
      socket.join(roomCode);
      socket.emit('rejoin-success');
      console.log(`✅ REJOIN: ${socket.id} already in room ${roomCode}, joined Socket.io room`);
      return;
    }
    
    if (playerName) {
      // Try to find player by name (for reconnection scenarios)
      existingPlayer = room.players.find(p => p.name === playerName);
      if (existingPlayer) {
        // Update the player's socket ID and rejoin
        const oldSocketId = existingPlayer.id;
        console.log(`🔄 RECONNECTING: ${playerName} changing socket ID from ${oldSocketId} to ${socket.id}`);
        
        // Clear any grace period for the old socket
        const disconnectedInfo = disconnectedPlayers.get(oldSocketId);
        if (disconnectedInfo && disconnectedInfo.timeoutId) {
          clearTimeout(disconnectedInfo.timeoutId);
          console.log(`⏹️ Cleared grace period timeout for ${playerName} (socket ID update)`);
        }
        disconnectedPlayers.delete(oldSocketId);
        
        // Update socket ID and join room
        existingPlayer.id = socket.id;
        socket.join(roomCode);
        socket.emit('rejoin-success');
        
        // Notify all players about the updated room state
        io.to(roomCode).emit('player-rejoined', { room });
        console.log(`✅ Player ${playerName} (${socket.id}) reconnected to room ${roomCode}`);
        return;
      }
      
      // Player not found in room, but check if they're in disconnected list
      for (const [oldSocketId, disconnectedInfo] of disconnectedPlayers.entries()) {
        if (disconnectedInfo.roomCode === roomCode && disconnectedInfo.player.name === playerName) {
          console.log(`🔄 RECOVERING: ${playerName} reconnecting after disconnection`);
          
          // Clear the grace period timeout
          if (disconnectedInfo.timeoutId) {
            clearTimeout(disconnectedInfo.timeoutId);
            console.log(`⏹️ Cleared grace period timeout for ${playerName}`);
          }
          
          // Add player back to room with new socket ID
          const restoredPlayer = { ...disconnectedInfo.player, id: socket.id };
          room.players.push(restoredPlayer);
          
          // Clear from disconnected list
          disconnectedPlayers.delete(oldSocketId);
          
          socket.join(roomCode);
          socket.emit('rejoin-success');
          
          // Notify all players about the reconnection
          io.to(roomCode).emit('player-joined', { room, newPlayer: restoredPlayer });
          console.log(`✅ Player ${playerName} (${socket.id}) recovered and rejoined room ${roomCode}`);
          return;
        }
      }
    }
    
    console.log(`❌ REJOIN FAILED: Player ${playerName} not found in room ${roomCode}`);
    socket.emit('rejoin-error', { message: 'Player not found in room' });
  });

  // Start game
  socket.on('start-game', (data) => {
    const { roomCode, charades } = data;
    const room = gameRooms.get(roomCode);
    
    if (room && room.hostSocketId === socket.id) {
      room.gameState.isStarted = true;
      room.gameState.charades = charades;
      room.gameState.currentCardIdx = 0;
      
      io.to(roomCode).emit('game-started', { room });
      console.log(`Game started in room ${roomCode}`);
    }
  });

  // Game actions (correct, pass, next player, etc.)
  socket.on('game-action', (data) => {
    const { roomCode, action, payload } = data;
    const room = gameRooms.get(roomCode);
    
    if (!room) return;
    
    switch (action) {
      case 'correct':
        if (room.hostSocketId === socket.id) {
          const currentPlayer = room.players[room.gameState.currentPlayerIdx];
          if (currentPlayer) {
            currentPlayer.score += 1;
          }
          room.gameState.currentCardIdx = Math.min(
            room.gameState.currentCardIdx + 1,
            room.gameState.charades.length - 1
          );
        }
        break;
        
      case 'pass':
        room.gameState.currentCardIdx = Math.min(
          room.gameState.currentCardIdx + 1,
          room.gameState.charades.length - 1
        );
        break;
        
      case 'next-player':
        if (room.hostSocketId === socket.id) {
          room.gameState.currentPlayerIdx = 
            (room.gameState.currentPlayerIdx + 1) % room.players.length;
          room.gameState.timer = 60;
          room.gameState.timerActive = false;
        }
        break;
        
      case 'timer-update':
        if (room.hostSocketId === socket.id) {
          room.gameState.timer = payload.timer;
          room.gameState.timerActive = payload.timerActive;
        }
        break;
    }
    
    // Broadcast updated game state
    io.to(roomCode).emit('game-state-updated', { room });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    const result = removePlayerFromRoom(socket.id);
    if (result) {
      const { room, roomCode, hostLeft, gracePeriod } = result;
      
      if (hostLeft) {
        console.log(`Host disconnected from room ${roomCode}, room closed`);
      } else if (room && !gracePeriod) {
        // Only emit player-left if it's immediate removal
        io.to(roomCode).emit('player-left', { room });
        console.log(`Player immediately removed from room ${roomCode}`);
      } else if (gracePeriod) {
        console.log(`Player temporarily disconnected from room ${roomCode}, grace period active`);
        // Don't emit player-left yet, they might reconnect
      }
    }
  });
});

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Debug endpoint
app.get("/api/debug", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DUMMY_GEMINI: process.env.DUMMY_GEMINI,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    HAS_API_KEY: !!process.env.GEMINI_API_KEY
  });
});

// Express adapter for generate-charades
app.post("/api/generate-charades", async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

server.listen(port, () => {
  console.log(`Backend server with Socket.io running at http://localhost:${port}`);
});
