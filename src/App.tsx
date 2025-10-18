import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import type { User } from './components/LoginPage';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    { username: 'demo', password: 'demo', balance: 100, totalWinnings: 0, lastWheelSpin: '2000-01-01' }
  ]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  if (!currentUser) {
    return <LoginPage users={users} setUsers={setUsers} setCurrentUser={setCurrentUser} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <h1 className="text-3xl font-bold text-cyan-400">Welcome, {currentUser.username}!</h1>
      {/* Main app content and routing will go here */}
    </div>
  );
};

export default App;
