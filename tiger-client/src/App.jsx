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
  Trash as LucideTrash, // תיקון התנגשות שמות
  Lock as LucideLock,   // תיקון התנגשות שמות
  Settings, 
  Layout 
} from 'lucide-react';

const PLACEMENT_POINTS = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1, 
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

// --- רכיבי עזר לתצוגות OBS ---

const TimerOverlay = ({ timer }) => (
  <div className="min-h-screen flex items-center justify-center bg-transparent">
    <div className="bg-black/90 border-4 border-orange-500 px-12 py-6 rounded-3xl shadow-2xl">
      <span className="text-9xl font-mono font-black text-white">
        {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
      </span>
    </div>
  </div>
);

const StatusOverlay = ({ gameState }) => {
  const isTeamDead = (team) => team.players.every(p => p.status === 'Dead');
  const sortedTeams = [...gameState.teams].sort((a, b) => {
    const aDead = isTeamDead(a);
    const bDead = isTeamDead(b);
    if (aDead && !bDead) return 1;
    if (!aDead && bDead) return -1;
    return (b.totalTournamentScore + b.currentGameKills) - (a.totalTournamentScore + a.currentGameKills);
  });

  return (
    <div className="min-h-screen bg-transparent p-0 font-sans overflow-hidden" dir="rtl">
      <div className="absolute top-4 right-4 w-80 flex flex-col gap-1.5">
        {sortedTeams.map((team, index) => {
          const dead = isTeamDead(team);
          return (
            <div key={team.id} className={`flex items-center border-r-[4px] h-12 transition-all ${
              dead ? 'bg-slate-800/90 border-slate-600 opacity-60' : 'bg-slate-900/95 border-orange-500'
            }`}>
              <div className={`font-black w-10 h-full flex items-center justify-center text-base italic ${
                dead ? 'bg-slate-700 text-slate-400' : 'bg-orange-500 text-black'
              }`}>{index + 1}</div>
              <div className="flex-1 px-5 flex justify-between items-center text-white">
                <span className={`font-black uppercase italic text-xs truncate w-24 pr-1 ${dead ? 'text-slate-400' : 'text-white'}`}>{team.name}</span>
                <span className="text-lg font-black italic">{team.totalTournamentScore + team.currentGameKills}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TableOverlay = ({ teams }) => {
  const sorted = [...teams].sort((a, b) => (b.totalTournamentScore + b.currentGameKills) - (a.totalTournamentScore + a.currentGameKills));
  return (
    <div className="min-h-screen bg-slate-950/80 p-10 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto bg-blue-900/90 rounded-3xl border-b-8 border-blue-500 shadow-2xl overflow-hidden">
        <div className="bg-blue-600 py-6 text-center text-white italic font-black text-4xl">LEADERBOARD</div>
        <table className="w-full text-right text-white">
          <thead>
            <tr className="bg-blue-800/50 h-16 text-blue-200 uppercase font-black">
              <th className="p-4">#</th><th className="p-4">Team</th><th className="p-4 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={t.id} className="border-b border-blue-800/30 h-16 font-bold">
                <td className="p-4 text-blue-400">#{i + 1}</td>
                <td className="p-4 uppercase">{t.name}</td>
                <td className="p-4 text-center text-yellow-400 text-2xl">{t.totalTournamentScore + t.currentGameKills}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- קומפוננטה ראשית ---

function App() {
  const [internalView, setInternalView] = useState('admin'); 
  const [gameState, setGameState] = useState({ 
    teams: [], 
    timer: { minutes: 20, seconds: 0, isRunning: false } 
  });
  const fileInputRef = useRef(null);
  const [selectedTeamForLogo, setSelectedTeamForLogo] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const urlView = params.get('view');

  useEffect(() => {
    socket.on('gameState', (data) => setGameState(data));
    return () => socket.off('gameState');
  }, []);

  const addTeam = () => {
    if (gameState.teams.length >= 16) return alert("מקסימום 16 קבוצות");
    const name = window.prompt("שם קבוצה:");
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
    const killerNum = window.prompt("מספר הקבוצה שהרגה? (השאר ריק אם לא ידוע)");
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

  const activeView = urlView || internalView;

  if (activeView === 'timer') return <TimerOverlay timer={gameState.timer} />;
  if (activeView === 'leaderboard') return <StatusOverlay gameState={gameState} />;
  if (activeView === 'summary') return <TableOverlay teams={gameState.teams} />;

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
        <h1 className="text-3xl font-black italic text-orange-500 uppercase">Tiger CMS Pro</h1>
        <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-xl">
           <button onClick={() => socket.emit('updateState', {...gameState, timer: {...gameState.timer, isRunning: !gameState.timer.isRunning}})} className="text-orange-500">
              {gameState.timer.isRunning ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}
           </button>
           <span className="text-2xl font-mono font-bold text-orange-400">{String(gameState.timer.minutes).padStart(2, '0')}:{String(gameState.timer.seconds).padStart(2, '0')}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setInternalView('timer')} className="bg-slate-800 p-3 rounded-xl text-[9px] font-bold flex flex-col items-center gap-1 w-16"><Monitor size={16}/> TIMER</button>
          <button onClick={() => setInternalView('leaderboard')} className="bg-orange-800 p-3 rounded-xl text-[9px] font-bold flex flex-col items-center gap-1 w-16"><Layout size={16}/> STATUS</button>
          <button onClick={() => setInternalView('summary')} className="bg-blue-800 p-3 rounded-xl text-[9px] font-bold flex flex-col items-center gap-1 w-16"><Trophy size={16}/> TABLE</button>
          <button onClick={addTeam} className="bg-orange-600 px-6 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Plus size={24} strokeWidth={3} /> TEAM</button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 overflow-y-auto max-h-[70vh]">
        {gameState.teams.map(team => {
          const isEliminated = team.players.every(p => p.status === 'Dead');
          return (
            <div key={team.id} className={`bg-slate-900/50 border ${isEliminated ? 'border-red-900/50 grayscale-[0.5]' : 'border-slate-800'} p-4 rounded-[2rem] relative shadow-2xl transition-all`}>
              <div className="bg-orange-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black mb-2 mx-auto">{team.displayNum}</div>
              <div className="flex justify-between items-center mb-3">
                <div onClick={() => { setSelectedTeamForLogo(team.id); fileInputRef.current.click(); }} className="w-10 h-10 bg-slate-800 rounded-xl border-2 border-slate-700 overflow-hidden cursor-pointer hover:border-orange-500 shrink-0 flex items-center justify-center">
                  {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={16} className="text-slate-600"/>}
                </div>
                <h2 className="text-[11px] font-black uppercase truncate flex-1 px-2">{team.name}</h2>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {team.players.map((p, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => t.id === team.id ? {...t, players: t.players.map((pl, idx) => idx === i ? {status: 'Alive'} : pl)} : t)})} className={`text-[8px] py-1.5 rounded font-black transition-all ${p.status === 'Alive' ? 'bg-emerald-600' : 'bg-slate-800 text-slate-500'}`}>A</button>
                    <button onClick={() => handlePlayerDeath(team.id, i)} className={`text-[8px] py-1.5 rounded font-black transition-all ${p.status === 'Dead' ? 'bg-red-600' : 'bg-slate-800 text-slate-500'}`}>D</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-slate-800/80 py-1.5 text-center rounded-xl font-mono text-blue-400 font-black text-[10px]">TOTAL: {team.totalTournamentScore + team.currentGameKills}</div>
              </div>
              {/* שימוש באייקון הנעילה עם השם החדש כדי למנוע קריסה */}
              <div className="absolute top-2 right-2 opacity-10"><LucideLock size={10}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;