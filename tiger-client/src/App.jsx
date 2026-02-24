import React, { useState, useEffect, useRef } from 'react';
import socket from './socket';
import { Plus, Trash2, Play, Pause, RotateCcw, Monitor, Trophy, Image as ImageIcon, RotateCw, Trash, Lock, Settings, Layout } from 'lucide-react';

const PLACEMENT_POINTS = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1, 
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

// --- רכיבי עזר לתצוגות OBS ---

const TimerOverlay = ({ timer }) => (
  <div className="min-h-screen flex items-start justify-center p-10 bg-transparent">
    <div className="bg-black/90 border-4 border-orange-500 px-12 py-4 rounded-3xl shadow-[0_0_30px_rgba(249,115,22,0.5)]">
      <span className="text-7xl font-mono font-black text-white tracking-tighter">
        {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
      </span>
    </div>
  </div>
);

const OrangeLeaderboard = ({ gameState }) => {
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
            <div key={team.id} className={`flex items-center border-r-[4px] shadow-2xl skew-x-[-12deg] h-12 transition-all duration-500 ${
              dead ? 'bg-slate-800/90 border-slate-600 opacity-60 grayscale' : 'bg-slate-900/95 border-orange-500'
            }`}>
              <div className={`font-black w-10 h-full flex items-center justify-center skew-x-[12deg] text-base italic shrink-0 ${
                dead ? 'bg-slate-700 text-slate-400' : 'bg-orange-500 text-black shadow-[5px_0_15px_rgba(249,115,22,0.3)]'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 px-5 py-1 skew-x-[12deg] flex justify-between items-center text-white overflow-visible">
                <div className="flex items-center gap-3 overflow-visible">
                  <div className="w-7 h-7 bg-slate-800 rounded border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                    {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover" /> : <span className="text-[6px] text-slate-600 font-black italic">TIGER</span>}
                  </div>
                  <div className="flex flex-col leading-none overflow-visible items-start">
                    <span className={`font-black uppercase italic text-xs tracking-tight truncate w-24 pr-1 text-right ${dead ? 'text-slate-400' : 'text-white'}`}>
                      {team.name}
                    </span>
                    <div className="flex gap-1 mt-1">
                      {team.players.map((p, i) => (
                        <div key={i} className={`w-3 h-1.5 rounded-sm shadow-sm ${
                          p.status === 'Alive' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 
                          p.status === 'Knock' ? 'bg-amber-500 animate-pulse' : 
                          'bg-red-600 opacity-20'
                        }`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 mr-1">
                   <div className="flex flex-col items-center leading-none opacity-50">
                      <span className="text-[7px] font-black uppercase text-slate-400">ELIMS</span>
                      <span className="text-[11px] font-bold font-mono">{team.currentGameKills}</span>
                   </div>
                   <div className="w-px h-7 bg-slate-700/50" />
                   <div className="flex flex-col items-end leading-none pr-1">
                      <span className={`text-[7px] font-black uppercase ${dead ? 'text-slate-500' : 'text-orange-400'}`}>TOTAL</span>
                      <span className="text-lg font-black italic leading-none text-white drop-shadow-md">{team.totalTournamentScore + team.currentGameKills}</span>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BlueSummaryOverlay = ({ teams }) => {
  const sorted = [...teams].sort((a, b) => (b.totalTournamentScore + b.currentGameKills) - (a.totalTournamentScore + a.currentGameKills));
  return (
    <div className="min-h-screen bg-[#020617] p-10 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto bg-blue-900/90 border-t-8 border-blue-400 rounded-b-3xl shadow-2xl overflow-hidden shadow-[0_0_50px_rgba(30,58,138,0.5)]">
        <div className="bg-blue-600 py-6 text-center text-white border-b border-blue-400/30">
          <h1 className="text-4xl font-black italic uppercase tracking-widest drop-shadow-lg">Tournament Leaderboard</h1>
        </div>
        <table className="w-full text-right text-white">
          <thead>
            <tr className="bg-blue-800/50 text-blue-200 uppercase text-sm font-black h-14 border-b border-blue-700">
              <th className="p-4 pr-10">#</th>
              <th className="p-4">Team</th>
              <th className="p-4 text-center">Current Kills</th>
              <th className="p-4 text-center">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={t.id} className="border-b border-blue-800/30 hover:bg-blue-700/40 h-16 transition-all">
                <td className="p-4 pr-10 font-black text-blue-400 italic text-3xl">#{i + 1}</td>
                <td className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg border border-blue-400/30 overflow-hidden shadow-inner flex items-center justify-center">
                    {t.logoUrl ? <img src={t.logoUrl} className="w-full h-full object-cover" /> : <div className="text-[8px] text-slate-500">TIGER</div>}
                  </div>
                  <span className="font-black text-2xl uppercase italic tracking-tighter">{t.name}</span>
                </td>
                <td className="p-4 text-center font-mono text-2xl font-bold text-blue-200">{t.currentGameKills}</td>
                <td className="p-4 text-center font-black text-4xl text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">{t.totalTournamentScore + t.currentGameKills}</td>
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
  const [view, setView] = useState('admin'); 
  const [gameState, setGameState] = useState({ 
    teams: [], 
    timer: { minutes: 20, seconds: 0, isRunning: false } 
  });
  const fileInputRef = useRef(null);
  const [selectedTeamForLogo, setSelectedTeamForLogo] = useState(null);

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

  if (view === 'timer') return <TimerOverlay timer={gameState.timer} />;
  if (view === 'leaderboard') return <OrangeLeaderboard gameState={gameState} />;
  if (view === 'summary') return <BlueSummaryOverlay teams={gameState.teams} />;

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
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-black italic text-orange-500 uppercase tracking-tighter">Tiger CMS Pro</h1>
          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-xl">
             <button onClick={() => {
               const m = prompt("הגדר דקות לטיימר:", gameState.timer.minutes);
               if(m) socket.emit('updateState', {...gameState, timer: {minutes: parseInt(m), seconds: 0, isRunning: false}});
             }} className="text-slate-500 hover:text-white"><Settings size={18}/></button>
             <button onClick={() => socket.emit('updateState', {...gameState, timer: {...gameState.timer, isRunning: !gameState.timer.isRunning}})} className="text-orange-500">
                {gameState.timer.isRunning ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}
             </button>
             <span className="text-2xl font-mono font-bold text-orange-400">{String(gameState.timer.minutes).padStart(2, '0')}:{String(gameState.timer.seconds).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setView('timer')} className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-[9px] font-bold flex flex-col items-center gap-1 w-16"><Monitor size={16}/> TIMER</button>
          <button onClick={() => setView('leaderboard')} className="bg-orange-800 hover:bg-orange-700 p-3 rounded-xl text-[9px] font-bold flex flex-col items-center gap-1 w-16"><Layout size={16}/> ORANGE</button>
          <button onClick={() => setView('summary')} className="bg-blue-800 hover:bg-blue-700 p-3 rounded-xl text-[9px] font-bold flex flex-col items-center gap-1 w-16"><Trophy size={16}/> BLUE BOARD</button>
          <div className="w-px bg-slate-800 mx-2" />
          <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => ({...t, currentGameKills: 0, placement: 0, players: Array(4).fill({status: 'Alive'})})), timer: {...gameState.timer, isRunning: false}})} className="bg-emerald-700 hover:bg-emerald-600 px-4 rounded-xl text-[9px] font-bold flex flex-col justify-center items-center gap-1"><RotateCw size={16}/> NEXT MATCH</button>
          <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => ({...t, totalTournamentScore: 0, currentGameKills: 0}))})} className="bg-amber-700 hover:bg-amber-600 px-4 rounded-xl text-[9px] font-bold flex flex-col justify-center items-center gap-1"><RotateCcw size={16}/> RESET SCORE</button>
          <button onClick={() => {if(confirm("מחיקת הכל?")) socket.emit('updateState', {teams: [], timer: {minutes: 20, seconds: 0, isRunning: false}})}} className="bg-red-900 hover:bg-red-800 px-4 rounded-xl text-[9px] font-bold flex flex-col justify-center items-center gap-1"><Trash size={16}/> DELETE ALL</button>
          <button onClick={addTeam} className="bg-orange-600 hover:bg-orange-500 px-6 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Plus size={24} strokeWidth={3} /> TEAM</button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 overflow-y-auto max-h-[70vh]">
        {gameState.teams.map(team => {
          const isEliminated = team.players.every(p => p.status === 'Dead');
          return (
            <div key={team.id} className={`bg-slate-900/50 border ${isEliminated ? 'border-red-900/50 grayscale-[0.5]' : 'border-slate-800'} p-4 rounded-[2rem] relative shadow-2xl transition-all hover:border-orange-500/30`}>
              <div className="bg-orange-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-md border border-white/10 mb-2 mx-auto">
                {team.displayNum}
              </div>

              <div className="flex justify-between items-center mb-3">
                <div onClick={() => { setSelectedTeamForLogo(team.id); fileInputRef.current.click(); }} className="w-10 h-10 bg-slate-800 rounded-xl border-2 border-slate-700 overflow-hidden cursor-pointer hover:border-orange-500 shrink-0 flex items-center justify-center">
                  {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-slate-600"/>}
                </div>
                <h2 className="text-[11px] font-black uppercase truncate flex-1 px-2">{team.name}</h2>
                <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.filter(t=>t.id!==team.id)})} className="text-slate-700 hover:text-red-500"><Trash2 size={14}/></button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {team.players.map((p, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => t.id === team.id ? {...t, players: t.players.map((pl, idx) => idx === i ? {status: 'Alive'} : pl)} : t)})} className={`text-[8px] py-1.5 rounded font-black transition-all ${p.status === 'Alive' ? 'bg-emerald-600' : 'bg-slate-800 text-slate-500'}`}>A</button>
                    <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => t.id === team.id ? {...t, players: t.players.map((pl, idx) => idx === i ? {status: 'Knock'} : pl)} : t)})} className={`text-[8px] py-1.5 rounded font-black transition-all ${p.status === 'Knock' ? 'bg-amber-500' : 'bg-slate-800 text-slate-500'}`}>K</button>
                    <button onClick={() => handlePlayerDeath(team.id, i)} className={`text-[8px] py-1.5 rounded font-black transition-all ${p.status === 'Dead' ? 'bg-red-600' : 'bg-slate-800 text-slate-500'}`}>D</button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <div className={`flex items-center justify-between p-2 rounded-xl border ${isEliminated ? 'bg-red-950/20 border-red-900/20' : 'bg-black/40 border-white/5'}`}>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-black">Kills: <span className="text-white text-sm ml-1 font-mono">{team.currentGameKills}</span></span>
                  <div className="flex gap-1">
                    <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => t.id === team.id ? {...t, currentGameKills: Math.max(0, t.currentGameKills - 1)} : t)})} className="w-7 h-7 bg-slate-800 rounded-lg hover:bg-slate-700">-</button>
                    <button onClick={() => socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => (t.id === team.id && !isEliminated) ? {...t, currentGameKills: t.currentGameKills + 1} : t)})} disabled={isEliminated} className={`w-7 h-7 rounded-lg font-black text-white ${isEliminated ? 'bg-slate-700 opacity-30 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{isEliminated ? <Lock size={10} className="m-auto"/> : '+'}</button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                   <button onClick={() => {
                     const rank = prompt("בחר מיקום (1-16):");
                     const rankNum = parseInt(rank);
                     if (isNaN(rankNum) || rankNum < 1 || rankNum > 16) return;
                     socket.emit('updateState', {...gameState, teams: gameState.teams.map(t => t.id === team.id ? {...t, placement: rankNum, totalTournamentScore: t.totalTournamentScore + PLACEMENT_POINTS[rankNum]} : t)});
                   }} className="bg-blue-900/40 border border-blue-500/30 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-tighter hover:bg-blue-800/40">{team.placement > 0 ? `RANK #${team.placement}` : 'SET RANK'}</button>
                   <div className="bg-slate-800/80 py-1.5 text-center rounded-xl font-mono text-blue-400 font-black text-[10px] shadow-inner border border-white/5">TOTAL: {team.totalTournamentScore + team.currentGameKills}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;