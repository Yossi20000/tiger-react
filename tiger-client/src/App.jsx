import React, { useState, useEffect } from 'react';
import socket from './socket';

function App() {
  const [matches, setMatches] = useState([]);
  const [timer, setTimer] = useState(0);

  // זיהוי הפרמטר מהכתובת עבור ה-OBS
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

  // --- תצוגות OBS נפרדות (יוצגו רק אם הקישור כולל ?view=) ---
  
  if (view === 'timer') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="bg-black/80 p-10 rounded-3xl border-4 border-orange-500 shadow-2xl">
          <div className="text-9xl font-mono font-black text-orange-500">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'bracket') {
    return (
      <div className="p-6 bg-transparent">
        <div className="grid grid-cols-2 gap-6">
          {matches.map((m) => (
            <div key={m.id} className="bg-slate-900/95 border-2 border-orange-500 p-5 rounded-2xl shadow-2xl text-white">
              <div className="text-orange-500 font-black text-2xl mb-4 border-b border-orange-500/30 pb-2 italic">MATCH #{m.id}</div>
              {m.teams.map((t, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                  <span className="font-bold text-xl">TEAM {t.id}</span>
                  <span className="bg-orange-600 text-black font-black px-4 py-1 rounded font-mono text-xl">{t.kills}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- לוח הבקרה המקורי (זה מה שתראה בקישור הרגיל) ---
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans" dir="rtl">
      <header className="flex justify-between items-center mb-8 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
        <h1 className="text-3xl font-black italic text-orange-500 tracking-tighter">TIGER CMS PRO</h1>
        <div className="flex gap-4">
          <button onClick={handleStartTimer} className="bg-green-600 hover:bg-green-700 px-8 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95">START</button>
          <button onClick={handleStopTimer} className="bg-red-600 hover:bg-red-700 px-8 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95">STOP</button>
          <button onClick={handleResetTimer} className="bg-slate-700 hover:bg-slate-600 px-8 py-2 rounded-xl font-bold transition-all">RESET</button>
        </div>
      </header>

      <div className="flex justify-center mb-10">
        <div className="bg-slate-900 p-12 rounded-[50px] border-8 border-slate-800 shadow-2xl">
          <div className="text-[10rem] leading-none font-mono font-black text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {matches.map((match) => (
          <div key={match.id} className="bg-slate-900 rounded-[35px] p-8 border border-slate-800 shadow-xl">
            <h3 className="text-2xl font-black text-slate-500 mb-6 italic">MATCH #{match.id}</h3>
            <div className="space-y-4">
              {match.teams.map((team, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/50">
                  <div className="flex-1">
                    <span className="font-black text-orange-500 text-xl">TEAM {team.id}</span>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={team.kills}
                      onChange={(e) => updateKills(match.id, idx, e.target.value)}
                      className="bg-slate-900 border-2 border-slate-800 rounded-xl p-2 w-full text-center font-mono text-3xl text-white focus:border-orange-500 outline-none transition-all"
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