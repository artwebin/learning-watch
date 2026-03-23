import React, { useState } from 'react';
import { registerStudent, loginStudent } from '../lib/supabaseClient';
import type { GameState } from '../hooks/useGameState';
import type { Phase } from '../engine/gameEngine';
import '../index.css';

interface Props {
  onStart: (loadedState: Partial<GameState> & { playerName: string }) => void;
}

type Mode = 'choose' | 'register' | 'login';
type Status = 'idle' | 'loading' | 'error';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '1rem 1.5rem',
  fontSize: '1.2rem',
  borderRadius: '16px',
  border: '2px solid rgba(0,0,0,0.1)',
  outline: 'none',
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 700,
  boxSizing: 'border-box',
};

export const StartScreen: React.FC<Props> = ({ onStart }) => {
  const [mode, setMode] = useState<Mode>('choose');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const reset = (newMode: Mode) => {
    setMode(newMode);
    setErrorMsg('');
    setSuggestions([]);
    setStatus('idle');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    setSuggestions([]);
    try {
      const result = await registerStudent(name.trim(), password);
      if (result.ok) {
        onStart({ playerName: result.student.name });
      } else {
        setSuggestions(result.suggestions);
        setErrorMsg(`Ime "${name.trim()}" je že zasedeno!`);
        setStatus('error');
      }
    } catch {
      setErrorMsg('Napaka pri povezavi. Preveri internet in poskusi znova.');
      setStatus('error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const result = await loginStudent(name.trim(), password);
      if (result.ok) {
        const s = result.student;
        onStart({
          playerName: s.name,
          maxUnlockedPhase: s.max_unlocked_phase as Phase,
          currentPhase: s.current_phase as Phase,
          score: s.score,
          level: s.level,
          phaseWins: s.phase_wins as Partial<Record<Phase, number>>,
          speedrunHighscore: s.speedrun_highscore,
        });
      } else if (result.reason === 'not_found') {
        setErrorMsg(`Učenec z imenom "${name.trim()}" ne obstaja. Najprej se registriraj!`);
        setStatus('error');
      } else {
        setErrorMsg('Napačno geslo! Poskusi znova. 🔐');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Napaka pri povezavi. Preveri internet in poskusi znova.');
      setStatus('error');
    }
  };

  const isLoading = status === 'loading';

  // ---- Choose screen ----
  if (mode === 'choose') {
    return (
      <div className="start-screen-overlay">
        <div className="info-column start-modal" style={{ gap: '1.5rem', textAlign: 'center' }}>
          <h1 className="task-title" style={{ fontSize: '3.5rem' }}>Učenje Ure! 🕒</h1>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>
            Si že bil tukaj ali pa si nov?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <button className="submit-btn btn-success" onClick={() => reset('login')}>
              <span className="btn-content">🔑 Že imam račun — Prijavi me</span>
              <div className="btn-shadow"></div>
            </button>
            <button className="submit-btn btn-primary" onClick={() => reset('register')}>
              <span className="btn-content" style={{ color: 'white' }}>✨ Sem nov — Ustvari račun</span>
              <div className="btn-shadow"></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isRegister = mode === 'register';

  return (
    <div className="start-screen-overlay">
      <div className="info-column start-modal" style={{ gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => reset('choose')}
            style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >←</button>
          <h1 className="task-title" style={{ fontSize: '2.5rem', margin: 0 }}>
            {isRegister ? '✨ Nov račun' : '🔑 Prijava'}
          </h1>
        </div>

        {/* Error message */}
        {status === 'error' && (
          <div style={{ background: '#FFF3CD', border: '2px solid #FFC107', borderRadius: '16px', padding: '1rem 1.5rem', color: '#664D03', fontWeight: 700 }}>
            ⚠️ {errorMsg}
            {suggestions.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>💡 Prosta imena:</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {suggestions.map(s => (
                    <button key={s} type="button"
                      onClick={() => { setName(s); setErrorMsg(''); setSuggestions([]); setStatus('idle'); }}
                      style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: '100px', padding: '0.4rem 1rem', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.4rem', display: 'block' }}>
              👤 Tvoje ime
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); if (status === 'error') setStatus('idle'); }}
              placeholder="Npr. Luka"
              style={inputStyle}
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div>
            <label style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.4rem', display: 'block' }}>
              🔐 {isRegister ? 'Izberi geslo' : 'Geslo'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isRegister ? 'Npr. mačka ali 1234' : 'Tvoje geslo'}
              style={inputStyle}
              disabled={isLoading}
            />
            {isRegister && (
              <p style={{ fontSize: '0.9rem', color: 'gray', margin: '0.4rem 0 0 0.5rem', fontWeight: 600 }}>
                Zapomni si ga — brez gesla se ne boš mogel prijaviti!
              </p>
            )}
          </div>

          <div className="control-panel" style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={!name.trim() || !password.trim() || isLoading}
              className={`submit-btn ${isRegister ? 'btn-primary' : 'btn-success'}`}
            >
              <span className="btn-content" style={isRegister ? { color: 'white' } : {}}>
                {isLoading ? '⏳ Preverjam...' : isRegister ? '✨ Ustvari račun' : '🔑 Prijavi se'}
              </span>
              <div className="btn-shadow"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
