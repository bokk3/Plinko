import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

// User type can be extended as needed
export interface User {
  id: string;
  email: string;
  balance: number;
  totalWinnings: number;
  lastWheelSpin: string;
}

interface LoginPageProps {
  setCurrentUser: (user: User | null) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setCurrentUser }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!email || !password) {
      setError('Email and password required');
      return;
    }
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.user) {
      // On registration, set default values for new user
      setCurrentUser({
        id: data.user.id,
        email: data.user.email || '',
        balance: 150,
        totalWinnings: 0,
        lastWheelSpin: '2000-01-01',
      });
    }
    setEmail('');
    setPassword('');
  };

  const handleLogin = async () => {
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !data.user) {
      setError(signInError?.message || 'Invalid email or password');
      return;
    }
    // On login, fetch user profile from Supabase users table
    if (data.user) {
      // You may want to fetch from Supabase here for real data
      setCurrentUser({
        id: data.user.id,
        email: data.user.email || '',
        balance: 150, // TODO: fetch from DB
        totalWinnings: 0, // TODO: fetch from DB
        lastWheelSpin: '2000-01-01', // TODO: fetch from DB
      });
    }
    setEmail('');
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
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        {/* You can add demo/test account info here if needed */}
      </div>
    </div>
  );
};

export default LoginPage;
