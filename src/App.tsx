import { useState, useEffect } from 'react';
import { Clock } from './components/Clock';
import { StartScreen } from './components/StartScreen';
import { useGameState } from './hooks/useGameState';
import { generateTimeForPhase, checkTimeMatch, formatTimeStr, generateMultipleChoiceOptions, generateStoryForPhase7 } from './engine/gameEngine';
import type { Phase } from './engine/gameEngine';
import './index.css';

const App = () => {
  const { state, updateState, advanceScore, setPhase, logout } = useGameState();
  const { playerName, currentPhase: phase, maxUnlockedPhase, score, level } = state;

  const [targetTime, setTargetTime] = useState<{ hour: number; minute: number }>({ hour: 12, minute: 0 });
  const [userTime, setUserTime] = useState<{ hour: number; minute: number }>({ hour: 12, minute: 0 });
  const [activePhase, setActivePhase] = useState<Phase>(phase);
  
  // Level up modal tracking
  const [prevMaxPhase, setPrevMaxPhase] = useState<Phase>(maxUnlockedPhase);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [unlockedPhaseId, setUnlockedPhaseId] = useState<Phase | null>(null);

  useEffect(() => {
    if (maxUnlockedPhase > prevMaxPhase) {
      setUnlockedPhaseId(maxUnlockedPhase);
      setShowLevelUpModal(true);
      setPrevMaxPhase(maxUnlockedPhase);
    }
  }, [maxUnlockedPhase, prevMaxPhase]);
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'fail'>('idle');
  const [options, setOptions] = useState<{ hour: number; minute: number }[]>([]);
  const [storyText, setStoryText] = useState<string>('');

  // Phase instructional text
  const phaseTexts: Record<number, string> = {
    1: "Učimo se polne ure! 🕒",
    2: "Učimo se polovične ure! 🕧",
    3: "Učimo se četrinke! 🕓",
    4: "Učimo se minute! ⏱️",
    5: "Učimo se 24-urni format! 🌍",
    6: "Učimo se digitalne ure! 📱",
    7: "Besedilne naloge! 📖",
    8: "Splošno ponavljanje! 🎓"
  };

  useEffect(() => {
    let currentActive = phase;
    if (phase === 8) {
      currentActive = (Math.floor(Math.random() * 7) + 1) as Phase;
    }
    setActivePhase(currentActive);

    if (currentActive === 7) {
      const task = generateStoryForPhase7();
      setTargetTime(task.targetTime);
      setStoryText(task.storyText);
      setUserTime({ hour: 12, minute: 0 }); 
    } else {
      const t = generateTimeForPhase(currentActive);
      setTargetTime(t);
      if (currentActive === 6) {
        setOptions(generateMultipleChoiceOptions(t));
        setUserTime({ hour: 0, minute: 0 }); 
      } else {
        setUserTime({ hour: 12, minute: 0 }); 
      }
    }
  }, [phase, level]);

  const handleSubmit = () => {
    if (checkTimeMatch(userTime, targetTime)) {
      setFeedback('success');
      
      setTimeout(() => {
        setFeedback('idle');
        advanceScore(); // this triggers a level bump, which triggers useEffect
      }, 1500);
      
    } else {
      setFeedback('fail');
      setTimeout(() => {
        setFeedback('idle');
      }, 1500);
    }
  };

  const timeString = activePhase === 5 
    ? `${targetTime.hour.toString().padStart(2, '0')}:${targetTime.minute.toString().padStart(2, '0')}` // Force 24h
    : formatTimeStr(targetTime.hour, targetTime.minute); 
  
  const snapInterval = 5; 

  const isSubmitDisabled = feedback !== 'idle' || (activePhase === 6 && userTime.hour === 0);

  if (!playerName) {
    return <StartScreen onStart={(name) => updateState({ playerName: name })} />;
  }

  return (
    <div className="app-container">
      
      {/* Left Column: The Clock (Star of the app) */}
      <div className="clock-column">
        <div className={`clock-wrapper ${feedback === 'success' ? 'animate-pop' : feedback === 'fail' ? 'animate-shake' : ''}`}>
          <Clock 
            initialHour={activePhase === 6 ? targetTime.hour : userTime.hour} 
            initialMinute={activePhase === 6 ? targetTime.minute : userTime.minute} 
            interactive={activePhase !== 6 && feedback === 'idle'}
            onTimeChange={(val) => { if (activePhase !== 6) setUserTime(val); }}
            snapInterval={snapInterval}
          />

          {feedback === 'success' && (
            <div className="feedback-overlay">
              <span className="feedback-emoji bounce">✅</span>
            </div>
          )}
          {feedback === 'fail' && (
            <div className="feedback-overlay">
              <span className="feedback-emoji fade-out">❌</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Information and Controls */}
      <div className="info-column">
        
        <header className="game-header">
          <div className="badge score-badge" onClick={logout} title="Odjava">
            <span className="emoji">👤</span>
            <span className="badge-text">{playerName}</span>
            <span className="divider"></span>
            <span className="emoji">⭐</span>
            <span className="badge-text">{score}</span>
          </div>
          
          <div className="badge-group">
            <select 
              value={phase} 
              onChange={(e) => setPhase(Number(e.target.value) as Phase)}
              className="badge phase-dropdown"
            >
              {[1,2,3,4,5,6,7,8].map(p => (
                <option key={p} value={p} disabled={p > maxUnlockedPhase}>
                  Stopnja {p} {p > maxUnlockedPhase ? '🔒' : ''}
                </option>
              ))}
            </select>

            <div className="badge level-badge">
              NIVO {level}
            </div>
          </div>
        </header>

        <main className="game-main">
          <div className="instruction-card">
            <div className="phase-badge">
              {phase === 8 ? `Mešano: ${phaseTexts[activePhase]}` : phaseTexts[phase]}
            </div>
            
            <h1 className="task-title" style={{ fontSize: activePhase === 7 ? '1.8rem' : '2.5rem', lineHeight: '1.4' }}>
              {activePhase === 7 ? storyText :
               activePhase === 6 ? "Katera ura je to?" : (
                <>
                  Nastavi uro na:<br />
                  <div className="task-time">{timeString}</div>
                </>
              )}
            </h1>
            
            {activePhase === 6 && (
              <div className="options-grid">
                {options.map((opt, i) => {
                  const isSelected = userTime.hour === opt.hour && userTime.minute === opt.minute;
                  const optTimeString = `${opt.hour.toString().padStart(2, '0')}:${opt.minute.toString().padStart(2, '0')}`;
                  return (
                    <button 
                      key={i} 
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setUserTime(opt)}
                    >
                      {optTimeString}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <div className="control-panel">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`submit-btn ${feedback === 'success' ? 'btn-success' : feedback === 'fail' ? 'btn-fail' : ''}`}
          >
            <span className="btn-content">
              {feedback === 'idle' ? 'Preveri' : (feedback === 'success' ? 'Odlično!' : 'Poskusi znova')}
            </span>
            <div className="btn-shadow"></div>
          </button>

          {activePhase !== 6 && activePhase !== 7 && (
            <div className="legend">
              <span className="legend-hour">Rdeč = ure</span>
              <span className="legend-separator"></span>
              <span className="legend-minute">Zelen = minute</span>
            </div>
          )}
        </div>
        
      </div>

      {showLevelUpModal && unlockedPhaseId && (
        <div className="start-screen-overlay">
          <div className="info-column start-modal" style={{ alignItems: 'center', textAlign: 'center', gap: '2rem' }}>
            <h1 className="task-title" style={{ fontSize: '3rem', color: 'var(--text-dark)' }}>ČESTITKE! 🎉</h1>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              Odlično ti gre! Odklenil si novo stopnjo:<br/>
              <span style={{ color: 'var(--btn-success)', fontSize: '2rem', display: 'block', marginTop: '0.5rem' }}>Stopnja {unlockedPhaseId}</span>
            </p>
            <div className="control-panel">
              <button 
                onClick={() => setShowLevelUpModal(false)}
                className="submit-btn btn-success"
              >
                <span className="btn-content">Nadaljuj</span>
                <div className="btn-shadow"></div>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
