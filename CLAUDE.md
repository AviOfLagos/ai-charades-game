# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Context Charades is a React + TypeScript + Vite application with a Node.js/Express backend that generates AI-powered charade cards using Google's Gemini API. The app allows players to create custom charade games based on contextual information.

## Architecture

### Frontend (React + TypeScript + Vite)
- **State Management**: Zustand store (`src/context/gameStore.ts`) manages game state, players, rounds, scoring, and timer
- **Main Components**:
  - `App.tsx`: Primary game flow controller with welcome screen, setup, active game, and summary states
  - `PlayerManager.tsx`: Handles player addition/removal and game configuration
  - `RoundManager.tsx`: Controls active gameplay, scoring, and round progression
  - `ContextModal.tsx`: Allows customization of charade generation parameters
- **Game Flow**: Welcome → Player Setup → Context Configuration → AI Generation → Active Gameplay → Summary

### Backend (Node.js/Express)
- **Server**: `server.cjs` runs Express server on port 3001
- **API Handler**: `api/generate-charades.js` interfaces with Google Gemini API
- **Development Mode**: Returns dummy data when `NODE_ENV=development` or `DUMMY_GEMINI=true`

### Key Integration Points
- Frontend calls `/api/generate-charades` POST endpoint with context, difficulty, and card count
- Vite dev server includes API middleware for seamless development experience
- Production requires separate backend server deployment

## Development Commands

```bash
# Install dependencies
npm install

# Start both frontend and backend concurrently (recommended)
npm run dev

# Start frontend only (Vite dev server, usually port 5173/5174)
npm run dev:frontend

# Start backend only (Express server on port 3001)
npm run dev:backend

# Build for production
npm run build

# Lint code (may show warnings for external library types)
npm run lint

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Preview production build
npm run preview
```

## Development Setup Notes

- Frontend runs on Vite dev server (typically port 5173, may auto-increment)
- Backend runs on Express server (port 3001)
- Vite proxy routes `/api/*` requests to backend server
- In development mode, API returns dummy data when `DUMMY_GEMINI=true`
- All servers must be running for full functionality

## Environment Setup

Required `.env` file in project root:
```
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

Development fallback: App returns dummy data when Gemini API is unavailable or in development mode.

## Game State Architecture

The Zustand store (`gameStore.ts`) centralizes:
- **Player Management**: Add/remove players, track scores
- **Round Control**: Current player rotation, round progression
- **Timer System**: Configurable countdown timer per round
- **Game Configuration**: Difficulty levels, max rounds, game reset

## AI Integration

- **Text Processing**: `src/utils/textProcessing/generateCharadesAI.ts` handles API communication
- **Prompt Engineering**: `api/utils/charadePrompt.ts` constructs context-aware prompts
- **Response Parsing**: Strips markdown code blocks and validates JSON structure
- **Error Handling**: Graceful fallback to dummy data in development

## Testing Strategy

- Uses Vitest as test runner
- Testing Library React for component testing
- Test UI available via `npm run test:ui`

## Common Development Patterns

- **Component Communication**: Props drilling for simple data, Zustand for complex state
- **Error Boundaries**: Each major component handles its own error states
- **Loading States**: Async operations show loading indicators
- **Responsive Design**: Tailwind classes with mobile-first approach
- **TypeScript**: Strict typing with interfaces for game state and API responses