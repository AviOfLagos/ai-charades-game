# Context Charades

This project is a React + TypeScript + Vite application with a Node.js/Express backend for AI-powered charades generation.

## Development Setup

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Install dependencies

```bash
npm install
```

### Start the development servers (frontend + backend)

```bash
npm run dev
```

This will start both the Vite frontend (default: http://localhost:5173) and the backend API server (default: http://localhost:3001) concurrently.

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3001/api/generate-charades](http://localhost:3001/api/generate-charades)

### Start only the frontend or backend

- Frontend only: `npm run dev:frontend`
- Backend only: `npm run dev:backend`

## API

The backend exposes a POST endpoint at `/api/generate-charades` for generating charade items using the Gemini API.

## Environment Variables

Create a `.env` file in the project root with the following:

```
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

## Notes

- Ensure both servers are running for full functionality.
- The frontend expects the backend to be available at `http://localhost:3001` during development.
- For production or deployment, you may need to adjust API URLs and hosting setup.
