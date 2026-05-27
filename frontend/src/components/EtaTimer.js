'use client';
import { useState, useEffect } from 'react';

export default function EtaTimer({ etaMinutes = 15, donorName = 'Donor' }) {
  const [secondsLeft, setSecondsLeft] = useState(etaMinutes * 60);

  useEffect(() => {
    setSecondsLeft(etaMinutes * 60);
  }, [etaMinutes]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = 1 - secondsLeft / (etaMinutes * 60);
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#etaGradient)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} className="transition-all duration-1000" />
          <defs>
            <linearGradient id="etaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{mins}:{secs.toString().padStart(2, '0')}</span>
          <span className="text-[10px] text-gray-400 uppercase">ETA</span>
        </div>
      </div>
      <p className="text-sm text-gray-400">{donorName} en route</p>
    </div>
  );
}
