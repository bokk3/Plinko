import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-cyan-900 to-blue-900 p-8">
      <h1 className="text-5xl font-extrabold text-cyan-300 mb-6 drop-shadow-lg">Welcome to Plinko Game!</h1>
      <p className="text-lg text-gray-200 mb-8 max-w-xl text-center">
        Experience the thrill of Plinko! Register or log in to play, spin the wheel for daily rewards, and climb the leaderboard. Enjoy a modern, interactive, and rewarding game experience.
      </p>
      <div className="flex gap-4">
        <a href="/login" className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg transition">Login</a>
        <a href="/register" className="px-8 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg transition">Register</a>
      </div>
      <div className="mt-12 text-gray-400 text-sm">
        <p>Demo account: <span className="font-mono">demo / demo</span></p>
      </div>
    </div>
  );
};

export default LandingPage;
