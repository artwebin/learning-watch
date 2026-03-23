import { useState, useEffect } from 'react';
import type { Phase } from '../engine/gameEngine';

export interface GameState {
  playerName: string;
  maxUnlockedPhase: Phase;
  currentPhase: Phase;
  score: number;
  level: number;
}

const defaultState: GameState = {
  playerName: '',
  maxUnlockedPhase: 1,
  currentPhase: 1,
  score: 0,
  level: 1
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
      
      // Progression logic
      if (nextMaxPhase === 1 && nextScore >= 5) { nextMaxPhase = 2; nextCurrentPhase = 2; }
      else if (nextMaxPhase === 2 && nextScore >= 10) { nextMaxPhase = 3; nextCurrentPhase = 3; }
      else if (nextMaxPhase === 3 && nextScore >= 15) { nextMaxPhase = 4; nextCurrentPhase = 4; }
      else if (nextMaxPhase === 4 && nextScore >= 20) { nextMaxPhase = 5; nextCurrentPhase = 5; }
      else if (nextMaxPhase === 5 && nextScore >= 25) { nextMaxPhase = 6; nextCurrentPhase = 6; }
      else if (nextMaxPhase === 6 && nextScore >= 30) { nextMaxPhase = 7; nextCurrentPhase = 7; }
      else if (nextMaxPhase === 7 && nextScore >= 35) { nextMaxPhase = 8; nextCurrentPhase = 8; }

      return {
        ...prev,
        score: nextScore,
        level: nextLevel,
        maxUnlockedPhase: nextMaxPhase,
        currentPhase: nextCurrentPhase
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
