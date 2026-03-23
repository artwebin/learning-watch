export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface GameState {
  currentPhase: Phase;
  score: number;
}

export const generateTimeForPhase = (phase: Phase): { hour: number; minute: number } => {
  let hour = Math.floor(Math.random() * 12) + 1;
  let minute = 0; // Initialize minute here

  let possibleMinutes = [0]; // Initialize for other cases

  switch (phase) {
    case 1:
      possibleMinutes = [0];
      break;
    case 2:
      possibleMinutes = [30];
      break;
    case 3:
      possibleMinutes = [15, 45]; // strict quarters
      break;
    case 4:
    case 6: // Digital
      // 5 minute intervals (0, 5, 10, ... 55)
      possibleMinutes = Array.from({ length: 12 }, (_, i) => i * 5);
      break;
    case 5:
      hour = Math.floor(Math.random() * 11) + 13; // Strict 24h format (13 - 23)
      minute = [0, 15, 30, 45, Math.floor(Math.random() * 60)][Math.floor(Math.random() * 5)];
      break;
  }

  if (phase === 6) {
    // Phase 6 reads the clock, let's include 24h randomly here too!
    if (Math.random() > 0.5 && hour !== 12) {
      hour += 12;
    }
  }

  // Fallback for Phase 7 just in case called, though we'll use generateStoryForPhase7
  if (phase === 7) return { hour: 12, minute: 0 };

  // If minute was not set in case 5, set it using possibleMinutes
  if (phase !== 5) {
    minute = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];
  }
  return { hour, minute };
};

export interface StoryTask {
  startTime: { hour: number; minute: number };
  targetTime: { hour: number; minute: number };
  storyText: string;
}

export const generateStoryForPhase7 = (): StoryTask => {
  const startHour = Math.floor(Math.random() * 10) + 7; // 7 AM to 16 PM start
  const startMinutes = [0, 15, 30, 45];
  const startMinute = startMinutes[Math.floor(Math.random() * startMinutes.length)];
  
  const durations = [15, 30, 45, 60];
  const duration = durations[Math.floor(Math.random() * durations.length)];
  
  let targetMinute = startMinute + duration;
  let targetHour = startHour + Math.floor(targetMinute / 60);
  targetMinute = targetMinute % 60;
  
  const startStr = `${startHour}:${startMinute.toString().padStart(2, '0')}`;
  
  const templates = [
    `Pouk se začne ob ${startStr} in traja ${duration} minut. Nastavi kazalce na konec pouka!`,
    `Zdaj je ${startStr}. Čez ${duration} minut greš na bajramsko veselico. Ob kateri uri moraš iti?`,
    `Na avtobus čakaš ob ${startStr}. Vožnja traja ${duration} minut. Ob kateri uri prispeš na cilj?`,
    `Tvoja najljubša risanka se začne ob ${startStr}. Če traja ${duration} minut, kdaj se risanka konča?`,
    `Test peke piškotov se začne ob ${startStr}. Pečica mora biti prižgana ${duration} minut. Kdaj poberemo piškote ven?`,
    `Zdravnik te čaka ob ${startStr}. Čakanje traja ${duration} minut. Kdaj te zdravnik pokliče?`,
    `Telovadba se začne ob ${startStr} in traja ${duration} minut. Ob kateri uri se konča?`,
    `Zdaj je ${startStr}. Čez ${duration} minut imaš uro plavanja. Kdaj moraš oditi?`,
    `Film se začne ob ${startStr} in traja ${duration} minut. Kdaj se konča?`,
    `Prijatelj te čaka ob ${startStr}. Skupaj se igrata ${duration} minut. Kdaj se poslovita?`
  ];
  
  const storyText = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    startTime: { hour: startHour, minute: startMinute },
    targetTime: { hour: targetHour > 24 ? targetHour - 24 : targetHour, minute: targetMinute },
    storyText
  };
};

export const generateMultipleChoiceOptions = (correctTime: { hour: number; minute: number }): { hour: number; minute: number }[] => {
  const options = [{ ...correctTime }];
  
  while (options.length < 4) {
    let wrongHour = correctTime.hour;
    let wrongMinute = correctTime.minute;
    
    const r = Math.random();
    if (r < 0.33) {
      wrongHour = (wrongHour % 24) + 1; // +1 hour 
    } else if (r < 0.66) {
      wrongHour = wrongHour - 1;
      if (wrongHour < 0) wrongHour = 23; // -1 hour
    } else {
      wrongMinute = (wrongMinute + 15) % 60; // shift minutes
    }
    
    if (!options.some(opt => opt.hour === wrongHour && opt.minute === wrongMinute)) {
      options.push({ hour: wrongHour, minute: wrongMinute });
    }
  }

  return options.sort(() => Math.random() - 0.5);
};

export const checkTimeMatch = (
  userTime: { hour: number; minute: number },
  targetTime: { hour: number; minute: number }
): boolean => {
  // We consider it a match if they are roughly the same
  // In a 12-hour clock, hour 12 is same as hour 0 for modulo math, but we use 1-12.
  const userH = userTime.hour % 12 === 0 ? 12 : userTime.hour % 12;
  const targetH = targetTime.hour % 12 === 0 ? 12 : targetTime.hour % 12;

  // We should allow small snap tolerances if necessary, but since our UI will snap the hands,
  // exact match is fine.
  return userH === targetH && userTime.minute === targetTime.minute;
};

// Formats time for display
export const formatTimeStr = (hour: number, minute: number): string => {
  const hDisplay = hour.toString();
  const mDisplay = minute.toString().padStart(2, '0');
  return `${hDisplay}:${mDisplay}`;
};
