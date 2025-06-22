import React from "react";

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-200 via-white to-violet-300 px-4">
    <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full flex flex-col items-center gap-6 border border-indigo-100">
      <div className="text-5xl mb-2 drop-shadow-lg">🎭</div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 text-center mb-2">
        Welcome to Context-Aware Charades!
      </h1>
      <p className="text-gray-700 text-center text-lg mb-4">
        Play charades with custom, AI-generated prompts from your own context. Upload files, paste conversations, and challenge your friends!
      </p>
      <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
        <li>Upload or paste your own context for personalized gameplay</li>
        <li>Supports .txt, .md, .docx, .pdf files</li>
        <li>Turn-based, multiplayer, and fully customizable</li>
        <li>AI-powered, context-aware charade cards</li>
      </ul>
      <button
        className="mt-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-2xl shadow-lg hover:from-indigo-600 hover:to-violet-600 transition text-lg flex items-center gap-2"
        onClick={onStart}
      >
        <span role="img" aria-label="start">🚀</span>
        Start Game
      </button>
    </div>
    <div className="mt-8 text-xs text-gray-400 text-center">
      &copy; {new Date().getFullYear()} Context-Aware Charades &mdash; Powered by Gemini AI
    </div>
  </div>
);

export default WelcomeScreen;
