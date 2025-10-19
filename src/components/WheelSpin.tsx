import React, { useState, useRef } from 'react';
import type { User } from './LoginPage';
import { supabase } from '../supabaseClient';

interface WheelSpinProps {
  currentUser: User & { balance: number; lastWheelSpin: string };
  setCurrentUser: (user: User & { balance: number; lastWheelSpin: string }) => void;
}

const rewards = [25, 50, 10, 75, 30, 100, 20, 250];

const WheelSpin: React.FC<WheelSpinProps> = ({ currentUser, setCurrentUser }) => {
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelReward, setWheelReward] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const spinSoundRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const canSpinWheel = (): boolean => {
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
    } catch (e) {}
  };

  const playSpinSound = () => {
    spinSoundRef.current.forEach(timer => clearTimeout(timer));
    spinSoundRef.current = [];
    let delay = 0;
    for (let i = 0; i < 25; i++) {
      const progress = i / 25;
      const interval = 100 + Math.pow(progress, 2) * 400;
      delay += interval;
      const timer = setTimeout(() => {
        playClickSound();
      }, delay);
      spinSoundRef.current.push(timer);
    }
  };

  const spinWheel = async () => {
    if (!canSpinWheel()) return;
    setWheelSpinning(true);
    setWheelRotation(0);
    setWheelReward(null);
    playSpinSound();
    let startTime = Date.now();
    const duration = 2000;
    const animateWheel = async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const rotation = easeProgress * (360 * 8);
      setWheelRotation(rotation);
      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        const rewardIndex = Math.floor(Math.random() * rewards.length);
        const reward = rewards[rewardIndex];
        const segmentOffset = -rewardIndex * 45 - 10;
        const finalRotation = 360 * 8 + segmentOffset;
        setWheelRotation(finalRotation);
        setWheelReward(reward);
        setWheelSpinning(false);
        const newBalance = currentUser.balance + reward;
        const newLastSpin = new Date().toISOString();
        const { error } = await supabase
          .from('users')
          .update({ balance: newBalance, lastWheelSpin: newLastSpin })
          .eq('id', currentUser.id);
        if (!error) {
          setCurrentUser({ ...currentUser, balance: newBalance, lastWheelSpin: newLastSpin });
        }
      }
    };
    animateWheel();
  };

  if (!canSpinWheel() && wheelReward === null) {
    return (
      <div className="bg-gray-800 p-4 rounded text-center text-gray-400 mb-4">
        ⏰ Free spin available tomorrow!
      </div>
    );
  }

  return (
    <div className="mb-4">
      {!wheelSpinning && wheelReward === null && (
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
            <div className="absolute top-0 z-10 text-2xl">▼</div>
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
            <div className="text-3xl -mt-2 text-gray-600">║</div>
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
    </div>
  );
};

export default WheelSpin;
