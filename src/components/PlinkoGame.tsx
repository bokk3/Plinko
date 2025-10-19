import React, { useRef, useEffect, useState } from 'react';
import type { User } from './LoginPage';
import { supabase } from '../supabaseClient';

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  landed: boolean;
  slot: number | null;
}

export interface Peg {
  x: number;
  y: number;
}

interface PlinkoGameProps {
  currentUser: User & { balance: number; totalWinnings: number; lastWheelSpin: string };
  setCurrentUser: (user: User & { balance: number; totalWinnings: number; lastWheelSpin: string }) => void;
  betAmount: number;
  setBetAmount: (amount: number) => void;
}

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

const PlinkoGame: React.FC<PlinkoGameProps> = ({ currentUser, setCurrentUser, betAmount, setBetAmount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const ballIdRef = useRef(0);

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

  const getSlotMultiplier = (slot: number): number => {
    const multipliers = [0, 0.5, 0.8, 3, 0.2, 3, 0.8, 0.5, 10];
    return multipliers[slot] || 1;
  };

  const startGame = async () => {
    if (currentUser.balance < betAmount) return;
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
    const newBalance = currentUser.balance - betAmount;
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', currentUser.id);
    if (!error) {
      setCurrentUser({ ...currentUser, balance: newBalance });
    }
  };

  const dropBall = async () => {
    if (currentUser.balance < betAmount) return;
    const newBalance = currentUser.balance - betAmount;
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', currentUser.id);
    if (!error) {
      setCurrentUser({ ...currentUser, balance: newBalance });
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
    }
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
          const updatedBalance = currentUser.balance + winnings;
          const updatedTotalWinnings = (currentUser.totalWinnings || 0) + winnings;
          // Async update to Supabase and user state
          (async () => {
            const { error } = await supabase
              .from('users')
              .update({ balance: updatedBalance, totalWinnings: updatedTotalWinnings })
              .eq('id', currentUser.id);
            if (!error) {
              setCurrentUser({ ...currentUser, balance: updatedBalance, totalWinnings: updatedTotalWinnings });
            }
          })();
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

  return (
    <div className="flex flex-col items-center gap-4">
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
              onChange={e => setBetAmount(Number(e.target.value))}
              className="w-full mt-2"
            />
          </label>
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
            disabled={currentUser.balance < betAmount}
            className="px-6 py-2 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            DROP BALL
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 mt-4">
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
    </div>
  );
};

export default PlinkoGame;
