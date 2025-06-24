import { Routes, Route, Navigate, useParams } from "react-router-dom";
import GameSuite from "./screens/GameSuite";
import WelcomeScreen from "./screens/WelcomeScreen";
import GameLobby from "./screens/GameLobby";
import SoloSetup from "./screens/SoloSetup";
import GameScreen from "./screens/GameScreen";
import JoinRoom from "./screens/JoinRoom";
import './App.css' // Import your CSS file here

// Legacy redirect component
const LegacyJoinRedirect: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  return <Navigate to={`/charades/join/${roomCode}`} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<GameSuite />} />
      <Route path="/charades" element={<WelcomeScreen />} />
      <Route path="/charades/solo" element={<SoloSetup />} />
      <Route path="/charades/lobby/:roomCode" element={<GameLobby />} />
      <Route path="/charades/game" element={<GameScreen />} />
      <Route path="/charades/join/:roomCode" element={<JoinRoom />} />
      {/* Legacy URL redirect */}
      <Route path="/join/:roomCode" element={<LegacyJoinRedirect />} />
    </Routes>
  );
}

export default App;
