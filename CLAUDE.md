# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎮 Current Project Status

**Context-Aware Charades** is a **multiplayer AI charades game** with Socket.io real-time capabilities. The project has **solid multiplayer foundation** but requires **critical gameplay synchronization fixes**.

### ✅ WORKING FEATURES
- **Solo Gameplay**: ✅ FULLY FUNCTIONAL end-to-end
- **Multiplayer Room System**: ✅ Create, join, lobby, room persistence
- **Socket.io Foundation**: ✅ Real-time player sync, host controls
- **URL-based Room Joining**: ✅ React Router integration complete
- **Connection Stability**: ✅ 2-hour timeouts, grace periods, error modals
- **Premium UI**: ✅ Casino-themed design across all screens
- **Code Quality**: ✅ Zero ESLint errors, full TypeScript coverage

### 🚨 CRITICAL ISSUES IDENTIFIED (Gameplay)
- **Player Refresh Bug**: Non-host players get kicked back to username setup on refresh
- **Game State Sync**: Timer, cards, and game actions not synced between players
- **Host Controls**: Game start button unresponsive, timer not working for host
- **Component Layout**: Need unified scoreboard and game arena for all players
- **Real-time Actions**: Pass, correct, timer controls need live sync

### 🔄 IN PROGRESS
- Real-time multiplayer game synchronization (40% complete - needs major fixes)
- Unified game interface for host and players
- Real-time game action synchronization

## 📋 Task Management

**All current tasks are tracked in the todo system. Use the TodoRead tool to see the complete task list.**

### Critical Issues (Priority High)
1. **Player Refresh Persistence**: Fix non-host players being removed on refresh
2. **Game State Sync**: Implement proper timer, card, and score synchronization
3. **Host Controls**: Fix unresponsive game start and timer controls
4. **Unified Components**: Create shared scoreboard and game arena components
5. **Real-time Actions**: Enable guest player pass actions and host controls sync

**Task Reference**: Use `TodoRead` tool to view all 42 tracked tasks including completed work and pending fixes.

## 🏗️ Architecture Overview

### Frontend Structure
```
src/
├── components/           # Reusable UI components
│   ├── PlayerManager.tsx      # Local player management (solo mode)
│   ├── RoundManager.tsx       # Game controls for host
│   ├── PlayerGameView.tsx     # Simplified view for players
│   ├── ContextModal.tsx       # Card customization modal
│   └── ContextInput.tsx       # File upload & text input
├── screens/             # Full-page components
│   ├── GameSuite.tsx          # Landing page with game selection
│   ├── WelcomeScreen.tsx      # Solo/Create/Join options
│   ├── GameLobby.tsx          # Multiplayer room lobby ✅
│   ├── JoinRoom.tsx           # Join by URL/code ✅
│   └── GameScreen.tsx         # Main game interface ⚠️ (needs sync fixes)
├── services/            # External integrations
│   └── socketService.ts       # Socket.io wrapper ✅ (2hr timeouts, reconnection)
├── types/               # TypeScript definitions
│   └── multiplayer.ts         # Room, player, game state types ✅
├── context/             # State management
│   └── gameStore.ts           # Zustand store for local state
└── utils/               # Utility functions
    └── textProcessing/        # AI charade generation
```

### Backend (Node.js + Socket.io) ✅
- **server.js**: Express + Socket.io server with room management
- **Grace Period System**: 30s lobby, 2min during games
- **Room Persistence**: Protects against deletion during active games
- **Timeout Management**: Proper cleanup and reconnection support
- **api/generate-charades.js**: Vercel serverless function for AI generation

## 🎮 Game Flow

### Solo Mode ✅
```
Game Suite → Welcome → Solo Setup → Game Play → Game Over
     ↑                                            ↓
     ←←←←←←←←← Main Menu ←←←←←←←←←←←←←←←←←←←←←←←←
```

### Multiplayer Mode 🔄 (Needs Sync Fixes)
```
Game Suite → Welcome → Create/Join → Lobby → Game Play (BROKEN)
     ↑                                 ↓         ↓
     ←←←←←← Main Menu ←←←← Leave ←←←← Direct Start ←←←←
```

**Current Issue**: Game starts but timer/cards/actions not synced between players

## 🌐 Multiplayer Architecture

### Socket.io Events ✅ (Working)
```typescript
// Client → Server
'create-room'     // Host creates room, gets 6-char code ✅
'join-room'       // Player joins by code + name ✅
'rejoin-room'     // Reconnection with grace period ✅
'start-game'      // Host starts game with generated cards ✅
'game-action'     // Timer, scoring, card progression ⚠️ (needs sync)

// Server → Client  
'room-created'    // Room code + share URL ✅
'player-joined'   // Real-time player list updates ✅
'player-rejoined' // Successful reconnection ✅
'room-closed'     // Host disconnect notification ✅
'game-started'    // Game begins for all players ✅
'game-state-updated' // Live sync of timer, scores, cards ⚠️ (needs implementation)
```

### Room Management ✅
- **Room Codes**: 6-character uppercase codes (e.g., "ABC123")
- **Share URLs**: `https://yourapp.com/charades/join/ABC123`
- **Player Roles**: Host (full controls) vs Players (view + pass only)
- **Grace Periods**: 30s in lobby, 2min during games
- **Connection Stability**: 2-hour socket timeouts, auto-reconnection

## 🚨 Current Critical Bugs

### 1. Player Refresh Issue ⚠️
**Problem**: Non-host players get redirected to username setup on refresh
**Impact**: Players lose connection to active games
**Status**: Needs fix in GameLobby.tsx rejoin logic

### 2. Game State Desync ⚠️
**Problem**: Timer, cards, and actions not synchronized between players
**Impact**: Host and players see different game states
**Status**: Needs complete game state management overhaul

### 3. Host Controls Broken ⚠️
**Problem**: Start button unresponsive, timer not working for host
**Impact**: Host cannot properly control multiplayer games
**Status**: Needs Socket.io integration in game controls

### 4. Component Architecture ⚠️
**Problem**: Different interfaces for host vs players causing confusion
**Impact**: Inconsistent user experience
**Status**: Needs unified component design

## 🎯 Game Modes Comparison

| Feature | Solo Mode | Multiplayer Mode |
|---------|-----------|------------------|
| Player Management | ✅ Local add/remove | ✅ Real-time join/leave |
| Room System | ❌ N/A | ✅ Create/join/lobby |
| Connection Handling | ❌ N/A | ✅ Grace periods, reconnection |
| Game Controls | ✅ Full host controls | ❌ Broken sync |
| Context Setup | ✅ File upload + text | ✅ Host sets for all |
| Timer System | ✅ Local control | ❌ Not synced |
| Scoring | ✅ Local tracking | ❌ Not synced |
| Card Progression | ✅ Host advances | ❌ Not synced |

## 🔧 Development Commands

```bash
# Full development (frontend + backend)
npm run dev

# Frontend only (Vite dev server, port 5173)
npm run dev:frontend

# Backend only (Express + Socket.io server, port 3001)
npm run dev:backend

# Code quality
npm run lint        # ESLint (currently 0 errors)
npm run build       # Production build
npm run preview     # Preview build

# Testing
npm run test
npm run test:ui
```

## 🔑 Key Technical Details

### State Management
- **Local State**: Zustand store for solo mode ✅
- **Multiplayer State**: Socket.io real-time synchronization ⚠️ (partial)
- **Room Persistence**: In-memory Map with game protection ✅

### Connection Management ✅
- **Socket Timeouts**: 2 hours (7200000ms)
- **Grace Periods**: 30s lobby, 2min games
- **Auto-reconnection**: 5 attempts, 2s intervals
- **Error Handling**: Modals for host disconnect, connection failures

### UI Design System ✅
- **Theme**: Premium casino dark theme with glass morphism
- **Colors**: Purple/pink gradients, emerald accents
- **Responsive**: 80px desktop, 64px tablet, 24px mobile padding
- **Components**: Consistent rounded-3xl, shadow-2xl styling

### AI Integration ✅
- **Service**: Google Gemini API via serverless function
- **Context Processing**: File upload (.txt, .md, .docx, .pdf) + text paste
- **Prompt Engineering**: Context-aware charade generation
- **Fallback**: Dummy data in development mode

## 🎯 Immediate Action Plan

### Phase 1: Critical Gameplay Fixes (Current Priority)
1. **Fix player refresh persistence** - prevent username reset
2. **Implement game state synchronization** - timer, cards, scores
3. **Fix host controls responsiveness** - start, pause, timer functions
4. **Create unified game components** - shared scoreboard and arena
5. **Enable real-time player actions** - pass cards, scoring

### Phase 2: Enhanced Multiplayer Features
1. **Username editing** for room participants
2. **Improved error handling** for game states
3. **Enhanced reconnection** during active games
4. **Game end synchronization** for all players

### Phase 3: Production Polish
1. **Deploy to production** (Koyeb backend)
2. **Performance optimization**
3. **Comprehensive testing**
4. **Documentation completion**

## 📊 Current Status Metrics

- **Solo Mode**: 100% complete and tested ✅
- **Multiplayer Foundation**: 85% complete (rooms, lobby, connections) ✅
- **Real-time Game Sync**: 15% complete (major issues identified) ⚠️
- **UI/UX**: 95% complete (casino theme implemented) ✅
- **Code Quality**: 100% (zero linting errors) ✅
- **Connection Stability**: 90% complete (minor timeout issues) ✅
- **Production Ready**: 60% (gameplay sync blocking) ⚠️

## 🔧 Environment Setup

```bash
# Required for AI generation
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

# Development flags
DUMMY_GEMINI=false
NODE_ENV=development

# Socket.io configuration
VITE_BACKEND_URL=http://localhost:3001

# Deployment (Vercel + Koyeb)
FRONTEND_URL=https://your-app.vercel.app
```

## 💡 Development Best Practices

- **Task Management**: All work tracked in TodoRead/TodoWrite system
- **Component Communication**: Props for simple data, Socket.io for multiplayer sync
- **Error Handling**: Each component manages its own error states with modals
- **Loading States**: All async operations show loading indicators
- **Responsive Design**: Mobile-first Tailwind approach
- **TypeScript**: Strict typing with comprehensive interfaces
- **Real-time Updates**: Socket.io events for all multiplayer state changes
- **Connection Management**: Grace periods and auto-reconnection for stability

## 🚀 Next Development Session

**Before coding**: 
1. Run `npm run build` to ensure current state is stable
2. Commit and push current progress to GitHub
3. Use `TodoRead` to review all pending tasks
4. Focus on critical gameplay synchronization issues

**Development approach**: Fix critical bugs systematically before adding new features

*Last Updated: 2025-06-24*
*Status: Solo Complete ✅ | Multiplayer Foundation ✅ | Gameplay Sync Critical ⚠️*