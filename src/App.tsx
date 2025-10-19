import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';
import type { User } from './components/LoginPage';
import PlinkoGame from './components/PlinkoGame';
import WheelSpin from './components/WheelSpin';
import LandingPage from './pages/LandingPage';

type Route = 'landing' | 'login' | 'game' | 'wheel';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [route, setRoute] = useState<Route>('landing');
  const [betAmount, setBetAmount] = useState(10);

  // Check session on mount
  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      if (data.session && data.session.user) {
        setCurrentUser({ id: data.session.user.id, email: data.session.user.email || '' });
        setRoute('game');
      }
    });
  }, []);

  // Simple route handler
  const handleRoute = (r: Route) => setRoute(r);

  if (!currentUser) {
    if (route === 'login') {
      return <LoginPage setCurrentUser={(user) => { setCurrentUser(user); if (user) setRoute('game'); }} />;
    }
    return <LandingPage onLoginClick={() => setRoute('login')} />;
  }

  // Main game routes
  if (route === 'game') {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-900">
        <button className="absolute top-4 right-4 bg-gray-700 text-white px-4 py-2 rounded" onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); setRoute('landing'); }}>Logout</button>
        <h1 className="text-3xl font-bold text-cyan-400 mb-4">Welcome, {currentUser.email}!</h1>
        <PlinkoGame currentUser={currentUser} setCurrentUser={setCurrentUser} betAmount={betAmount} setBetAmount={setBetAmount} />
        <button className="mt-6 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded" onClick={() => setRoute('wheel')}>Spin Free Wheel</button>
      </div>
    );
  }
  if (route === 'wheel') {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-900">
        <button className="absolute top-4 right-4 bg-gray-700 text-white px-4 py-2 rounded" onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); setRoute('landing'); }}>Logout</button>
        <WheelSpin currentUser={currentUser} setCurrentUser={setCurrentUser} />
        <button className="mt-6 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded" onClick={() => setRoute('game')}>Back to Game</button>
      </div>
    );
  }
  return null;
};

export default App;
