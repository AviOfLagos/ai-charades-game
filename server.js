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
  }
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

const removePlayerFromRoom = (socketId) => {
  for (const [roomCode, room] of gameRooms.entries()) {
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      
      // If host left and room not empty, make first player host
      if (room.hostSocketId === socketId && room.players.length > 0) {
        room.hostSocketId = room.players[0].id;
        room.players[0].isHost = true;
      }
      
      // If room is empty, delete it
      if (room.players.length === 0) {
        gameRooms.delete(roomCode);
      }
      
      return { room, roomCode };
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
    
    console.log(`Room created: ${room.id} by ${hostName}`);
  });

  // Join an existing room
  socket.on('join-room', (data) => {
    const { roomCode, playerName } = data;
    const room = joinRoom(roomCode, socket.id, playerName);
    
    if (!room) {
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }
    
    socket.join(roomCode);
    
    // Notify all players in room
    io.to(roomCode).emit('player-joined', {
      room,
      newPlayer: room.players.find(p => p.id === socket.id)
    });
    
    console.log(`${playerName} joined room ${roomCode}`);
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
    const result = removePlayerFromRoom(socket.id);
    if (result) {
      const { room, roomCode } = result;
      io.to(roomCode).emit('player-left', { room });
      console.log(`Player left room ${roomCode}`);
    }
    console.log(`User disconnected: ${socket.id}`);
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
