import React, { useState, useRef, useEffect } from 'react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  landed: boolean;
  slot: number | null;
}

interface Peg {
  x: number;
  y: number;
}

interface User {
  username: string;
  password: string;
  balance: number;
  totalWinnings: number;
  lastWheelSpin: string;
}

const PlinkoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [users, setUsers] = useState<User[]>([
    { username: 'demo', password: 'demo', balance: 100, totalWinnings: 0, lastWheelSpin: '2000-01-01' }
  ]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelReward, setWheelReward] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const ballIdRef = useRef(0);
  const spinSoundRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const PEG_RADIUS = 4;
  const BALL_RADIUS = 5;
  const ROWS = 10;
  const COLS = 8;
  const GRAVITY = 0.3;
  const BOUNCE = 0.8;
  const FRICTION = 0.99;
  const SLOTS = 9;

  const generatePegs = (): Peg[] => {
    const pegs: Peg[] = [];
    const startY = 60;
    const rowSpacing = 50;
    const pegSpacing = CANVAS_WIDTH / (COLS + 1);

    for (let row = 0; row < ROWS; row++) {
      const peg_count = COLS + (row % 2);
      const offset = row % 2 === 0 ? 0 : pegSpacing / 2;

      for (let col = 0; col < peg_count; col++) {
        pegs.push({
          x: offset + (col + 0.5) * pegSpacing,
          y: startY + row * rowSpacing,
        });
      }
    }
    return pegs;
  };

  const pegs = useRef(generatePegs());

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
    setScore(0);
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
    setScore(0);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setScore(0);
    setBalls([]);
    setGameRunning(false);
    setUsername('');
    setPassword('');
    setError('');
    setWheelReward(null);
  };

  const canSpinWheel = (): boolean => {
    if (!currentUser) return false;
    const lastSpin = new Date(currentUser.lastWheelSpin);
    const today = new Date();
    return lastSpin.toDateString() !== today.toDateString();
  };

  const playClickSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch (e) {
      // Audio context not available
    }
  };

  const playSpinSound = () => {
    spinSoundRef.current.forEach(timer => clearTimeout(timer));
    spinSoundRef.current = [];
    
    let clickCount = 0;
    const maxClicks = 25;
    let delay = 0;
    
    for (let i = 0; i < maxClicks; i++) {
      const progress = i / maxClicks;
      const interval = 100 + Math.pow(progress, 2) * 400;
      delay += interval;
      
      const timer = setTimeout(() => {
        playClickSound();
      }, delay);
      
      spinSoundRef.current.push(timer);
    }
  };

  const spinWheel = () => {
    if (!currentUser || !canSpinWheel()) return;
    setWheelSpinning(true);
    setWheelRotation(0);
    setWheelReward(null);
    playSpinSound();
    
    let startTime = Date.now();
    const duration = 2000;
    
    const animateWheel = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const rotation = easeProgress * (360 * 8);
      
      setWheelRotation(rotation);
      
      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        const rewards = [25, 50, 10, 75, 30, 100, 20, 250];
        const rewardIndex = Math.floor(Math.random() * rewards.length);
        const reward = rewards[rewardIndex];
        
        const segmentOffset = -rewardIndex * 45 - 10;
        const finalRotation = 360 * 8 + segmentOffset;
        
        setWheelRotation(finalRotation);
        setWheelReward(reward);
        setWheelSpinning(false);
        
        const updatedUser = {
          ...currentUser,
          balance: currentUser.balance + reward,
          lastWheelSpin: new Date().toISOString(),
        };
        setCurrentUser(updatedUser);
        setUsers(users.map((u) => (u.username === currentUser.username ? updatedUser : u)));
      }
    };
    
    animateWheel();
  };

  const startGame = () => {
    if (!currentUser) return;
    if (currentUser.balance < betAmount) {
      setError('Insufficient balance');
      return;
    }
    setError('');
    setGameRunning(true);
    setScore(0);
    const newBall: Ball = {
      id: ballIdRef.current++,
      x: CANVAS_WIDTH / 2,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      landed: false,
      slot: null,
    };
    setBalls([newBall]);
    const updatedUser = {
      ...currentUser,
      balance: currentUser.balance - betAmount,
    };
    setCurrentUser(updatedUser);
    setUsers(users.map((u) => (u.username === currentUser.username ? updatedUser : u)));
  };

  const dropBall = () => {
    if (!currentUser || currentUser.balance < betAmount) {
      setError('Insufficient balance for another ball');
      return;
    }
    playClickSound();
    const updatedUser = {
      ...currentUser,
      balance: currentUser.balance - betAmount,
    };
    setCurrentUser(updatedUser);
    setUsers(users.map((u) => (u.username === currentUser.username ? updatedUser : u)));

    const newBall: Ball = {
      id: ballIdRef.current++,
      x: CANVAS_WIDTH / 2,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      landed: false,
      slot: null,
    };
    setBalls((prev) => [...prev, newBall]);
  };

  const getSlotMultiplier = (slot: number): number => {
    const multipliers = [0, 0.5, 0.8, 3, 0.2, 3, 0.8, 0.5, 10];
    return multipliers[slot] || 1;
  };

  const updateBalls = () => {
    setBalls((prevBalls) => {
      return prevBalls.map((ball) => {
        if (ball.landed) return ball;

        let { x, y, vx, vy } = ball;

        vy += GRAVITY;
        vx *= FRICTION;

        x += vx;
        y += vy;

        if (x - BALL_RADIUS < 0) {
          x = BALL_RADIUS;
          vx = Math.abs(vx) * BOUNCE;
        }
        if (x + BALL_RADIUS > CANVAS_WIDTH) {
          x = CANVAS_WIDTH - BALL_RADIUS;
          vx = -Math.abs(vx) * BOUNCE;
        }

        pegs.current.forEach((peg) => {
          const dx = x - peg.x;
          const dy = y - peg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = BALL_RADIUS + PEG_RADIUS;

          if (dist < minDist) {
            const angle = Math.atan2(dy, dx);
            x = peg.x + Math.cos(angle) * minDist;
            y = peg.y + Math.sin(angle) * minDist;
            vx = Math.cos(angle) * 4;
            vy = Math.sin(angle) * 4;
          }
        });

        if (y + BALL_RADIUS >= CANVAS_HEIGHT - 20) {
          const slot = Math.floor((x / CANVAS_WIDTH) * SLOTS);
          const multiplier = getSlotMultiplier(slot);
          const variance = (Math.random() - 0.5) * 0.4;
          const finalMultiplier = Math.max(0, multiplier + variance);
          const winnings = Math.round(betAmount * finalMultiplier);
          setScore((prev) => prev + winnings);
          
          if (currentUser) {
            const updatedBalance = currentUser.balance + winnings;
            const updatedUser = {
              ...currentUser,
              balance: updatedBalance,
              totalWinnings: currentUser.totalWinnings + winnings,
            };
            setCurrentUser(updatedUser);
            setUsers(users.map((u) => (u.username === currentUser.username ? updatedUser : u)));
          }

          return { ...ball, landed: true, slot, y: CANVAS_HEIGHT - 20 };
        }

        return { ...ball, x, y, vx, vy };
      }).filter((ball) => !ball.landed || ball.y < CANVAS_HEIGHT);
    });
  };

  useEffect(() => {
    if (!gameRunning) return;
    const interval = setInterval(updateBalls, 1000 / 60);
    return () => clearInterval(interval);
  }, [gameRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ff006e';
    pegs.current.forEach((peg) => {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1;
    const slotWidth = CANVAS_WIDTH / SLOTS;
    for (let i = 0; i < SLOTS; i++) {
      ctx.strokeRect(i * slotWidth, CANVAS_HEIGHT - 20, slotWidth, 20);
      const multiplier = getSlotMultiplier(i);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${multiplier.toFixed(1)}x`, (i + 0.5) * slotWidth, CANVAS_HEIGHT - 10);
    }

    ctx.fillStyle = '#ffd60a';
    balls.forEach((ball) => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [balls]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6 text-center">PLINKO</h1>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 font-bold rounded ${
                authMode === 'login'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 font-bold rounded ${
                authMode === 'register'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
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
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 gap-6 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">PLINKO</h1>
            <p className="text-gray-400">Welcome, {currentUser.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 font-bold rounded bg-red-600 hover:bg-red-700 text-white transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400 text-sm">Balance</p>
            <p className="text-2xl font-bold text-green-400">${currentUser.balance}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400 text-sm">Session Win</p>
            <p className="text-2xl font-bold text-yellow-400">${score}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400 text-sm">Total Win</p>
            <p className="text-2xl font-bold text-blue-400">${currentUser.totalWinnings}</p>
          </div>
        </div>

        {!wheelSpinning && wheelReward === null && canSpinWheel() && (
          <button
            onClick={spinWheel}
            className="w-full px-6 py-3 font-bold rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black transition text-lg mb-4"
          >
            🎡 SPIN FREE WHEEL
          </button>
        )}

        {wheelSpinning && (
          <div className="bg-gray-800 p-6 rounded-lg text-center mb-4">
            <div className="flex flex-col items-center justify-center relative">
              <div className="absolute top-0 z-10 text-2xl">
                ▼
              </div>
              
              <svg width="200" height="200" viewBox="0 0 200 200" style={{
                transform: `rotate(${wheelRotation}deg)`,
                transition: wheelReward === null ? 'none' : 'transform 0.3s ease-out',
                marginTop: '20px'
              }}>
                <path d="M 100,100 L 100,20 A 80,80 0 0,1 156.57,43.43 Z" fill="#FF6B6B"/>
                <path d="M 100,100 L 156.57,43.43 A 80,80 0 0,1 180,100 Z" fill="#FFA500"/>
                <path d="M 100,100 L 180,100 A 80,80 0 0,1 156.57,156.57 Z" fill="#4ECB71"/>
                <path d="M 100,100 L 156.57,156.57 A 80,80 0 0,1 100,180 Z" fill="#FFD93D"/>
                <path d="M 100,100 L 100,180 A 80,80 0 0,1 43.43,156.57 Z" fill="#FF6B6B"/>
                <path d="M 100,100 L 43.43,156.57 A 80,80 0 0,1 20,100 Z" fill="#6BCB77"/>
                <path d="M 100,100 L 20,100 A 80,80 0 0,1 43.43,43.43 Z" fill="#87CEEB"/>
                <path d="M 100,100 L 43.43,43.43 A 80,80 0 0,1 100,20 Z" fill="#FFD93D"/>
                
                <circle cx="100" cy="100" r="30" fill="#FFFFFF" stroke="#1f2937" strokeWidth="2"/>
                <text x="100" y="110" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1f2937">SPIN</text>
              </svg>
              
              <div className="text-3xl -mt-2 text-gray-600">
                ║
              </div>
            </div>
            <p className="text-yellow-400 font-bold mt-4 animate-pulse">Spinning...</p>
          </div>
        )}

        {wheelReward !== null && (
          <div className="bg-gray-800 p-6 rounded-lg text-center mb-4">
            <p className="text-yellow-400 font-bold mb-2">You Won!</p>
            <p className="text-4xl font-bold text-green-400">${wheelReward}</p>
            <button
              onClick={() => setWheelReward(null)}
              className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold"
            >
              Close
            </button>
          </div>
        )}

        {!canSpinWheel() && wheelReward === null && (
          <div className="bg-gray-800 p-4 rounded text-center text-gray-400 mb-4">
            ⏰ Free spin available tomorrow!
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-cyan-400 bg-slate-900 shadow-lg"
      />

      {!gameRunning && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <label className="block text-white mb-4">
            Bet Amount: ${betAmount}
            <input
              type="range"
              min="1"
              max={Math.min(100, currentUser.balance)}
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full mt-2"
            />
          </label>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            onClick={startGame}
            className="w-full px-6 py-3 font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
          >
            START GAME - Bet ${betAmount}
          </button>
        </div>
      )}

      {gameRunning && (
        <div className="flex gap-4">
          <button
            onClick={() => setGameRunning(false)}
            className="px-6 py-2 font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
          >
            FINISH GAME
          </button>

          <button
            onClick={dropBall}
            disabled={currentUser && currentUser.balance < betAmount}
            className="px-6 py-2 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            DROP BALL
          </button>
        </div>
      )}
    </div>
  );
};

export default PlinkoGame;