import { useState, useEffect } from 'react';
import type { Phase } from '../engine/gameEngine';

export interface GameState {
  playerName: string;
  maxUnlockedPhase: Phase;
  currentPhase: Phase;
  score: number;
  level: number;
  phaseWins: Partial<Record<Phase, number>>;
  speedrunHighscore: number;
}

const defaultState: GameState = {
  playerName: '',
  maxUnlockedPhase: 1,
  currentPhase: 1,
  score: 0,
  level: 1,
  phaseWins: {},
  speedrunHighscore: 0
};

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('watchGameProgression');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch(e) {}
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('watchGameProgression', JSON.stringify(state));
  }, [state]);

  const updateState = (updates: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const advanceScore = () => {
    setState(prev => {
      let nextScore = prev.score + 1;
      let nextLevel = prev.level + 1;
      let nextMaxPhase = prev.maxUnlockedPhase;
      let nextCurrentPhase = prev.currentPhase;
      
      const prevPhaseWins = prev.phaseWins || {};
      const activePhase = prev.currentPhase;
      const currentPhaseWinsCount = (prevPhaseWins[activePhase] || 0) + 1;
      const nextPhaseWins = { ...prevPhaseWins, [activePhase]: currentPhaseWinsCount };
      
      // Progression logic: strictly require 5 wins in the specific phase to unlock the next one
      if (nextMaxPhase === 1 && activePhase === 1 && (nextPhaseWins[1] || 0) >= 5) { nextMaxPhase = 2; nextCurrentPhase = 2; }
      else if (nextMaxPhase === 2 && activePhase === 2 && (nextPhaseWins[2] || 0) >= 5) { nextMaxPhase = 3; nextCurrentPhase = 3; }
      else if (nextMaxPhase === 3 && activePhase === 3 && (nextPhaseWins[3] || 0) >= 5) { nextMaxPhase = 4; nextCurrentPhase = 4; }
      else if (nextMaxPhase === 4 && activePhase === 4 && (nextPhaseWins[4] || 0) >= 5) { nextMaxPhase = 5; nextCurrentPhase = 5; }
      else if (nextMaxPhase === 5 && activePhase === 5 && (nextPhaseWins[5] || 0) >= 10) { nextMaxPhase = 6; nextCurrentPhase = 6; }
      else if (nextMaxPhase === 6 && activePhase === 6 && (nextPhaseWins[6] || 0) >= 5) { nextMaxPhase = 7; nextCurrentPhase = 7; }
      else if (nextMaxPhase === 7 && activePhase === 7 && (nextPhaseWins[7] || 0) >= 5) { nextMaxPhase = 8; nextCurrentPhase = 8; }
      else if (nextMaxPhase === 8 && activePhase === 8 && (nextPhaseWins[8] || 0) >= 5) { nextMaxPhase = 9; nextCurrentPhase = 9; }

      return {
        ...prev,
        score: nextScore,
        level: nextLevel,
        maxUnlockedPhase: nextMaxPhase,
        currentPhase: nextCurrentPhase,
        phaseWins: nextPhaseWins
      };
    });
  };

  const setPhase = (p: Phase) => {
    if (p <= state.maxUnlockedPhase) {
      setState(prev => ({ ...prev, currentPhase: p }));
    }
  };

  const logout = () => {
    setState(defaultState);
  };

  return { state, updateState, advanceScore, setPhase, logout };
}
