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
  
  // Level up & Hint modal tracking
  const [prevMaxPhase, setPrevMaxPhase] = useState<Phase>(maxUnlockedPhase);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [unlockedPhaseId, setUnlockedPhaseId] = useState<Phase | null>(null);
  
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintMode, setHintMode] = useState<'hint' | 'solution'>('hint');
  const [taskKey, setTaskKey] = useState(0);

  // Mobile blocker
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (maxUnlockedPhase > prevMaxPhase) {
      setUnlockedPhaseId(maxUnlockedPhase);
      setShowLevelUpModal(true);
      setPrevMaxPhase(maxUnlockedPhase);
    } else if (maxUnlockedPhase < prevMaxPhase) {
      // User logged out entirely or a lower state was loaded
      setPrevMaxPhase(maxUnlockedPhase);
    }
  }, [maxUnlockedPhase, prevMaxPhase, taskKey]);
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

  const phaseHints: Record<number, string> = {
    1: "Pri polnih urah je dolgi (zeleni) kazalec vedno na številki 12! Kratki (rdeči) kazalec pa vedno kaže točno na številko ure, ki jo iščemo.",
    2: "Pri polovičnih urah je dolgi (zeleni) kazalec vedno na številki 6, kar pomeni 30 minut. Kratki (rdeči) kazalec pa mora biti vedno na sredini med dvema urama!",
    3: "Četrtinke pomenijo 15 ali 45 minut. Če je 15 minut, je zeleni kazalec obrnjen na 3. Če je 45 minut, pa na 9!",
    4: "Minute šteješ s pomočjo zelenih črtic: vsaka številka pomeni 5 minut (1 = 5 min, 2 = 10 min...). Za vsako črtico vmes prištej še 1 minuto!",
    5: "24-urni format je preprost: Uram popoldne preprosto prištej 12! (Primer: 2 popoldne = 2 + 12 = 14:00, 5 popoldne = 5 + 12 = 17:00).",
    6: "Najprej poglej, kam točno kaže rdeči kazalec za uro. Nato poglej, na kateri številki je zeleni kazalec in to številko pomnoži s 5 za minute!",
    7: "Pri besedilni nalogi najprej poišči na kateri uri se dogodek zares začne. Nato na uri enostavno prištej še minute, ki zahtevajo da se dogodek konča.",
    8: "To je mešana faza, bodi zelo pozoren na navodila zgoraj! Včasih boš bral uro, včasih nastavljal kazalce ali reševal uganke."
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
      setConsecutiveFails(0); // Reset tracking on success
      
      setTimeout(() => {
        setFeedback('idle');
        advanceScore(); // this triggers a level bump, which triggers useEffect
      }, 1500);
      
    } else {
      setFeedback('fail');
      const newFails = consecutiveFails + 1;
      setConsecutiveFails(newFails);
      
      setTimeout(() => {
        setFeedback('idle');
        if (newFails === 2) {
          setHintMode('hint');
          setShowHintModal(true);
        } else if (newFails >= 3) {
          setHintMode('solution');
          setShowHintModal(true);
          setConsecutiveFails(0); // Reset tracking after showing solution
        }
      }, 1500);
    }
  };

  const timeString = activePhase === 5 
    ? `${targetTime.hour.toString().padStart(2, '0')}:${targetTime.minute.toString().padStart(2, '0')}` // Force 24h
    : formatTimeStr(targetTime.hour, targetTime.minute); 
  
  const snapInterval = 5; 

  const isSubmitDisabled = feedback !== 'idle' || (activePhase === 6 && userTime.hour === 0);

  if (isMobile) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="info-column start-modal" style={{ textAlign: 'center', padding: '3rem 2rem', border: '5px solid var(--primary-color)' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>🖥️</h1>
          <h2 className="task-title" style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>Naprava ni podprta</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-dark)', lineHeight: '1.6', fontWeight: 600 }}>
            Ta učna aplikacija je zasnovana posebej za večje zaslone (računalnike in tablice).<br/><br/>
            Prosimo, da za najboljšo izkušnjo odpreš stran na širši napravi!
          </p>
        </div>
      </div>
    );
  }

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

      {showHintModal && (
        <div className="start-screen-overlay">
          <div className="info-column start-modal" style={{ alignItems: 'center', textAlign: 'center', gap: '1.5rem', border: '5px solid var(--primary-color)' }}>
            <h1 className="task-title" style={{ fontSize: '2.5rem', color: 'var(--text-dark)' }}>
              {hintMode === 'solution' ? 'Joj, ni čisto prav! 🕒' : 'Potrebuješ pomoč? 💡'}
            </h1>
            
            {hintMode === 'solution' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
                <div style={{ 
                  background: 'var(--surface-solid)', 
                  color: 'var(--text-dark)', 
                  padding: '0.5rem 1.5rem', 
                  borderRadius: '100px', 
                  fontWeight: 800, 
                  fontSize: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  Pravilen odgovor: {activePhase === 5 ? `${targetTime.hour.toString().padStart(2, '0')}:${targetTime.minute.toString().padStart(2, '0')}` : formatTimeStr(targetTime.hour, targetTime.minute)}
                </div>
                
                <div style={{ width: '220px', height: '220px', pointerEvents: 'none', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}>
                  <Clock 
                    initialHour={targetTime.hour} 
                    initialMinute={targetTime.minute} 
                    interactive={false}
                    onTimeChange={() => {}}
                    snapInterval={5}
                  />
                </div>
              </div>
            )}

            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-dark)', lineHeight: '1.6' }}>
              {phaseHints[activePhase]}
            </p>
            <div className="control-panel">
              <button 
                onClick={() => {
                  setShowHintModal(false);
                  if (hintMode === 'solution') {
                    setTaskKey(k => k + 1); // Skip to new task
                  }
                }}
                className="submit-btn btn-primary"
              >
                <span className="btn-content" style={{ color: '#fff' }}>Razumem!</span>
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
