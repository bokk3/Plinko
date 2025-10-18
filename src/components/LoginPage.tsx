import React, { useState } from 'react';

export interface User {
  username: string;
  password: string;
  balance: number;
  totalWinnings: number;
  lastWheelSpin: string;
}

interface LoginPageProps {
  users: User[];
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User | null) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ users, setUsers, setCurrentUser }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = () => {
    setError('');
    if (!username || !password) {
      setError('Username and password required');
      return;
    }
    if (users.some((u) => u.username === username)) {
      setError('Username already exists');
      return;
    }
    const newUser: User = {
      username,
      password,
      balance: 150,
      totalWinnings: 0,
      lastWheelSpin: '2000-01-01',
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setUsername('');
    setPassword('');
  };

  const handleLogin = () => {
    setError('');
    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) {
      setError('Invalid username or password');
      return;
    }
    setCurrentUser(user);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6 text-center">PLINKO</h1>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 font-bold rounded ${authMode === 'login' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Login
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 font-bold rounded ${authMode === 'register' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Register
          </button>
        </div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 outline-none"
        />
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <button
          onClick={authMode === 'login' ? handleLogin : handleRegister}
          className="w-full py-2 font-bold rounded bg-cyan-500 hover:bg-cyan-600 text-white transition"
        >
          {authMode === 'login' ? 'Login' : 'Register'}
        </button>
        <div className="mt-6 text-gray-400 text-sm">
          <p className="mb-2">Demo account:</p>
          <p>username: demo | password: demo</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
