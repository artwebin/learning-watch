import React, { useState } from 'react';
import '../index.css';

interface Props {
  onStart: (name: string) => void;
}

export const StartScreen: React.FC<Props> = ({ onStart }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="start-screen-overlay">
      <div className="info-column start-modal">
        <h1 className="task-title" style={{ fontSize: '3.5rem' }}>Učenje Ure! 🕒</h1>
        <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)', margin: '1rem 0' }}>
          Vpiši svoje ime in začni z učenjem:
        </p>
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tvoje ime..."
            className="name-input"
            autoFocus
          />
          <div className="control-panel">
            <button 
              type="submit"
              disabled={!name.trim()}
              className="submit-btn btn-success"
            >
              <span className="btn-content">Začni se učiti</span>
              <div className="btn-shadow"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
