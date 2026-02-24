import React, { useState, useEffect } from 'react';
import socket from './socket';

function App() {
  const [matches, setMatches] = useState([]);
  const [timer, setTimer] = useState(0);

  // זיהוי הפרמטר מהכתובת עבור OBS
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');

  useEffect(() => {
    socket.on('updateData', (data) => {
      setMatches(data.matches);
      setTimer(data.timer);
    });
    return () => socket.off('updateData');
  }, []);

  const handleStartTimer = () => socket.emit('startTimer');
  const handleStopTimer = () => socket.emit('stopTimer');
  const handleResetTimer = () => socket.emit('resetTimer');

  const updateKills = (matchId, teamIndex, kills) => {
    socket.emit('updateMatch', { matchId, teamIndex, kills: parseInt(kills) || 0 });
  };

  // --- תצוגת OBS: טיימר בלבד ---
  if (view === 'timer') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="bg-black/80 p-6 rounded-2xl border-2 border-orange-500">
          <div className="text-7xl font-mono font-black text-orange-500 tracking-tighter">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    );
  }

  // --- תצוגת OBS: טבלת משחקים (Bracket) בלבד ---
  if (view === 'bracket') {
    return (
      <div className="p-4 bg-transparent">
        <div className="grid grid-cols-2 gap-4">
          {matches.map((m) => (
            <div key={m.id} className="bg-slate-900/90 border border-orange-500/50 p-4 rounded-xl text-white shadow-2xl">
              <div className="text-orange-500 font-black mb-2 border-b border-orange-500/20 pb-1">MATCH {m.id}</div>
              {m.teams.map((t, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-800 last:border-0">
                  <span className="font-bold text-slate-200">TEAM {t.id}</span>
                  <span className="text-orange-400 font-mono font-bold">{t.kills} KILLS</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- לוח הבקרה המלא (התצוגה הרגילה שלך) ---
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans" dir="rtl">
      {/* כותרת וניהול טיימר */}
      <header className="flex justify-between items-center mb-8 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <h1 className="text-3xl font-black italic text-orange-500 tracking-tighter">TIGER CMS PRO</h1>
        <div className="flex gap-3">
          <button onClick={handleStartTimer} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20">START</button>
          <button onClick={handleStopTimer} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20">STOP</button>
          <button onClick={handleResetTimer} className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-xl font-bold transition-all">RESET</button>
        </div>
      </header>

      {/* תצוגת טיימר מרכזית */}
      <div className="flex justify-center mb-10">
        <div className="bg-slate-900 p-10 rounded-[40px] border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="text-9xl font-mono font-black text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* רשת המשחקים - 4 משחקים, 4 קבוצות בכל אחד */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {matches.map((match) => (
          <div key={match.id} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-400 italic">MATCH #{match.id}</h3>
              <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/20">ACTIVE</span>
            </div>
            
            <div className="space-y-4">
              {match.teams.map((team, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/50">
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 font-bold block mb-1">IDENTIFIER</span>
                    <span className="font-black text-orange-500">TEAM {team.id}</span>
                  </div>
                  <div className="w-32">
                    <span className="text-xs text-slate-500 font-bold block mb-1 text-center">KILLS</span>
                    <input
                      type="number"
                      value={team.kills}
                      onChange={(e) => updateKills(match.id, idx, e.target.value)}
                      className="bg-slate-900 border-2 border-slate-800 rounded-xl p-2 w-full text-center font-mono text-2xl text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;