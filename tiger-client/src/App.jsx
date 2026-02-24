import React, { useState, useEffect, useRef } from 'react';
import socket from './socket';
import { 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw, 
  Monitor, 
  Trophy, 
  Image as ImageIcon, 
  RotateCw, 
  Trash as TrashIcon, 
  Lock as LockIcon, 
  Settings, 
  Layout 
} from 'lucide-react';

const PLACEMENT_POINTS = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1, 
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

// --- 1. דף טיימר נקי ל-OBS ---
const TimerPage = ({ timer }) => (
  <div className="min-h-screen flex items-center justify-center bg-transparent">
    <div className="bg-black/90 border-4 border-orange-500 px-12 py-6 rounded-[3rem] shadow-[0_0_50px_rgba(249,115,22,0.6)]">
      <span className="text-9xl font-mono font-black text-white tracking-tighter">
        {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
      </span>
    </div>
  </div>
);

// --- 2. דף סטטוס (Leaderboard) ל-OBS ---
const StatusPage = ({ gameState }) => {
  const isTeamDead = (team) => team.players.every(p => p.status === 'Dead');
  const sortedTeams = [...gameState.teams].sort((a, b) => {
    const aDead = isTeamDead(a);
    const bDead = isTeamDead(b);
    if (aDead && !bDead) return 1;
    if (!aDead && bDead) return -1;
    return (b.totalTournamentScore + b.currentGameKills) - (a.totalTournamentScore + a.currentGameKills);
  });

  return (
    <div className="min-h-screen bg-transparent p-4 font-sans" dir="rtl">
      <div className="absolute top-10 right-10 w-96 flex flex-col gap-2">
        {sortedTeams.map((team, index) => {
          const dead = isTeamDead(team);
          return (
            <div key={team.id} className={`flex items-center border-r-[6px] h-14 skew-x-[-15deg] transition-all duration-700 ${dead ? 'bg-slate-900/80 border-slate-700 opacity-50' : 'bg-slate-950/95 border-orange-500 shadow-xl'}`}>
              <div className={`w-12 h-full flex items-center justify-center skew-x-[15deg] font-black italic ${dead ? 'bg-slate-800 text-slate-500' : 'bg-orange-500 text-black'}`}>{index + 1}</div>
              <div className="flex-1 px-4 flex justify-between items-center text-white skew-x-[15deg]">
                <span className={`font-black uppercase truncate w-32 ${dead ? 'text-slate-500' : 'text-white'}`}>{team.name}</span>
                <span className="text-xl font-mono font-bold text-orange-400">{team.totalTournamentScore + team.currentGameKills}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- 3. דף טבלה סיכום (Blue Board) ל-OBS ---
const TablePage = ({ teams }) => {
  const sorted = [...teams].sort((a, b) => (b.totalTournamentScore + b.currentGameKills) - (a.totalTournamentScore + a.currentGameKills));
  return (
    <div className="min-h-screen bg-slate-950/50 p-10 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto bg-blue-900/90 rounded-[3rem] border-b-[12px] border-blue-500 shadow-2xl overflow-hidden">
        <div className="bg-blue-600 py-8 text-center text-white italic font-black text-5xl tracking-widest uppercase">Leaderboard</div>
        <table className="w-full text-right text-white text-2xl">
          <thead className="bg-blue-800/50 h-20 text-blue-200 uppercase font-black">
            <tr><th className="p-6">#</th><th className="p-6">Team</th><th className="p-6 text-center">Kills</th><th className="p-6 text-center">Points</th></tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={t.id} className="border-b border-blue-800/30 h-20 font-bold">
                <td className="p-6 text-blue-400 text-4xl italic">#{i + 1}</td>
                <td className="p-6 uppercase">{t.name}</td>
                <td className="p-6 text-center font-mono">{t.currentGameKills}</td>
                <td className="p-6 text-center text-yellow-400 text-5xl font-black">{t.totalTournamentScore + t.currentGameKills}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function App() {
  const [internalView, setInternalView] = useState('admin'); 
  const [gameState, setGameState] = useState({ 
    teams: [], 
    timer: { minutes: 20, seconds: 0, isRunning: false } 
  });
  const fileInputRef = useRef(null);
  const [selectedTeamForLogo, setSelectedTeamForLogo] = useState(null);

  // זיהוי קישור לפי URL
  const params = new URLSearchParams(window.location.search);
  const urlView = params.get('view');

  useEffect(() => {
    socket.on('gameState', (data) => setGameState(data));
    return () => socket.off('gameState');
  }, []);

  const addTeam = () => {
    if (gameState.teams.length >= 16) return alert("מקסימום 16 קבוצות");
    const name = prompt("שם קבוצה:");
    if (!name) return;
    const newTeam = { 
      id: Date.now().toString(), 
      displayNum: gameState.teams.length + 1,
      name, logoUrl: '', currentGameKills: 0, 
      totalTournamentScore: 0, placement: 0, players: Array(4).fill({ status: 'Alive' }) 
    };
    socket.emit('updateState', { ...gameState, teams: [...gameState.teams, newTeam] });
  };

  const handlePlayerDeath = (deadTeamId, playerIdx) => {
    const killerNum = prompt("מספר הקבוצה שהרגה? (השאר ריק אם לא ידוע)");
    let updatedTeams = gameState.teams.map(t => {
      if (t.id === deadTeamId) {
        const newPlayers = [...t.players];
        newPlayers[playerIdx] = { status: 'Dead' };
        return { ...t, players: newPlayers };
      }
      return t;
    });
    if (killerNum) {
      updatedTeams = updatedTeams.map(t => {
        const isEliminated = t.players.every(p => p.status === 'Dead');
        if (t.displayNum === parseInt(killerNum) && !isEliminated) {
          return { ...t, currentGameKills: t.currentGameKills + 1 };
        }
        return t;
      });
    }
    socket.emit('updateState', { ...gameState, teams: updatedTeams });
  };

  // בחירת תצוגה
  const currentView = urlView || internalView;
  if (currentView === 'timer') return <TimerPage timer={gameState.timer} />;
  if (currentView === 'status') return <StatusPage gameState={gameState} />;
  if (currentView === 'table') return <TablePage teams={gameState.teams} />;

  // לוח בקרה (Admin)
  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 font-sans select-none" dir="rtl">
      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
        const file = e.target.files[0];
        if (file && selectedTeamForLogo) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const updated = gameState.teams.map(t => t.id === selectedTeamForLogo ? { ...t, logoUrl: reader.result } : t);
            socket.emit('updateState', { ...gameState, teams: updated });
          };
          reader.readAsDataURL(file);
        }
      }} accept="image/*" />
      
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-black italic text-orange-500">Tiger CMS Pro</h1>
        <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
           <button onClick={() => socket.emit('updateState', {...gameState, timer: {...gameState.timer, isRunning: !gameState.timer.isRunning}})} className="text-orange-500">
              {gameState.timer.isRunning ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}
           </button>
           <span className="text-2xl font-mono font-bold text-orange-400">{String(gameState.timer.minutes).padStart(2, '0')}:{String(gameState.timer.seconds).padStart(2, '0')}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setInternalView('timer')} className="bg-slate-800 p-3 rounded-xl text-[9px] font-bold flex flex-col items-center gap-1 w-16"><Monitor size={16}/> TIMER</button>
          <button onClick={() => setInternalView('status')} className="bg-orange-800 p-3 rounded-xl text-[9px] font-bold flex flex-col items-center gap-1 w-16"><Layout size={16}/> STATUS</button>
          <button onClick={() => setInternalView('table')} className="bg-blue-800 p-3 rounded-xl text-[9px] font-bold flex flex-col items-center gap-1 w-16"><Trophy size={16}/> TABLE</button>
          <button onClick={addTeam} className="bg-orange-600 px-6 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Plus size={24} strokeWidth={3} /> TEAM</button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 overflow-y-auto max-h-[70vh]">
        {gameState.teams.map(team => {
          const isEliminated = team.players.every(p => p.status === 'Dead');
          return (
            <div key={team.id} className={`bg-slate-900/50 border ${isEliminated ? 'border-red-900/50 grayscale-[0.5]' : 'border-slate-800'} p-4 rounded-[2rem] relative shadow-2xl`}>
              <div className="bg-orange-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black mb-2 mx-auto">{team.displayNum}</div>
              <div className="flex justify-between items-center mb-3">
                <div onClick={() => { setSelectedTeamForLogo(team.id); fileInputRef.current.click(); }} className="w-10 h-10 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
                  {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={16} className="text-slate-600"/>}
                </div>
                <h2 className="text-[11px] font-black uppercase truncate flex-1 px-2">{team.name}</h2>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {team.players.map((p, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => t.id === team.id ? {...t, players: t.players.map((pl, idx) => idx === i ? {status: 'Alive'} : pl)} : t)})} className={`text-[8px] py-1.5 rounded font-black ${p.status === 'Alive' ? 'bg-emerald-600' : 'bg-slate-800 text-slate-500'}`}>A</button>
                    <button onClick={() => handlePlayerDeath(team.id, i)} className={`text-[8px] py-1.5 rounded font-black ${p.status === 'Dead' ? 'bg-red-600' : 'bg-slate-800 text-slate-500'}`}>D</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-black/40">
                  <span className="text-[9px] font-black uppercase text-slate-400">Kills: <span className="text-white text-sm ml-1 font-mono">{team.currentGameKills}</span></span>
                  <div className="flex gap-1">
                    <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => t.id === team.id ? {...t, currentGameKills: Math.max(0, t.currentGameKills - 1)} : t)})} className="w-7 h-7 bg-slate-800 rounded-lg">-</button>
                    <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => (t.id === team.id && !isEliminated) ? {...t, currentGameKills: t.currentGameKills + 1} : t)})} disabled={isEliminated} className={`w-7 h-7 rounded-lg font-black text-white ${isEliminated ? 'bg-slate-700 opacity-30' : 'bg-emerald-600'}`}>{isEliminated ? <LockIcon size={10} className="m-auto"/> : '+'}</button>
                  </div>
                </div>
                <div className="bg-slate-800/80 py-1.5 text-center rounded-xl font-mono text-blue-400 font-black text-[10px]">TOTAL: {team.totalTournamentScore + team.currentGameKills}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;