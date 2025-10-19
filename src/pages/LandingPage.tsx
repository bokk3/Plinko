import React from 'react';


interface LandingPageProps {
  onLoginClick?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-cyan-900 to-blue-900 p-8">
      <h1 className="text-5xl font-extrabold text-cyan-300 mb-6 drop-shadow-lg">Welcome to Plinko Game!</h1>
      <p className="text-lg text-gray-200 mb-8 max-w-xl text-center">
        Experience the thrill of Plinko! Register or log in to play, spin the wheel for daily rewards, and climb the leaderboard. Enjoy a modern, interactive, and rewarding game experience.
      </p>
      <div className="flex gap-4">
        <button onClick={onLoginClick} className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg transition">Login</button>
        {/* Register button can be implemented similarly if needed */}
      </div>
      <div className="mt-12 text-gray-400 text-sm">
        <p>Demo account: <span className="font-mono">demo / demo</span></p>
      </div>
    </div>
  );
};

export default LandingPage;
