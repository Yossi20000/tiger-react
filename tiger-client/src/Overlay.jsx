import React, { useState, useEffect } from 'react';
import socket from './socket';

function Overlay() {
  const [gameState, setGameState] = useState({ teams: [], timer: { minutes: 0, seconds: 0 } });

  useEffect(() => {
    socket.on('gameState', (data) => setGameState(data));
    return () => socket.off('gameState');
  }, []);

  // מיון הקבוצות לפי מספר הריגות (Eliminations)
  const sortedTeams = [...gameState.teams].sort((a, b) => b.currentGameKills - a.currentGameKills);

  return (
    <div className="min-h-screen bg-transparent p-10 font-sans" dir="rtl">
      {/* טיימר עליון מעוצב */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/80 border-2 border-orange-500 px-8 py-2 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)]">
        <span className="text-4xl font-mono font-black text-white tracking-widest">
          {String(gameState.timer.minutes).padStart(2, '0')}:{String(gameState.timer.seconds).padStart(2, '0')}
        </span>
      </div>

      {/* טבלת לידרבורד צדדית */}
      <div className="absolute top-32 right-10 w-80 flex flex-col gap-2">
        <div className="bg-orange-600 text-white font-black italic px-4 py-1 skew-x-[-12deg] mb-2 text-center uppercase tracking-tighter">
          Leaderboard
        </div>
        
        {sortedTeams.map((team, index) => (
          <div key={team.id} className="flex items-center bg-slate-900/90 border-r-4 border-orange-500 overflow-hidden skew-x-[-12deg] shadow-lg">
            <div className="bg-orange-500 text-black font-black w-10 py-2 text-center skew-x-[12deg]">
              {index + 1}
            </div>
            <div className="flex-1 px-4 skew-x-[12deg] flex justify-between items-center">
              <span className="text-white font-bold uppercase truncate w-32">{team.name}</span>
              <span className="text-orange-400 font-black">{team.currentGameKills}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Overlay;